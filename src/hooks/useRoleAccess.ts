import { useAuth, UserRole } from '@/contexts/AuthContext';
import { useMemo } from 'react';

interface RolePermissions {
  // Module access
  canAccessUsers: boolean;
  canAccessPayroll: boolean;
  canAccessMyPayroll: boolean; // Cleaner's own payroll report
  canAccessInvoices: boolean;
  canAccessClients: boolean;
  canAccessContracts: boolean;
  canAccessSchedule: boolean;
  canAccessCompletedServices: boolean;
  canAccessEstimate: boolean;
  canAccessOffRequests: boolean; // Admin view of all off requests
  canAccessMyOffRequests: boolean; // Cleaner's own off requests
  canAccessActivityLog: boolean;
  canAccessCompany: boolean;
  canAccessSettings: boolean;
  canAccessAvailability: boolean; // Admin-only availability management
  canAccessFinancialPeriods: boolean; // Admin/Manager can view
  
  // Action permissions
  canGenerateInvoices: boolean;
  canEditPayroll: boolean;
  canDeleteRecords: boolean;
  canApproveOffRequests: boolean; // Only admin can approve/reject
  canCreateOffRequests: boolean; // Cleaners can create
  canEditAvailability: boolean; // Only admin can edit
  canViewAvailability: boolean; // Everyone can view
  canCreateUsers: boolean;
  canReprocessPayroll: boolean;
  canConfirmCashPayments: boolean;
  canMarkJobComplete: boolean;
  canEditCompletedJob: boolean;
  canManageFinancialPeriods: boolean; // Only admin can close/reopen
  canViewFinancialPeriods: boolean; // Admin and Manager can view
}

// Role permission matrix
const rolePermissions: Record<UserRole, RolePermissions> = {
  admin: {
    canAccessUsers: true,
    canAccessPayroll: true,
    canAccessMyPayroll: false,
    canAccessInvoices: true,
    canAccessClients: true,
    canAccessContracts: true,
    canAccessSchedule: true,
    canAccessCompletedServices: true,
    canAccessEstimate: true,
    canAccessOffRequests: true,
    canAccessMyOffRequests: false, // Admin uses the admin view
    canAccessActivityLog: true,
    canAccessCompany: true,
    canAccessSettings: true,
    canAccessAvailability: true,
    canAccessFinancialPeriods: true,
    canGenerateInvoices: true,
    canEditPayroll: true,
    canDeleteRecords: true,
    canApproveOffRequests: true,
    canCreateOffRequests: false, // Admin doesn't need to request off
    canEditAvailability: true,
    canViewAvailability: true,
    canCreateUsers: true,
    canReprocessPayroll: true,
    canConfirmCashPayments: true,
    canMarkJobComplete: true,
    canEditCompletedJob: false, // Nobody can edit completed jobs
    canManageFinancialPeriods: true, // Admin can close/reopen
    canViewFinancialPeriods: true,
  },
  manager: {
    canAccessUsers: false,
    canAccessPayroll: false,
    canAccessMyPayroll: false,
    canAccessInvoices: true, // View only
    canAccessClients: true,
    canAccessContracts: true,
    canAccessSchedule: true,
    canAccessCompletedServices: true,
    canAccessEstimate: true,
    canAccessOffRequests: true, // Can view but not approve
    canAccessMyOffRequests: false,
    canAccessActivityLog: true,
    canAccessCompany: false,
    canAccessSettings: false,
    canAccessAvailability: true, // Can view
    canAccessFinancialPeriods: true,
    canGenerateInvoices: false, // Only admin
    canEditPayroll: false,
    canDeleteRecords: false,
    canApproveOffRequests: false, // Only admin
    canCreateOffRequests: false,
    canEditAvailability: false, // Only admin
    canViewAvailability: true,
    canCreateUsers: false,
    canReprocessPayroll: false,
    canConfirmCashPayments: false,
    canMarkJobComplete: true,
    canEditCompletedJob: false,
    canManageFinancialPeriods: false, // Only admin
    canViewFinancialPeriods: true,
  },
  cleaner: {
    canAccessUsers: false,
    canAccessPayroll: false,
    canAccessMyPayroll: true, // Cleaners can see their own payroll
    canAccessInvoices: false,
    canAccessClients: false,
    canAccessContracts: false,
    canAccessSchedule: true, // View own jobs only
    canAccessCompletedServices: false,
    canAccessEstimate: false,
    canAccessOffRequests: false, // Uses MyOffRequests instead
    canAccessMyOffRequests: true, // Can view and create own requests
    canAccessActivityLog: false,
    canAccessCompany: false,
    canAccessSettings: false,
    canAccessAvailability: false, // Cannot access, only view via admin
    canAccessFinancialPeriods: false,
    canGenerateInvoices: false,
    canEditPayroll: false,
    canDeleteRecords: false,
    canApproveOffRequests: false,
    canCreateOffRequests: true, // Can create off requests
    canEditAvailability: false, // Cannot edit
    canViewAvailability: true, // Can view own availability (read-only)
    canCreateUsers: false,
    canReprocessPayroll: false,
    canConfirmCashPayments: false,
    canMarkJobComplete: true, // Can complete own jobs
    canEditCompletedJob: false,
    canManageFinancialPeriods: false,
    canViewFinancialPeriods: false,
  },
};

const defaultPermissions: RolePermissions = {
  canAccessUsers: false,
  canAccessPayroll: false,
  canAccessMyPayroll: false,
  canAccessInvoices: false,
  canAccessClients: false,
  canAccessContracts: false,
  canAccessSchedule: false,
  canAccessCompletedServices: false,
  canAccessEstimate: false,
  canAccessOffRequests: false,
  canAccessMyOffRequests: false,
  canAccessActivityLog: false,
  canAccessCompany: false,
  canAccessSettings: false,
  canAccessAvailability: false,
  canAccessFinancialPeriods: false,
  canGenerateInvoices: false,
  canEditPayroll: false,
  canDeleteRecords: false,
  canApproveOffRequests: false,
  canCreateOffRequests: false,
  canEditAvailability: false,
  canViewAvailability: false,
  canCreateUsers: false,
  canReprocessPayroll: false,
  canConfirmCashPayments: false,
  canMarkJobComplete: false,
  canEditCompletedJob: false,
  canManageFinancialPeriods: false,
  canViewFinancialPeriods: false,
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
