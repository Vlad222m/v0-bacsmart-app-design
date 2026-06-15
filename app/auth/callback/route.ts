import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const error_description = searchParams.get("error_description");

  // Handle OAuth errors
  if (error) {
    console.error("[v0] OAuth error:", error, error_description);
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(error)}`);
  }

  // No code provided
  if (!code) {
    console.error("[v0] No code provided in callback");
    return NextResponse.redirect(`${origin}/?error=no_code`);
  }

  const cookieStore = await cookies();
  
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch (error) {
            // Cookie setting can fail in some edge cases, log but continue
            console.error("[v0] Failed to set cookies:", error);
          }
        },
      },
    }
  );

  // Exchange code for session
  const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

  if (exchangeError) {
    console.error("[v0] Exchange error:", exchangeError.message);
    return NextResponse.redirect(`${origin}/?error=exchange_failed`);
  }

  // Success - redirect to home (app will show dashboard for logged in users)
  console.log("[v0] OAuth success, user:", data.user?.email);
  return NextResponse.redirect(origin);
}
