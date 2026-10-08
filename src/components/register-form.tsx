"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
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
      if (!res.ok) throw new Error(data.error ?? "Registration failed");

      if (data.redirect) {
        toast.success("Account created");
        router.push(data.redirect);
        router.refresh();
        return;
      }

      toast.success(data.message ?? "Account created — please sign in");
      router.push("/login");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Registration failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full space-y-3.5">
      <div>
        <h2 className="font-[family-name:var(--font-display)] text-xl tracking-tight sm:text-2xl">
          Create account
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          New accounts are employees. Only admins can grant admin access.
        </p>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="reg-name">Full name</Label>
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
        <Label htmlFor="reg-email">Work email</Label>
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
        <Label htmlFor="reg-password">Password</Label>
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
        <Label htmlFor="reg-dept">Department (optional)</Label>
        <Input
          id="reg-dept"
          className="h-9"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          autoComplete="organization-title"
        />
      </div>
      <Button type="submit" size="lg" className="mt-1 h-10 w-full" loading={loading}>
        {loading ? "Creating account…" : "Create account"}
      </Button>
      <p className="border-t border-border/70 pt-3.5 text-center text-sm text-muted-foreground">
        Already have an account?{" "}
        <Link
          href="/login"
          className="font-medium text-[var(--brand-deep)] underline-offset-4 hover:underline"
        >
          Sign in
        </Link>
      </p>
    </form>
  );
}
