import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// Create Supabase client - will be null if env vars are missing
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createBrowserClient(supabaseUrl, supabaseAnonKey)
  : null

// Database types
export interface UserProfile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  current_plan: "free" | "premium"
  streak_days: number
  total_study_hours: number
  created_at: string
  updated_at: string
}

export interface ChatMessage {
  id: string
  user_id: string
  subject: string
  role: "user" | "assistant"
  content: string
  created_at: string
}

export interface TestScore {
  id: string
  user_id: string
  subject: string
  correct: number
  total: number
  created_at: string
}

export interface SubjectProgress {
  id: string
  user_id: string
  subject: string
  progress: number
  updated_at: string
}

export interface Summary {
  id: string
  user_id: string
  title: string
  subject: string
  summary: string
  key_points: string[]
  questions: string[]
  file_name: string
  created_at: string
}

export interface SavedQuiz {
  id: string
  user_id: string
  title: string
  file_name: string
  difficulty: string
  questions: any[]
  score: number
  total: number
  created_at: string
}

// Auth helpers
export const signUpWithEmail = async (email: string, password: string, fullName: string) => {
  if (!supabase) throw new Error("Supabase not configured")
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName } },
  })
  if (error) throw error
  return data
}

export const signInWithEmail = async (email: string, password: string) => {
  if (!supabase) throw new Error("Supabase not configured")
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

export const signInWithGoogle = async () => {
  if (!supabase) throw new Error("Supabase not configured")
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: 'https://v0-bacsmart-app-design.vercel.app/auth/callback'
    }
  })
  if (error) throw error
  return data
}

export const signOut = async () => {
  if (!supabase) throw new Error("Supabase not configured")
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

// Profile helpers
export const getOrCreateProfile = async (userId: string, email: string, fullName?: string, avatarUrl?: string) => {
  if (!supabase) return null
  
  const { data: existingProfile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", userId)
    .single()
  
  if (existingProfile) {
    if ((fullName && !existingProfile.full_name) || (avatarUrl && !existingProfile.avatar_url)) {
      const updates: Record<string, string> = {}
      if (fullName && !existingProfile.full_name) updates.full_name = fullName
      if (avatarUrl && !existingProfile.avatar_url) updates.avatar_url = avatarUrl
      
      const { data: updatedProfile } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId)
        .select()
        .single()
      
      return updatedProfile as UserProfile
    }
    return existingProfile as UserProfile
  }
  
  const { data: newProfile, error } = await supabase
    .from("profiles")
    .insert({
      id: userId,
      email,
      full_name: fullName || null,
      avatar_url: avatarUrl || null,
      current_plan: "free",
      streak_days: 0,
      total_study_hours: 0,
    })
    .select()
    .single()
  
  if (error) throw error
  return newProfile as UserProfile
}

// Chat history helpers
export const saveChatMessage = async (userId: string, subject: string, role: "user" | "assistant", content: string) => {
  if (!supabase) return null
  const { data, error } = await supabase
    .from("chat_messages")
    .insert({ user_id: userId, subject, role, content })
    .select()
    .single()
  if (error) throw error
  return data as ChatMessage
}

export const getChatHistory = async (userId: string, subject?: string) => {
  if (!supabase) return []
  let query = supabase
    .from("chat_messages")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
  
  if (subject) query = query.eq("subject", subject)
  const { data, error } = await query
  if (error) throw error
  return data as ChatMessage[]
}

// Test scores helpers
export const saveTestScore = async (userId: string, subject: string, correct: number, total: number) => {
  if (!supabase) return null
  const { data, error } = await supabase
    .from("test_scores")
    .insert({ user_id: userId, subject, correct, total })
    .select()
    .single()
  if (error) throw error
  return data as TestScore
}

export const getAggregatedScores = async (userId: string) => {
  if (!supabase) return {}
  const { data, error } = await supabase
    .from("test_scores")
    .select("subject, correct, total")
    .eq("user_id", userId)
  
  if (error) throw error
  
  const aggregated: Record<string, { correct: number; total: number }> = {}
  ;(data as TestScore[]).forEach((score) => {
    if (!aggregated[score.subject]) {
      aggregated[score.subject] = { correct: 0, total: 0 }
    }
    aggregated[score.subject].correct += score.correct
    aggregated[score.subject].total += score.total
  })
  return aggregated
}

// Progress helpers
export const saveSubjectProgress = async (userId: string, subject: string, progress: number) => {
  if (!supabase) return null
  const { data, error } = await supabase
    .from("subject_progress")
    .upsert({ user_id: userId, subject, progress, updated_at: new Date().toISOString() }, { onConflict: "user_id,subject" })
    .select()
    .single()
  if (error) throw error
  return data as SubjectProgress
}

export const getSubjectProgress = async (userId: string) => {
  if (!supabase) return []
  const { data, error } = await supabase
    .from("subject_progress")
    .select("*")
    .eq("user_id", userId)
  if (error) throw error
  return data as SubjectProgress[]
}

// Summary helpers
export const saveSummary = async (userId: string, title: string, subject: string, summary: string, keyPoints: string[], questions: string[], fileName: string) => {
  if (!supabase) return null
  const { data, error } = await supabase
    .from("summaries")
    .insert({ user_id: userId, title, subject, summary, key_points: keyPoints, questions, file_name: fileName })
    .select()
    .single()
  if (error) throw error
  return data as Summary
}

export const getSummaries = async (userId: string) => {
  if (!supabase) return []
  const { data, error } = await supabase
    .from("summaries")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data as Summary[]
}

export const deleteSummary = async (summaryId: string) => {
  if (!supabase) return
  const { error } = await supabase.from("summaries").delete().eq("id", summaryId)
  if (error) throw error
}

// Quiz (teste generate) helpers
export const saveQuiz = async (userId: string, title: string, fileName: string, difficulty: string, questions: any[], score: number, total: number) => {
  if (!supabase) return null
  const { data, error } = await supabase
    .from("quizzes")
    .insert({ user_id: userId, title, file_name: fileName, difficulty, questions, score, total })
    .select()
    .single()
  if (error) throw error
  return data as SavedQuiz
}

export const getQuizzes = async (userId: string) => {
  if (!supabase) return []
  const { data, error } = await supabase
    .from("quizzes")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
  if (error) throw error
  return data as SavedQuiz[]
}

export const deleteQuiz = async (quizId: string) => {
  if (!supabase) return
  const { error } = await supabase.from("quizzes").delete().eq("id", quizId)
  if (error) throw error
}

export const updateProfile = async (userId: string, data: Record<string, any>) => {
  if (!supabase) return null
  const { data: updatedProfile } = await supabase
    .from("profiles")
    .update(data)
    .eq("id", userId)
    .select()
    .single()
  return updatedProfile as UserProfile | null
}

export const resetUserProgress = async (userId: string) => {
  if (!supabase) return
  await supabase.from("test_scores").delete().eq("user_id", userId)
  await supabase.from("subject_progress").delete().eq("user_id", userId)
  await supabase.from("profiles").update({ streak_days: 0, total_study_hours: 0 }).eq("id", userId)
}
