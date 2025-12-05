import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ActivityType = 
  | 'user_created' | 'user_updated' | 'user_deleted'
  | 'client_created' | 'client_updated' | 'client_deleted'
  | 'contract_created' | 'contract_updated' | 'contract_deleted'
  | 'job_created' | 'job_updated' | 'job_completed' | 'job_cancelled'
  | 'estimate_created' | 'estimate_updated' | 'estimate_deleted' | 'estimate_sent'
  | 'payroll_created' | 'payroll_approved' | 'payroll_paid'
  | 'settings_updated' | 'login' | 'logout'
  | 'absence_requested' | 'absence_approved' | 'absence_rejected';

export interface ActivityLog {
  id: string;
  type: ActivityType;
  entityId?: string;
  entityName?: string;
  description: string;
  userId: string;
  userName: string;
  timestamp: string;
  metadata?: Record<string, unknown>;
}

interface ActivityState {
  logs: ActivityLog[];
  addLog: (log: Omit<ActivityLog, 'id' | 'timestamp'>) => void;
  clearLogs: () => void;
}

export const useActivityStore = create<ActivityState>()(
  persist(
    (set) => ({
      logs: [
        { id: '1', type: 'user_created', entityId: '1', entityName: 'Maria Garcia', description: 'New user created: Maria Garcia', userId: 'admin', userName: 'Admin', timestamp: '2024-12-05T08:30:00Z' },
        { id: '2', type: 'client_created', entityId: '1', entityName: 'Sarah Mitchell', description: 'New client created: Sarah Mitchell', userId: 'admin', userName: 'Admin', timestamp: '2024-12-05T09:15:00Z' },
        { id: '3', type: 'job_completed', entityId: '1', entityName: 'Deep Clean - Sarah Mitchell', description: 'Job completed: Deep Clean at 245 Oak Street', userId: '1', userName: 'Maria Garcia', timestamp: '2024-12-05T12:00:00Z' },
        { id: '4', type: 'contract_created', entityId: '1', entityName: 'Thompson Corp Contract', description: 'New contract created for Thompson Corp', userId: 'admin', userName: 'Admin', timestamp: '2024-12-04T14:20:00Z' },
        { id: '5', type: 'estimate_sent', entityId: '1', entityName: 'John Smith Estimate', description: 'Estimate sent to John Smith', userId: 'admin', userName: 'Admin', timestamp: '2024-12-03T16:45:00Z' },
      ],
      
      addLog: (log) => set((state) => ({
        logs: [{ ...log, id: crypto.randomUUID(), timestamp: new Date().toISOString() }, ...state.logs].slice(0, 500) // Keep last 500 logs
      })),
      
      clearLogs: () => set({ logs: [] }),
    }),
    { name: 'activity-store' }
  )
);

// Helper function to log activities
export const logActivity = (
  type: ActivityType,
  description: string,
  entityId?: string,
  entityName?: string,
  metadata?: Record<string, unknown>
) => {
  useActivityStore.getState().addLog({
    type,
    entityId,
    entityName,
    description,
    userId: 'current-user', // Replace with actual user ID from auth
    userName: 'Current User', // Replace with actual user name from auth
    metadata,
  });
};
