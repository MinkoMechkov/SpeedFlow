"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Link, useRouter } from "@/i18n/navigation";

export function RegisterForm() {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          password,
          department: department.trim() || null,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? t("registrationFailed"));

      if (data.redirect) {
        toast.success(t("accountCreated"));
        router.push(data.redirect);
        router.refresh();
        return;
      }

      toast.success(data.message ?? t("accountCreatedSignIn"));
      router.push("/login");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("registrationFailed"),
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full space-y-3.5">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-xl tracking-tight sm:text-2xl">
          {t("createAccount")}
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("createAccountHint")}
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="reg-name">{t("fullName")}</Label>
        <Input
          id="reg-name"
          className="h-9"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="reg-email">{t("workEmail")}</Label>
        <Input
          id="reg-email"
          type="email"
          className="h-9"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          autoComplete="email"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="reg-password">{t("password")}</Label>
        <Input
          id="reg-password"
          type="password"
          className="h-9"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={8}
          autoComplete="new-password"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="reg-dept">{t("departmentOptional")}</Label>
        <Input
          id="reg-dept"
          className="h-9"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          autoComplete="organization-title"
        />
      </div>
      <Button type="submit" size="lg" className="mt-1 h-10 w-full" loading={loading}>
        {loading ? t("creatingAccount") : t("createAccount")}
      </Button>
      <p className="border-t border-border/70 pt-3.5 text-center text-sm text-muted-foreground">
        {t("alreadyHaveAccount")}{" "}
        <Link
          href="/login"
          className="font-medium text-[var(--brand-deep)] underline-offset-4 hover:underline"
        >
          {t("signIn")}
        </Link>
      </p>
    </form>
  );
}
