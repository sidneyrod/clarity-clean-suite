-- Add company_code column for easier identification
ALTER TABLE public.companies 
ADD COLUMN company_code SERIAL UNIQUE;

-- Create RPC function to check if company can be deleted
CREATE OR REPLACE FUNCTION public.check_company_can_delete(p_company_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clients_count int;
  v_jobs_count int;
  v_invoices_count int;
  v_contracts_count int;
  v_users_count int;
  v_payroll_count int;
  v_financial_count int;
  v_reason text;
BEGIN
  -- Count dependencies
  SELECT COUNT(*) INTO v_clients_count FROM clients WHERE company_id = p_company_id;
  SELECT COUNT(*) INTO v_jobs_count FROM jobs WHERE company_id = p_company_id;
  SELECT COUNT(*) INTO v_invoices_count FROM invoices WHERE company_id = p_company_id;
  SELECT COUNT(*) INTO v_contracts_count FROM contracts WHERE company_id = p_company_id;
  SELECT COUNT(*) INTO v_users_count FROM user_roles WHERE company_id = p_company_id AND user_id != auth.uid();
  SELECT COUNT(*) INTO v_payroll_count FROM payroll_periods WHERE company_id = p_company_id;
  SELECT COUNT(*) INTO v_financial_count FROM financial_transactions WHERE company_id = p_company_id;

  -- Check if can delete
  IF v_clients_count > 0 OR v_jobs_count > 0 OR v_invoices_count > 0 
     OR v_contracts_count > 0 OR v_users_count > 0 
     OR v_payroll_count > 0 OR v_financial_count > 0 THEN
    v_reason := format(
      'Empresa possui dados: %s clientes, %s jobs, %s faturas, %s contratos, %s outros usuários, %s períodos de folha, %s transações',
      v_clients_count, v_jobs_count, v_invoices_count, v_contracts_count, 
      v_users_count, v_payroll_count, v_financial_count
    );
    RETURN jsonb_build_object(
      'can_delete', false,
      'reason', v_reason,
      'dependencies', jsonb_build_object(
        'clients', v_clients_count,
        'jobs', v_jobs_count,
        'invoices', v_invoices_count,
        'contracts', v_contracts_count,
        'users', v_users_count,
        'payroll_periods', v_payroll_count,
        'financial_transactions', v_financial_count
      )
    );
  END IF;

  RETURN jsonb_build_object(
    'can_delete', true,
    'reason', null,
    'dependencies', null
  );
END;
$$;

-- Create DELETE policy for admins
CREATE POLICY "Admins can delete empty companies"
ON public.companies
FOR DELETE
TO authenticated
USING (
  has_role_in_company(id, 'admin')
);