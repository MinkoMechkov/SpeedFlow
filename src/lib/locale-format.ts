import { intlLocale } from "@/i18n/routing";
import { formatEur as formatEurBase } from "@/lib/invoices/calculate";

export function formatEurForLocale(
  amount: number | null | undefined,
  locale: string,
) {
  return formatEurBase(amount, intlLocale(locale));
}

export function formatDateTimeForLocale(value: string | Date, locale: string) {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleString(intlLocale(locale));
}

export function formatMonthLabel(ym: string, locale: string) {
  const [year, month] = ym.split("-").map(Number);
  if (!year || !month) return ym;
  return new Date(Date.UTC(year, month - 1, 1)).toLocaleString(
    intlLocale(locale),
    { month: "long", year: "numeric", timeZone: "UTC" },
  );
}
