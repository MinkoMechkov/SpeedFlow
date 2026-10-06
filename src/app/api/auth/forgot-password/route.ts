import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/mode";

export async function POST(request: Request) {
  if (isDemoMode()) {
    return NextResponse.json(
      { error: "Password reset is not available in demo mode." },
      { status: 400 },
    );
  }

  try {
    const body = (await request.json()) as { email?: string };
    const email = String(body.email ?? "")
      .trim()
      .toLowerCase();
    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const origin =
      process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") ||
      request.headers.get("origin") ||
      "http://127.0.0.1:43127";

    const supabase = await createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${origin}/auth/callback?next=/login/reset`,
    });
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Always succeed from the client's perspective to avoid email enumeration.
    return NextResponse.json({
      ok: true,
      message: "If that email exists, a reset link is on its way.",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Request failed" },
      { status: 500 },
    );
  }
}
