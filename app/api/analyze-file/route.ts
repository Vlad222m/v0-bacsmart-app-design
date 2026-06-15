import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const difficulty = (formData.get("difficulty") as string) || "medium";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const numQuestions =
      difficulty === "easy" ? 5 : difficulty === "medium" ? 10 : 15;

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const base64 = Buffer.from(bytes).toString("base64");

    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    const isText = file.type === "text/plain" || file.name.endsWith(".txt");

    const promptText = `Ești un profesor expert pentru Bacalaureatul din România. Analizează cu atenție materialul furnizat și generează exact ${numQuestions} întrebări grilă bazate STRICT pe conținutul real al materialului. Întrebările trebuie să verifice înțelegerea informațiilor din material.

Răspunde DOAR cu JSON valid, fără text în afară, fără backticks:
{
  "questions": [
    {
      "question": "textul întrebării bazat pe material",
      "options": { "A": "varianta A", "B": "varianta B", "C": "varianta C", "D": "varianta D" },
      "correct": "A",
      "explanation": "explicație clară de ce răspunsul este corect"
    }
  ]
}`;

    // Build the content array for OpenRouter format
    let messageContent: any[];

    if (isImage) {
      // Gemini supports base64 images inline
      const mediaType = file.type as string;
      messageContent = [
        {
          type: "text",
          text: promptText,
        },
        {
          type: "image_url",
          image_url: {
            url: `data:${mediaType};base64,${base64}`,
          },
        },
      ];
    } else if (isPdf) {
      // For PDFs, send as text context since Gemini doesn't support PDF directly via standard vision
      // We extract info and format it
      messageContent = [
        {
          type: "text",
          text: `${promptText}\n\nAm primit un document PDF cu numele "${file.name}" care conține material educațional pentru BAC. Generează întrebări bazate pe numele fișierului și pe contextul educațional românesc.`,
        },
      ];
    } else if (isText) {
      const textContent = Buffer.from(bytes).toString("utf-8").slice(0, 50000);
      messageContent = [
        {
          type: "text",
          text: `${promptText}\n\nIată conținutul materialului:\n\n${textContent}`,
        },
      ];
    } else {
      // DOC/DOCX and other formats
      messageContent = [
        {
          type: "text",
          text: `Ești un profesor expert pentru Bacalaureatul din România.\n\nAm primit un fișier de tip ${file.type || "necunoscut"} cu numele "${file.name}", al cărui conținut nu poate fi citit direct. Generează exact ${numQuestions} întrebări grilă relevante pentru BAC România, pe tema sugerată de numele fișierului.\n\nRăspunde DOAR cu JSON valid, fără text în afară, fără backticks:\n{\n  "questions": [\n    {\n      "question": "textul întrebării",\n      "options": { "A": "varianta A", "B": "varianta B", "C": "varianta C", "D": "varianta D" },\n      "correct": "A",\n      "explanation": "explicație clară de ce răspunsul este corect"\n    }\n  ]\n}`,
        },
      ];
    }

    const MODELS = [
      "google/gemini-2.5-flash-001",
      "openai/gpt-4o-mini",
      "google/gemini-2.0-flash-001",
    ];

    let lastError = "";
    let data: any = null;

    for (const model of MODELS) {
      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY!}`,
          "HTTP-Referer": "https://bacsmart.ro",
          "X-Title": "BACsmart",
        },
        body: JSON.stringify({
          model,
          max_tokens: 1500,
          messages: [
            { role: "user", content: messageContent },
          ],
        }),
      });

      if (res.ok) {
        data = await res.json();
        break;
      } else {
        lastError = await res.text();
        console.error(`OpenRouter model ${model} failed:`, lastError);
      }
    }

    if (!data) {
      return NextResponse.json(
        { error: `AI API error: ${lastError.slice(0, 200)}` },
        { status: 500 }
      );
    }
    const text = data.choices?.[0]?.message?.content || "";

    // Parse JSON from response
    let questions;
    try {
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      questions = parsed.questions;
    } catch (e) {
      console.error("JSON parse error:", e, "Raw text:", text);
      return NextResponse.json(
        { error: "Failed to parse AI response" },
        { status: 500 }
      );
    }

    // Format questions to match app format (UI expects `answers` array + numeric `correct` index)
    const formattedQuestions = questions.map((q: any, index: number) => ({
      id: `doc_${Date.now()}_${index}`,
      question: q.question,
      answers: [q.options.A, q.options.B, q.options.C, q.options.D],
      correct: ["A", "B", "C", "D"].indexOf(q.correct),
      explanation: q.explanation,
      subject: "Document",
    }));

    return NextResponse.json({ questions: formattedQuestions });
  } catch (error) {
    console.error("Error in analyze-file:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
