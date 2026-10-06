import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Exchanges the auth code from email links (password recovery, etc.)
 * and redirects to the intended page with a session cookie set.
 */
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/login/reset";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  const fail = new URL("/login", origin);
  fail.searchParams.set("error", "auth_callback_failed");
  return NextResponse.redirect(fail);
}
