export type Tab = "home" | "chat" | "tests" | "rezumate" | "progress" | "premium";

export interface Message {
  id: number;
  text: string;
  isUser: boolean;
}

export interface Subject {
  name: string;
  icon: string;
  progress: number;
  color: string;
}

export interface Summary {
  id: number;
  title: string;
  subject: string;
  date: string;
  preview: string;
  summary: string;
  keyPoints: string[];
  questions: string[];
}

export interface TestQuestion {
  subject: string;
  question: string;
  answers: string[];
  correct: number;
  explanation: string;
}

export interface Settings {
  pushNotifications: boolean;
  dailyReminder: boolean;
  testResults: boolean;
  darkMode: boolean;
  reducedAnimations: boolean;
  anonymousStats: boolean;
  chatHistory: boolean;
}

export interface GeneratedSummaryData {
  summary: string;
  keyPoints: string[];
  questions: string[];
  fileName: string;
}

export interface SubjectScores {
  [subject: string]: { correct: number; total: number };
}

export interface NotificationItem {
  id: number;
  icon: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
}
