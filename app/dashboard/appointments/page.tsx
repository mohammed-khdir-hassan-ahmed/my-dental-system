'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  notifyPatientAdded,
  notifyPatientUpdated,
  notifyPatientDeleted,
  notifyActionError,
} from '@/lib/notify';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { getOfflineQueue, addToOfflineQueue } from '@/lib/offline-sync';
import { toast } from '@/lib/toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2, Pencil, User, Calendar, TrendingUp, DollarSign, AlertCircle, Smile } from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';
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
  mobileSelectTrigger,
  mobileBtn,
} from '@/components/dashboard-page-shell';
import { MobileListToolbar, MobileCustomDateRange } from '@/components/mobile-list-toolbar';
import { DentalChart, type TeethMap } from '@/components/dental-chart';

interface Appointment {
  id: number;
  name: string;
  gender: string;
  phone: string;
  age: number;
  treatmentType: string;
  appointmentDate: string;
  money?: string | number;
  pending_sync?: boolean;
  teethData?: string;
}

interface FormData {
  name: string;
  gender: string;
  phone: string;
  age: string;
  treatmentType: string;
  appointmentDate: string;
  money: string;
  teethData?: TeethMap;
}

const getTreatmentColor = (treatmentType: string) => {
  const colorMap: { [key: string]: { border: string; title: string; value: string; icon: string } } = {
    'شۆردنی دندان': {
      border: 'border-blue-500',
      title: 'text-blue-600 dark:text-blue-400',
      value: 'text-blue-900 dark:text-blue-100',
      icon: 'text-blue-500',
    },
    'تەلی ددان': {
      border: 'border-red-500',
      title: 'text-red-600 dark:text-red-400',
      value: 'text-red-900 dark:text-red-100',
      icon: 'text-red-500',
    },
    'پڕکردنەوەی ددان': {
      border: 'border-green-500',
      title: 'text-green-600 dark:text-green-400',
      value: 'text-green-900 dark:text-green-100',
      icon: 'text-green-500',
    },
    'هەڵقەندنی دندان': {
      border: 'border-purple-500',
      title: 'text-purple-600 dark:text-purple-400',
      value: 'text-purple-900 dark:text-purple-100',
      icon: 'text-purple-500',
    },
    'هی تر': {
      border: 'border-gray-500',
      title: 'text-gray-600 dark:text-gray-400',
      value: 'text-gray-900 dark:text-gray-100',
      icon: 'text-gray-500',
    },
  };

  return colorMap[treatmentType] || {
    border: 'border-primary',
    title: 'text-primary',
    value: 'text-primary',
    icon: 'text-primary',
  };
};

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timePeriod, setTimePeriod] = useState<'month' | 'week' | 'today' | 'all' | 'custom'>('today');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingAppointment, setEditingAppointment] = useState<Appointment | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    gender: '',
    phone: '',
    age: '',
    treatmentType: '',
    appointmentDate: '',
    money: '',
    teethData: undefined,
  });

  const [viewChartAppointment, setViewChartAppointment] = useState<Appointment | null>(null);

  const [paginationPage, setPaginationPage] = useState(1);
  const [paginationPageSize, setPaginationPageSize] = useState(10);
  const [queueVersion, setQueueVersion] = useState(0);
  const [offlineItems, setOfflineItems] = useState<Appointment[]>([]);

  useEffect(() => {
    const handleQueueChange = () => setQueueVersion(v => v + 1);
    window.addEventListener('offline-queue-changed', handleQueueChange);
    window.addEventListener('offline-sync-complete', fetchAppointments);
    return () => {
      window.removeEventListener('offline-queue-changed', handleQueueChange);
      window.removeEventListener('offline-sync-complete', fetchAppointments);
    };
  }, []);

  useEffect(() => {
    const items = getOfflineQueue()
      .filter((item) => item.type === 'appointment' && item.action === 'create')
      .map((item) => ({
        id: item.id as any,
        name: item.body.name,
        gender: item.body.gender,
        phone: item.body.phone,
        age: item.body.age,
        treatmentType: item.body.treatmentType,
        appointmentDate: item.body.appointmentDate,
        money: item.body.money,
        teethData: item.body.teethData ? JSON.stringify(item.body.teethData) : undefined,
        pending_sync: true,
      }));
    setOfflineItems(items);
  }, [queueVersion]);

  // Memoized calculations - must be called before any conditional logic
  const mergedAppointments = useMemo(() => {
    return [...offlineItems, ...appointments];
  }, [appointments, offlineItems]);

  const filteredAppointments = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return mergedAppointments.filter((appointment) => {
      return (
        appointment.name.toLowerCase().includes(searchLower) ||
        (appointment.phone || '').toLowerCase().includes(searchLower) ||
        appointment.gender.toLowerCase().includes(searchLower) ||
        appointment.treatmentType.toLowerCase().includes(searchLower)
      );
    });
  }, [mergedAppointments, searchTerm]);

  const totalPages = useMemo(() => Math.ceil(filteredAppointments.length / paginationPageSize) || 1, [filteredAppointments.length, paginationPageSize]);
  const startIndex = useMemo(() => (paginationPage - 1) * paginationPageSize, [paginationPage, paginationPageSize]);
  const endIndex = useMemo(() => startIndex + paginationPageSize, [startIndex, paginationPageSize]);

  const paginatedAppointments = useMemo(() => {
    return filteredAppointments.slice(startIndex, endIndex);
  }, [filteredAppointments, startIndex, endIndex]);

  const treatmentStats = useMemo(() => {
    return mergedAppointments.reduce((acc, appointment) => {
      const existing = acc.find(item => item.treatmentType === appointment.treatmentType);
      if (existing) {
        existing.count += 1;
        existing.totalMoney += parseFloat(String(appointment.money || 0));
      } else {
        acc.push({ 
          treatmentType: appointment.treatmentType, 
          count: 1,
          totalMoney: parseFloat(String(appointment.money || 0))
        });
      }
      return acc;
    }, [] as Array<{ treatmentType: string; count: number; totalMoney: number }>);
  }, [mergedAppointments]);

  const totalMoney = useMemo(() => {
    return mergedAppointments.reduce((sum, appointment) => {
      return sum + parseFloat(String(appointment.money || 0));
    }, 0);
  }, [mergedAppointments]);

  const fetchAppointments = async () => {
    try {
      let url = '/api/appointments';
      const params = new URLSearchParams();
      
      if (timePeriod === 'custom' && customStartDate && customEndDate) {
        params.set('from', customStartDate);
        params.set('to', customEndDate);
      } else if (timePeriod !== 'custom') {
        params.set('period', timePeriod);
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error('بڕگە ڕانەگێڕاندن');
      }
      const data = await response.json();
      setAppointments(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'هەڵەیەک ڕویدا';
      setError(message);
      notifyActionError(message, 'هێنانی نەخۆشەکان');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, [timePeriod, customStartDate, customEndDate]);

  const handleAddAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingAppointment ? '/api/appointments' : '/api/appointments';
      const method = editingAppointment ? 'PUT' : 'POST';
      
      const body = editingAppointment 
        ? {
            id: editingAppointment.id,
            name: formData.name,
            gender: formData.gender,
            phone: formData.phone,
            age: parseInt(formData.age),
            treatmentType: formData.treatmentType,
            appointmentDate: formData.appointmentDate,
            money: formData.money ? parseFloat(formData.money) : 0,
            teethData: formData.teethData,
          }
        : {
            name: formData.name,
            gender: formData.gender,
            phone: formData.phone,
            age: parseInt(formData.age),
            treatmentType: formData.treatmentType,
            appointmentDate: formData.appointmentDate,
            money: formData.money ? parseFloat(formData.money) : 0,
            teethData: formData.teethData,
          };

      if (!navigator.onLine) {
        addToOfflineQueue('appointment', editingAppointment ? 'update' : 'create', url, method, body);
        toast.success("داتاکان بە شێوازی ئۆفلایین پاشکەوت کران");
        setOpenDialog(false);
        setEditingAppointment(null);
        setFormData({
          name: '',
          gender: '',
          phone: '',
          age: '',
          treatmentType: '',
          appointmentDate: '',
          money: '',
        });
        setSubmitting(false);
        return;
      }

      let response;
      try {
        response = await fetch(url, {
          method,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } catch (fetchErr) {
        addToOfflineQueue('appointment', editingAppointment ? 'update' : 'create', url, method, body);
        toast.success("داتاکان بە شێوازی ئۆفلایین پاشکەوت کران");
        setOpenDialog(false);
        setEditingAppointment(null);
        setFormData({
          name: '',
          gender: '',
          phone: '',
          age: '',
          treatmentType: '',
          appointmentDate: '',
          money: '',
        });
        setSubmitting(false);
        return;
      }

      if (!response.ok) {
        if (response.status >= 500) {
          addToOfflineQueue('appointment', editingAppointment ? 'update' : 'create', url, method, body);
          toast.success("داتاکان بە شێوازی ئۆفلایین پاشکەوت کران");
          setOpenDialog(false);
          setEditingAppointment(null);
          setFormData({
            name: '',
            gender: '',
            phone: '',
            age: '',
            treatmentType: '',
            appointmentDate: '',
            money: '',
          });
          setSubmitting(false);
          return;
        }
        throw new Error(editingAppointment ? 'وەک نەتوانیت نەخۆشی نوێبکەیتەوە' : 'وەک نەتوانیت نەخۆشی زیادبکە');
      }

      await fetchAppointments();

      if (editingAppointment) {
        notifyPatientUpdated(formData.name);
      } else {
        notifyPatientAdded(formData.name, formData.treatmentType);
      }
      
      setOpenDialog(false);
      setEditingAppointment(null);
      setFormData({
        name: '',
        gender: '',
        phone: '',
        age: '',
        treatmentType: '',
        appointmentDate: '',
        money: '',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'هەڵەیەک ڕویدا';
      setError(message);
      notifyActionError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditAppointment = (appointment: Appointment) => {
    setEditingAppointment(appointment);
    let parsedTeethData: TeethMap | undefined = undefined;
    try {
      if (appointment.teethData) {
        parsedTeethData = JSON.parse(appointment.teethData);
      }
    } catch (e) {
      parsedTeethData = undefined;
    }
    setFormData({
      name: appointment.name,
      gender: appointment.gender,
      phone: appointment.phone,
      age: appointment.age.toString(),
      treatmentType: appointment.treatmentType,
      appointmentDate: appointment.appointmentDate,
      money: appointment.money?.toString() || '',
      teethData: parsedTeethData,
    });
    setOpenDialog(true);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleDeleteAppointment = async (id: number) => {
    setDeleting(true);
    const deleted = appointments.find((a) => a.id === id);
    try {
      const response = await fetch(`/api/appointments?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('وەک نەتوانیت نەخۆشی بسڕە');
      }

      if (deleted?.name) {
        notifyPatientDeleted(deleted.name);
      } else {
        notifyPatientDeleted('نەخۆش');
      }

      await fetchAppointments();
      setDeleteConfirm(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'هەڵەیەک ڕویدا';
      setError(message);
      notifyActionError(message);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">تکایە جاوەێکە...</p>
        </div>
      </div>
    );
  }

  // Pagination handlers
  const handlePageChange = (newPage: number) => {
    setPaginationPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPaginationPageSize(newPageSize);
    setPaginationPage(1);
  };

  return (
    <DashboardPageShell>
      {error && (
        <div className={`${mobileInset} rounded-lg border border-destructive/50 bg-destructive/10 p-3 sm:p-4 text-destructive flex items-start gap-3`}>
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <span className="text-sm sm:text-base">{error}</span>
        </div>
      )}

      {/* Treatment Statistics Summary - Card Grid */}
      {(treatmentStats.length > 0 || totalMoney > 0) && (
        <div className={`${mobileStatsGrid} ${mobileInset}`}>
          {/* Total Money Card */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 rounded-2xl group-hover:opacity-100 transition duration-300" />
            <div className="relative bg-emerald-50 dark:bg-slate-900 rounded-xl sm:rounded-2xl p-3 sm:p-5 transition-all duration-300 group-hover:shadow-lg border border-transparent hover:border-emerald-200 dark:hover:border-slate-600 h-full">
              <div className="flex items-start justify-between mb-2 sm:mb-4">
                <div className="p-2 sm:p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-lg sm:rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <DollarSign className="size-4 sm:size-6 text-white" />
                </div>
                <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                  داهات
                </div>
              </div>
              <p className="text-[11px] sm:text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">داهاتی ئەمڕۆ</p>
              <h3 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white mb-2 sm:mb-4">{totalMoney.toLocaleString('en-US')} هەزار</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-1.5 sm:p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                    <Calendar className="size-3 sm:size-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                    <span className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 truncate">دانیشتەکان</span>
                  </div>
                  <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">{mergedAppointments.length}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Treatment Type Cards */}
          {treatmentStats.map((stat) => {
            const colors = getTreatmentColor(stat.treatmentType);
            const gradientColors = {
              'شۆردنی دندان': 'from-blue-500 to-indigo-500',
              'تەلی ددان': 'from-red-500 to-pink-500',
              'پڕکردنەوەی ددان': 'from-green-500 to-emerald-500',
              'هەڵقەندنی دندان': 'from-purple-500 to-violet-500',
              'هی تر': 'from-gray-500 to-slate-500',
            };
            const bgColors = {
              'شۆردنی دندان': 'bg-blue-50 dark:bg-slate-900',
              'تەلی ددان': 'bg-rose-50 dark:bg-slate-900',
              'پڕکردنەوەی ددان': 'bg-green-50 dark:bg-slate-900',
              'هەڵقەندنی دندان': 'bg-purple-50 dark:bg-slate-900',
              'هی تر': 'bg-gray-50 dark:bg-slate-900',
            };
            const badgeColors = {
              'شۆردنی دندان': 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
              'تەلی ددان': 'bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400',
              'پڕکردنەوەی ددان': 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400',
              'هەڵقەندنی دندان': 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
              'هی تر': 'bg-gray-100 dark:bg-gray-900/30 text-gray-600 dark:text-gray-400',
            };
            const hoverBorder = {
              'شۆردنی دندان': 'hover:border-blue-200',
              'تەلی ددان': 'hover:border-rose-200',
              'پڕکردنەوەی ددان': 'hover:border-green-200',
              'هەڵقەندنی دندان': 'hover:border-purple-200',
              'هی تر': 'hover:border-gray-200',
            };

            return (
              <div key={stat.treatmentType} className="relative group h-full">
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${gradientColors[stat.treatmentType] || 'from-gray-500 to-slate-500'} opacity-0 rounded-2xl group-hover:opacity-100 transition duration-300`} />
                <div className={`relative h-full ${bgColors[stat.treatmentType] || 'bg-gray-50 dark:bg-slate-900'} rounded-xl sm:rounded-2xl p-3 sm:p-5 transition-all duration-300 group-hover:shadow-lg border border-transparent ${hoverBorder[stat.treatmentType] || ''} dark:hover:border-slate-600`}>
                  <div className="flex items-start justify-between mb-2 sm:mb-4">
                    <div className={`p-2 sm:p-3 bg-gradient-to-r ${gradientColors[stat.treatmentType] || 'from-gray-500 to-slate-500'} rounded-lg sm:rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <User className="size-4 sm:size-6 text-white" />
                    </div>
                    <div className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-bold ${badgeColors[stat.treatmentType] || ''}`}>
                      {stat.count}
                    </div>
                  </div>
                  <p className="text-[11px] sm:text-sm font-medium text-slate-600 dark:text-slate-400 mb-1 line-clamp-2 leading-tight">{stat.treatmentType}</p>
                  <h3 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white mb-2 sm:mb-4">{stat.totalMoney.toLocaleString('en-US')} هەزار</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-1.5 sm:p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <div className="flex items-center gap-1.5 sm:gap-2 min-w-0">
                        <User className="size-3 sm:size-3.5 text-slate-500 dark:text-slate-400 shrink-0" />
                        <span className="text-[10px] sm:text-xs text-slate-600 dark:text-slate-400 truncate">دانیشتەکان</span>
                      </div>
                      <span className="text-xs sm:text-sm font-semibold text-slate-900 dark:text-white">{stat.count}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
      <MobileListToolbar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        searchPlaceholder="گەڕان..."
        filterSlot={
          <Select value={timePeriod} onValueChange={(value: 'month' | 'week' | 'today' | 'all' | 'custom') => setTimePeriod(value)}>
            <SelectTrigger className={`flex-1 min-w-[120px] sm:flex-none sm:w-auto ${mobileSelectTrigger}`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">ئەم مانگە</SelectItem>
              <SelectItem value="week">ئەم حەفتەیە</SelectItem>
              <SelectItem value="today">ئەمڕۆ</SelectItem>
              <SelectItem value="all">سەرجەم</SelectItem>
              <SelectItem value="custom">بەرواری تایبەت</SelectItem>
            </SelectContent>
          </Select>
        }
        customDateSlot={
          timePeriod === 'custom' ? (
            <MobileCustomDateRange
              startDate={customStartDate}
              endDate={customEndDate}
              onStartChange={setCustomStartDate}
              onEndChange={setCustomEndDate}
            />
          ) : null
        }
        actionSlot={
          <Button
            onClick={() => setOpenDialog(true)}
            className={`flex-1 sm:flex-none bg-primary hover:shadow-lg hover:shadow-primary/30 gap-1.5 text-white font-semibold px-3 sm:px-4 whitespace-nowrap ${mobileBtn}`}
          >
            زیادکردنی نەخۆش
            <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Button>
        }
      />

      {/* Table - full width edge to edge on mobile */}
      <div className={mobileTableShell}>
        <div className={mobileTableScroll}>
        <Table className={mobileTableMin}>
          <TableHeader className="bg-primary/5 border-b border-border/40">
            <TableRow className="hover:bg-primary/2 transition-colors">
              <TableHead className={mobileTh}>ناوی نەخۆش</TableHead>
              <TableHead className={mobileTh}>ڕەگەز</TableHead>
              <TableHead className={mobileTh}>ژ.تەلەفۆن</TableHead>
              <TableHead className={mobileTh}>تەمەن</TableHead>
              <TableHead className={mobileTh}>جۆری چارەسەری</TableHead>
              <TableHead className={mobileTh}>بەروار</TableHead>
              <TableHead className={mobileTh}>بڕی پارە</TableHead>
              <TableHead className={`${mobileTh} text-center`}>چارتی ددان</TableHead>
              <TableHead className={`${mobileTh} text-center`}>کردار</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedAppointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground hover:bg-transparent">
                  <div className="flex flex-col items-center gap-2">
                    <User className="w-12 h-12 opacity-30 mx-auto" />
                    <span className="text-sm sm:text-lg">{searchTerm ? 'هیچ نەخۆشێک نەدۆزرایەوە !' : 'هیچ چاوپێکەوتن نیە'}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedAppointments.map((appointment, index) => (
                <TableRow 
                  key={appointment.id}
                  className={`transition-all duration-200 border-b border-gray-100 dark:border-gray-800 ${
                    index % 2 === 0 
                      ? 'bg-white dark:bg-slate-950' 
                      : 'bg-primary/2 dark:bg-slate-900/30'
                  } hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors`}
                >
                  <TableCell className={mobileTdPrimary}>
                    <div className="flex items-center gap-2">
                      <span>{appointment.name}</span>
                      {appointment.pending_sync && (
                        <span className="inline-flex h-4 items-center justify-center rounded bg-amber-50 px-1.5 text-[9px] font-bold text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/40 shrink-0">
                          <span className="h-1 w-1 rounded-full bg-amber-500 animate-pulse mr-1" />
                          لە چاوەڕوانیدا
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className={mobileTd}>{appointment.gender}</TableCell>
                  <TableCell className={mobileTd}>{appointment.phone || '-'}</TableCell>
                  <TableCell className={mobileTd}>{appointment.age}</TableCell>
                  <TableCell className={`${mobileTd} max-w-[90px] sm:max-w-none truncate`}>{appointment.treatmentType}</TableCell>
                  <TableCell className={mobileTd}>
                    {new Date(appointment.appointmentDate).toLocaleDateString('ku-IQ', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit'
                    })}
                  </TableCell>
                  <TableCell className={`${mobileTd} text-foreground/70`}>
                    {appointment.money ? (
                      <span className="inline-flex h-5 items-center justify-center whitespace-nowrap rounded-4xl bg-green-100 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-green-800 dark:bg-green-900/40 dark:text-green-300">
                        {`${parseFloat(String(appointment.money)).toLocaleString('en-US')} هەزار`}
                      </span>
                    ) : (
                      <span className="inline-flex h-5 items-center justify-center whitespace-nowrap rounded-4xl bg-gray-100 px-1.5 sm:px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        -
                      </span>
                    )}
                  </TableCell>
                  <TableCell className={`${mobileTd} text-center`}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setViewChartAppointment(appointment)}
                      className="h-8 w-8 p-0 text-teal-600 hover:bg-teal-50 hover:text-teal-700 dark:hover:bg-teal-900"
                      title="چارتی ددان"
                    >
                      <Smile className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </Button>
                  </TableCell>
                  <TableCell className={`${mobileTd} text-center`}>
                    <div className="flex items-center justify-center gap-0.5 sm:gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditAppointment(appointment)}
                        className="h-8 w-8 p-0 text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900"
                        title="دەستکاریکردن"
                      >
                        <Pencil className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirm(appointment.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900"
                        title="سڕینەوە"
                      >
                        <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        </div>
      </div>

      {/* Pagination */}
      <div className="w-full border-t md:border border-border/40 bg-card md:bg-primary/2 md:rounded-xl px-2 sm:px-0">
        <Pagination
          currentPage={paginationPage}
          totalPages={totalPages}
          pageSize={paginationPageSize}
          onPageChange={handlePageChange}
          onPageSizeChange={handlePageSizeChange}
          isLoading={loading}
          pageSizeOptions={[5, 10, 20, 50]}
        />
      </div>

      {/* Add Patient Dialog */}
      <Dialog open={openDialog} onOpenChange={(open) => {
        setOpenDialog(open);
        if (!open) {
          setEditingAppointment(null);
          setFormData({
            name: '',
            gender: '',
            phone: '',
            age: '',
            treatmentType: '',
            appointmentDate: '',
            money: '',
            teethData: undefined,
          });
        }
      }}>
        <DialogContent dir="rtl" className="w-[calc(100%-2rem)] max-w-[30rem] sm:max-w-6xl p-3 sm:p-8 gap-4 sm:gap-6 max-h-[95vh] overflow-y-auto">
          <DialogHeader className="gap-0.5 sm:gap-2 pb-0">
            <DialogTitle className="text-center text-sm sm:text-base font-bold">
              {editingAppointment ? 'دەستکاریکردنی نەخۆش' : 'زیادکردنی نەخۆش'}
            </DialogTitle>
            <DialogDescription className="text-center text-[11px] sm:text-sm leading-tight">
              {editingAppointment ? 'زانیاریەکان دەستکاری بکە' : 'زانیاریەکانی نەخۆش بنووسە'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddAppointment} className="space-y-3 sm:space-y-5">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Patient Info */}
              <div className="space-y-3 sm:space-y-4 pt-1">
                <div className="space-y-1.5 sm:grid sm:grid-cols-3 sm:items-center sm:gap-3">
                  <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 sm:col-span-1">ناو</label>
                  <Input
                    className="sm:col-span-2 h-10 sm:h-11 text-base sm:text-sm border-2 border-gray-200 dark:border-gray-700 focus:border-primary"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="ناوی نەخۆش"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-1 sm:gap-4">
                  <div className="space-y-1.5 sm:grid sm:grid-cols-3 sm:items-center sm:gap-3">
                    <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 sm:col-span-1">ڕەگەز</label>
                    <div className="sm:col-span-2">
                      <Select value={formData.gender} onValueChange={(value) => handleSelectChange('gender', value)}>
                        <SelectTrigger className="h-10 sm:h-11 text-base sm:text-sm border-2 border-gray-200 dark:border-gray-700 focus:border-primary">
                          <SelectValue placeholder="ڕەگەز" />
                        </SelectTrigger>
                        <SelectContent dir="rtl">
                          <SelectItem value="نێر">نێر</SelectItem>
                          <SelectItem value="مێ">مێ</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="space-y-1.5 sm:grid sm:grid-cols-3 sm:items-center sm:gap-3">
                    <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 sm:col-span-1">تەمەن</label>
                    <Input
                      className="sm:col-span-2 h-10 sm:h-11 text-base sm:text-sm border-2 border-gray-200 dark:border-gray-700 focus:border-primary"
                      name="age"
                      type="number"
                      value={formData.age}
                      onChange={handleInputChange}
                      placeholder="تەمەن"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5 sm:grid sm:grid-cols-3 sm:items-center sm:gap-3">
                  <div className="flex items-center gap-1 sm:col-span-1">
                    <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300">ژ.تەلەفۆن</label>
                    <span className="text-[10px] text-muted-foreground">(ئارەزوومەندانە)</span>
                  </div>
                  <Input
                    className="sm:col-span-2 h-10 sm:h-11 text-base sm:text-sm border-2 border-gray-200 dark:border-gray-700 focus:border-primary"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="07701234567"
                  />
                </div>

                <div className="space-y-1.5 sm:grid sm:grid-cols-3 sm:items-center sm:gap-3">
                  <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 sm:col-span-1">چارەسەر</label>
                  <div className="sm:col-span-2">
                    <Select value={formData.treatmentType} onValueChange={(value) => handleSelectChange('treatmentType', value)}>
                      <SelectTrigger className="h-10 sm:h-11 text-base sm:text-sm border-2 border-gray-200 dark:border-gray-700 focus:border-primary">
                        <SelectValue placeholder="جۆری چارەسەر" />
                      </SelectTrigger>
                      <SelectContent dir="rtl">
                        <SelectItem value="شۆردنی دندان">شۆردنی ددان</SelectItem>
                        <SelectItem value="تەلی ددان"> تەلی ددان</SelectItem>
                        <SelectItem value="پڕکردنەوەی ددان"> پڕکردنەوەی ددان</SelectItem>
                        <SelectItem value=" ‌هەڵقەندنی ددان"> ‌هەڵقەندنی ددان </SelectItem>
                        <SelectItem value="هی تر">  هی تر </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-1 sm:gap-4">
                  <div className="space-y-1.5 sm:grid sm:grid-cols-3 sm:items-center sm:gap-3">
                    <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 sm:col-span-1">بەروار</label>
                    <Input
                      className="sm:col-span-2 h-10 sm:h-11 text-base sm:text-sm border-2 border-gray-200 dark:border-gray-700 focus:border-primary"
                      name="appointmentDate"
                      type="date"
                      value={formData.appointmentDate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="space-y-1.5 sm:grid sm:grid-cols-3 sm:items-center sm:gap-3">
                    <label className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 sm:col-span-1">پارە</label>
                    <Input
                      className="sm:col-span-2 h-10 sm:h-11 text-base sm:text-sm border-2 border-gray-200 dark:border-gray-700 focus:border-primary"
                      name="money"
                      type="text"
                      inputMode="numeric"
                      value={formData.money ? Number(formData.money).toLocaleString('en-US') : ''}
                      onChange={(e) => {
                        const rawValue = e.target.value.replace(/,/g, '');
                        if (rawValue === '' || /^\d*\.?\d*$/.test(rawValue)) {
                          handleInputChange({ target: { name: 'money', value: rawValue } } as React.ChangeEvent<HTMLInputElement>);
                        }
                      }}
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Dental Chart */}
              <div className="border-t lg:border-t-0 lg:border-l border-border/50 pt-3 lg:pt-0 lg:pl-5">
                <DentalChart
                  value={formData.teethData || {}}
                  onChange={(newTeethData) => setFormData(prev => ({ ...prev, teethData: newTeethData }))}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2 sm:pt-4">
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 h-9 sm:h-10 text-xs sm:text-sm bg-primary hover:shadow-lg hover:shadow-primary/30 text-white font-semibold"
              >
                {submitting ? 'چاوەڕوانبە...' : editingAppointment ? 'نوێکردنەوە' : 'زیادکردن'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenDialog(false)}
                className="h-9 sm:h-10 text-xs sm:text-sm px-3 sm:px-4"
              >
                داخستن
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Dental Chart Dialog */}
      <Dialog open={viewChartAppointment !== null} onOpenChange={(open) => {
        if (!open) setViewChartAppointment(null);
      }}>
        <DialogContent dir="rtl" className="w-[calc(100%-2rem)] max-w-[30rem] sm:max-w-5xl p-3 sm:p-8 gap-4 sm:gap-6 max-h-[95vh] overflow-y-auto">
          <DialogHeader className="gap-0.5 sm:gap-2 pb-0">
            <DialogTitle className="text-center text-sm sm:text-base font-bold">
              {viewChartAppointment?.name} - چارتی ددان
            </DialogTitle>
          </DialogHeader>
          <div className="py-2">
            {(() => {
              let chartData: TeethMap = {};
              try {
                if (viewChartAppointment?.teethData) {
                  chartData = JSON.parse(viewChartAppointment.teethData);
                }
              } catch (e) {
                chartData = {};
              }
              return (
                <DentalChart
                  value={chartData}
                  onChange={() => {}}
                  readOnly
                />
              );
            })()}
          </div>
          <div className="flex justify-end">
            <Button
              variant="outline"
              onClick={() => setViewChartAppointment(null)}
            >
              داخستن
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirm !== null} onOpenChange={(open) => {
        if (!open) setDeleteConfirm(null);
      }}>
        <DialogContent className="sm:max-w-md">
          <div className="flex flex-col items-center text-center space-y-4">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-destructive/10">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
            </div>
            
            <div className="space-y-2">
              <DialogTitle className="text-destructive text-lg font-bold"> سڕینەوەی نەخۆش </DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                 ئایا دڵنیایت لە سڕینەوەی ئەم نەخۆشە ؟ ئەم کردارە ناگەڕێتەوە.
              </DialogDescription>
            </div>
            
            <div className="w-full p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
              {deleteConfirm !== null && 
                appointments.find(a => a.id === deleteConfirm)?.name && (
                <p className="font-bold text-destructive text-base">
                  {appointments.find(a => a.id === deleteConfirm)?.name}
                </p>
              )}
            </div>
            
            <div className="flex gap-3 w-full pt-2">
              <Button
                variant="outline"
                onClick={() => setDeleteConfirm(null)}
                disabled={deleting}
                className="flex-1"
              >
                داخستن
              </Button>
              <Button
                onClick={() => deleteConfirm && handleDeleteAppointment(deleteConfirm)}
                disabled={deleting}
                className="flex-1 bg-destructive hover:shadow-lg hover:shadow-destructive/30 text-white font-semibold"
              >
                {deleting ? (
                  <>
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                    سڕینەوە
                  </>
                ) : (
                  'سڕینەوە'
                )}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardPageShell>
  );
}
