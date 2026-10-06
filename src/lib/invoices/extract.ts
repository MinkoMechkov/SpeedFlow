import type { BillingCycle, InvoiceExtractionPayload, Tool } from "@/lib/types";

export type ExtractionResult = {
  payload: InvoiceExtractionPayload;
  confidence: number;
  model: string;
};

/**
 * AI extraction with mock fallback when OPENAI_API_KEY (or LLM key) is absent.
 * Returns structured JSON only — never calculates reimbursement.
 */
export async function extractInvoiceData(input: {
  fileName: string;
  tool: Tool;
  employeeName: string;
  fileTextHint?: string;
}): Promise<ExtractionResult> {
  if (process.env.OPENAI_API_KEY) {
    try {
      return await extractWithOpenAI(input);
    } catch (error) {
      console.warn("LLM extraction failed, using mock fallback", error);
    }
  }
  return mockExtract(input);
}

async function extractWithOpenAI(input: {
  fileName: string;
  tool: Tool;
  employeeName: string;
}): Promise<ExtractionResult> {
  const prompt = `Extract invoice fields as JSON only. Keys: vendor, tool_name, invoice_number, invoice_date, billing_period_start, billing_period_end, billing_cycle (monthly|quarterly|yearly|semi_annual|other), plan, amount, currency, tax_amount, employee_name. File: ${input.fileName}. Tool: ${input.tool.name}. Employee: ${input.employeeName}.`;

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
      temperature: 0,
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "You extract structured invoice data. Never compute monthly reimbursement. Return JSON only.",
        },
        { role: "user", content: prompt },
      ],
    }),
  });

  if (!res.ok) {
    throw new Error(`OpenAI error ${res.status}`);
  }

  const data = (await res.json()) as {
    choices?: Array<{ message?: { content?: string } }>;
  };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty LLM response");

  const parsed = JSON.parse(content) as InvoiceExtractionPayload;
  return {
    payload: normalizePayload(parsed, input.tool, input.employeeName),
    confidence: 0.92,
    model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
  };
}

function mockExtract(input: {
  fileName: string;
  tool: Tool;
  employeeName: string;
}): ExtractionResult {
  const lower = input.fileName.toLowerCase();
  const profile = mockProfileForTool(input.tool, lower);

  return {
    payload: {
      vendor: input.tool.vendor,
      tool_name: input.tool.name,
      invoice_number: profile.invoiceNumber,
      invoice_date: profile.invoiceDate,
      billing_period_start: profile.periodStart,
      billing_period_end: profile.periodEnd,
      billing_cycle: profile.cycle,
      plan: profile.plan,
      amount: profile.amount,
      currency: "EUR",
      tax_amount: round2(profile.amount * 0.2),
      employee_name: lower.includes("mismatch")
        ? "Unknown Person"
        : input.employeeName,
    },
    confidence: lower.includes("lowconf") ? 0.61 : 0.97,
    model: "mock-extractor-v1",
  };
}

function mockProfileForTool(
  tool: Tool,
  fileName: string,
): {
  invoiceNumber: string;
  invoiceDate: string;
  periodStart: string;
  periodEnd: string;
  cycle: BillingCycle;
  plan: string;
  amount: number;
} {
  const stamp = fileName.replace(/[^a-z0-9]/gi, "").slice(-6).toUpperCase() || "000001";
  const today = new Date();
  const y = today.getUTCFullYear();
  const m = today.getUTCMonth();

  const name = tool.name.toLowerCase();
  if (name.includes("adobe")) {
    return {
      invoiceNumber: `INV-AD-${stamp}`,
      invoiceDate: iso(y, m, 1),
      periodStart: iso(y, m, 1),
      periodEnd: iso(y, m + 2, lastDay(y, m + 2)),
      cycle: "quarterly",
      plan: "Pro",
      amount: fileName.includes("raise") ? 120 : 90,
    };
  }
  if (name.includes("notion")) {
    return {
      invoiceNumber: `INV-NO-${stamp}`,
      invoiceDate: iso(y, 0, 5),
      periodStart: iso(y, 0, 1),
      periodEnd: iso(y, 11, 31),
      cycle: "yearly",
      plan: "Plus",
      amount: 120,
    };
  }
  if (name.includes("github")) {
    return {
      invoiceNumber: `INV-GH-${stamp}`,
      invoiceDate: iso(y, m, 3),
      periodStart: iso(y, m, 1),
      periodEnd: iso(y, m, lastDay(y, m)),
      cycle: "monthly",
      plan: "Team",
      amount: 24,
    };
  }
  if (name.includes("slack")) {
    return {
      invoiceNumber: `INV-SL-${stamp}`,
      invoiceDate: iso(y, m, 2),
      periodStart: iso(y, m, 1),
      periodEnd: iso(y, m, lastDay(y, m)),
      cycle: "monthly",
      plan: "Pro",
      amount: 12.5,
    };
  }
  return {
    invoiceNumber: `INV-FG-${stamp}`,
    invoiceDate: iso(y, m, 1),
    periodStart: iso(y, m, 1),
    periodEnd: iso(y, m, lastDay(y, m)),
    cycle: "monthly",
    plan: "Professional",
    amount: 15,
  };
}

function normalizePayload(
  parsed: InvoiceExtractionPayload,
  tool: Tool,
  employeeName: string,
): InvoiceExtractionPayload {
  return {
    vendor: parsed.vendor ?? tool.vendor,
    tool_name: parsed.tool_name ?? tool.name,
    invoice_number: parsed.invoice_number ?? null,
    invoice_date: parsed.invoice_date ?? null,
    billing_period_start: parsed.billing_period_start ?? null,
    billing_period_end: parsed.billing_period_end ?? null,
    billing_cycle: parsed.billing_cycle ?? null,
    plan: parsed.plan ?? null,
    amount: parsed.amount ?? null,
    currency: parsed.currency ?? "EUR",
    tax_amount: parsed.tax_amount ?? null,
    employee_name: parsed.employee_name ?? employeeName,
  };
}

function iso(year: number, monthIndex: number, day: number): string {
  const d = new Date(Date.UTC(year, monthIndex, day));
  return d.toISOString().slice(0, 10);
}

function lastDay(year: number, monthIndex: number): number {
  return new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
