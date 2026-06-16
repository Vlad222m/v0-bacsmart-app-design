import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // Verify authentication
    const auth = await requireAuth(req);
    if (auth instanceof NextResponse) return auth;

    const { subject, messages } = await req.json();

    if (!messages || !Array.isArray(messages) || messages.length > 100) {
      return NextResponse.json({ error: "No messages provided or too many messages" }, { status: 400 });
    }
    // Validate and truncate message texts
    for (const msg of messages) {
      if (typeof msg.text !== "string") {
        return NextResponse.json({ error: "Invalid message format" }, { status: 400 });
      }
      msg.text = msg.text.slice(0, 4000); // Max 4000 chars per message
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

    // Ultimele 20 de mesaje se trimit integral
    // Mesajele mai vechi sunt rezumate compact (consuma foarte putini tokeni)
    const MAX_RECENT = 20;
    const allMessages = messages.filter((m: { text?: string }) => m.text && m.text.trim());
    const recentMessages = allMessages.slice(-MAX_RECENT);
    const olderMessages = allMessages.slice(0, -MAX_RECENT);

    // Rezumat compact al conversatiei vechi
    let summaryPrefix = "";
    if (olderMessages.length > 0) {
      const userParts = olderMessages
        .filter((m: { isUser: boolean }) => m.isUser)
        .map((m: { text: string }) => m.text);
      // Luam doar primele cuvinte din fiecare intrebare = rezumat ultra-compact
      const topicHints = userParts
        .map((t: string) => t.split(" ").slice(0, 6).join(" "))
        .slice(0, 5);
      summaryPrefix = `[Context anterior: elevul a intrebat despre: ${topicHints.join("; ")}. Păstrează coerența cu ce s-a discutat.]\n\n`;
    }

    const openRouterMessages = recentMessages.map((m: { isUser: boolean; text: string }) => ({
      role: m.isUser ? "user" : "assistant" as const,
      content: m.text,
    }));

    // Adaugam rezumatul la primul mesaj ca sa ofere context
    if (summaryPrefix && openRouterMessages.length > 0) {
      openRouterMessages[0] = {
        role: "user",
        content: summaryPrefix + openRouterMessages[0].content,
      };
    }

    // Asiguram ca primul mesaj e de la user
    while (openRouterMessages.length > 0 && openRouterMessages[0].role !== "user") {
      openRouterMessages.shift();
    }

    if (openRouterMessages.length === 0) {
      return NextResponse.json({ error: "No valid user message" }, { status: 400 });
    }

    // Modele OpenRouter ordonate dupa eficienta
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
      return NextResponse.json({ error: "AI service unavailable. Please try again later." }, { status: 500 });
    }

    const text = data.choices?.[0]?.message?.content || "Ne pare rău, nu am putut genera un răspuns.";

    return NextResponse.json({ reply: text });
  } catch (error) {
    console.error("Error in chat route:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
