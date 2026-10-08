import { getTranslations } from "next-intl/server";
import { ArrowLeft, CheckCircle2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";

export async function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const t = await getTranslations("Auth");
  const tCommon = await getTranslations("Common");
  const highlights = [t("highlight1"), t("highlight2"), t("highlight3")];

  return (
    <div className="mx-auto grid w-full max-w-5xl flex-1 items-center gap-10 px-6 py-10 lg:grid-cols-[1fr_minmax(0,26rem)] lg:gap-16 lg:py-16">
      <aside className="hidden lg:block">
        <Link
          href="/"
          className="font-[family-name:var(--font-display)] text-5xl tracking-tight text-[var(--brand-deep)]"
        >
          SpendFlow
        </Link>
        <p className="mt-4 max-w-sm text-lg text-muted-foreground">
          {t("pitch")}
        </p>
        <ul className="mt-10 space-y-4">
          {highlights.map((item) => (
            <li key={item} className="flex items-start gap-3 text-sm">
              <CheckCircle2
                className="mt-0.5 size-4 shrink-0 text-[var(--brand-deep)]"
                aria-hidden
              />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </aside>

      <div className="w-full">
        <div className="flex items-center justify-between gap-3">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden />
            {tCommon("backHome")}
          </Link>
          <LocaleSwitcher />
        </div>
        <div className="mt-4 rounded-2xl border border-border/80 bg-card/80 p-6 shadow-[0_8px_30px_-12px_rgba(28,36,20,0.18)] backdrop-blur sm:p-8">
          <Link
            href="/"
            className="font-[family-name:var(--font-display)] text-2xl tracking-tight text-[var(--brand-deep)] lg:hidden"
          >
            SpendFlow
          </Link>
          <h1 className="mt-3 font-[family-name:var(--font-display)] text-3xl tracking-tight lg:mt-0">
            {title}
          </h1>
          <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>
          <div className="mt-6">{children}</div>
        </div>
      </div>
    </div>
  );
}
