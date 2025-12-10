-- Add payment model fields to profiles for cleaner compensation
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS payment_model text DEFAULT 'hourly' CHECK (payment_model IN ('hourly', 'fixed', 'percentage')),
ADD COLUMN IF NOT EXISTS fixed_amount_per_job numeric,
ADD COLUMN IF NOT EXISTS percentage_of_job_total numeric;

-- Add comments for documentation
COMMENT ON COLUMN public.profiles.payment_model IS 'Cleaner payment model: hourly, fixed per job, or percentage of job total';
COMMENT ON COLUMN public.profiles.fixed_amount_per_job IS 'Fixed amount paid per job when payment_model is fixed';
COMMENT ON COLUMN public.profiles.percentage_of_job_total IS 'Percentage of job total paid to cleaner when payment_model is percentage';

-- Create cleaner_payments table to track individual job payments to cleaners
CREATE TABLE IF NOT EXISTS public.cleaner_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  cleaner_id uuid NOT NULL,
  job_id uuid NOT NULL,
  period_id uuid,
  service_date date NOT NULL,
  payment_model text NOT NULL,
  hours_worked numeric,
  hourly_rate numeric,
  job_total numeric,
  percentage_rate numeric,
  fixed_amount numeric,
  amount_due numeric NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cash_received')),
  cash_received_by_cleaner boolean DEFAULT false,
  paid_at timestamp with time zone,
  notes text,
  created_at timestamp with time zone DEFAULT now() NOT NULL,
  updated_at timestamp with time zone DEFAULT now() NOT NULL
);

-- Enable RLS on cleaner_payments
ALTER TABLE public.cleaner_payments ENABLE ROW LEVEL SECURITY;

-- RLS policies for cleaner_payments
CREATE POLICY "Admins can manage cleaner payments"
ON public.cleaner_payments
FOR ALL
USING (company_id = get_user_company_id() AND has_role('admin'::app_role));

CREATE POLICY "Admins can insert cleaner payments"
ON public.cleaner_payments
FOR INSERT
WITH CHECK (company_id = get_user_company_id() AND has_role('admin'::app_role));

CREATE POLICY "Cleaners can view their own payments"
ON public.cleaner_payments
FOR SELECT
USING (company_id = get_user_company_id() AND (cleaner_id = auth.uid() OR is_admin_or_manager()));

-- Create trigger for updated_at
CREATE TRIGGER update_cleaner_payments_updated_at
BEFORE UPDATE ON public.cleaner_payments
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();