import { NextResponse } from "next/server";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { subject, messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 });
    }

    const subjectName = subject || "Bacalaureat";

    const systemPrompt = `Ești un profesor expert și prietenos pentru Bacalaureatul din România, specializat în ${subjectName}.

Rolul tău:
- Răspunzi clar, concis și pe înțelesul unui elev de liceu
- Folosești exemple concrete relevante pentru programa de BAC
- Explici pas cu pas când e vorba de exerciții sau rezolvări
- Folosești formatare cu paragrafe scurte și liste când e util
- Încurajezi elevul și păstrezi un ton pozitiv
- Răspunzi în limba română

Răspunde la întrebarea elevului ținând cont de materia ${subjectName}.`;

    // Map app messages to OpenRouter/OpenAI format
    const openRouterMessages = messages
      .filter((m: { text?: string }) => m.text && m.text.trim())
      .map((m: { isUser: boolean; text: string }) => ({
        role: m.isUser ? "user" : "assistant",
        content: m.text,
      }));

    // Ensure first message is from user
    while (openRouterMessages.length > 0 && openRouterMessages[0].role !== "user") {
      openRouterMessages.shift();
    }

    if (openRouterMessages.length === 0) {
      return NextResponse.json({ error: "No valid user message" }, { status: 400 });
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
          messages: [
            { role: "system", content: systemPrompt },
            ...openRouterMessages,
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

    const text = data.choices?.[0]?.message?.content || "Ne pare rău, nu am putut genera un răspuns.";

    return NextResponse.json({ reply: text });
  } catch (error) {
    console.error("Error in chat route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
