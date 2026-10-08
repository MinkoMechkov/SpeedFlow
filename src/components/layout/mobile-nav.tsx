"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Menu } from "lucide-react";
import { useLinkStatus } from "next/link";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Link, usePathname } from "@/i18n/navigation";
import type { NavItem } from "@/components/layout/nav-links";
import { MOBILE_NAV_TOUR_EVENT } from "@/lib/mobile-nav-tour";
import { cn } from "cn";

function activeHref(pathname: string, items: NavItem[]) {
  let best: string | null = null;
  for (const { href } of items) {
    const matches = pathname === href || pathname.startsWith(`${href}/`);
    if (matches && (!best || href.length > best.length)) best = href;
  }
  return best;
}

function PendingDot() {
  const { pending } = useLinkStatus();
  if (!pending) return null;
  return (
    <span
      aria-hidden
      className="ml-auto size-1.5 shrink-0 animate-pulse rounded-full bg-[var(--brand-deep)]"
    />
  );
}

export function MobileNav({ items }: { items: NavItem[] }) {
  const t = useTranslations("Common");
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  // Opened by the onboarding tour: keep the sheet non-modal so its focus
  // trap and outside-press dismissal don't fight the tour popover.
  const [tourDriven, setTourDriven] = useState(false);
  const current = activeHref(pathname, items);

  useEffect(() => {
    function onTourNav(event: Event) {
      const detail = (event as CustomEvent<{ open?: boolean }>).detail;
      if (typeof detail?.open !== "boolean") return;
      setOpen(detail.open);
      setTourDriven(detail.open);
    }
    window.addEventListener(MOBILE_NAV_TOUR_EVENT, onTourNav);
    return () => window.removeEventListener(MOBILE_NAV_TOUR_EVENT, onTourNav);
  }, []);

  return (
    <>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="md:hidden"
        aria-label={t("menu")}
        data-tour="mobile-menu"
        onClick={() => {
          setTourDriven(false);
          setOpen(true);
        }}
      >
        <Menu className="size-5" />
      </Button>
      <Sheet
        open={open}
        onOpenChange={setOpen}
        modal={!tourDriven}
        disablePointerDismissal={tourDriven}
      >
        <SheetContent side="left" className="w-[min(100%,18rem)] gap-0 p-0">
          <SheetHeader className="border-b border-border/70">
            <SheetTitle className="font-[family-name:var(--font-display)] text-lg tracking-tight text-[var(--brand-deep)]">
              SpendFlow
            </SheetTitle>
          </SheetHeader>
          <nav
            data-mobile-nav
            className="flex flex-col gap-1 p-3"
            aria-label={t("menu")}
          >
            {items.map((item) => {
              const active = item.href === current;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  data-tour={item.tourId}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-center rounded-lg px-3 py-2.5 text-sm transition",
                    active
                      ? "bg-secondary font-medium text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground",
                  )}
                >
                  {item.label}
                  <PendingDot />
                </Link>
              );
            })}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  );
}
