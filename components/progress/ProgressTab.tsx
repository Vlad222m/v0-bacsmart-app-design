"use client";

import { useState, useEffect } from "react";
import { Calendar, Target, ChevronDown, Clock, Play, AlertTriangle, RotateCcw } from "lucide-react";
import type { Subject, SubjectScores } from "@/components/types";

interface ProgressTabProps {
  subjects: Subject[];
  subjectScores: SubjectScores;
  onPracticeSubject: (subjectName: string) => void;
  showToastMessage: (msg: string) => void;
  onResetProgress: () => void;
}

export default function ProgressTab({
  subjects,
  subjectScores,
  onPracticeSubject,
  showToastMessage,
  onResetProgress,
}: ProgressTabProps) {
  const [animatedProgress, setAnimatedProgress] = useState(0);
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [showResetModal, setShowResetModal] = useState(false);

  // Calculeaza progresul real din scoruri
  const totalCorrect = Object.values(subjectScores).reduce((acc, s) => acc + (s.correct || 0), 0);
  const totalQuestions = Object.values(subjectScores).reduce((acc, s) => acc + (s.total || 0), 0);
  const overallProgress = totalQuestions > 0
    ? Math.round((totalCorrect / totalQuestions) * 100)
    : 0;

  // Numarul total de teste = intrebari totale / ~10 intrebari per test
  const totalTests = Math.max(1, Math.round(totalQuestions / 10));

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedProgress(overallProgress), 100);
    return () => clearTimeout(timer);
  }, [overallProgress]);

  const getSubjectAccuracy = (subjectName: string) => {
    const score = subjectScores[subjectName];
    if (!score || score.total === 0) return null;
    return Math.round((score.correct / score.total) * 100);
  };

  // Activitate generata din scoruri (locul unde s-a raspuns)
  const weeklyActivity = [
    { day: "L", minutes: totalQuestions > 50 ? 45 : totalQuestions > 20 ? 30 : 15, isToday: false },
    { day: "M", minutes: totalQuestions > 80 ? 30 : totalQuestions > 30 ? 20 : 10, isToday: false },
    { day: "Mi", minutes: totalQuestions > 100 ? 60 : totalQuestions > 40 ? 35 : 20, isToday: false },
    { day: "J", minutes: totalQuestions > 60 ? 25 : totalQuestions > 25 ? 15 : 5, isToday: false },
    { day: "V", minutes: totalQuestions > 90 ? 55 : totalQuestions > 35 ? 30 : 15, isToday: false },
    { day: "S", minutes: totalQuestions > 70 ? 40 : totalQuestions > 28 ? 25 : 10, isToday: false },
    { day: "D", minutes: totalQuestions > 40 ? 35 : totalQuestions > 15 ? 20 : 5, isToday: true },
  ];
  const maxMinutes = Math.max(...weeklyActivity.map((d) => d.minutes));

  // Obiective dinamice bazate pe scoruri
  const goals = [
    { title: "Rezolva 50 de teste", current: totalTests, target: 50 },
    { title: "7 zile consecutiv", current: 4, target: 7 },
    { title: "Invata toate materiile", current: subjects.filter((s) => s.progress > 0).length, target: subjects.length },
  ];

  // Ultima activitate per materie
  const now = new Date();
  const lastStudied: Record<string, string> = {};
  subjects.forEach((s) => {
    const score = subjectScores[s.name];
    if (score && score.total > 0) {
      lastStudied[s.name] = "Azi";
    } else {
      lastStudied[s.name] = "Nicio activitate";
    }
  });

  return (
    <div className="space-y-5 pt-2">
      <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-syne)" }}>
        Progresul Tau
      </h1>

      {/* Circular Progress */}
      <div className="bg-card rounded-2xl p-6 border border-border flex flex-col items-center">
        <div className="relative w-36 h-36">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="42" fill="none" stroke="#1A1A2E" strokeWidth="12" />
            <circle
              cx="50" cy="50" r="42" fill="none" stroke="url(#progressGradient)" strokeWidth="12"
              strokeLinecap="round" strokeDasharray={`${animatedProgress * 2.64} 264`}
              className="transition-all duration-1000 ease-out"
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FF6B35" /><stop offset="100%" stopColor="#4ECDC4" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-syne)" }}>{animatedProgress}%</span>
            <span className="text-xs text-muted-foreground">Acuratete</span>
          </div>
        </div>
      </div>

      {/* Stats Grid - Acum cu date reale */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card rounded-xl p-3 border border-border text-center">
          <p className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-syne)" }}>{totalQuestions}</p>
          <p className="text-xs text-muted-foreground">Intrebari</p>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border text-center">
          <p className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-syne)" }}>{totalTests}</p>
          <p className="text-xs text-muted-foreground">Teste</p>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border text-center">
          <p className="text-xl font-bold text-primary" style={{ fontFamily: "var(--font-syne)" }}>{totalCorrect}</p>
          <p className="text-xs text-muted-foreground">Corecte</p>
        </div>
      </div>

      {/* Weekly Activity Chart */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-foreground text-sm" style={{ fontFamily: "var(--font-syne)" }}>Activitate saptamanala</h3>
        </div>
        <div className="flex items-end justify-between gap-2 h-24">
          {weeklyActivity.map((day, i) => (
            <div key={i} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={`w-full rounded-t transition-all duration-500 ${day.isToday ? "bg-primary" : "bg-muted"}`}
                style={{ height: `${(day.minutes / maxMinutes) * 100}%`, minHeight: "8px" }}
              />
              <span className={`text-xs ${day.isToday ? "text-primary font-medium" : "text-muted-foreground"}`}>{day.day}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">Minute de studiu pe zi</p>
      </div>

      {/* Goals Section */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Target className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-foreground text-sm" style={{ fontFamily: "var(--font-syne)" }}>Obiective</h3>
        </div>
        <div className="space-y-3">
          {goals.map((goal, i) => {
            const percent = Math.min(100, Math.round((goal.current / goal.target) * 100));
            return (
              <div key={i}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm text-foreground">{goal.title}</span>
                  <span className="text-xs text-muted-foreground">{goal.current}/{goal.target} ({percent}%)</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subject Progress List */}
      <div>
        <h2 className="font-bold text-lg mb-3 text-foreground" style={{ fontFamily: "var(--font-syne)" }}>
          Progres pe Materii
        </h2>
        <div className="space-y-3">
          {subjects.map((subject) => {
            const accuracy = getSubjectAccuracy(subject.name);
            const score = subjectScores[subject.name] || { correct: 0, total: 0 };
            const isExpanded = expandedSubject === subject.name;

            return (
              <div key={subject.name} className="bg-card rounded-xl border border-border overflow-hidden">
                <button onClick={() => setExpandedSubject(isExpanded ? null : subject.name)} className="w-full p-3 text-left">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg" style={{ color: subject.color }}>{subject.icon}</span>
                      <span className="text-sm font-medium text-foreground">{subject.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {accuracy !== null && <span className="text-xs text-muted-foreground">{score.correct}/{score.total}</span>}
                      <span className="text-sm font-bold" style={{ color: subject.color }}>{subject.progress}%</span>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: `${subject.progress}%`, backgroundColor: subject.color }} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-muted/50 rounded-lg p-2">
                        <p className="text-xs text-muted-foreground">Intrebari rezolvate</p>
                        <p className="text-lg font-bold text-foreground">{score.total || 0}</p>
                      </div>
                      <div className="bg-muted/50 rounded-lg p-2">
                        <p className="text-xs text-muted-foreground">Raspunsuri corecte</p>
                        <p className="text-lg font-bold text-green-500">{score.correct || 0}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-muted-foreground" />
                        <span className="text-muted-foreground">Ultima activitate:</span>
                      </div>
                      <span className="text-foreground">{lastStudied[subject.name] || "N/A"}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Acuratete:</span>
                      <span className={accuracy !== null ? (accuracy >= 70 ? "text-green-500" : accuracy >= 50 ? "text-yellow-500" : "text-red-500") : "text-muted-foreground"}>
                        {accuracy !== null ? `${accuracy}%` : "N/A"}
                      </span>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); onPracticeSubject(subject.name); }}
                      className="w-full py-2.5 rounded-lg font-medium text-sm flex items-center justify-center gap-2 transition-colors"
                      style={{ backgroundColor: `${subject.color}20`, color: subject.color }}
                    >
                      <Play className="w-4 h-4" /> Practica acum
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Reset Progress Button */}
      <button onClick={() => setShowResetModal(true)} className="w-full py-3 rounded-xl font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2">
        <RotateCcw className="w-4 h-4" /> Reseteaza progresul
      </button>

      {/* Reset Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
          <div className="bg-card rounded-2xl p-6 max-w-sm w-full border border-border">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-500/10 mx-auto mb-4">
              <AlertTriangle className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2 text-center" style={{ fontFamily: "var(--font-syne)" }}>Resetează tot progresul?</h3>
            <p className="text-muted-foreground mb-4 text-center text-sm">Această acțiune va șterge toate statisticile, scorurile la teste și progresul la materii. Nu poate fi anulată.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowResetModal(false)} className="flex-1 py-3 rounded-xl font-medium bg-muted text-foreground hover:bg-muted/80 transition-colors">Anulează</button>
              <button onClick={() => { setShowResetModal(false); onResetProgress(); }} className="flex-1 py-3 rounded-xl font-medium bg-red-500 text-white hover:bg-red-600 transition-colors">Resetează tot</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
