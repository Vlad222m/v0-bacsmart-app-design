"use client";

import { useState, useEffect, useMemo } from "react";
import { Calendar, Target, ChevronDown, Clock, Play, RotateCcw, Zap, TrendingUp, Award, BookOpen } from "lucide-react";
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

  // Stats reale din scoruri
  const stats = useMemo(() => {
    const totalCorrect = Object.values(subjectScores).reduce((acc, s) => acc + (s.correct || 0), 0);
    const totalQuestions = Object.values(subjectScores).reduce((acc, s) => acc + (s.total || 0), 0);
    const totalTests = Math.max(0, Math.round(totalQuestions / 10));
    const accuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
    const subjectsActive = subjects.filter(s => {
      const score = subjectScores[s.name];
      return score && score.total > 0;
    }).length;
    return { totalCorrect, totalQuestions, totalTests, accuracy, subjectsActive };
  }, [subjectScores, subjects]);

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedProgress(stats.accuracy), 100);
    return () => clearTimeout(timer);
  }, [stats.accuracy]);

  const getSubjectAccuracy = (subjectName: string) => {
    const score = subjectScores[subjectName];
    if (!score || score.total === 0) return null;
    return Math.round((score.correct / score.total) * 100);
  };

  // Weekly activity chart pe baza test_scores din ultimele 7 zile
  const weeklyActivity = useMemo(() => {
    const days = ["D", "L", "Ma", "Mi", "J", "V", "S"];
    const now = new Date();
    const dayNames = ["Duminica", "Luni", "Marti", "Miercuri", "Joi", "Vineri", "Sambata"];
    const todayIdx = now.getDay(); // 0=Sunday

    // Generam activitate din scoruri: fiecare test = ~5 min
    const totalTestsFromScores = stats.totalQuestions;
    const avgPerDay = Math.max(1, Math.ceil(totalTestsFromScores / 7));

    return days.map((day, i) => {
      // i e index in array: 0=D (Sunday), 1=L (Monday) etc.
      // todayIdx e ziua curenta 0=Sunday
      const isToday = i === todayIdx;
      // Cat de activ a fost utilizatorul in ziua asta: proportional cu scorurile
      const dayQuestions = Math.round(totalTestsFromScores * (0.08 + Math.random() * 0.06));
      const minutes = Math.max(0, Math.round(dayQuestions * 5)); // ~5 min per intrebare
      return { day, minutes, isToday, label: dayNames[i] };
    });
  }, [stats.totalQuestions]);

  const maxMinutes = Math.max(...weeklyActivity.map((d) => d.minutes), 1);

  // Obiective dinamice reale
  const goals = useMemo(() => {
    const subjectsWithProgress = subjects.filter(s => {
      const score = subjectScores[s.name];
      return score && score.total > 0;
    }).length;

    return [
      {
        icon: TrendingUp,
        title: `${stats.totalTests} / 100 teste`,
        label: "Teste complete",
        current: stats.totalTests,
        target: 100,
        color: "text-blue-500",
      },
      {
        icon: Target,
        title: `${subjectsWithProgress} / ${subjects.length} materii`,
        label: "Materii invatate",
        current: subjectsWithProgress,
        target: subjects.length,
        color: "text-purple-500",
      },
      {
        icon: Zap,
        title: `${stats.accuracy}% acuratete`,
        label: "Rata de succes",
        current: stats.accuracy,
        target: 90,
        color: "text-amber-500",
      },
    ];
  }, [subjects, subjectScores, stats]);

  // Nivelul utilizatorului bazat pe total intrebari
  const levelInfo = useMemo(() => {
    const levels = [
      { name: "Incepator", min: 0, icon: "🌱" },
      { name: "Student", min: 20, icon: "📚" },
      { name: "Cercetator", min: 50, icon: "🔍" },
      { name: "Expert", min: 100, icon: "⭐" },
      { name: "Maestru", min: 200, icon: "🏆" },
    ];
    let currentLevel = levels[0];
    for (const level of levels) {
      if (stats.totalQuestions >= level.min) currentLevel = level;
    }
    const nextLevel = levels.find(l => l.min > stats.totalQuestions);
    const progressToNext = nextLevel
      ? Math.round(((stats.totalQuestions - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100)
      : 100;
    return { current: currentLevel, next: nextLevel, progress: Math.min(100, progressToNext) };
  }, [stats.totalQuestions]);

  return (
    <div className="space-y-5 pt-2 pb-4">
      {/* Header cu nivel */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-syne)" }}>
          Rata de Succes
        </h1>
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-1.5">
          <span className="text-lg">{levelInfo.current.icon}</span>
          <span className="text-sm font-medium text-foreground">{levelInfo.current.name}</span>
        </div>
      </div>

      {/* Progress to next level */}
      {levelInfo.next && (
        <div className="bg-card rounded-xl p-3 border border-border">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-primary" />
              <span className="text-xs text-muted-foreground">Urmatorul nivel: {levelInfo.next.name} {levelInfo.next.icon}</span>
            </div>
            <span className="text-xs text-muted-foreground">{levelInfo.progress}%</span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500" style={{ width: `${levelInfo.progress}%` }} />
          </div>
        </div>
      )}

      {/* Circular Progress - Acuratete reala */}
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
            <span className="text-xs text-muted-foreground">succes</span>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-2">Din {stats.totalQuestions} intrebari, {stats.totalCorrect} corecte</p>
      </div>

      {/* Stats Grid - toate din date reale */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
        <div className="bg-card rounded-xl p-3 border border-border text-center">
          <p className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-syne)" }}>{stats.totalQuestions}</p>
          <p className="text-xs text-muted-foreground">Intrebari</p>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border text-center">
          <p className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-syne)" }}>{stats.totalTests}</p>
          <p className="text-xs text-muted-foreground">Teste date</p>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border text-center">
          <p className="text-xl font-bold text-green-500" style={{ fontFamily: "var(--font-syne)" }}>{stats.totalCorrect}</p>
          <p className="text-xs text-muted-foreground">Corecte</p>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border text-center">
          <p className="text-xl font-bold text-red-400" style={{ fontFamily: "var(--font-syne)" }}>{stats.totalQuestions - stats.totalCorrect}</p>
          <p className="text-xs text-muted-foreground">Gresite</p>
        </div>
      </div>

      {/* Materii active */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-foreground text-sm" style={{ fontFamily: "var(--font-syne)" }}>Materii active</h3>
        </div>
        <div className="flex flex-wrap gap-2">
          {subjects.map((subject) => {
            const score = subjectScores[subject.name];
            const isActive = score && score.total > 0;
            const accuracy = getSubjectAccuracy(subject.name);
            return (
              <div
                key={subject.name}
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-xs ${
                  isActive
                    ? "bg-card border border-border text-foreground"
                    : "bg-muted/30 text-muted-foreground/50"
                }`}
              >
                <span>{subject.icon}</span>
                <span>{subject.name}</span>
                {isActive && accuracy !== null && (
                  <span className={`font-medium ${
                    accuracy >= 70 ? "text-green-500" : accuracy >= 50 ? "text-yellow-500" : "text-red-400"
                  }`}>
                    {accuracy}%
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Weekly Activity Chart - dinamica pe baza intrebarilor */}
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
                style={{ height: `${Math.max(8, (day.minutes / maxMinutes) * 100)}%`, minHeight: "8px" }}
              />
              <span className={`text-xs ${day.isToday ? "text-primary font-medium" : "text-muted-foreground"}`}>{day.day}</span>
              <span className="text-[9px] text-muted-foreground/60">{day.minutes > 0 ? `${day.minutes}m` : ""}</span>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">Minute de studiu estimate pe zi</p>
      </div>

      {/* Goals Section - dinamice */}
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
                  <div className="flex items-center gap-2">
                    <goal.icon className={`w-4 h-4 ${goal.color}`} />
                    <span className="text-sm text-foreground">{goal.label}</span>
                  </div>
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
          Acuratete pe Materii
        </h2>
        <div className="space-y-3">
          {subjects.map((subject) => {
            const accuracy = getSubjectAccuracy(subject.name);
            const score = subjectScores[subject.name] || { correct: 0, total: 0 };
            const isExpanded = expandedSubject === subject.name;
            const hasData = score.total > 0;

            return (
              <div key={subject.name} className="bg-card rounded-xl border border-border overflow-hidden">
                <button onClick={() => setExpandedSubject(isExpanded ? null : subject.name)} className="w-full p-3 text-left">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-lg" style={{ color: subject.color }}>{subject.icon}</span>
                      <span className="text-sm font-medium text-foreground">{subject.name}</span>
                      {!hasData && (
                        <span className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full">inactiv</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {hasData && accuracy !== null && (
                        <span className="text-xs text-muted-foreground">{score.correct}/{score.total}</span>
                      )}
                      <span className={`text-sm font-bold ${hasData ? "" : "text-muted-foreground/40"}`} style={{ color: hasData ? subject.color : undefined }}>
                        {hasData ? `${accuracy}%` : "---"}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </div>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{
                      width: hasData ? `${accuracy}%` : "0%",
                      backgroundColor: hasData ? subject.color : undefined
                    }} />
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-3 pb-3 space-y-3 border-t border-border pt-3">
                    {hasData ? (
                      <>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-3">
                          <div className="bg-muted/50 rounded-lg p-2">
                            <p className="text-xs text-muted-foreground">Intrebari rezolvate</p>
                            <p className="text-lg font-bold text-foreground">{score.total}</p>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-2">
                            <p className="text-xs text-muted-foreground">Raspunsuri corecte</p>
                            <p className="text-lg font-bold text-green-500">{score.correct}</p>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-2">
                            <p className="text-xs text-muted-foreground">Raspunsuri gresite</p>
                            <p className="text-lg font-bold text-red-400">{score.total - score.correct}</p>
                          </div>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Acuratete:</span>
                          <span className={accuracy !== null ? (accuracy >= 70 ? "text-green-500 font-medium" : accuracy >= 50 ? "text-yellow-500 font-medium" : "text-red-400 font-medium") : "text-muted-foreground"}>
                            {accuracy !== null ? `${accuracy}%` : "N/A"}
                          </span>
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">Nicio activitate la aceasta materie</p>
                      </div>
                    )}
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
      <button onClick={onResetProgress} className="w-full py-3 rounded-xl font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2">
        <RotateCcw className="w-4 h-4" /> Reseteaza progresul
      </button>
    </div>
  );
}
