import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

// Rate limiting simplu (in-memory, se resetează la restart)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW = 60_000; // 1 minut
const RATE_LIMIT_MAX = 30; // max 30 request-uri per minut per utilizator

function checkRateLimit(userId: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(userId, { count: 1, resetAt: now + RATE_LIMIT_WINDOW });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

// Free tier daily limits
const FREE_LIMITS = {
  CHAT_PER_DAY: 10,
  ANSWERS_PER_DAY: 10,
  SUMMARIES_PER_DAY: 1,
  QUIZZES_PER_DAY: 1,
} as const;

type UsageField = "chat_count" | "answer_count" | "summary_count" | "quiz_count";

/**
 * Get user's current plan from Supabase
 */
async function getUserPlan(supabase: ReturnType<typeof createServerClient>, userId: string): Promise<{ plan: string; trialEndsAt: string | null; premiumUntil: string | null }> {
  const { data } = await supabase
    .from("profiles")
    .select("current_plan, trial_ends_at, premium_until")
    .eq("id", userId)
    .single();

  return {
    plan: data?.current_plan || "free",
    trialEndsAt: data?.trial_ends_at || null,
    premiumUntil: data?.premium_until || null,
  };
}

/**
 * Get user's daily usage for today
 */
async function getUsageCount(supabase: ReturnType<typeof createServerClient>, userId: string, field: UsageField): Promise<number> {
  const today = new Date().toISOString().split("T")[0];
  const { data } = await supabase
    .from("daily_usage")
    .select(field)
    .eq("user_id", userId)
    .eq("date", today)
    .maybeSingle();
  return (data?.[field] as number) || 0;
}

/**
 * Verify user is premium (or within trial period).
 * Returns the user ID on success, or an error response.
 */
export async function requirePremium(req: Request): Promise<{ userId: string } | NextResponse> {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: { getAll: () => [], setAll: () => {} },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { plan, trialEndsAt, premiumUntil } = await getUserPlan(supabase, auth.userId);

  // Check if premium or within trial
  const isPremium = plan === "premium" || plan === "annual";
  const inTrial = trialEndsAt ? new Date(trialEndsAt) > new Date() : false;

  if (!isPremium && !inTrial) {
    return NextResponse.json(
      { error: "Premium subscription required. Upgrade for unlimited access.", code: "premium_required" },
      { status: 402 }
    );
  }

  // Check if subscription expired
  if (isPremium && premiumUntil && new Date(premiumUntil) < new Date()) {
    await supabase.from("profiles").update({ current_plan: "free", premium_until: null }).eq("id", auth.userId);
    return NextResponse.json(
      { error: "Subscription has expired. Renew for continued access.", code: "subscription_expired" },
      { status: 402 }
    );
  }

  return { userId: auth.userId };
}

/**
 * Check free tier limit for a specific feature.
 * If the user is free and at limit, returns an error response.
 * Otherwise returns the user ID.
 */
export async function checkFreeLimit(
  req: Request,
  feature: "chat" | "answers" | "summaries" | "quizzes"
): Promise<{ userId: string } | NextResponse> {
  const auth = await requireAuth(req);
  if (auth instanceof NextResponse) return auth;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: { getAll: () => [], setAll: () => {} },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { plan, trialEndsAt } = await getUserPlan(supabase, auth.userId);

  // Premium users or users in trial have no limits
  const isPremium = plan === "premium" || plan === "annual";
  const inTrial = trialEndsAt ? new Date(trialEndsAt) > new Date() : false;
  if (isPremium || inTrial) {
    return { userId: auth.userId };
  }

  // Map feature to usage field and limit
  const fieldMap: Record<string, { field: UsageField; limit: number }> = {
    chat: { field: "chat_count", limit: FREE_LIMITS.CHAT_PER_DAY },
    answers: { field: "answer_count", limit: FREE_LIMITS.ANSWERS_PER_DAY },
    summaries: { field: "summary_count", limit: FREE_LIMITS.SUMMARIES_PER_DAY },
    quizzes: { field: "quiz_count", limit: FREE_LIMITS.QUIZZES_PER_DAY },
  };

  const { field, limit } = fieldMap[feature];
  const currentUsage = await getUsageCount(supabase, auth.userId, field);

  if (currentUsage >= limit) {
    return NextResponse.json(
      {
        error: `Ai atins limita zilnică de ${feature === "chat" ? "mesaje" : feature === "answers" ? "răspunsuri la teste" : feature === "summaries" ? "rezumate" : "quiz-uri"}. Fă upgrade la Premium pentru acces nelimitat!`,
        code: "daily_limit_reached",
        limit,
        current: currentUsage,
      },
      { status: 429 }
    );
  }

  return { userId: auth.userId };
}

/**
 * Increment daily usage counter for a feature.
 * Call this AFTER a successful operation.
 */
export async function incrementUsage(userId: string, feature: "chat" | "answers" | "summaries" | "quizzes") {
  const fieldMap: Record<string, UsageField> = {
    chat: "chat_count",
    answers: "answer_count",
    summaries: "summary_count",
    quizzes: "quiz_count",
  };

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return;

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: { getAll: () => [], setAll: () => {} },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const field = fieldMap[feature];
  const today = new Date().toISOString().split("T")[0];

  const { data: existing } = await supabase
    .from("daily_usage")
    .select("id, chat_count, answer_count, summary_count, quiz_count")
    .eq("user_id", userId)
    .eq("date", today)
    .maybeSingle();

  if (existing) {
    const updates: Record<string, number> = {};
    updates[field] = (existing[field as keyof typeof existing] as number || 0) + 1;
    await supabase.from("daily_usage").update(updates).eq("id", existing.id);
  } else {
    const insert: Record<string, any> = {
      user_id: userId,
      date: today,
      chat_count: 0,
      answer_count: 0,
      summary_count: 0,
      quiz_count: 0,
    };
    insert[field] = 1;
    await supabase.from("daily_usage").insert(insert);
  }
}

/**
 * Verifică dacă request-ul are o sesiune Supabase validă.
 * Returnează { userId } sau un NextResponse de eroare.
 */
export async function requireAuth(req: Request): Promise<
  { userId: string } | NextResponse
> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.json(
      { error: "Supabase not configured" },
      { status: 500 }
    );
  }

  // Get auth token from Authorization header
  const authHeader = req.headers.get("Authorization");
  let token: string | null = null;
  if (authHeader?.startsWith("Bearer ")) {
    token = authHeader.slice(7);
  }

  // If no token in header, try cookie-based session (for same-origin requests)
  if (!token) {
    const cookieHeader = req.headers.get("cookie") || "";
    const match = cookieHeader.match(/sb-[a-z0-9-]+-auth-token[^=]*=([^;]+)/);
    if (match) {
      try {
        token = JSON.parse(decodeURIComponent(match[1]))?.access_token || null;
      } catch {
        // ignore parse errors
      }
    }
  }

  if (!token) {
    return NextResponse.json(
      { error: "Unauthorized — no session" },
      { status: 401 }
    );
  }

  // Verify token via Supabase
  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll: () => [],
      setAll: () => {},
    },
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return NextResponse.json(
      { error: "Unauthorized — invalid session" },
      { status: 401 }
    );
  }

  // Rate limit check
  if (!checkRateLimit(data.user.id)) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429 }
    );
  }

  return { userId: data.user.id };
}
