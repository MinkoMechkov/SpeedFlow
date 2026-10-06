import { convertExtractionToEur } from "@/lib/invoices/currency";
import type { BillingCycle, InvoiceExtractionPayload, Tool } from "@/lib/types";

export type ExtractionResult = {
  payload: InvoiceExtractionPayload;
  confidence: number;
  model: string;
  /** Extra validation / audit flags from extraction (mock fallback, FX, …). */
  flags: string[];
};

const MAX_INLINE_BYTES = 15 * 1024 * 1024;
const GEMINI_MAX_ATTEMPTS = 3;

const EXTRACTION_SCHEMA = {
  type: "object",
  properties: {
    vendor: { type: "string", nullable: true },
    tool_name: { type: "string", nullable: true },
    invoice_number: { type: "string", nullable: true },
    invoice_date: { type: "string", nullable: true },
    billing_period_start: { type: "string", nullable: true },
    billing_period_end: { type: "string", nullable: true },
    billing_cycle: {
      type: "string",
      nullable: true,
      enum: ["monthly", "quarterly", "yearly", "semi_annual", "other", null],
    },
    plan: { type: "string", nullable: true },
    amount: { type: "number", nullable: true },
    currency: { type: "string", nullable: true },
    tax_amount: { type: "number", nullable: true },
    employee_name: { type: "string", nullable: true },
  },
  required: [
    "vendor",
    "tool_name",
    "invoice_number",
    "invoice_date",
    "billing_period_start",
    "billing_period_end",
    "billing_cycle",
    "plan",
    "amount",
    "currency",
    "tax_amount",
    "employee_name",
  ],
} as const;

/**
 * AI extraction with mock fallback when GEMINI_API_KEY is absent.
 * Money fields are normalized to EUR in app code (not by the model).
 * Returns structured JSON only — never calculates reimbursement.
 */
export async function extractInvoiceData(input: {
  fileName: string;
  tool: Tool;
  employeeName: string;
  fileBytes?: ArrayBuffer;
  mimeType?: string;
}): Promise<ExtractionResult> {
  if (process.env.GEMINI_API_KEY) {
    try {
      const result = await extractWithGemini(input);
      return await finalizeInEur(result);
    } catch (error) {
      console.warn("LLM extraction failed, using mock fallback", error);
      const mock = mockExtract(input);
      return {
        ...mock,
        confidence: Math.min(mock.confidence, 0.45),
        flags: ["mock_extraction_used"],
      };
    }
  }
  const mock = mockExtract(input);
  return { ...mock, flags: ["mock_extraction_used"] };
}

async function finalizeInEur(
  result: Omit<ExtractionResult, "flags">,
): Promise<ExtractionResult> {
  const converted = await convertExtractionToEur({
    amount: result.payload.amount,
    tax_amount: result.payload.tax_amount,
    currency: result.payload.currency,
    invoiceDate: result.payload.invoice_date,
  });

  return {
    ...result,
    payload: {
      ...result.payload,
      amount: converted.amount,
      tax_amount: converted.tax_amount,
      currency: converted.currency,
    },
    flags: converted.flags,
  };
}

async function extractWithGemini(input: {
  fileName: string;
  tool: Tool;
  employeeName: string;
  fileBytes?: ArrayBuffer;
  mimeType?: string;
}): Promise<Omit<ExtractionResult, "flags">> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY missing");

  const model = process.env.GEMINI_MODEL ?? "gemini-3.8-flash";
  const prompt = `Extract invoice fields from the attached document (or filename if no document).
Tool context: ${input.tool.name} (${input.tool.vendor}). Expected employee: ${input.employeeName}. File name: ${input.fileName}.
Rules:
- amount = total amount due (including tax), in the invoice's original currency.
- currency = ISO code on the invoice (USD, EUR, GBP, …). Do NOT convert currencies.
- tax_amount = tax/VAT line if present, same currency as amount.
- Dates as YYYY-MM-DD. billing_cycle from the billed period when unclear.
- Never compute monthly reimbursement.`;

  type Part =
    | { text: string }
    | { inline_data: { mime_type: string; data: string } };

  const parts: Part[] = [];

  if (input.fileBytes && input.fileBytes.byteLength > 0) {
    if (input.fileBytes.byteLength > MAX_INLINE_BYTES) {
      console.warn(
        `Invoice file ${input.fileName} exceeds ${MAX_INLINE_BYTES} bytes; skipping inline Gemini attachment`,
      );
    } else {
      parts.push({
        inline_data: {
          mime_type: input.mimeType ?? "application/pdf",
          data: Buffer.from(input.fileBytes).toString("base64"),
        },
      });
    }
  }

  parts.push({ text: prompt });

  const body = JSON.stringify({
    systemInstruction: {
      parts: [
        {
          text: "You extract structured invoice data from documents. Preserve the invoice currency and totals exactly. Never convert currencies. Never compute monthly reimbursement. Return JSON only matching the schema.",
        },
      ],
    },
    contents: [{ role: "user", parts }],
    generationConfig: {
      temperature: 0,
      responseMimeType: "application/json",
      responseSchema: EXTRACTION_SCHEMA,
    },
  });

  let lastError: Error | null = null;
  for (let attempt = 1; attempt <= GEMINI_MAX_ATTEMPTS; attempt++) {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body,
      },
    );

    if (res.status === 503 || res.status === 429) {
      const errBody = await res.text().catch(() => "");
      lastError = new Error(`Gemini error ${res.status}: ${errBody.slice(0, 300)}`);
      if (attempt < GEMINI_MAX_ATTEMPTS) {
        await sleep(1000 * attempt);
        continue;
      }
      throw lastError;
    }

    if (!res.ok) {
      const errBody = await res.text().catch(() => "");
      throw new Error(`Gemini error ${res.status}: ${errBody.slice(0, 300)}`);
    }

    const data = (await res.json()) as {
      candidates?: Array<{
        content?: { parts?: Array<{ text?: string }> };
      }>;
    };
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) throw new Error("Empty Gemini response");

    const parsed = JSON.parse(content) as InvoiceExtractionPayload;
    return {
      payload: normalizePayload(parsed, input.tool, input.employeeName),
      confidence: 0.9,
      model,
    };
  }

  throw lastError ?? new Error("Gemini extraction failed");
}

function mockExtract(input: {
  fileName: string;
  tool: Tool;
  employeeName: string;
}): Omit<ExtractionResult, "flags"> {
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
  const stamp =
    fileName.replace(/[^a-z0-9]/gi, "").slice(-6).toUpperCase() || "000001";
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
    currency: parsed.currency ? parsed.currency.toUpperCase() : "EUR",
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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
