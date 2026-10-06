import { USD_TO_EUR } from "@/lib/invoices/currency";

export type FlagTone = "warning" | "danger" | "info";

export type FlagInfo = {
  code: string;
  label: string;
  description: string;
  tone: FlagTone;
};

const CATALOG: Record<string, Omit<FlagInfo, "code">> = {
  missing_or_invalid_amount: {
    label: "Missing or invalid amount",
    description:
      "No usable total was found on the invoice. Confirm the amount before approving.",
    tone: "danger",
  },
  missing_invoice_number: {
    label: "Missing invoice number",
    description:
      "The invoice number could not be read. Add it manually for audit and duplicate checks.",
    tone: "warning",
  },
  missing_invoice_date: {
    label: "Missing invoice date",
    description: "The invoice date was not extracted. Set the correct date before approval.",
    tone: "warning",
  },
  missing_billing_cycle: {
    label: "Missing billing cycle",
    description:
      "Billing cycle (monthly, yearly, …) is unknown. Monthly cost may be wrong until you set it.",
    tone: "warning",
  },
  missing_billing_period: {
    label: "Missing billing period",
    description:
      "Start or end of the billing period is missing. Period is used for monthly reimbursement math.",
    tone: "warning",
  },
  invalid_billing_period: {
    label: "Invalid billing period",
    description: "Period end is before period start. Correct the dates before approving.",
    tone: "danger",
  },
  unsupported_currency: {
    label: "Unsupported currency",
    description:
      "This currency is not in the supported set (EUR, USD, GBP). Convert or edit the amount carefully.",
    tone: "danger",
  },
  duplicate_invoice_number: {
    label: "Possible duplicate",
    description:
      "Another non-rejected invoice already uses this invoice number. Check you are not reimbursing twice.",
    tone: "danger",
  },
  no_matching_subscription: {
    label: "No matching subscription",
    description:
      "No existing subscription was found for this employee and tool. Approving will create one.",
    tone: "info",
  },
  employee_name_mismatch: {
    label: "Name mismatch",
    description:
      "The name on the invoice does not clearly match the employee account. Verify ownership before approval.",
    tone: "warning",
  },
  price_change_detected: {
    label: "Price change",
    description:
      "The amount differs from the employee’s current subscription price. Confirm before updating reimbursement.",
    tone: "warning",
  },
  missing_plan: {
    label: "Missing plan",
    description: "Plan or tier name was not extracted. Optional, but useful for reporting.",
    tone: "info",
  },
  mock_extraction_used: {
    label: "Mock extraction",
    description:
      "Live AI extraction was not used. Fields may be placeholders — review carefully.",
    tone: "warning",
  },
  fx_rate_fixed: {
    label: "Fixed FX rate",
    description: `Converted with the company fixed USD→EUR rate (${USD_TO_EUR}).`,
    tone: "info",
  },
  fx_rate_fallback: {
    label: "Fallback FX rate",
    description:
      "Live exchange rates were unavailable, so a static fallback rate was used.",
    tone: "warning",
  },
};

function titleCaseCode(code: string): string {
  return code
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/** Resolve a stored flag code into label, description, and tone. */
export function describeFlag(code: string): FlagInfo {
  const known = CATALOG[code];
  if (known) return { code, ...known };

  const converted = /^converted_from_([A-Z]{3})$/.exec(code);
  if (converted) {
    const currency = converted[1];
    return {
      code,
      label: `Converted from ${currency}`,
      description:
        currency === "USD"
          ? `Original amount was in ${currency} and converted to EUR using the fixed company rate.`
          : `Original amount was in ${currency} and converted to EUR for reimbursement.`,
      tone: "info",
    };
  }

  const fxRate = /^fx_rate_(\d+(?:\.\d+)?)$/.exec(code);
  if (fxRate) {
    return {
      code,
      label: `FX rate ${fxRate[1]}`,
      description: `Exchange rate applied: ${fxRate[1]} EUR per 1 unit of the original currency.`,
      tone: "info",
    };
  }

  const fxUnavailable = /^fx_unavailable_([A-Z0-9]+)$/.exec(code);
  if (fxUnavailable) {
    return {
      code,
      label: `FX unavailable (${fxUnavailable[1]})`,
      description: `Could not convert ${fxUnavailable[1]} to EUR. Amount was left in the original currency.`,
      tone: "danger",
    };
  }

  return {
    code,
    label: titleCaseCode(code),
    description: "Additional validation or processing note from upload.",
    tone: "info",
  };
}

export function describeFlags(codes: string[]): FlagInfo[] {
  return codes.map(describeFlag);
}
