'use client';

import { parseAsInteger, useQueryState } from 'nuqs';
import { useMemo } from 'react';

interface UsePaginationParams {
  defaultPage?: number;
  defaultPageSize?: number;
  totalItems?: number;
}

export function usePagination({
  defaultPage = 1,
  defaultPageSize = 10,
  totalItems = 0,
}: UsePaginationParams = {}) {
  const [pageValue, setPage] = useQueryState('page', parseAsInteger.withDefault(defaultPage));
  const [pageSizeValue, setPageSize] = useQueryState(
    'pageSize',
    parseAsInteger.withDefault(defaultPageSize)
  );

  const page = Math.max(1, pageValue);
  const pageSize = Math.max(1, Math.min(pageSizeValue, 100)); // Max 100 items per page

  const totalPages = useMemo(() => {
    return Math.ceil(totalItems / pageSize) || 1;
  }, [totalItems, pageSize]);

  const handlePageChange = (newPage: number) => {
    const validPage = Math.max(1, Math.min(newPage, totalPages));
    setPage(validPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    const safeSize = Math.max(1, Math.min(newSize, 100));
    setPageSize(safeSize);
    setPage(1); // Reset to first page when page size changes
  };

  const startIndex = (page - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  return {
    page,
    pageSize,
    totalPages,
    startIndex,
    endIndex,
    handlePageChange,
    handlePageSizeChange,
  };
}
