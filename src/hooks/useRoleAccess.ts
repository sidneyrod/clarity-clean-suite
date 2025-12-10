import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useMemo } from 'react';

interface RolePermissions {
  // Module access
  canAccessUsers: boolean;
  canAccessPayroll: boolean;
  canAccessInvoices: boolean;
  canAccessClients: boolean;
  canAccessContracts: boolean;
  canAccessSchedule: boolean;
  canAccessCompletedServices: boolean;
  canAccessEstimate: boolean;
  canAccessAbsences: boolean;
  canAccessActivityLog: boolean;
  canAccessCompany: boolean;
  canAccessSettings: boolean;
  
  // Action permissions
  canGenerateInvoices: boolean;
  canEditPayroll: boolean;
  canDeleteRecords: boolean;
  canApproveAbsences: boolean;
  canCreateUsers: boolean;
  canReprocessPayroll: boolean;
  canConfirmCashPayments: boolean;
  canMarkJobComplete: boolean;
  canEditCompletedJob: boolean;
}

// Role permission matrix
const rolePermissions: Record<UserRole, RolePermissions> = {
  admin: {
    canAccessUsers: true,
    canAccessPayroll: true,
    canAccessInvoices: true,
    canAccessClients: true,
    canAccessContracts: true,
    canAccessSchedule: true,
    canAccessCompletedServices: true,
    canAccessEstimate: true,
    canAccessAbsences: true,
    canAccessActivityLog: true,
    canAccessCompany: true,
    canAccessSettings: true,
    canGenerateInvoices: true,
    canEditPayroll: true,
    canDeleteRecords: true,
    canApproveAbsences: true,
    canCreateUsers: true,
    canReprocessPayroll: true,
    canConfirmCashPayments: true,
    canMarkJobComplete: true,
    canEditCompletedJob: false, // Nobody can edit completed jobs
  },
  manager: {
    canAccessUsers: false,
    canAccessPayroll: false,
    canAccessInvoices: true, // View only
    canAccessClients: true,
    canAccessContracts: true,
    canAccessSchedule: true,
    canAccessCompletedServices: true,
    canAccessEstimate: true,
    canAccessAbsences: true,
    canAccessActivityLog: true,
    canAccessCompany: false,
    canAccessSettings: false,
    canGenerateInvoices: false, // Only admin
    canEditPayroll: false,
    canDeleteRecords: false,
    canApproveAbsences: true,
    canCreateUsers: false,
    canReprocessPayroll: false,
    canConfirmCashPayments: false,
    canMarkJobComplete: true,
    canEditCompletedJob: false,
  },
  cleaner: {
    canAccessUsers: false,
    canAccessPayroll: false,
    canAccessInvoices: false,
    canAccessClients: false,
    canAccessContracts: false,
    canAccessSchedule: true, // View own jobs only
    canAccessCompletedServices: false,
    canAccessEstimate: false,
    canAccessAbsences: false, // Can only request, not manage
    canAccessActivityLog: false,
    canAccessCompany: false,
    canAccessSettings: false,
    canGenerateInvoices: false,
    canEditPayroll: false,
    canDeleteRecords: false,
    canApproveAbsences: false,
    canCreateUsers: false,
    canReprocessPayroll: false,
    canConfirmCashPayments: false,
    canMarkJobComplete: true, // Can complete own jobs
    canEditCompletedJob: false,
  },
};

const defaultPermissions: RolePermissions = {
  canAccessUsers: false,
  canAccessPayroll: false,
  canAccessInvoices: false,
  canAccessClients: false,
  canAccessContracts: false,
  canAccessSchedule: false,
  canAccessCompletedServices: false,
  canAccessEstimate: false,
  canAccessAbsences: false,
  canAccessActivityLog: false,
  canAccessCompany: false,
  canAccessSettings: false,
  canGenerateInvoices: false,
  canEditPayroll: false,
  canDeleteRecords: false,
  canApproveAbsences: false,
  canCreateUsers: false,
  canReprocessPayroll: false,
  canConfirmCashPayments: false,
  canMarkJobComplete: false,
  canEditCompletedJob: false,
};

export const useRoleAccess = () => {
  const { user, hasRole } = useAuth();

  const permissions = useMemo<RolePermissions>(() => {
    if (!user?.role) return defaultPermissions;
    return rolePermissions[user.role] || defaultPermissions;
  }, [user?.role]);

  const isAdmin = hasRole(['admin']);
  const isManager = hasRole(['manager']);
  const isCleaner = hasRole(['cleaner']);
  const isAdminOrManager = hasRole(['admin', 'manager']);

  return {
    ...permissions,
    isAdmin,
    isManager,
    isCleaner,
    isAdminOrManager,
    userRole: user?.role,
  };
};

export default useRoleAccess;
