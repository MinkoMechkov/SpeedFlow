import { getTranslations } from "next-intl/server";
import type { SessionUser } from "@/lib/types";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { MobileNav } from "@/components/layout/mobile-nav";
import { NavLinks, type NavItem } from "@/components/layout/nav-links";
import { UserMenu } from "@/components/layout/user-menu";

export async function AppShell({
  session,
  nav,
  children,
}: {
  session: SessionUser;
  nav: NavItem[];
  children: React.ReactNode;
}) {
  const t = await getTranslations("Common");
  const tRole = await getTranslations("Role");
  const homeHref =
    session.employee.role === "admin" ? "/admin" : "/employee/subscriptions";

  return (
    <div className="flex min-w-0 flex-1 flex-col">
      <header className="sticky top-0 z-40 border-b border-border/70 bg-[color-mix(in_oklab,var(--background)_82%,transparent)] backdrop-blur-md supports-[backdrop-filter]:bg-[color-mix(in_oklab,var(--background)_70%,transparent)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:gap-4 sm:px-6">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <MobileNav items={nav} />
            <Link
              href={homeHref}
              className="truncate font-[family-name:var(--font-display)] text-xl tracking-tight text-[var(--brand-deep)]"
            >
              SpendFlow
            </Link>
            <nav
              data-desktop-nav
              className="ml-5 hidden items-center gap-1 md:flex"
            >
              <NavLinks items={nav} variant="desktop" />
            </nav>
          </div>
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            <LocaleSwitcher />
            <UserMenu
              name={session.employee.name}
              roleLabel={`${tRole(session.employee.role)}${
                session.mode === "demo" ? ` · ${t("demo")}` : ""
              }`}
            />
          </div>
        </div>
      </header>
      <main className="mx-auto w-full min-w-0 max-w-6xl flex-1 px-4 py-8 sm:px-6">
        {children}
      </main>
    </div>
  );
}
