import { NextResponse } from "next/server";
import { DEMO_SESSION_COOKIE } from "@/lib/auth";
import { getDemoStore } from "@/lib/demo/store";
import { isDemoMode } from "@/lib/mode";

export async function POST(request: Request) {
  if (!isDemoMode()) {
    return NextResponse.json(
      { error: "Demo auth only available in demo mode" },
      { status: 400 },
    );
  }

  const body = (await request.json()) as { employeeId?: string };
  const employee = getDemoStore().employees.find(
    (e) => e.id === body.employeeId && e.active,
  );
  if (!employee) {
    return NextResponse.json({ error: "Unknown demo user" }, { status: 404 });
  }

  const response = NextResponse.json({
    ok: true,
    role: employee.role,
    redirect:
      employee.role === "admin" ? "/admin" : "/employee/subscriptions",
  });
  response.cookies.set(DEMO_SESSION_COOKIE, employee.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
  });
  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(DEMO_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });
  return response;
}
