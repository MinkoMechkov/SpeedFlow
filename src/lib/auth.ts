import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDemoStore } from "@/lib/demo/store";
import { isDemoMode } from "@/lib/mode";
import { createClient } from "@/lib/supabase/server";
import type { Employee, SessionUser } from "@/lib/types";

export const DEMO_SESSION_COOKIE = "spendflow_demo_session";

export async function getSessionUser(): Promise<SessionUser | null> {
  if (isDemoMode()) {
    const cookieStore = await cookies();
    const employeeId = cookieStore.get(DEMO_SESSION_COOKIE)?.value;
    if (!employeeId) return null;
    const employee = getDemoStore().employees.find((e) => e.id === employeeId);
    if (!employee || !employee.active) return null;
    return { employee, mode: "demo" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: employee, error } = await supabase
    .from("employees")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error || !employee) return null;
  return { employee: employee as Employee, mode: "supabase" };
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSessionUser();
  if (!session) redirect("/login");
  return session;
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await requireSession();
  if (session.employee.role !== "admin") redirect("/employee/subscriptions");
  return session;
}

export async function requireEmployee(): Promise<SessionUser> {
  const session = await requireSession();
  if (session.employee.role === "admin") {
    // Admins may still use employee portal for their own data, but default to admin.
  }
  return session;
}
