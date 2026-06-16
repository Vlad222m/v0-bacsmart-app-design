import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

// Secret shared between RevenueCat and this server (set in Vercel env vars)
const WEBHOOK_SECRET = process.env.REVENUECAT_WEBHOOK_SECRET;

export async function POST(req: Request) {
  try {
    // Verify webhook signature
    const body = await req.text();
    const signature = req.headers.get("X-RevenueCat-Signature") || "";

    if (WEBHOOK_SECRET) {
      // Basic verification — RevenueCat sends HMAC-SHA1 of the request body
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        "raw", encoder.encode(WEBHOOK_SECRET),
        { name: "HMAC", hash: "SHA-1" },
        false, ["verify"]
      );
      const expectedSig = Array.from(
        new Uint8Array(await crypto.subtle.sign("HMAC", key, encoder.encode(body)))
      ).map(b => b.toString(16).padStart(2, "0")).join("");

      if (signature !== expectedSig) {
        console.error("[RevenueCat] Invalid webhook signature");
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    }

    const event = JSON.parse(body);

    // Only process subscription-related events
    const eventType = event.event?.type || event.type;
    if (!eventType) {
      return NextResponse.json({ error: "No event type" }, { status: 400 });
    }

    // Extract user info
    const appUserId = event.event?.app_user_id || event.app_user_id;
    const entitlementId = event.event?.entitlement_id || event.entitlement_id || "premium";
    const productId = event.event?.product_id || event.product_id || "";
    const expiresAtMs = event.event?.expires_at_ms || event.expires_at_ms;
    const periodType = event.event?.period_type || event.period_type || "normal"; // "intro", "trial", "normal"

    if (!appUserId) {
      return NextResponse.json({ error: "No user ID" }, { status: 400 });
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
      cookies: { getAll: () => [], setAll: () => {} },
      auth: { persistSession: false, autoRefreshToken: false },
    });

    const premiumUntil = expiresAtMs ? new Date(expiresAtMs).toISOString() : null;
    const now = new Date();
    const isTrial = periodType === "trial";

    switch (eventType) {
      case "INITIAL_PURCHASE":
      case "INITIAL_PURCHASE_INTRO":
      case "RENEWAL":
      case "PRODUCT_CHANGE": {
        // Determine plan type and trial end
        const isAnnual = productId.includes("annual");
        const plan = isAnnual ? "annual" : "premium";
        const trialEndsAt = isTrial
          ? (expiresAtMs ? new Date(expiresAtMs).toISOString() : null)
          : null;

        await supabase
          .from("profiles")
          .update({
            current_plan: plan,
            premium_until: premiumUntil,
            trial_ends_at: trialEndsAt,
          })
          .eq("id", appUserId);

        console.log(`[RevenueCat] User ${appUserId} upgraded to ${plan}${isTrial ? " (trial)" : ""} until ${premiumUntil}`);
        break;
      }

      case "CANCELLATION":
      case "UNCANCELLATION":
        // Just log it — the plan stays active until expiration
        console.log(`[RevenueCat] User ${appUserId} ${eventType === "CANCELLATION" ? "cancelled" : "uncancelled"}`);
        break;

      case "EXPIRATION":
      case "BILLING_ISSUE": {
        // Downgrade to free, keep trial info
        await supabase
          .from("profiles")
          .update({
            current_plan: "free",
            premium_until: null,
          })
          .eq("id", appUserId);

        console.log(`[RevenueCat] User ${appUserId} expired/billing issue — downgraded to free`);
        break;
      }

      default:
        // Unknown event type — log but don't error
        console.log(`[RevenueCat] Unhandled event type: ${eventType}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[RevenueCat] Webhook error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
