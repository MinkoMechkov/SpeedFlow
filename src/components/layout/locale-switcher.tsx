"use client";

import { useLocale, useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n/navigation";
import { routing, type AppLocale } from "@/i18n/routing";
import { cn } from "cn";

export function LocaleSwitcher({ className }: { className?: string }) {
  const t = useTranslations("Locale");
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const router = useRouter();

  function switchTo(next: AppLocale) {
    if (next === locale) return;
    router.replace(pathname, { locale: next });
  }

  return (
    <div
      role="group"
      aria-label={t("switchTo")}
      className={cn(
        "inline-flex items-center gap-0.5 rounded-md border border-border/70 bg-card/60 p-0.5 text-xs font-medium",
        className,
      )}
    >
      {routing.locales.map((code) => {
        const active = code === locale;
        return (
          <button
            key={code}
            type="button"
            onClick={() => switchTo(code)}
            className={cn(
              "cursor-pointer rounded px-2 py-1 transition",
              active
                ? "bg-secondary text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
            aria-pressed={active}
          >
            {t(code)}
          </button>
        );
      })}
    </div>
  );
}
