"use client";

import { useState, useRef, useEffect } from "react";
import {
  Home, MessageCircle, FileText, TrendingUp, Crown,
  Send, ChevronRight, Check, X, Zap, Flame, BookOpen,
  User, Settings, LogOut, Camera, Upload, Save, Share2,
  Bell, HelpCircle, ArrowLeft, Palette, BarChart3, Trash2,
  ChevronDown, Search, Mail, Clock, RefreshCw, Play, Target,
  Calendar, RotateCcw, Image, AlertTriangle, Plus, Loader, Eye, EyeOff,
} from "lucide-react";

import { getAllQuestions, correctToIndex } from "@/data/bac-questions";
import {
  supabase, signUpWithEmail, signInWithEmail, signInWithGoogle,
  signOut, getOrCreateProfile, saveChatMessage, getChatHistory,
  saveTestScore, getAggregatedScores, saveSubjectProgress,
  getSubjectProgress, saveSummary as saveSummaryToDb,
  getSummaries, deleteSummary as deleteSummaryFromDb,
  saveQuiz, getQuizzes, deleteQuiz, type UserProfile, type SavedQuiz,
} from "@/lib/supabase";
import { useAuth } from "@/components/AuthProvider";
import type { User } from "@supabase/supabase-js";

import type { Tab, Message, Subject, GeneratedSummaryData, SubjectScores, NotificationItem } from "@/components/types";
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
  { name: "Biologie", icon: "🧬", progress: 42, color: "#22C55E" },
  { name: "Fizică", icon: "⚡", progress: 51, color: "#F59E0B" },
  { name: "Chimie", icon: "⚗", progress: 38, color: "#3B82F6" },
  { name: "Informatică", icon: "</>", progress: 81, color: "#EC4899" },
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

  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [showAuthScreen, setShowAuthScreen] = useState(true);

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

  const [settings, setSettings] = useState({
    pushNotifications: true,
    dailyReminder: true,
    testResults: true,
    darkMode: true,
    reducedAnimations: false,
    anonymousStats: true,
    chatHistory: true,
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
  const [subjectScores, setSubjectScores] = useState<SubjectScores>({});

  const [showDocumentQuizUpload, setShowDocumentQuizUpload] = useState(false);
  const [documentQuizFile, setDocumentQuizFile] = useState<File | null>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [generatedQuizQuestions, setGeneratedQuizQuestions] = useState<any[]>([]);
  const [currentDocQuizIndex, setCurrentDocQuizIndex] = useState(0);
  const [docQuizSelectedAnswer, setDocQuizSelectedAnswer] = useState<number | null>(null);
  const [docQuizShowResult, setDocQuizShowResult] = useState(false);
  const [docQuizScore, setDocQuizScore] = useState(0);
  const [docQuizDifficulty, setDocQuizDifficulty] = useState<"easy" | "medium" | "hard">("medium");
  const [savedQuizzes, setSavedQuizzes] = useState<SavedQuiz[]>([]);
  const [showSavedQuizList, setShowSavedQuizList] = useState(false);
  const [redoingQuizId, setRedoingQuizId] = useState<string | null>(null);

  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedSummary, setGeneratedSummary] = useState<GeneratedSummaryData | null>(null);
  const [savedSummaries, setSavedSummaries] = useState<
    { id: number; title: string; subject: string; date: string; summary: string; keyPoints: string[]; questions: string[] }[]
  >([
    {
      id: 1, title: "Unirea Principatelor", subject: "Istorie", date: "28 Mai 2024",
      summary: "Unirea Principatelor Romane din 1859 reprezinta un moment crucial in istoria nationala...",
      keyPoints: ["Alexandru Ioan Cuza ales domn", "Dubla alegere in Moldova si Tara Romaneasca", "Recunoastere internationala"],
      questions: ["Care a fost semnificatia unirii din 1859?"],
    },
  ]);

  const [showHelpScreen, setShowHelpScreen] = useState(false);
  const [showNotificationsScreen, setShowNotificationsScreen] = useState(false);

  const [notifications, setNotifications] = useState<NotificationItem[]>([
    { id: 1, icon: "🎯", title: "Test completat!", description: "Ai obținut 8/10 la Matematică", time: "acum 2 ore", read: false },
    { id: 2, icon: "📚", title: "Reminder studiu", description: "Nu ai studiat azi. Hai să învățăm!", time: "acum 5 ore", read: false },
    { id: 3, icon: "⭐", title: "Ofertă Premium", description: "7 zile trial gratuit, expiră în 2 zile", time: "ieri", read: true },
    { id: 4, icon: "🏆", title: "Streak 7 zile!", description: "Felicitări! 7 zile consecutive de studiu", time: "acum 2 zile", read: false },
    { id: 5, icon: "📝", title: "Test nou disponibil", description: "20 întrebări noi la Română", time: "acum 3 zile", read: true },
  ]);

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
      const scores = await getAggregatedScores(userId);
      setSubjectScores(scores);
      const progress = await getSubjectProgress(userId);
      const updatedSubjects = subjects.map((s) => {
        const saved = progress.find((p) => p.subject === s.name);
        return saved ? { ...s, progress: saved.progress } : s;
      });
      setSubjectsState(updatedSubjects);

      const chatHistory = await getChatHistory(userId, selectedSubject.name);
      if (chatHistory.length > 0) {
        setMessages(chatHistory.map((msg, i) => ({ id: i + 1, text: msg.content, isUser: msg.role === "user" })));
      }

      const quizzes = await getQuizzes(userId);
      if (quizzes.length > 0) setSavedQuizzes(quizzes);

      const summaries = await getSummaries(userId);
      if (summaries.length > 0) {
        setSavedSummaries(summaries.map((s, i) => ({
          id: i + 1, title: s.title, subject: s.subject,
          date: new Date(s.created_at).toLocaleDateString("ro-RO"),
          summary: s.summary, keyPoints: s.key_points, questions: s.questions,
        })));
      }
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

  useEffect(() => { if (currentQuestionIndex === null) selectNextQuestion(); }, []);
  useEffect(() => { if (showToast) { const t = setTimeout(() => setShowToast(false), 3000); return () => clearTimeout(t); } }, [showToast]);

  const showToastMessage = (message: string) => { setToastMessage(message); setShowToast(true); };

  const getFilteredQuestions = () => {
    if (testSubjectFilter === "Toate") return allTestQuestions;
    return allTestQuestions.filter((q) => q.subject === testSubjectFilter);
  };

  const selectNextQuestion = () => {
    const filtered = getFilteredQuestions();
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
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject: selectedSubject.name, messages: conversation }),
      });
      const data = await response.json();
      const aiResponse = data.reply || "Ne pare rău, nu am putut genera un răspuns. Încearcă din nou.";
      const aiMsg: Message = { id: messages.length + 2, text: aiResponse, isUser: false };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
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
    setSubjectScores((prev) => ({
      ...prev,
      [question.subject]: { correct: (prev[question.subject]?.correct || 0) + (isCorrect ? 1 : 0), total: (prev[question.subject]?.total || 0) + 1 },
    }));
    if (authUser) { try { await saveTestScore(authUser.id, question.subject, isCorrect ? 1 : 0, 1); } catch (error) { console.error("Error saving test score:", error); } }
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
    if (filtered.length > 0) setCurrentQuestionIndex(allTestQuestions.indexOf(filtered[Math.floor(Math.random() * filtered.length)]));
  };

  const handlePremiumClick = (type: "free" | "monthly" | "annual") => {
    if (type === "free") showToastMessage("Esti pe planul gratuit");
    else { setPremiumModalType(type === "monthly" ? "monthly" : "annual"); setShowPremiumModal(true); }
  };

  const confirmPremium = () => {
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
      const response = await fetch("/api/generate-summary", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok || !data.summary) throw new Error(data.error || "Failed to generate summary");
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
    setSavedSummaries((prev) => [newSummary, ...prev]);
    if (authUser) { try { await saveSummaryToDb(authUser.id, newSummary.title, newSummary.subject, newSummary.summary, newSummary.keyPoints, newSummary.questions, uploadedFile.name); } catch (error) { console.error("Error saving summary:", error); } }
    setGeneratedSummary(null);
    setUploadedFile(null);
    showToastMessage("Rezumat salvat!");
  };

  const deleteSummary = async (id: number) => {
    setSavedSummaries((prev) => prev.filter((s) => s.id !== id));
    if (authUser) { try { await deleteSummaryFromDb(String(id)); } catch (error) { console.error("Error deleting summary:", error); } }
    showToastMessage("Rezumat sters");
  };

  const navigateToTests = (subjectName: string) => { setTestSubjectFilter(subjectName); setActiveTab("tests"); };

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
      const response = await fetch("/api/analyze-file", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok || !data.questions) throw new Error(data.error || "Failed to generate quiz");
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
    const quizData = {
      id: Date.now().toString(),
      title,
      difficulty: docQuizDifficulty,
      questions: generatedQuizQuestions,
      score: docQuizScore,
      total: generatedQuizQuestions.length,
      fileName: documentQuizFile.name,
    };
    setSavedQuizzes((prev) => [quizData as SavedQuiz, ...prev]);
    if (authUser) {
      try {
        await saveQuiz(authUser.id, title, documentQuizFile.name, docQuizDifficulty, generatedQuizQuestions, docQuizScore, generatedQuizQuestions.length);
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
      try { await deleteQuiz(id); } catch (e) { console.error("Error deleting quiz:", e); }
    }
    showToastMessage("Test șters");
  };

  const openSavedQuizList = () => {
    setShowSavedQuizList(true);
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

  const tabs = [
    { id: "home" as Tab, icon: Home, label: "Acasa" },
    { id: "chat" as Tab, icon: MessageCircle, label: "Chat" },
    { id: "tests" as Tab, icon: FileText, label: "Teste" },
    { id: "rezumate" as Tab, icon: Camera, label: "Rezumate" },
    { id: "progress" as Tab, icon: TrendingUp, label: "Progres" },
    { id: "premium" as Tab, icon: Crown, label: "Premium" },
  ];

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#08080D]">
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
              {premiumModalType === "monthly" ? "Abonament Premium" : "Abonament Anual"}
            </h3>
            <p className="text-muted-foreground mb-4">
              {premiumModalType === "monthly" ? "49 lei/luna - Acces complet la toate functiile" : "35 lei/luna - Economisesti 180 lei pe an!"}
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowPremiumModal(false)} className="flex-1 py-3 rounded-xl font-medium bg-muted text-foreground hover:bg-muted/80 transition-colors">Anuleaza</button>
              <button onClick={confirmPremium} className="flex-1 py-3 rounded-xl font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity">Confirma</button>
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

      {/* Auth Screen */}
      {(showAuthScreen || !authUser) && !authLoading && (
        <AuthScreen onAuthSuccess={() => setShowAuthScreen(false)} showToastMessage={showToastMessage} />
      )}

      {/* Profile Screen */}
      {showProfileScreen && (
        <ProfileScreen
          userProfile={userProfile} setUserProfile={setUserProfile}
          currentPlan={currentPlan} onBack={() => setShowProfileScreen(false)}
          onUpgradeClick={() => { setShowProfileScreen(false); setActiveTab("premium"); }}
          showToastMessage={showToastMessage}
        />
      )}

      {/* Settings Screen */}
      {showSettingsScreen && (
        <SettingsScreen settings={settings} setSettings={setSettings} onBack={() => setShowSettingsScreen(false)} showToastMessage={showToastMessage} />
      )}

      {showNotificationsScreen && (
        <NotificationsScreen notifications={notifications} setNotifications={setNotifications} onBack={() => setShowNotificationsScreen(false)} />
      )}

      {showHelpScreen && (
        <HelpScreen onBack={() => setShowHelpScreen(false)} showToastMessage={showToastMessage} />
      )}

      {/* Saved Quiz List Screen */}
      {showSavedQuizList && !generatedQuizQuestions.length && (
        <div className="fixed inset-0 bg-[#08080D] z-[150] p-4">
          <div className="h-full flex flex-col max-w-md mx-auto">
            <div className="flex items-center justify-between mb-6">
              <button onClick={() => setShowSavedQuizList(false)} className="flex items-center gap-2 text-foreground hover:text-primary transition-colors">
                <ArrowLeft className="w-5 h-5" />
                <span className="font-medium">Inapoi</span>
              </button>
              <h1 className="text-lg font-bold text-foreground" style={{ fontFamily: "var(--font-syne)" }}>Teste salvate</h1>
              <div className="w-20" />
            </div>
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
        </div>
      )}

      {/* Document Quiz Upload Screen */}
      {showDocumentQuizUpload && !generatedQuizQuestions.length && (
        <DocumentQuizUploadScreen
          onBack={() => { setShowDocumentQuizUpload(false); setDocumentQuizFile(null); setIsGeneratingQuiz(false); }}
          onFileSelected={generateDocumentQuiz} isGenerating={isGeneratingQuiz}
          difficulty={docQuizDifficulty} setDifficulty={setDocQuizDifficulty}
          onSavedQuizzes={openSavedQuizList} savedQuizCount={savedQuizzes.length}
        />
      )}

      {/* Document Quiz Question Screen */}
      {generatedQuizQuestions.length > 0 && currentDocQuizIndex < generatedQuizQuestions.length && (
        <div className="fixed inset-0 bg-[#08080D] z-[150] p-4">
          <div className="max-w-md mx-auto flex items-center justify-center h-full">
            <DocumentQuizQuestionScreen
              question={generatedQuizQuestions[currentDocQuizIndex]} currentIndex={currentDocQuizIndex}
              totalQuestions={generatedQuizQuestions.length} selectedAnswer={docQuizSelectedAnswer}
              setSelectedAnswer={setDocQuizSelectedAnswer} showResult={docQuizShowResult}
              onSubmit={submitDocQuizAnswer} onNext={nextDocQuizQuestion} score={docQuizScore}
            />
          </div>
        </div>
      )}

      {/* Mobile Phone Frame */}
      <div className="relative w-[390px] h-[844px] bg-[#08080D] rounded-[50px] border-[8px] border-[#1A1A2E] shadow-2xl overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[150px] h-[35px] bg-[#08080D] rounded-b-3xl z-50" />
        <div className="h-full flex flex-col pt-10">
          <div className="flex-1 overflow-y-auto mobile-scrollbar px-4 pb-24">
            {activeTab === "home" && (
              <HomeTab
                subjectsState={subjectsState} subjectScores={subjectScores}
                userProfile={userProfile}
                onSubjectClick={navigateToChat} onPremiumClick={() => setActiveTab("premium")}
                showProfileMenu={showProfileMenu} setShowProfileMenu={setShowProfileMenu}
                currentPlan={currentPlan}
                onProfileClick={() => { setShowProfileMenu(false); setShowProfileScreen(true); }}
                onSettingsClick={() => { setShowProfileMenu(false); setShowSettingsScreen(true); }}
                onLogoutClick={() => { setShowProfileMenu(false); setShowLogoutModal(true); }}
                onHelpClick={() => { setShowProfileMenu(false); setShowHelpScreen(true); }}
                onNotificationsClick={() => { setShowProfileMenu(false); setShowNotificationsScreen(true); }}
              />
            )}
            {activeTab === "chat" && (
              <ChatTab
                subjects={subjectsState} selectedSubject={selectedSubject}
                setSelectedSubject={setSelectedSubject} messages={messages}
                newMessage={newMessage} setNewMessage={setNewMessage}
                sendMessage={sendMessage} isTyping={isTyping}
              />
            )}
            {activeTab === "tests" && currentQuestionIndex !== null && (
              <TestsTab
                subjects={subjectsState} testSubjectFilter={testSubjectFilter}
                setTestSubjectFilter={resetTestOnFilterChange}
                currentQuestion={allTestQuestions[currentQuestionIndex]}
                selectedAnswer={selectedAnswer} setSelectedAnswer={setSelectedAnswer}
                showResult={showResult} handleAnswerSubmit={handleAnswerSubmit}
                nextQuestion={nextQuestion} subjectScores={subjectScores}
                totalScore={getTotalScore()} totalQuestions={getFilteredQuestions().length}
                onOpenDocumentQuiz={() => setShowDocumentQuizUpload(true)}
              />
            )}
            {activeTab === "rezumate" && (
              <RezumateTab
                uploadedFile={uploadedFile} setUploadedFile={setUploadedFile}
                isGenerating={isGenerating} onGenerate={generateSummary}
                generatedSummary={generatedSummary} setGeneratedSummary={setGeneratedSummary}
                savedSummaries={savedSummaries} onSaveSummary={saveSummary}
                onDeleteSummary={deleteSummary} showToastMessage={showToastMessage}
              />
            )}
            {activeTab === "progress" && (
              <ProgressTab
                subjects={subjectsState} subjectScores={subjectScores}
                onPracticeSubject={navigateToTests} showToastMessage={showToastMessage}
                onResetProgress={handleResetProgress}
              />
            )}
            {activeTab === "premium" && <PremiumTab onPlanClick={handlePremiumClick} currentPlan={currentPlan} />}
          </div>

          {/* Bottom Tab Navigation */}
          <div className="absolute bottom-0 left-0 right-0 bg-[#0F0F1A] border-t border-[#2A2A40] px-1 py-3 pb-8">
            <div className="flex justify-around items-center">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex flex-col items-center gap-1 px-2 py-1 rounded-xl transition-all ${isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
                  >
                    <Icon className={`w-5 h-5 ${isActive ? "fill-primary/20" : ""}`} />
                    <span className="text-[9px] font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
