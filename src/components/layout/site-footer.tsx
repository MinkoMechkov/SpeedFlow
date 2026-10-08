import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function SiteFooter() {
  const t = await getTranslations("Footer");
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border/60">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between gap-3 px-4 py-2.5 sm:px-6 sm:py-4">
        <div className="flex flex-col gap-1">
          <Link
            href="/"
            className="font-[family-name:var(--font-display)] text-sm tracking-tight text-[var(--brand-deep)] transition hover:text-foreground"
          >
            SpendFlow
          </Link>
          <p className="hidden text-xs text-muted-foreground sm:block">{t("tagline")}</p>
        </div>
        <p className="text-xs text-muted-foreground">© {year}</p>
      </div>
    </footer>
  );
}
