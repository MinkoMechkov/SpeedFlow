/**
 * Company-fixed USD→EUR rate (EUR per 1 USD).
 * Used for every USD invoice so the same dollar amount always yields the same EUR.
 */
export const USD_TO_EUR = 0.8616;

/** Fallback rates → EUR when the FX API is unavailable (non-USD). */
const FALLBACK_TO_EUR: Record<string, number> = {
  GBP: 1.17,
  CHF: 1.05,
};

export type EurConversion = {
  amount: number | null;
  tax_amount: number | null;
  currency: string;
  flags: string[];
  /** Original currency before conversion, if converted. */
  originalCurrency: string | null;
  rate: number | null;
};

/**
 * Convert invoice money fields to EUR. Identity when already EUR.
 * USD always uses the fixed company rate. Other currencies use Frankfurter (ECB)
 * with static fallbacks if the API fails.
 */
export async function convertExtractionToEur(input: {
  amount: number | null;
  tax_amount: number | null;
  currency: string | null;
  invoiceDate?: string | null;
}): Promise<EurConversion> {
  const currency = (input.currency ?? "EUR").toUpperCase();
  if (currency === "EUR") {
    return {
      amount: input.amount,
      tax_amount: input.tax_amount,
      currency: "EUR",
      flags: [],
      originalCurrency: null,
      rate: 1,
    };
  }

  if (currency === "USD") {
    return applyRate({
      amount: input.amount,
      tax_amount: input.tax_amount,
      currency,
      rate: USD_TO_EUR,
      flags: [
        "converted_from_USD",
        `fx_rate_${USD_TO_EUR.toFixed(4)}`,
        "fx_rate_fixed",
      ],
    });
  }

  const { rate, usedFallback } = await fetchRateToEur(
    currency,
    input.invoiceDate,
  );
  if (rate == null) {
    return {
      amount: input.amount,
      tax_amount: input.tax_amount,
      currency,
      flags: ["unsupported_currency", `fx_unavailable_${currency}`],
      originalCurrency: currency,
      rate: null,
    };
  }

  const flags = [`converted_from_${currency}`, `fx_rate_${rate.toFixed(4)}`];
  if (usedFallback) flags.push("fx_rate_fallback");

  return applyRate({
    amount: input.amount,
    tax_amount: input.tax_amount,
    currency,
    rate,
    flags,
  });
}

function applyRate(input: {
  amount: number | null;
  tax_amount: number | null;
  currency: string;
  rate: number;
  flags: string[];
}): EurConversion {
  return {
    amount: input.amount == null ? null : round2(input.amount * input.rate),
    tax_amount:
      input.tax_amount == null ? null : round2(input.tax_amount * input.rate),
    currency: "EUR",
    flags: input.flags,
    originalCurrency: input.currency,
    rate: input.rate,
  };
}

async function fetchRateToEur(
  from: string,
  invoiceDate?: string | null,
): Promise<{ rate: number | null; usedFallback: boolean }> {
  const datePath =
    invoiceDate && /^\d{4}-\d{2}-\d{2}$/.test(invoiceDate)
      ? invoiceDate
      : "latest";

  try {
    const url = `https://api.frankfurter.dev/v1/${datePath}?from=${encodeURIComponent(from)}&to=EUR`;
    const res = await fetch(url);
    if (res.ok) {
      const data = (await res.json()) as { rates?: { EUR?: number } };
      const rate = data.rates?.EUR;
      if (typeof rate === "number" && rate > 0) {
        return { rate, usedFallback: false };
      }
    }
  } catch (error) {
    console.warn("FX fetch failed", error);
  }

  const fallback = FALLBACK_TO_EUR[from];
  if (fallback) return { rate: fallback, usedFallback: true };
  return { rate: null, usedFallback: true };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
