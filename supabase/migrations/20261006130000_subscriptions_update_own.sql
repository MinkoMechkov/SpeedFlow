-- Employees may pause/cancel/reactivate their own subscriptions; admins can update any.
DROP POLICY IF EXISTS subscriptions_update_own ON public.subscriptions;
CREATE POLICY subscriptions_update_own ON public.subscriptions
  FOR UPDATE TO authenticated
  USING (employee_id = public.current_employee_id() OR public.is_admin())
  WITH CHECK (employee_id = public.current_employee_id() OR public.is_admin());
