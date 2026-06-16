/**
 * RevenueCat integration for BACsmart
 *
 * RevenueCat handles in-app purchases across Apple App Store,
 * Google Play, and Stripe through a unified API.
 *
 * Setup:
 * 1. Create account at https://app.revenuecat.com
 * 2. Configure products: monthly_19_intro, monthly_49, annual_420
 * 3. Add RevenueCat SDK:
 *    npm install @revenuecat/purchases-capacitor
 *    npx cap sync
 *
 * Entitlements (defined in RevenueCat dashboard):
 *   - "premium" — grants full access (monthly subscription)
 *   - "annual"  — grants full access (annual subscription)
 */

// Product identifiers — match these in RevenueCat dashboard
export const PRODUCTS = {
  MONTHLY_INTRO: "bacsmart_monthly_intro", // 19 lei/luna, first month only
  MONTHLY: "bacsmart_monthly_49",           // 49 lei/luna
  ANNUAL: "bacsmart_annual_420",            // 420 lei/an (35 lei/luna)
} as const;

// Free tier daily limits
export const FREE_LIMITS = {
  CHAT_PER_DAY: 10,
  ANSWERS_PER_DAY: 10,
  SUMMARIES_PER_DAY: 1,
  QUIZZES_PER_DAY: 1,
  TRIAL_DAYS: 5,
} as const;

// Pricing display
export const PRICING = {
  monthly: {
    introPrice: "19",
    introLabel: "Prima lună",
    regularPrice: "49",
    regularLabel: "lei/lună",
    saving: "30 lei reducere",
  },
  annual: {
    price: "35",
    period: "lei/lună",
    total: "420/an",
    saving: "Economisești 168 lei pe an",
    savingAmount: 168,
  },
} as const;

// Get the daily usage limit for a given metric
export function getFreeLimit(metric: "chat" | "answers" | "summaries" | "quizzes"): number {
  switch (metric) {
    case "chat": return FREE_LIMITS.CHAT_PER_DAY;
    case "answers": return FREE_LIMITS.ANSWERS_PER_DAY;
    case "summaries": return FREE_LIMITS.SUMMARIES_PER_DAY;
    case "quizzes": return FREE_LIMITS.QUIZZES_PER_DAY;
  }
}

// Get remaining count message
export function getRemainingMessage(metric: "chat" | "answers" | "summaries" | "quizzes", used: number, plan: string): string | null {
  if (plan !== "free") return null;
  const limit = getFreeLimit(metric);
  const remaining = Math.max(0, limit - used);
  if (remaining <= 0) return null; // Will show upgrade prompt instead
  return `${remaining}/${limit} azi`;
}

// Get upgrade prompt when limit reached
export function getLimitReachedMessage(metric: "chat" | "answers" | "summaries" | "quizzes"): string {
  const labels: Record<string, string> = {
    chat: "mesaje",
    answers: "răspunsuri la teste",
    summaries: "rezumate",
    quizzes: "quiz-uri din documente",
  };
  return `Ai atins limita zilnică de ${labels[metric]}. Fă upgrade la Premium pentru acces nelimitat!`;
}

/*
 * RevenueCat SDK Integration (for Capacitor)
 *
 * When setting up the native app:
 *
 * import { Purchases } from '@revenuecat/purchases-capacitor';
 *
 * // Initialize
 * await Purchases.configure({
 *   apiKey: process.env.REVENUECAT_API_KEY!, // or PUBLIC_KEY for iOS
 *   appUserID: userId, // Supabase user ID
 * });
 *
 * // Get offerings
 * const { offerings } = await Purchases.getOfferings();
 * const current = offerings?.current;
 *
 * // Purchase
 * const { customerInfo } = await Purchases.purchasePackage({
 *   aPackage: current.monthly!, // or current.annual
 * });
 *
 * // Check entitlement
 * const ent = customerInfo.entitlements.active["premium"] || customerInfo.entitlements.active["annual"];
 * if (ent) { /* user is premium *\/ }
 *
 * // Restore purchases
 * const { customerInfo } = await Purchases.restorePurchases();
 *
 * // Check trial eligibility
 * const { entitlements } = await Purchases.checkTrialOrIntroductoryPriceEligibility();
 */
