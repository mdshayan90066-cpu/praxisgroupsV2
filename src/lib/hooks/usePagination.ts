import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../supabase';

export interface PaginationState {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface PaginationOptions {
  defaultPageSize?: number;
  pageSizeOptions?: number[];
}

export interface PaginatedQueryResult<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  pagination: PaginationState;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  refresh: () => void;
  retry: () => void;
}

/**
 * Hook for server-side pagination with Supabase.
 * Handles loading states, errors, and retry logic.
 */
export function usePagination<T extends Record<string, unknown>>(
  tableName: string,
  options: PaginationOptions = {}
): PaginatedQueryResult<T> {
  const { defaultPageSize = 20 } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [total, setTotal] = useState(0);
  const [retryCount, setRetryCount] = useState(0);

  const fetchPage = useCallback(async () => {
    setLoading(true);
    setError(null);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    try {
      const { count, error: countError } = await supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      if (countError) throw countError;
      setTotal(count ?? 0);

      const { data: rows, error: dataError } = await supabase
        .from(tableName)
        .select('*')
        .order('created_at', { ascending: false })
        .range(from, to);

      if (dataError) throw dataError;
      setData((rows as unknown as T[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [tableName, page, pageSize]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage, retryCount]);

  const setPageSafe = useCallback((newPage: number) => {
    const totalPages = Math.ceil(total / pageSize);
    const validPage = Math.max(1, Math.min(newPage, totalPages));
    setPage(validPage);
  }, [total, pageSize]);

  const setPageSizeSafe = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  }, []);

  const refresh = useCallback(() => {
    fetchPage();
  }, [fetchPage]);

  const retry = useCallback(() => {
    setRetryCount((c) => c + 1);
  }, []);

  return {
    data,
    loading,
    error,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
    setPage: setPageSafe,
    setPageSize: setPageSizeSafe,
    refresh,
    retry,
  };
}

/**
 * Hook for paginated queries with joins and filters.
 */
export interface FilteredPaginationOptions extends PaginationOptions {
  select?: string;
  filters?: Array<{ column: string; value: unknown; operator?: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'like' | 'ilike' | 'in' }>;
  orderBy?: { column: string; ascending?: boolean };
  searchColumn?: string;
  searchValue?: string;
}

export function useFilteredPagination<T extends Record<string, unknown>>(
  tableName: string,
  options: FilteredPaginationOptions = {}
): PaginatedQueryResult<T> & { setSearch: (value: string) => void } {
  const {
    defaultPageSize = 20,
    select = '*',
    filters = [],
    orderBy = { column: 'created_at', ascending: false },
    searchColumn,
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(defaultPageSize);
  const [total, setTotal] = useState(0);
  const [retryCount, setRetryCount] = useState(0);
  const [searchValue, setSearchValue] = useState(options.searchValue ?? '');

  const fetchPage = useCallback(async () => {
    setLoading(true);
    setError(null);

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    try {
      let countQuery = supabase
        .from(tableName)
        .select('*', { count: 'exact', head: true });

      let dataQuery = supabase
        .from(tableName)
        .select(select)
        .order(orderBy.column, { ascending: orderBy.ascending ?? false })
        .range(from, to);

      for (const filter of filters) {
        const op = filter.operator || 'eq';
        if (op === 'eq') {
          countQuery = countQuery.eq(filter.column, filter.value);
          dataQuery = dataQuery.eq(filter.column, filter.value);
        } else if (op === 'neq') {
          countQuery = countQuery.neq(filter.column, filter.value);
          dataQuery = dataQuery.neq(filter.column, filter.value);
        } else if (op === 'gt') {
          countQuery = countQuery.gt(filter.column, filter.value);
          dataQuery = dataQuery.gt(filter.column, filter.value);
        } else if (op === 'gte') {
          countQuery = countQuery.gte(filter.column, filter.value);
          dataQuery = dataQuery.gte(filter.column, filter.value);
        } else if (op === 'lt') {
          countQuery = countQuery.lt(filter.column, filter.value);
          dataQuery = dataQuery.lt(filter.column, filter.value);
        } else if (op === 'lte') {
          countQuery = countQuery.lte(filter.column, filter.value);
          dataQuery = dataQuery.lte(filter.column, filter.value);
        } else if (op === 'ilike') {
          countQuery = countQuery.ilike(filter.column, filter.value as string);
          dataQuery = dataQuery.ilike(filter.column, filter.value as string);
        } else if (op === 'like') {
          countQuery = countQuery.like(filter.column, filter.value as string);
          dataQuery = dataQuery.like(filter.column, filter.value as string);
        } else if (op === 'in') {
          countQuery = countQuery.in(filter.column, filter.value as unknown[]);
          dataQuery = dataQuery.in(filter.column, filter.value as unknown[]);
        }
      }

      if (searchColumn && searchValue.trim()) {
        const pattern = `%${searchValue.trim()}%`;
        countQuery = countQuery.ilike(searchColumn, pattern);
        dataQuery = dataQuery.ilike(searchColumn, pattern);
      }

      const { count, error: countError } = await countQuery;
      if (countError) throw countError;
      setTotal(count ?? 0);

      const { data: rows, error: dataError } = await dataQuery;
      if (dataError) throw dataError;
      setData((rows as unknown as T[]) ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
    }
  }, [tableName, page, pageSize, filters, select, orderBy, searchColumn, searchValue]);

  useEffect(() => {
    fetchPage();
  }, [fetchPage, retryCount]);

  const setPageSafe = useCallback((newPage: number) => {
    const totalPages = Math.ceil(total / pageSize) || 1;
    const validPage = Math.max(1, Math.min(newPage, totalPages));
    setPage(validPage);
  }, [total, pageSize]);

  const setPageSizeSafe = useCallback((newSize: number) => {
    setPageSize(newSize);
    setPage(1);
  }, []);

  const refresh = useCallback(() => {
    fetchPage();
  }, [fetchPage]);

  const retry = useCallback(() => {
    setRetryCount((c) => c + 1);
  }, []);

  const setSearch = useCallback((value: string) => {
    setSearchValue(value);
    setPage(1);
  }, []);

  return {
    data,
    loading,
    error,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
    setPage: setPageSafe,
    setPageSize: setPageSizeSafe,
    refresh,
    retry,
    setSearch,
  };
}
