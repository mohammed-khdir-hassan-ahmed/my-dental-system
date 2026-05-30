'use client';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
  isLoading?: boolean;
  pageSizeOptions?: number[];
}

export function Pagination({
  currentPage,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
  isLoading = false,
  pageSizeOptions = [5, 10, 20, 50],
}: PaginationProps) {
  const startItem = (currentPage - 1) * pageSize + 1;
  const endItem = Math.min(currentPage * pageSize, totalPages * pageSize);

  const pageSizeSelector = (
    <>
      <span className="mr-2 text-sm text-muted-foreground">ژمارەی ئەنجامەکان لە هەر لاپەڕەیەکدا</span>
      <Select
        value={pageSize.toString()}
        onValueChange={(value) => onPageSizeChange(parseInt(value))}
        disabled={isLoading}
      >
        <SelectTrigger className="w-17.5">
          <SelectValue />
        </SelectTrigger>
        <SelectContent dir="rtl">
          {pageSizeOptions.map((size) => (
            <SelectItem key={size} value={size.toString()}>
              {size}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </>
  );

  return (
    <div className="w-full py-4" dir="rtl">
      <div className="relative flex items-center justify-center">
        {/* Page Size Selector (Right side on desktop) */}
        <div className="absolute right-0 hidden items-center gap-2 sm:flex">
          {pageSizeSelector}
        </div>

        {/* Pagination Controls (Centered) */}
        <div className="flex items-center justify-center gap-2">
          {/* First Page Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(1)}
            disabled={currentPage === 1 || isLoading}
            title="بڕوانە بۆ یەکەم پەڕە"
          >
            <ChevronsRight className="h-4 w-4" />
          </Button>

          {/* Previous Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1 || isLoading}
            title="پەڕەی پێشتر"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Page Info */}
          <div className="px-4 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">{currentPage}</span>
            <span> / </span>
            <span>{totalPages}</span>
          </div>

          {/* Next Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages || isLoading}
            title="پەڕەی دواتر"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          {/* Last Page Button */}
          <Button
            variant="outline"
            size="icon"
            onClick={() => onPageChange(totalPages)}
            disabled={currentPage === totalPages || isLoading}
            title="بڕوانە بۆ ئاخریِن پەڕە"
          >
            <ChevronsLeft className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Page Size Selector (Mobile) */}
      <div className="mt-4 flex items-center justify-center gap-2 sm:hidden">
        {pageSizeSelector}
      </div>
    </div>
  );
}
