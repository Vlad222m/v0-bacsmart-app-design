"use client";

import { FileText, Plus, ChevronRight, Check, X, Crown } from "lucide-react";
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
  onSavedQuizzes: () => void;
  savedQuizCount: number;
  currentPlan?: string;
  dailyAnswersUsage?: number;
  dailyQuizzesUsage?: number;
  onGoPremium?: () => void;
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
  onSavedQuizzes,
  savedQuizCount,
  currentPlan,
  dailyAnswersUsage = 0,
  dailyQuizzesUsage = 0,
  onGoPremium,
}: TestsTabProps) {
  const answerLabels = ["A", "B", "C", "D"];

  const isFree = currentPlan === "free";
  const answersRemaining = isFree ? Math.max(0, 10 - dailyAnswersUsage) : null;
  const answersLimitReached = isFree && dailyAnswersUsage >= 10;
  const quizzesRemaining = isFree ? Math.max(0, 1 - dailyQuizzesUsage) : null;
  const quizzesLimitReached = isFree && dailyQuizzesUsage >= 1;

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

      {/* Quiz limit banner */}
      {isFree && quizzesLimitReached && (
        <div className="bg-error/10 border border-error/30 rounded-xl px-4 py-2.5 text-xs text-muted-foreground text-center">
          Ai atins limita zilnică de 1 quiz. <span className="text-primary font-medium">Upgrade la Premium</span> pentru quiz-uri nelimitate.
        </div>
      )}

      {/* Quiz Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <button
          onClick={quizzesLimitReached ? onGoPremium : onOpenDocumentQuiz}
          className="group relative w-full py-3.5 rounded-2xl font-semibold bg-gradient-to-br from-primary/20 to-primary/5 text-primary hover:from-primary/30 hover:to-primary/10 border border-primary/20 hover:border-primary/40 transition-all duration-200 flex items-center justify-center gap-1 overflow-hidden"
        >
          <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          {quizzesLimitReached ? <Crown className="w-4 h-4 shrink-0" /> : <Plus className="w-4 h-4 shrink-0" />}
          <span className="text-sm">{quizzesLimitReached ? "Premium" : "Quiz din document"}</span>
        </button>
        <button
          onClick={onSavedQuizzes}
          className="group relative w-full py-3.5 rounded-2xl font-semibold bg-gradient-to-br from-card to-card/50 border border-border hover:border-primary/30 hover:bg-muted/80 transition-all duration-200 flex items-center justify-center gap-1.5"
        >
          <div className="absolute inset-0 bg-primary/[0.02] opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
          <FileText className="w-4 h-4 shrink-0 text-primary" />
          <span className="text-sm">Istoric teste</span>
          {savedQuizCount > 0 && (
            <span className="absolute -top-2.5 -right-2.5 bg-primary text-primary-foreground text-[10px] font-bold min-w-[22px] h-[22px] px-1.5 rounded-full flex items-center justify-center shadow-lg shadow-primary/40 ring-[3px] ring-background z-10">
              {savedQuizCount > 99 ? "99+" : savedQuizCount}
            </span>
          )}
        </button>
      </div>

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
            <span className="text-[10px] sm:text-xs truncate max-w-[60px] sm:max-w-[80px]">{subject.name}</span>
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

      {/* Answers remaining indicator */}
      {isFree && (
        <div className="text-[11px] text-muted-foreground text-center">
          {answersLimitReached
            ? "Ai atins limita zilnică de 10 răspunsuri"
            : `${answersRemaining}/10 răspunsuri disponibile azi`}
        </div>
      )}

      {/* Action Button */}
      {answersLimitReached && !showResult ? (
        <button
          onClick={onGoPremium}
          className="w-full py-3.5 rounded-xl font-medium bg-primary/10 text-primary border border-primary/30 hover:bg-primary/20 transition-colors flex items-center justify-center gap-2.5"
        >
          <Crown className="w-5 h-5 shrink-0" />
          <span className="text-sm">Upgrade la Premium pentru răspunsuri nelimitate</span>
        </button>
      ) : !showResult ? (
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
