import { ChevronLeft, ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { intlLocale } from "@/i18n/routing";
import type { MonthlySpend } from "@/lib/data";
import { formatEurForLocale } from "@/lib/locale-format";
import { cn } from "@/lib/utils";

/** Round the axis max up to 1/2/2.5/5 × 10^n so gridlines land on clean values. */
function niceMax(value: number) {
  if (value <= 0) return 100;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 2.5, 5, 10].find((s) => s * magnitude >= value) ?? 10;
  return step * magnitude;
}

function monthName(month: string, locale: string, style: "short" | "long") {
  const [y, m] = month.split("-").map(Number);
  const long = new Date(Date.UTC(y, m - 1, 1)).toLocaleString(
    intlLocale(locale),
    { month: "long", timeZone: "UTC" },
  );
  // ICU's bg short month is numeric ("10"), so abbreviate the long name.
  return style === "short" ? long.slice(0, 3) : long;
}

function formatAxisEur(amount: number, locale: string) {
  return new Intl.NumberFormat(intlLocale(locale), {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export async function SpendChart({
  data,
  year,
  locale,
}: {
  data: MonthlySpend[];
  year: number;
  locale: string;
}) {
  const t = await getTranslations("Admin");
  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const currentMonth = now.getUTCMonth();

  const totals = data.map((d) => d.paid + d.approved);
  const yearTotal = totals.reduce((sum, v) => sum + v, 0);
  const max = niceMax(Math.max(...totals));
  const gridlines = [1, 0.5, 0];

  return (
    <section className="space-y-3">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-medium">{t("spendTitle")}</h2>
          <p className="text-sm text-muted-foreground">
            {t("spendYearTotal", { year })}{" "}
            <span className="font-medium text-foreground tabular-nums">
              {formatEurForLocale(yearTotal, locale)}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-1">
          <Link
            href={`/admin?year=${year - 1}`}
            aria-label={t("spendPrevYear")}
            className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <ChevronLeft className="size-4" />
          </Link>
          <span className="min-w-12 text-center text-sm font-medium tabular-nums">
            {year}
          </span>
          {year < currentYear ? (
            <Link
              href={`/admin?year=${year + 1}`}
              aria-label={t("spendNextYear")}
              className="rounded-md p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
            >
              <ChevronRight className="size-4" />
            </Link>
          ) : (
            <span className="p-1.5 text-muted-foreground/40" aria-hidden>
              <ChevronRight className="size-4" />
            </span>
          )}
        </div>
      </div>

      <div className="rounded-xl border border-border/80 bg-card/60 p-4 sm:p-5">
        <div className="relative h-56">
          {gridlines.map((g) => (
            <div
              key={g}
              className="absolute inset-x-0 border-t border-dashed border-border/70"
              style={{ bottom: `${g * 100}%` }}
            >
              {g > 0 ? (
                <span className="absolute -top-4 left-0 text-[10px] text-muted-foreground tabular-nums">
                  {formatAxisEur(max * g, locale)}
                </span>
              ) : null}
            </div>
          ))}

          {yearTotal === 0 ? (
            <p className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
              {t("spendEmpty", { year })}
            </p>
          ) : null}

          <ol className="absolute inset-0 flex items-end gap-1 sm:gap-2">
            {data.map((d, i) => {
              const total = d.paid + d.approved;
              const label = monthName(d.month, locale, "long");
              return (
                <li
                  key={d.month}
                  tabIndex={total > 0 ? 0 : -1}
                  className="group relative flex h-full flex-1 flex-col justify-end outline-none"
                >
                  <span className="sr-only">
                    {label}: {formatEurForLocale(total, locale)}
                  </span>
                  <div
                    className="mx-auto flex w-full max-w-12 flex-col overflow-hidden rounded-t-[4px] transition-opacity group-hover:opacity-85 group-focus-visible:opacity-85"
                    style={{ height: `${(total / max) * 100}%` }}
                    aria-hidden
                  >
                    <div
                      className="bg-[var(--brand)]"
                      style={{ flexGrow: d.approved }}
                    />
                    <div
                      className="bg-[var(--brand-deep)]"
                      style={{ flexGrow: d.paid }}
                    />
                  </div>

                  {total > 0 ? (
                    <div
                      aria-hidden
                      className={cn(
                        "pointer-events-none absolute z-10 mb-1 hidden w-max min-w-36 rounded-lg border bg-popover px-3 py-2 text-xs shadow-md group-hover:block group-focus-visible:block",
                        i < 3 ? "left-0" : i > 8 ? "right-0" : "left-1/2 -translate-x-1/2",
                      )}
                      style={{ bottom: `${(total / max) * 100}%` }}
                    >
                      <p className="mb-1 font-medium capitalize">{label}</p>
                      <p className="flex justify-between gap-4">
                        <span className="text-muted-foreground">{t("spendPaid")}</span>
                        <span className="tabular-nums">{formatEurForLocale(d.paid, locale)}</span>
                      </p>
                      <p className="flex justify-between gap-4">
                        <span className="text-muted-foreground">{t("spendApproved")}</span>
                        <span className="tabular-nums">{formatEurForLocale(d.approved, locale)}</span>
                      </p>
                      <p className="mt-1 flex justify-between gap-4 border-t pt-1 font-medium">
                        <span>{t("spendTotal")}</span>
                        <span className="tabular-nums">{formatEurForLocale(total, locale)}</span>
                      </p>
                    </div>
                  ) : null}
                </li>
              );
            })}
          </ol>
        </div>

        <ol className="mt-2 flex gap-1 sm:gap-2" aria-hidden>
          {data.map((d, i) => (
            <li
              key={d.month}
              className={cn(
                "flex-1 truncate text-center text-[10px] text-muted-foreground capitalize sm:text-xs",
                year === currentYear &&
                  i === currentMonth &&
                  "font-semibold text-foreground",
              )}
            >
              {monthName(d.month, locale, "short")}
            </li>
          ))}
        </ol>

        <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-[var(--brand-deep)]" />
            {t("spendPaid")}
          </span>
          <span className="flex items-center gap-1.5">
            <span className="size-2.5 rounded-sm bg-[var(--brand)]" />
            {t("spendApproved")}
          </span>
        </div>
      </div>
    </section>
  );
}
