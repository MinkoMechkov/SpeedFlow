export type UserRole = "employee" | "admin";
export type BillingCycle =
  | "monthly"
  | "quarterly"
  | "yearly"
  | "semi_annual"
  | "other";
export type SubscriptionStatus = "active" | "paused" | "cancelled" | "pending";
export type InvoiceStatus =
  | "uploaded"
  | "extracting"
  | "pending_review"
  | "approved"
  | "rejected";
export type MonthlyCostStatus = "projected" | "approved" | "paid";

export type Employee = {
  id: string;
  user_id: string | null;
  name: string;
  email: string;
  department: string | null;
  role: UserRole;
  active: boolean;
  created_at: string;
};

export type Tool = {
  id: string;
  name: string;
  vendor: string;
  created_at: string;
};

export type Subscription = {
  id: string;
  employee_id: string;
  tool_id: string;
  plan: string | null;
  billing_cycle: BillingCycle;
  start_date: string | null;
  end_date: string | null;
  status: SubscriptionStatus;
  current_amount: number | null;
  currency: string;
  monthly_cost: number | null;
  created_at: string;
  updated_at: string;
  tool?: Tool;
};

export type Invoice = {
  id: string;
  employee_id: string;
  subscription_id: string | null;
  tool_id: string | null;
  storage_path: string | null;
  file_name: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  period_start: string | null;
  period_end: string | null;
  billing_cycle: BillingCycle | null;
  plan: string | null;
  amount: number | null;
  currency: string | null;
  tax_amount: number | null;
  monthly_cost: number | null;
  status: InvoiceStatus;
  ai_confidence: number | null;
  validation_flags: string[];
  employee_name_on_invoice: string | null;
  created_at: string;
  updated_at: string;
  tool?: Tool;
  employee?: Employee;
};

export type InvoiceExtraction = {
  id: string;
  invoice_id: string;
  raw_json: InvoiceExtractionPayload;
  confidence: number | null;
  model: string | null;
  created_at: string;
};

export type InvoiceExtractionPayload = {
  vendor: string | null;
  tool_name: string | null;
  invoice_number: string | null;
  invoice_date: string | null;
  billing_period_start: string | null;
  billing_period_end: string | null;
  billing_cycle: BillingCycle | null;
  plan: string | null;
  amount: number | null;
  currency: string | null;
  tax_amount: number | null;
  employee_name: string | null;
};

export type MonthlyCost = {
  id: string;
  employee_id: string;
  subscription_id: string | null;
  invoice_id: string | null;
  month: string;
  amount: number;
  currency: string;
  status: MonthlyCostStatus;
  created_at: string;
  employee?: Employee;
  subscription?: Subscription;
};

export type AuditLog = {
  id: string;
  user_id: string | null;
  employee_id: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type SessionUser = {
  employee: Employee;
  mode: "demo" | "supabase";
};
