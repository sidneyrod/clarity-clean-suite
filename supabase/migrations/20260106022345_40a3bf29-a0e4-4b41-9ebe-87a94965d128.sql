-- Create cash_collections table for cash handling control
CREATE TABLE public.cash_collections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  job_id UUID NOT NULL REFERENCES jobs(id),
  payment_receipt_id UUID REFERENCES payment_receipts(id),
  cleaner_id UUID NOT NULL REFERENCES profiles(id),
  client_id UUID NOT NULL REFERENCES clients(id),
  amount NUMERIC NOT NULL,
  cash_handling TEXT NOT NULL CHECK (cash_handling IN ('kept_by_cleaner', 'delivered_to_office')),
  handled_by_user_id UUID REFERENCES profiles(id),
  handled_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  compensation_status TEXT NOT NULL DEFAULT 'pending' CHECK (compensation_status IN ('pending', 'settled', 'not_applicable')),
  payroll_period_id UUID REFERENCES payroll_periods(id),
  service_date DATE NOT NULL,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.cash_collections ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Admin can manage cash collections" ON public.cash_collections
  FOR ALL USING (company_id = get_user_company_id() AND has_role('admin'));

CREATE POLICY "Manager can view cash collections" ON public.cash_collections
  FOR SELECT USING (company_id = get_user_company_id() AND has_role('manager'));

CREATE POLICY "Cleaners can insert their cash collections" ON public.cash_collections
  FOR INSERT WITH CHECK (company_id = get_user_company_id() AND cleaner_id = auth.uid());

CREATE POLICY "Cleaners can view their own cash collections" ON public.cash_collections
  FOR SELECT USING (company_id = get_user_company_id() AND cleaner_id = auth.uid());

-- Create indexes for performance
CREATE INDEX idx_cash_collections_company_id ON public.cash_collections(company_id);
CREATE INDEX idx_cash_collections_cleaner_id ON public.cash_collections(cleaner_id);
CREATE INDEX idx_cash_collections_job_id ON public.cash_collections(job_id);
CREATE INDEX idx_cash_collections_compensation_status ON public.cash_collections(compensation_status);
CREATE INDEX idx_cash_collections_service_date ON public.cash_collections(service_date);

-- Add trigger for updated_at
CREATE TRIGGER update_cash_collections_updated_at
  BEFORE UPDATE ON public.cash_collections
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();