'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  notifyPatientAdded,
  notifyPatientUpdated,
  notifyPatientDeleted,
  notifyActionError,
} from '@/lib/notify';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Loader2, Plus, Search, Trash2, Pencil, User, Calendar, TrendingUp, DollarSign, AlertCircle } from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/pagination';

interface Appointment {
  id: number;
  name: string;
  gender: string;
  phone: string;
  age: number;
  treatmentType: string;
  appointmentDate: string;
  money?: string | number;
}

interface FormData {
  name: string;
  gender: string;
  phone: string;
  age: string;
  treatmentType: string;
  appointmentDate: string;
  money: string;
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
  });

  const [paginationPage, setPaginationPage] = useState(1);
  const [paginationPageSize, setPaginationPageSize] = useState(10);

  // Memoized calculations - must be called before any conditional logic
  const filteredAppointments = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return appointments.filter((appointment) => {
      return (
        appointment.name.toLowerCase().includes(searchLower) ||
        appointment.phone.toLowerCase().includes(searchLower) ||
        appointment.gender.toLowerCase().includes(searchLower) ||
        appointment.treatmentType.toLowerCase().includes(searchLower)
      );
    });
  }, [appointments, searchTerm]);

  const totalPages = useMemo(() => Math.ceil(filteredAppointments.length / paginationPageSize) || 1, [filteredAppointments.length, paginationPageSize]);
  const startIndex = useMemo(() => (paginationPage - 1) * paginationPageSize, [paginationPage, paginationPageSize]);
  const endIndex = useMemo(() => startIndex + paginationPageSize, [startIndex, paginationPageSize]);

  const paginatedAppointments = useMemo(() => {
    return filteredAppointments.slice(startIndex, endIndex);
  }, [filteredAppointments, startIndex, endIndex]);

  const treatmentStats = useMemo(() => {
    return appointments.reduce((acc, appointment) => {
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
  }, [appointments]);

  const totalMoney = useMemo(() => {
    return appointments.reduce((sum, appointment) => {
      return sum + parseFloat(String(appointment.money || 0));
    }, 0);
  }, [appointments]);

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
            ...formData,
            age: parseInt(formData.age),
            money: formData.money ? parseFloat(formData.money) : 0,
          }
        : {
            ...formData,
            age: parseInt(formData.age),
            money: formData.money ? parseFloat(formData.money) : 0,
          };

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
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
    setFormData({
      name: appointment.name,
      gender: appointment.gender,
      phone: appointment.phone,
      age: appointment.age.toString(),
      treatmentType: appointment.treatmentType,
      appointmentDate: appointment.appointmentDate,
      money: appointment.money?.toString() || '',
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
    <div className="space-y-8">
    

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Treatment Statistics Summary - Card Grid */}
      {(treatmentStats.length > 0 || totalMoney > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {/* Total Money Card */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 rounded-2xl group-hover:opacity-100 transition duration-300" />
            <div className="relative bg-emerald-50 dark:bg-slate-900 rounded-2xl p-5 transition-all duration-300 group-hover:shadow-lg border border-transparent hover:border-emerald-200 dark:hover:border-slate-600">
              <div className="flex items-start justify-between mb-4">
                <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                  <DollarSign className="size-6 text-white" />
                </div>
                <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                  داهات
                </div>
              </div>
              <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">داهاتی ئەمڕۆ</p>
              <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{totalMoney.toLocaleString('en-US')} هەزار</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                  <div className="flex items-center gap-2">
                    <Calendar className="size-3.5 text-slate-500 dark:text-slate-400" />
                    <span className="text-xs text-slate-600 dark:text-slate-400">دانیشتەکان</span>
                  </div>
                  <span className="text-sm font-semibold text-slate-900 dark:text-white">{appointments.length}</span>
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
              <div key={stat.treatmentType} className="relative group">
                <div className={`absolute -inset-0.5 bg-gradient-to-r ${gradientColors[stat.treatmentType] || 'from-gray-500 to-slate-500'} opacity-0 rounded-2xl group-hover:opacity-100 transition duration-300`} />
                <div className={`relative ${bgColors[stat.treatmentType] || 'bg-gray-50 dark:bg-slate-900'} rounded-2xl p-5 transition-all duration-300 group-hover:shadow-lg border border-transparent ${hoverBorder[stat.treatmentType] || ''} dark:hover:border-slate-600`}>
                  <div className="flex items-start justify-between mb-4">
                    <div className={`p-3 bg-gradient-to-r ${gradientColors[stat.treatmentType] || 'from-gray-500 to-slate-500'} rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                      <User className="size-6 text-white" />
                    </div>
                    <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold ${badgeColors[stat.treatmentType] || ''}`}>
                      {stat.count}
                    </div>
                  </div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">{stat.treatmentType}</p>
                  <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{stat.totalMoney.toLocaleString('en-US')} هەزار</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                      <div className="flex items-center gap-2">
                        <User className="size-3.5 text-slate-500 dark:text-slate-400" />
                        <span className="text-xs text-slate-600 dark:text-slate-400">دانیشتەکان</span>
                      </div>
                      <span className="text-sm font-semibold text-slate-900 dark:text-white">{stat.count}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
  <div className="flex flex-row items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="absolute opacity-60 border border-border/60  right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="گەڕان"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full opacity-60 rounded-lg border-border/60 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 pr-10 h-10"
          />
        </div>
        <Select value={timePeriod} onValueChange={(value: 'month' | 'week' | 'today' | 'all' | 'custom') => setTimePeriod(value)}>
          <SelectTrigger className="w-fit h-10">
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
        {timePeriod === 'custom' && (
          <div className="flex gap-2">
            <Input
              type="date"
              value={customStartDate}
              onChange={(e) => setCustomStartDate(e.target.value)}
              className="h-10"
            />
            <Input
              type="date"
              value={customEndDate}
              onChange={(e) => setCustomEndDate(e.target.value)}
              className="h-10"
            />
          </div>
        )}
        <Button 
          onClick={() => setOpenDialog(true)}
          className="bg-primary hover:shadow-lg hover:shadow-primary/30 gap-2 text-white font-semibold px-4 py-2 whitespace-nowrap"
        >
        
          زیادکردنی نەخۆش
            <Plus className="w-4 h-4" />
        </Button>
      </div>
      <div className="rounded-xl border border-border/90 overflow-hidden bg-card">
      
        <Table>
          <TableHeader className="bg-primary/5 border-b border-border/40">
            <TableRow className="hover:bg-primary/2 transition-colors">
           
              <TableHead className="text-right text-primary font-bold">ناوی نەخۆش</TableHead>
              <TableHead className="text-right text-primary font-bold">ڕەگەز</TableHead>
              <TableHead className="text-right text-primary font-bold">تەلەفۆن</TableHead>
              <TableHead className="text-right text-primary font-bold">تەمەن</TableHead>
              <TableHead className="text-right text-primary font-bold">جۆری چارەسەری</TableHead>
              <TableHead className="text-right text-primary font-bold">بەرواری چاوپێکەوتن</TableHead>
              <TableHead className="text-right text-primary font-bold">بڕی پارە</TableHead>
              <TableHead className="text-center text-primary font-bold">کردار</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedAppointments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={9} className="text-center py-12 text-muted-foreground hover:bg-transparent">
                  <div className="flex flex-col items-center gap-2">
                    <User className="w-12 h-12 opacity-30 mx-auto" />
                    <span className="text-lg">{searchTerm ? 'هیچ نەخۆشێک نەدۆزرایەوە !' : 'هیچ چاوپێکەوتن نیە'}</span>
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
            
                  <TableCell className="text-xs font-semibold text-foreground">{appointment.name}</TableCell>
                  <TableCell className="text-xs font-semibold text-foreground/80">{appointment.gender}</TableCell>
                  <TableCell className="text-xs font-semibold text-foreground/80">{appointment.phone}</TableCell>
                  <TableCell className="text-xs font-semibold text-foreground/80">{appointment.age}</TableCell>
                  <TableCell className="text-xs font-semibold text-foreground/80">
                    {appointment.treatmentType}
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-foreground/80">
                    {new Date(appointment.appointmentDate).toLocaleDateString('ku-IQ', {
                      year: 'numeric',
                      month: '2-digit',
                      day: '2-digit'
                    })}
                  </TableCell>
                  <TableCell className="text-foreground/70">
                    {appointment.money ? (
                      <span className="inline-flex h-5 items-center justify-center whitespace-nowrap rounded-4xl bg-green-100 px-2 py-0.5 text-xs font-semibold text-green-800 dark:bg-green-900/40 dark:text-green-300">
                        {`${parseFloat(String(appointment.money)).toLocaleString('en-US')} هەزار`}
                      </span>
                    ) : (
                      <span className="inline-flex h-5 items-center justify-center whitespace-nowrap rounded-4xl bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                        -
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditAppointment(appointment)}
                        className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900"
                        title="دەستکاریکردن"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirm(appointment.id)}
                        className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900"
                        title="سڕینەوە"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="border-t border-border/40 bg-primary/2">
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
          });
        }
      }}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className='text-center'>{editingAppointment ? 'دەستکاریکردنی نەخۆش' : 'زیادکردنی نەخۆش'}</DialogTitle>
            <DialogDescription className='text-center'>
              {editingAppointment ? 'زانیاریەکانی نەخۆشەکە دەستکاری بکە' : 'زانیاریەکانی نەخۆشە نوێەکە بنووسە'}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddAppointment} className="space-y-4">
            <div className="space-y-3">
              <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:col-span-1">ناو</label>
                <Input
                  className="sm:col-span-2"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="ناوی نەخۆش"
                  required
                />
              </div>

              <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:col-span-1">ڕەگەز</label>
                <div className="sm:col-span-2">
                  <Select value={formData.gender} onValueChange={(value) => handleSelectChange('gender', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="ڕەگەز" />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      <SelectItem value="نێر">نێر</SelectItem>
                      <SelectItem value="مێ">مێ</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:col-span-1">ژمارەی تەلەفۆن</label>
              <Input
                className="sm:col-span-2"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="07701234567"
                required
              />
              </div>

              <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:col-span-1">تەمەن</label>
              <Input
                className="sm:col-span-2"
                name="age"
                type="number"
                value={formData.age}
                onChange={handleInputChange}
                placeholder="تەمەن"
                required
              />
              </div>

              <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:col-span-1">جۆری چارەسەری</label>
                <div className="sm:col-span-2">
                  <Select value={formData.treatmentType} onValueChange={(value) => handleSelectChange('treatmentType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="جۆری چارەسەر" />
                    </SelectTrigger>
                    <SelectContent dir="rtl">
                      <SelectItem value="شۆردنی دندان">شۆردنی ددان</SelectItem>
                      <SelectItem value="تەلی ددان"> تەلی ددان</SelectItem>
                      <SelectItem value="پڕکردنەوەی ددان"> پڕکردنەوەی ددان</SelectItem>
                      <SelectItem value=" ‌هەڵقەندنی دندان"> ‌هەڵقەندنی ددان </SelectItem>
                      <SelectItem value="هی تر">  هی تر </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:col-span-1">بەرواری چاوپێکەوتن</label>
              <Input
                className="sm:col-span-2"
                name="appointmentDate"
                type="date"
                value={formData.appointmentDate}
                onChange={handleInputChange}
                required
              />
              </div>

              <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:col-span-1">بڕی پارە</label>
              <Input
                className="sm:col-span-2"
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

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-primary hover:shadow-lg hover:shadow-primary/30 text-white font-semibold"
              >
                {submitting ? 'چونەژوورەوە...' : 'زیادکردن'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenDialog(false)}
              >
                داخستن
              </Button>
            </div>
          </form>
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
    </div>
  );
}
