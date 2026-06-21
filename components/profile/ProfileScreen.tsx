"use client";

import { useState } from "react";
import { ArrowLeft, Camera } from "lucide-react";
import type { UserProfile } from "@/lib/supabase";

interface ProfileScreenProps {
  userProfile: UserProfile | null;
  setUserProfile: (profile: UserProfile | null) => void;
  currentPlan: string;
  onBack: () => void;
  onUpgradeClick: () => void;
  showToastMessage: (msg: string) => void;
}

export default function ProfileScreen({
  userProfile,
  setUserProfile,
  currentPlan,
  onBack,
  onUpgradeClick,
  showToastMessage,
}: ProfileScreenProps) {
  const [localProfile, setLocalProfile] = useState({
    name: userProfile?.full_name || "",
    email: userProfile?.email || "",
  });

  const handleSave = async () => {
    if (userProfile) {
      try {
        const { updateProfile } = await import("@/lib/supabase");
        await updateProfile(userProfile.id, { full_name: localProfile.name });
        setUserProfile({ ...userProfile, full_name: localProfile.name });
        showToastMessage("Profilul a fost salvat cu succes!");
      } catch (error) {
        console.error("Error updating profile:", error);
        showToastMessage("Eroare la salvarea profilului");
      }
    }
    onBack();
  };

  const getInitials = () => {
    if (!localProfile.name) return "?";
    return localProfile.name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <button onClick={onBack} className="flex items-center gap-2 text-foreground mb-6 hover:text-primary transition-colors w-fit">
        <ArrowLeft className="w-5 h-5" />
        <span className="font-medium">Inapoi</span>
      </button>

      <h1 className="text-2xl font-bold text-foreground mb-8" style={{ fontFamily: "var(--font-syne)" }}>
        Profilul meu
      </h1>

      {/* Avatar Section */}
      <div className="flex flex-col items-center mb-8">
        <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white text-3xl font-bold mb-3">
          {getInitials()}
        </div>
        <button className="flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors">
          <Camera className="w-4 h-4" /> Schimba poza
        </button>
      </div>

      {/* Form Fields */}
      <div className="space-y-4 flex-1">
        <div>
          <label className="block text-sm text-muted-foreground mb-1.5">Nume complet</label>
          <input
            type="text"
            value={localProfile.name}
            onChange={(e) => setLocalProfile({ ...localProfile, name: e.target.value })}
            className="w-full bg-card border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
          />
        </div>

        <div>
          <label className="block text-sm text-muted-foreground mb-1.5">Email</label>
          <input type="email" value={localProfile.email} disabled className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-muted-foreground cursor-not-allowed" />
          <p className="text-xs text-muted-foreground mt-1">Email-ul nu poate fi schimbat</p>
        </div>

        {/* Current Plan Section */}
        <div className="bg-card border border-border rounded-xl p-4 mt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Plan curent</p>
              <p className="font-medium text-foreground">
                {currentPlan === "free" ? "Gratuit" : currentPlan === "premium" ? "Premium" : "Anual"}
              </p>
            </div>
            {currentPlan === "free" && (
              <button onClick={onUpgradeClick} className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity">
                Upgrade
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Save Button */}
      <button onClick={handleSave} className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl font-medium hover:opacity-90 transition-opacity mt-6">
        Salveaza modificarile
      </button>
    </div>
  );
}
