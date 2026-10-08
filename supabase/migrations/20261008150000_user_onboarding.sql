-- Per-employee onboarding tour completion.
-- Separate from employees so employees can upsert their own row without
-- gaining an UPDATE path on employees (which would allow changing role).

CREATE TABLE public.user_onboarding (
  employee_id uuid PRIMARY KEY REFERENCES public.employees(id) ON DELETE CASCADE,
  tour_version integer NOT NULL,
  completed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

GRANT SELECT, INSERT, UPDATE ON public.user_onboarding TO authenticated;

CREATE POLICY user_onboarding_select_own ON public.user_onboarding
  FOR SELECT TO authenticated
  USING (employee_id = (SELECT public.current_employee_id()));

CREATE POLICY user_onboarding_insert_own ON public.user_onboarding
  FOR INSERT TO authenticated
  WITH CHECK (employee_id = (SELECT public.current_employee_id()));

CREATE POLICY user_onboarding_update_own ON public.user_onboarding
  FOR UPDATE TO authenticated
  USING (employee_id = (SELECT public.current_employee_id()))
  WITH CHECK (employee_id = (SELECT public.current_employee_id()));
