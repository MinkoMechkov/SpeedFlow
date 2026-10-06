import { NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { reviewInvoice } from "@/lib/data";
import type { BillingCycle } from "@/lib/types";

type Body = {
  action: "approve" | "reject" | "edit";
  edits?: {
    invoice_number?: string;
    invoice_date?: string;
    period_start?: string;
    period_end?: string;
    billing_cycle?: BillingCycle;
    plan?: string;
    amount?: number;
    currency?: string;
    tax_amount?: number;
  };
};

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await getSessionUser();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (session.employee.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await context.params;
  const body = (await request.json()) as Body;
  if (!body.action) {
    return NextResponse.json({ error: "action required" }, { status: 400 });
  }

  try {
    const invoice = await reviewInvoice({
      session,
      invoiceId: id,
      action: body.action,
      edits: body.edits,
    });
    return NextResponse.json({ invoice });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Review failed" },
      { status: 500 },
    );
  }
}
