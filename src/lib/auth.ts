import { cache } from "react";
import { cookies } from "next/headers";
import { getLocale } from "next-intl/server";
import { redirect } from "@/i18n/navigation";
import { getDemoStore } from "@/lib/demo/store";
import { isDemoMode } from "@/lib/mode";
import { createClient } from "@/lib/supabase/server";
import type { Employee, SessionUser } from "@/lib/types";

export const DEMO_SESSION_COOKIE = "spendflow_demo_session";

async function resolveDemoSession(): Promise<SessionUser | null> {
  const cookieStore = await cookies();
  const employeeId = cookieStore.get(DEMO_SESSION_COOKIE)?.value;
  if (!employeeId) return null;
  const employee = getDemoStore().employees.find((e) => e.id === employeeId);
  if (!employee || !employee.active) return null;
  return { employee, mode: "demo" };
}

async function employeeForUserId(
  userId: string,
): Promise<SessionUser | null> {
  const supabase = await createClient();
  const { data: employee, error } = await supabase
    .from("employees")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !employee) return null;
  return { employee: employee as Employee, mode: "supabase" };
}

export const getSessionUser = cache(async (): Promise<SessionUser | null> => {
  if (isDemoMode()) return resolveDemoSession();

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims.sub;
  if (!userId) return null;

  return employeeForUserId(userId);
});

/**
 * Session lookup that does not refresh auth tokens.
 * Prefer for high-frequency poll APIs — concurrent getClaims() refreshes
 * can rotate the refresh token twice and wipe the browser session.
 */
export async function getSessionUserNoRefresh(): Promise<SessionUser | null> {
  if (isDemoMode()) return resolveDemoSession();

  const supabase = await createClient();
  const { data, error } = await supabase.auth.getSession();
  if (error || !data.session) return null;

  const expiresAtMs = (data.session.expires_at ?? 0) * 1000;
  if (expiresAtMs && expiresAtMs < Date.now()) return null;

  const userId = data.session.user?.id;
  if (!userId) return null;

  return employeeForUserId(userId);
}

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
