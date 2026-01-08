import { useState, useCallback, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/integrations/supabase/types';

type TableName = keyof Database['public']['Tables'];

export interface PaginationState {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface PaginatedQueryOptions {
  table: string;
  select?: string;
  filters?: Record<string, any>;
  searchColumn?: string;
  searchValue?: string;
  orderBy?: { column: string; ascending?: boolean };
  pageSize?: number;
  companyId?: string;
  enabled?: boolean;
}

export interface PaginatedQueryResult<T> {
  data: T[];
  isLoading: boolean;
  error: Error | null;
  pagination: PaginationState;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  refresh: () => void;
}

export function usePaginatedQuery<T = any>(options: PaginatedQueryOptions): PaginatedQueryResult<T> {
  const {
    table,
    select = '*',
    filters = {},
    searchColumn,
    searchValue,
    orderBy = { column: 'created_at', ascending: false },
    pageSize: initialPageSize = 25,
    companyId,
    enabled = true,
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    page: 1,
    pageSize: initialPageSize,
    totalCount: 0,
    totalPages: 0,
  });

  const fetchData = useCallback(async () => {
    if (!enabled || !companyId) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Calculate pagination range
      const from = (pagination.page - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;

      // Build search filter for ilike
      let searchFilter: string | undefined;
      if (searchColumn && searchValue && searchValue.trim()) {
        searchFilter = `%${searchValue}%`;
      }

      // Use raw query approach to avoid TypeScript deep instantiation issues
      const { data: result, error: queryError, count } = await supabase
        .from(table as any)
        .select(select, { count: 'exact' })
        .eq('company_id', companyId)
        .order(orderBy.column, { ascending: orderBy.ascending ?? false })
        .range(from, to);

      if (queryError) {
        throw queryError;
      }

      // Apply client-side filtering for complex filters
      let filteredResult = result || [];
      
      // Apply search filter client-side for flexibility
      if (searchColumn && searchValue && searchValue.trim()) {
        const searchLower = searchValue.toLowerCase();
        filteredResult = filteredResult.filter((item: any) => {
          const fieldValue = item[searchColumn];
          return fieldValue && String(fieldValue).toLowerCase().includes(searchLower);
        });
      }

      // Apply other filters client-side
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '' && value !== 'all') {
          filteredResult = filteredResult.filter((item: any) => item[key] === value);
        }
      });

      setData(filteredResult as T[]);
      setPagination(prev => ({
        ...prev,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / prev.pageSize),
      }));
    } catch (err) {
      console.error(`Error fetching ${table}:`, err);
      setError(err instanceof Error ? err : new Error('Unknown error'));
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [
    enabled,
    companyId,
    table,
    select,
    JSON.stringify(filters),
    searchColumn,
    searchValue,
    orderBy.column,
    orderBy.ascending,
    pagination.page,
    pagination.pageSize,
  ]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset to page 1 when filters or search change
  useEffect(() => {
    setPagination(prev => ({ ...prev, page: 1 }));
  }, [JSON.stringify(filters), searchValue]);

  const setPage = useCallback((page: number) => {
    setPagination(prev => ({
      ...prev,
      page: Math.max(1, Math.min(page, prev.totalPages || 1)),
    }));
  }, []);

  const setPageSize = useCallback((size: number) => {
    setPagination(prev => ({
      ...prev,
      pageSize: size,
      page: 1, // Reset to first page when changing page size
      totalPages: Math.ceil(prev.totalCount / size),
    }));
  }, []);

  const refresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    pagination,
    setPage,
    setPageSize,
    refresh,
  };
}

// Helper hook for complex queries with multiple search columns
export function useMultiSearchPaginatedQuery<T = any>(
  options: Omit<PaginatedQueryOptions, 'searchColumn' | 'searchValue'> & {
    searchColumns?: string[];
    searchValue?: string;
  }
): PaginatedQueryResult<T> {
  const { searchColumns, searchValue, ...rest } = options;

  // For multiple search columns, we use the first one and filter client-side for others
  // A more robust solution would use a database function
  const primarySearchColumn = searchColumns?.[0];

  return usePaginatedQuery<T>({
    ...rest,
    searchColumn: primarySearchColumn,
    searchValue,
  });
}
