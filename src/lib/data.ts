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

export async function updateTool(input: {
  session: SessionUser;
  toolId: string;
  patch: { name?: string; vendor?: string };
}): Promise<Tool> {
  if (input.session.employee.role !== "admin") {
    throw new Error("Forbidden");
  }
  const name = input.patch.name?.trim();
  const vendor = input.patch.vendor?.trim();
  if (name !== undefined && !name) throw new Error("Tool name is required");

  if (isDemoMode()) {
    const store = getDemoStore();
    const tool = store.tools.find((t) => t.id === input.toolId);
    if (!tool) throw new Error("Tool not found");
    if (name != null) tool.name = name;
    if (vendor != null) tool.vendor = vendor || tool.name;
    return tool;
  }

  const supabase = await createClient();
  const payload: Record<string, unknown> = {};
  if (name != null) payload.name = name;
  if (vendor != null) payload.vendor = vendor || name;

  const { data, error } = await supabase
    .from("tools")
    .update(payload)
    .eq("id", input.toolId)
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Update failed");

  await supabase.from("audit_logs").insert({
    user_id: input.session.employee.user_id,
    employee_id: input.session.employee.id,
    action: "tool_updated",
    entity_type: "tool",
    entity_id: input.toolId,
    metadata: input.patch,
  });

  return data as Tool;
}

export async function deleteTool(input: {
  session: SessionUser;
  toolId: string;
}): Promise<void> {
  if (input.session.employee.role !== "admin") {
    throw new Error("Forbidden");
  }

  if (isDemoMode()) {
    const store = getDemoStore();
    const usedBySub = store.subscriptions.some((s) => s.tool_id === input.toolId);
    const usedByInv = store.invoices.some((i) => i.tool_id === input.toolId);
    if (usedBySub || usedByInv) {
      throw new Error(
        "Cannot delete a tool that is referenced by subscriptions or invoices.",
      );
    }
    const idx = store.tools.findIndex((t) => t.id === input.toolId);
    if (idx < 0) throw new Error("Tool not found");
    store.tools.splice(idx, 1);
    return;
  }

  const supabase = await createClient();
  const [{ count: subCount }, { count: invCount }] = await Promise.all([
    supabase
      .from("subscriptions")
      .select("id", { count: "exact", head: true })
      .eq("tool_id", input.toolId),
    supabase
      .from("invoices")
      .select("id", { count: "exact", head: true })
      .eq("tool_id", input.toolId),
  ]);
  if ((subCount ?? 0) > 0 || (invCount ?? 0) > 0) {
    throw new Error(
      "Cannot delete a tool that is referenced by subscriptions or invoices.",
    );
  }

  const { error } = await supabase.from("tools").delete().eq("id", input.toolId);
  if (error) throw error;

  await supabase.from("audit_logs").insert({
    user_id: input.session.employee.user_id,
    employee_id: input.session.employee.id,
    action: "tool_deleted",
    entity_type: "tool",
    entity_id: input.toolId,
    metadata: {},
  });
}

export async function updateSubscriptionStatus(input: {
  session: SessionUser;
  subscriptionId: string;
  status: "active" | "paused" | "cancelled";
}): Promise<Subscription> {
  const allowed = ["active", "paused", "cancelled"] as const;
  if (!allowed.includes(input.status)) {
    throw new Error("Invalid status");
  }

  if (isDemoMode()) {
    const store = getDemoStore();
    const sub = store.subscriptions.find((s) => s.id === input.subscriptionId);
    if (!sub) throw new Error("Subscription not found");
    const isOwner = sub.employee_id === input.session.employee.id;
    const isAdmin = input.session.employee.role === "admin";
    if (!isOwner && !isAdmin) throw new Error("Forbidden");
    const previous = sub.status;
    sub.status = input.status;
    sub.updated_at = now();
    store.auditLogs.unshift({
      id: `a-${crypto.randomUUID()}`,
      user_id: input.session.employee.user_id,
      employee_id: input.session.employee.id,
      action: "subscription_status_changed",
      entity_type: "subscription",
      entity_id: sub.id,
      metadata: { from: previous, to: input.status },
      created_at: now(),
    });
    return withTool(sub, store.tools);
  }

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("subscriptions")
    .select("*, tool:tools(*)")
    .eq("id", input.subscriptionId)
    .maybeSingle();
  if (fetchError || !existing) {
    throw fetchError ?? new Error("Subscription not found");
  }

  const isOwner = existing.employee_id === input.session.employee.id;
  const isAdmin = input.session.employee.role === "admin";
  if (!isOwner && !isAdmin) throw new Error("Forbidden");

  const previous = existing.status as string;
  const { data, error } = await supabase
    .from("subscriptions")
    .update({ status: input.status, updated_at: now() })
    .eq("id", input.subscriptionId)
    .select("*, tool:tools(*)")
    .single();
  if (error || !data) throw error ?? new Error("Update failed");

  await supabase.from("audit_logs").insert({
    user_id: input.session.employee.user_id,
    employee_id: input.session.employee.id,
    action: "subscription_status_changed",
    entity_type: "subscription",
    entity_id: input.subscriptionId,
    metadata: { from: previous, to: input.status },
  });

  return data as Subscription;
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

export type InvoiceStatusItem = {
  id: string;
  status: Invoice["status"];
  label: string;
};

/** Lightweight snapshot for employee live-status polling. */
export async function getMyInvoiceStatuses(
  session: SessionUser,
): Promise<InvoiceStatusItem[]> {
  if (isDemoMode()) {
    const store = getDemoStore();
    return store.invoices
      .filter((i) => i.employee_id === session.employee.id)
      .map((i) => {
        const tool = store.tools.find((t) => t.id === i.tool_id);
        return {
          id: i.id,
          status: i.status,
          label: i.invoice_number ?? tool?.name ?? i.file_name ?? i.id,
        };
      })
      .sort((a, b) => a.id.localeCompare(b.id));
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("invoices")
    .select("id, status, invoice_number, file_name, tool:tools(name)")
    .eq("employee_id", session.employee.id)
    .order("id");
  if (error) throw error;
  return (data ?? []).map((row) => {
    const tool = row.tool as { name?: string } | null;
    return {
      id: row.id as string,
      status: row.status as Invoice["status"],
      label:
        (row.invoice_number as string | null) ??
        tool?.name ??
        (row.file_name as string | null) ??
        (row.id as string),
    };
  });
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

export async function getPendingReviewCount(): Promise<number> {
  if (isDemoMode()) {
    return getDemoStore().invoices.filter((i) => i.status === "pending_review")
      .length;
  }
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("invoices")
    .select("*", { count: "exact", head: true })
    .eq("status", "pending_review");
  if (error) throw error;
  return count ?? 0;
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
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
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
  const [{ data: employees }, { data: subs }, { data: invoices }] =
    await Promise.all([
      supabase.from("employees").select("*").order("name"),
      supabase.from("subscriptions").select("*").eq("status", "active"),
      supabase
        .from("invoices")
        .select("employee_id, status")
        .eq("status", "pending_review"),
    ]);

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

export async function updateEmployee(input: {
  session: SessionUser;
  employeeId: string;
  patch: {
    name?: string;
    department?: string | null;
    role?: "employee" | "admin";
    active?: boolean;
  };
}): Promise<Employee> {
  if (input.session.employee.role !== "admin") {
    throw new Error("Forbidden");
  }

  if (input.patch.role === "admin" && input.session.employee.role !== "admin") {
    throw new Error("Only admins can grant admin role");
  }

  // Prevent demoting/deactivating the last active admin accidentally is nice-to-have; skip for MVP.

  if (isDemoMode()) {
    const store = getDemoStore();
    const emp = store.employees.find((e) => e.id === input.employeeId);
    if (!emp) throw new Error("Employee not found");
    if (input.patch.name != null) emp.name = input.patch.name.trim();
    if (input.patch.department !== undefined) {
      emp.department = input.patch.department;
    }
    if (input.patch.role != null) emp.role = input.patch.role;
    if (input.patch.active != null) emp.active = input.patch.active;
    return emp;
  }

  const supabase = await createClient();
  const payload: Record<string, unknown> = {};
  if (input.patch.name != null) payload.name = input.patch.name.trim();
  if (input.patch.department !== undefined) {
    payload.department = input.patch.department;
  }
  if (input.patch.role != null) payload.role = input.patch.role;
  if (input.patch.active != null) payload.active = input.patch.active;

  const { data, error } = await supabase
    .from("employees")
    .update(payload)
    .eq("id", input.employeeId)
    .select("*")
    .single();
  if (error || !data) throw error ?? new Error("Update failed");

  await supabase.from("audit_logs").insert({
    user_id: input.session.employee.user_id,
    employee_id: input.session.employee.id,
    action: "employee_updated",
    entity_type: "employee",
    entity_id: input.employeeId,
    metadata: input.patch,
  });

  return data as Employee;
}

export type AdminInvoiceStatusFilter =
  | "all"
  | "pending_review"
  | "approved"
  | "rejected";

export async function listPendingInvoices(): Promise<Invoice[]> {
  return listInvoices({ status: "pending_review" });
}

export async function listInvoices(input?: {
  status?: AdminInvoiceStatusFilter;
}): Promise<Invoice[]> {
  const status = input?.status ?? "pending_review";

  if (isDemoMode()) {
    const store = getDemoStore();
    return store.invoices
      .filter((i) => status === "all" || i.status === status)
      .map((i) => ({
        ...withTool(i, store.tools),
        employee: store.employees.find((e) => e.id === i.employee_id),
      }))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  const supabase = await createClient();
  let query = supabase
    .from("invoices")
    .select("*, tool:tools(*), employee:employees(*)")
    .order("created_at", { ascending: false });
  if (status !== "all") {
    query = query.eq("status", status);
  }
  const { data } = await query;
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

/** Employee-scoped invoice fetch — never returns another employee's invoice. */
export async function getMyInvoiceById(
  session: SessionUser,
  id: string,
): Promise<Invoice | null> {
  const invoice = await getInvoiceById(id);
  if (!invoice || invoice.employee_id !== session.employee.id) return null;
  return invoice;
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

export type ReportRow = {
  employee: Employee;
  amount: number;
  approvedAmount: number;
  paidAmount: number;
};

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

  type Acc = {
    employee: Employee;
    amount: number;
    approvedAmount: number;
    paidAmount: number;
  };

  if (isDemoMode()) {
    const store = getDemoStore();
    const map = new Map<string, Acc>();
    for (const cost of store.monthlyCosts.filter((m) => monthSet.has(m.month))) {
      const emp = store.employees.find((e) => e.id === cost.employee_id);
      if (!emp || emp.role !== "employee") continue;
      const prev = map.get(emp.id) ?? {
        employee: emp,
        amount: 0,
        approvedAmount: 0,
        paidAmount: 0,
      };
      const amt = Number(cost.amount);
      prev.amount += amt;
      if (cost.status === "paid") prev.paidAmount += amt;
      else prev.approvedAmount += amt;
      map.set(emp.id, prev);
    }
    const rows = [...map.values()].sort((a, b) =>
      a.employee.name.localeCompare(b.employee.name),
    );
    return {
      months,
      span,
      rows,
      total: rows.reduce((sum, r) => sum + r.amount, 0),
      unpaidTotal: rows.reduce((sum, r) => sum + r.approvedAmount, 0),
      paidTotal: rows.reduce((sum, r) => sum + r.paidAmount, 0),
    };
  }

  const supabase = await createClient();
  const { data } = await supabase
    .from("monthly_costs")
    .select("*, employee:employees(*)")
    .in("month", months);
  const map = new Map<string, Acc>();
  for (const row of data ?? []) {
    const emp = row.employee as Employee;
    if (!emp?.id) continue;
    const prev = map.get(emp.id) ?? {
      employee: emp,
      amount: 0,
      approvedAmount: 0,
      paidAmount: 0,
    };
    const amt = Number(row.amount);
    prev.amount += amt;
    if (row.status === "paid") prev.paidAmount += amt;
    else prev.approvedAmount += amt;
    map.set(emp.id, prev);
  }
  const rows = [...map.values()].sort((a, b) =>
    a.employee.name.localeCompare(b.employee.name),
  );
  return {
    months,
    span,
    rows,
    total: rows.reduce((sum, r) => sum + r.amount, 0),
    unpaidTotal: rows.reduce((sum, r) => sum + r.approvedAmount, 0),
    paidTotal: rows.reduce((sum, r) => sum + r.paidAmount, 0),
  };
}

export async function markMonthlyCostsPaid(input: {
  session: SessionUser;
  months: number;
  /** When set, only this employee's unpaid rows in the range are marked paid. */
  employeeId?: string;
}): Promise<{ updated: number }> {
  if (input.session.employee.role !== "admin") {
    throw new Error("Forbidden");
  }
  const { recentMonthKeys } = await import("@/lib/invoices/calculate");
  const span = Math.max(1, Math.min(3, Math.floor(input.months)));
  const months = recentMonthKeys(span);
  const employeeId = input.employeeId?.trim() || null;

  if (isDemoMode()) {
    const store = getDemoStore();
    let updated = 0;
    for (const cost of store.monthlyCosts) {
      if (
        months.includes(cost.month) &&
        cost.status !== "paid" &&
        (!employeeId || cost.employee_id === employeeId)
      ) {
        cost.status = "paid";
        updated += 1;
      }
    }
    store.auditLogs.unshift({
      id: `a-${crypto.randomUUID()}`,
      user_id: input.session.employee.user_id,
      employee_id: input.session.employee.id,
      action: "monthly_costs_marked_paid",
      entity_type: "monthly_costs",
      entity_id: employeeId,
      metadata: { months, updated, employeeId },
      created_at: now(),
    });
    return { updated };
  }

  const supabase = await createClient();
  let query = supabase
    .from("monthly_costs")
    .update({ status: "paid" })
    .in("month", months)
    .neq("status", "paid");
  if (employeeId) {
    query = query.eq("employee_id", employeeId);
  }
  const { data, error } = await query.select("id");
  if (error) throw error;

  await supabase.from("audit_logs").insert({
    user_id: input.session.employee.user_id,
    employee_id: input.session.employee.id,
    action: "monthly_costs_marked_paid",
    entity_type: "monthly_costs",
    entity_id: employeeId,
    metadata: { months, updated: data?.length ?? 0, employeeId },
  });

  return { updated: data?.length ?? 0 };
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

export class InvoiceDeleteError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.name = "InvoiceDeleteError";
    this.status = status;
  }
}

export async function deleteMyInvoice(input: {
  session: SessionUser;
  invoiceId: string;
}): Promise<void> {
  const { session, invoiceId } = input;

  if (isDemoMode()) {
    const store = getDemoStore();
    const idx = store.invoices.findIndex((i) => i.id === invoiceId);
    if (idx < 0 || store.invoices[idx].employee_id !== session.employee.id) {
      throw new InvoiceDeleteError("Invoice not found", 404);
    }
    const invoice = store.invoices[idx];
    if (invoice.status === "approved") {
      throw new InvoiceDeleteError("Approved invoices cannot be deleted", 409);
    }

    const subId = invoice.subscription_id;
    store.invoices.splice(idx, 1);
    store.extractions = store.extractions.filter(
      (e) => e.invoice_id !== invoiceId,
    );

    if (subId) {
      const sub = store.subscriptions.find((s) => s.id === subId);
      const stillReferenced = store.invoices.some(
        (i) => i.subscription_id === subId,
      );
      if (sub?.status === "pending" && !stillReferenced) {
        store.subscriptions = store.subscriptions.filter((s) => s.id !== subId);
      }
    }

    store.auditLogs.unshift({
      id: `audit-${crypto.randomUUID()}`,
      user_id: session.employee.user_id,
      employee_id: session.employee.id,
      action: "invoice_deleted",
      entity_type: "invoice",
      entity_id: invoiceId,
      metadata: {
        status: invoice.status,
        file_name: invoice.file_name,
        tool_id: invoice.tool_id,
      },
      created_at: now(),
    });
    return;
  }

  const supabase = await createClient();
  const { data: existing, error: fetchError } = await supabase
    .from("invoices")
    .select("*")
    .eq("id", invoiceId)
    .eq("employee_id", session.employee.id)
    .maybeSingle();

  if (fetchError) throw fetchError;
  if (!existing) {
    throw new InvoiceDeleteError("Invoice not found", 404);
  }
  if (existing.status === "approved") {
    throw new InvoiceDeleteError("Approved invoices cannot be deleted", 409);
  }

  const storagePath = existing.storage_path as string | null;

  const { error: deleteError } = await supabase
    .from("invoices")
    .delete()
    .eq("id", invoiceId)
    .eq("employee_id", session.employee.id);
  if (deleteError) throw deleteError;

  if (storagePath) {
    const { error: storageError } = await supabase.storage
      .from("invoices")
      .remove([storagePath]);
    if (storageError) {
      console.warn("Failed to remove invoice file from storage", storageError);
    }
  }

  await supabase.from("audit_logs").insert({
    user_id: session.employee.user_id,
    employee_id: session.employee.id,
    action: "invoice_deleted",
    entity_type: "invoice",
    entity_id: invoiceId,
    metadata: {
      status: existing.status,
      file_name: existing.file_name,
      tool_id: existing.tool_id,
      storage_path: storagePath,
    },
  });
}

