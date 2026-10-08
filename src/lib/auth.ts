import { cache } from "react";
import { cookies } from "next/headers";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getDemoStore } from "@/lib/demo/store";
import { isDemoMode } from "@/lib/mode";
import { createClient } from "@/lib/supabase/server";
import type { Employee, SessionUser } from "@/lib/types";

export const DEMO_SESSION_COOKIE = "spendflow_demo_session";

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  if (isDemoMode()) {
    const cookieStore = await cookies();
    const employeeId = cookieStore.get(DEMO_SESSION_COOKIE)?.value;
    if (!employeeId) return null;
    const employee = getDemoStore().employees.find((e) => e.id === employeeId);
    if (!employee || !employee.active) return null;
    return { employee, mode: "demo" };
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return null;

  const { data: employee, error } = await supabase
    .from("employees")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !employee) return null;
  return { employee: employee as Employee, mode: "supabase" };
});

export async function requireSession(): Promise<SessionUser> {
  const session = await getSessionUser();
  if (!session) {
    const locale = await getLocale();
    redirect({ href: "/login", locale });
  }
  return session as SessionUser;
}

export async function requireAdmin(): Promise<SessionUser> {
  const session = await requireSession();
  if (session.employee.role !== "admin") {
    const locale = await getLocale();
    redirect({ href: "/employee/subscriptions", locale });
  }
  return session;
}

export async function requireEmployee(): Promise<SessionUser> {
  const session = await requireSession();
  if (session.employee.role === "admin") {
    // Admins may still use employee portal for their own data, but default to admin.
  }
  return session;
}
