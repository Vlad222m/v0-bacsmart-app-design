"use client";

import { useState, useRef } from "react";
import { ArrowLeft, Upload, Loader } from "lucide-react";

interface DocumentQuizUploadScreenProps {
  onBack: () => void;
  onFileSelected: (file: File) => void;
  isGenerating: boolean;
  difficulty: "easy" | "medium" | "hard";
  setDifficulty: (d: "easy" | "medium" | "hard") => void;
}

export default function DocumentQuizUploadScreen({
  onBack,
  onFileSelected,
  isGenerating,
  difficulty,
  setDifficulty,
}: DocumentQuizUploadScreenProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragActive, setDragActive] = useState(false);

  const handleFile = (file: File) => {
    const validTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf", "text/plain"];
    const isDoc = file.name.endsWith(".doc") || file.name.endsWith(".docx");
    if (!validTypes.includes(file.type) && !isDoc) {
      alert("Format neacceptat. Foloseste: JPG, PNG, PDF, TXT, DOC");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("Fisier prea mare. Maxim 10MB.");
      return;
    }
    onFileSelected(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
  };

  return (
    <div className="fixed inset-0 bg-[#08080D] z-[150] animate-in slide-in-from-right duration-300">
      <div className="h-full flex flex-col p-4 max-w-md mx-auto">
        <button onClick={onBack} className="flex items-center gap-2 text-foreground mb-6 hover:text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Inapoi</span>
        </button>

        <h1 className="text-2xl font-bold text-foreground mb-2" style={{ fontFamily: "var(--font-syne)" }}>
          Quiz din document
        </h1>
        <p className="text-muted-foreground text-sm mb-6">Incarca o fotografie sau document. Vom genera intrebari automat.</p>

        {/* Difficulty Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-foreground mb-3">Nivel dificultate</label>
          <div className="grid grid-cols-3 gap-2">
            {(["easy", "medium", "hard"] as const).map((level) => (
              <button
                key={level}
                onClick={() => setDifficulty(level)}
                disabled={isGenerating}
                className={`py-2.5 rounded-lg font-medium text-sm transition-all ${
                  difficulty === level
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-muted-foreground hover:border-primary"
                }`}
              >
                {level === "easy" ? "Ușor" : level === "medium" ? "Mediu" : "Dificil"}
              </button>
            ))}
          </div>
        </div>

        {!isGenerating && (
          <>
            <div
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`flex-1 rounded-2xl border-2 border-dashed flex items-center justify-center cursor-pointer transition-colors mb-4 ${
                dragActive ? "border-primary bg-primary/10" : "border-border bg-card hover:border-primary/50"
              }`}
            >
              <div className="text-center">
                <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
                <p className="text-foreground font-medium">Drag & drop sau click</p>
                <p className="text-muted-foreground text-sm">JPG, PNG, PDF, TXT, DOC</p>
              </div>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.txt,.doc,.docx"
              onChange={(e) => e.target.files && handleFile(e.target.files[0])}
              className="hidden"
            />
          </>
        )}

        {isGenerating && (
          <div className="flex-1 flex flex-col items-center justify-center">
            <Loader className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-foreground font-medium">Se genereaza quiz-ul...</p>
            <p className="text-muted-foreground text-sm">Va dura cateva secunde</p>
          </div>
        )}
      </div>
    </div>
  );
}
