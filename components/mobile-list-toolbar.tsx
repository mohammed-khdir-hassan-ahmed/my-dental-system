'use client';

import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { mobileInset, mobileInput } from '@/components/dashboard-page-shell';

type MobileListToolbarProps = {
  searchValue: string;
  onSearchChange: (value: string) => void;
  searchPlaceholder?: string;
  filterSlot?: React.ReactNode;
  customDateSlot?: React.ReactNode;
  actionSlot?: React.ReactNode;
};

export function MobileListToolbar({
  searchValue,
  onSearchChange,
  searchPlaceholder = 'گەڕان...',
  filterSlot,
  customDateSlot,
  actionSlot,
}: MobileListToolbarProps) {
  return (
    <div className={`flex flex-col gap-2.5 sm:gap-3 w-full ${mobileInset}`}>
      {(filterSlot || actionSlot) && (
        <div className="flex flex-wrap items-stretch gap-2 w-full order-1 sm:order-2">
          {filterSlot}
          {actionSlot}
        </div>
      )}
      {customDateSlot && (
        <div className="w-full order-3 sm:order-3">{customDateSlot}</div>
      )}
      <div className="relative w-full order-2 sm:order-1">
        <Search className="absolute right-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 sm:h-4 text-muted-foreground pointer-events-none" />
        <Input
          type="text"
          placeholder={searchPlaceholder}
          value={searchValue}
          onChange={(e) => onSearchChange(e.target.value)}
          className={`w-full rounded-lg border-border/60 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 pr-9 sm:pr-10 ${mobileInput}`}
        />
      </div>
    </div>
  );
}

export function MobileCustomDateRange({
  startDate,
  endDate,
  onStartChange,
  onEndChange,
}: {
  startDate: string;
  endDate: string;
  onStartChange: (value: string) => void;
  onEndChange: (value: string) => void;
}) {
  return (
    <div className="grid grid-cols-2 gap-2 w-full">
      <Input
        type="date"
        value={startDate}
        onChange={(e) => onStartChange(e.target.value)}
        className={`w-full ${mobileInput}`}
      />
      <Input
        type="date"
        value={endDate}
        onChange={(e) => onEndChange(e.target.value)}
        className={`w-full ${mobileInput}`}
      />
    </div>
  );
}
