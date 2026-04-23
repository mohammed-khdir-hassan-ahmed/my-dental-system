'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
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
import { Loader2, Plus, Search, Trash2, Pencil, User, Calendar, TrendingUp, DollarSign, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
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
  const [timePeriod, setTimePeriod] = useState<'month' | 'week' | 'today' | 'all' | 'custom'>('month');
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
      setError(err instanceof Error ? err.message : 'هەڵەیەک ڕویدا');
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

      // Refresh appointments list
      await fetchAppointments();
      
      // Show success toast with green color
      toast.custom(
        (t) => (
          <div className="bg-emerald-500 dark:bg-emerald-600 border-l-4 border-l-emerald-700 text-white px-6 py-4 rounded-lg shadow-2xl font-medium flex items-center gap-4 max-w-sm">
            <CheckCircle2 className="w-6 h-6 flex-shrink-0 animate-scale-in" />
            <div className="flex-1">
              <p className="text-sm opacity-90">{editingAppointment ? 'نەخۆش بەسەرکەوتویی نوێکرایەوە' : 'نەخۆش بەسەرکەوتویی زیاد کرا'}</p>
            </div>
          </div>
        ),
        { duration: 4000 }
      );
      
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
      setError(err instanceof Error ? err.message : 'هەڵەیەک ڕویدا');
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
    try {
      const response = await fetch(`/api/appointments?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('وەک نەتوانیت نەخۆشی بسڕە');
      }

      // Refresh appointments list
      await fetchAppointments();
      setDeleteConfirm(null);
      
      // Show delete toast with red color
      toast.custom(
        (t) => (
          <div className="bg-red-500 dark:bg-red-600 border-l-4 border-l-red-700 text-white px-6 py-4 rounded-lg shadow-2xl font-medium flex items-center gap-4 max-w-sm">
            <XCircle className="w-6 h-6 flex-shrink-0 animate-scale-in" />
            <div className="flex-1">
              <p className="text-sm opacity-90">نەخۆش بەسەرکەوتویی سڕایەوە</p>
            </div>
          </div>
        ),
        { duration: 4000 }
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'هەڵەیەک ڕویدا');
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
          <Card className="border-1 border-green-500 shadow-lg p-4 sm:p-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-xs sm:text-sm text-green-600 dark:text-green-400 truncate">
                  داهاتی ئەمڕۆ
                </p>
                <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-green-900 dark:text-green-100">
                  {totalMoney.toLocaleString('en-US')} هەزار
                </p>
              </div>
              <User className="h-8 w-8 sm:h-10 sm:w-10 text-green-500" />
            </div>
          </Card>

          {/* Treatment Type Cards */}
          {treatmentStats.map((stat) => (
            <Card
              key={stat.treatmentType}
              className={`border-1 shadow-lg p-4 sm:p-6 ${getTreatmentColor(stat.treatmentType).border}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className={`text-xs sm:text-sm truncate ${getTreatmentColor(stat.treatmentType).title}`}>
                    {stat.treatmentType}
                  </p>
                  <p className={`mt-1 sm:mt-2 text-xl sm:text-2xl font-bold ${getTreatmentColor(stat.treatmentType).value}`}>
                    {stat.count}
                  </p>
                  <p className={`mt-1 text-xs sm:text-sm ${getTreatmentColor(stat.treatmentType).title}`}>
                    {stat.totalMoney.toLocaleString('en-US')} هەزار
                  </p>
                </div>
                <User className={`h-8 w-8 sm:h-10 sm:w-10 ${getTreatmentColor(stat.treatmentType).icon}`} />
              </div>
            </Card>
          ))}
        </div>
      )}
  <div className="flex flex-row items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            type="text"
            placeholder="گەڕان"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border-border/90 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 pr-10 h-10"
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
      <div className="rounded-xl border border-border/40 shadow-lg overflow-hidden bg-card">
      
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
