import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  notifyStaffAdded,
  notifyStaffUpdated,
  notifyStaffDeleted,
  notifyAdvanceRecorded,
  notifyMonthlyReportCreated,
  notifyActionError,
} from '@/lib/notify';

interface Staff {
  id: number;
  fullName: string;
  role: string;
  phonenumber: string;
  basicSalary: string;
  status: string;
  age?: number;
  address?: string;
  createdAt?: string;
}

interface MonthlyRecord {
  id: number;
  staffId: number;
  amount: string;
  type: 'Advance' | 'Salary';
  date: string;
  note?: string;
  monthKey: string;
  isPaid: boolean;
}

interface StaffQueryParams {
  page?: number;
  pageSize?: number;
  searchTerm?: string;
}

// Fetch staff data
export function useStaff(params?: StaffQueryParams) {
  return useQuery({
    queryKey: ['staff', params],
    queryFn: async () => {
      try {
        const res = await fetch('/api/staff');
        if (!res.ok) throw new Error('Failed to fetch staff');
        return (await res.json()) as Staff[];
      } catch (error) {
        console.error('Error fetching staff:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// Fetch monthly payroll records for a specific month
export function useMonthlyRecords(monthKey: string, options?: { includePaid?: boolean }) {
  return useQuery({
    queryKey: ['monthly-records', monthKey, options?.includePaid ? 'includePaid' : 'unpaidOnly'],
    queryFn: async () => {
      try {
        const params = new URLSearchParams({ monthKey });
        if (options?.includePaid) {
          params.set('includePaid', '1');
        }
        const res = await fetch(`/api/payroll?${params.toString()}`);
        if (!res.ok) throw new Error('Failed to fetch monthly records');
        return (await res.json()) as MonthlyRecord[];
      } catch (error) {
        console.error('Error fetching monthly records:', error);
        throw error;
      }
    },
    staleTime: 1000 * 60 * 5,
  });
}

// Add staff mutation
export function useAddStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<Staff, 'id' | 'createdAt'>) => {
      const res = await fetch('/api/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Failed to add staff');
      return (await res.json()).staff as Staff;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      notifyStaffAdded(variables.fullName);
    },
    onError: () => {
      notifyActionError('خرابی لە زیادکردنی کارمەند');
    },
  });
}

// Add monthly record (advance/salary) mutation
export function useAddMonthlyRecord() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Omit<MonthlyRecord, 'id' | 'isPaid'>) => {
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Failed to add monthly record');
      return (await res.json()).record as MonthlyRecord;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['monthly-records', variables.monthKey] });
      notifyAdvanceRecorded(variables.amount, variables.type === 'Salary');
    },
    onError: (_error, variables) => {
      const label = variables?.type === 'Salary' ? 'موچە' : 'پێشەکی';
      notifyActionError(`خرابی لە تۆمارکردنی ${label}`);
    },
  });
}

// Create monthly report mutation: saves summary to payroll_history table
export function useCloseMonth() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (monthKey: string) => {
      const [month, year] = monthKey.split('-');
      const res = await fetch('/api/payroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'finalize',
          monthKey,
          month: Number(month),
          year: Number(year),
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to create monthly report');
      }
      return (await res.json()).record;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monthly-records'] });
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'خرابی لە دروستکردنی ڕاپۆرت';
      notifyActionError(message);
    },
  });
}

// Delete staff mutation
export function useDeleteStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/staff?id=${id}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete staff');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-records'] });
      notifyStaffDeleted();
    },
    onError: () => {
      notifyActionError('خرابی لە سڕینەوەی کارمەند');
    },
  });
}

// Update staff mutation
export function useUpdateStaff() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: Partial<Staff> & { id: number }) => {
      const res = await fetch('/api/staff', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (!res.ok) throw new Error('Failed to update staff');
      return (await res.json()).staff as Staff;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      notifyStaffUpdated(variables.fullName ?? 'کارمەند');
    },
    onError: () => {
      notifyActionError('خرابی لە نوێکردنەوەی زانیاری کارمەند');
    },
  });
}
