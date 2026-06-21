"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import {
  Send, ChevronRight, Check, X, User, Settings, LogOut,
  Upload, Save, ArrowLeft, Trash2, RefreshCw, AlertTriangle,
  HelpCircle, Camera, FileText,
} from "lucide-react";

import { getAllQuestions, correctToIndex } from "@/data/bac-questions";
import {
  supabase, getOrCreateProfile, saveChatMessage, getChatHistory,
  saveTestScore, getAggregatedScores, saveSubjectProgress,
  getSubjectProgress, saveSummary as saveSummaryToDb,
  getSummaries, deleteSummary as deleteSummaryFromDb,
  saveQuiz, getQuizzes, deleteQuiz, saveBacPreferences,
  resetUserProgress, apiFetch, getDailyUsage, type UserProfile, type SavedQuiz,
} from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import { useBackButton } from "@/lib/use-back-button";

import type { Tab, Message, Subject, GeneratedSummaryData, SubjectScores, NotificationItem } from "@/components/types";
import { AppLayout, FullScreenOverlay, PageHeader } from "@/components/layout";
import HomeTab from "@/components/home/HomeTab";
import ChatTab from "@/components/chat/ChatTab";
import TestsTab from "@/components/tests/TestsTab";
import RezumateTab from "@/components/rezumate/RezumateTab";
import ProgressTab from "@/components/progress/ProgressTab";
import PremiumTab from "@/components/premium/PremiumTab";
import ProfileScreen from "@/components/profile/ProfileScreen";
import SettingsScreen from "@/components/settings/SettingsScreen";
import HelpScreen from "@/components/help/HelpScreen";
import NotificationsScreen from "@/components/help/NotificationsScreen";
import AuthScreen from "@/components/auth/AuthScreen";
import DocumentQuizUploadScreen from "@/components/tests/DocumentQuizUploadScreen";
import DocumentQuizQuestionScreen from "@/components/tests/DocumentQuizQuestionScreen";

const subjects: Subject[] = [
  { name: "Matematică", icon: "∑", progress: 73, color: "#FF6B35" },
  { name: "Română", icon: "Ă", progress: 65, color: "#4ECDC4" },
  { name: "Istorie", icon: "⚔", progress: 58, color: "#A855F7" },
  { name: "Geografie", icon: "🌍", progress: 30, color: "#10B981" },
  { name: "Biologie", icon: "🧬", progress: 42, color: "#22C55E" },
  { name: "Fizică", icon: "⚡", progress: 51, color: "#F59E0B" },
  { name: "Chimie", icon: "⚗", progress: 38, color: "#3B82F6" },
  { name: "Informatică", icon: "</>", progress: 81, color: "#EC4899" },
  { name: "Logică", icon: "🧠", progress: 20, color: "#8B5CF6" },
];

const allTestQuestions = getAllQuestions().map((q) => ({
  subject: q.subject,
  question: q.question,
  answers: [q.options.A, q.options.B, q.options.C, q.options.D],
  correct: correctToIndex(q.correct),
  explanation: q.explanation,
}));

export default function BACsmartApp() {
  const { user: authUser, loading: authLoading } = useAuth();
  const { pushScreen, popScreen, clearStack } = useBackButton(
    (screenId: string) => {
      // Called by hardware back button — close the correct screen
      switch (screenId) {
        case "profile": setShowProfileScreen(false); break
        case "settings": setShowSettingsScreen(false); break
        case "help": setShowHelpScreen(false); break
        case "notifications": setShowNotificationsScreen(false); break
        case "saved-quizzes": setShowSavedQuizList(false); break
        case "document-quiz": setShowDocumentQuizUpload(false); setDocumentQuizFile(null); setIsGeneratingQuiz(false); break
        case "premium-modal": setShowPremiumModal(false); break
      }
    },
  )

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showAuthScreen, setShowAuthScreen] = useState(true);

  const [dailyUsage, setDailyUsage] = useState<{ chat: number; answers: number; summaries: number; quizzes: number }>(() => {
    try {
      const saved = localStorage.getItem("bacsmart_daily_usage");
      const today = new Date().toISOString().split("T")[0];
      const savedDate = localStorage.getItem("bacsmart_daily_usage_date");
      // If saved date is not today, reset
      if (saved && savedDate === today) return JSON.parse(saved);
    } catch {}
    return { chat: 0, answers: 0, summaries: 0, quizzes: 0 };
  });

  const persistDailyUsage = (usage: { chat: number; answers: number; summaries: number; quizzes: number }) => {
    try {
      localStorage.setItem("bacsmart_daily_usage", JSON.stringify(usage));
      localStorage.setItem("bacsmart_daily_usage_date", new Date().toISOString().split("T")[0]);
    } catch {}
  };

  const [streakDays, setStreakDays] = useState<number>(() => {
    try {
      const saved = localStorage.getItem("bacsmart_streak_days");
      const lastDate = localStorage.getItem("bacsmart_streak_last_date");
      const today = new Date().toISOString().split("T")[0];
      if (saved && lastDate) {
        // If last activity was yesterday or today, keep streak
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split("T")[0];
        if (lastDate === today || lastDate === yesterdayStr) {
          return parseInt(saved) || 0;
        }
        // More than 1 day gap = reset streak
        return 0;
      }
    } catch {}
    return 0;
  });

  const updateStreak = () => {
    const today = new Date().toISOString().split("T")[0];
    const lastDate = localStorage.getItem("bacsmart_streak_last_date");
    if (lastDate === today) return; // Already counted today
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayStr = yesterday.toISOString().split("T")[0];
    let newStreak: number;
    if (lastDate === yesterdayStr) {
      newStreak = streakDays + 1;
    } else {
      newStreak = 1; // First day or gap
    }
    setStreakDays(newStreak);
    try {
      localStorage.setItem("bacsmart_streak_days", String(newStreak));
      localStorage.setItem("bacsmart_streak_last_date", today);
    } catch {}
  };

  const incrementLocalUsage = (field: "chat" | "answers" | "summaries" | "quizzes") => {
    setDailyUsage((prev) => {
      const updated = { ...prev, [field]: prev[field] + 1 };
      persistDailyUsage(updated);
      return updated;
    });
  };

  const goToPremium = () => {
    pushScreen("premium", "Premium");
    setActiveTab("premium");
  };

  // Navigation stack helpers for back button on Android/iOS
  const openScreen = useCallback((screenId: string, screenLabel: string, openFn: () => void) => {
    pushScreen(screenId, screenLabel);
    openFn();
  }, [pushScreen]);

  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [selectedSubject, setSelectedSubject] = useState(subjects[0]);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, text: "Salut! Sunt asistentul tau AI pentru BAC. Mesaje nelimitate - intreaba-ma orice!", isUser: false },
  ]);
  const [newMessage, setNewMessage] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showProfileScreen, setShowProfileScreen] = useState(false);
  const [showSettingsScreen, setShowSettingsScreen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const [subjectsState, setSubjectsState] = useState(subjects);

  const [settings, setSettings] = useState(() => {
    if (typeof window !== "undefined") {
      try {
        const saved = localStorage.getItem("bacsmart_settings");
        if (saved) return JSON.parse(saved);
      } catch {}
    }
    return {
      pushNotifications: true,
      dailyReminder: true,
      testResults: true,
      darkMode: true,
      reducedAnimations: false,
      anonymousStats: true,
      chatHistory: true,
    };
  });

  const [showPremiumModal, setShowPremiumModal] = useState(false);
  const [premiumModalType, setPremiumModalType] = useState<"monthly" | "annual">("monthly");
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [currentPlan, setCurrentPlan] = useState<"free" | "premium" | "annual">("free");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const [usedQuestionIndices, setUsedQuestionIndices] = useState<number[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [testSubjectFilter, setTestSubjectFilter] = useState("Toate");
  // Load saved scores from localStorage on mount
  const [subjectScores, setSubjectScores] = useState<SubjectScores>(() => {
    try {
      const saved = localStorage.getItem("bacsmart_scores");
      return saved ? JSON.parse(saved) : {};
    } catch { return {}; }
  });

  const [showDocumentQuizUpload, setShowDocumentQuizUpload] = useState(false);
  const [documentQuizFile, setDocumentQuizFile] = useState<File | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [generatedQuizQuestions, setGeneratedQuizQuestions] = useState<any[]>([]);
  const [currentDocQuizIndex, setCurrentDocQuizIndex] = useState(0);
  const [docQuizSelectedAnswer, setDocQuizSelectedAnswer] = useState<number | null>(null);
  const [docQuizShowResult, setDocQuizShowResult] = useState(false);
  const [docQuizScore, setDocQuizScore] = useState(0);
  const [docQuizDifficulty, setDocQuizDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [savedQuizzes, setSavedQuizzes] = useState<SavedQuiz[]>(() => {
    try {
      const q = localStorage.getItem("bacsmart_quizzes");
      return q ? JSON.parse(q) : [];
    } catch { return []; }
  });
  const [showSavedQuizList, setShowSavedQuizList] = useState(false);

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState<GeneratedSummaryData | null>(null);
  const [savedSummaries, setSavedSummaries] = useState<
    { id: number; title: string; subject: string; date: string; summary: string; keyPoints: string[]; questions: string[] }[]
  >(() => {
    try {
      const s = localStorage.getItem("bacsmart_summaries");
      return s ? JSON.parse(s) : [{
        id: 1, title: "Unirea Principatelor", subject: "Istorie", date: "28 Mai 2024",
        summary: "Unirea Principatelor Romane din 1859 reprezinta un moment crucial in istoria nationala...",
        keyPoints: ["Alexandru Ioan Cuza ales domn", "Dubla alegere in Moldova si Tara Romaneasca", "Recunoastere internationala"],
        questions: ["Care a fost semnificatia unirii din 1859?"],
      }];
    } catch { return []; }
  });

  const [showHelpScreen, setShowHelpScreen] = useState(false);
  const [showNotificationsScreen, setShowNotificationsScreen] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);

  const [activeSubjects, setActiveSubjects] = useState<string[] | null>(() => {
    try {
      const s = localStorage.getItem("selected_subjects");
      return s ? JSON.parse(s) : null;
    } catch { return null; }
  });
  const [userBacProfile, setUserBacProfile] = useState<string | null>(() => {
    try {
      return localStorage.getItem("bac_profile");
    } catch { return null; }
  });

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: 1, icon: "🎯", title: "Test completat!", description: "Ai obținut 8/10 la Matematică", time: "acum 2 ore", read: false },
    { id: 2, icon: "📚", title: "Reminder studiu", description: "Nu ai studiat azi. Hai să învățăm!", time: "acum 5 ore", read: false },
    { id: 3, icon: "⭐", title: "Ofertă Premium", description: "7 zile trial gratuit, expiră în 2 zile", time: "ieri", read: true },
    { id: 4, icon: "🏆", title: "Streak 7 zile!", description: "Felicitări! 7 zile consecutive de studiu", time: "acum 2 zile", read: false },
    { id: 5, icon: "📝", title: "Test nou disponibil", description: "20 întrebări noi la Română", time: "acum 3 zile", read: true },
  ]);

  // Apply subject filtering from localStorage on mount
  useEffect(() => {
    if (activeSubjects && activeSubjects.length > 0) {
      setSubjectsState((prev) => prev.filter((s) => activeSubjects.includes(s.name)));
    }
  }, []);

  // Load user data when auth state changes
  useEffect(() => {
    if (authLoading) return;
    if (authUser) {
      setShowAuthScreen(false);
      loadUserData(authUser.id, authUser.email || "", authUser.user_metadata);
    } else {
      setShowAuthScreen(true);
      setUserProfile(null);
    }
  }, [authUser, authLoading]);

  const loadUserData = async (userId: string, email: string, userMetadata?: { full_name?: string; avatar_url?: string }) => {
    try {
      const profile = await getOrCreateProfile(userId, email, userMetadata?.full_name, userMetadata?.avatar_url);
      setUserProfile(profile);

      // Load BAC profile preferences
      let bacSubjects: string[] | null = null;
      if (profile?.bac_profile && profile?.selected_subjects?.length) {
        setUserBacProfile(profile.bac_profile);
        bacSubjects = profile.selected_subjects;
      } else {
        // Check localStorage
        if (typeof window !== "undefined") {
          const localProfile = localStorage.getItem("bac_profile");
          const localSubjects = localStorage.getItem("selected_subjects");
          if (localProfile && localSubjects) {
            setUserBacProfile(localProfile);
            bacSubjects = JSON.parse(localSubjects);
            // Save to DB
            try {
              await saveBacPreferences(userId, localProfile, bacSubjects!);
            } catch (e) { console.error("Error saving bac preferences to DB:", e); }
          }
        }
      }

      // Load scores: DB first, fallback to localStorage
      try {
        const scores = await getAggregatedScores(userId);
        if (Object.keys(scores).length > 0) {
          setSubjectScores(scores);
          try { localStorage.setItem("bacsmart_scores", JSON.stringify(scores)); } catch {}
        } else {
          const localScores = localStorage.getItem("bacsmart_scores");
          if (localScores) setSubjectScores(JSON.parse(localScores));
        }
      } catch {
        const localScores = localStorage.getItem("bacsmart_scores");
        if (localScores) setSubjectScores(JSON.parse(localScores));
      }

      // Load progress: DB first, fallback to localStorage
      let updatedSubjects: typeof subjects = subjects;
      try {
        const progress = await getSubjectProgress(userId);
        if (progress.length > 0) {
          updatedSubjects = subjects.map((s) => {
            const saved = progress.find((p) => p.subject === s.name);
            return saved ? { ...s, progress: saved.progress } : s;
          });
          try { localStorage.setItem("bacsmart_progress", JSON.stringify(updatedSubjects.map((s) => ({ name: s.name, progress: s.progress })))); } catch {}
        } else {
          const localProgress = localStorage.getItem("bacsmart_progress");
          if (localProgress) {
            const parsed = JSON.parse(localProgress);
            updatedSubjects = subjects.map((s) => {
              const found = parsed.find((p: { name: string; progress: number }) => p.name === s.name);
              return found ? { ...s, progress: found.progress } : s;
            });
          }
        }
      } catch {
        const localProgress = localStorage.getItem("bacsmart_progress");
        if (localProgress) {
          try {
            const parsed = JSON.parse(localProgress);
            updatedSubjects = subjects.map((s) => {
              const found = parsed.find((p: { name: string; progress: number }) => p.name === s.name);
              return found ? { ...s, progress: found.progress } : s;
            });
          } catch {}
        }
      }

      // Filter subjects based on BAC preferences
      if (bacSubjects && bacSubjects.length > 0) {
        setActiveSubjects(bacSubjects);
        setSubjectsState(updatedSubjects.filter((s) => bacSubjects.includes(s.name)));
      } else {
        setActiveSubjects(null);
        setSubjectsState(updatedSubjects);
      }

      const chatHistory = await getChatHistory(userId, selectedSubject.name);
      if (chatHistory.length > 0) {
        setMessages(chatHistory.map((msg, i) => ({ id: i + 1, text: msg.content, isUser: msg.role === "user" })));
      }

      try {
        const quizzes = await getQuizzes(userId);
        if (quizzes.length > 0) {
          setSavedQuizzes(quizzes);
          try { localStorage.setItem("bacsmart_quizzes", JSON.stringify(quizzes)); } catch {}
        } else {
          const localQuizzes = localStorage.getItem("bacsmart_quizzes");
          if (localQuizzes) setSavedQuizzes(JSON.parse(localQuizzes));
        }
      } catch {
        const localQuizzes = localStorage.getItem("bacsmart_quizzes");
        if (localQuizzes) setSavedQuizzes(JSON.parse(localQuizzes));
      }

      // Load daily usage — doar daca DB are valori mai mari decat localStorage
      // (previne suprascrierea cu 0 cand randul DB e proaspat creat dar actiunile sunt doar locale)
      try {
        const usage = await getDailyUsage(userId);
        if (usage) {
          const dbUsage = {
            chat: usage.chat_count || 0,
            answers: usage.answer_count || 0,
            summaries: usage.summary_count || 0,
            quizzes: usage.quiz_count || 0,
          };
          setDailyUsage((prev) => {
            const merged = {
              chat: Math.max(prev.chat, dbUsage.chat),
              answers: Math.max(prev.answers, dbUsage.answers),
              summaries: Math.max(prev.summaries, dbUsage.summaries),
              quizzes: Math.max(prev.quizzes, dbUsage.quizzes),
            };
            persistDailyUsage(merged);
            return merged;
          });
        }
      } catch {}

      try {
        const summaries = await getSummaries(userId);
        if (summaries.length > 0) {
          const mapped = summaries.map((s, i) => ({
            id: i + 1, title: s.title, subject: s.subject,
            date: new Date(s.created_at).toLocaleDateString("ro-RO"),
            summary: s.summary, keyPoints: s.key_points, questions: s.questions,
          }));
          setSavedSummaries(mapped);
          try { localStorage.setItem("bacsmart_summaries", JSON.stringify(mapped)); } catch {}
        }
      } catch {}
    } catch (error) {
      console.error("Error loading user data:", error);
    }
  };

  const handleLogout = async () => {
    try { if (supabase) await supabase.auth.signOut(); } catch (e) { console.error("Logout error:", e); }
    window.location.replace("/");
  };

  const prevSubjectRef = useRef<string | null>(null);

  useEffect(() => {
    if (prevSubjectRef.current === null) { prevSubjectRef.current = selectedSubject.name; return; }
    if (prevSubjectRef.current === selectedSubject.name) return;
    prevSubjectRef.current = selectedSubject.name;

    setMessages([{ id: 1, text: `Salut! Sunt profesorul tău AI pentru ${selectedSubject.name}. Întreabă-mă orice despre această materie!`, isUser: false }]);
    setIsTyping(false);
    setNewMessage("");

    if (authUser) {
      getChatHistory(authUser.id, selectedSubject.name)
        .then((chatHistory) => {
          if (chatHistory.length > 0) {
            setMessages(chatHistory.map((msg, i) => ({ id: i + 1, text: msg.content, isUser: msg.role === "user" })));
          }
        })
        .catch((error) => console.error("Error loading chat history for subject:", error));
    }
  }, [selectedSubject, authUser]);

  // Persist settings to localStorage
  useEffect(() => {
    try {
      localStorage.setItem("bacsmart_settings", JSON.stringify(settings));
    } catch {}
  }, [settings]);

  useEffect(() => { if (currentQuestionIndex === null) selectNextQuestion(); }, []);
  useEffect(() => { if (showToast) { const t = setTimeout(() => setShowToast(false), 3000); return () => clearTimeout(t); } }, [showToast]);

  // Scroll lock when any modal is open
  const modalsOpen = showPremiumModal || showProfileScreen || showSettingsScreen || showHelpScreen || showNotificationsScreen || showAuthScreen || showSavedQuizList || showDocumentQuizUpload || showSuccessScreen || (generatedQuizQuestions.length > 0);
  useEffect(() => {
    if (modalsOpen) { document.body.style.overflow = "hidden"; }
    else { document.body.style.overflow = ""; }
    return () => { document.body.style.overflow = ""; };
  }, [modalsOpen]);

  const showToastMessage = (message: string) => { setToastMessage(message); setShowToast(true); };

  const getFilteredQuestions = () => {
    const base = activeSubjects
      ? allTestQuestions.filter((q) => activeSubjects.includes(q.subject))
      : allTestQuestions;
    if (testSubjectFilter === "Toate") return base;
    return base.filter((q) => q.subject === testSubjectFilter);
  };

  const selectNextQuestion = () => {
    const filtered = getFilteredQuestions();
    if (filtered.length === 0) {
      setCurrentQuestionIndex(null);
      return;
    }
    const filteredIndices = filtered.map((q) => allTestQuestions.indexOf(q));
    const available = filteredIndices.filter((idx) => !usedQuestionIndices.includes(idx));
    if (available.length === 0) {
      setUsedQuestionIndices([]);
      setCurrentQuestionIndex(filteredIndices[Math.floor(Math.random() * filteredIndices.length)]);
    } else {
      setCurrentQuestionIndex(available[Math.floor(Math.random() * available.length)]);
    }
  };

  const navigateToChat = (subject: Subject) => { setSelectedSubject(subject); setActiveTab("chat"); };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    const userMsg: Message = { id: messages.length + 1, text: newMessage, isUser: true };
    setMessages((prev) => [...prev, userMsg]);
    const userText = newMessage;
    setNewMessage("");
    setIsTyping(true);

    if (authUser) {
      try { await saveChatMessage(authUser.id, selectedSubject.name, "user", userText); } catch (error) { console.error("Error saving chat message:", error); }
    }

    try {
      const conversation = [...messages, userMsg].map((m) => ({ isUser: m.isUser, text: m.text }));
      const response = await apiFetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: selectedSubject.name, messages: conversation }),
      });
      const data = await response.json();
      const aiResponse = data.reply || "Ne pare rău, nu am putut genera un răspuns. Încearcă din nou.";
      const aiMsg: Message = { id: messages.length + 2, text: aiResponse, isUser: false };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
      incrementLocalUsage("chat");
      updateStreak();
      if (authUser) { try { await saveChatMessage(authUser.id, selectedSubject.name, "assistant", aiResponse); } catch (error) { console.error("Error saving chat message:", error); } }
    } catch (error) {
      console.error("Error generating AI response:", error);
      setMessages((prev) => [...prev, { id: messages.length + 2, text: "A apărut o eroare la generarea răspunsului. Verifică conexiunea și încearcă din nou.", isUser: false }]);
      setIsTyping(false);
    }
  };

  const handleAnswerSubmit = async () => {
    if (selectedAnswer === null || currentQuestionIndex === null) return;
    setShowResult(true);
    const question = allTestQuestions[currentQuestionIndex];
    const isCorrect = selectedAnswer === question.correct;
    const updatedScores = {
      ...subjectScores,
      [question.subject]: { correct: (subjectScores[question.subject]?.correct || 0) + (isCorrect ? 1 : 0), total: (subjectScores[question.subject]?.total || 0) + 1 },
    };
    setSubjectScores(updatedScores);
    incrementLocalUsage("answers");
    updateStreak();
    // Persist to localStorage
    try { localStorage.setItem("bacsmart_scores", JSON.stringify(updatedScores)); } catch {}
    if (authUser) { try { await saveTestScore(authUser.id, question.subject, isCorrect ? 1 : 0, 1); } catch (e) { console.error("DB saveTestScore error:", e); } }
    // Update progress bar based on actual accuracy
    const subjScore = updatedScores[question.subject];
    const newProgress = subjScore.total > 0 ? Math.round((subjScore.correct / subjScore.total) * 100) : 0;
    setSubjectsState((prev) => {
      const updated = prev.map((s) => s.name === question.subject ? { ...s, progress: newProgress } : s);
      // Persist progress to localStorage with latest state
      try { localStorage.setItem("bacsmart_progress", JSON.stringify(updated.map((s) => ({ name: s.name, progress: s.progress })))); } catch {}
      return updated;
    });
  };

  const nextQuestion = () => {
    if (currentQuestionIndex !== null) setUsedQuestionIndices((prev) => [...prev, currentQuestionIndex]);
    setSelectedAnswer(null);
    setShowResult(false);
    selectNextQuestion();
  };

  const resetTestOnFilterChange = (newFilter: string) => {
    setTestSubjectFilter(newFilter);
    setUsedQuestionIndices([]);
    setSelectedAnswer(null);
    setShowResult(false);
    const filtered = newFilter === "Toate" ? allTestQuestions : allTestQuestions.filter((q) => q.subject === newFilter);
    if (filtered.length > 0) {
      setCurrentQuestionIndex(allTestQuestions.indexOf(filtered[Math.floor(Math.random() * filtered.length)]));
    } else {
      setCurrentQuestionIndex(null);
    }
  };

  const handlePremiumClick = (type: "free" | "monthly" | "annual") => {
    if (type === "free") showToastMessage("Esti pe planul gratuit");
    else { setPremiumModalType(type === "monthly" ? "monthly" : "annual"); openScreen("premium-modal", "Premium", () => setShowPremiumModal(true)); }
  };

  const confirmPremium = () => {
    popScreen();
    setShowPremiumModal(false);
    setCurrentPlan(premiumModalType === "monthly" ? "premium" : "annual");
    setShowSuccessScreen(true);
    setTimeout(() => setShowSuccessScreen(false), 3000);
  };

  const generateSummary = async () => {
    if (!uploadedFile) return;
    setIsGenerating(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadedFile);
      const response = await apiFetch("/api/generate-summary", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok || !data.summary) throw new Error(data.error || "Failed to generate summary");
      incrementLocalUsage("summaries");
      updateStreak();
      setGeneratedSummary({ fileName: data.fileName || uploadedFile.name, summary: data.summary, keyPoints: data.keyPoints || [], questions: data.questions || [] });
    } catch (error) {
      console.error("Error generating summary:", error);
      showToastMessage("❌ Eroare la generarea rezumatului. Încearcă din nou.");
    } finally { setIsGenerating(false); }
  };

  const saveSummary = async () => {
    if (!generatedSummary || !uploadedFile) return;
    const newSummary = {
      id: Date.now(), title: uploadedFile.name.replace(/\.[^/.]+$/, ""), subject: "General",
      date: new Date().toLocaleDateString("ro-RO", { day: "numeric", month: "short", year: "numeric" }),
      summary: generatedSummary.summary, keyPoints: generatedSummary.keyPoints, questions: generatedSummary.questions,
    };
    setSavedSummaries((prev) => {
      const updated = [newSummary, ...prev];
      try { localStorage.setItem("bacsmart_summaries", JSON.stringify(updated)); } catch {}
      return updated;
    });
    if (authUser) {
      try {
        const dbRecord = await saveSummaryToDb(authUser.id, newSummary.title, newSummary.subject, newSummary.summary, newSummary.keyPoints, newSummary.questions, uploadedFile.name);
        // Replace local Date.now() ID with real DB UUID for correct deletion
        if (dbRecord?.id) {
          setSavedSummaries((prev) => prev.map((s) =>
            s.id === newSummary.id ? { ...s, id: String(dbRecord.id) as unknown as number } : s
          ));
        }
      } catch (error) { console.error("Error saving summary:", error); }
    }
    setGeneratedSummary(null);
    setUploadedFile(null);
    showToastMessage("Rezumat salvat!");
  };

  const deleteSummary = async (id: number) => {
    setSavedSummaries((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      try { localStorage.setItem("bacsmart_summaries", JSON.stringify(updated)); } catch {}
      return updated;
    });
    if (authUser) { try { await deleteSummaryFromDb(String(id), authUser.id); } catch (error) { console.error("Error deleting summary:", error); } }
    showToastMessage("Rezumat sters");
  };

  const navigateToTests = (subjectOrName: Subject | string) => {
    const subjectName = typeof subjectOrName === "string" ? subjectOrName : subjectOrName.name;
    setTestSubjectFilter(subjectName);
    setActiveTab("tests");
  };

  const handleClearChat = async () => {
    setMessages([{ id: 1, text: `Salut! Sunt profesorul tău AI pentru ${selectedSubject.name}. Întreabă-mă orice despre această materie!`, isUser: false }]);
    if (authUser && supabase) {
      try {
        await supabase.from("chat_messages").delete().eq("user_id", authUser.id).eq("subject", selectedSubject.name);
        showToastMessage("Conversația a fost ștearsă");
      } catch (e) {
        console.error("Error deleting chat:", e);
        showToastMessage("Eroare la ștergere");
      }
    }
  };

  const handleResetProgress = async () => {
    setSubjectsState(subjectsState.map((s) => ({ ...s, progress: 0 })));
    setSubjectScores({});
    setUsedQuestionIndices([]);
    if (authUser) { try { await resetUserProgress(authUser.id); } catch (error) { console.error("Error resetting progress:", error); } }
    showToastMessage("Progresul a fost resetat");
  };

  const generateDocumentQuiz = async (file: File) => {
    setDocumentQuizFile(file);
    setIsGeneratingQuiz(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("difficulty", docQuizDifficulty);
      const response = await apiFetch("/api/analyze-file", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok || !data.questions) throw new Error(data.error || "Failed to generate quiz");
      incrementLocalUsage("quizzes");
      updateStreak();
      setGeneratedQuizQuestions(data.questions);
      setCurrentDocQuizIndex(0);
      setDocQuizSelectedAnswer(null);
      setDocQuizShowResult(false);
      setDocQuizScore(0);
      showToastMessage("✅ Quiz generat din document!");
    } catch (error) {
      console.error("Error generating quiz:", error);
      showToastMessage("❌ Eroare la generarea quiz-ului. Încearcă din nou.");
    } finally { setIsGeneratingQuiz(false); }
  };

  const submitDocQuizAnswer = () => {
    if (docQuizSelectedAnswer === null || !generatedQuizQuestions[currentDocQuizIndex]) return;
    if (docQuizSelectedAnswer === generatedQuizQuestions[currentDocQuizIndex].correct) setDocQuizScore(docQuizScore + 1);
    setDocQuizShowResult(true);
  };

  const saveCurrentQuiz = async () => {
    if (!generatedQuizQuestions.length || !documentQuizFile) return;
    const title = documentQuizFile.name.replace(/\.[^/.]+$/, "");
    const quizData: SavedQuiz = {
      id: Date.now().toString(),
      user_id: authUser?.id ?? '',
      title,
      file_name: documentQuizFile.name,
      difficulty: docQuizDifficulty,
      questions: generatedQuizQuestions,
      score: docQuizScore,
      total: generatedQuizQuestions.length,
      fileName: documentQuizFile.name,
      created_at: new Date().toISOString(),
    };
    setSavedQuizzes((prev) => {
      const updated = [quizData, ...prev];
      // Persist to localStorage with latest state
      try { localStorage.setItem("bacsmart_quizzes", JSON.stringify(updated)); } catch {}
      return updated;
    });
    if (authUser) {
      try {
        const dbQuiz = await saveQuiz(authUser.id, title, documentQuizFile.name, docQuizDifficulty, generatedQuizQuestions, docQuizScore, generatedQuizQuestions.length);
        if (dbQuiz?.id) {
          setSavedQuizzes((prev) => {
            const updated = prev.map((q) => q.id === quizData.id ? { ...q, id: dbQuiz.id } : q);
            try { localStorage.setItem("bacsmart_quizzes", JSON.stringify(updated)); } catch {}
            return updated;
          });
        }
      } catch (e) { console.error("Error saving quiz:", e); }
    }
  };

  const nextDocQuizQuestion = () => {
    if (currentDocQuizIndex < generatedQuizQuestions.length - 1) {
      setCurrentDocQuizIndex(currentDocQuizIndex + 1);
      setDocQuizSelectedAnswer(null);
      setDocQuizShowResult(false);
    } else {
      showToastMessage(`✅ Quiz finalizat! Scor: ${docQuizScore}/${generatedQuizQuestions.length}`);
      saveCurrentQuiz();
      setGeneratedQuizQuestions([]);
      setShowDocumentQuizUpload(false);
      setShowSavedQuizList(false);
    }
  };

  const retakeQuiz = (quiz: SavedQuiz) => {
    setGeneratedQuizQuestions(quiz.questions);
    setCurrentDocQuizIndex(0);
    setDocQuizSelectedAnswer(null);
    setDocQuizShowResult(false);
    setDocQuizScore(0);
    setShowDocumentQuizUpload(false);
    setShowSavedQuizList(false);
  };

  const deleteSavedQuiz = async (id: string) => {
    setSavedQuizzes((prev) => prev.filter((q) => q.id !== id));
    if (authUser) {
      try { await deleteQuiz(id, authUser.id); } catch (e) { console.error("Error deleting quiz:", e); }
    }
    showToastMessage("Test șters");
  };

  const openSavedQuizList = () => {
    openScreen("saved-quizzes", "Teste salvate", () => setShowSavedQuizList(true));
    // Incarca din DB doar daca nu avem deja in state
    if (authUser && savedQuizzes.length === 0) {
      getQuizzes(authUser.id).then((q) => setSavedQuizzes(q)).catch(() => {});
    }
  };

  const getTotalScore = () => {
    let correct = 0, total = 0;
    Object.values(subjectScores).forEach((s) => { correct += s.correct; total += s.total; });
    return { correct, total };
  };

  const isSecondaryScreen =
    showProfileScreen || showSettingsScreen || showHelpScreen || showNotificationsScreen ||
    showSavedQuizList || showDocumentQuizUpload || generatedQuizQuestions.length > 0;

  const hideBottomNav = isSecondaryScreen;

  return (
    <div className="h-full w-full bg-background overflow-x-hidden">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-card border border-border rounded-xl px-4 py-3 shadow-xl z-[100] animate-fade-in">
          <p className="text-sm text-foreground">{toastMessage}</p>
        </div>
      )}

      {/* Premium Modal */}
      {showPremiumModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
          <div className="bg-card rounded-2xl p-6 max-w-sm w-full border border-border">
            <h3 className="text-xl font-bold text-foreground mb-2" style={{ fontFamily: "var(--font-syne)" }}>
              {premiumModalType === "monthly" ? "Premium Lunar" : "Premium Anual"}
            </h3>
            <div className="bg-primary/10 border border-primary/20 rounded-xl p-3 mb-4">
              <p className="text-sm font-bold text-foreground" style={{ fontFamily: "var(--font-syne)" }}>
                🎁 5 zile trial GRATUIT
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Încearcă gratuit toate funcțiile premium. Anulezi oricând în perioada de trial.
              </p>
            </div>
            <p className="text-muted-foreground text-sm mb-2">
              {premiumModalType === "monthly"
                ? "Prima lună doar 19 lei, apoi 49 lei/lună"
                : "35 lei/lună, facturat anual 420 lei — economisești 168 lei"}
            </p>
            <div className="flex gap-3">
              <button onClick={() => { popScreen(); setShowPremiumModal(false); }} className="flex-1 py-3 rounded-xl font-medium bg-muted text-foreground hover:bg-muted/80 transition-colors">Anuleaza</button>
              <button onClick={confirmPremium} className="flex-1 py-3 rounded-xl font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
                {premiumModalType === "monthly" ? "19 lei/lună" : "35 lei/lună"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Screen */}
      {showSuccessScreen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
          <div className="bg-card rounded-2xl p-8 max-w-sm w-full border border-primary text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center mx-auto mb-4">
              <Check className="w-8 h-8 text-green-500" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2" style={{ fontFamily: "var(--font-syne)" }}>Abonament activat!</h3>
            <p className="text-muted-foreground">Acum ai acces la toate functiile BACsmart.</p>
          </div>
        </div>
      )}

      {/* Logout Modal */}
      {showLogoutModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4">
          <div className="bg-card rounded-2xl p-6 max-w-sm w-full border border-border">
            <h3 className="text-xl font-bold text-foreground mb-2" style={{ fontFamily: "var(--font-syne)" }}>Deconectare</h3>
            <p className="text-muted-foreground mb-4">Esti sigur ca vrei sa te deconectezi?</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutModal(false)} className="flex-1 py-3 rounded-xl font-medium bg-muted text-foreground hover:bg-muted/80 transition-colors">Anuleaza</button>
              <button onClick={handleLogout} className="flex-1 py-3 rounded-xl font-medium bg-red-500 text-white hover:bg-red-600 transition-colors">Deconecteaza-ma</button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Progress Modal */}
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
              <button onClick={() => { setShowResetModal(false); handleResetProgress(); }} className="flex-1 py-3 rounded-xl font-medium bg-red-500 text-white hover:bg-red-600 transition-colors">Resetează tot</button>
            </div>
          </div>
        </div>
      )}

      {/* Auth Screen — full-viewport */}
      {(showAuthScreen || !authUser) && !authLoading && (
        <div className="fixed inset-0 bg-background z-[200] overflow-y-auto">
          <AuthScreen
            onAuthSuccess={() => setShowAuthScreen(false)}
            showToastMessage={showToastMessage}
            onBacProfileComplete={(bacProfile, subjects) => {
              setUserBacProfile(bacProfile);
              setActiveSubjects(subjects);
              if (typeof window !== "undefined") {
                localStorage.setItem("bac_profile", bacProfile);
                localStorage.setItem("selected_subjects", JSON.stringify(subjects));
              }
            }}
          />
        </div>
      )}

      {/* Mobile Layout: AppLayout with persistent bottom nav, + overlay screens */}
      {!showAuthScreen && authUser && (
        <AppLayout activeTab={activeTab} onTabChange={setActiveTab} hideNav={hideBottomNav}>
          {/* Tab content */}
          {activeTab === "home" && (
            <HomeTab
              subjectsState={subjectsState} subjectScores={subjectScores}
              userProfile={userProfile}
              onSubjectClick={navigateToTests} onPremiumClick={() => { pushScreen("premium", "Premium"); setActiveTab("premium"); }}
              showProfileMenu={showProfileMenu} setShowProfileMenu={setShowProfileMenu}
              currentPlan={currentPlan}
              onProfileClick={() => { setShowProfileMenu(false); openScreen("profile", "Profil", () => setShowProfileScreen(true)); }}
              onSettingsClick={() => { setShowProfileMenu(false); openScreen("settings", "Setări", () => setShowSettingsScreen(true)); }}
              onLogoutClick={() => { setShowProfileMenu(false); setShowLogoutModal(true); }}
              onHelpClick={() => { setShowProfileMenu(false); openScreen("help", "Ajutor", () => setShowHelpScreen(true)); }}
              onNotificationsClick={() => { setShowProfileMenu(false); openScreen("notifications", "Notificări", () => setShowNotificationsScreen(true)); }}
              dailyUsage={dailyUsage} streakDays={streakDays}
            />
          )}
          {activeTab === "chat" && (
            <ChatTab
              subjects={subjectsState} selectedSubject={selectedSubject}
              setSelectedSubject={setSelectedSubject} messages={messages}
              newMessage={newMessage} setNewMessage={setNewMessage}
              sendMessage={sendMessage} isTyping={isTyping}
              currentPlan={currentPlan} dailyChatUsage={dailyUsage.chat}
              onGoPremium={goToPremium} onClearChat={handleClearChat}
            />
          )}
          {activeTab === "tests" && (
            <TestsTab
              subjects={subjectsState} testSubjectFilter={testSubjectFilter}
              setTestSubjectFilter={resetTestOnFilterChange}
              currentQuestion={currentQuestionIndex !== null ? allTestQuestions[currentQuestionIndex] : null}
              selectedAnswer={selectedAnswer} setSelectedAnswer={setSelectedAnswer}
              showResult={showResult} handleAnswerSubmit={handleAnswerSubmit}
              nextQuestion={nextQuestion} subjectScores={subjectScores}
              totalScore={getTotalScore()} totalQuestions={getFilteredQuestions().length}
              onOpenDocumentQuiz={() => openScreen("document-quiz", "Quiz document", () => setShowDocumentQuizUpload(true))}
              onSavedQuizzes={openSavedQuizList} savedQuizCount={savedQuizzes.length}
              currentPlan={currentPlan} dailyAnswersUsage={dailyUsage.answers}
              dailyQuizzesUsage={dailyUsage.quizzes} onGoPremium={goToPremium}
            />
          )}
          {activeTab === "rezumate" && (
            <RezumateTab
              uploadedFile={uploadedFile} setUploadedFile={setUploadedFile}
              isGenerating={isGenerating} onGenerate={generateSummary}
              generatedSummary={generatedSummary} setGeneratedSummary={setGeneratedSummary}
              savedSummaries={savedSummaries} onSaveSummary={saveSummary}
              onDeleteSummary={deleteSummary} showToastMessage={showToastMessage}
              currentPlan={currentPlan} dailySummaryUsage={dailyUsage.summaries}
              onGoPremium={goToPremium}
            />
          )}
          {activeTab === "progress" && (
            <ProgressTab
              subjects={subjectsState} subjectScores={subjectScores}
              onPracticeSubject={navigateToTests} showToastMessage={showToastMessage}
              onResetProgress={() => setShowResetModal(true)}
            />
          )}
          {activeTab === "premium" && <PremiumTab onPlanClick={handlePremiumClick} currentPlan={currentPlan} />}
        </AppLayout>
      )}

      {/* Profile Screen — full-screen overlay */}
      {showProfileScreen && (
        <FullScreenOverlay>
          <ProfileScreen
            userProfile={userProfile} setUserProfile={setUserProfile}
            currentPlan={currentPlan} onBack={() => { popScreen(); setShowProfileScreen(false); }}
            onUpgradeClick={() => { popScreen(); setShowProfileScreen(false); setActiveTab("premium"); }}
            showToastMessage={showToastMessage}
          />
        </FullScreenOverlay>
      )}

      {/* Settings Screen — full-screen overlay */}
      {showSettingsScreen && (
        <FullScreenOverlay>
          <SettingsScreen
            settings={settings} setSettings={setSettings}
            onBack={() => { popScreen(); setShowSettingsScreen(false); }} showToastMessage={showToastMessage}
            userBacProfile={userBacProfile}
            activeSubjects={activeSubjects}
            onBacProfileChange={(bacProfile, selectedSubjects) => {
              setUserBacProfile(bacProfile);
              setActiveSubjects(selectedSubjects);
              try { localStorage.setItem("bac_profile", bacProfile); } catch {}
              try { localStorage.setItem("selected_subjects", JSON.stringify(selectedSubjects)); } catch {}
              if (authUser) {
                saveBacPreferences(authUser.id, bacProfile, selectedSubjects).catch(console.error);
              }
              setSubjectsState(subjects.filter((s) => selectedSubjects.includes(s.name)));
            }}
            onResetBacProfile={() => {
              setUserBacProfile(null);
              setActiveSubjects(null);
              setSubjectsState(subjects);
              try { localStorage.removeItem("bac_profile"); } catch {}
              try { localStorage.removeItem("selected_subjects"); } catch {}
              if (authUser) {
                saveBacPreferences(authUser.id, "", subjects.map((s) => s.name)).catch(console.error);
              }
            }}
          />
        </FullScreenOverlay>
      )}

      {/* Notifications Screen */}
      {showNotificationsScreen && (
        <FullScreenOverlay>
          <NotificationsScreen notifications={notifications} setNotifications={setNotifications} onBack={() => { popScreen(); setShowNotificationsScreen(false); }} />
        </FullScreenOverlay>
      )}

      {/* Help Screen */}
      {showHelpScreen && (
        <FullScreenOverlay>
          <HelpScreen onBack={() => { popScreen(); setShowHelpScreen(false); }} showToastMessage={showToastMessage} />
        </FullScreenOverlay>
      )}

      {/* Saved Quiz List Screen */}
      {showSavedQuizList && !generatedQuizQuestions.length && (
        <FullScreenOverlay>
          <div className="h-full flex flex-col">
            <PageHeader
              title="Teste salvate"
              onBack={() => { popScreen(); setShowSavedQuizList(false); }}
            />
            {savedQuizzes.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center">
                <FileText className="w-16 h-16 text-muted-foreground/40 mb-4" />
                <p className="text-foreground font-medium mb-1">Niciun test salvat</p>
                <p className="text-muted-foreground text-sm">Testele tale generate vor apărea aici</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto space-y-3 pb-4">
                {savedQuizzes.map((quiz) => (
                  <div key={quiz.id} className="bg-card rounded-xl p-4 border border-border">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground text-sm truncate">{quiz.title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] bg-primary/20 text-primary px-2 py-0.5 rounded-full">
                            {quiz.difficulty === "easy" ? "Ușor" : quiz.difficulty === "medium" ? "Mediu" : "Dificil"}
                          </span>
                          <span className="text-[10px] bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                            {quiz.total} întrebări
                          </span>
                          {quiz.total > 0 && (
                            <span className="text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
                              {Math.round((quiz.score / quiz.total) * 100)}%
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => retakeQuiz(quiz)}
                        className="flex-1 py-2 rounded-lg text-xs font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity flex items-center justify-center gap-1"
                      >
                        <RefreshCw className="w-3.5 h-3.5" /> Refă testul
                      </button>
                      <button
                        onClick={() => deleteSavedQuiz(quiz.id)}
                        className="py-2 px-3 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </FullScreenOverlay>
      )}

      {/* Document Quiz Upload Screen */}
      {showDocumentQuizUpload && !generatedQuizQuestions.length && (
        <FullScreenOverlay>
          <DocumentQuizUploadScreen
            onBack={() => { popScreen(); setShowDocumentQuizUpload(false); setDocumentQuizFile(null); setIsGeneratingQuiz(false); }}
            onFileSelected={generateDocumentQuiz} isGenerating={isGeneratingQuiz}
            difficulty={docQuizDifficulty} setDifficulty={setDocQuizDifficulty}
            onSavedQuizzes={openSavedQuizList} savedQuizCount={savedQuizzes.length}
          />
        </FullScreenOverlay>
      )}

      {/* Document Quiz Question Screen */}
      {generatedQuizQuestions.length > 0 && currentDocQuizIndex < generatedQuizQuestions.length && (
        <FullScreenOverlay>
          <div className="max-w-md sm:max-w-lg mx-auto flex items-center justify-center h-full">
            <DocumentQuizQuestionScreen
              question={generatedQuizQuestions[currentDocQuizIndex]} currentIndex={currentDocQuizIndex}
              totalQuestions={generatedQuizQuestions.length} selectedAnswer={docQuizSelectedAnswer}
              setSelectedAnswer={setDocQuizSelectedAnswer} showResult={docQuizShowResult}
              onSubmit={submitDocQuizAnswer} onNext={nextDocQuizQuestion} score={docQuizScore}
            />
          </div>
        </FullScreenOverlay>
      )}
    </div>
  );
}
