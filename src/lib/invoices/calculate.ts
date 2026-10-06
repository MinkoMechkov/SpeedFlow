import type { BillingCycle } from "@/lib/types";

const CYCLE_MONTHS: Record<BillingCycle, number> = {
  monthly: 1,
  quarterly: 3,
  yearly: 12,
  semi_annual: 6,
  other: 1,
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;

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

  // Prefer day-span months (Sep 27–Oct 27 ≈ 30 days → 1 month), not calendar
  // month labels (which wrongly treat that as Sep+Oct = 2).
  const monthsFromPeriod = monthsCoveredByPeriod(
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

/**
 * How many billing months a period covers, from day length (~30 days = 1 month).
 * Example: 2026-09-27 → 2026-10-27 = 30 days → 1.
 */
export function monthsCoveredByPeriod(
  start?: string | null,
  end?: string | null,
): number | null {
  if (!start || !end) return null;
  const s = parseDate(start);
  const e = parseDate(end);
  if (!s || !e || e < s) return null;

  const days = Math.max(1, Math.round((e.getTime() - s.getTime()) / MS_PER_DAY));
  return Math.max(1, Math.round(days / 30));
}

/** @deprecated Use monthsCoveredByPeriod — kept for tests/callers expecting calendar count. */
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

/**
 * Months that receive the monthly cost on approve.
 * Uses the same day-based month count as calculateMonthlyCost, starting at
 * period start (so a 30-day Sep→Oct invoice posts to one month, not two).
 */
/** Last `count` calendar months ending at `end` (newest first). */
export function recentMonthKeys(
  count: number,
  end: Date | string = new Date(),
): string[] {
  const endDate = typeof end === "string" ? parseDate(end) : end;
  const base = endDate ?? new Date();
  const cursor = new Date(
    Date.UTC(base.getUTCFullYear(), base.getUTCMonth(), 1),
  );
  const months: string[] = [];
  const n = Math.max(1, Math.min(12, Math.floor(count)));
  for (let i = 0; i < n; i++) {
    months.push(monthKey(cursor));
    cursor.setUTCMonth(cursor.getUTCMonth() - 1);
  }
  return months;
}

export function expandMonthsCovered(
  periodStart?: string | null,
  periodEnd?: string | null,
  fallbackMonth?: string | null,
): string[] {
  const start = periodStart ? parseDate(periodStart) : null;
  const count = monthsCoveredByPeriod(periodStart, periodEnd);

  if (start && count) {
    const months: string[] = [];
    const cursor = new Date(
      Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), 1),
    );
    for (let i = 0; i < count; i++) {
      months.push(monthKey(cursor));
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
    return months;
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
