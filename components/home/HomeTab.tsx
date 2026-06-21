"use client";

import { Crown, ChevronRight, Flame, BookOpen, Zap, User, Settings, LogOut, HelpCircle, Bell } from "lucide-react";
import type { Subject, SubjectScores } from "@/components/types";

function StatCard({ icon, value, label, color }: { icon: React.ReactNode; value: string; label: string; color: string }) {
  return (
    <div className="bg-card rounded-xl p-3 border border-border">
      <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: `${color}20`, color }}>
        {icon}
      </div>
      <p className="text-lg sm:text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-syne)" }}>
        {value}
      </p>
      <p className="text-[10px] sm:text-xs text-muted-foreground">{label}</p>
    </div>
  );
}

function SubjectCard({ subject, onClick }: { subject: Subject; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="bg-card rounded-xl p-3 border border-border hover:border-primary/50 transition-colors cursor-pointer text-left w-full"
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl" style={{ color: subject.color }}>{subject.icon}</span>
        <span className="text-sm font-medium text-foreground truncate">{subject.name}</span>
      </div>
      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all" style={{ width: `${subject.progress}%`, backgroundColor: subject.color }} />
      </div>
      <p className="text-xs text-muted-foreground mt-1">{subject.progress}%</p>
    </button>
  );
}

interface HomeTabProps {
  subjectsState: Subject[];
  subjectScores: SubjectScores;
  userProfile: { id: string; email: string; full_name: string | null; avatar_url: string | null } | null;
  onSubjectClick: (subject: Subject) => void;
  onPremiumClick: () => void;
  showProfileMenu: boolean;
  setShowProfileMenu: (show: boolean) => void;
  currentPlan: string;
  onProfileClick: () => void;
  onSettingsClick: () => void;
  onLogoutClick: () => void;
  onHelpClick: () => void;
  onNotificationsClick: () => void;
  dailyUsage?: { chat: number; answers: number; summaries: number; quizzes: number };
  streakDays?: number;
}

export default function HomeTab({
  subjectsState,
  subjectScores,
  userProfile,
  onSubjectClick,
  onPremiumClick,
  showProfileMenu,
  setShowProfileMenu,
  currentPlan,
  onProfileClick,
  onSettingsClick,
  onLogoutClick,
  onHelpClick,
  onNotificationsClick,
  dailyUsage,
  streakDays = 0,
}: HomeTabProps) {
  const firstName = userProfile?.full_name?.split(" ")[0] || "Elev";
  const initials = userProfile?.full_name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2) || "?";
  const avatarUrl = userProfile?.avatar_url;

  // Calculeaza statistici reale
  const totalCorrect = Object.values(subjectScores).reduce((acc, s) => acc + (s.correct || 0), 0);
  const totalQuestions = Object.values(subjectScores).reduce((acc, s) => acc + (s.total || 0), 0);
  const avgAccuracy = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  return (
    <div className="space-y-5 pt-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-syne)" }}>
            Buna, {firstName}
          </h1>
          <p className="text-sm text-muted-foreground">Hai să învățăm!</p>
        </div>
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="w-11 h-11 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold hover:opacity-90 transition-opacity overflow-hidden"
          >
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            ) : (
              initials
            )}
          </button>
          {currentPlan !== "free" && (
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
              <Crown className="w-3 h-3 text-primary-foreground" />
            </div>
          )}
          {showProfileMenu && (
            <div className="absolute right-0 top-14 w-56 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="p-3 border-b border-border">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold overflow-hidden">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground text-sm">{userProfile?.full_name || "Utilizator"}</p>
                    <p className="text-xs text-muted-foreground">{userProfile?.email || ""}</p>
                  </div>
                </div>
                <div className="mt-2">
                  {currentPlan === "free" ? (
                    <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-medium">GRATUIT</span>
                  ) : (
                    <span className="text-xs bg-yellow-500/20 text-yellow-500 px-2 py-0.5 rounded-full font-medium">PREMIUM</span>
                  )}
                </div>
              </div>
              <div className="py-1">
                <button onClick={onProfileClick} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors">
                  <User className="w-4 h-4" /> Profilul meu
                </button>
                <button onClick={onSettingsClick} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors">
                  <Settings className="w-4 h-4" /> Setari
                </button>
                <button onClick={onNotificationsClick} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors">
                  <Bell className="w-4 h-4" /> Notificari
                </button>
                <button onClick={onHelpClick} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors">
                  <HelpCircle className="w-4 h-4" /> Ajutor
                </button>
                <div className="border-t border-border mt-1 pt-1">
                  <button onClick={onLogoutClick} className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:bg-muted transition-colors">
                    <LogOut className="w-4 h-4" /> Deconectare
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <StatCard icon={<Flame className="w-4 h-4" />} value={String(streakDays)} label="Zile activ" color="#FF6B35" />
        <StatCard icon={<BookOpen className="w-4 h-4" />} value={String(totalQuestions)} label="Intrebari" color="#4ECDC4" />
        <StatCard icon={<Zap className="w-4 h-4" />} value={totalQuestions > 0 ? `${avgAccuracy}%` : "0%"} label="Medie" color="#A855F7" />
      </div>

      {/* Continue Learning Card */}
      <div className="bg-card rounded-2xl p-4 border-2 border-primary relative overflow-hidden">
        <div className="absolute top-0 right-0 w-24 h-24 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">&sum;</span>
            <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full">In progres</span>
          </div>
          <h3 className="font-bold text-lg text-foreground" style={{ fontFamily: "var(--font-syne)" }}>
            {subjectsState[0]?.name || "Matematica"}
          </h3>
          <p className="text-sm text-muted-foreground mb-3">
            {subjectsState[0]?.progress || 0}% progres
          </p>
          <div className="flex items-center justify-between">
            <div className="flex-1 mr-4">
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${subjectsState[0]?.progress || 0}%` }} />
              </div>
            </div>
            <button
              onClick={() => onSubjectClick(subjectsState[0])}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-xl text-sm font-medium flex items-center gap-1 hover:opacity-90 transition-opacity"
            >
              Continua <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Subject Grid */}
      <div>
        <h2 className="font-bold text-lg mb-3 text-foreground" style={{ fontFamily: "var(--font-syne)" }}>
          Materii
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
          {subjectsState.map((subject) => (
            <SubjectCard key={subject.name} subject={subject} onClick={() => onSubjectClick(subject)} />
          ))}
        </div>
      </div>

      {/* Usage Remaining (free tier) */}
      {currentPlan === "free" && dailyUsage && (
        <div className="bg-card rounded-2xl p-4 border border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-foreground" style={{ fontFamily: "var(--font-syne)" }}>
              Limita zilnică
            </h3>
            <button onClick={onPremiumClick} className="text-[10px] text-primary font-medium hover:underline">
              Upgrade →
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-muted/50 rounded-lg px-3 py-2">
              <p className="text-xs text-muted-foreground">Chat AI</p>
              <p className="text-sm font-bold text-foreground">
                {Math.max(0, 10 - dailyUsage.chat)}/<span className="text-muted-foreground">10</span>
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg px-3 py-2">
              <p className="text-xs text-muted-foreground">Teste</p>
              <p className="text-sm font-bold text-foreground">
                {Math.max(0, 10 - dailyUsage.answers)}/<span className="text-muted-foreground">10</span>
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg px-3 py-2">
              <p className="text-xs text-muted-foreground">Rezumate</p>
              <p className="text-sm font-bold text-foreground">
                {Math.max(0, 1 - dailyUsage.summaries)}/<span className="text-muted-foreground">1</span>
              </p>
            </div>
            <div className="bg-muted/50 rounded-lg px-3 py-2">
              <p className="text-xs text-muted-foreground">Quiz-uri</p>
              <p className="text-sm font-bold text-foreground">
                {Math.max(0, 1 - dailyUsage.quizzes)}/<span className="text-muted-foreground">1</span>
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Freemium Alert */}
      {currentPlan === "free" && (
        <button onClick={onPremiumClick} className="w-full bg-card rounded-xl p-3 border border-primary/30 flex items-center gap-3 hover:bg-muted/50 transition-colors">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Crown className="w-4 h-4 text-primary" />
          </div>
          <div className="flex-1 text-left">
            <p className="text-sm text-foreground font-medium">Deblochează Premium</p>
            <p className="text-xs text-muted-foreground">Acces nelimitat — de la 19 lei prima lună</p>
          </div>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </button>
      )}
    </div>
  );
}
