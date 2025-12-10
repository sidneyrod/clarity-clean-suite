import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

export type AuditAction = 
  | 'user_created' | 'user_updated' | 'user_deleted'
  | 'client_created' | 'client_updated' | 'client_deleted' | 'client_inactivated'
  | 'contract_created' | 'contract_updated' | 'contract_deleted'
  | 'job_created' | 'job_updated' | 'job_completed' | 'job_cancelled'
  | 'invoice_created' | 'invoice_sent' | 'invoice_paid' | 'invoice_cancelled'
  | 'payment_registered' | 'payment_confirmed' | 'payment_rejected'
  | 'payroll_created' | 'payroll_approved' | 'payroll_paid' | 'payroll_reprocessed'
  | 'absence_requested' | 'absence_approved' | 'absence_rejected'
  | 'settings_updated' | 'login' | 'logout';

interface AuditLogEntry {
  action: AuditAction;
  entityType?: string;
  entityId?: string;
  details?: {
    previousValue?: any;
    newValue?: any;
    description?: string;
    [key: string]: any;
  };
}

// Standalone function to log audit entries (can be used outside React components)
export const logAuditEntry = async (
  entry: AuditLogEntry,
  userId?: string,
  companyId?: string
) => {
  try {
    // Get company ID if not provided
    let resolvedCompanyId = companyId;
    if (!resolvedCompanyId) {
      const { data } = await supabase.rpc('get_user_company_id');
      resolvedCompanyId = data;
    }

    if (!resolvedCompanyId) {
      console.warn('No company ID available for audit log');
      return;
    }

    const { error } = await supabase
      .from('activity_logs')
      .insert({
        company_id: resolvedCompanyId,
        user_id: userId || null,
        action: entry.action,
        entity_type: entry.entityType,
        entity_id: entry.entityId,
        details: entry.details,
      });

    if (error) {
      console.error('Failed to create audit log:', error);
    }
  } catch (err) {
    console.error('Error logging audit entry:', err);
  }
};

// Hook for use within React components
export const useAuditLog = () => {
  const { user } = useAuth();

  const logAction = async (entry: AuditLogEntry) => {
    await logAuditEntry(
      entry,
      user?.id,
      user?.companyId || undefined
    );
  };

  return { logAction };
};

export default useAuditLog;
