"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AlertCircle, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useRouter } from "@/i18n/navigation";
import type { Employee } from "@/lib/types";

const linkClass =
  "cursor-pointer font-medium text-[var(--brand-deep)] underline-offset-4 hover:underline";

function FormError({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <div
      role="alert"
      className="flex items-start gap-2 rounded-lg border border-destructive/25 bg-destructive/5 px-3 py-2.5 text-sm text-destructive"
    >
      <AlertCircle className="mt-0.5 size-4 shrink-0" aria-hidden />
      <span>{message}</span>
    </div>
  );
}

export function LoginPanel({
  demoMode,
  demoUsers,
}: {
  demoMode: boolean;
  demoUsers: Employee[];
}) {
  const t = useTranslations("Auth");
  const tRole = useTranslations("Role");
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [pendingDemoId, setPendingDemoId] = useState<string | null>(null);
  const [forgotMode, setForgotMode] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function friendlyAuthError(message: string) {
    if (/invalid login credentials/i.test(message)) return t("invalidCredentials");
    if (/email not confirmed/i.test(message)) return t("emailNotConfirmed");
    return message;
  }

  function switchMode(next: boolean) {
    setError(null);
    setForgotMode(next);
  }

  async function demoLogin(employeeId: string) {
    setLoading(true);
    setPendingDemoId(employeeId);
    setError(null);
    try {
      const res = await fetch("/api/auth/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("demoLoginFailed"));
      router.push(data.redirect);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : t("loginFailed"));
      setLoading(false);
      setPendingDemoId(null);
    }
  }

  async function supabaseLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: authData, error: authError } =
        await supabase.auth.signInWithPassword({ email, password });
      if (authError) throw authError;

      const userId = authData.user?.id;
      let redirectTo = "/employee/subscriptions";
      if (userId) {
        const { data: employee } = await supabase
          .from("employees")
          .select("role")
          .eq("user_id", userId)
          .maybeSingle();
        if (employee?.role === "admin") redirectTo = "/admin";
      }

      router.push(redirectTo);
      router.refresh();
    } catch (err) {
      setError(
        friendlyAuthError(err instanceof Error ? err.message : t("loginFailed")),
      );
      setLoading(false);
    }
  }

  async function forgotPassword(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("requestFailed"));
      toast.success(data.message ?? t("resetSent"));
      switchMode(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : t("requestFailed"));
    } finally {
      setLoading(false);
    }
  }

  if (demoMode) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">{t("demoIntro")}</p>
        <FormError message={error} />
        <div className="grid gap-2.5">
          {demoUsers.map((user) => (
            <Button
              key={user.id}
              size="lg"
              variant={user.role === "admin" ? "default" : "outline"}
              className="h-11 justify-between px-4"
              disabled={loading && pendingDemoId !== user.id}
              loading={pendingDemoId === user.id}
              onClick={() => demoLogin(user.id)}
            >
              <span className="mr-auto">{user.name}</span>
              <span className="text-xs opacity-80">{tRole(user.role)}</span>
            </Button>
          ))}
        </div>
      </div>
    );
  }

  if (forgotMode) {
    return (
      <form onSubmit={forgotPassword} className="space-y-5">
        <p className="text-sm text-muted-foreground">{t("forgotIntro")}</p>
        <div className="space-y-2">
          <Label htmlFor="email">{t("workEmail")}</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            placeholder={t("emailPlaceholder")}
            className="h-10"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoFocus
          />
        </div>
        <FormError message={error} />
        <Button type="submit" size="lg" className="h-11 w-full" loading={loading}>
          {loading ? t("sendingLink") : t("sendReset")}
        </Button>
        <button
          type="button"
          className="mx-auto flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
          onClick={() => switchMode(false)}
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t("backToSignIn")}
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={supabaseLogin} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="email">{t("workEmail")}</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder={t("emailPlaceholder")}
          className="h-10"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
          }}
          aria-invalid={error ? true : undefined}
          required
        />
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between gap-2">
          <Label htmlFor="password">{t("password")}</Label>
          <button
            type="button"
            className={`${linkClass} text-xs`}
            onClick={() => switchMode(true)}
          >
            {t("forgotPassword")}
          </button>
        </div>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          className="h-10"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(null);
          }}
          aria-invalid={error ? true : undefined}
          required
        />
      </div>
      <FormError message={error} />
      <Button
        type="submit"
        size="lg"
        className="mt-1 h-11 w-full text-[0.95rem]"
        loading={loading}
      >
        {loading ? t("signingIn") : t("signIn")}
      </Button>
      <p className="border-t border-border/70 pt-5 text-center text-sm text-muted-foreground">
        {t("noAccount")}{" "}
        <Link href="/#register" className={linkClass}>
          {t("createOne")}
        </Link>
      </p>
    </form>
  );
}
