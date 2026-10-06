import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { isDemoMode } from "@/lib/mode";

export async function POST(request: Request) {
  if (isDemoMode()) {
    return NextResponse.json(
      {
        error:
          "Registration is disabled in demo mode. Switch DEMO_MODE=false and use Supabase, or pick a demo persona on Login.",
      },
      { status: 400 },
    );
  }

  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      password?: string;
      department?: string | null;
    };

    const name = String(body.name ?? "").trim();
    const email = String(body.email ?? "").trim().toLowerCase();
    const password = String(body.password ?? "");
    const department = body.department
      ? String(body.department).trim() || null
      : null;

    if (!name || !email || password.length < 8) {
      return NextResponse.json(
        { error: "Name, email, and password (min 8 characters) are required" },
        { status: 400 },
      );
    }

    const supabase = await createClient();
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          department,
        },
      },
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const user = data.user;
    if (!user) {
      return NextResponse.json(
        { error: "Signup failed — no user returned" },
        { status: 500 },
      );
    }

    // Trigger usually creates the row; ensure employee exists if session is available.
    if (data.session) {
      const { data: existing } = await supabase
        .from("employees")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!existing) {
        const { error: insertError } = await supabase.from("employees").insert({
          user_id: user.id,
          name,
          email,
          department,
          role: "employee",
          active: true,
        });
        if (insertError) {
          console.error("Employee insert after signup failed", insertError);
          return NextResponse.json(
            {
              error:
                "Account created but profile setup failed. Contact an admin.",
            },
            { status: 500 },
          );
        }
      }

      return NextResponse.json({
        ok: true,
        redirect: "/employee/subscriptions",
      });
    }

    return NextResponse.json({
      ok: true,
      message: "Check your email to confirm, then sign in.",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Registration failed",
      },
      { status: 500 },
    );
  }
}
