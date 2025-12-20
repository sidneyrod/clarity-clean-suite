-- 1. Add is_billable column to jobs table
ALTER TABLE public.jobs 
ADD COLUMN IF NOT EXISTS is_billable BOOLEAN DEFAULT true;

-- 2. Add auto_send_cash_receipt to company_estimate_config
ALTER TABLE public.company_estimate_config 
ADD COLUMN IF NOT EXISTS auto_send_cash_receipt BOOLEAN DEFAULT false;

-- 3. Create payment_receipts table
CREATE TABLE IF NOT EXISTS public.payment_receipts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id UUID NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  receipt_number TEXT NOT NULL,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  client_id UUID NOT NULL REFERENCES public.clients(id) ON DELETE CASCADE,
  cleaner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  payment_method TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  tax_amount NUMERIC DEFAULT 0,
  total NUMERIC NOT NULL,
  service_date DATE NOT NULL,
  service_description TEXT,
  receipt_html TEXT,
  sent_at TIMESTAMPTZ,
  sent_to_email TEXT,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  UNIQUE(company_id, receipt_number)
);

-- 4. Enable RLS on payment_receipts
ALTER TABLE public.payment_receipts ENABLE ROW LEVEL SECURITY;

-- 5. Create RLS policies for payment_receipts
CREATE POLICY "Users can view receipts in their company"
ON public.payment_receipts
FOR SELECT
USING (company_id = get_user_company_id());

CREATE POLICY "Admin/Manager can insert receipts"
ON public.payment_receipts
FOR INSERT
WITH CHECK (company_id = get_user_company_id() AND is_admin_or_manager());

CREATE POLICY "Admin/Manager can manage receipts"
ON public.payment_receipts
FOR ALL
USING (company_id = get_user_company_id() AND is_admin_or_manager());

-- 6. Create updated_at trigger for payment_receipts
CREATE TRIGGER update_payment_receipts_updated_at
BEFORE UPDATE ON public.payment_receipts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 7. Create indexes for payment_receipts
CREATE INDEX IF NOT EXISTS idx_payment_receipts_company_id ON public.payment_receipts(company_id);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_job_id ON public.payment_receipts(job_id);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_client_id ON public.payment_receipts(client_id);
CREATE INDEX IF NOT EXISTS idx_payment_receipts_service_date ON public.payment_receipts(service_date);

-- 8. Drop and recreate financial_ledger view to include receipts and respect is_billable
DROP VIEW IF EXISTS public.financial_ledger;

CREATE VIEW public.financial_ledger 
WITH (security_invoker = true)
AS
-- Invoice payments
SELECT 
  i.id,
  i.company_id,
  i.client_id,
  c.name as client_name,
  i.cleaner_id,
  COALESCE(p.first_name || ' ' || p.last_name, '') as cleaner_name,
  i.job_id,
  'invoice'::text as event_type,
  i.service_date as transaction_date,
  i.invoice_number as service_reference,
  i.total as gross_amount,
  COALESCE(i.tax_amount, 0) as deductions,
  i.subtotal as net_amount,
  i.payment_method,
  i.payment_reference as reference_number,
  i.status,
  i.notes,
  i.created_at
FROM public.invoices i
LEFT JOIN public.clients c ON c.id = i.client_id
LEFT JOIN public.profiles p ON p.id = i.cleaner_id
WHERE i.job_id IS NULL OR EXISTS (
  SELECT 1 FROM public.jobs j WHERE j.id = i.job_id AND j.is_billable = true
)

UNION ALL

-- Cash receipts
SELECT 
  r.id,
  r.company_id,
  r.client_id,
  c.name as client_name,
  r.cleaner_id,
  COALESCE(p.first_name || ' ' || p.last_name, '') as cleaner_name,
  r.job_id,
  'payment'::text as event_type,
  r.service_date as transaction_date,
  r.receipt_number as service_reference,
  r.total as gross_amount,
  COALESCE(r.tax_amount, 0) as deductions,
  r.amount as net_amount,
  r.payment_method,
  NULL as reference_number,
  CASE WHEN r.sent_at IS NOT NULL THEN 'sent' ELSE 'pending' END as status,
  r.notes,
  r.created_at
FROM public.payment_receipts r
LEFT JOIN public.clients c ON c.id = r.client_id
LEFT JOIN public.profiles p ON p.id = r.cleaner_id

UNION ALL

-- Financial adjustments
SELECT 
  fa.id,
  fa.company_id,
  fa.client_id,
  c.name as client_name,
  fa.cleaner_id,
  COALESCE(p.first_name || ' ' || p.last_name, '') as cleaner_name,
  fa.job_id,
  fa.event_type::text,
  fa.transaction_date,
  fa.reference_number as service_reference,
  fa.gross_amount,
  fa.deductions,
  fa.net_amount,
  fa.payment_method::text,
  fa.reference_number,
  fa.status,
  fa.notes,
  fa.created_at
FROM public.financial_adjustments fa
LEFT JOIN public.clients c ON c.id = fa.client_id
LEFT JOIN public.profiles p ON p.id = fa.cleaner_id;

-- 9. Grant select on financial_ledger to authenticated users
GRANT SELECT ON public.financial_ledger TO authenticated;