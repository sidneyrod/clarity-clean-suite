import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export interface FinancialPeriod {
  id: string;
  company_id: string;
  period_name: string;
  start_date: string;
  end_date: string;
  status: 'open' | 'closed' | 'reopened';
  closed_by: string | null;
  closed_at: string | null;
  closed_reason: string | null;
  reopened_by: string | null;
  reopened_at: string | null;
  reopen_reason: string | null;
  created_at: string;
  updated_at: string;
}

interface UseFinancialPeriodsReturn {
  periods: FinancialPeriod[];
  currentPeriod: FinancialPeriod | null;
  isLoading: boolean;
  error: string | null;
  fetchPeriods: () => Promise<void>;
  createPeriod: (periodName: string, startDate: string, endDate: string) => Promise<FinancialPeriod | null>;
  closePeriod: (periodId: string, reason: string) => Promise<boolean>;
  reopenPeriod: (periodId: string, reason: string) => Promise<boolean>;
  isPeriodOpen: (date: string) => boolean;
  getPeriodForDate: (date: string) => FinancialPeriod | null;
}

export const useFinancialPeriods = (): UseFinancialPeriodsReturn => {
  const { user } = useAuth();
  const [periods, setPeriods] = useState<FinancialPeriod[]>([]);
  const [currentPeriod, setCurrentPeriod] = useState<FinancialPeriod | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPeriods = useCallback(async () => {
    if (!user?.companyId) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('financial_periods')
        .select('*')
        .eq('company_id', user.companyId)
        .order('start_date', { ascending: false });

      if (fetchError) {
        throw fetchError;
      }

      const typedPeriods = (data || []) as FinancialPeriod[];
      setPeriods(typedPeriods);

      // Find current period (today's date falls within)
      const today = new Date().toISOString().split('T')[0];
      const current = typedPeriods.find(
        p => p.start_date <= today && p.end_date >= today
      );
      setCurrentPeriod(current || null);

    } catch (err) {
      console.error('Failed to fetch financial periods:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch periods');
    } finally {
      setIsLoading(false);
    }
  }, [user?.companyId]);

  useEffect(() => {
    fetchPeriods();
  }, [fetchPeriods]);

  const createPeriod = async (
    periodName: string,
    startDate: string,
    endDate: string
  ): Promise<FinancialPeriod | null> => {
    if (!user?.companyId) {
      toast.error('No company context');
      return null;
    }

    try {
      const { data, error: insertError } = await supabase
        .from('financial_periods')
        .insert({
          company_id: user.companyId,
          period_name: periodName,
          start_date: startDate,
          end_date: endDate,
          status: 'open',
        })
        .select()
        .single();

      if (insertError) {
        throw insertError;
      }

      const newPeriod = data as FinancialPeriod;
      setPeriods(prev => [newPeriod, ...prev]);
      
      // Update current period if this one includes today
      const today = new Date().toISOString().split('T')[0];
      if (startDate <= today && endDate >= today) {
        setCurrentPeriod(newPeriod);
      }

      toast.success('Financial period created successfully');
      return newPeriod;

    } catch (err) {
      console.error('Failed to create period:', err);
      toast.error('Failed to create financial period');
      return null;
    }
  };

  const closePeriod = async (periodId: string, reason: string): Promise<boolean> => {
    if (!reason.trim()) {
      toast.error('A reason is required to close a period');
      return false;
    }

    try {
      const { error: updateError } = await supabase
        .from('financial_periods')
        .update({
          status: 'closed',
          closed_by: user?.id,
          closed_at: new Date().toISOString(),
          closed_reason: reason,
        })
        .eq('id', periodId);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setPeriods(prev => prev.map(p => 
        p.id === periodId 
          ? { ...p, status: 'closed' as const, closed_reason: reason, closed_at: new Date().toISOString() }
          : p
      ));

      if (currentPeriod?.id === periodId) {
        setCurrentPeriod(prev => prev ? { ...prev, status: 'closed' as const } : null);
      }

      toast.success('Financial period closed successfully');
      return true;

    } catch (err) {
      console.error('Failed to close period:', err);
      toast.error('Failed to close financial period');
      return false;
    }
  };

  const reopenPeriod = async (periodId: string, reason: string): Promise<boolean> => {
    if (!reason.trim()) {
      toast.error('A reason is required to reopen a period');
      return false;
    }

    try {
      const { error: updateError } = await supabase
        .from('financial_periods')
        .update({
          status: 'reopened',
          reopened_by: user?.id,
          reopened_at: new Date().toISOString(),
          reopen_reason: reason,
        })
        .eq('id', periodId);

      if (updateError) {
        throw updateError;
      }

      // Update local state
      setPeriods(prev => prev.map(p => 
        p.id === periodId 
          ? { ...p, status: 'reopened' as const, reopen_reason: reason, reopened_at: new Date().toISOString() }
          : p
      ));

      if (currentPeriod?.id === periodId) {
        setCurrentPeriod(prev => prev ? { ...prev, status: 'reopened' as const } : null);
      }

      toast.success('Financial period reopened successfully');
      return true;

    } catch (err) {
      console.error('Failed to reopen period:', err);
      toast.error('Failed to reopen financial period');
      return false;
    }
  };

  const isPeriodOpen = (date: string): boolean => {
    const period = periods.find(p => p.start_date <= date && p.end_date >= date);
    if (!period) return true; // No period defined = considered open
    return period.status === 'open' || period.status === 'reopened';
  };

  const getPeriodForDate = (date: string): FinancialPeriod | null => {
    return periods.find(p => p.start_date <= date && p.end_date >= date) || null;
  };

  return {
    periods,
    currentPeriod,
    isLoading,
    error,
    fetchPeriods,
    createPeriod,
    closePeriod,
    reopenPeriod,
    isPeriodOpen,
    getPeriodForDate,
  };
};

export default useFinancialPeriods;
