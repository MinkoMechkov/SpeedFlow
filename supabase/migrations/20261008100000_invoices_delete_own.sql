-- Allow employees to delete their own non-approved invoices.
CREATE POLICY invoices_delete_own ON public.invoices
  FOR DELETE TO authenticated
  USING (
    employee_id = public.current_employee_id()
    AND status <> 'approved'
  );

-- Allow employees (own folder) and admins to delete invoice files from storage.
CREATE POLICY invoices_storage_delete ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'invoices'
    AND (
      public.is_admin()
      OR (storage.foldername(name))[1] = public.current_employee_id()::text
    )
  );
