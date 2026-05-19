import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { logger } from '../lib/logger';

export interface PagedResult<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
}

export type CrudFetchFn<T> = (
  page: number,
  size: number,
  query: string,
) => Promise<PagedResult<T>>;

export interface UseCrudResourceOptions {
  /** Items per page on initial load. Default: 10 */
  initialSize?: number;
  /** Debounce window for query-triggered refetches. Set to 0 to disable. Default: 0 */
  searchDebounceMs?: number;
  /** Toast message shown when fetch fails. */
  errorMessage?: string;
}

export interface UseCrudResourceResult<T> {
  items: T[];
  isLoading: boolean;
  totalElements: number;
  totalPages: number;

  page: number;
  size: number;
  setPage: React.Dispatch<React.SetStateAction<number>>;
  setSize: React.Dispatch<React.SetStateAction<number>>;

  query: string;
  setQuery: React.Dispatch<React.SetStateAction<string>>;

  selected: Set<number>;
  toggleSelect: (id: number) => void;
  clearSelection: () => void;
  setSelected: React.Dispatch<React.SetStateAction<Set<number>>>;

  refresh: () => Promise<void>;
}

/**
 * Centralized CRUD list state: pagination, debounced search, multi-select,
 * loading/error handling. Page-specific create/update/delete operations
 * stay in the page component — call `refresh()` after a mutation to reload.
 *
 * To pass extra filters (e.g. sortBy), close them over in `fetchFn` and wrap
 * it in `useCallback([sortBy])` — when its identity changes the hook refetches.
 */
export function useCrudResource<T>(
  fetchFn: CrudFetchFn<T>,
  options: UseCrudResourceOptions = {},
): UseCrudResourceResult<T> {
  const {
    initialSize = 10,
    searchDebounceMs = 0,
    errorMessage = "Ma'lumotlarni yuklashda xatolik",
  } = options;

  const [items, setItems] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const [page, setPage] = useState(0);
  const [size, setSize] = useState(initialSize);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());

  const fetchFnRef = useRef(fetchFn);
  useEffect(() => {
    fetchFnRef.current = fetchFn;
  }, [fetchFn]);

  const refresh = useCallback(async () => {
    try {
      setIsLoading(true);
      const result = await fetchFnRef.current(page, size, query);
      setItems(result.content);
      setTotalElements(result.totalElements);
      setTotalPages(result.totalPages);
    } catch (e) {
      logger.error('useCrudResource fetch failed:', e);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [page, size, query, errorMessage]);

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size, fetchFn]);

  useEffect(() => {
    if (searchDebounceMs <= 0) return;
    const timer = setTimeout(() => {
      if (page === 0) {
        refresh();
      } else {
        setPage(0);
      }
    }, searchDebounceMs);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const toggleSelect = useCallback((id: number) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const clearSelection = useCallback(() => setSelected(new Set()), []);

  return {
    items,
    isLoading,
    totalElements,
    totalPages,
    page,
    size,
    setPage,
    setSize,
    query,
    setQuery,
    selected,
    toggleSelect,
    clearSelection,
    setSelected,
    refresh,
  };
}
