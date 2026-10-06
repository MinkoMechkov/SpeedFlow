-- Auto-provision employees as role=employee on Auth signup.
-- Role can never be set to admin via this path.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.employees (user_id, name, email, department, role, active)
  VALUES (
    NEW.id,
    COALESCE(NULLIF(TRIM(NEW.raw_user_meta_data->>'name'), ''), split_part(NEW.email, '@', 1)),
    NEW.email,
    NULLIF(TRIM(NEW.raw_user_meta_data->>'department'), ''),
    'employee',
    true
  )
  ON CONFLICT (email) DO UPDATE
    SET user_id = EXCLUDED.user_id,
        name = EXCLUDED.name,
        department = COALESCE(EXCLUDED.department, public.employees.department),
        active = true
    WHERE public.employees.user_id IS NULL;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO supabase_auth_admin;

-- Fallback if session exists after signup and trigger already ran (idempotent via unique email).
DROP POLICY IF EXISTS employees_insert_self ON public.employees;
CREATE POLICY employees_insert_self ON public.employees
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid() AND role = 'employee');

