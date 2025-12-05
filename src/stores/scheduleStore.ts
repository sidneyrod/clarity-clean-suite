import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type JobStatus = 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export interface ScheduledJob {
  id: string;
  clientId: string;
  clientName: string;
  address: string;
  date: string;
  time: string;
  duration: string;
  employeeId: string;
  employeeName: string;
  status: JobStatus;
  services: string[];
  notes?: string;
  completedAt?: string;
  beforePhoto?: string;
  afterPhoto?: string;
  checklist?: { item: string; completed: boolean }[];
}

export interface CleanerAvailability {
  id: string;
  employeeId: string;
  employeeName: string;
  availableDays: DayOfWeek[];
  startTime: string;
  endTime: string;
  exceptions: { date: string; reason: string }[];
}

export interface AbsenceRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

interface ScheduleState {
  jobs: ScheduledJob[];
  availabilities: CleanerAvailability[];
  absenceRequests: AbsenceRequest[];
  addJob: (job: Omit<ScheduledJob, 'id'>) => void;
  updateJob: (id: string, job: Partial<ScheduledJob>) => void;
  deleteJob: (id: string) => void;
  completeJob: (id: string, afterPhoto?: string) => void;
  setAvailability: (availability: Omit<CleanerAvailability, 'id'>) => void;
  updateAvailability: (id: string, availability: Partial<CleanerAvailability>) => void;
  addAbsenceRequest: (request: Omit<AbsenceRequest, 'id' | 'status' | 'createdAt'>) => void;
  updateAbsenceRequest: (id: string, status: 'approved' | 'rejected') => void;
}

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set) => ({
      jobs: [
        { id: '1', clientId: '1', clientName: 'Sarah Mitchell', address: '245 Oak Street', date: '2024-12-05', time: '09:00', duration: '3h', employeeId: '1', employeeName: 'Maria G.', status: 'completed', services: ['Deep Clean'], checklist: [{ item: 'Vacuum', completed: true }, { item: 'Mop', completed: true }] },
        { id: '2', clientId: '2', clientName: 'Thompson Corp', address: '890 Business Ave', date: '2024-12-05', time: '13:00', duration: '4h', employeeId: '2', employeeName: 'John D.', status: 'in-progress', services: ['Office Clean'] },
        { id: '3', clientId: '3', clientName: 'Emily Chen', address: '112 Maple Drive', date: '2024-12-05', time: '14:00', duration: '2h', employeeId: '3', employeeName: 'Ana R.', status: 'scheduled', services: ['Standard Clean'] },
        { id: '4', clientId: '4', clientName: 'Metro Office', address: '456 Tower Blvd', date: '2024-12-05', time: '16:00', duration: '3h', employeeId: '4', employeeName: 'David C.', status: 'scheduled', services: ['Daily Clean'] },
        { id: '5', clientId: '5', clientName: 'Robert Johnson', address: '78 Pine Avenue', date: '2024-12-06', time: '10:00', duration: '2.5h', employeeId: '5', employeeName: 'Sophie M.', status: 'scheduled', services: ['Move-out Clean'] },
      ],
      availabilities: [
        { id: '1', employeeId: '1', employeeName: 'Maria G.', availableDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'], startTime: '08:00', endTime: '17:00', exceptions: [] },
        { id: '2', employeeId: '2', employeeName: 'John D.', availableDays: ['monday', 'tuesday', 'wednesday', 'friday'], startTime: '09:00', endTime: '18:00', exceptions: [] },
        { id: '3', employeeId: '3', employeeName: 'Ana R.', availableDays: ['monday', 'wednesday', 'thursday', 'saturday'], startTime: '08:00', endTime: '16:00', exceptions: [] },
      ],
      absenceRequests: [],
      
      addJob: (job) => set((state) => ({
        jobs: [...state.jobs, { ...job, id: crypto.randomUUID() }]
      })),
      
      updateJob: (id, updates) => set((state) => ({
        jobs: state.jobs.map((job) => job.id === id ? { ...job, ...updates } : job)
      })),
      
      deleteJob: (id) => set((state) => ({
        jobs: state.jobs.filter((job) => job.id !== id)
      })),
      
      completeJob: (id, afterPhoto) => set((state) => ({
        jobs: state.jobs.map((job) => 
          job.id === id 
            ? { ...job, status: 'completed', completedAt: new Date().toISOString(), afterPhoto } 
            : job
        )
      })),
      
      setAvailability: (availability) => set((state) => {
        const existing = state.availabilities.find(a => a.employeeId === availability.employeeId);
        if (existing) {
          return {
            availabilities: state.availabilities.map(a => 
              a.employeeId === availability.employeeId ? { ...a, ...availability } : a
            )
          };
        }
        return {
          availabilities: [...state.availabilities, { ...availability, id: crypto.randomUUID() }]
        };
      }),
      
      updateAvailability: (id, updates) => set((state) => ({
        availabilities: state.availabilities.map((a) => a.id === id ? { ...a, ...updates } : a)
      })),
      
      addAbsenceRequest: (request) => set((state) => ({
        absenceRequests: [...state.absenceRequests, { 
          ...request, 
          id: crypto.randomUUID(), 
          status: 'pending', 
          createdAt: new Date().toISOString() 
        }]
      })),
      
      updateAbsenceRequest: (id, status) => set((state) => ({
        absenceRequests: state.absenceRequests.map((r) => r.id === id ? { ...r, status } : r)
      })),
    }),
    { name: 'schedule-store' }
  )
);
