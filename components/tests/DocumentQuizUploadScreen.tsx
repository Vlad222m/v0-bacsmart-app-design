"use client";

import { useState, useRef } from "react";
import { ArrowLeft, Upload, Loader, Clock, FileText } from "lucide-react";

const SUPPORTED_FORMATS = [
  { ext: "JPG/PNG/WebP", note: "Text extras prin OCR (max 30.000 caractere)" },
  { ext: "PDF", note: "Text extras din document" },
  { ext: "DOC/DOCX", note: "Text extras din document" },
  { ext: "TXT", note: "Text direct" },
];

interface DocumentQuizUploadScreenProps {
  onBack: () => void;
  onFileSelected: (file: File) => void;
  isGenerating: boolean;
  difficulty: "easy" | "medium" | "hard";
  setDifficulty: (d: "easy" | "medium" | "hard") => void;
  onSavedQuizzes?: () => void;
  savedQuizCount?: number;
}

export default function DocumentQuizUploadScreen({
  onBack,
  onFileSelected,
  isGenerating,
  difficulty,
  setDifficulty,
  onSavedQuizzes,
  savedQuizCount = 0,
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
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <button onClick={onBack} className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Inapoi</span>
        </button>
          {onSavedQuizzes && savedQuizCount > 0 && (
            <button onClick={onSavedQuizzes} className="flex items-center gap-1.5 text-xs bg-card border border-border px-3 py-1.5 rounded-full text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all">
              <Clock className="w-3.5 h-3.5" />
              <span>Istoric ({savedQuizCount})</span>
            </button>
          )}
        </div>

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
                    ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                    : "bg-card border border-border text-muted-foreground hover:border-primary"
                }`}
              >
                {level === "easy" ? "Ușor" : level === "medium" ? "Mediu" : "Dificil"}
              </button>
            ))}
          </div>
        </div>

        {/* Format info badges */}
        <div className="mb-4">
          <p className="text-xs text-muted-foreground mb-2">Formate acceptate:</p>
          <div className="flex flex-wrap gap-1.5">
            {SUPPORTED_FORMATS.map((f) => (
              <span key={f.ext} className="text-[10px] bg-card border border-border px-2 py-0.5 rounded-full text-muted-foreground" title={f.note}>
                {f.ext}
              </span>
            ))}
          </div>
          <p className="text-[10px] text-muted-foreground/60 mt-1">Limita: 10MB / ~30.000 caractere extrase</p>
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
                dragActive ? "border-primary bg-primary/10 scale-[1.02]" : "border-border bg-card hover:border-primary/50"
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
            <div className="relative mb-6">
              <Loader className="w-16 h-16 text-primary animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <FileText className="w-6 h-6 text-primary/60" />
              </div>
            </div>
            <p className="text-foreground font-medium mb-2">Se analizeaza documentul...</p>
            <div className="w-48 h-1.5 bg-muted rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full animate-progress" />
            </div>
            <p className="text-muted-foreground text-sm mt-3">Se extrag textul si se genereaza intrebarile</p>
          </div>
        )}
      </div>
    );
  }
