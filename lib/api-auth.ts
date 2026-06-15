import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

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
    const match = cookieHeader.match(/sb-[a-z0-9-]+-auth-token=([^;]+)/);
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

  return { userId: data.user.id };
}
