'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Trash2, Plus, User, Pencil, Eye, FileText, Wallet, CalendarCheck } from 'lucide-react';
import { useQueryState } from 'nuqs';
import { useStaff, useMonthlyRecords, useAddStaff, useAddMonthlyRecord, useDeleteStaff, useUpdateStaff, useCloseMonth } from '@/hooks/useStaffQueries';
import { notifyActionError, notifyMonthClosed } from '@/lib/notify';
import { usePagination } from '@/hooks/usePagination';
import { getOfflineQueue, addToOfflineQueue } from '@/lib/offline-sync';
import { toast } from '@/lib/toast';
import { Pagination } from '@/components/pagination';
import {
  DashboardPageShell,
  mobileStatsGrid,
  mobileInset,
  mobileTableShell,
  mobileTableScroll,
  mobileTableMin,
  mobileTh,
  mobileTd,
  mobileTdPrimary,
  mobileDialogContent,
  mobileDialogContentWide,
  mobileBtn,
} from '@/components/dashboard-page-shell';
import { MobileListToolbar } from '@/components/mobile-list-toolbar';


interface FormData {
  fullName: string;
  role: string;
  phonenumber: string;
  basicSalary: string;
  age: string;
  address: string;
  status: string;
}

interface AdvanceFormData {
  staffId: string;
  amount: string;
  date: string;
  note: string;
}

import { Suspense } from 'react';

const getMonthKey = (date = new Date()) => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${month}-${date.getFullYear()}`;
};

const getDateInputValue = (date = new Date()) => {
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 10);
};

const MONTH_LABELS = ['مانگی ١', 'مانگی ٢', 'مانگی ٣', 'مانگی ٤', 'مانگی ٥', 'مانگی ٦', 'مانگی ٧', 'مانگی ٨', 'مانگی ٩', 'مانگی ١٠', 'مانگی ١١', 'مانگی ١٢'];

const formatMonthYearLabel = (month: number, year: number) => {
  return `${MONTH_LABELS[month - 1] || `مانگی ${month}`} ${year}`;
};

const getNextMonthYear = (month: number, year: number) => {
  if (month === 12) {
    return { month: 1, year: year + 1 };
  }
  return { month: month + 1, year };
};

const getPreviousMonthYear = (month: number, year: number) => {
  if (month === 1) {
    return { month: 12, year: year - 1 };
  }
  return { month: month - 1, year };
};

function StaffPageContent() {
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const [submitting, setSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useQueryState('search', {
    defaultValue: '',
  });
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [availableYears, setAvailableYears] = useState<number[]>([currentYear]);

  // Dialog states
  const [openAddStaffDialog, setOpenAddStaffDialog] = useState(false);
  const [openAddAdvanceDialog, setOpenAddAdvanceDialog] = useState(false);
  const [openEditStaffDialog, setOpenEditStaffDialog] = useState(false);
  const [openAdvanceReasonDialog, setOpenAdvanceReasonDialog] = useState(false);
  const [openDeleteStaffDialog, setOpenDeleteStaffDialog] = useState(false);
  const [openCloseMonthDialog, setOpenCloseMonthDialog] = useState(false);
  const [editingStaffId, setEditingStaffId] = useState<number | null>(null);
  const [deletingStaffId, setDeletingStaffId] = useState<number | null>(null);
  const [selectedStaffName, setSelectedStaffName] = useState('');
  const [deletingStaffName, setDeletingStaffName] = useState('');
  const [selectedAdvanceDetails, setSelectedAdvanceDetails] = useState<
    Array<{ id: number; amount: string; date: string; note?: string; pending_sync?: boolean }>
  >([]);

  // Form states
  const [staffFormData, setStaffFormData] = useState<FormData>({
    fullName: '',
    role: '',
    phonenumber: '',
    basicSalary: '',
    age: '',
    address: '',
    status: 'Active',
  });

  const [advanceFormData, setAdvanceFormData] = useState<AdvanceFormData>({
    staffId: '',
    amount: '',
    date: getDateInputValue(),
    note: '',
  });

  const [editFormData, setEditFormData] = useState<FormData>({
    fullName: '',
    role: '',
    phonenumber: '',
    basicSalary: '',
    age: '',
    address: '',
    status: 'Active',
  });

  // Queries and Mutations
  const queryClient = useQueryClient();
  const currentMonthKey = getMonthKey();
  const selectedMonthKey = `${String(selectedMonth).padStart(2, '0')}-${selectedYear}`;
  const isViewingCurrentMonth = selectedMonthKey === currentMonthKey;
  const { data: staff = [], isLoading: staffLoading } = useStaff();
  const { data: transactions = [] } = useMonthlyRecords(selectedMonthKey, {
    includePaid: !isViewingCurrentMonth,
  });
  const addStaffMutation = useAddStaff();
  const addTransactionMutation = useAddMonthlyRecord();
  const deleteStaffMutation = useDeleteStaff();
  const updateStaffMutation = useUpdateStaff();
  const closeMonthMutation = useCloseMonth();

  const [queueVersion, setQueueVersion] = useState(0);
  const [offlineStaff, setOfflineStaff] = useState<any[]>([]);
  const [offlineTransactions, setOfflineTransactions] = useState<any[]>([]);

  useEffect(() => {
    const handleQueueChange = () => setQueueVersion(v => v + 1);
    window.addEventListener('offline-queue-changed', handleQueueChange);
    window.addEventListener('offline-sync-complete', () => {
      queryClient.invalidateQueries({ queryKey: ['staff'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-records'] });
    });
    return () => {
      window.removeEventListener('offline-queue-changed', handleQueueChange);
      window.removeEventListener('offline-sync-complete', () => {
        queryClient.invalidateQueries({ queryKey: ['staff'] });
        queryClient.invalidateQueries({ queryKey: ['monthly-records'] });
      });
    };
  }, [queryClient]);

  useEffect(() => {
    const staffItems = getOfflineQueue()
      .filter((item) => item.type === 'staff' && item.action === 'create')
      .map((item) => ({
        id: item.id as any,
        fullName: item.body.fullName,
        role: item.body.role,
        phonenumber: item.body.phonenumber,
        basicSalary: item.body.basicSalary,
        age: item.body.age,
        address: item.body.address,
        status: item.body.status,
        pending_sync: true,
      }));
    setOfflineStaff(staffItems);

    const transItems = getOfflineQueue()
      .filter((item) => item.type === 'monthly-record' && item.action === 'create')
      .map((item) => ({
        id: item.id as any,
        staffId: item.body.staffId,
        amount: item.body.amount,
        type: item.body.type,
        date: item.body.date,
        note: item.body.note,
        monthKey: item.body.monthKey,
        isPaid: false,
        pending_sync: true,
      }));
    setOfflineTransactions(transItems);
  }, [queueVersion]);

  const mergedStaff = useMemo(() => {
    return [...offlineStaff, ...staff];
  }, [staff, offlineStaff]);

  const mergedTransactions = useMemo(() => {
    const filteredOffline = offlineTransactions.filter(t => t.monthKey === selectedMonthKey);
    return [...filteredOffline, ...transactions];
  }, [transactions, offlineTransactions, selectedMonthKey]);

  const refreshAvailableYears = useCallback(async () => {
    try {
      const res = await fetch('/api/payroll?getAvailableMonths=1', { cache: 'no-store' });
      if (!res.ok) return;
      const data = await res.json();

      const years = new Set<number>([currentYear, selectedYear]);
      if (Array.isArray(data)) {
        for (const row of data) {
          const year = Number(row?.year);
          if (Number.isFinite(year)) {
            years.add(year);
          }
        }
      }

      setAvailableYears(Array.from(years).sort((a, b) => b - a));
    } catch (error) {
      console.error('Error fetching available payroll years:', error);
    }
  }, [selectedYear, currentYear]);

  useEffect(() => {
    void refreshAvailableYears();
  }, [refreshAvailableYears]);

  // Filtering and Pagination
  const filteredStaff = useMemo(() => {
    return mergedStaff.filter(
      (s) =>
        s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.role.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.phonenumber.includes(searchTerm)
    );
  }, [mergedStaff, searchTerm]);

  const {
    page,
    pageSize,
    totalPages,
    startIndex,
    endIndex,
    handlePageChange,
    handlePageSizeChange,
  } = usePagination({
    totalItems: filteredStaff.length,
    defaultPageSize: 10,
  });

  const paginatedStaff = useMemo(() => {
    return filteredStaff.slice(startIndex, endIndex);
  }, [filteredStaff, startIndex, endIndex]);

  // Calculate totals for a staff member
  const getStaffMonthlyAdvances = (staffId: number) => {
    return mergedTransactions.filter((t) => {
      if (Number(t.staffId) !== Number(staffId) || t.type !== 'Advance') return false;
      return isViewingCurrentMonth ? !t.isPaid : true;
    });
  };

  const calculateStaffTotals = (staffId: number) => {
    const monthlyAdvances = getStaffMonthlyAdvances(staffId).reduce(
      (sum, t) => sum + parseFloat(t.amount || '0'),
      0
    );

    return monthlyAdvances;
  };

  const handleOpenAdvanceReason = (staffId: number, staffName: string) => {
    const details = getStaffMonthlyAdvances(staffId);
    setSelectedStaffName(staffName);
    setSelectedAdvanceDetails(details);
    setOpenAdvanceReasonDialog(true);
  };

  // Add staff handler
  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!staffFormData.fullName || !staffFormData.role || !staffFormData.phonenumber) {
      notifyActionError('تکایە ناو، ڕۆڵ و ژمارەی تەلەفۆن پڕبکەرەوە', 'فۆرم ناتەواو');
      return;
    }

    const data = {
      fullName: staffFormData.fullName,
      role: staffFormData.role,
      phonenumber: staffFormData.phonenumber,
      basicSalary: staffFormData.basicSalary,
      status: staffFormData.status,
      age: staffFormData.age ? parseInt(staffFormData.age) : undefined,
      address: staffFormData.address,
    };

    try {
      setSubmitting(true);

      if (!navigator.onLine) {
        addToOfflineQueue('staff', 'create', '/api/staff', 'POST', data);
        toast.success("داتاکان بە شێوازی ئۆفلایین پاشکەوت کران");
        setOpenAddStaffDialog(false);
        setStaffFormData({
          fullName: '',
          role: '',
          phonenumber: '',
          basicSalary: '',
          age: '',
          address: '',
          status: 'Active',
        });
        return;
      }

      try {
        await addStaffMutation.mutateAsync(data);
      } catch (mutationErr) {
        addToOfflineQueue('staff', 'create', '/api/staff', 'POST', data);
        toast.success("داتاکان بە شێوازی ئۆفلایین پاشکەوت کران");
        setOpenAddStaffDialog(false);
        setStaffFormData({
          fullName: '',
          role: '',
          phonenumber: '',
          basicSalary: '',
          age: '',
          address: '',
          status: 'Active',
        });
        return;
      }

      setOpenAddStaffDialog(false);
      setStaffFormData({
        fullName: '',
        role: '',
        phonenumber: '',
        basicSalary: '',
        age: '',
        address: '',
        status: 'Active',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'هەڵەیەک ڕویدا';
      notifyActionError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Add advance handler
  const handleAddAdvance = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!advanceFormData.staffId || !advanceFormData.amount || !advanceFormData.date) {
      notifyActionError('تکایە کارمەند و بڕی پێشەکی هەڵبژێرە', 'فۆرم ناتەواو');
      return;
    }

    const selectedDate = new Date(`${advanceFormData.date}T12:00:00`);
    if (Number.isNaN(selectedDate.getTime())) {
      notifyActionError('تکایە بەروارێکی دروست بنووسە', 'بەرواری نادروست');
      return;
    }

    const data = {
      staffId: parseInt(advanceFormData.staffId),
      amount: advanceFormData.amount,
      type: 'Advance' as const,
      date: selectedDate.toISOString(),
      note: advanceFormData.note,
      monthKey: getMonthKey(selectedDate),
    };

    try {
      setSubmitting(true);

      if (!navigator.onLine) {
        addToOfflineQueue('monthly-record', 'create', '/api/payroll', 'POST', data);
        toast.success("داتاکان بە شێوازی ئۆفلایین پاشکەوت کران");
        setOpenAddAdvanceDialog(false);
        setAdvanceFormData({
          staffId: '',
          amount: '',
          date: getDateInputValue(),
          note: '',
        });
        return;
      }

      try {
        await addTransactionMutation.mutateAsync(data);
      } catch (mutationErr) {
        addToOfflineQueue('monthly-record', 'create', '/api/payroll', 'POST', data);
        toast.success("داتاکان بە شێوازی ئۆفلایین پاشکەوت کران");
        setOpenAddAdvanceDialog(false);
        setAdvanceFormData({
          staffId: '',
          amount: '',
          date: getDateInputValue(),
          note: '',
        });
        return;
      }

      setOpenAddAdvanceDialog(false);
      setAdvanceFormData({
        staffId: '',
        amount: '',
        date: getDateInputValue(),
        note: '',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'هەڵەیەک ڕویدا';
      notifyActionError(message);
    } finally {
      setSubmitting(false);
    }
  };

  // Delete staff handler
  const handleAskDeleteStaff = (id: number, fullName: string) => {
    setDeletingStaffId(id);
    setDeletingStaffName(fullName);
    setOpenDeleteStaffDialog(true);
  };

  const handleConfirmDeleteStaff = async () => {
    if (!deletingStaffId) return;

    await deleteStaffMutation.mutateAsync(deletingStaffId);
    setOpenDeleteStaffDialog(false);
    setDeletingStaffId(null);
    setDeletingStaffName('');
  };

  const handleOpenEditStaff = (staffMember: {
    id: number;
    fullName: string;
    role: string;
    phonenumber: string;
    basicSalary: string;
    age?: number;
    address?: string;
    status: string;
  }) => {
    setEditingStaffId(staffMember.id);
    setEditFormData({
      fullName: staffMember.fullName,
      role: staffMember.role,
      phonenumber: staffMember.phonenumber,
      basicSalary: staffMember.basicSalary || '',
      age: staffMember.age ? staffMember.age.toString() : '',
      address: staffMember.address || '',
      status: staffMember.status || 'Active',
    });
    setOpenEditStaffDialog(true);
  };

  const handleEditStaff = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!editingStaffId || !editFormData.fullName || !editFormData.role || !editFormData.phonenumber) {
      notifyActionError('تکایە ناو، ڕۆڵ و ژمارەی تەلەفۆن پڕبکەرەوە', 'فۆرم ناتەواو');
      return;
    }

    const data = {
      id: editingStaffId,
      fullName: editFormData.fullName,
      role: editFormData.role,
      phonenumber: editFormData.phonenumber,
      basicSalary: editFormData.basicSalary,
      age: editFormData.age ? parseInt(editFormData.age) : undefined,
      address: editFormData.address,
      status: editFormData.status,
    };

    try {
      setSubmitting(true);

      if (!navigator.onLine) {
        addToOfflineQueue('staff', 'update', '/api/staff', 'PUT', data);
        toast.success("داتاکان بە شێوازی ئۆفلایین پاشکەوت کران");
        setOpenEditStaffDialog(false);
        setEditingStaffId(null);
        setEditFormData({
          fullName: '',
          role: '',
          phonenumber: '',
          basicSalary: '',
          age: '',
          address: '',
          status: 'Active',
        });
        return;
      }

      try {
        await updateStaffMutation.mutateAsync(data);
      } catch (mutationErr) {
        addToOfflineQueue('staff', 'update', '/api/staff', 'PUT', data);
        toast.success("داتاکان بە شێوازی ئۆفلایین پاشکەوت کران");
        setOpenEditStaffDialog(false);
        setEditingStaffId(null);
        setEditFormData({
          fullName: '',
          role: '',
          phonenumber: '',
          basicSalary: '',
          age: '',
          address: '',
          status: 'Active',
        });
        return;
      }

      setOpenEditStaffDialog(false);
      setEditingStaffId(null);
      setEditFormData({
        fullName: '',
        role: '',
        phonenumber: '',
        basicSalary: '',
        age: '',
        address: '',
        status: 'Active',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'هەڵەیەک ڕویدا';
      notifyActionError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatCurrency = (value: string | number | undefined) => {
    if (!value) return '0';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (!Number.isFinite(num) || num === 0) return '0';
    return num.toLocaleString('ku-IQ', { maximumFractionDigits: 0 });
  };

  // Format input with commas while keeping numeric value clean
  const formatInputValue = (value: string) => {
    if (!value) return '';
    const numericValue = value.replace(/,/g, '');
    const num = parseFloat(numericValue);
    if (isNaN(num)) return '';
    return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  if (staffLoading) {
    return (
      <div className="flex h-screen items-center justify-center" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <DashboardPageShell>
      {/* Stats Cards */}
      <div className={`${mobileStatsGrid} ${mobileInset}`}>
        {/* Staff Count Card */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 rounded-2xl group-hover:opacity-100 transition duration-300" />
          <div className="relative bg-blue-50 dark:bg-slate-900 rounded-xl sm:rounded-2xl p-3 sm:p-5 transition-all duration-300 group-hover:shadow-lg border border-transparent hover:border-blue-200 dark:hover:border-slate-600 h-full">
            <div className="flex items-start justify-between mb-2 sm:mb-4">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg sm:rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <User className="size-4 sm:size-6 text-white" />
              </div>
              <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                کارمەند
              </div>
            </div>
            <p className="text-[11px] sm:text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">ژمارەی کارمەندەکان</p>
            <h3 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white mb-2 sm:mb-4">{mergedStaff.length}</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-1.5 sm:p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                <div className="flex items-center gap-2">
                  <User className="size-3.5 text-slate-500 dark:text-slate-400" />
                  <span className="text-xs text-slate-600 dark:text-slate-400">کارمەند</span>
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">{mergedStaff.length}</span>
              </div>
            </div>
          </div>
        </div>
 
        {/* Basic Salary Card */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 opacity-0 rounded-2xl group-hover:opacity-100 transition duration-300" />
          <div className="relative bg-green-50 dark:bg-slate-900 rounded-xl sm:rounded-2xl p-3 sm:p-5 transition-all duration-300 group-hover:shadow-lg border border-transparent hover:border-green-200 dark:hover:border-slate-600 h-full">
            <div className="flex items-start justify-between mb-2 sm:mb-4">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg sm:rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <FileText className="size-4 sm:size-6 text-white" />
              </div>
              <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                مووچە
              </div>
            </div>
            <p className="text-[11px] sm:text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">کۆی مووچەی بنەڕەتی</p>
            <h3 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white mb-2 sm:mb-4">
              {formatCurrency(mergedStaff.reduce((sum, s) => sum + parseFloat(s.basicSalary || '0'), 0))} IQD
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-1.5 sm:p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                <div className="flex items-center gap-2">
                  <FileText className="size-3.5 text-slate-500 dark:text-slate-400" />
                  <span className="text-xs text-slate-600 dark:text-slate-400">کارمەند</span>
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">{mergedStaff.length}</span>
              </div>
            </div>
          </div>
        </div>
 
        {/* Remaining Salary Card */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 rounded-2xl group-hover:opacity-100 transition duration-300" />
          <div className="relative bg-blue-50 dark:bg-slate-900 rounded-xl sm:rounded-2xl p-3 sm:p-5 transition-all duration-300 group-hover:shadow-lg border border-transparent hover:border-blue-200 dark:hover:border-slate-600 h-full">
            <div className="flex items-start justify-between mb-2 sm:mb-4">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg sm:rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Wallet className="size-4 sm:size-6 text-white" />
              </div>
              <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                ماوە
              </div>
            </div>
            <p className="text-[11px] sm:text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">بڕی موچەی ماوە</p>
            <h3 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white mb-2 sm:mb-4">
              {formatCurrency(mergedStaff.reduce((sum, s) => sum + (parseFloat(s.basicSalary || '0') - calculateStaffTotals(s.id)), 0))} IQD
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-1.5 sm:p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                <div className="flex items-center gap-2">
                  <Wallet className="size-3.5 text-slate-500 dark:text-slate-400" />
                  <span className="text-xs text-slate-600 dark:text-slate-400">کارمەند</span>
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">{mergedStaff.length}</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      <div className={`flex flex-col gap-2.5 sm:gap-3 ${mobileInset}`}>
        <div className="flex flex-wrap items-stretch gap-2 w-full">
          <Button
            onClick={() => setOpenCloseMonthDialog(true)}
            className={`flex-1 sm:flex-none bg-primary hover:shadow-lg hover:shadow-primary/30 active:scale-95 active:shadow-inner gap-1 text-white font-semibold px-2 sm:px-3 text-xs sm:text-sm transition-all duration-150 ${mobileBtn}`}
          >
            <CalendarCheck className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>کۆتایی مانگ</span>
          </Button>
          <Button
            onClick={() => setOpenAddAdvanceDialog(true)}
            className={`flex-1 sm:flex-none bg-primary hover:shadow-lg hover:shadow-primary/30 active:scale-95 active:shadow-inner gap-1 text-white font-bold px-2 sm:px-3 text-xs sm:text-sm transition-all duration-150 ${mobileBtn}`}
          >
            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>پێشەکی</span>
          </Button>
          <Button
            onClick={() => setOpenAddStaffDialog(true)}
            className={`flex-1 sm:flex-none bg-primary hover:shadow-lg hover:shadow-primary/30 active:scale-95 active:shadow-inner gap-1 text-white font-semibold px-2 sm:px-3 text-xs sm:text-sm transition-all duration-150 ${mobileBtn}`}
          >
            <Plus className="h-3 w-3 sm:h-4 sm:w-4" />
            <span>کارمەند</span>
          </Button>
        </div>

        {/* Month/Year Filter */}
        <div className="rounded-xl border border-border/70 bg-card p-3">
          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[130px]">
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">مانگ</label>
              <Select value={String(selectedMonth)} onValueChange={(value) => setSelectedMonth(Number(value))}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {MONTH_LABELS.map((monthLabel, index) => (
                    <SelectItem key={monthLabel} value={String(index + 1)}>
                      {monthLabel}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="min-w-[130px]">
              <label className="mb-1 block text-xs font-semibold text-muted-foreground">ساڵ</label>
              <Select value={String(selectedYear)} onValueChange={(value) => setSelectedYear(Number(value))}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {availableYears.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Button
              type="button"
              variant="outline"
              className="h-9"
              onClick={() => {
                const prev = getPreviousMonthYear(selectedMonth, selectedYear);
                setSelectedMonth(prev.month);
                setSelectedYear(prev.year);
                setAvailableYears((years) => Array.from(new Set([...years, prev.year])).sort((a, b) => b - a));
              }}
            >
              مانگی پێشوو
            </Button>

            <div className="mr-auto text-xs text-muted-foreground">
              نیشاندانی داتا: <span className="font-semibold text-foreground">{formatMonthYearLabel(selectedMonth, selectedYear)}</span>
            </div>
          </div>
        </div>
      </div>

      <MobileListToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="گەڕان"
      />

      {/* Staff Table */}
      <div className={mobileTableShell}>
        <div className={mobileTableScroll}>
        <Table className={mobileTableMin}>
            <TableHeader className="bg-primary/5 border-b border-border/40">
              <TableRow className="hover:bg-primary/2 transition-colors">
                <TableHead className={mobileTh}>
                  ناوی کارمەند
                </TableHead>
                <TableHead className={mobileTh}>
                  پلەی کارمەند
                </TableHead>
                <TableHead className={mobileTh}>
                  ژمارە تەلەفۆن
                </TableHead>
                <TableHead className={mobileTh}>
                  تەمەن
                </TableHead>
                <TableHead className={mobileTh}>
                  ناونیشان
                </TableHead>
                <TableHead className={mobileTh}>
                  مووچەی بنەڕەتی
                </TableHead>
                <TableHead className={mobileTh}>
                  کۆی پێشەکییەکان
                </TableHead>
                <TableHead className={mobileTh}>
                  بڕی ماوەی مووچە
                </TableHead>
                <TableHead className={`${mobileTh} text-center`}>
                  کردارەکان
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStaff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground hover:bg-transparent">
                    <div className="flex flex-col items-center gap-2">
                      <User className="w-12 h-12 opacity-30 mx-auto" />
                      <span className="text-lg">{searchTerm ? 'هیچ کارمەندێک نەدۆزرایەوە!' : 'هیچ کارمەند نیە'}</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedStaff.map((s, index) => {
                  const totalAdvances = calculateStaffTotals(s.id);
                  const basicSalary = parseFloat(s.basicSalary || '0');
                  const remainingSalary = basicSalary - totalAdvances;

                  return (
                    <TableRow
                      key={s.id}
                      className={`transition-all duration-200 border-b border-gray-100 dark:border-gray-800 ${
                        index % 2 === 0 
                          ? 'bg-white dark:bg-slate-950' 
                          : 'bg-primary/2 dark:bg-slate-900/30'
                      } hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors`}
                    >
                      <TableCell className={mobileTdPrimary}>
                        <div className="flex items-center gap-2">
                          <span>{s.fullName}</span>
                          {s.pending_sync && (
                            <span className="inline-flex h-4 items-center justify-center rounded bg-amber-50 px-1.5 text-[9px] font-bold text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/40 shrink-0">
                              <span className="h-1 w-1 rounded-full bg-amber-500 animate-pulse mr-1" />
                              لە چاوەڕوانیدا
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className={mobileTd}>{s.role}</TableCell>
                      <TableCell className={mobileTd}>
                        {s.phonenumber}
                      </TableCell>
                      <TableCell className={mobileTd}>
                        {s.age ? `${s.age} ساڵ` : '-'}
                      </TableCell>
                      <TableCell className={mobileTd}>
                        {s.address || '-'}
                      </TableCell>
                      <TableCell className="text-foreground/70">
                        <span className="inline-flex h-5 items-center justify-center whitespace-nowrap rounded-4xl bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-900/40 dark:text-green-300">
                          {formatCurrency(basicSalary)}
                        </span>
                      </TableCell>
                      <TableCell className="text-foreground/70">
                        <div className="flex items-center justify-start gap-1">
                          <span
                            className="inline-flex h-5 items-center justify-center whitespace-nowrap rounded-4xl bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-900/40 dark:text-red-300"
                          >
                            {formatCurrency(totalAdvances)}
                          </span>
                          {totalAdvances > 0 && (
                            <Button
                              variant="ghost"
                              size="sm"
                              type="button"
                              onClick={() => handleOpenAdvanceReason(s.id, s.fullName)}
                              className="h-6 px-1 text-primary hover:bg-primary/10"
                              title="پیشاندانی هۆکاری پێشەکی"
                            >
                              <Eye className="h-4 w-4  text-red-600" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="inline-flex h-5 items-center justify-center whitespace-nowrap rounded-4xl bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-900/40 dark:text-green-300">
                          {formatCurrency(remainingSalary)}
                        </span>
                      </TableCell>
                      <TableCell className={`${mobileTd} text-center`}>
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEditStaff(s)}
                            className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900"
                          >
                            <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleAskDeleteStaff(s.id, s.fullName)}
                            disabled={deleteStaffMutation.isPending}
                            className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900"
                          >
                            {deleteStaffMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Trash2 className="h-4 w-4" />
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination Controls */}
        <div className="border-t border-border/40 bg-primary/2">
          <Pagination
            currentPage={page}
            totalPages={totalPages}
            pageSize={pageSize}
            onPageChange={handlePageChange}
            onPageSizeChange={handlePageSizeChange}
            isLoading={staffLoading}
            pageSizeOptions={[5, 10, 20, 50]}
          />
        </div>
      </div>

      {/* Advance Reason Dialog */}
      <Dialog open={openAdvanceReasonDialog} onOpenChange={setOpenAdvanceReasonDialog}>
        <DialogContent className={mobileDialogContentWide} dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-center">هۆکاری پێشەکی</DialogTitle>
            <DialogDescription className="text-center">
              {selectedStaffName ? `تێبینییەکانی ${selectedStaffName}` : 'تێبینی پێشەکی'}
            </DialogDescription>
          </DialogHeader>

          <div className="max-h-72 space-y-3 overflow-y-auto">
            {selectedAdvanceDetails.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground">هیچ پێشەکییەک بەم مانگە تۆمار نەکراوە.</p>
            ) : (
              selectedAdvanceDetails.map((item) => (
                <div
                  key={item.id}
                  className="rounded-lg border border-border/60 bg-muted/30 p-3"
                >
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-xs font-semibold text-red-700 dark:text-red-300 flex items-center gap-1.5">
                      {formatCurrency(item.amount)}
                      {item.pending_sync && (
                        <span className="inline-flex h-3.5 items-center justify-center rounded bg-amber-50 px-1 text-[8px] font-bold text-amber-600 border border-amber-200/40">
                          لە چاوەڕوانیدا
                        </span>
                      )}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {new Date(item.date).toLocaleDateString('ku-IQ')}
                    </span>
                  </div>
                  <p className="text-sm text-foreground/90">
                    {item.note?.trim() ? item.note : 'هیچ تێبینییەک نەنووسراوە.'}
                  </p>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Close Month Confirmation Dialog */}
      <Dialog
        open={openCloseMonthDialog}
        onOpenChange={(open) => {
          if (!closeMonthMutation.isPending) setOpenCloseMonthDialog(open);
        }}
      >
        <DialogContent className={mobileDialogContent} dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-center">کۆتایی پێهێنان بە مانگەکە</DialogTitle>
            <DialogDescription className="text-center">
              ئایا دڵنیایت کە دەتەوێت مانگی {formatMonthYearLabel(selectedMonth, selectedYear)} کۆتایی بهێنیت؟
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-primary/20 dark:border-primary/30 bg-primary/5 dark:bg-primary/10 p-4 text-sm text-primary/90 dark:text-primary/80 space-y-1">
            <p className="font-semibold">• ڕاپۆرتی مانگانە پاشەکەوت دەکرێت</p>
            <p>• کۆی پێشەکییەکان و موچەکان سفر دەبێتەوە</p>
            <p>• داتاکان بۆ بەشی ڕاپۆرتەکان دەمێنێتەوە</p>
          </div>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              onClick={async () => {
                const monthToClose = selectedMonth;
                const yearToClose = selectedYear;
                const monthKeyToClose = `${String(monthToClose).padStart(2, '0')}-${yearToClose}`;

                try {
                  await closeMonthMutation.mutateAsync(monthKeyToClose);
                } catch {
                  return;
                }
                const payRes = await fetch('/api/payroll', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ action: 'payAll', monthKey: monthKeyToClose }),
                });
                if (!payRes.ok) {
                  notifyActionError('هەڵە لە نوێکردنەوەی دۆخی پارەدان');
                  return;
                }
                const next = getNextMonthYear(monthToClose, yearToClose);
                setSelectedMonth(next.month);
                setSelectedYear(next.year);
                setAvailableYears((years) => Array.from(new Set([...years, next.year])).sort((a, b) => b - a));

                await queryClient.invalidateQueries({ queryKey: ['monthly-records'] });
                await refreshAvailableYears();
                setOpenCloseMonthDialog(false);
                notifyMonthClosed();
              }}
              disabled={closeMonthMutation.isPending}
              className="flex-1 bg-primary hover:shadow-lg hover:shadow-primary/30 active:scale-95 active:shadow-inner text-white font-semibold transition-all duration-150"
            >
              {closeMonthMutation.isPending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
              بەڵێ ، مانگ کۆتایی بهێنە
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenCloseMonthDialog(false)}
              disabled={closeMonthMutation.isPending}
              className="flex-1"
            >
              پاشگەزبوونەوە
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Staff Confirmation Dialog */}
      <Dialog
        open={openDeleteStaffDialog}
        onOpenChange={(open) => {
          setOpenDeleteStaffDialog(open);
          if (!open) {
            setDeletingStaffId(null);
            setDeletingStaffName('');
          }
        }}
      >
        <DialogContent className={mobileDialogContent} dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-center">دڵنیابوونەوە</DialogTitle>
            <DialogDescription className="text-center">
              {deletingStaffName
                ? `ئایا دڵنیایت لە سڕینەوەی ${deletingStaffName}؟`
                : 'ئایا دڵنیایت لە سڕینەوەی ئەم کارمەندە؟'}
            </DialogDescription>
          </DialogHeader>

          <div className="flex gap-2 pt-2">
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDeleteStaff}
              disabled={deleteStaffMutation.isPending}
              className="flex-1"
            >
              {deleteStaffMutation.isPending ? <Loader2 className="ml-2 h-4 w-4 animate-spin" /> : null}
              بەڵێ ، بیسڕەوە
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpenDeleteStaffDialog(false)}
              className="flex-1"
            >
              پاشگەزبوونەوە
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Staff Dialog */}
      <Dialog open={openAddStaffDialog} onOpenChange={setOpenAddStaffDialog}>
        <DialogContent className={mobileDialogContentWide} dir="rtl">
          <DialogHeader>
            <DialogTitle className='text-center'>زیادکردنی کارمەند نوێ</DialogTitle>
          
          </DialogHeader>

          <form onSubmit={handleAddStaff} className="space-y-4">
            <div className="space-y-3">
              <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:col-span-1">
                  ناوی کارمەند *
                </label>
                <Input
                  className="sm:col-span-2"
                  placeholder="ناوی کارمەند"
                  value={staffFormData.fullName}
                  onChange={(e) =>
                    setStaffFormData({ ...staffFormData, fullName: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:col-span-1">
                  پلەی کارمەند *
                </label>
                <Input
                  className="sm:col-span-2"
                  placeholder="بۆ نموونە: پەرستار"
                  value={staffFormData.role}
                  onChange={(e) => setStaffFormData({ ...staffFormData, role: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:col-span-1">
                  ژمارە تەلەفۆن *
                </label>
                <Input
                  className="sm:col-span-2"
                  placeholder="ژمارە تەلەفۆن"
                  value={staffFormData.phonenumber}
                  onChange={(e) =>
                    setStaffFormData({ ...staffFormData, phonenumber: e.target.value })
                  }
                  required
                />
              </div>

              <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:col-span-1">
                  مووچەی بنەڕەتی
                </label>
                <Input
                  className="sm:col-span-2"
                  type="text"
                  inputMode="numeric"
                  placeholder="مووچەی بنەڕەتی"
                  value={formatInputValue(staffFormData.basicSalary)}
                  onChange={(e) => {
                    const numericValue = e.target.value.replace(/[^0-9.]/g, '');
                    setStaffFormData({ ...staffFormData, basicSalary: numericValue });
                  }}
                />
              </div>

              <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:col-span-1">
                  تەمەنی کارمەند
                </label>
                <Input
                  className="sm:col-span-2"
                  type="number"
                  placeholder="تەمەنی کارمەند"
                  value={staffFormData.age}
                  onChange={(e) => setStaffFormData({ ...staffFormData, age: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:col-span-1">
                  ناونیشان
                </label>
                <Input
                  className="sm:col-span-2"
                  placeholder="ناونیشان"
                  value={staffFormData.address}
                  onChange={(e) => setStaffFormData({ ...staffFormData, address: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:col-span-1">
                  بارودۆخ
                </label>
                <div className="sm:col-span-2">
                  <Select
                    value={staffFormData.status}
                    onValueChange={(value) =>
                      setStaffFormData({ ...staffFormData, status: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      <SelectItem value="Active">چالاک</SelectItem>
                      <SelectItem value="Inactive">ناچالاک</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={submitting || addStaffMutation.isPending}
                className="flex-1 bg-primary hover:shadow-lg hover:shadow-primary/30 text-white font-semibold"
              >
                {submitting || addStaffMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                زیادکردن
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenAddStaffDialog(false)}
              >
                داخستن
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Edit Staff Dialog */}
      <Dialog open={openEditStaffDialog} onOpenChange={setOpenEditStaffDialog}>
        <DialogContent className={mobileDialogContentWide} dir="rtl">
          <DialogHeader>
            <DialogTitle className='text-center'>دەستکاریکردنی زانیاری کارمەند</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleEditStaff} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                ناوی کارمەند *
              </label>
              <Input
                placeholder="ناوی کارمەند"
                value={editFormData.fullName}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, fullName: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                پلەی کارمەند *
              </label>
              <Input
                placeholder="بۆ نموونە: پەرستار"
                value={editFormData.role}
                onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                ژمارە تەلەفۆن *
              </label>
              <Input
                placeholder="ژمارە تەلەفۆن"
                value={editFormData.phonenumber}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, phonenumber: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                مووچەی بنەڕەتی
              </label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="مووچەی بنەڕەتی"
                value={formatInputValue(editFormData.basicSalary)}
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/[^0-9.]/g, '');
                  setEditFormData({ ...editFormData, basicSalary: numericValue });
                }}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                تەمەنی کارمەند
              </label>
              <Input
                type="number"
                placeholder="تەمەنی کارمەند"
                value={editFormData.age}
                onChange={(e) => setEditFormData({ ...editFormData, age: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                ناونیشان
              </label>
              <Input
                placeholder="ناونیشان"
                value={editFormData.address}
                onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                بارودۆخ
              </label>
              <Select
                value={editFormData.status}
                onValueChange={(value) =>
                  setEditFormData({ ...editFormData, status: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  <SelectItem value="Active">چالاک</SelectItem>
                  <SelectItem value="Inactive">ناچالاک</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={submitting || updateStaffMutation.isPending}
                className="flex-1 bg-primary hover:shadow-lg hover:shadow-primary/30 text-white font-semibold"
              >
                {submitting || updateStaffMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                نوێکردنەوە
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenEditStaffDialog(false)}
              >
                داخستن
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Add Advance Dialog */}
      <Dialog open={openAddAdvanceDialog} onOpenChange={setOpenAddAdvanceDialog}>
        <DialogContent className={mobileDialogContentWide} dir="rtl">
          <DialogHeader>
            <DialogTitle className='text-center'> وەرگرتنی پێشەکی </DialogTitle>
           
          </DialogHeader>

          <form onSubmit={handleAddAdvance} className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                کارمەند *
              </label>
              <Select
                value={advanceFormData.staffId}
                onValueChange={(value) =>
                  setAdvanceFormData({ ...advanceFormData, staffId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder=" ناوی کارمەند دیاری بکە" />
                </SelectTrigger>
                <SelectContent dir="rtl">
                  {staff.map((s) => (
                    <SelectItem key={s.id} value={s.id.toString()}>
                      {s.fullName} - {s.role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                بڕی پارە *
              </label>
              <Input
                type="text"
                inputMode="numeric"
                placeholder="بڕی پارە"
                value={formatInputValue(advanceFormData.amount)}
                onChange={(e) => {
                  const numericValue = e.target.value.replace(/[^0-9.]/g, '');
                  setAdvanceFormData({ ...advanceFormData, amount: numericValue });
                }}
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                بەروار *
              </label>
              <Input
                type="date"
                value={advanceFormData.date}
                onChange={(e) =>
                  setAdvanceFormData({ ...advanceFormData, date: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                تێبینی
              </label>
              <Input
                placeholder="تێبینی ( بۆ نموونە : بۆ کاری پێویست )"
                value={advanceFormData.note}
                onChange={(e) =>
                  setAdvanceFormData({ ...advanceFormData, note: e.target.value })
                }
              />
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={submitting || addTransactionMutation.isPending}
                className="flex-1 bg-primary hover:shadow-lg hover:shadow-primary/30 text-white font-semibold"
              >
                {submitting || addTransactionMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                تۆمارکردن
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenAddAdvanceDialog(false)}
              >
                داخستن
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardPageShell>
  );
}

export default function StaffPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center" dir="rtl">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      }
    >
      <StaffPageContent />
    </Suspense>
  );
}
