"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Copy, Check, Trash2, ThumbsUp, ThumbsDown, Sparkles, ChevronDown, Crown } from "lucide-react";
import type { Subject, Message } from "@/components/types";

interface ChatTabProps {
  subjects: Subject[];
  selectedSubject: Subject;
  setSelectedSubject: (s: Subject) => void;
  messages: Message[];
  newMessage: string;
  setNewMessage: (s: string) => void;
  sendMessage: () => void;
  isTyping: boolean;
  currentPlan?: string;
  dailyChatUsage?: number;
  onGoPremium?: () => void;
}

const QUICK_QUESTIONS: Record<string, string[]> = {
  "Matematică": ["Explica derivata", "Ce este o integrala?", "Teorema lui Pitagora", "Exercitiu limita"],
  "Română": ["Figuri de stil", "Mihai Eminescu", "Structura unui eseu", "Literatura interbelica"],
  "Istorie": ["Marea Unire 1918", "Primul Razboi Mondial", "Regimul comunist", "Evul Mediu Romanesc"],
  "Geografie": ["Ce este delta?", "Carpatii Romaniei", "Clima Romaniei", "Unitati de relief"],
  "Biologie": ["Sistemul digestiv", "Fotosinteza", "ADN-ul", "Ecosisteme"],
  "Fizică": ["Legile lui Newton", "Curentul electric", "Undele si sunetul", "Energia mecanica"],
  "Chimie": ["Tabelul periodic", "Legaturi chimice", "Reactii chimice", "PH-ul"],
  "Informatică": ["Structuri de date", "Algoritmi", "Programare C++", "Baze de date"],
  "Logică": ["Silogismul", "Operatii logice", "Erori de rationament", "Modus ponens"],
};

export default function ChatTab({
  subjects,
  selectedSubject,
  setSelectedSubject,
  messages,
  newMessage,
  setNewMessage,
  sendMessage,
  isTyping,
  currentPlan,
  dailyChatUsage = 0,
  onGoPremium,
}: ChatTabProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [showQuickQuestions, setShowQuickQuestions] = useState(true);
  const [feedbackGiven, setFeedbackGiven] = useState<Record<number, "up" | "down" | null>>({});
  const isFree = currentPlan === "free";
  const chatLimitReached = isFree && dailyChatUsage >= 10;
  const chatRemaining = isFree ? Math.max(0, 10 - dailyChatUsage) : null;

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  const handleCopy = (id: number, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleQuickQuestion = (q: string) => {
    setNewMessage(q);
    setTimeout(() => {
      setNewMessage("");
      // Trimitem direct intrebarea — trimite evenimentul corect
      const input = document.querySelector<HTMLInputElement>("#chat-input");
      if (input) {
        const inputEvent = new KeyboardEvent("keydown", { key: "Enter", bubbles: true });
        input.dispatchEvent(inputEvent);
      }
    }, 100);
  };

  const suggestedQuestions = QUICK_QUESTIONS[selectedSubject.name] || QUICK_QUESTIONS["Matematică"];

  return (
    <div className="flex flex-col h-full relative">
      {/* Chat Header */}
      <div className="flex items-center gap-3 mb-4 shrink-0">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: `${selectedSubject.color}20` }}>
          {selectedSubject.icon}
        </div>
        <div className="flex-1">
          <h2 className="font-bold text-foreground" style={{ fontFamily: "var(--font-syne)" }}>
            {selectedSubject.name}
          </h2>
          <div className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-xs text-muted-foreground">
              {isFree
                ? `${chatRemaining}/10 mesaje azi`
                : "Mesaje nelimitate"}
            </span>
          </div>
        </div>
        {/* Clear chat button */}
        {messages.length > 1 && (
          <button
            onClick={() => {
              if (confirm("Stergi toata conversatia?")) {
                // Redirectionam la chat cu un state fresh — folosim un query param care reseteaza
                window.location.href = "/?clearChat=1";
              }
            }}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-red-400 hover:bg-red-500/10 transition-colors"
            title="Sterge conversatia"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Subject Chips */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2 -mx-1 px-1 shrink-0">
        {subjects.map((subject) => (
          <button
            key={subject.name}
            onClick={() => setSelectedSubject(subject)}
            className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 transition-all ${
              selectedSubject.name === subject.name ? "ring-2 ring-primary" : "bg-card border border-border"
            }`}
            style={{
              backgroundColor: selectedSubject.name === subject.name ? `${subject.color}20` : undefined,
            }}
          >
            {subject.icon}
          </button>
        ))}
      </div>

      {/* Quick Questions (doar cand nu sunt mesaje sau la inceput) */}
      {showQuickQuestions && messages.length <= 2 && (
        <div className="mb-4 shrink-0">
          <button
            onClick={() => setShowQuickQuestions(false)}
            className="flex items-center gap-1 text-xs text-muted-foreground mb-2 hover:text-foreground transition-colors"
          >
            <Sparkles className="w-3 h-3" /> Intrebari rapide
            <ChevronDown className="w-3 h-3" />
          </button>
          <div className="flex flex-wrap gap-1.5">
            {suggestedQuestions.map((q) => (
              <button
                key={q}
                onClick={() => {
                  setNewMessage(q);
                  setShowQuickQuestions(false);
                }}
                className="text-xs bg-card border border-border px-3 py-1.5 rounded-full text-muted-foreground hover:border-primary hover:text-foreground transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-20">
        {messages.map((msg) => (
          <div key={msg.id} className="group">
            <div className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                  msg.isUser ? "bg-primary text-primary-foreground rounded-br-md" : "bg-card border border-border text-foreground rounded-bl-md"
                }`}
              >
                <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>
              </div>
            </div>
            {/* Message actions (hover) */}
            {!msg.isUser && (
              <div className="flex items-center gap-1 mt-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleCopy(msg.id, msg.text)}
                  className="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                  title="Copiaza"
                >
                  {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                <button
                  onClick={() => setFeedbackGiven((prev) => ({ ...prev, [msg.id]: prev[msg.id] === "up" ? null : "up" }))}
                  className={`p-1 rounded-md transition-colors ${
                    feedbackGiven[msg.id] === "up" ? "text-green-500" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  title="Util"
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setFeedbackGiven((prev) => ({ ...prev, [msg.id]: prev[msg.id] === "down" ? null : "down" }))}
                  className={`p-1 rounded-md transition-colors ${
                    feedbackGiven[msg.id] === "down" ? "text-red-500" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                  title="Neutil"
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {msg.isUser && (
              <div className="flex items-center gap-1 mt-1 mr-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => handleCopy(msg.id, msg.text)}
                  className="p-1 rounded-md text-primary-foreground/60 hover:text-primary-foreground transition-colors"
                  title="Copiaza"
                >
                  {copiedId === msg.id ? <Check className="w-3.5 h-3.5 text-green-300" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            )}
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-card border border-border rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 bg-muted-foreground rounded-full typing-dot" />
                <span className="w-2 h-2 bg-muted-foreground rounded-full typing-dot" />
                <span className="w-2 h-2 bg-muted-foreground rounded-full typing-dot" />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Bar */}
      <div className="absolute bottom-0 left-0 right-0 bg-background pt-2 pb-1">
        <div className="flex gap-2">
          {chatLimitReached ? (
            <button
              onClick={onGoPremium}
              className="flex-1 flex items-center justify-center gap-2 bg-primary/10 rounded-xl px-4 py-3 border border-primary/30 text-sm font-medium text-primary hover:bg-primary/20 transition-colors"
            >
              <Crown className="w-4 h-4" /> Upgrade la Premium pentru mesaje nelimitate
            </button>
          ) : (
            <input
              id="chat-input"
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              placeholder={`Intreaba despre ${selectedSubject.name}...`}
              className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
            />
          )}
          <button
            onClick={chatLimitReached ? onGoPremium : sendMessage}
            disabled={(!newMessage.trim() || isTyping) && !chatLimitReached}
            className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Send className="w-5 h-5 text-primary-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
