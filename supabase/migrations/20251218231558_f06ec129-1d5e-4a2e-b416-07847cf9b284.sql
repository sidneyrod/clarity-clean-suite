-- Fix the financial_ledger view to use SECURITY INVOKER instead of SECURITY DEFINER
-- This ensures RLS policies from underlying tables are properly enforced

-- First drop the existing view
DROP VIEW IF EXISTS public.financial_ledger;

-- Recreate the view with SECURITY INVOKER (default, explicit for clarity)
-- The underlying tables (invoices, jobs, payroll_entries, financial_adjustments) 
-- all have proper RLS policies that restrict access to company_id = get_user_company_id()
CREATE VIEW public.financial_ledger
WITH (security_invoker = true)
AS
SELECT 
  i.id,
  i.company_id,
  i.client_id,
  c.name as client_name,
  i.cleaner_id,
  COALESCE(p.first_name || ' ' || p.last_name, 'N/A') as cleaner_name,
  i.job_id,
  'invoice'::text as event_type,
  i.created_at,
  i.service_date as transaction_date,
  i.invoice_number as reference_number,
  i.invoice_number as service_reference,
  i.total as gross_amount,
  COALESCE(i.tax_amount, 0) as deductions,
  i.subtotal as net_amount,
  i.payment_method,
  i.status,
  i.notes
FROM invoices i
LEFT JOIN clients c ON c.id = i.client_id
LEFT JOIN profiles p ON p.id = i.cleaner_id

UNION ALL

SELECT 
  j.id,
  j.company_id,
  j.client_id,
  c.name as client_name,
  j.cleaner_id,
  COALESCE(p.first_name || ' ' || p.last_name, 'N/A') as cleaner_name,
  j.id as job_id,
  'visit'::text as event_type,
  j.created_at,
  j.scheduled_date as transaction_date,
  NULL as reference_number,
  j.job_type as service_reference,
  COALESCE(j.payment_amount, 0) as gross_amount,
  0 as deductions,
  COALESCE(j.payment_amount, 0) as net_amount,
  j.payment_method,
  j.status,
  j.notes
FROM jobs j
LEFT JOIN clients c ON c.id = j.client_id
LEFT JOIN profiles p ON p.id = j.cleaner_id
WHERE j.job_type = 'visit'

UNION ALL

SELECT 
  pe.id,
  pe.company_id,
  NULL as client_id,
  NULL as client_name,
  pe.employee_id as cleaner_id,
  COALESCE(p.first_name || ' ' || p.last_name, 'N/A') as cleaner_name,
  NULL as job_id,
  'payroll'::text as event_type,
  pe.created_at,
  pp.pay_date as transaction_date,
  pp.period_name as reference_number,
  pp.period_name as service_reference,
  COALESCE(pe.gross_pay, 0) as gross_amount,
  COALESCE(pe.cpp_deduction, 0) + COALESCE(pe.ei_deduction, 0) + COALESCE(pe.tax_deduction, 0) + COALESCE(pe.other_deductions, 0) as deductions,
  COALESCE(pe.net_pay, 0) as net_amount,
  NULL as payment_method,
  pp.status,
  pe.notes
FROM payroll_entries pe
LEFT JOIN payroll_periods pp ON pp.id = pe.period_id
LEFT JOIN profiles p ON p.id = pe.employee_id

UNION ALL

SELECT 
  fa.id,
  fa.company_id,
  fa.client_id,
  c.name as client_name,
  fa.cleaner_id,
  COALESCE(p.first_name || ' ' || p.last_name, 'N/A') as cleaner_name,
  fa.job_id,
  fa.event_type::text,
  fa.created_at,
  fa.transaction_date,
  fa.reference_number,
  fa.description as service_reference,
  fa.gross_amount,
  fa.deductions,
  fa.net_amount,
  fa.payment_method::text,
  fa.status,
  fa.notes
FROM financial_adjustments fa
LEFT JOIN clients c ON c.id = fa.client_id
LEFT JOIN profiles p ON p.id = fa.cleaner_id;

-- Grant select access to authenticated users (RLS from underlying tables will still apply)
GRANT SELECT ON public.financial_ledger TO authenticated;