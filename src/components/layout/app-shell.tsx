import Link from "next/link";
import type { SessionUser } from "@/lib/types";
import { SignOutButton } from "@/components/layout/sign-out-button";

export function AppShell({
  session,
  nav,
  children,
}: {
  session: SessionUser;
  nav: Array<{ href: string; label: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border/70 bg-[color-mix(in_oklab,var(--background)_88%,white)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div className="flex items-center gap-8">
            <Link href={session.employee.role === "admin" ? "/admin" : "/employee/subscriptions"} className="font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--brand)]">
              SpendFlow
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              {nav.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition hover:bg-muted hover:text-foreground"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden text-right sm:block">
              <p className="text-sm font-medium">{session.employee.name}</p>
              <p className="text-xs text-muted-foreground capitalize">
                {session.employee.role}
                {session.mode === "demo" ? " · demo" : ""}
              </p>
            </div>
            <SignOutButton />
          </div>
        </div>
        <div className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-3 md:hidden sm:px-6">
          {nav.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="shrink-0 rounded-md bg-muted px-3 py-1.5 text-xs font-medium"
            >
              {item.label}
            </Link>
          ))}
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
