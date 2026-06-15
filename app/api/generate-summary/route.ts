import { NextResponse } from "next/server";

export const maxDuration = 60;
const MAX_TEXT_INPUT = 24000; // Limita de text trimis la API

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

  if (name.endsWith(".doc") || type === "application/msword") {
    let extractedText = "";
    try {
      const xmlString = buffer.toString("utf-8");
      const matches = xmlString.match(/<w:t[^>]*>([^<]+)<\/w:t>/g) || [];
      extractedText = matches.map((m) => m.replace(/<[^>]+>/g, "")).join(" ").trim();
    } catch {
      extractedText = "";
    }
    return extractedText.length > 50
      ? extractedText.slice(0, MAX_TEXT_INPUT)
      : `[Document Word: "${file.name}"]`;
  }

  if (type.startsWith("image/")) {
    try {
      const { recognize } = await import("tesseract.js");
      const { data } = await recognize(buffer, "ron+eng", {
        logger: () => {},
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
    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const extractedText = await extractText(file);

    const instruction = `Ești un profesor expert pentru Bacalaureatul din România. Analizează acest material educațional și creează un rezumat de studiu complet.
Răspunde DOAR cu JSON valid, fără text în afară, fără markdown, fără backticks:
{
  "summary": "un rezumat clar și bine structurat al materialului în 2-3 paragrafe, în limba română",
  "keyPoints": ["punct cheie 1", "punct cheie 2", "punct cheie 3", "punct cheie 4", "punct cheie 5", "punct cheie 6"],
  "questions": ["intrebare 1", "intrebare 2", "intrebare 3"]
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
              content: `${instruction}\n\nConținutul materialului:\n${extractedText}`,
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
      return NextResponse.json({ error: `AI API error: ${lastError.slice(0, 200)}` }, { status: 500 });
    }

    const text = data.choices?.[0]?.message?.content || "";

    let parsed;
    try {
      let clean = text;
      clean = clean.replace(/```json[\r\n]*/g, "").replace(/```[\r\n]*/g, "").trim();
      clean = clean.replace(/„/g, '"').replace(/”/g, '"').replace(/“/g, '"');
      if (!clean.endsWith("}")) {
        const lastBrace = clean.lastIndexOf("}");
        if (lastBrace > 0) {
          clean = clean.substring(0, lastBrace + 1);
        }
      }
      clean = clean.replace(/,\s*"questions"\s*:\s*\[[^\]]*$/g, ',"questions":[]');
      parsed = JSON.parse(clean);
    } catch (e) {
      console.error("JSON parse error:", e, "Raw text:", text.substring(0, 500));
      const summaryMatch = text.match(/"summary"\s*:\s*"([^"]+)/);
      parsed = {
        summary: summaryMatch?.[1] || "Rezumat indisponibil",
        keyPoints: ["Punct 1", "Punct 2", "Punct 3"],
        questions: ["Întrebare 1", "Întrebare 2", "Întrebare 3"],
      };
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
