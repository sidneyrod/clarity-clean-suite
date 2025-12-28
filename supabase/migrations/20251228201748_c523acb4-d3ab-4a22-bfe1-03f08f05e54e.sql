-- =============================================
-- PHASE 0: Multi-Tenant Base Structure Updates
-- =============================================

-- 0.1 Update companies table with governance fields
ALTER TABLE public.companies 
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS tenant_mode text NOT NULL DEFAULT 'shared',
  ADD COLUMN IF NOT EXISTS dedicated_connection_id uuid NULL,
  ADD COLUMN IF NOT EXISTS business_number text NULL;

-- Add constraints for status and tenant_mode
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_status_check') THEN
    ALTER TABLE public.companies ADD CONSTRAINT companies_status_check 
      CHECK (status IN ('active', 'suspended', 'trial'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'companies_tenant_mode_check') THEN
    ALTER TABLE public.companies ADD CONSTRAINT companies_tenant_mode_check 
      CHECK (tenant_mode IN ('shared', 'dedicated'));
  END IF;
END $$;

-- 0.2 Update user_roles table with governance fields
ALTER TABLE public.user_roles 
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS invited_by uuid NULL,
  ADD COLUMN IF NOT EXISTS invited_at timestamptz NULL,
  ADD COLUMN IF NOT EXISTS joined_at timestamptz NULL;

-- Add constraint for status
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'user_roles_status_check') THEN
    ALTER TABLE public.user_roles ADD CONSTRAINT user_roles_status_check 
      CHECK (status IN ('active', 'invited', 'disabled'));
  END IF;
END $$;

-- =============================================
-- PHASE 1: Audit Core Strengthening
-- =============================================

-- 1.1 Update activity_logs with enterprise audit fields
ALTER TABLE public.activity_logs 
  ADD COLUMN IF NOT EXISTS before_data jsonb NULL,
  ADD COLUMN IF NOT EXISTS after_data jsonb NULL,
  ADD COLUMN IF NOT EXISTS reason text NULL,
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'ui',
  ADD COLUMN IF NOT EXISTS performed_by_user_id uuid NULL;

-- Add constraint for source
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'activity_logs_source_check') THEN
    ALTER TABLE public.activity_logs ADD CONSTRAINT activity_logs_source_check 
      CHECK (source IN ('ui', 'api', 'system', 'migration'));
  END IF;
END $$;

-- 1.2 Add comment explaining columns
COMMENT ON COLUMN public.activity_logs.before_data IS 'Complete state of entity before modification';
COMMENT ON COLUMN public.activity_logs.after_data IS 'Complete state of entity after modification';
COMMENT ON COLUMN public.activity_logs.reason IS 'Required justification for sensitive actions';
COMMENT ON COLUMN public.activity_logs.source IS 'Origin of the action: ui, api, system, migration';
COMMENT ON COLUMN public.activity_logs.details IS 'Additional metadata, not before/after data';

-- 1.3 Create immutability trigger for audit_logs
CREATE OR REPLACE FUNCTION public.prevent_audit_modification()
RETURNS TRIGGER 
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RAISE EXCEPTION 'Audit logs cannot be modified or deleted. This is a compliance requirement.';
END;
$$;

-- Drop existing trigger if exists, then recreate
DROP TRIGGER IF EXISTS audit_immutability ON public.activity_logs;

CREATE TRIGGER audit_immutability
  BEFORE UPDATE OR DELETE ON public.activity_logs
  FOR EACH ROW EXECUTE FUNCTION public.prevent_audit_modification();

-- =============================================
-- PHASE 2: Financial Periods Table
-- =============================================

-- 2.1 Create financial_periods table for period closing/reopening
CREATE TABLE IF NOT EXISTS public.financial_periods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  period_name text NOT NULL,
  start_date date NOT NULL,
  end_date date NOT NULL,
  status text NOT NULL DEFAULT 'open',
  closed_by uuid NULL,
  closed_at timestamptz NULL,
  closed_reason text NULL,
  reopened_by uuid NULL,
  reopened_at timestamptz NULL,
  reopen_reason text NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(company_id, period_name),
  CONSTRAINT financial_periods_status_check CHECK (status IN ('open', 'closed', 'reopened')),
  CONSTRAINT financial_periods_dates_check CHECK (end_date >= start_date)
);

-- Enable RLS
ALTER TABLE public.financial_periods ENABLE ROW LEVEL SECURITY;

-- 2.2 RLS Policies for financial_periods
-- All company users can view periods
CREATE POLICY "Users can view financial periods"
  ON public.financial_periods
  FOR SELECT
  USING (company_id = get_user_company_id());

-- Only admins can insert periods
CREATE POLICY "Admins can insert financial periods"
  ON public.financial_periods
  FOR INSERT
  WITH CHECK (company_id = get_user_company_id() AND has_role('admin'::app_role));

-- Only admins can update periods (close/reopen)
CREATE POLICY "Admins can update financial periods"
  ON public.financial_periods
  FOR UPDATE
  USING (company_id = get_user_company_id() AND has_role('admin'::app_role));

-- No one can delete periods (governance)
-- No DELETE policy = no deletes allowed

-- 2.3 Create function to check if period is open for a given date
CREATE OR REPLACE FUNCTION public.is_period_open(p_company_id uuid, p_date date)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT status IN ('open', 'reopened')
     FROM public.financial_periods
     WHERE company_id = p_company_id
       AND p_date BETWEEN start_date AND end_date
     ORDER BY created_at DESC 
     LIMIT 1),
    true -- If no period is defined for this date, consider it open
  );
$$;

-- 2.4 Create function to get current period for a company
CREATE OR REPLACE FUNCTION public.get_current_period(p_company_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id
  FROM public.financial_periods
  WHERE company_id = p_company_id
    AND CURRENT_DATE BETWEEN start_date AND end_date
  ORDER BY created_at DESC
  LIMIT 1;
$$;

-- =============================================
-- PHASE 3: Financial Transaction Audit Triggers
-- =============================================

-- 3.1 Create function to automatically audit financial transactions
CREATE OR REPLACE FUNCTION public.audit_financial_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_logs (
      company_id, user_id, action, entity_type, entity_id, 
      after_data, source, performed_by_user_id
    )
    VALUES (
      NEW.company_id, auth.uid(), 'financial_transaction_created', 
      'financial_transaction', NEW.id, 
      to_jsonb(NEW), 'system', auth.uid()
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.activity_logs (
      company_id, user_id, action, entity_type, entity_id, 
      before_data, after_data, source, performed_by_user_id
    )
    VALUES (
      NEW.company_id, auth.uid(), 'financial_transaction_updated', 
      'financial_transaction', NEW.id, 
      to_jsonb(OLD), to_jsonb(NEW), 'system', auth.uid()
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

-- Create trigger for financial_transactions
DROP TRIGGER IF EXISTS audit_financial_transactions ON public.financial_transactions;

CREATE TRIGGER audit_financial_transactions
  AFTER INSERT OR UPDATE ON public.financial_transactions
  FOR EACH ROW EXECUTE FUNCTION public.audit_financial_transaction();

-- 3.2 Create function to audit invoices
CREATE OR REPLACE FUNCTION public.audit_invoice()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_logs (
      company_id, user_id, action, entity_type, entity_id, 
      after_data, source, performed_by_user_id
    )
    VALUES (
      NEW.company_id, auth.uid(), 'invoice_created', 
      'invoice', NEW.id, 
      to_jsonb(NEW), 'system', auth.uid()
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.activity_logs (
      company_id, user_id, action, entity_type, entity_id, 
      before_data, after_data, source, performed_by_user_id
    )
    VALUES (
      NEW.company_id, auth.uid(), 'invoice_updated', 
      'invoice', NEW.id, 
      to_jsonb(OLD), to_jsonb(NEW), 'system', auth.uid()
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS audit_invoices ON public.invoices;

CREATE TRIGGER audit_invoices
  AFTER INSERT OR UPDATE ON public.invoices
  FOR EACH ROW EXECUTE FUNCTION public.audit_invoice();

-- 3.3 Create function to audit jobs
CREATE OR REPLACE FUNCTION public.audit_job()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_logs (
      company_id, user_id, action, entity_type, entity_id, 
      after_data, source, performed_by_user_id
    )
    VALUES (
      NEW.company_id, auth.uid(), 'job_created', 
      'job', NEW.id, 
      to_jsonb(NEW), 'system', auth.uid()
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.activity_logs (
      company_id, user_id, action, entity_type, entity_id, 
      before_data, after_data, source, performed_by_user_id
    )
    VALUES (
      NEW.company_id, auth.uid(), 'job_updated', 
      'job', NEW.id, 
      to_jsonb(OLD), to_jsonb(NEW), 'system', auth.uid()
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS audit_jobs ON public.jobs;

CREATE TRIGGER audit_jobs
  AFTER INSERT OR UPDATE ON public.jobs
  FOR EACH ROW EXECUTE FUNCTION public.audit_job();

-- 3.4 Create function to audit payroll periods
CREATE OR REPLACE FUNCTION public.audit_payroll_period()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_logs (
      company_id, user_id, action, entity_type, entity_id, 
      after_data, source, performed_by_user_id
    )
    VALUES (
      NEW.company_id, auth.uid(), 'payroll_period_created', 
      'payroll_period', NEW.id, 
      to_jsonb(NEW), 'system', auth.uid()
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO public.activity_logs (
      company_id, user_id, action, entity_type, entity_id, 
      before_data, after_data, source, performed_by_user_id
    )
    VALUES (
      NEW.company_id, auth.uid(), 'payroll_period_updated', 
      'payroll_period', NEW.id, 
      to_jsonb(OLD), to_jsonb(NEW), 'system', auth.uid()
    );
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS audit_payroll_periods ON public.payroll_periods;

CREATE TRIGGER audit_payroll_periods
  AFTER INSERT OR UPDATE ON public.payroll_periods
  FOR EACH ROW EXECUTE FUNCTION public.audit_payroll_period();

-- 3.5 Create function to audit financial periods
CREATE OR REPLACE FUNCTION public.audit_financial_period()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.activity_logs (
      company_id, user_id, action, entity_type, entity_id, 
      after_data, source, performed_by_user_id
    )
    VALUES (
      NEW.company_id, auth.uid(), 'financial_period_created', 
      'financial_period', NEW.id, 
      to_jsonb(NEW), 'system', auth.uid()
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    -- Determine action based on status change
    DECLARE
      action_name text;
    BEGIN
      IF OLD.status = 'open' AND NEW.status = 'closed' THEN
        action_name := 'financial_period_closed';
      ELSIF OLD.status = 'closed' AND NEW.status = 'reopened' THEN
        action_name := 'financial_period_reopened';
      ELSE
        action_name := 'financial_period_updated';
      END IF;
      
      INSERT INTO public.activity_logs (
        company_id, user_id, action, entity_type, entity_id, 
        before_data, after_data, reason, source, performed_by_user_id
      )
      VALUES (
        NEW.company_id, auth.uid(), action_name, 
        'financial_period', NEW.id, 
        to_jsonb(OLD), to_jsonb(NEW), 
        COALESCE(NEW.reopen_reason, NEW.closed_reason),
        'system', auth.uid()
      );
    END;
    RETURN NEW;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS audit_financial_periods ON public.financial_periods;

CREATE TRIGGER audit_financial_periods
  AFTER INSERT OR UPDATE ON public.financial_periods
  FOR EACH ROW EXECUTE FUNCTION public.audit_financial_period();

-- Add updated_at trigger
CREATE TRIGGER update_financial_periods_updated_at
  BEFORE UPDATE ON public.financial_periods
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();