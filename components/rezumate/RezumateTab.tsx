"use client";

import { useState, useRef } from "react";
import { Camera, Upload, X, Zap, Check, Save, RefreshCw, FileText, Trash2, ChevronDown } from "lucide-react";
import type { GeneratedSummaryData } from "@/components/types";

interface RezumateTabProps {
  uploadedFile: File | null;
  setUploadedFile: (file: File | null) => void;
  isGenerating: boolean;
  onGenerate: () => void;
  generatedSummary: GeneratedSummaryData | null;
  setGeneratedSummary: (summary: GeneratedSummaryData | null) => void;
  savedSummaries: { id: number; title: string; subject: string; date: string; summary: string; keyPoints: string[]; questions: string[] }[];
  onSaveSummary: () => void;
  onDeleteSummary: (id: number) => void;
  showToastMessage: (msg: string) => void;
}

export default function RezumateTab({
  uploadedFile,
  setUploadedFile,
  isGenerating,
  onGenerate,
  generatedSummary,
  setGeneratedSummary,
  savedSummaries,
  onSaveSummary,
  onDeleteSummary,
  showToastMessage,
}: RezumateTabProps) {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [expandedSummaryId, setExpandedSummaryId] = useState<number | null>(null);

  const MAX_FILE_SIZE = 10 * 1024 * 1024;
  const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
  const ALLOWED_DOC_EXTENSIONS = [".pdf", ".doc", ".docx", ".txt"];

  const validateFile = (file: File, isImage: boolean): boolean => {
    if (file.size > MAX_FILE_SIZE) {
      showToastMessage("Fisier prea mare. Maxim 10MB.");
      return false;
    }
    if (isImage) {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        showToastMessage("Format neacceptat. Foloseste JPG, PNG sau WebP.");
        return false;
      }
    } else {
      const ext = "." + file.name.split(".").pop()?.toLowerCase();
      if (!ALLOWED_DOC_EXTENSIONS.includes(ext)) {
        showToastMessage("Format neacceptat. Foloseste PDF, DOC sau TXT.");
        return false;
      }
    }
    return true;
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!validateFile(file, true)) { e.target.value = ""; return; }
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);
    setUploadedFile(file);
  };

  const handleDocUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    const file = files[0];
    if (!validateFile(file, false)) { e.target.value = ""; return; }
    setImagePreview(null);
    setUploadedFile(file);
  };

  const clearFile = () => {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    setUploadedFile(null);
    setImagePreview(null);
    if (imageInputRef.current) imageInputRef.current.value = "";
    if (docInputRef.current) docInputRef.current.value = "";
  };

  const handleNewSummary = () => {
    setGeneratedSummary(null);
    clearFile();
  };

  const getFileIcon = (fileName: string) => {
    if (!fileName) return <FileText className="w-6 h-6 text-blue-400" />;
    const ext = fileName.split(".").pop()?.toLowerCase() || "";
    if (["jpg", "jpeg", "png", "webp"].includes(ext)) return <Camera className="w-6 h-6 text-primary" />;
    if (ext === "pdf") return <FileText className="w-6 h-6 text-red-400" />;
    if (["doc", "docx"].includes(ext)) return <FileText className="w-6 h-6 text-blue-400" />;
    return <FileText className="w-6 h-6 text-muted-foreground" />;
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  return (
    <div className="space-y-5 pt-2">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-syne)" }}>
          Rezumate AI
        </h1>
        <p className="text-sm text-muted-foreground">Incarca o poza sau document pentru rezumat</p>
      </div>

      {!generatedSummary && (
        <>
          {/* Upload Buttons */}
          <div className="grid grid-cols-2 gap-3">
            <button onClick={() => imageInputRef.current?.click()} className="bg-card rounded-xl p-4 border border-border hover:border-primary/50 transition-colors flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                <Camera className="w-6 h-6 text-primary" />
              </div>
              <span className="text-sm font-medium text-foreground">Fotografiaza</span>
              <span className="text-xs text-muted-foreground">JPG, PNG, WebP</span>
            </button>
            <button onClick={() => docInputRef.current?.click()} className="bg-card rounded-xl p-4 border border-border hover:border-secondary/50 transition-colors flex flex-col items-center gap-2">
              <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                <Upload className="w-6 h-6 text-secondary" />
              </div>
              <span className="text-sm font-medium text-foreground">Incarca document</span>
              <span className="text-xs text-muted-foreground">PDF, DOC, TXT</span>
            </button>
          </div>

          <input ref={imageInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
          <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain" onChange={handleDocUpload} className="hidden" />

          {/* Uploaded File Preview */}
          {uploadedFile && !isGenerating && (
            <div className="bg-card rounded-xl p-4 border border-border">
              <div className="flex items-start gap-3">
                {imagePreview ? (
                  <div className="w-16 h-16 rounded-lg overflow-hidden shrink-0 border border-border">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    {getFileIcon(uploadedFile.name)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">{uploadedFile.name}</p>
                  <p className="text-xs text-muted-foreground">{formatFileSize(uploadedFile.size)}</p>
                  <p className="text-xs text-primary mt-1">Gata pentru analiza</p>
                </div>
                <button onClick={clearFile} className="text-muted-foreground hover:text-foreground p-1">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}

          {/* Generate Button */}
          {uploadedFile && !isGenerating && (
            <button onClick={onGenerate} className="w-full py-3.5 rounded-xl font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <Zap className="w-5 h-5" /> Genereaza rezumat
            </button>
          )}

          {/* Loading State */}
          {isGenerating && (
            <div className="bg-card rounded-xl p-6 border border-border">
              <div className="space-y-3">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                    {uploadedFile && getFileIcon(uploadedFile.name)}
                  </div>
                  <p className="text-sm text-foreground truncate">{uploadedFile?.name}</p>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full animate-progress" />
                </div>
                <p className="text-sm text-center text-muted-foreground">AI analizeaza documentul...</p>
              </div>
            </div>
          )}

          {/* Saved Summaries */}
          {savedSummaries.length > 0 && (
            <div>
              <h2 className="font-bold text-lg mb-3 text-foreground" style={{ fontFamily: "var(--font-syne)" }}>
                Rezumate salvate
              </h2>
              <div className="space-y-3">
                {savedSummaries.map((summary) => (
                  <div key={summary.id} className="bg-card rounded-xl border border-border overflow-hidden">
                    <button onClick={() => setExpandedSummaryId(expandedSummaryId === summary.id ? null : summary.id)} className="w-full p-3 flex items-center justify-between text-left">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-foreground text-sm truncate">{summary.title}</h4>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">{summary.subject}</span>
                          <span className="text-xs text-muted-foreground">{summary.date}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); onDeleteSummary(summary.id); }} className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${expandedSummaryId === summary.id ? "rotate-180" : ""}`} />
                      </div>
                    </button>
                    {expandedSummaryId === summary.id && (
                      <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
                        <p className="text-sm text-muted-foreground">{summary.summary}</p>
                        <div>
                          <p className="text-xs font-medium text-foreground mb-1">Puncte cheie:</p>
                          <ul className="space-y-1">
                            {summary.keyPoints.map((point, i) => (
                              <li key={i} className="flex items-start gap-2 text-xs text-muted-foreground">
                                <Check className="w-3 h-3 text-primary shrink-0 mt-0.5" /> {point}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Generated Summary Result */}
      {generatedSummary && (
        <div className="space-y-4">
          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📋</span>
              <h3 className="font-bold text-foreground" style={{ fontFamily: "var(--font-syne)" }}>Rezumat</h3>
            </div>
            <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{generatedSummary.summary}</p>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">🎯</span>
              <h3 className="font-bold text-foreground" style={{ fontFamily: "var(--font-syne)" }}>Puncte cheie</h3>
            </div>
            <ul className="space-y-2">
              {generatedSummary.keyPoints.map((point, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                  <Check className="w-4 h-4 text-primary shrink-0 mt-0.5" /> {point}
                </li>
              ))}
            </ul>
          </div>

          <div className="bg-card rounded-xl p-4 border border-border">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">❓</span>
              <h3 className="font-bold text-foreground" style={{ fontFamily: "var(--font-syne)" }}>Intrebari posibile la BAC</h3>
            </div>
            <ul className="space-y-2">
              {generatedSummary.questions.map((q, index) => (
                <li key={index} className="text-sm text-muted-foreground">{index + 1}. {q}</li>
              ))}
            </ul>
          </div>

          <div className="flex gap-3">
            <button onClick={() => { onSaveSummary(); showToastMessage("Rezumat salvat cu succes!"); }} className="flex-1 py-3 rounded-xl font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2">
              <Save className="w-4 h-4" /> Salveaza
            </button>
            <button onClick={handleNewSummary} className="flex-1 py-3 rounded-xl font-medium bg-card border border-border text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2">
              <RefreshCw className="w-4 h-4" /> Rezumat nou
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
