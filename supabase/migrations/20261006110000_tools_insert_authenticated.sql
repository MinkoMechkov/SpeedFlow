-- Employees can add custom tools when uploading invoices.
-- Admin FOR ALL policy still covers update/delete.
CREATE POLICY tools_insert_auth ON public.tools
  FOR INSERT TO authenticated
  WITH CHECK (true);
