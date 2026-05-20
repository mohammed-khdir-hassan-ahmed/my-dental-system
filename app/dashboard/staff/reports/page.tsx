'use client';

import { useState, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
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
import { Loader2, FileText, CheckCircle2, AlertCircle, Download, ArrowRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notifyMonthlyReportCreated, notifyActionError } from '@/lib/notify';
import Link from 'next/link';

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

interface Staff {
  id: number;
  fullName: string;
  role: string;
  basicSalary: string;
}

interface PayrollHistory {
  id: number;
  monthKey: string;
  year: number;
  month: number;
  totalSalaryPaid: string;
  totalAdvances: string;
  totalStaff: number;
  finalizedAt: string;
}

const getMonthKey = (date = new Date()) => {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${month}-${date.getFullYear()}`;
};

const monthNames = ['مانگی ١', 'مانگی ٢', 'مانگی ٣', 'مانگی ٤', 'مانگی ٥', 'مانگی ٦', 'مانگی ٧', 'مانگی ٨', 'مانگی ٩', 'مانگی ١٠', 'مانگی ١١', 'مانگی ١٢'];

export default function StaffReportsPage() {
  const [selectedMonth, setSelectedMonth] = useState(getMonthKey());
  const [selectedStaffId, setSelectedStaffId] = useState<number | null>(null);
  const [availableMonths, setAvailableMonths] = useState<Array<{ monthKey: string; month: number; year: number }>>([]);
  const [openFinalizeDialog, setOpenFinalizeDialog] = useState(false);
  const [openStaffDetailsDialog, setOpenStaffDetailsDialog] = useState(false);
  const queryClient = useQueryClient();

  // Fetch available months
  useEffect(() => {
    const fetchAvailableMonths = async () => {
      try {
        const response = await fetch('/api/payroll?getAvailableMonths=1');
        const data = await response.json();
        setAvailableMonths(data);
        
        // Add current month if not in list
        const currentMonthKey = getMonthKey();
        if (!data.some((m: any) => m.monthKey === currentMonthKey)) {
          setAvailableMonths([{ monthKey: currentMonthKey, month: new Date().getMonth() + 1, year: new Date().getFullYear() }, ...data]);
        }
      } catch (error) {
        console.error('Error fetching months:', error);
      }
    };
    fetchAvailableMonths();
  }, []);

  // Fetch staff
  const { data: staff = [], isLoading: staffLoading } = useQuery({
    queryKey: ['staff'],
    queryFn: async () => {
      const res = await fetch('/api/staff');
      if (!res.ok) throw new Error('Failed to fetch staff');
      return (await res.json()) as Staff[];
    },
  });

  // Fetch monthly records for selected month
  const { data: monthlyRecords = [], isLoading: recordsLoading } = useQuery({
    queryKey: ['monthly-records-report', selectedMonth],
    queryFn: async () => {
      const res = await fetch(`/api/payroll?monthKey=${encodeURIComponent(selectedMonth)}&includePaid=1`);
      if (!res.ok) throw new Error('Failed to fetch records');
      return (await res.json()) as MonthlyRecord[];
    },
  });

  // Fetch payroll history
  const { data: payrollHistory = [] } = useQuery({
    queryKey: ['payroll-history'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/payroll-history');
        if (!response.ok) throw new Error('Failed to fetch payroll history');
        return (await response.json()) as PayrollHistory[];
      } catch {
        return [];
      }
    },
  });

  // Finalize month mutation
  const finalizeMutation = useMutation({
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
        const error = await res.json();
        throw new Error(error.message || 'Failed to finalize month');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payroll-history'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-records-report'] });
      notifyMonthlyReportCreated();
      setOpenFinalizeDialog(false);
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : 'خرابی لە دروستکردنی ڕاپۆرت';
      notifyActionError(message);
    },
  });

  // Get month display name
  const getMonthDisplay = (monthKey: string) => {
    const [month, year] = monthKey.split('-');
    const monthNum = parseInt(month) - 1;
    return `${monthNames[monthNum]} ${year}`;
  };

  // Calculate totals for current month
  const advances = monthlyRecords.filter(r => r.type === 'Advance' && !r.isPaid);
  const totalAdvances = advances.reduce((sum, r) => sum + Number(r.amount || 0), 0);

  const salaries = monthlyRecords.filter(r => r.type === 'Salary');
  const totalSalaries = salaries.reduce((sum, r) => sum + Number(r.amount || 0), 0);

  // Group records by staff
  const recordsByStaff = useMemo(() => {
    return staff.map(s => ({
      ...s,
      records: monthlyRecords.filter(r => r.staffId === s.id),
      totalAdvances: monthlyRecords
        .filter(r => r.staffId === s.id && r.type === 'Advance')
        .reduce((sum, r) => sum + Number(r.amount || 0), 0),
    }));
  }, [staff, monthlyRecords]);

  const selectedStaffRecords = selectedStaffId 
    ? recordsByStaff.find(s => s.id === selectedStaffId)
    : null;

  const formatCurrency = (value: string | number | undefined) => {
    if (!value) return '0';
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (!Number.isFinite(num) || num === 0) return '0';
    return num.toLocaleString('ku-IQ', { maximumFractionDigits: 0 });
  };

  // Check if current month is already finalized
  const isCurrentMonthFinalized = payrollHistory.some(p => p.monthKey === selectedMonth);

  if (staffLoading) {
    return (
      <div className="flex h-screen items-center justify-center" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4" dir="rtl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/dashboard/staff">
            <Button variant="outline" size="sm">
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-3xl font-bold">ڕاپۆرتی موچەی کارمەندەکان</h1>
        </div>
      </div>

      {/* Month Selector and Finalize Button */}
      <div className="flex gap-4 flex-wrap">
        <div className="flex-1 min-w-[200px]">
          <label className="block text-sm font-medium mb-2">مانگ دیاریکن</label>
          <Select value={selectedMonth} onValueChange={setSelectedMonth}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {availableMonths.map(m => (
                <SelectItem key={m.monthKey} value={m.monthKey}>
                  {getMonthDisplay(m.monthKey)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {!isCurrentMonthFinalized && (
          <div className="flex items-end">
            <Button
              onClick={() => setOpenFinalizeDialog(true)}
              className="bg-primary hover:shadow-lg hover:shadow-primary/30 active:scale-95 active:shadow-inner gap-2 text-white font-semibold px-4 py-2 transition-all duration-150"
            >
              <CheckCircle2 className="h-4 w-4" />
              کۆتایی بهێنە مانگە
            </Button>
          </div>
        )}

        {isCurrentMonthFinalized && (
          <div className="flex items-end">
            <div className="flex items-center gap-2 px-4 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-600 dark:text-green-400 font-medium">کۆتایی هاتووە</span>
            </div>
          </div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Staff */}
        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-slate-600 dark:text-slate-400">ژمارەی کارمەندەکان</p>
            <p className="text-2xl font-bold">{recordsByStaff.length}</p>
          </div>
        </Card>

        {/* Total Advances */}
        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-slate-600 dark:text-slate-400">کۆی پێشەکیەکان</p>
            <p className="text-2xl font-bold text-orange-600">{formatCurrency(totalAdvances)}</p>
          </div>
        </Card>

        {/* Total Salaries */}
        <Card className="p-4">
          <div className="space-y-2">
            <p className="text-sm text-slate-600 dark:text-slate-400">کۆی موچە</p>
            <p className="text-2xl font-bold text-blue-600">{formatCurrency(totalSalaries)}</p>
          </div>
        </Card>
      </div>

      {/* Payroll History */}
      {payrollHistory.length > 0 && (
        <div>
          <h2 className="text-xl font-bold mb-4">مێژوی ڕاپۆرتەکان</h2>
          <Card className="overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-slate-900">
                  <TableHead className="text-right">مانگ</TableHead>
                  <TableHead className="text-right">ژمارەی کارمەندەکان</TableHead>
                  <TableHead className="text-right">پێشەکی</TableHead>
                  <TableHead className="text-right">موچە</TableHead>
                  <TableHead className="text-right">بەروار</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {payrollHistory.map(ph => (
                  <TableRow key={ph.id} className="hover:bg-slate-50 dark:hover:bg-slate-900">
                    <TableCell className="font-medium">{getMonthDisplay(ph.monthKey)}</TableCell>
                    <TableCell>{ph.totalStaff}</TableCell>
                    <TableCell>{formatCurrency(ph.totalAdvances)}</TableCell>
                    <TableCell>{formatCurrency(ph.totalSalaryPaid)}</TableCell>
                    <TableCell className="text-xs text-slate-500">
                      {new Date(ph.finalizedAt).toLocaleDateString('ku-IQ')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        </div>
      )}

      {/* Staff Records Table */}
      <div>
        <h2 className="text-xl font-bold mb-4">کارمەندەکان</h2>
        <Card className="overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-slate-900">
                <TableHead className="text-right">ناو</TableHead>
                <TableHead className="text-right">ڕۆل</TableHead>
                <TableHead className="text-right">موچەی بنەڕەتی</TableHead>
                <TableHead className="text-right">پێشەکیی مانگ</TableHead>
                <TableHead className="text-right">کاریگەری</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {recordsLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto" />
                  </TableCell>
                </TableRow>
              ) : recordsByStaff.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-slate-500">
                    کارمەند نیی
                  </TableCell>
                </TableRow>
              ) : (
                recordsByStaff.map(s => (
                  <TableRow 
                    key={s.id} 
                    className="hover:bg-slate-50 dark:hover:bg-slate-900 cursor-pointer"
                    onClick={() => {
                      setSelectedStaffId(s.id);
                      setOpenStaffDetailsDialog(true);
                    }}
                  >
                    <TableCell className="font-medium">{s.fullName}</TableCell>
                    <TableCell>{s.role}</TableCell>
                    <TableCell>{formatCurrency(s.basicSalary)}</TableCell>
                    <TableCell className="text-orange-600 font-semibold">
                      {formatCurrency(s.totalAdvances)}
                    </TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedStaffId(s.id);
                          setOpenStaffDetailsDialog(true);
                        }}
                      >
                        <FileText className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </div>

      {/* Finalize Month Dialog */}
      <Dialog open={openFinalizeDialog} onOpenChange={setOpenFinalizeDialog}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>کۆتایی بهێنان</DialogTitle>
            <DialogDescription>
              ئایا دڵنیای کە دەتەوێ مانگی {getMonthDisplay(selectedMonth)} کۆتایی بهێنیت؟ ئەم کارە ناتوانیت گێڕانەوە.
              <div className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                monthKey: {selectedMonth}
              </div>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 dark:bg-slate-900 rounded-lg">
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">کۆی پێشەکیەکان</p>
                <p className="text-xl font-bold">{formatCurrency(totalAdvances)}</p>
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">ژمارەی کارمەندەکان</p>
                <p className="text-xl font-bold">{recordsByStaff.length}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setOpenFinalizeDialog(false)}
              >
                پاشگەزبوون
              </Button>
              <Button
                onClick={() => finalizeMutation.mutate(selectedMonth)}
                disabled={finalizeMutation.isPending}
                className="bg-primary hover:shadow-lg hover:shadow-primary/30 active:scale-95 active:shadow-inner text-white font-semibold transition-all duration-150"
              >
                {finalizeMutation.isPending && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
                کۆتایی بهێنە
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Staff Details Dialog */}
      <Dialog open={openStaffDetailsDialog} onOpenChange={setOpenStaffDetailsDialog}>
        <DialogContent dir="rtl" className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{selectedStaffRecords?.fullName} - مێژوی موچە</DialogTitle>
            <DialogDescription>
              مانگی {getMonthDisplay(selectedMonth)}
            </DialogDescription>
          </DialogHeader>
          
          {selectedStaffRecords && (
            <div className="space-y-4">
              {/* Summary */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <p className="text-xs text-slate-600 dark:text-slate-400">موچەی بنەڕەتی</p>
                  <p className="text-lg font-bold">{formatCurrency(selectedStaffRecords.basicSalary)}</p>
                </div>
                <div className="p-3 bg-orange-50 dark:bg-orange-900/20 rounded-lg">
                  <p className="text-xs text-slate-600 dark:text-slate-400">پێشەکی</p>
                  <p className="text-lg font-bold text-orange-600">{formatCurrency(selectedStaffRecords.totalAdvances)}</p>
                </div>
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <p className="text-xs text-slate-600 dark:text-slate-400">دووپات</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(
                      Number(selectedStaffRecords.basicSalary || 0) - selectedStaffRecords.totalAdvances
                    )}
                  </p>
                </div>
              </div>

              {/* Transaction Details */}
              {selectedStaffRecords.records.length > 0 ? (
                <div>
                  <h4 className="font-semibold mb-2 text-sm">تۆمارەکانی مانگ</h4>
                  <div className="space-y-2 max-h-64 overflow-y-auto">
                    {selectedStaffRecords.records.map(record => (
                      <div
                        key={record.id}
                        className="p-2 bg-slate-50 dark:bg-slate-900 rounded flex justify-between items-center text-sm"
                      >
                        <div>
                          <p className="font-medium">
                            {record.type === 'Advance' ? 'پێشەکی' : 'موچە'}
                          </p>
                          {record.note && <p className="text-xs text-slate-500">{record.note}</p>}
                        </div>
                        <p className="font-semibold">{formatCurrency(record.amount)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <p className="text-center py-6 text-slate-500 text-sm">تۆماری مانگ نیی</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
