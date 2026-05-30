'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { NuqsAdapter } from 'nuqs/adapters/next/app';
import { NotificationsProvider } from '@/contexts/notifications-context';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10, // 10 minutes (formerly cacheTime)
    },
  },
});

export function Providers({ children }: { children: ReactNode }) {
  return (
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>
        <NotificationsProvider>
          {children}
        </NotificationsProvider>
      </QueryClientProvider>
    </NuqsAdapter>
  );
}
