"use client";

import { useState, useRef, useEffect } from "react";
import { Send } from "lucide-react";
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
}

export default function ChatTab({
  subjects,
  selectedSubject,
  setSelectedSubject,
  messages,
  newMessage,
  setNewMessage,
  sendMessage,
  isTyping,
}: ChatTabProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

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
            <span className="text-xs text-muted-foreground">Online - Mesaje nelimitate</span>
          </div>
        </div>
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

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-3 pb-20">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.isUser ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.isUser ? "bg-primary text-primary-foreground rounded-br-md" : "bg-card border border-border text-foreground rounded-bl-md"
              }`}
            >
              <p className="text-sm leading-relaxed">{msg.text}</p>
            </div>
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
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            placeholder="Scrie un mesaj..."
            className="flex-1 bg-card border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            <Send className="w-5 h-5 text-primary-foreground" />
          </button>
        </div>
      </div>
    </div>
  );
}
