"use client";

import { useState, useEffect, useMemo } from "react";
import { Calendar, Target, ChevronDown, Clock, Play, RotateCcw, Zap, TrendingUp, Award, BookOpen, Star, Flame, BarChart3 } from "lucide-react";
import type { Subject, SubjectScores } from "@/components/types";

interface ProgressTabProps {
  subjects: Subject[];
  subjectScores: SubjectScores;
  onPracticeSubject: (subjectName: string) => void;
  showToastMessage: (msg: string) => void;
  onResetProgress: () => void;
  weeklyTestData?: Record<string, number>;
  studyMinutesToday?: number;
}

// Niveluri
const LEVELS = [
  { name: "Incepator", min: 0, icon: "🌱" },
  { name: "Student", min: 20, icon: "📚" },
  { name: "Cercetator", min: 50, icon: "🔍" },
  { name: "Expert", min: 100, icon: "⭐" },
  { name: "Maestru", min: 200, icon: "🏆" },
];

const DAY_NAMES = ["Duminica", "Luni", "Marti", "Miercuri", "Joi", "Vineri", "Sambata"];

function CircularProgress({ value }: { value: number }) {
  const [animated, setAnimated] = useState(0);
  useEffect(() => { const t = setTimeout(() => setAnimated(value), 100); return () => clearTimeout(t); }, [value]);

  const color = value >= 80 ? "#22C55E" : value >= 60 ? "#4ECDC4" : value >= 40 ? "#F59E0B" : "#FF6B35";

  return (
    <div className="relative w-28 h-28 sm:w-36 sm:h-36">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
        <circle cx="50" cy="50" r="42" fill="none" stroke="#1A1A2E" strokeWidth="10" />
        <circle
          cx="50" cy="50" r="42" fill="none" stroke={color} strokeWidth="10"
          strokeLinecap="round" strokeDasharray={`${animated * 2.64} 264`}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl sm:text-3xl font-bold text-foreground" style={{ fontFamily: "var(--font-syne)" }}>{animated}%</span>
        <span className="text-[10px] text-muted-foreground">succes</span>
      </div>
    </div>
  );
}

function LevelProgressBar({ levelInfo, totalQuestions }: { levelInfo: ReturnType<typeof getLevelInfo>; totalQuestions: number }) {
  // La nivel maxim -> aratam o bara plina cu mesaj
  if (!levelInfo.next) {
    return (
      <div className="bg-card rounded-xl p-3 border border-border">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5">
            <Award className="w-4 h-4 text-yellow-500" />
            <span className="text-xs text-muted-foreground">Nivel maxim atins! {levelInfo.current.icon}</span>
          </div>
          <span className="text-xs text-green-500 font-medium">Complet</span>
        </div>
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <div className="h-full bg-gradient-to-r from-yellow-500 to-yellow-300 rounded-full" style={{ width: "100%" }} />
        </div>
        <p className="text-[10px] text-muted-foreground mt-1">{totalQuestions} intrebari rezolvate</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-xl p-3 border border-border">
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-1.5">
          <Award className="w-4 h-4 text-primary" />
          <span className="text-xs text-muted-foreground">Urmatorul: {levelInfo.next.name} {levelInfo.next.icon}</span>
        </div>
        <span className="text-xs text-muted-foreground">{levelInfo.progress}%</span>
      </div>
      <div className="h-2 bg-muted rounded-full overflow-hidden">
        <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500" style={{ width: `${Math.max(2, levelInfo.progress)}%` }} />
      </div>
      <p className="text-[10px] text-muted-foreground mt-1">
        Mai ai nevoie de <strong>{levelInfo.next.min - totalQuestions}</strong> intrebari pentru nivelul urmator
      </p>
    </div>
  );
}

function getLevelInfo(totalQuestions: number) {
  let currentLevel = LEVELS[0];
  for (const level of LEVELS) {
    if (totalQuestions >= level.min) currentLevel = level;
  }
  const nextLevel = LEVELS.find(l => l.min > totalQuestions);
  const progressToNext = nextLevel
    ? Math.round(((totalQuestions - currentLevel.min) / (nextLevel.min - currentLevel.min)) * 100)
    : 100;
  return { current: currentLevel, next: nextLevel || null, progress: Math.min(100, Math.max(0, progressToNext)) };
}

export default function ProgressTab({
  subjects,
  subjectScores,
  onPracticeSubject,
  showToastMessage,
  onResetProgress,
  weeklyTestData = {},
  studyMinutesToday = 0,
}: ProgressTabProps) {
  const [expandedSubject, setExpandedSubject] = useState<string | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  // Stats reale
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

  const levelInfo = useMemo(() => getLevelInfo(stats.totalQuestions), [stats.totalQuestions]);

  // Weekly activity din date reale test_scores
  const weeklyDays = useMemo(() => {
    const now = new Date();
    const days: { key: string; label: string; short: string; questions: number; isToday: boolean }[] = [];

    const roDayNames = ["D", "L", "Ma", "Mi", "J", "V", "S"];

    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().split("T")[0];
      const dayOfWeek = d.getDay();
      const isToday = i === 0;

      days.push({
        key: dateKey,
        label: DAY_NAMES[dayOfWeek],
        short: roDayNames[dayOfWeek],
        questions: weeklyTestData[dateKey] || 0,
        isToday,
      });
    }

    return days;
  }, [weeklyTestData]);

  const maxQuestions = Math.max(...weeklyDays.map(d => d.questions), 1);

  // Goals
  const goals = useMemo(() => {
    const subjectsWithProgress = subjects.filter(s => {
      const score = subjectScores[s.name];
      return score && score.total > 0;
    }).length;

    return [
      {
        icon: TrendingUp,
        title: `${stats.totalTests} teste`,
        label: "Teste completate",
        current: stats.totalTests,
        target: Math.max(stats.totalTests + 50, 100),
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
        title: `${stats.accuracy}%`,
        label: "Rata de succes",
        current: stats.accuracy,
        target: 90,
        color: "text-amber-500",
      },
    ];
  }, [subjects, subjectScores, stats]);

  const getSubjectAccuracy = (subjectName: string) => {
    const score = subjectScores[subjectName];
    if (!score || score.total === 0) return null;
    return Math.round((score.correct / score.total) * 100);
  };

  const formatTime = (minutes: number) => {
    if (minutes < 1) return "< 1 min";
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}m` : `${h}h`;
  };

  // Total study time
  const totalStudyTime = useMemo(() => {
    let total = 0;
    Object.keys(weeklyTestData).forEach(key => {
      total += weeklyTestData[key] * 0.5; // ~30 sec per question
    });
    return Math.round(total / 5) * 5 + studyMinutesToday; // round to 5 min + today's tracked time
  }, [weeklyTestData, studyMinutesToday]);

  return (
    <div className="space-y-4 pt-2 pb-4">
      {/* Header cu nivel */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-syne)" }}>
            Rata de Succes
          </h1>
          <p className="text-xs text-muted-foreground">Progresul tau in aplicatie</p>
        </div>
        <div className="flex items-center gap-2 bg-card border border-border rounded-xl px-3 py-1.5">
          <span className="text-lg">{levelInfo.current.icon}</span>
          <span className="text-sm font-medium text-foreground">{levelInfo.current.name}</span>
        </div>
      </div>

      {/* Level Progress */}
      <LevelProgressBar levelInfo={levelInfo} totalQuestions={stats.totalQuestions} />

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 gap-2 sm:gap-3">
        {/* Circular Accuracy */}
        <div className="bg-card rounded-2xl p-4 sm:p-5 border border-border flex flex-col items-center justify-center col-span-2 sm:col-span-1">
          <CircularProgress value={stats.accuracy} />
          <p className="text-xs text-muted-foreground mt-2 text-center">
            {stats.totalCorrect} corecte din {stats.totalQuestions} intrebari
          </p>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 gap-2 sm:gap-3 col-span-2 sm:col-span-1">
          <div className="bg-card rounded-xl p-3 border border-border flex flex-col items-center justify-center">
            <Flame className="w-5 h-5 text-orange-500 mb-1" />
            <p className="text-lg font-bold text-foreground" style={{ fontFamily: "var(--font-syne)" }}>{stats.totalQuestions}</p>
            <p className="text-[10px] text-muted-foreground">Intrebari</p>
          </div>
          <div className="bg-card rounded-xl p-3 border border-border flex flex-col items-center justify-center">
            <BookOpen className="w-5 h-5 text-blue-500 mb-1" />
            <p className="text-lg font-bold text-foreground" style={{ fontFamily: "var(--font-syne)" }}>{stats.totalTests}</p>
            <p className="text-[10px] text-muted-foreground">Teste</p>
          </div>
          <div className="bg-card rounded-xl p-3 border border-border flex flex-col items-center justify-center">
            <BarChart3 className="w-5 h-5 text-green-500 mb-1" />
            <p className="text-lg font-bold text-green-500" style={{ fontFamily: "var(--font-syne)" }}>{stats.totalCorrect}</p>
            <p className="text-[10px] text-muted-foreground">Corecte</p>
          </div>
          <div className="bg-card rounded-xl p-3 border border-border flex flex-col items-center justify-center">
            <Zap className="w-5 h-5 text-red-400 mb-1" />
            <p className="text-lg font-bold text-red-400" style={{ fontFamily: "var(--font-syne)" }}>{stats.totalQuestions - stats.totalCorrect}</p>
            <p className="text-[10px] text-muted-foreground">Gresite</p>
          </div>
        </div>
      </div>

      {/* Streak + Study Time */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-card rounded-xl p-3 border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground" style={{ fontFamily: "var(--font-syne)" }}>--</p>
            <p className="text-[10px] text-muted-foreground">Streak zile</p>
          </div>
        </div>
        <div className="bg-card rounded-xl p-3 border border-border flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center shrink-0">
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-lg font-bold text-foreground" style={{ fontFamily: "var(--font-syne)" }}>{formatTime(studyMinutesToday)}</p>
            <p className="text-[10px] text-muted-foreground">Azi studiat</p>
          </div>
        </div>
      </div>

      {/* Weekly Activity - date reale */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <div className="flex items-center gap-2 mb-3">
          <Calendar className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-foreground text-sm" style={{ fontFamily: "var(--font-syne)" }}>Activitate saptamanala</h3>
        </div>
        <div className="flex items-end justify-between gap-1.5 sm:gap-2 h-28">
          {weeklyDays.map((day, i) => {
            const height = Math.max(6, (day.questions / maxQuestions) * 100);
            const isSelected = selectedDay === i;
            return (
              <button
                key={day.key}
                onClick={() => setSelectedDay(isSelected ? null : i)}
                className={`flex-1 flex flex-col items-center gap-1 transition-all ${isSelected ? "scale-105" : ""}`}
              >
                <div className="relative w-full flex flex-col items-center">
                  {isSelected && day.questions > 0 && (
                    <div className="absolute -top-7 bg-foreground text-background text-[9px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap z-10">
                      {day.questions} intrebari
                    </div>
                  )}
                  <div
                    className={`w-full rounded-t transition-all duration-300 ${
                      day.isToday ? "bg-primary" : day.questions > 0 ? "bg-primary/60" : "bg-muted/30"
                    }`}
                    style={{ height: `${height}%`, minHeight: "6px" }}
                  />
                </div>
                <span className={`text-[10px] sm:text-xs ${day.isToday ? "text-primary font-medium" : "text-muted-foreground"}`}>
                  {day.short}
                </span>
                {day.questions > 0 && (
                  <span className="text-[8px] text-muted-foreground/60">{day.questions}</span>
                )}
              </button>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground text-center mt-2">
          {maxQuestions > 1
            ? `Bazat pe intrebarile reale rezolvate in ultimele 7 zile`
            : `Completeaza primul tau test pentru a vedea activitatea`}
        </p>
      </div>

      {/* Goals */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <div className="flex items-center gap-2 mb-3">
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
                    <span className="text-xs text-foreground">{goal.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">{goal.current}/{goal.target}</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-primary to-secondary rounded-full transition-all duration-500" style={{ width: `${percent}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Subject Progress List with expand */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <BookOpen className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-foreground text-sm" style={{ fontFamily: "var(--font-syne)" }}>Acuratete pe materii</h3>
        </div>
        <div className="space-y-2">
          {subjects.map((subject) => {
            const accuracy = getSubjectAccuracy(subject.name);
            const score = subjectScores[subject.name] || { correct: 0, total: 0 };
            const isExpanded = expandedSubject === subject.name;
            const hasData = score.total > 0;

            return (
              <div key={subject.name} className="bg-card rounded-xl border border-border overflow-hidden">
                <button onClick={() => setExpandedSubject(isExpanded ? null : subject.name)} className="w-full p-3 text-left">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                      <span className="text-lg shrink-0" style={{ color: subject.color }}>{subject.icon}</span>
                      <span className="text-sm font-medium text-foreground truncate">{subject.name}</span>
                      {!hasData && (
                        <span className="text-[9px] bg-muted text-muted-foreground px-1.5 py-0.5 rounded-full shrink-0">inactiv</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {hasData && accuracy !== null && (
                        <span className="text-xs text-muted-foreground">{score.correct}/{score.total}</span>
                      )}
                      <span className={`text-sm font-bold ${hasData ? "" : "text-muted-foreground/40"}`} style={{ color: hasData ? subject.color : undefined }}>
                        {hasData ? `${accuracy}%` : "---"}
                      </span>
                      <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isExpanded ? "rotate-180" : ""}`} />
                    </div>
                  </div>
                  <div className="h-1.5 bg-muted rounded-full overflow-hidden mt-2">
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
                        <div className="grid grid-cols-3 gap-2">
                          <div className="bg-muted/50 rounded-lg p-2 text-center">
                            <p className="text-xs text-muted-foreground">Intrebari</p>
                            <p className="text-base font-bold text-foreground">{score.total}</p>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-2 text-center">
                            <p className="text-xs text-muted-foreground">Corecte</p>
                            <p className="text-base font-bold text-green-500">{score.correct}</p>
                          </div>
                          <div className="bg-muted/50 rounded-lg p-2 text-center">
                            <p className="text-xs text-muted-foreground">Gresite</p>
                            <p className="text-base font-bold text-red-400">{score.total - score.correct}</p>
                          </div>
                        </div>
                        <div
                          className="w-full py-2 rounded-lg font-medium text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          style={{ backgroundColor: `${subject.color}20`, color: subject.color }}
                          onClick={(e) => { e.stopPropagation(); onPracticeSubject(subject.name); }}
                        >
                          <Play className="w-3.5 h-3.5" /> Practica acum
                        </div>
                      </>
                    ) : (
                      <div className="text-center py-3">
                        <p className="text-xs text-muted-foreground mb-2">Nicio activitate la aceasta materie</p>
                        <button
                          onClick={(e) => { e.stopPropagation(); onPracticeSubject(subject.name); }}
                          className="py-2 px-4 rounded-lg text-xs font-medium flex items-center justify-center gap-1.5 transition-colors mx-auto"
                          style={{ backgroundColor: `${subject.color}20`, color: subject.color }}
                        >
                          <Play className="w-3.5 h-3.5" /> Incepe acum
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Total study time card */}
      <div className="bg-card rounded-xl p-4 border border-border">
        <div className="flex items-center gap-2 mb-2">
          <Clock className="w-4 h-4 text-primary" />
          <h3 className="font-bold text-foreground text-sm" style={{ fontFamily: "var(--font-syne)" }}>Timp total de studiu</h3>
        </div>
        <p className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-syne)" }}>
          {formatTime(totalStudyTime)}
        </p>
        <p className="text-xs text-muted-foreground mt-0.5">
          Bazat pe intrebarile rezolvate si timpul activ in aplicatie
        </p>
      </div>

      {/* Reset Progress */}
      <button onClick={onResetProgress} className="w-full py-3 rounded-xl font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors flex items-center justify-center gap-2 text-sm">
        <RotateCcw className="w-4 h-4" /> Reseteaza progresul
      </button>
    </div>
  );
}
