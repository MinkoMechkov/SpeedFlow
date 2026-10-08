import Link from "next/link";
import type { SessionUser } from "@/lib/types";
import { NavLinks } from "@/components/layout/nav-links";
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
    <div className="flex flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-[color-mix(in_oklab,var(--background)_82%,transparent)] backdrop-blur-md supports-[backdrop-filter]:bg-[color-mix(in_oklab,var(--background)_70%,transparent)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <div className="flex items-center gap-8">
            <Link href={session.employee.role === "admin" ? "/admin" : "/employee/subscriptions"} className="font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--brand-deep)]">
              SpendFlow
            </Link>
            <nav className="hidden items-center gap-1 md:flex">
              <NavLinks items={nav} variant="desktop" />
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
        <nav className="mx-auto flex max-w-6xl gap-2 overflow-x-auto px-4 pb-3 md:hidden sm:px-6">
          <NavLinks items={nav} variant="mobile" />
        </nav>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
