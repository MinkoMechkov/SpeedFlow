"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { Employee } from "@/lib/types";

export function LoginPanel({
  demoMode,
  demoUsers,
}: {
  demoMode: boolean;
  demoUsers: Employee[];
}) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function demoLogin(employeeId: string) {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ employeeId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Demo login failed");
      router.push(data.redirect);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function supabaseLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push("/employee/subscriptions");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  if (demoMode) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-muted-foreground">
          Demo mode is on — pick a persona. No Supabase credentials required.
        </p>
        <div className="grid gap-2">
          {demoUsers.map((user) => (
            <Button
              key={user.id}
              variant={user.role === "admin" ? "default" : "outline"}
              className="justify-between"
              disabled={loading}
              onClick={() => demoLogin(user.id)}
            >
              <span>{user.name}</span>
              <span className="text-xs opacity-80 capitalize">{user.role}</span>
            </Button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={supabaseLogin} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">Work email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>
      <Button type="submit" className="w-full" disabled={loading}>
        {loading ? "Signing in…" : "Sign in"}
      </Button>
    </form>
  );
}
