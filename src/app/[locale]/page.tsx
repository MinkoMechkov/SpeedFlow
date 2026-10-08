import { getTranslations, setRequestLocale } from "next-intl/server";
import { RegisterForm } from "@/components/register-form";
import { LocaleSwitcher } from "@/components/layout/locale-switcher";
import { getSessionUser } from "@/lib/auth";
import { isDemoMode } from "@/lib/mode";
import { Link, redirect } from "@/i18n/navigation";

const FLOW_KEYS = [
  "flowUpload",
  "flowAnalyze",
  "flowReview",
  "flowCalculate",
  "flowReport",
] as const;

const HINT_KEYS = [
  "hintUpload",
  "hintAnalyze",
  "hintReview",
  "hintCalculate",
  "hintReport",
] as const;

type Props = { params: Promise<{ locale: string }> };

export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);

  const session = await getSessionUser();
  if (session) {
    redirect({
      href:
        session.employee.role === "admin"
          ? "/admin"
          : "/employee/subscriptions",
      locale,
    });
  }

  const t = await getTranslations("Home");
  const tAuth = await getTranslations("Auth");
  const demo = isDemoMode();

  return (
    <div className="relative flex h-full min-h-0 flex-col">
      <div className="hero-glow pointer-events-none absolute -left-24 top-10 h-72 w-72 rounded-full bg-[color-mix(in_oklab,var(--brand)_35%,transparent)] blur-3xl" />
      <div className="pointer-events-none absolute bottom-0 right-0 h-80 w-80 rounded-full bg-[color-mix(in_oklab,#c4a35a_18%,transparent)] blur-3xl" />

      <header className="relative z-10 mx-auto flex w-full max-w-5xl shrink-0 items-center justify-end gap-4 px-6 pt-5 pb-1">
        <LocaleSwitcher />
        <Link
          href="/login"
          className="text-sm font-medium text-[var(--brand-deep)] underline-offset-4 transition hover:underline"
        >
          {tAuth("signIn")}
        </Link>
      </header>

      <main className="relative flex min-h-0 flex-1 flex-col justify-center overflow-y-auto px-6 py-6">
        <div className="mx-auto grid w-full max-w-5xl gap-10 lg:grid-cols-[1fr_minmax(0,24rem)] lg:items-center lg:gap-16">
          <div className="max-w-xl">
            <p className="animate-rise font-[family-name:var(--font-display)] text-5xl tracking-tight text-[var(--brand)] sm:text-6xl">
              SpendFlow
            </p>
            <h1 className="animate-rise-delay mt-3 text-xl font-medium tracking-tight text-foreground sm:text-2xl">
              {t("headline")}
            </h1>
            <p className="animate-rise-delay mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
              {t("body")}
            </p>

            <ol className="animate-rise-delay mt-6 space-y-0">
              {FLOW_KEYS.map((key, index) => {
                const last = index === FLOW_KEYS.length - 1;
                return (
                  <li key={key} className="flex gap-3">
                    <div className="flex w-6 shrink-0 flex-col items-center">
                      <span className="flex size-6 items-center justify-center rounded-full bg-[var(--brand)] text-[11px] font-semibold text-[var(--ink)]">
                        {index + 1}
                      </span>
                      {!last ? (
                        <span
                          className="mt-1 w-px flex-1 bg-[color-mix(in_oklab,var(--brand)_45%,transparent)]"
                          aria-hidden
                        />
                      ) : null}
                    </div>
                    <div className={last ? "pb-0 pt-0.5" : "pb-3 pt-0.5"}>
                      <p className="text-sm font-medium text-foreground">
                        {t(key)}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {t(HINT_KEYS[index])}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ol>
          </div>

          <div id="register" className="animate-rise-delay w-full scroll-mt-8">
            <div className="rounded-2xl border border-border/80 bg-card/80 p-5 shadow-[0_8px_30px_-12px_rgba(28,36,20,0.18)] backdrop-blur sm:p-6">
              {demo ? (
                <div className="space-y-4">
                  <div>
                    <h2 className="font-[family-name:var(--font-display)] text-2xl tracking-tight">
                      {t("demoTitle")}
                    </h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {t("demoBody")}
                    </p>
                  </div>
                  <Link
                    href="/login"
                    className="inline-flex h-11 w-full items-center justify-center rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition hover:opacity-90"
                  >
                    {t("demoCta")}
                  </Link>
                </div>
              ) : (
                <RegisterForm />
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
