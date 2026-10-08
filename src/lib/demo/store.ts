import { calculateMonthlyCost, expandMonthsCovered, monthKey } from "@/lib/invoices/calculate";
import type {
  AuditLog,
  Employee,
  Invoice,
  InvoiceExtraction,
  MonthlyCost,
  Subscription,
  Tool,
} from "@/lib/types";

const g = globalThis as unknown as {
  __spendflowDemo?: DemoStore;
};

export type DemoStore = {
  employees: Employee[];
  tools: Tool[];
  subscriptions: Subscription[];
  invoices: Invoice[];
  extractions: InvoiceExtraction[];
  monthlyCosts: MonthlyCost[];
  auditLogs: AuditLog[];
  /** employee_id → completed tour_version */
  onboarding: Record<string, number>;
};

function now() {
  return new Date().toISOString();
}

function seed(): DemoStore {
  const created = now();
  const employees: Employee[] = [
    {
      id: "e-admin",
      user_id: "demo-admin",
      name: "Ana Finance",
      email: "admin@spendflow.demo",
      department: "Finance",
      role: "admin",
      active: true,
      created_at: created,
    },
    {
      id: "e-ivan",
      user_id: "demo-ivan",
      name: "Ivan Petrov",
      email: "ivan@spendflow.demo",
      department: "Product Design",
      role: "employee",
      active: true,
      created_at: created,
    },
    {
      id: "e-maria",
      user_id: "demo-maria",
      name: "Maria Ivanova",
      email: "maria@spendflow.demo",
      department: "Engineering",
      role: "employee",
      active: true,
      created_at: created,
    },
    {
      id: "e-georgi",
      user_id: "demo-georgi",
      name: "Georgi Georgiev",
      email: "georgi@spendflow.demo",
      department: "Marketing",
      role: "employee",
      active: true,
      created_at: created,
    },
  ];

  const tools: Tool[] = [
    {
      id: "11111111-1111-1111-1111-111111111111",
      name: "Figma",
      vendor: "Figma",
      created_at: created,
    },
    {
      id: "22222222-2222-2222-2222-222222222222",
      name: "Adobe Creative Cloud",
      vendor: "Adobe",
      created_at: created,
    },
    {
      id: "33333333-3333-3333-3333-333333333333",
      name: "Notion",
      vendor: "Notion",
      created_at: created,
    },
    {
      id: "44444444-4444-4444-4444-444444444444",
      name: "GitHub",
      vendor: "GitHub",
      created_at: created,
    },
    {
      id: "55555555-5555-5555-5555-555555555555",
      name: "Slack",
      vendor: "Salesforce",
      created_at: created,
    },
  ];

  const month = monthKey(new Date());
  const subscriptions: Subscription[] = [
    {
      id: "s-ivan-figma",
      employee_id: "e-ivan",
      tool_id: tools[0].id,
      plan: "Professional",
      billing_cycle: "monthly",
      start_date: "2026-01-01",
      end_date: null,
      status: "active",
      current_amount: 15,
      currency: "EUR",
      monthly_cost: 15,
      created_at: created,
      updated_at: created,
    },
    {
      id: "s-ivan-adobe",
      employee_id: "e-ivan",
      tool_id: tools[1].id,
      plan: "Pro",
      billing_cycle: "quarterly",
      start_date: "2026-07-01",
      end_date: "2026-09-30",
      status: "active",
      current_amount: 90,
      currency: "EUR",
      monthly_cost: 30,
      created_at: created,
      updated_at: created,
    },
    {
      id: "s-ivan-notion",
      employee_id: "e-ivan",
      tool_id: tools[2].id,
      plan: "Plus",
      billing_cycle: "yearly",
      start_date: "2026-01-01",
      end_date: "2026-12-31",
      status: "active",
      current_amount: 120,
      currency: "EUR",
      monthly_cost: 10,
      created_at: created,
      updated_at: created,
    },
    {
      id: "s-maria-github",
      employee_id: "e-maria",
      tool_id: tools[3].id,
      plan: "Team",
      billing_cycle: "monthly",
      start_date: "2026-03-01",
      end_date: null,
      status: "active",
      current_amount: 24,
      currency: "EUR",
      monthly_cost: 24,
      created_at: created,
      updated_at: created,
    },
    {
      id: "s-maria-slack",
      employee_id: "e-maria",
      tool_id: tools[4].id,
      plan: "Pro",
      billing_cycle: "monthly",
      start_date: "2026-02-01",
      end_date: null,
      status: "active",
      current_amount: 12.5,
      currency: "EUR",
      monthly_cost: 12.5,
      created_at: created,
      updated_at: created,
    },
    {
      id: "s-georgi-figma",
      employee_id: "e-georgi",
      tool_id: tools[0].id,
      plan: "Professional",
      billing_cycle: "monthly",
      start_date: "2026-04-01",
      end_date: null,
      status: "active",
      current_amount: 15,
      currency: "EUR",
      monthly_cost: 15,
      created_at: created,
      updated_at: created,
    },
  ];

  const invoices: Invoice[] = [
    {
      id: "inv-pending-adobe",
      employee_id: "e-ivan",
      subscription_id: "s-ivan-adobe",
      tool_id: tools[1].id,
      storage_path: "demo/e-ivan/adobe-q3.pdf",
      file_name: "adobe-q3.pdf",
      invoice_number: "INV-AD-SEED01",
      invoice_date: "2026-10-01",
      period_start: "2026-10-01",
      period_end: "2026-12-31",
      billing_cycle: "quarterly",
      plan: "Pro",
      amount: 90,
      currency: "EUR",
      tax_amount: 18,
      monthly_cost: 30,
      status: "pending_review",
      ai_confidence: 0.97,
      validation_flags: [],
      employee_name_on_invoice: "Ivan Petrov",
      created_at: created,
      updated_at: created,
    },
    {
      id: "inv-pending-maria",
      employee_id: "e-maria",
      subscription_id: "s-maria-github",
      tool_id: tools[3].id,
      storage_path: "demo/e-maria/github-oct.pdf",
      file_name: "github-oct.pdf",
      invoice_number: "INV-GH-SEED02",
      invoice_date: "2026-10-03",
      period_start: "2026-10-01",
      period_end: "2026-10-31",
      billing_cycle: "monthly",
      plan: "Team",
      amount: 28,
      currency: "EUR",
      tax_amount: 5.6,
      monthly_cost: 28,
      status: "pending_review",
      ai_confidence: 0.91,
      validation_flags: ["price_change_detected"],
      employee_name_on_invoice: "Maria Ivanova",
      created_at: created,
      updated_at: created,
    },
  ];

  const extractions: InvoiceExtraction[] = invoices.map((inv) => ({
    id: `ex-${inv.id}`,
    invoice_id: inv.id,
    raw_json: {
      vendor: tools.find((t) => t.id === inv.tool_id)?.vendor ?? null,
      tool_name: tools.find((t) => t.id === inv.tool_id)?.name ?? null,
      invoice_number: inv.invoice_number,
      invoice_date: inv.invoice_date,
      billing_period_start: inv.period_start,
      billing_period_end: inv.period_end,
      billing_cycle: inv.billing_cycle,
      plan: inv.plan,
      amount: inv.amount,
      currency: inv.currency,
      tax_amount: inv.tax_amount,
      employee_name: inv.employee_name_on_invoice,
    },
    confidence: inv.ai_confidence,
    model: "mock-extractor-v1",
    created_at: created,
  }));

  const monthlyCosts: MonthlyCost[] = [];
  for (const sub of subscriptions) {
    monthlyCosts.push({
      id: `mc-${sub.id}-${month}`,
      employee_id: sub.employee_id,
      subscription_id: sub.id,
      invoice_id: null,
      month,
      amount: sub.monthly_cost ?? 0,
      currency: sub.currency,
      status: "approved",
      created_at: created,
    });
  }

  return {
    employees,
    tools,
    subscriptions,
    invoices,
    extractions,
    monthlyCosts,
    auditLogs: [],
    onboarding: {},
  };
}

export function getDemoStore(): DemoStore {
  if (!g.__spendflowDemo) {
    g.__spendflowDemo = seed();
  }
  // Hot reload / older in-memory seeds may lack this field.
  if (!g.__spendflowDemo.onboarding) {
    g.__spendflowDemo.onboarding = {};
  }
  return g.__spendflowDemo;
}

export function resetDemoStore() {
  g.__spendflowDemo = seed();
}

export function withTool<T extends { tool_id: string | null }>(
  row: T,
  tools: Tool[],
): T & { tool?: Tool } {
  return {
    ...row,
    tool: tools.find((t) => t.id === row.tool_id) ?? undefined,
  };
}

export function rebuildMonthlyCostsForSubscription(
  store: DemoStore,
  subscriptionId: string,
  invoice: Invoice,
) {
  const sub = store.subscriptions.find((s) => s.id === subscriptionId);
  if (!sub || invoice.monthly_cost == null) return;

  const months = expandMonthsCovered(
    invoice.period_start,
    invoice.period_end,
    invoice.invoice_date,
  );

  store.monthlyCosts = store.monthlyCosts.filter(
    (m) =>
      !(
        m.subscription_id === subscriptionId &&
        months.includes(m.month) &&
        m.status !== "paid"
      ),
  );

  for (const month of months) {
    store.monthlyCosts.push({
      id: `mc-${subscriptionId}-${month}-${invoice.id}`,
      employee_id: invoice.employee_id,
      subscription_id: subscriptionId,
      invoice_id: invoice.id,
      month,
      amount: invoice.monthly_cost,
      currency: invoice.currency ?? "EUR",
      status: "approved",
      created_at: now(),
    });
  }

  sub.monthly_cost = invoice.monthly_cost;
  sub.current_amount = invoice.amount;
  sub.billing_cycle = invoice.billing_cycle ?? sub.billing_cycle;
  sub.plan = invoice.plan ?? sub.plan;
  sub.start_date = invoice.period_start;
  sub.end_date = invoice.period_end;
  sub.status = "active";
  sub.updated_at = now();
}

export function ensureSubscriptionMonthly(
  amount: number,
  billingCycle: Invoice["billing_cycle"],
  periodStart: string | null,
  periodEnd: string | null,
) {
  return calculateMonthlyCost({
    amount,
    billingCycle,
    periodStart,
    periodEnd,
  });
}
