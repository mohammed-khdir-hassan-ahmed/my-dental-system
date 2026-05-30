import { cn } from '@/lib/utils';

export function DashboardPageShell({
  children,
  className,
  dir = 'rtl',
}: {
  children: React.ReactNode;
  className?: string;
  dir?: 'rtl' | 'ltr';
}) {
  return (
    <div
      dir={dir}
      className={cn(
        'w-[calc(100%+3rem)] -mx-6 md:w-full md:mx-0 space-y-4 sm:space-y-8',
        className,
      )}
    >
      {children}
    </div>
  );
}

export const mobileInset = 'px-3 sm:px-0';

export const mobileStatsGrid =
  'grid grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-4';

export const mobileTableShell =
  'w-full border-y md:border md:rounded-xl border-border/90 overflow-hidden bg-card';

export const mobileTableScroll = 'overflow-x-auto w-full';

export const mobileTableMin = 'w-full min-w-[720px]';

export const mobileTh =
  'text-right text-primary font-bold px-2 sm:px-4 text-[11px] sm:text-sm whitespace-nowrap';

export const mobileTd =
  'px-2 sm:px-4 text-[11px] sm:text-xs font-semibold text-foreground/80 whitespace-nowrap';

export const mobileTdPrimary =
  'px-2 sm:px-4 text-[11px] sm:text-xs font-semibold text-foreground whitespace-nowrap';

export const mobileDialogContent =
  'w-[calc(100%-2rem)] max-w-[20rem] sm:max-w-md p-3 sm:p-4 gap-2 sm:gap-4 max-h-[90vh] overflow-y-auto';

export const mobileDialogContentWide =
  'w-[calc(100%-2rem)] max-w-[22rem] sm:max-w-lg p-3 sm:p-4 gap-2 sm:gap-4 max-h-[90vh] overflow-y-auto';

export const mobileInput = 'h-9 sm:h-10 text-base sm:text-sm';

export const mobileSelectTrigger = 'h-9 sm:h-10 text-base sm:text-sm';

export const mobileBtn = 'h-9 sm:h-10 text-xs sm:text-sm';
