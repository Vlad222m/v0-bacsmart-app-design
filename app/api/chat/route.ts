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

    // System prompt mai scurt — acelasi efect, mai putini tokeni de baza
    const systemPrompt = `Profesor BAC, specializat ${subjectName}. Răspunsuri clare, concise, în română, cu exemple pe înțelesul unui elev. Fără introduceri și concluzii lungi, direct la subiect.`;

    // Mesaje mai vechi: doar ultimele 6 cuvinte din intrebarile user, maxim 3 intrebari vechi
    const MAX_RECENT = 10; // din 20 → 10 — de ajuns pentru coerenta
    const MAX_OLDER_CONTEXT = 3; // maxim 3 intrebari vechi rezumate
    const allMessages = messages.filter((m: { text?: string }) => m.text && m.text.trim());
    const recentMessages = allMessages.slice(-MAX_RECENT);
    const olderMessages = allMessages.slice(0, -MAX_RECENT);

    // Rezumat ultra-compact al conversatiei vechi
    let summaryPrefix = "";
    if (olderMessages.length > 0) {
      const userParts = olderMessages
        .filter((m: { isUser: boolean }) => m.isUser)
        .map((m: { text: string }) => m.text);
      const topicHints = userParts
        .map((t: string) => t.split(" ").slice(0, 4).join(" ")) // 6 → 4 cuvinte
        .slice(0, MAX_OLDER_CONTEXT);
      summaryPrefix = `[Context anterior: ${topicHints.join("; ")}]\n\n`;
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

    // Model principal: gemini-2.5-flash-lite (cel mai ieftin, suficient pentru conversatii)
    // Fallback direct pe gpt-4o-mini fara gemini-2.5-flash (acelasi pret, similar)
    const MODELS = [
      "google/gemini-2.5-flash-lite",
      "openai/gpt-4o-mini",
    ];

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
        const err = await res.text();
        console.error(`OpenRouter model ${model} failed:`, err);
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
