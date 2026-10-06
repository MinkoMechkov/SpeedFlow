import type { BillingCycle, Employee, Invoice, Subscription } from "@/lib/types";

const SUPPORTED_CURRENCIES = new Set(["EUR", "USD", "GBP"]);

export type ValidationInput = {
  employee: Employee;
  extraction: {
    invoice_number: string | null;
    invoice_date: string | null;
    billing_period_start: string | null;
    billing_period_end: string | null;
    billing_cycle: BillingCycle | null;
    amount: number | null;
    currency: string | null;
    plan: string | null;
    employee_name: string | null;
  };
  existingInvoices: Invoice[];
  existingSubscription: Subscription | null;
};

export function validateInvoiceExtraction(input: ValidationInput): string[] {
  const flags: string[] = [];
  const { extraction, employee } = input;

  if (extraction.amount == null || extraction.amount <= 0) {
    flags.push("missing_or_invalid_amount");
  }
  if (!extraction.invoice_number) flags.push("missing_invoice_number");
  if (!extraction.invoice_date) flags.push("missing_invoice_date");
  if (!extraction.billing_cycle) flags.push("missing_billing_cycle");
  if (!extraction.billing_period_start || !extraction.billing_period_end) {
    flags.push("missing_billing_period");
  } else if (
    extraction.billing_period_end < extraction.billing_period_start
  ) {
    flags.push("invalid_billing_period");
  }

  if (
    extraction.currency &&
    !SUPPORTED_CURRENCIES.has(extraction.currency.toUpperCase())
  ) {
    flags.push("unsupported_currency");
  }

  if (extraction.invoice_number) {
    const duplicate = input.existingInvoices.find(
      (inv) =>
        inv.invoice_number === extraction.invoice_number &&
        inv.status !== "rejected",
    );
    if (duplicate) flags.push("duplicate_invoice_number");
  }

  if (!input.existingSubscription) {
    flags.push("no_matching_subscription");
  }

  if (extraction.employee_name) {
    const extracted = normalizeName(extraction.employee_name);
    const expected = normalizeName(employee.name);
    if (extracted && expected && !namesLikelyMatch(extracted, expected)) {
      flags.push("employee_name_mismatch");
    }
  }

  if (
    input.existingSubscription &&
    extraction.amount != null &&
    input.existingSubscription.current_amount != null &&
    Math.abs(extraction.amount - input.existingSubscription.current_amount) >
      0.01
  ) {
    flags.push("price_change_detected");
  }

  if (!extraction.plan) flags.push("missing_plan");

  return flags;
}

function normalizeName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, " ");
}

function namesLikelyMatch(a: string, b: string): boolean {
  if (a === b) return true;
  if (a.includes(b) || b.includes(a)) return true;
  const aParts = a.split(" ");
  const bParts = b.split(" ");
  return aParts.some((p) => bParts.includes(p) && p.length > 2);
}
