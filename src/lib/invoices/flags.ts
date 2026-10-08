import { USD_TO_EUR } from "@/lib/invoices/currency";

export type FlagTone = "warning" | "danger" | "info";

export type FlagDescriptor = {
  code: string;
  tone: FlagTone;
  labelKey: string;
  descriptionKey: string;
  params?: Record<string, string | number>;
};

const CATALOG: Record<string, { tone: FlagTone }> = {
  missing_or_invalid_amount: { tone: "danger" },
  missing_invoice_number: { tone: "warning" },
  missing_invoice_date: { tone: "warning" },
  missing_billing_cycle: { tone: "warning" },
  missing_billing_period: { tone: "warning" },
  invalid_billing_period: { tone: "danger" },
  unsupported_currency: { tone: "danger" },
  duplicate_invoice_number: { tone: "danger" },
  no_matching_subscription: { tone: "info" },
  employee_name_mismatch: { tone: "warning" },
  price_change_detected: { tone: "warning" },
  missing_plan: { tone: "info" },
  mock_extraction_used: { tone: "warning" },
  fx_rate_fixed: { tone: "info" },
  fx_rate_fallback: { tone: "warning" },
};

function titleCaseCode(code: string): string {
  return code
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Resolve a stored flag code into i18n keys + tone. */
export function describeFlag(code: string): FlagDescriptor {
  const known = CATALOG[code];
  if (known) {
    const params =
      code === "fx_rate_fixed" ? { rate: USD_TO_EUR } : undefined;
    return {
      code,
      tone: known.tone,
      labelKey: `${code}.label`,
      descriptionKey: `${code}.description`,
      params,
    };
  }

  const converted = /^converted_from_([A-Z]{3})$/.exec(code);
  if (converted) {
    const currency = converted[1];
    return {
      code,
      tone: "info",
      labelKey: "converted_from.label",
      descriptionKey:
        currency === "USD"
          ? "converted_from.descriptionUsd"
          : "converted_from.descriptionOther",
      params: { currency },
    };
  }

  const fxRate = /^fx_rate_(\d+(?:\.\d+)?)$/.exec(code);
  if (fxRate) {
    return {
      code,
      tone: "info",
      labelKey: "fx_rate.label",
      descriptionKey: "fx_rate.description",
      params: { rate: fxRate[1] },
    };
  }

  const fxUnavailable = /^fx_unavailable_([A-Z0-9]+)$/.exec(code);
  if (fxUnavailable) {
    return {
      code,
      tone: "danger",
      labelKey: "fx_unavailable.label",
      descriptionKey: "fx_unavailable.description",
      params: { currency: fxUnavailable[1] },
    };
  }

  return {
    code,
    tone: "info",
    labelKey: "unknown.label",
    descriptionKey: "unknown.description",
    params: { code: titleCaseCode(code) },
  };
}

export function describeFlags(codes: string[]): FlagDescriptor[] {
  return codes.map(describeFlag);
}
