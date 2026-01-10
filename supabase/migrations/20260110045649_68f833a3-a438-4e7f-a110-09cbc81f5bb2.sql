-- Ensure we can check a user's role for an arbitrary company without RLS recursion
CREATE OR REPLACE FUNCTION public.has_role_in_company(p_company_id uuid, p_role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles ur
    WHERE ur.user_id = auth.uid()
      AND ur.company_id = p_company_id
      AND ur.role = p_role
      AND ur.status = 'active'
  );
$$;

-- Replace user_roles policies that were tied to get_user_company_id()
DROP POLICY IF EXISTS "Admins can manage roles in their company" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view roles in their company" ON public.user_roles;

-- Users can always see their own role rows (across companies). Admins can see all roles in companies they admin.
CREATE POLICY "Users can view their roles across companies"
  ON public.user_roles
  FOR SELECT
  TO public
  USING (
    user_id = auth.uid()
    OR public.has_role_in_company(company_id, 'admin'::public.app_role)
  );

-- Only admins for that company can manage roles within that company
CREATE POLICY "Admins can insert roles in their companies"
  ON public.user_roles
  FOR INSERT
  TO public
  WITH CHECK (
    public.has_role_in_company(company_id, 'admin'::public.app_role)
  );

CREATE POLICY "Admins can update roles in their companies"
  ON public.user_roles
  FOR UPDATE
  TO public
  USING (
    public.has_role_in_company(company_id, 'admin'::public.app_role)
  )
  WITH CHECK (
    public.has_role_in_company(company_id, 'admin'::public.app_role)
  );

CREATE POLICY "Admins can delete roles in their companies"
  ON public.user_roles
  FOR DELETE
  TO public
  USING (
    public.has_role_in_company(company_id, 'admin'::public.app_role)
  );
