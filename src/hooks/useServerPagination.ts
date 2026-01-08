import { useState, useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export interface PaginationState {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface ServerPaginationConfig {
  pageSize?: number;
  defaultPage?: number;
}

export interface ServerPaginationResult<T> {
  data: T[];
  isLoading: boolean;
  error: string | null;
  pagination: PaginationState;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  refresh: () => Promise<void>;
}

/**
 * Generic hook for server-side pagination
 * Provides pagination state management and refresh capabilities
 */
export function useServerPagination<T>(
  fetchFn: (from: number, to: number) => Promise<{ data: T[]; count: number }>,
  config: ServerPaginationConfig = {}
): ServerPaginationResult<T> {
  const { pageSize: initialPageSize = 25, defaultPage = 1 } = config;
  
  const [data, setData] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<PaginationState>({
    page: defaultPage,
    pageSize: initialPageSize,
    totalCount: 0,
    totalPages: 0,
  });

  const fetchDataRef = useRef(fetchFn);
  fetchDataRef.current = fetchFn;

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const from = (pagination.page - 1) * pagination.pageSize;
      const to = from + pagination.pageSize - 1;

      const result = await fetchDataRef.current(from, to);
      
      setData(result.data);
      setPagination(prev => ({
        ...prev,
        totalCount: result.count,
        totalPages: Math.ceil(result.count / prev.pageSize),
      }));
    } catch (err) {
      console.error('Pagination fetch error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }, [pagination.page, pagination.pageSize]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      page: 1,
      totalPages: Math.ceil(prev.totalCount / size),
    }));
  }, []);

  const refresh = useCallback(async () => {
    await fetchData();
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

/**
 * Hook specifically for paginating Supabase tables with common patterns
 */
export function usePaginatedTable<T extends Record<string, any>>(
  table: string,
  options: {
    select?: string;
    companyId?: string;
    orderBy?: { column: string; ascending?: boolean };
    pageSize?: number;
    enabled?: boolean;
    filters?: Record<string, any>;
  }
) {
  const {
    select = '*',
    companyId,
    orderBy = { column: 'created_at', ascending: false },
    pageSize = 25,
    enabled = true,
    filters = {},
  } = options;

  const fetchFn = useCallback(async (from: number, to: number) => {
    if (!enabled || !companyId) {
      return { data: [], count: 0 };
    }

    let query = supabase
      .from(table as any)
      .select(select, { count: 'exact' })
      .eq('company_id', companyId);

    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        query = query.eq(key, value);
      }
    });

    // Apply ordering and pagination
    query = query
      .order(orderBy.column, { ascending: orderBy.ascending ?? false })
      .range(from, to);

    const { data, error, count } = await query;

    if (error) {
      throw error;
    }

    return {
      data: (data as unknown as T[]) || [],
      count: count || 0,
    };
  }, [table, select, companyId, orderBy.column, orderBy.ascending, enabled, JSON.stringify(filters)]);

  return useServerPagination<T>(fetchFn, { pageSize });
}
