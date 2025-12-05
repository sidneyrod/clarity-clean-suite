import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Estimate {
  id: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  squareFootage: number;
  bedrooms: number;
  bathrooms: number;
  livingAreas: number;
  hasKitchen: boolean;
  serviceType: 'standard' | 'deep' | 'moveOut' | 'commercial';
  frequency: 'oneTime' | 'monthly' | 'biweekly' | 'weekly';
  includePets: boolean;
  includeChildren: boolean;
  includeGreen: boolean;
  includeFridge: boolean;
  includeOven: boolean;
  includeCabinets: boolean;
  includeWindows: boolean;
  hourlyRate: number;
  totalAmount: number;
  notes?: string;
  createdAt: string;
  status: 'draft' | 'sent' | 'accepted' | 'rejected';
}

interface EstimateState {
  estimates: Estimate[];
  addEstimate: (estimate: Omit<Estimate, 'id' | 'createdAt'>) => void;
  updateEstimate: (id: string, estimate: Partial<Estimate>) => void;
  deleteEstimate: (id: string) => void;
}

export const useEstimateStore = create<EstimateState>()(
  persist(
    (set) => ({
      estimates: [
        {
          id: '1',
          clientName: 'John Smith',
          clientEmail: 'john@example.com',
          clientPhone: '(514) 555-0123',
          squareFootage: 2000,
          bedrooms: 3,
          bathrooms: 2,
          livingAreas: 2,
          hasKitchen: true,
          serviceType: 'deep',
          frequency: 'biweekly',
          includePets: true,
          includeChildren: false,
          includeGreen: true,
          includeFridge: true,
          includeOven: true,
          includeCabinets: false,
          includeWindows: false,
          hourlyRate: 35,
          totalAmount: 285,
          createdAt: '2024-12-01T10:00:00Z',
          status: 'sent',
        },
        {
          id: '2',
          clientName: 'ABC Corporation',
          clientEmail: 'contact@abc.com',
          squareFootage: 5000,
          bedrooms: 0,
          bathrooms: 4,
          livingAreas: 0,
          hasKitchen: true,
          serviceType: 'commercial',
          frequency: 'weekly',
          includePets: false,
          includeChildren: false,
          includeGreen: false,
          includeFridge: false,
          includeOven: false,
          includeCabinets: true,
          includeWindows: true,
          hourlyRate: 40,
          totalAmount: 520,
          createdAt: '2024-12-02T14:30:00Z',
          status: 'accepted',
        },
      ],
      
      addEstimate: (estimate) => set((state) => ({
        estimates: [...state.estimates, { 
          ...estimate, 
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString()
        }]
      })),
      
      updateEstimate: (id, updates) => set((state) => ({
        estimates: state.estimates.map((e) => e.id === id ? { ...e, ...updates } : e)
      })),
      
      deleteEstimate: (id) => set((state) => ({
        estimates: state.estimates.filter((e) => e.id !== id)
      })),
    }),
    { name: 'estimate-store' }
  )
);
