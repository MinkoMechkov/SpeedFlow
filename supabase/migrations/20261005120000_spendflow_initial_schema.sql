-- SpendFlow MVP schema
-- Applied to remote via Supabase MCP; kept here for local/CI replay.

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE public.user_role AS ENUM ('employee', 'admin');
CREATE TYPE public.billing_cycle AS ENUM ('monthly', 'quarterly', 'yearly', 'semi_annual', 'other');
CREATE TYPE public.subscription_status AS ENUM ('active', 'paused', 'cancelled', 'pending');
CREATE TYPE public.invoice_status AS ENUM ('uploaded', 'extracting', 'pending_review', 'approved', 'rejected');
CREATE TYPE public.monthly_cost_status AS ENUM ('projected', 'approved', 'paid');

CREATE TABLE public.employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid UNIQUE REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  department text,
  role public.user_role NOT NULL DEFAULT 'employee',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.tools (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  vendor text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  tool_id uuid NOT NULL REFERENCES public.tools(id) ON DELETE RESTRICT,
  plan text,
  billing_cycle public.billing_cycle NOT NULL DEFAULT 'monthly',
  start_date date,
  end_date date,
  status public.subscription_status NOT NULL DEFAULT 'active',
  current_amount numeric(12,2),
  currency text NOT NULL DEFAULT 'EUR',
  monthly_cost numeric(12,2),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, tool_id)
);

CREATE TABLE public.invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  tool_id uuid REFERENCES public.tools(id) ON DELETE SET NULL,
  storage_path text,
  file_name text,
  invoice_number text,
  invoice_date date,
  period_start date,
  period_end date,
  billing_cycle public.billing_cycle,
  plan text,
  amount numeric(12,2),
  currency text DEFAULT 'EUR',
  tax_amount numeric(12,2),
  monthly_cost numeric(12,2),
  status public.invoice_status NOT NULL DEFAULT 'uploaded',
  ai_confidence numeric(5,4),
  validation_flags jsonb NOT NULL DEFAULT '[]'::jsonb,
  employee_name_on_invoice text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.invoice_extractions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  raw_json jsonb NOT NULL,
  confidence numeric(5,4),
  model text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.monthly_costs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id uuid NOT NULL REFERENCES public.employees(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES public.subscriptions(id) ON DELETE SET NULL,
  invoice_id uuid REFERENCES public.invoices(id) ON DELETE SET NULL,
  month date NOT NULL,
  amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'EUR',
  status public.monthly_cost_status NOT NULL DEFAULT 'projected',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (employee_id, subscription_id, month)
);

CREATE TABLE public.audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  employee_id uuid REFERENCES public.employees(id) ON DELETE SET NULL,
  action text NOT NULL,
  entity_type text NOT NULL,
  entity_id uuid,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_employees_user_id ON public.employees(user_id);
CREATE INDEX idx_employees_role ON public.employees(role);
CREATE INDEX idx_subscriptions_employee ON public.subscriptions(employee_id);
CREATE INDEX idx_invoices_employee ON public.invoices(employee_id);
CREATE INDEX idx_invoices_status ON public.invoices(status);
CREATE INDEX idx_monthly_costs_employee_month ON public.monthly_costs(employee_id, month);
CREATE INDEX idx_monthly_costs_month ON public.monthly_costs(month);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_created ON public.audit_logs(created_at DESC);

CREATE OR REPLACE FUNCTION public.current_employee_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.employees WHERE user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.employees
    WHERE user_id = auth.uid() AND role = 'admin' AND active = true
  );
$$;

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.monthly_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY employees_select_own ON public.employees
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY employees_update_admin ON public.employees
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY employees_insert_admin ON public.employees
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY tools_select_auth ON public.tools
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY tools_write_admin ON public.tools
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY subscriptions_select ON public.subscriptions
  FOR SELECT TO authenticated
  USING (employee_id = public.current_employee_id() OR public.is_admin());

CREATE POLICY subscriptions_write_admin ON public.subscriptions
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY invoices_select ON public.invoices
  FOR SELECT TO authenticated
  USING (employee_id = public.current_employee_id() OR public.is_admin());

CREATE POLICY invoices_insert_own ON public.invoices
  FOR INSERT TO authenticated
  WITH CHECK (employee_id = public.current_employee_id());

CREATE POLICY invoices_update_admin ON public.invoices
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY extractions_select ON public.invoice_extractions
  FOR SELECT TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_id AND i.employee_id = public.current_employee_id()
    )
  );

CREATE POLICY extractions_insert_service ON public.invoice_extractions
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.invoices i
      WHERE i.id = invoice_id AND i.employee_id = public.current_employee_id()
    )
    OR public.is_admin()
  );

CREATE POLICY monthly_costs_select ON public.monthly_costs
  FOR SELECT TO authenticated
  USING (employee_id = public.current_employee_id() OR public.is_admin());

CREATE POLICY monthly_costs_write_admin ON public.monthly_costs
  FOR ALL TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY audit_select_admin ON public.audit_logs
  FOR SELECT TO authenticated
  USING (public.is_admin());

CREATE POLICY audit_insert_auth ON public.audit_logs
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() OR public.is_admin());

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'invoices',
  'invoices',
  false,
  10485760,
  ARRAY['application/pdf', 'image/png', 'image/jpeg', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY invoices_storage_select ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'invoices'
    AND (
      public.is_admin()
      OR (storage.foldername(name))[1] = public.current_employee_id()::text
    )
  );

CREATE POLICY invoices_storage_insert ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'invoices'
    AND (storage.foldername(name))[1] = public.current_employee_id()::text
  );

CREATE POLICY invoices_storage_update ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'invoices'
    AND (
      public.is_admin()
      OR (storage.foldername(name))[1] = public.current_employee_id()::text
    )
  )
  WITH CHECK (
    bucket_id = 'invoices'
    AND (
      public.is_admin()
      OR (storage.foldername(name))[1] = public.current_employee_id()::text
    )
  );

INSERT INTO public.tools (id, name, vendor) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Figma', 'Figma'),
  ('22222222-2222-2222-2222-222222222222', 'Adobe Creative Cloud', 'Adobe'),
  ('33333333-3333-3333-3333-333333333333', 'Notion', 'Notion'),
  ('44444444-4444-4444-4444-444444444444', 'GitHub', 'GitHub'),
  ('55555555-5555-5555-5555-555555555555', 'Slack', 'Salesforce')
ON CONFLICT DO NOTHING;
