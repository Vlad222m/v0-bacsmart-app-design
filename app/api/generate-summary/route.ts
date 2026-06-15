import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const isImage = file.type.startsWith("image/");
    const isPdf = file.type === "application/pdf";
    const isDocx = file.name.endsWith(".docx") || file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const isDoc = file.name.endsWith(".doc") || file.type === "application/msword";
    const isTxt = file.type === "text/plain" || file.name.endsWith(".txt");

    const instruction = `Ești un profesor expert pentru Bacalaureatul din România. Analizează acest material educațional și creează un rezumat de studiu complet.
Răspunde DOAR cu JSON valid, fără text în afară, fără markdown, fără backticks:
{
  "summary": "un rezumat clar și bine structurat al materialului în 2-3 paragrafe, în limba română",
  "keyPoints": ["punct cheie 1", "punct cheie 2", "punct cheie 3", "punct cheie 4", "punct cheie 5", "punct cheie 6"],
  "questions": ["intrebare 1", "intrebare 2", "intrebare 3"]
}`;

    let messageContent: any[];

    if (isImage) {
      const base64 = buffer.toString("base64");
      const mediaType = file.type;
      messageContent = [
        { type: "text", text: instruction },
        {
          type: "image_url",
          image_url: {
            url: `data:${mediaType};base64,${base64}`,
          },
        },
      ];
    } else if (isPdf) {
      // For PDFs, use the text-based approach since Gemini doesn't support PDF via standard vision
      messageContent = [
        {
          type: "text",
          text: `${instruction}\n\nAm primit un document PDF cu numele "${file.name}". Creează un rezumat despre subiectul educațional sugerat de numele fișierului, relevant pentru BAC.`,
        },
      ];
    } else if (isDocx || isDoc) {
      let extractedText = "";
      try {
        const xmlString = buffer.toString("utf-8");
        const matches = xmlString.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || [];
        extractedText = matches.map(m => m.replace(/<[^>]+>/g, "")).join(" ").trim();
      } catch (e) {
        extractedText = "";
      }
      messageContent = [
        {
          type: "text",
          text: extractedText.length > 100
            ? `${instruction}\n\nConținutul documentului:\n${extractedText.slice(0, 8000)}`
            : `${instruction}\n\nAm primit un document Word cu numele "${file.name}". Generează un rezumat despre subiectul indicat de numele fișierului.`,
        },
      ];
    } else if (isTxt) {
      const textContent = buffer.toString("utf-8");
      messageContent = [
        {
          type: "text",
          text: `${instruction}\n\nConținutul documentului:\n${textContent.slice(0, 8000)}`,
        },
      ];
    } else {
      // Fallback
      messageContent = [
        {
          type: "text",
          text: `${instruction}\n\nAm primit un fișier cu numele "${file.name}". Creează un rezumat general despre subiectul indicat de numele fișierului.`,
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
          max_tokens: 1000,
          messages: [{ role: "user", content: messageContent }],
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
      return NextResponse.json({ error: `AI API error: ${lastError.slice(0, 200)}` }, { status: 500 });
    }
    const text = data.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      let clean = text;
      clean = clean.replace(/```json[\r\n]*/g, "").replace(/```[\r\n]*/g, "").trim();
      clean = clean.replace(/„/g, '"').replace(/”/g, '"').replace(/“/g, '"');
      parsed = JSON.parse(clean);
    } catch (e) {
      console.error("JSON parse error:", e, "Raw text:", text);
      return NextResponse.json({ error: "Failed to parse AI response" }, { status: 500 });
    }

    return NextResponse.json({
      fileName: file.name,
      summary: parsed.summary || "",
      keyPoints: parsed.keyPoints || [],
      questions: parsed.questions || [],
    });
  } catch (error) {
    console.error("Error in generate-summary:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
