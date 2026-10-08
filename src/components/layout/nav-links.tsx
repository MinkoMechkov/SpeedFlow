"use client";

import { useLinkStatus } from "next/link";
import { cn } from "cn";
import { Link, usePathname } from "@/i18n/navigation";

type NavItem = { href: string; label: string };

function activeHref(pathname: string, items: NavItem[]) {
  let best: string | null = null;
  for (const { href } of items) {
    const matches = pathname === href || pathname.startsWith(`${href}/`);
    if (matches && (!best || href.length > best.length)) best = href;
  }
  return best;
}

function PendingBar() {
  const { pending } = useLinkStatus();
  return (
    <span
      aria-hidden
      className={cn(
        "nav-pending pointer-events-none absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-[var(--brand-deep)]",
        pending && "is-pending",
      )}
    />
  );
}

export function NavLinks({
  items,
  variant,
}: {
  items: NavItem[];
  variant: "desktop" | "mobile";
}) {
  const pathname = usePathname();
  const current = activeHref(pathname, items);

  return items.map((item) => {
    const active = item.href === current;
    return (
      <Link
        key={item.href}
        href={item.href}
        aria-current={active ? "page" : undefined}
        className={cn(
          "relative shrink-0 rounded-md px-3 py-1.5 transition",
          variant === "desktop" ? "text-sm" : "text-xs font-medium",
          active
            ? "bg-secondary font-medium text-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground",
        )}
      >
        {item.label}
        <PendingBar />
      </Link>
    );
  });
}
