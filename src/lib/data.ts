import {
  getDemoStore,
  rebuildMonthlyCostsForSubscription,
  withTool,
} from "@/lib/demo/store";
import { calculateMonthlyCost } from "@/lib/invoices/calculate";
import { extractInvoiceData } from "@/lib/invoices/extract";
import { validateInvoiceExtraction } from "@/lib/invoices/validate";
import { guessMime } from "@/lib/mime";
import { isDemoMode } from "@/lib/mode";
import { createClient } from "@/lib/supabase/server";
import type {
  AuditLog,
  Employee,
  Invoice,
  MonthlyCost,
  SessionUser,
  Subscription,
  Tool,
} from "@/lib/types";

function now() {
  return new Date().toISOString();
}

export async function listTools(): Promise<Tool[]> {
  if (isDemoMode()) return getDemoStore().tools;
  const supabase = await createClient();
  const { data } = await supabase.from("tools").select("*").order("name");
  return (data ?? []) as Tool[];
}

export async function createTool(input: {
  name: string;
  vendor: string;
}): Promise<Tool> {
  const name = input.name.trim();
  const vendor = input.vendor.trim() || name;
  if (!name) throw new Error("Tool name is required");

  if (isDemoMode()) {
    const store = getDemoStore();
    const existing = store.tools.find(
      (t) => t.name.toLowerCase() === name.toLowerCase(),
    );
    if (existing) return existing;
    const tool: Tool = {
      id: crypto.randomUUID(),
      name,
      vendor,
      created_at: now(),
    };
    store.tools.push(tool);
    return tool;
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("tools")
    .select("*")
    .ilike("name", name)
    .limit(1)
    .maybeSingle();
  if (existing) return existing as Tool;

  const { data, error } = await supabase
    .from("tools")
    .insert({ name, vendor })
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Failed to create tool");
  return data as Tool;
}

export async function getMySubscriptions(
  session: SessionUser,
): Promise<Subscription[]> {
  if (isDemoMode()) {
    const store = getDemoStore();
    return store.subscriptions
      .filter((s) => s.employee_id === session.employee.id)
      .map((s) => withTool(s, store.tools));
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("subscriptions")
    .select("*, tool:tools(*)")
    .eq("employee_id", session.employee.id)
    .order("created_at");
  return (data ?? []) as Subscription[];
}

export async function getMyInvoices(session: SessionUser): Promise<Invoice[]> {
  if (isDemoMode()) {
    const store = getDemoStore();
    return store.invoices
      .filter((i) => i.employee_id === session.employee.id)
      .map((i) => withTool(i, store.tools))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select("*, tool:tools(*)")
    .eq("employee_id", session.employee.id)
    .order("created_at", { ascending: false });
  return (data ?? []) as Invoice[];
}

export async function getMyMonthlyCosts(
  session: SessionUser,
  month?: string,
): Promise<MonthlyCost[]> {
  if (isDemoMode()) {
    const store = getDemoStore();
    return store.monthlyCosts.filter(
      (m) =>
        m.employee_id === session.employee.id &&
        (!month || m.month === month),
    );
  }
  const supabase = await createClient();
  let q = supabase
    .from("monthly_costs")
    .select("*")
    .eq("employee_id", session.employee.id);
  if (month) q = q.eq("month", month);
  const { data } = await q.order("month", { ascending: false });
  return (data ?? []) as MonthlyCost[];
}

export async function getAdminKpis() {
  if (isDemoMode()) {
    const store = getDemoStore();
    const activeEmployees = store.employees.filter(
      (e) => e.active && e.role === "employee",
    ).length;
    const activeTools = new Set(
      store.subscriptions.filter((s) => s.status === "active").map((s) => s.tool_id),
    ).size;
    const monthlyCost = store.subscriptions
      .filter((s) => s.status === "active")
      .reduce((sum, s) => sum + (s.monthly_cost ?? 0), 0);
    const pendingReviews = store.invoices.filter(
      (i) => i.status === "pending_review",
    ).length;
    return { activeEmployees, activeTools, monthlyCost, pendingReviews };
  }

  const supabase = await createClient();
  const [{ count: employees }, { data: subs }, { count: pending }] =
    await Promise.all([
      supabase
        .from("employees")
        .select("*", { count: "exact", head: true })
        .eq("active", true)
        .eq("role", "employee"),
      supabase
        .from("subscriptions")
        .select("tool_id, monthly_cost, status")
        .eq("status", "active"),
      supabase
        .from("invoices")
        .select("*", { count: "exact", head: true })
        .eq("status", "pending_review"),
    ]);

  const activeTools = new Set((subs ?? []).map((s) => s.tool_id)).size;
  const monthlyCost = (subs ?? []).reduce(
    (sum, s) => sum + Number(s.monthly_cost ?? 0),
    0,
  );
  return {
    activeEmployees: employees ?? 0,
    activeTools,
    monthlyCost,
    pendingReviews: pending ?? 0,
  };
}

export async function getEmployeeOverview() {
  if (isDemoMode()) {
    const store = getDemoStore();
    return store.employees
      .filter((e) => e.role === "employee")
      .map((e) => {
        const subs = store.subscriptions.filter(
          (s) => s.employee_id === e.id && s.status === "active",
        );
        const pending = store.invoices.filter(
          (i) => i.employee_id === e.id && i.status === "pending_review",
        ).length;
        return {
          employee: e,
          activeTools: subs.length,
          monthlyCost: subs.reduce((sum, s) => sum + (s.monthly_cost ?? 0), 0),
          pending,
        };
      });
  }

  const supabase = await createClient();
  const { data: employees } = await supabase
    .from("employees")
    .select("*")
    .eq("role", "employee")
    .order("name");
  const { data: subs } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("status", "active");
  const { data: invoices } = await supabase
    .from("invoices")
    .select("employee_id, status")
    .eq("status", "pending_review");

  return ((employees ?? []) as Employee[]).map((e) => {
    const eSubs = ((subs ?? []) as Subscription[]).filter(
      (s) => s.employee_id === e.id,
    );
    const pending = (invoices ?? []).filter((i) => i.employee_id === e.id)
      .length;
    return {
      employee: e,
      activeTools: eSubs.length,
      monthlyCost: eSubs.reduce((sum, s) => sum + Number(s.monthly_cost ?? 0), 0),
      pending,
    };
  });
}

export async function listPendingInvoices(): Promise<Invoice[]> {
  if (isDemoMode()) {
    const store = getDemoStore();
    return store.invoices
      .filter((i) => i.status === "pending_review")
      .map((i) => ({
        ...withTool(i, store.tools),
        employee: store.employees.find((e) => e.id === i.employee_id),
      }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select("*, tool:tools(*), employee:employees(*)")
    .eq("status", "pending_review")
    .order("created_at", { ascending: false });
  return (data ?? []) as Invoice[];
}

export async function getInvoiceById(id: string): Promise<Invoice | null> {
  if (isDemoMode()) {
    const store = getDemoStore();
    const inv = store.invoices.find((i) => i.id === id);
    if (!inv) return null;
    return {
      ...withTool(inv, store.tools),
      employee: store.employees.find((e) => e.id === inv.employee_id),
    };
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("invoices")
    .select("*, tool:tools(*), employee:employees(*)")
    .eq("id", id)
    .maybeSingle();
  return (data as Invoice) ?? null;
}

export async function getEmployeeDetail(employeeId: string) {
  if (isDemoMode()) {
    const store = getDemoStore();
    const employee = store.employees.find((e) => e.id === employeeId);
    if (!employee) return null;
    return {
      employee,
      subscriptions: store.subscriptions
        .filter((s) => s.employee_id === employeeId)
        .map((s) => withTool(s, store.tools)),
      invoices: store.invoices
        .filter((i) => i.employee_id === employeeId)
        .map((i) => withTool(i, store.tools)),
    };
  }
  const supabase = await createClient();
  const { data: employee } = await supabase
    .from("employees")
    .select("*")
    .eq("id", employeeId)
    .maybeSingle();
  if (!employee) return null;
  const [{ data: subscriptions }, { data: invoices }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("*, tool:tools(*)")
      .eq("employee_id", employeeId),
    supabase
      .from("invoices")
      .select("*, tool:tools(*)")
      .eq("employee_id", employeeId)
      .order("created_at", { ascending: false }),
  ]);
  return {
    employee: employee as Employee,
    subscriptions: (subscriptions ?? []) as Subscription[],
    invoices: (invoices ?? []) as Invoice[],
  };
}

export async function getReimbursementReport(input: {
  /** Inclusive lookback: 1 = current month only, 2 = this + previous, etc. */
  months?: number;
  /** End month (YYYY-MM-01). Defaults to current UTC month. */
  endMonth?: string;
}) {
  const { recentMonthKeys } = await import("@/lib/invoices/calculate");
  const span = Math.max(1, Math.min(3, Math.floor(input.months ?? 1)));
  const months = recentMonthKeys(span, input.endMonth ?? new Date());
  const monthSet = new Set(months);

  if (isDemoMode()) {
    const store = getDemoStore();
    const byEmployee = new Map<string, number>();
    for (const cost of store.monthlyCosts.filter((m) => monthSet.has(m.month))) {
      byEmployee.set(
        cost.employee_id,
        (byEmployee.get(cost.employee_id) ?? 0) + cost.amount,
      );
    }
    const rows = store.employees
      .filter((e) => e.role === "employee")
      .map((e) => ({
        employee: e,
        amount: byEmployee.get(e.id) ?? 0,
      }));
    const total = rows.reduce((sum, r) => sum + r.amount, 0);
    return { months, span, rows, total };
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("monthly_costs")
    .select("*, employee:employees(*)")
    .in("month", months);
  const map = new Map<string, { employee: Employee; amount: number }>();
  for (const row of data ?? []) {
    const emp = row.employee as Employee;
    if (!emp?.id) continue;
    const prev = map.get(emp.id);
    map.set(emp.id, {
      employee: emp,
      amount: (prev?.amount ?? 0) + Number(row.amount),
    });
  }
  const rows = [...map.values()].sort((a, b) =>
    a.employee.name.localeCompare(b.employee.name),
  );
  return {
    months,
    span,
    rows,
    total: rows.reduce((sum, r) => sum + r.amount, 0),
  };
}

export async function listAuditLogs(limit = 20): Promise<AuditLog[]> {
  if (isDemoMode()) {
    return [...getDemoStore().auditLogs]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, limit);
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("audit_logs")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as AuditLog[];
}

export async function processInvoiceUpload(input: {
  session: SessionUser;
  toolId: string;
  fileName: string;
  fileBytes?: ArrayBuffer;
}): Promise<Invoice> {
  const employeeId = input.session.employee.id;
  const tools = await listTools();
  const tool = tools.find((t) => t.id === input.toolId);
  if (!tool) throw new Error("Unknown tool");

  if (isDemoMode()) {
    const store = getDemoStore();
    const extraction = await extractInvoiceData({
      fileName: input.fileName,
      tool,
      employeeName: input.session.employee.name,
      fileBytes: input.fileBytes,
      mimeType: guessMime(input.fileName),
    });

    const existingSub =
      store.subscriptions.find(
        (s) => s.employee_id === employeeId && s.tool_id === tool.id,
      ) ?? null;

    const flags = [
      ...validateInvoiceExtraction({
        employee: input.session.employee,
        extraction: extraction.payload,
        existingInvoices: store.invoices.filter(
          (i) => i.employee_id === employeeId,
        ),
        existingSubscription: existingSub,
      }),
      ...extraction.flags,
    ];

    const amount = extraction.payload.amount ?? 0;
    const monthly = calculateMonthlyCost({
      amount,
      billingCycle: extraction.payload.billing_cycle,
      periodStart: extraction.payload.billing_period_start,
      periodEnd: extraction.payload.billing_period_end,
    });

    const id = `inv-${crypto.randomUUID()}`;
    const invoice: Invoice = {
      id,
      employee_id: employeeId,
      subscription_id: existingSub?.id ?? null,
      tool_id: tool.id,
      storage_path: `demo/${employeeId}/${input.fileName}`,
      file_name: input.fileName,
      invoice_number: extraction.payload.invoice_number,
      invoice_date: extraction.payload.invoice_date,
      period_start: extraction.payload.billing_period_start,
      period_end: extraction.payload.billing_period_end,
      billing_cycle: extraction.payload.billing_cycle,
      plan: extraction.payload.plan,
      amount,
      currency: extraction.payload.currency ?? "EUR",
      tax_amount: extraction.payload.tax_amount,
      monthly_cost: monthly,
      status: "pending_review",
      ai_confidence: extraction.confidence,
      validation_flags: flags,
      employee_name_on_invoice: extraction.payload.employee_name,
      created_at: now(),
      updated_at: now(),
    };

    store.invoices.unshift(invoice);
    store.extractions.push({
      id: `ex-${id}`,
      invoice_id: id,
      raw_json: extraction.payload,
      confidence: extraction.confidence,
      model: extraction.model,
      created_at: now(),
    });

    if (!existingSub) {
      const subId = `s-${crypto.randomUUID()}`;
      store.subscriptions.push({
        id: subId,
        employee_id: employeeId,
        tool_id: tool.id,
        plan: extraction.payload.plan,
        billing_cycle: extraction.payload.billing_cycle ?? "monthly",
        start_date: extraction.payload.billing_period_start,
        end_date: extraction.payload.billing_period_end,
        status: "pending",
        current_amount: amount,
        currency: extraction.payload.currency ?? "EUR",
        monthly_cost: monthly,
        created_at: now(),
        updated_at: now(),
      });
      invoice.subscription_id = subId;
    }

    return withTool(invoice, store.tools);
  }

  // Supabase path: storage upload + DB rows via authenticated client
  const supabase = await createClient();
  const path = `${employeeId}/${Date.now()}-${input.fileName}`;
  if (input.fileBytes) {
    const { error: uploadError } = await supabase.storage
      .from("invoices")
      .upload(path, input.fileBytes, {
        contentType: guessMime(input.fileName),
        upsert: false,
      });
    if (uploadError) throw uploadError;
  }

  const extraction = await extractInvoiceData({
    fileName: input.fileName,
    tool,
    employeeName: input.session.employee.name,
    fileBytes: input.fileBytes,
    mimeType: guessMime(input.fileName),
  });

  const { data: existingInvoices } = await supabase
    .from("invoices")
    .select("*")
    .eq("employee_id", employeeId);
  const { data: existingSub } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("employee_id", employeeId)
    .eq("tool_id", tool.id)
    .maybeSingle();

  const flags = [
    ...validateInvoiceExtraction({
      employee: input.session.employee,
      extraction: extraction.payload,
      existingInvoices: (existingInvoices ?? []) as Invoice[],
      existingSubscription: (existingSub as Subscription) ?? null,
    }),
    ...extraction.flags,
  ];

  const amount = extraction.payload.amount ?? 0;
  const monthly = calculateMonthlyCost({
    amount,
    billingCycle: extraction.payload.billing_cycle,
    periodStart: extraction.payload.billing_period_start,
    periodEnd: extraction.payload.billing_period_end,
  });

  const { data: invoice, error } = await supabase
    .from("invoices")
    .insert({
      employee_id: employeeId,
      subscription_id: existingSub?.id ?? null,
      tool_id: tool.id,
      storage_path: path,
      file_name: input.fileName,
      invoice_number: extraction.payload.invoice_number,
      invoice_date: extraction.payload.invoice_date,
      period_start: extraction.payload.billing_period_start,
      period_end: extraction.payload.billing_period_end,
      billing_cycle: extraction.payload.billing_cycle,
      plan: extraction.payload.plan,
      amount,
      currency: extraction.payload.currency ?? "EUR",
      tax_amount: extraction.payload.tax_amount,
      monthly_cost: monthly,
      status: "pending_review",
      ai_confidence: extraction.confidence,
      validation_flags: flags,
      employee_name_on_invoice: extraction.payload.employee_name,
    })
    .select("*, tool:tools(*)")
    .single();

  if (error || !invoice) throw error ?? new Error("Failed to create invoice");

  await supabase.from("invoice_extractions").insert({
    invoice_id: invoice.id,
    raw_json: extraction.payload,
    confidence: extraction.confidence,
    model: extraction.model,
  });

  return invoice as Invoice;
}

export async function reviewInvoice(input: {
  session: SessionUser;
  invoiceId: string;
  action: "approve" | "reject" | "edit";
  edits?: Partial<
    Pick<
      Invoice,
      | "invoice_number"
      | "invoice_date"
      | "period_start"
      | "period_end"
      | "billing_cycle"
      | "plan"
      | "amount"
      | "currency"
      | "tax_amount"
    >
  >;
}): Promise<Invoice> {
  if (input.session.employee.role !== "admin") {
    throw new Error("Admin only");
  }

  if (isDemoMode()) {
    const store = getDemoStore();
    const invoice = store.invoices.find((i) => i.id === input.invoiceId);
    if (!invoice) throw new Error("Invoice not found");
    const before = { ...invoice };

    if (input.action === "edit" || input.action === "approve") {
      if (input.edits) Object.assign(invoice, input.edits);
      if (invoice.amount != null) {
        invoice.monthly_cost = calculateMonthlyCost({
          amount: invoice.amount,
          billingCycle: invoice.billing_cycle,
          periodStart: invoice.period_start,
          periodEnd: invoice.period_end,
        });
      }
    }

    if (input.action === "approve") {
      invoice.status = "approved";
      let subId = invoice.subscription_id;
      if (!subId && invoice.tool_id) {
        const existing = store.subscriptions.find(
          (s) =>
            s.employee_id === invoice.employee_id &&
            s.tool_id === invoice.tool_id,
        );
        if (existing) {
          subId = existing.id;
        } else {
          subId = `s-${crypto.randomUUID()}`;
          store.subscriptions.push({
            id: subId,
            employee_id: invoice.employee_id,
            tool_id: invoice.tool_id,
            plan: invoice.plan,
            billing_cycle: invoice.billing_cycle ?? "monthly",
            start_date: invoice.period_start,
            end_date: invoice.period_end,
            status: "active",
            current_amount: invoice.amount,
            currency: invoice.currency ?? "EUR",
            monthly_cost: invoice.monthly_cost,
            created_at: now(),
            updated_at: now(),
          });
        }
        invoice.subscription_id = subId;
      }
      if (subId) rebuildMonthlyCostsForSubscription(store, subId, invoice);
    } else if (input.action === "reject") {
      invoice.status = "rejected";
    } else {
      invoice.status = "pending_review";
    }

    invoice.updated_at = now();
    store.auditLogs.unshift({
      id: `audit-${crypto.randomUUID()}`,
      user_id: input.session.employee.user_id,
      employee_id: input.session.employee.id,
      action: `invoice_${input.action}`,
      entity_type: "invoice",
      entity_id: invoice.id,
      metadata: { before, after: { ...invoice }, edits: input.edits ?? null },
      created_at: now(),
    });

    return {
      ...withTool(invoice, store.tools),
      employee: store.employees.find((e) => e.id === invoice.employee_id),
    };
  }

  const supabase = await createClient();
  const { data: existing } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", input.invoiceId)
    .single();
  if (!existing) throw new Error("Invoice not found");

  const patch: Record<string, unknown> = {
    updated_at: now(),
    ...(input.edits ?? {}),
  };

  const amount = Number(input.edits?.amount ?? existing.amount ?? 0);
  const billingCycle = (input.edits?.billing_cycle ??
    existing.billing_cycle) as Invoice["billing_cycle"];
  const periodStart =
    input.edits?.period_start ?? (existing.period_start as string | null);
  const periodEnd =
    input.edits?.period_end ?? (existing.period_end as string | null);

  if (input.action === "edit" || input.action === "approve") {
    patch.monthly_cost = calculateMonthlyCost({
      amount,
      billingCycle,
      periodStart,
      periodEnd,
    });
  }

  if (input.action === "approve") patch.status = "approved";
  if (input.action === "reject") patch.status = "rejected";

  const { data: invoice, error } = await supabase
    .from("invoices")
    .update(patch)
    .eq("id", input.invoiceId)
    .select("*, tool:tools(*), employee:employees(*)")
    .single();
  if (error || !invoice) throw error ?? new Error("Update failed");

  await supabase.from("audit_logs").insert({
    user_id: input.session.employee.user_id,
    employee_id: input.session.employee.id,
    action: `invoice_${input.action}`,
    entity_type: "invoice",
    entity_id: input.invoiceId,
    metadata: { before: existing, after: invoice, edits: input.edits ?? null },
  });

  if (input.action === "approve") {
    // Upsert subscription + monthly costs via SQL-friendly app logic
    const inv = invoice as Invoice;
    let subscriptionId = inv.subscription_id;
    if (!subscriptionId && inv.tool_id) {
      const { data: sub } = await supabase
        .from("subscriptions")
        .upsert(
          {
            employee_id: inv.employee_id,
            tool_id: inv.tool_id,
            plan: inv.plan,
            billing_cycle: inv.billing_cycle ?? "monthly",
            start_date: inv.period_start,
            end_date: inv.period_end,
            status: "active",
            current_amount: inv.amount,
            currency: inv.currency ?? "EUR",
            monthly_cost: inv.monthly_cost,
            updated_at: now(),
          },
          { onConflict: "employee_id,tool_id" },
        )
        .select("*")
        .single();
      subscriptionId = sub?.id ?? null;
      if (subscriptionId) {
        await supabase
          .from("invoices")
          .update({ subscription_id: subscriptionId })
          .eq("id", inv.id);
      }
    } else if (subscriptionId) {
      await supabase
        .from("subscriptions")
        .update({
          plan: inv.plan,
          billing_cycle: inv.billing_cycle ?? "monthly",
          start_date: inv.period_start,
          end_date: inv.period_end,
          status: "active",
          current_amount: inv.amount,
          currency: inv.currency ?? "EUR",
          monthly_cost: inv.monthly_cost,
          updated_at: now(),
        })
        .eq("id", subscriptionId);
    }

    if (subscriptionId && inv.monthly_cost != null) {
      const { expandMonthsCovered } = await import("@/lib/invoices/calculate");
      const months = expandMonthsCovered(
        inv.period_start,
        inv.period_end,
        inv.invoice_date,
      );
      for (const month of months) {
        await supabase.from("monthly_costs").upsert(
          {
            employee_id: inv.employee_id,
            subscription_id: subscriptionId,
            invoice_id: inv.id,
            month,
            amount: inv.monthly_cost,
            currency: inv.currency ?? "EUR",
            status: "approved",
          },
          { onConflict: "employee_id,subscription_id,month" },
        );
      }
    }
  }

  return invoice as Invoice;
}

