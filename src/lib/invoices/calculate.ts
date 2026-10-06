import type { BillingCycle } from "@/lib/types";

const CYCLE_MONTHS: Record<BillingCycle, number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
  semi_annual: 6,
  other: 1,
};

/** Deterministic monthly reimbursement from invoice amount + cycle/period. */
export function calculateMonthlyCost(input: {
  amount: number;
  billingCycle: BillingCycle | null | undefined;
  periodStart?: string | null;
  periodEnd?: string | null;
}): number {
  if (!Number.isFinite(input.amount) || input.amount < 0) {
    return 0;
  }

  const monthsFromPeriod = monthsBetweenInclusive(
    input.periodStart,
    input.periodEnd,
  );
  if (monthsFromPeriod && monthsFromPeriod > 0) {
    return roundMoney(input.amount / monthsFromPeriod);
  }

  const cycle = input.billingCycle ?? "monthly";
  const divisor = CYCLE_MONTHS[cycle] ?? 1;
  return roundMoney(input.amount / divisor);
}

export function monthsBetweenInclusive(
  start?: string | null,
  end?: string | null,
): number | null {
  if (!start || !end) return null;
  const s = parseDate(start);
  const e = parseDate(end);
  if (!s || !e || e < s) return null;

  const months =
    (e.getUTCFullYear() - s.getUTCFullYear()) * 12 +
    (e.getUTCMonth() - s.getUTCMonth()) +
    1;
  return months > 0 ? months : null;
}

export function monthKey(date: Date | string): string {
  const d = typeof date === "string" ? parseDate(date) : date;
  if (!d) {
    const now = new Date();
    return `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-01`;
  }
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-01`;
}

export function expandMonthsCovered(
  periodStart?: string | null,
  periodEnd?: string | null,
  fallbackMonth?: string | null,
): string[] {
  if (periodStart && periodEnd) {
    const start = parseDate(periodStart);
    const end = parseDate(periodEnd);
    if (start && end && end >= start) {
      const months: string[] = [];
      const cursor = new Date(
        Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1),
      );
      const last = new Date(
        Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), 1),
      );
      while (cursor <= last) {
        months.push(monthKey(cursor));
        cursor.setUTCMonth(cursor.getUTCMonth() + 1);
      }
      return months;
    }
  }
  return [monthKey(fallbackMonth ?? new Date())];
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function formatEur(amount: number | null | undefined): string {
  const n = amount ?? 0;
  return new Intl.NumberFormat("en-IE", {
    style: "currency",
    currency: "EUR",
  }).format(n);
}

function parseDate(value: string): Date | null {
  const d = new Date(`${value}T00:00:00.000Z`);
  return Number.isNaN(d.getTime()) ? null : d;
}
