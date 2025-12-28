import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface SetupCompanyData {
  companyName: string;
  legalName: string;
  email?: string;
  phone?: string;
  province?: string;
  businessNumber?: string;
}

interface SetupCompanyResult {
  success: boolean;
  company?: {
    id: string;
    tradeName: string;
    legalName: string;
  };
  error?: string;
}

interface UseCompanySetupReturn {
  setupCompany: (data: SetupCompanyData) => Promise<SetupCompanyResult>;
  isLoading: boolean;
  error: string | null;
}

export const useCompanySetup = (): UseCompanySetupReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const setupCompany = async (data: SetupCompanyData): Promise<SetupCompanyResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const { data: result, error: fnError } = await supabase.functions.invoke('setup-company', {
        body: data,
      });

      if (fnError) {
        console.error('Setup company error:', fnError);
        const errorMessage = fnError.message || 'Failed to setup company';
        setError(errorMessage);
        toast.error(errorMessage);
        return { success: false, error: errorMessage };
      }

      if (result.error) {
        setError(result.error);
        toast.error(result.error);
        return { success: false, error: result.error };
      }

      toast.success('Company setup completed successfully!');
      return {
        success: true,
        company: result.company,
      };

    } catch (err) {
      console.error('Unexpected error during company setup:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      toast.error(errorMessage);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  };

  return {
    setupCompany,
    isLoading,
    error,
  };
};

export default useCompanySetup;
