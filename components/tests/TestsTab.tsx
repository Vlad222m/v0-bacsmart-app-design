"use client";

import { FileText, Plus, ChevronRight, Check, X } from "lucide-react";
import type { Subject, TestQuestion, SubjectScores } from "@/components/types";

interface TestsTabProps {
  subjects: Subject[];
  testSubjectFilter: string;
  setTestSubjectFilter: (s: string) => void;
  currentQuestion: TestQuestion | null;
  selectedAnswer: number | null;
  setSelectedAnswer: (n: number | null) => void;
  showResult: boolean;
  handleAnswerSubmit: () => void;
  nextQuestion: () => void;
  subjectScores: SubjectScores;
  totalScore: { correct: number; total: number };
  totalQuestions: number;
  onOpenDocumentQuiz: () => void;
}

export default function TestsTab({
  subjects,
  testSubjectFilter,
  setTestSubjectFilter,
  currentQuestion,
  selectedAnswer,
  setSelectedAnswer,
  showResult,
  handleAnswerSubmit,
  nextQuestion,
  subjectScores,
  totalScore,
  totalQuestions,
  onOpenDocumentQuiz,
}: TestsTabProps) {
  const answerLabels = ["A", "B", "C", "D"];

  if (!currentQuestion) {
    return (
      <div className="space-y-4 pt-2">
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">Se incarca intrebarile...</p>
        </div>
      </div>
    );
  }

  const subjectData = subjects.find((s) => s.name === currentQuestion.subject);
  const currentSubjectScore = subjectScores[currentQuestion.subject] || { correct: 0, total: 0 };

  return (
    <div className="space-y-4 pt-2">
      {/* Header with Score */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-syne)" }}>
          Teste Practice
        </h1>
        <div className="bg-card border border-border rounded-xl px-3 py-1.5">
          <span className="text-sm font-medium text-foreground">
            Scor: <span className="text-primary">{totalScore.correct}</span>/{totalScore.total}
          </span>
        </div>
      </div>

      {/* Quiz din Document Button */}
      <button
        onClick={onOpenDocumentQuiz}
        className="w-full py-3 rounded-xl font-medium bg-primary/10 text-primary hover:bg-primary/20 transition-colors flex items-center justify-center gap-2"
      >
        <Plus className="w-5 h-5" />
        Quiz din document
      </button>

      {/* Subject Filter */}
      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        <button
          onClick={() => setTestSubjectFilter("Toate")}
          className={`px-3 py-1.5 rounded-lg text-sm font-medium shrink-0 transition-all ${
            testSubjectFilter === "Toate" ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"
          }`}
        >
          Toate
        </button>
        {subjects.map((subject) => (
          <button
            key={subject.name}
            onClick={() => setTestSubjectFilter(subject.name)}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium shrink-0 transition-all flex items-center gap-1.5 ${
              testSubjectFilter === subject.name ? "bg-primary text-primary-foreground" : "bg-card border border-border text-muted-foreground"
            }`}
          >
            <span className="text-base">{subject.icon}</span>
            <span className="text-[10px] truncate max-w-[60px]">{subject.name}</span>
          </button>
        ))}
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{totalQuestions} intrebari disponibile</span>
          <span className="text-primary font-medium">{totalScore.total > 0 ? Math.round((totalScore.correct / totalScore.total) * 100) : 0}% corect</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all"
            style={{ width: `${totalScore.total > 0 ? (totalScore.correct / totalScore.total) * 100 : 0}%` }}
          />
        </div>
      </div>

      {/* Per-subject score badge */}
      {testSubjectFilter !== "Toate" && currentSubjectScore.total > 0 && (
        <div className="bg-card rounded-lg px-3 py-2 border border-border inline-flex items-center gap-2">
          <span className="text-lg" style={{ color: subjectData?.color }}>{subjectData?.icon}</span>
          <span className="text-sm text-muted-foreground">{currentSubjectScore.correct}/{currentSubjectScore.total} corecte</span>
        </div>
      )}

      {/* Question Card */}
      <div className="bg-card rounded-2xl p-4 border border-border">
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg" style={{ color: subjectData?.color }}>{subjectData?.icon || "📚"}</span>
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: `${subjectData?.color}20`, color: subjectData?.color }}>
            {currentQuestion.subject}
          </span>
        </div>
        <p className="text-foreground font-medium mb-4">{currentQuestion.question}</p>

        {/* Answer Options */}
        <div className="space-y-2">
          {currentQuestion.answers.map((answer, index) => {
            let bgColor = "bg-muted";
            let borderColor = "border-transparent";
            let textColor = "text-foreground";

            if (showResult) {
              if (index === currentQuestion.correct) {
                bgColor = "bg-green-500/20";
                borderColor = "border-green-500";
                textColor = "text-green-400";
              } else if (index === selectedAnswer && index !== currentQuestion.correct) {
                bgColor = "bg-red-500/20";
                borderColor = "border-red-500";
                textColor = "text-red-400";
              } else {
                bgColor = "bg-muted/50";
                textColor = "text-muted-foreground";
              }
            } else if (selectedAnswer === index) {
              bgColor = "bg-primary/20";
              borderColor = "border-primary";
              textColor = "text-primary";
            }

            return (
              <button
                key={index}
                onClick={() => !showResult && setSelectedAnswer(index)}
                disabled={showResult}
                className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 ${bgColor} ${borderColor} ${textColor} transition-all text-left`}
              >
                <span className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm ${
                  showResult && index === currentQuestion.correct
                    ? "bg-green-500 text-white"
                    : showResult && index === selectedAnswer
                    ? "bg-red-500 text-white"
                    : selectedAnswer === index
                    ? "bg-primary text-primary-foreground"
                    : "bg-border text-muted-foreground"
                }`}>
                  {showResult && index === currentQuestion.correct ? (
                    <Check className="w-4 h-4" />
                  ) : showResult && index === selectedAnswer && index !== currentQuestion.correct ? (
                    <X className="w-4 h-4" />
                  ) : (
                    answerLabels[index]
                  )}
                </span>
                <span className="flex-1 text-sm">{answer}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Explanation Card */}
      {showResult && (
        <div className="bg-card rounded-2xl p-4 border border-secondary">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-secondary">💡</span>
            <span className="font-bold text-foreground" style={{ fontFamily: "var(--font-syne)" }}>
              Explicatie
            </span>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{currentQuestion.explanation}</p>
        </div>
      )}

      {/* Action Button */}
      {!showResult ? (
        <button
          onClick={handleAnswerSubmit}
          disabled={selectedAnswer === null}
          className={`w-full py-3 rounded-xl font-medium transition-all ${
            selectedAnswer !== null ? "bg-primary text-primary-foreground hover:opacity-90" : "bg-muted text-muted-foreground cursor-not-allowed"
          }`}
        >
          Verifica Raspunsul
        </button>
      ) : (
        <button
          onClick={nextQuestion}
          className="w-full py-3 rounded-xl font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
        >
          Urmatoarea <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
