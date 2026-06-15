"use client";

import { useState } from "react";
import { ArrowLeft, Bell, Palette, BarChart3, Trash2, BookOpen, Pencil, RotateCcw } from "lucide-react";
import type { Settings } from "@/components/types";
import BacProfileQuiz from "@/components/auth/BacProfileQuiz";

interface SettingsScreenProps {
  settings: Settings;
  setSettings: (settings: Settings) => void;
  onBack: () => void;
  showToastMessage: (msg: string) => void;
  userBacProfile?: string | null;
  activeSubjects?: string[] | null;
  onBacProfileChange?: (bacProfile: string, selectedSubjects: string[]) => void;
  onResetBacProfile?: () => void;
}

function ToggleSwitch({ checked, onChange, disabled = false }: { checked: boolean; onChange: () => void; disabled?: boolean }) {
  return (
    <button
      onClick={onChange}
      disabled={disabled}
      className={`w-12 h-6 rounded-full transition-colors relative ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      } ${checked ? "bg-primary" : "bg-muted"}`}
    >
      <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${checked ? "translate-x-7" : "translate-x-1"}`} />
    </button>
  );
}

export default function SettingsScreen({
  settings,
  setSettings,
  onBack,
  showToastMessage,
  userBacProfile,
  activeSubjects,
  onBacProfileChange,
  onResetBacProfile,
}: SettingsScreenProps) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [showDeleteChatConfirm, setShowDeleteChatConfirm] = useState(false);
  const [showDeleteAccountConfirm, setShowDeleteAccountConfirm] = useState(false);
  const [showBacQuiz, setShowBacQuiz] = useState(false);

  const handleToggle = (key: keyof Settings) => {
    if (key === "darkMode") return;
    const newSettings = { ...localSettings, [key]: !localSettings[key] };
    setLocalSettings(newSettings);
    setSettings(newSettings);
  };

  const profileLabels: Record<string, string> = {
    real: "Real",
    uman: "Umanist",
    stiinte: "Științe",
    info: "Info / Tech",
    custom: "Personalizat",
    all: "Toate materiile",
  };

  const getProfileSummary = () => {
    if (!userBacProfile) return "Toate materiile";
    const label = profileLabels[userBacProfile] || userBacProfile;
    const count = activeSubjects?.length || 9;
    return `${label} — ${count} materii`;
  };

  return (
    <div className="fixed inset-0 bg-[#08080D] z-[150] animate-in slide-in-from-right duration-300">
      <div className="h-full flex flex-col p-4 max-w-md mx-auto overflow-y-auto">
        {/* Header */}
        <button onClick={onBack} className="flex items-center gap-2 text-foreground mb-6 hover:text-primary transition-colors">
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium">Inapoi</span>
        </button>

        <h1 className="text-2xl font-bold text-foreground mb-8" style={{ fontFamily: "var(--font-syne)" }}>
          Setari
        </h1>

        <div className="space-y-6 pb-8">
          {/* Notifications */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Bell className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Notificari</h2>
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <span className="text-foreground">Notificari push</span>
                <ToggleSwitch checked={localSettings.pushNotifications} onChange={() => handleToggle("pushNotifications")} />
              </div>
              <div className="flex items-center justify-between p-4 border-b border-border">
                <span className="text-foreground">Reminder zilnic de studiu</span>
                <ToggleSwitch checked={localSettings.dailyReminder} onChange={() => handleToggle("dailyReminder")} />
              </div>
              <div className="flex items-center justify-between p-4">
                <span className="text-foreground">Rezultate teste</span>
                <ToggleSwitch checked={localSettings.testResults} onChange={() => handleToggle("testResults")} />
              </div>
            </div>
          </div>

          {/* Appearance */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Palette className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Aspect</h2>
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <div>
                  <span className="text-foreground">Mod intunecat</span>
                  <p className="text-xs text-muted-foreground">Activat permanent</p>
                </div>
                <ToggleSwitch checked={localSettings.darkMode} onChange={() => handleToggle("darkMode")} disabled />
              </div>
              <div className="flex items-center justify-between p-4">
                <span className="text-foreground">Animatii reduse</span>
                <ToggleSwitch checked={localSettings.reducedAnimations} onChange={() => handleToggle("reducedAnimations")} />
              </div>
            </div>
          </div>

          {/* Privacy */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BarChart3 className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Confidentialitate</h2>
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <span className="text-foreground">Statistici anonime</span>
                <ToggleSwitch checked={localSettings.anonymousStats} onChange={() => handleToggle("anonymousStats")} />
              </div>
              <div className="flex items-center justify-between p-4">
                <span className="text-foreground">Istoric conversatii</span>
                <ToggleSwitch checked={localSettings.chatHistory} onChange={() => handleToggle("chatHistory")} />
              </div>
            </div>
          </div>

          {/* BAC Profile */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-4 h-4 text-primary" />
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Profil BAC</h2>
            </div>
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <div className="p-4 border-b border-border">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-foreground font-medium">Profilul tău</span>
                    <p className="text-xs text-muted-foreground mt-0.5">{getProfileSummary()}</p>
                  </div>
                  <button
                    onClick={() => setShowBacQuiz(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-medium"
                  >
                    <Pencil className="w-3.5 h-3.5" /> Schimbă
                  </button>
                </div>
                {activeSubjects && activeSubjects.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    {activeSubjects.map((s) => (
                      <span key={s} className="text-[11px] bg-primary/10 text-primary px-2 py-0.5 rounded-full">{s}</span>
                    ))}
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  if (onResetBacProfile) onResetBacProfile();
                  showToastMessage("Profil BAC resetat. Vezi toate materiile.");
                }}
                className="w-full p-4 flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                <RotateCcw className="w-4 h-4" /> Resetează la toate materiile
              </button>
            </div>
          </div>

          {/* Account */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Trash2 className="w-4 h-4 text-red-400" />
              <h2 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Cont</h2>
            </div>
            <div className="space-y-3">
              <button onClick={() => setShowDeleteChatConfirm(true)} className="w-full bg-red-500/10 text-red-400 py-3 rounded-xl font-medium hover:bg-red-500/20 transition-colors">
                Sterge istoricul chat
              </button>
              <button onClick={() => setShowDeleteAccountConfirm(true)} className="w-full border border-red-500/50 text-red-400 py-3 rounded-xl font-medium hover:bg-red-500/10 transition-colors">
                Sterge contul
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Delete Chat Confirmation */}
      {showDeleteChatConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4">
          <div className="bg-card rounded-2xl p-6 max-w-sm w-full border border-border">
            <h3 className="text-xl font-bold text-foreground mb-2" style={{ fontFamily: "var(--font-syne)" }}>Sterge istoricul</h3>
            <p className="text-muted-foreground mb-4">Esti sigur ca vrei sa stergi tot istoricul conversatiilor?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteChatConfirm(false)} className="flex-1 py-3 rounded-xl font-medium bg-muted text-foreground hover:bg-muted/80 transition-colors">Anuleaza</button>
              <button onClick={() => { setShowDeleteChatConfirm(false); showToastMessage("Istoricul a fost sters"); }} className="flex-1 py-3 rounded-xl font-medium bg-red-500 text-white hover:bg-red-600 transition-colors">Sterge</button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Account Confirmation */}
      {showDeleteAccountConfirm && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[200] p-4">
          <div className="bg-card rounded-2xl p-6 max-w-sm w-full border border-border">
            <h3 className="text-xl font-bold text-foreground mb-2" style={{ fontFamily: "var(--font-syne)" }}>Sterge contul</h3>
            <p className="text-muted-foreground mb-4">Aceasta actiune este ireversibila. Toate datele tale vor fi sterse permanent.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteAccountConfirm(false)} className="flex-1 py-3 rounded-xl font-medium bg-muted text-foreground hover:bg-muted/80 transition-colors">Anuleaza</button>
              <button onClick={() => { setShowDeleteAccountConfirm(false); showToastMessage("Contul a fost sters"); }} className="flex-1 py-3 rounded-xl font-medium bg-red-500 text-white hover:bg-red-600 transition-colors">Sterge contul</button>
            </div>
          </div>
        </div>
      )}

      {/* BAC Profile Quiz Modal (from Settings) */}
      {showBacQuiz && (
        <BacProfileQuiz
          initialProfile={userBacProfile || undefined}
          initialSubjects={activeSubjects || undefined}
          onComplete={(bacProfile, subjects) => {
            if (onBacProfileChange) onBacProfileChange(bacProfile, subjects);
            setShowBacQuiz(false);
            showToastMessage("Profil BAC actualizat!");
          }}
          onSkip={() => setShowBacQuiz(false)}
        />
      )}
    </div>
  );
}
