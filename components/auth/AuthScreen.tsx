"use client";

import { useState } from "react";
import { Loader, Eye, EyeOff } from "lucide-react";
import { signUpWithEmail, signInWithEmail, signInWithGoogle } from "@/lib/supabase";
import BacProfileQuiz from "./BacProfileQuiz";

interface AuthScreenProps {
  onAuthSuccess: () => void;
  showToastMessage: (msg: string) => void;
  onBacProfileComplete?: (bacProfile: string, selectedSubjects: string[]) => void;
}

export default function AuthScreen({ onAuthSuccess, showToastMessage, onBacProfileComplete }: AuthScreenProps) {
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showBacQuiz, setShowBacQuiz] = useState(false);

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (mode === "signup") {
        if (!fullName.trim()) {
          setError("Introdu numele complet");
          setIsLoading(false);
          return;
        }
        await signUpWithEmail(email, password, fullName);
        showToastMessage("Cont creat! Verifica email-ul pentru confirmare.");
        setShowBacQuiz(true);
      } else {
        await signInWithEmail(email, password);
        onAuthSuccess();
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.message?.includes("Invalid login")) {
        setError("Email sau parola incorecta");
      } else if (err.message?.includes("already registered")) {
        setError("Acest email este deja inregistrat");
      } else if (err.message?.includes("password")) {
        setError("Parola trebuie sa aiba minim 6 caractere");
      } else {
        setError(err.message || "A aparut o eroare");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError("");
    setIsLoading(true);
    try {
      await signInWithGoogle();
      // Google auth redirects away, so no BacProfile quiz here — user lands back with profile loaded
    } catch (err: any) {
      console.error("Google auth error:", err);
      setError("Eroare la autentificarea cu Google");
      setIsLoading(false);
    }
  };

  const handleBacComplete = (bacProfile: string, selectedSubjects: string[]) => {
    if (onBacProfileComplete) {
      onBacProfileComplete(bacProfile, selectedSubjects);
    }
    setShowBacQuiz(false);
    onAuthSuccess();
  };

  return (
    <div className="fixed inset-0 bg-[#08080D] flex items-center justify-center z-[200] p-4">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl font-bold text-white">B</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-syne)" }}>
            BACsmart
          </h1>
          <p className="text-muted-foreground text-sm mt-1">Pregatirea ta pentru BAC</p>
        </div>

        {/* Auth Form */}
        <div className="bg-card rounded-2xl p-6 border border-border">
          <h2 className="text-xl font-bold text-foreground mb-6 text-center" style={{ fontFamily: "var(--font-syne)" }}>
            {mode === "login" ? "Conecteaza-te" : "Creeaza cont"}
          </h2>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleEmailAuth} className="space-y-4">
            {mode === "signup" && (
              <div>
                <label className="block text-sm text-muted-foreground mb-2">Nume complet</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Alexandru Popescu"
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                  disabled={isLoading}
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-muted-foreground mb-2">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@exemplu.com"
                className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                disabled={isLoading}
                required
              />
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-2">Parola</label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minim 6 caractere"
                  className="w-full bg-muted border border-border rounded-xl px-4 py-3 text-foreground focus:outline-none focus:ring-2 focus:ring-primary pr-12"
                  disabled={isLoading}
                  required
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground py-3 rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader className="w-5 h-5 animate-spin" />
                  Se proceseaza...
                </>
              ) : mode === "login" ? (
                "Conecteaza-te"
              ) : (
                "Creeaza cont"
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-border" />
            <span className="text-muted-foreground text-sm">sau</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Google Auth */}
          <button
            onClick={handleGoogleAuth}
            disabled={isLoading}
            className="w-full bg-white text-gray-800 py-3 rounded-xl font-medium hover:bg-gray-100 transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continua cu Google
          </button>

          {/* Toggle Mode */}
          <p className="text-center text-muted-foreground text-sm mt-6">
            {mode === "login" ? "Nu ai cont?" : "Ai deja cont?"}{" "}
            <button
              onClick={() => { setMode(mode === "login" ? "signup" : "login"); setError(""); }}
              className="text-primary hover:underline font-medium"
            >
              {mode === "login" ? "Creeaza cont" : "Conecteaza-te"}
            </button>
          </p>
        </div>
      </div>

      {/* BAC Profile Quiz after signup */}
      {showBacQuiz && <BacProfileQuiz onComplete={handleBacComplete} />}
    </div>
  );
}
