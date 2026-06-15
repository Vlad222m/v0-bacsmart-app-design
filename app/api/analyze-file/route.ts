import { NextResponse } from "next/server";

const MAX_TEXT_INPUT = 30000; // Limita de text trimis la API

async function extractText(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const name = file.name.toLowerCase();
  const type = file.type;

  if (type === "text/plain" || name.endsWith(".txt")) {
    return buffer.toString("utf-8").slice(0, MAX_TEXT_INPUT);
  }

  if (type === "application/pdf" || name.endsWith(".pdf")) {
    try {
      const pdfParse = (await import("pdf-parse")).default;
      const data = await pdfParse(buffer);
      return data.text.slice(0, MAX_TEXT_INPUT);
    } catch {
      return `[Document PDF: "${file.name}"]`;
    }
  }

  if (
    name.endsWith(".docx") ||
    type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    try {
      const mammoth = await import("mammoth");
      const result = await mammoth.extractRawText({ buffer });
      return result.value.slice(0, MAX_TEXT_INPUT);
    } catch {
      return `[Document Word: "${file.name}"]`;
    }
  }

  if (type.startsWith("image/")) {
    try {
      const { recognize } = await import("tesseract.js");
      const { data } = await recognize(buffer, "ron+eng", {
        logger: () => {}, // Ascundem logurile
      });
      const text = data.text.trim();
      if (text.length > 20) {
        return `[Text extras din imaginea "${file.name}" prin OCR]:\n${text.slice(0, MAX_TEXT_INPUT)}`;
      }
    } catch {
      // OCR a eșuat, fallback la nume fișier
    }
    return `[Imagine: "${file.name}"]`;
  }

  return `[Fișier: "${file.name}" de tip ${type || "necunoscut"}]`;
}

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

    // Extragem textul LOCAL - zero tokeni consumați inutil
    const extractedText = await extractText(file);

    const systemPrompt = `Ești un profesor expert pentru Bacalaureatul din România. Analizează cu atenție materialul furnizat și generează exact ${numQuestions} întrebări grilă bazate STRICT pe conținutul real al materialului. Întrebările trebuie să verifice înțelegerea informațiilor din material.

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

    // Cele mai eficiente modele ca pret/performanta
    const MODELS = [
      "google/gemini-2.5-flash-lite",
      "google/gemini-2.5-flash",
      "openai/gpt-4o-mini",
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
          max_tokens: 4000,
          messages: [
            {
              role: "user",
              content: `${systemPrompt}\n\nIată conținutul materialului:\n\n${extractedText}`,
            },
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
      let cleanJson = clean;
      const lastCloseBrace = cleanJson.lastIndexOf("}");
      if (lastCloseBrace > 0) {
        const lastArrayClose = cleanJson.lastIndexOf("]");
        if (lastArrayClose < 0 || lastArrayClose < lastCloseBrace) {
          cleanJson = cleanJson.substring(0, lastCloseBrace + 1) + "]";
        }
        const questionsStart = cleanJson.indexOf('"questions"');
        if (questionsStart >= 0) {
          cleanJson = cleanJson.substring(questionsStart - 1);
          cleanJson = "{" + cleanJson;
          if (!cleanJson.endsWith("}")) {
            cleanJson = cleanJson.substring(0, cleanJson.lastIndexOf("}") + 1);
          }
        }
      }
      const parsed = JSON.parse(cleanJson);
      questions = parsed.questions;
    } catch (e) {
      console.error("JSON parse error:", e, "Raw text:", text.substring(0, 500));
      try {
        const matches = text.match(/\{\s*"question"\s*:\s*"([^"]*)"[^}]*\}/g);
        if (matches && matches.length > 0) {
          questions = matches.map((q: string) => {
            const qMatch = q.match(/"question"\s*:\s*"([^"]*)"/);
            const aMatch = q.match(/"A"\s*:\s*"([^"]*)"/);
            const bMatch = q.match(/"B"\s*:\s*"([^"]*)"/);
            const cMatch = q.match(/"C"\s*:\s*"([^"]*)"/);
            const dMatch = q.match(/"D"\s*:\s*"([^"]*)"/);
            const correctMatch = q.match(/"correct"\s*:\s*"([^"]*)"/);
            const expMatch = q.match(/"explanation"\s*:\s*"([^"]*)"/);
            if (!qMatch) return null;
            return {
              question: qMatch[1],
              options: { A: aMatch?.[1] || "", B: bMatch?.[1] || "", C: cMatch?.[1] || "", D: dMatch?.[1] || "" },
              correct: correctMatch?.[1] || "A",
              explanation: expMatch?.[1] || "",
            };
          }).filter(Boolean);
        }
        if (!questions || questions.length === 0) throw e;
      } catch {
        return NextResponse.json(
          { error: "AI response could not be parsed" },
          { status: 500 }
        );
      }
    }

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
