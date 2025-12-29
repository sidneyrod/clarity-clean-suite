-- =====================================================
-- PHASE 6: Multi-Tenant Governance, Period Lock & Role Enforcement
-- =====================================================

-- PART 1: Schema Adjustments
-- =====================================================

-- 1.1 Make profiles.company_id NOT NULL (confirmed 0 NULLs exist)
ALTER TABLE profiles ALTER COLUMN company_id SET NOT NULL;

-- 1.2 Add composite indexes for tenant-scoped query performance
CREATE INDEX IF NOT EXISTS idx_jobs_company_scheduled ON jobs(company_id, scheduled_date);
CREATE INDEX IF NOT EXISTS idx_invoices_company_service ON invoices(company_id, service_date);
CREATE INDEX IF NOT EXISTS idx_financial_transactions_company_date ON financial_transactions(company_id, accounting_date);
CREATE INDEX IF NOT EXISTS idx_clients_company_name ON clients(company_id, name);
CREATE INDEX IF NOT EXISTS idx_activity_logs_company_created ON activity_logs(company_id, created_at);
CREATE INDEX IF NOT EXISTS idx_financial_periods_company_dates ON financial_periods(company_id, start_date, end_date);

-- 1.3 Tenant-aware unique constraints
ALTER TABLE invoices ADD CONSTRAINT invoices_company_number_unique 
  UNIQUE (company_id, invoice_number);
ALTER TABLE contracts ADD CONSTRAINT contracts_company_number_unique 
  UNIQUE (company_id, contract_number);

-- =====================================================
-- PART 2: Period Lock Implementation
-- =====================================================

-- 2.1 Trigger for financial_transactions - Block writes in closed period
CREATE OR REPLACE FUNCTION public.enforce_period_lock_financial_transactions()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.is_period_open(NEW.company_id, NEW.accounting_date) THEN
    RAISE EXCEPTION 'Cannot modify financial transaction: period for date % is closed. Reopen the period or create an adjustment.', NEW.accounting_date;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS enforce_period_lock_on_financial_transactions ON financial_transactions;
CREATE TRIGGER enforce_period_lock_on_financial_transactions
  BEFORE INSERT OR UPDATE ON financial_transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_period_lock_financial_transactions();

-- 2.2 Trigger for invoices - Block writes in closed period
CREATE OR REPLACE FUNCTION public.enforce_period_lock_invoices()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.is_period_open(NEW.company_id, NEW.service_date) THEN
    RAISE EXCEPTION 'Cannot modify invoice: period for date % is closed. Reopen the period or create an adjustment.', NEW.service_date;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS enforce_period_lock_on_invoices ON invoices;
CREATE TRIGGER enforce_period_lock_on_invoices
  BEFORE INSERT OR UPDATE ON invoices
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_period_lock_invoices();

-- 2.3 Trigger for cleaner_payments - Block writes in closed period
CREATE OR REPLACE FUNCTION public.enforce_period_lock_cleaner_payments()
RETURNS TRIGGER AS $$
BEGIN
  IF NOT public.is_period_open(NEW.company_id, NEW.service_date) THEN
    RAISE EXCEPTION 'Cannot modify cleaner payment: period for date % is closed. Reopen the period or create an adjustment.', NEW.service_date;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS enforce_period_lock_on_cleaner_payments ON cleaner_payments;
CREATE TRIGGER enforce_period_lock_on_cleaner_payments
  BEFORE INSERT OR UPDATE ON cleaner_payments
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_period_lock_cleaner_payments();

-- =====================================================
-- PART 3: Enforce Reason Obrigatório
-- =====================================================

-- Trigger to require reason when closing/reopening financial periods
CREATE OR REPLACE FUNCTION public.enforce_financial_period_reason()
RETURNS TRIGGER AS $$
BEGIN
  -- When closing a period, closed_reason is required
  IF NEW.status = 'closed' AND OLD.status != 'closed' AND (NEW.closed_reason IS NULL OR trim(NEW.closed_reason) = '') THEN
    RAISE EXCEPTION 'A reason is required when closing a financial period.';
  END IF;
  
  -- When reopening a period, reopen_reason is required
  IF NEW.status = 'reopened' AND OLD.status != 'reopened' AND (NEW.reopen_reason IS NULL OR trim(NEW.reopen_reason) = '') THEN
    RAISE EXCEPTION 'A reason is required when reopening a financial period.';
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS enforce_reason_on_financial_periods ON financial_periods;
CREATE TRIGGER enforce_reason_on_financial_periods
  BEFORE UPDATE ON financial_periods
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_financial_period_reason();

-- =====================================================
-- PART 4: RLS Policies Refinement
-- =====================================================

-- 4.1 Jobs - Restrict SELECT for cleaners (see only their own jobs)
DROP POLICY IF EXISTS "Users can view jobs in their company" ON jobs;

CREATE POLICY "Users can view jobs in their company"
  ON jobs FOR SELECT
  USING (
    company_id = public.get_user_company_id() AND (
      public.is_admin_or_manager() OR 
      cleaner_id = auth.uid()
    )
  );

-- =====================================================
-- PART 5: Função de Contexto Documentation
-- =====================================================

COMMENT ON FUNCTION public.get_user_company_id() IS 
'Returns the company_id for the current authenticated user. 
LIMITATION: Currently supports only single-company per user. 
For multi-company support in the future, implement user_company_context table 
and switch this function to read from active_company_id.';