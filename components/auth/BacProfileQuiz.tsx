"use client";

import { useState } from "react";
import { Check, ChevronRight, Sparkles, ArrowLeft } from "lucide-react";

interface BacProfileQuizProps {
  onComplete: (bacProfile: string, selectedSubjects: string[]) => void;
}

const ALL_SUBJECTS = [
  { name: "Matematică", icon: "∑", color: "#FF6B35" },
  { name: "Română", icon: "Ă", color: "#4ECDC4" },
  { name: "Istorie", icon: "⚔", color: "#A855F7" },
  { name: "Geografie", icon: "🌍", color: "#10B981" },
  { name: "Biologie", icon: "🧬", color: "#22C55E" },
  { name: "Fizică", icon: "⚡", color: "#F59E0B" },
  { name: "Chimie", icon: "⚗", color: "#3B82F6" },
  { name: "Informatică", icon: "</>", color: "#EC4899" },
  { name: "Logică", icon: "🧠", color: "#8B5CF6" },
];

const BAC_PROFILES = [
  {
    id: "real",
    title: "Real",
    description: "Matematică-Informatică / Științe ale Naturii",
    subjects: ["Matematică", "Română"],
    optional: ["Geografie", "Biologie", "Fizică", "Chimie"],
    icon: "📐",
  },
  {
    id: "uman",
    title: "Umanist",
    description: "Filologie / Științe Sociale",
    subjects: ["Română", "Istorie"],
    optional: ["Geografie", "Logică"],
    icon: "📜",
  },
  {
    id: "stiinte",
    title: "Științe",
    description: "Biologie-Chimie / Fizică-Chimie",
    subjects: ["Română", "Biologie"],
    optional: ["Fizică", "Chimie"],
    icon: "🔬",
  },
  {
    id: "info",
    title: "Info / Tech",
    description: "Informatică, Matematică, Română",
    subjects: ["Română", "Matematică", "Informatică"],
    optional: [],
    icon: "💻",
  },
  {
    id: "custom",
    title: "Personalizat",
    description: "Alege exact ce materii te interesează",
    subjects: [],
    optional: ALL_SUBJECTS.map((s) => s.name),
    icon: "🎯",
  },
  {
    id: "all",
    title: "Nu știu încă",
    description: "Voi vedea toate materiile",
    subjects: ALL_SUBJECTS.map((s) => s.name),
    optional: [],
    icon: "🤷",
  },
];

export default function BacProfileQuiz({ onComplete }: BacProfileQuizProps) {
  const [step, setStep] = useState<"profile" | "subjects">("profile");
  const [selectedProfile, setSelectedProfile] = useState<string | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>([]);

  const handleProfileSelect = (profileId: string) => {
    const profile = BAC_PROFILES.find((p) => p.id === profileId);
    if (!profile) return;
    setSelectedProfile(profileId);
    const mandatory = profile.subjects;
    if (profileId === "custom") {
      setSelectedSubjects([]);
      setStep("subjects");
    } else if (profileId === "all") {
      handleComplete("all", mandatory);
    } else {
      setSelectedSubjects(mandatory);
      setStep("subjects");
    }
  };

  const toggleSubject = (name: string) => {
    setSelectedSubjects((prev) =>
      prev.includes(name) ? prev.filter((s) => s !== name) : [...prev, name]
    );
  };

  const handleComplete = (profile: string, subjects: string[]) => {
    const finalSubjects = subjects.length > 0 ? subjects : ALL_SUBJECTS.map((s) => s.name);
    onComplete(profile, finalSubjects);
  };

  const profile = BAC_PROFILES.find((p) => p.id === selectedProfile);

  // Compute which subjects are optional in current profile
  const profileSubjects = profile?.subjects || [];
  const profileOptionals = profile?.optional || [];

  // In custom mode, all subjects are toggleable
  const toggleableSubjects =
    selectedProfile === "custom"
      ? ALL_SUBJECTS
      : ALL_SUBJECTS.filter((s) => profileOptionals.includes(s.name));

  const canProceed = selectedSubjects.length >= 1;

  return (
    <div className="fixed inset-0 bg-[#08080D] flex items-center justify-center z-[200] p-4 overflow-y-auto">
      <div className="w-full max-w-sm py-8">
        {/* Step indicator */}
        <div className="flex items-center justify-center gap-2 mb-6">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              step === "profile" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            1
          </div>
          <div className="w-8 h-0.5 bg-muted rounded" />
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
              step === "subjects" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
            }`}
          >
            2
          </div>
        </div>

        {step === "profile" && (
          <>
            {/* Header */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-3">
                <Sparkles className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-syne)" }}>
                Ce dai la BAC?
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Alege profilul ca să-ți personalizăm experiența
              </p>
            </div>

            {/* Profile cards */}
            <div className="space-y-3">
              {BAC_PROFILES.slice(0, 5).map((p) => (
                <button
                  key={p.id}
                  onClick={() => handleProfileSelect(p.id)}
                  className={`w-full flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all ${
                    selectedProfile === p.id
                      ? "border-primary bg-primary/10"
                      : "border-border bg-card hover:border-primary/50"
                  }`}
                >
                  <span className="text-2xl">{p.icon}</span>
                  <div className="flex-1">
                    <p className="font-medium text-foreground text-sm">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.description}</p>
                    {p.subjects.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {p.subjects.map((s) => (
                          <span
                            key={s}
                            className="text-[10px] bg-primary/15 text-primary px-1.5 py-0.5 rounded"
                          >
                            {s}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              ))}
            </div>

            {/* "Nu știu" button */}
            <button
              onClick={() => handleProfileSelect("all")}
              className="w-full mt-3 py-3 rounded-xl font-medium bg-card border border-border text-muted-foreground hover:text-foreground hover:border-primary/50 transition-all text-sm"
            >
              {BAC_PROFILES[5].icon} {BAC_PROFILES[5].title} — {BAC_PROFILES[5].description}
            </button>
          </>
        )}

        {step === "subjects" && (
          <>
            {/* Back button */}
            <button
              onClick={() => { setStep("profile"); setSelectedProfile(null); }}
              className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" /> Inapoi la profiluri
            </button>

            {/* Header */}
            <div className="mb-6">
              <h1 className="text-xl font-bold text-foreground" style={{ fontFamily: "var(--font-syne)" }}>
                Alege materiile
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {selectedProfile === "custom"
                  ? "Selectează materiile pe care vrei să le studiezi"
                  : `Pentru profilul ${profile?.title}, poți alege și materiile opționale`}
              </p>
            </div>

            {/* Mandatory subjects (not in custom mode) */}
            {selectedProfile !== "custom" && profileSubjects.length > 0 && (
              <div className="mb-4">
                <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">
                  Materii obligatorii
                </p>
                <div className="flex flex-wrap gap-2">
                  {ALL_SUBJECTS.filter((s) => profileSubjects.includes(s.name)).map((s) => (
                    <div
                      key={s.name}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/20 border border-primary/30 text-primary text-sm"
                    >
                      <span>{s.icon}</span>
                      <span>{s.name}</span>
                      <Check className="w-3.5 h-3.5 ml-1" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Toggleable subjects */}
            <p className="text-xs text-muted-foreground mb-2 uppercase tracking-wider font-medium">
              {selectedProfile === "custom" ? "Toate materiile" : "Materii opționale"}
            </p>
            <div className="grid grid-cols-2 gap-2">
              {toggleableSubjects.map((subject) => {
                const isSelected = selectedSubjects.includes(subject.name);
                return (
                  <button
                    key={subject.name}
                    onClick={() => toggleSubject(subject.name)}
                    className={`flex items-center gap-2 p-3 rounded-xl border-2 text-left transition-all ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-primary/50"
                    }`}
                  >
                    <span
                      className={`w-7 h-7 rounded-lg flex items-center justify-center text-sm ${
                        isSelected ? "bg-primary text-primary-foreground" : "bg-muted"
                      }`}
                    >
                      {isSelected ? <Check className="w-4 h-4" /> : subject.icon}
                    </span>
                    <span className="text-sm font-medium text-foreground truncate">
                      {subject.name}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Quick actions */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={() =>
                  setSelectedSubjects(
                    selectedProfile === "custom"
                      ? ALL_SUBJECTS.map((s) => s.name)
                      : [...profileSubjects, ...profileOptionals]
                  )
                }
                className="flex-1 py-2 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                Selectează tot
              </button>
              <button
                onClick={() =>
                  setSelectedSubjects(selectedProfile === "custom" ? [] : [...profileSubjects])
                }
                className="flex-1 py-2 rounded-lg text-xs font-medium bg-muted text-muted-foreground hover:text-foreground transition-colors"
              >
                Deselectează tot
              </button>
            </div>

            {/* Confirm */}
            <button
              onClick={() => {
                if (!selectedProfile) return;
                const allSelected = [...new Set([...profileSubjects, ...selectedSubjects])];
                handleComplete(selectedProfile, allSelected);
              }}
              disabled={!canProceed}
              className={`w-full mt-6 py-3 rounded-xl font-medium flex items-center justify-center gap-2 transition-all ${
                canProceed
                  ? "bg-primary text-primary-foreground hover:opacity-90"
                  : "bg-muted text-muted-foreground cursor-not-allowed"
              }`}
            >
              Gata, hai să învățăm!
              <ChevronRight className="w-4 h-4" />
            </button>

            <p className="text-xs text-muted-foreground text-center mt-2">
              {selectedProfile === "custom"
                ? selectedSubjects.length > 0
                  ? `${selectedSubjects.length} materii selectate`
                  : "Selectează cel puțin o materie"
                : `${profileSubjects.length + selectedSubjects.length} materii selectate`}
            </p>
          </>
        )}
      </div>
    </div>
  );
}
