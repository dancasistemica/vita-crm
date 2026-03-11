import { useState, useCallback } from 'react';

export function useTablePagination(initialPerPage = 25) {
  const [perPage, setPerPageState] = useState(initialPerPage);
  const [page, setPage] = useState(1);

  const setPerPage = useCallback((value: number) => {
    console.log('[useTablePagination] Alterando itens por página:', value);
    setPerPageState(value);
    setPage(1);
  }, []);

  const resetPage = useCallback(() => setPage(1), []);

  return { page, setPage, perPage, setPerPage, resetPage };
}
