'use client';

import { useEffect, useMemo, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
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
} from '@/components/ui/select';
import { AlertCircle, Loader2, Pencil, Plus, Search, Trash2, Wallet } from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/pagination';
import {
  expenseCategories,
  paymentMethods,
  type Expense,
  type ExpenseCategory,
  type PaymentMethod,
} from '@/lib/types/expense';

interface ExpenseFormData {
  title: string;
  category: ExpenseCategory;
  amount: string;
  date: string;
  paymentMethod: PaymentMethod;
  notes: string;
}

type ReportPeriod =
  | 'today'
  | 'this_week'
  | 'last_week'
  | 'this_month'
  | 'last_month'
  | 'this_year'
  | 'last_year'
  | 'custom';

const reportPeriodOptions: Array<{ value: ReportPeriod; label: string }> = [
  { value: 'today', label: 'ڕۆژانە (ئەمڕۆ)' },
  { value: 'this_week', label: 'هەفتانە (ئەم هەفتەیە)' },
  { value: 'last_week', label: 'هەفتەی پێشوو' },
  { value: 'this_month', label: 'مانگانە (ئەم مانگە)' },
  { value: 'last_month', label: 'مانگی پێشوو' },
  { value: 'this_year', label: 'ساڵانە (ئەم ساڵە)' },
  { value: 'last_year', label: 'ساڵی پێشوو' },
  { value: 'custom', label: 'ماوەی دیاریکراو' },
];

const defaultForm: ExpenseFormData = {
  title: '',
  category: expenseCategories[0],
  amount: '',
  date: new Date().toISOString().slice(0, 10),
  paymentMethod: paymentMethods[0],
  notes: '',
};

const getMonthLabel = () =>
  new Date().toLocaleDateString('ku-IQ', {
    month: 'long',
    year: 'numeric',
  });

const currencyFormatter = new Intl.NumberFormat('ku-IQ', {
  style: 'currency',
  currency: 'IQD',
  maximumFractionDigits: 0,
});

const toDateKey = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const parseDate = (value: string) => new Date(`${value}T00:00:00`);

const startOfWeek = (date: Date) => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  result.setDate(result.getDate() + diff);
  result.setHours(0, 0, 0, 0);
  return result;
};

const endOfWeek = (date: Date) => {
  const start = startOfWeek(date);
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);
  return end;
};

const startOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth(), 1);
const endOfMonth = (date: Date) => new Date(date.getFullYear(), date.getMonth() + 1, 0, 23, 59, 59, 999);
const startOfYear = (date: Date) => new Date(date.getFullYear(), 0, 1);
const endOfYear = (date: Date) => new Date(date.getFullYear(), 11, 31, 23, 59, 59, 999);

const getReportRange = (period: ReportPeriod, customFrom: string, customTo: string) => {
  const now = new Date();

  if (period === 'custom') {
    if (!customFrom || !customTo) return null;
    const from = parseDate(customFrom);
    const to = parseDate(customTo);
    to.setHours(23, 59, 59, 999);
    if (from > to) return null;
    return { from, to, label: `${customFrom} - ${customTo}` };
  }

  if (period === 'today') {
    const from = parseDate(toDateKey(now));
    const to = new Date(from);
    to.setHours(23, 59, 59, 999);
    return { from, to, label: 'ئەمڕۆ' };
  }

  if (period === 'this_week') {
    const from = startOfWeek(now);
    const to = endOfWeek(now);
    return { from, to, label: 'ئەم هەفتەیە' };
  }

  if (period === 'last_week') {
    const lastWeekRef = new Date(now);
    lastWeekRef.setDate(now.getDate() - 7);
    const from = startOfWeek(lastWeekRef);
    const to = endOfWeek(lastWeekRef);
    return { from, to, label: 'هەفتەی پێشوو' };
  }

  if (period === 'this_month') {
    const from = startOfMonth(now);
    const to = endOfMonth(now);
    return { from, to, label: 'ئەم مانگە' };
  }

  if (period === 'last_month') {
    const lastMonthRef = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const from = startOfMonth(lastMonthRef);
    const to = endOfMonth(lastMonthRef);
    return { from, to, label: 'مانگی پێشوو' };
  }

  if (period === 'this_year') {
    const from = startOfYear(now);
    const to = endOfYear(now);
    return { from, to, label: 'ئەم ساڵە' };
  }

  const lastYearRef = new Date(now.getFullYear() - 1, 0, 1);
  const from = startOfYear(lastYearRef);
  const to = endOfYear(lastYearRef);
  return { from, to, label: 'ساڵی پێشوو' };
};

const sanitizeFileSegment = (value: string) =>
  value
    .replace(/[\\/:*?"<>|]/g, '-')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);

export default function ExpensesPage() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [timePeriod, setTimePeriod] = useState<'month' | 'week' | 'today' | 'all' | 'custom'>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [paginationPage, setPaginationPage] = useState(1);
  const [paginationPageSize, setPaginationPageSize] = useState(10);

  const [addOpen, setAddOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reportOpen, setReportOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportPeriod, setReportPeriod] = useState<ReportPeriod>('today');
  const [reportFrom, setReportFrom] = useState('');
  const [reportTo, setReportTo] = useState('');
  const [reportExpenses, setReportExpenses] = useState<Expense[]>([]);
  const [reportRangeLabel, setReportRangeLabel] = useState('');
  const [reportGeneratedAt, setReportGeneratedAt] = useState('');
  const [exportingPdf, setExportingPdf] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);

  const [addForm, setAddForm] = useState<ExpenseFormData>(defaultForm);
  const [editForm, setEditForm] = useState<ExpenseFormData>(defaultForm);

  // Memoized calculations - must be called before any conditional logic
  const totalPages = useMemo(() => Math.ceil(expenses.length / paginationPageSize) || 1, [expenses.length, paginationPageSize]);
  const startIndex = useMemo(() => (paginationPage - 1) * paginationPageSize, [paginationPage, paginationPageSize]);
  const endIndex = useMemo(() => startIndex + paginationPageSize, [startIndex, paginationPageSize]);

  const paginatedExpenses = useMemo(() => {
    return expenses.slice(startIndex, endIndex);
  }, [expenses, startIndex, endIndex]);

  const monthlyTotal = useMemo(
    () => expenses.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [expenses]
  );

  const handlePageChange = (newPage: number) => {
    setPaginationPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPaginationPageSize(newPageSize);
    setPaginationPage(1);
  };

  const fetchExpenses = async (search = '') => {
    try {
      setError(null);
      const params = new URLSearchParams();
      if (search.trim()) {
        params.set('search', search.trim());
      }
      
      if (timePeriod === 'custom' && customStartDate && customEndDate) {
        params.set('from', customStartDate);
        params.set('to', customEndDate);
      } else if (timePeriod !== 'custom') {
        params.set('period', timePeriod);
      }

      const response = await fetch(`/api/expenses${params.toString() ? `?${params.toString()}` : ''}`);
      if (!response.ok) {
        throw new Error('هەڵە لە هێنانی خەرجییەکاندا');
      }

      const data = (await response.json()) as Expense[];
      setExpenses(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'هەڵەیەک ڕویدا');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses(searchTerm);
  }, [searchTerm, timePeriod, customStartDate, customEndDate]);

  const formatAmount = (amount: string | number) => currencyFormatter.format(Number(amount || 0));

  const reportTotal = useMemo(
    () => reportExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0),
    [reportExpenses]
  );

  const reportByCategory = useMemo(() => {
    return reportExpenses.reduce(
      (acc, item) => {
        const existing = acc.find((entry) => entry.category === item.category);
        if (existing) {
          existing.total += Number(item.amount || 0);
          existing.count += 1;
        } else {
          acc.push({
            category: item.category,
            total: Number(item.amount || 0),
            count: 1,
          });
        }
        return acc;
      },
      [] as Array<{ category: string; total: number; count: number }>
    );
  }, [reportExpenses]);

  const resetAddForm = () => {
    setAddForm({
      ...defaultForm,
      date: new Date().toISOString().slice(0, 10),
    });
  };

  const handleCreateExpense = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch('/api/expenses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: addForm.title,
          category: addForm.category,
          amount: Number(addForm.amount),
          date: addForm.date,
          paymentMethod: addForm.paymentMethod,
          notes: addForm.notes,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || 'تۆمارکردنی خەرجی سەرکەوتوو نەبوو');
      }

      toast.success('خەرجی نوێ بەسەرکەوتوویی تۆمارکرا');
      setAddOpen(false);
      resetAddForm();
      await fetchExpenses(searchTerm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'هەڵەیەک ڕویدا');
    } finally {
      setSubmitting(false);
    }
  };

  const openEditDialog = (expense: Expense) => {
    setSelectedExpense(expense);
    setEditForm({
      title: expense.title,
      category: expense.category,
      amount: String(expense.amount),
      date: expense.date,
      paymentMethod: expense.paymentMethod,
      notes: expense.notes || '',
    });
    setEditOpen(true);
  };

  const handleEditExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExpense) return;

    try {
      setSubmitting(true);
      setError(null);

      const response = await fetch('/api/expenses', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: selectedExpense.id,
          title: editForm.title,
          category: editForm.category,
          amount: Number(editForm.amount),
          date: editForm.date,
          paymentMethod: editForm.paymentMethod,
          notes: editForm.notes,
        }),
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || 'نوێکردنەوەی خەرجی سەرکەوتوو نەبوو');
      }

      toast.success('خەرجی بەسەرکەوتوویی نوێکرایەوە');
      setEditOpen(false);
      setSelectedExpense(null);
      await fetchExpenses(searchTerm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'هەڵەیەک ڕویدا');
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteDialog = (expense: Expense) => {
    setSelectedExpense(expense);
    setDeleteOpen(true);
  };

  const handleDeleteExpense = async () => {
    if (!selectedExpense) return;

    try {
      setDeleting(selectedExpense.id);
      setError(null);

      const response = await fetch(`/api/expenses?id=${selectedExpense.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const payload = (await response.json()) as { error?: string };
        throw new Error(payload.error || 'سڕینەوەی خەرجی سەرکەوتوو نەبوو');
      }

      toast.success('خەرجی بەسەرکەوتوویی سڕایەوە');
      setDeleteOpen(false);
      setSelectedExpense(null);
      await fetchExpenses(searchTerm);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'هەڵەیەک ڕویدا');
    } finally {
      setDeleting(null);
    }
  };

  const handleGenerateReport = async () => {
    const range = getReportRange(reportPeriod, reportFrom, reportTo);

    if (!range) {
      toast.error('تکایە ماوەی دروست هەڵبژێرە');
      return;
    }

    try {
      setReportLoading(true);
      setError(null);

      const response = await fetch('/api/expenses?scope=all');
      if (!response.ok) {
        throw new Error('هەڵە لە هێنانی داتای ڕاپۆرت');
      }

      const allExpenses = (await response.json()) as Expense[];
      const filtered = allExpenses.filter((expense) => {
        const expenseDate = parseDate(expense.date);
        return expenseDate >= range.from && expenseDate <= range.to;
      });

      setReportExpenses(filtered);
      setReportRangeLabel(range.label);
      setReportGeneratedAt(new Date().toLocaleDateString('ku-IQ'));
      setReportOpen(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'هەڵەیەک ڕویدا');
    } finally {
      setReportLoading(false);
    }
  };

  const handleExportReportPdf = async () => {
    if (reportExpenses.length === 0) {
      toast.error('هیچ داتایەک نییە بۆ PDF');
      return;
    }

    let iframe: HTMLIFrameElement | null = null;

    try {
      setExportingPdf(true);

      const rows = reportExpenses
        .map(
          (item) => `
            <tr>
              <td style="border:1px solid #ddd;padding:8px;">${item.title}</td>
              <td style="border:1px solid #ddd;padding:8px;">${item.category}</td>
              <td style="border:1px solid #ddd;padding:8px;">${formatAmount(item.amount)}</td>
              <td style="border:1px solid #ddd;padding:8px;">${item.paymentMethod}</td>
              <td style="border:1px solid #ddd;padding:8px;">${item.date}</td>
            </tr>
          `
        )
        .join('');

      const reportHtml = `
        <!doctype html>
        <html lang="ku" dir="rtl">
        <head>
          <meta charset="utf-8" />
          <style>
            body { margin: 0; background: #ffffff; padding: 24px; font-family: Tahoma, Arial, sans-serif; color: #111; }
            h1 { margin: 0 0 10px; text-align: center; }
            p { margin: 0 0 8px; }
            table { width: 100%; border-collapse: collapse; margin-top: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: right; }
            th { background: #f4f4f4; }
          </style>
        </head>
        <body>
          <h1>شا سیستەم </h1>
          <p>تاریخ: ${reportGeneratedAt || new Date().toLocaleDateString('ku-IQ')} - ${reportRangeLabel} PDF کرا</p>
          <p>کۆی گشتی: ${formatAmount(reportTotal)}</p>
          <p> جۆری خەرجیەکان: ${reportExpenses.length}</p>
          <table>
            <thead>
              <tr>
                <th>ناونیشانی خەرجی</th>
                <th>جۆری خەرجیەکان</th>
                <th>بڕی پارە</th>
                <th>ڕێگەی پارەدان</th>
                <th>بەروار</th>
              </tr>
            </thead>
            <tbody>
              ${rows}
            </tbody>
          </table>
        </body>
        </html>
      `;

      iframe = document.createElement('iframe');
      iframe.style.position = 'fixed';
      iframe.style.left = '-99999px';
      iframe.style.top = '0';
      iframe.style.width = '1024px';
      iframe.style.height = '100px';
      iframe.setAttribute('aria-hidden', 'true');
      document.body.appendChild(iframe);

      const iframeDoc = iframe.contentDocument;
      if (!iframeDoc) {
        throw new Error('iframe document available نییە');
      }

      iframeDoc.open();
      iframeDoc.write(reportHtml);
      iframeDoc.close();

      await new Promise<void>((resolve) => setTimeout(resolve, 80));

      const target = iframeDoc.body;
      const contentWidth = Math.max(target.scrollWidth, target.offsetWidth, 1024);
      const contentHeight = Math.max(target.scrollHeight, target.offsetHeight, 1);

      const canvas = await html2canvas(target, {
        scale: 1.2,
        backgroundColor: '#ffffff',
        width: contentWidth,
        height: contentHeight,
      });

      if (!canvas.width || !canvas.height) {
        throw new Error('وێنەی ڕاپۆرت بە دروستی دروست نەبوو');
      }

      if (iframe && document.body.contains(iframe)) {
        document.body.removeChild(iframe);
        iframe = null;
      }

      const imageData = canvas.toDataURL('image/jpeg', 0.72);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt',
        format: 'a4',
        compress: true,
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 40;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      let remainingHeight = imgHeight;
      let position = 20;

      pdf.addImage(imageData, 'JPEG', 20, position, imgWidth, imgHeight, undefined, 'FAST');
      remainingHeight -= pageHeight - 40;

      while (remainingHeight > 0) {
        position = remainingHeight - imgHeight + 20;
        pdf.addPage();
        pdf.addImage(imageData, 'JPEG', 20, position, imgWidth, imgHeight, undefined, 'FAST');
        remainingHeight -= pageHeight - 40;
      }

      const isoDate = new Date().toISOString().slice(0, 10);
      const safeLabel = sanitizeFileSegment(reportRangeLabel || 'range');
      const fileName = `expense-report-${safeLabel || 'range'}-${isoDate}.pdf`;
      pdf.save(fileName);
      toast.success('PDF دابەزێنرا');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'هەڵەیەک ڕوویدا';
      console.error('PDF export error:', err);
      toast.error(`هەڵە لە دروستکردنی PDF: ${message}`);
    } finally {
      if (iframe && document.body.contains(iframe)) {
        document.body.removeChild(iframe);
      }
      setExportingPdf(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6" dir="rtl">
      {error && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-4 text-destructive">
          <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      <Card className="border border-border/60 p-4 sm:p-6 shadow-sm">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex-1">
            <h2 className="text-base sm:text-lg font-semibold">کۆی خەرجییەکانی ئەم مانگە</h2>
            <p className="text-xs sm:text-sm text-muted-foreground">{getMonthLabel()}</p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-primary/10 px-4 py-2 text-primary">
            <Wallet className="h-5 w-5 sm:h-6 sm:w-6" />
            <span className="text-lg sm:text-xl font-bold">{formatAmount(monthlyTotal)}</span>
          </div>
        </div>
      </Card>

      <div className="flex flex-row items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="گەڕان بە ناونیشانی خەرجی"
            className="pr-10 h-10"
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
          onClick={() => setAddOpen(true)}
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95 active:shadow-inner px-4 py-2 whitespace-nowrap transition-all duration-150"
        >
          <Plus className="h-4 w-4" />
          خەرجی
        </Button>
      </div>

      <div className="rounded-xl border border-border/40 shadow-lg overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-primary/5 border-b border-border/40">
              <TableRow className="hover:bg-primary/2 transition-colors">
                <TableHead className="text-right text-primary font-bold">ناونیشانی خەرجی</TableHead>
                <TableHead className="text-right text-primary font-bold">پۆلێن</TableHead>
                <TableHead className="text-right text-primary font-bold">بڕی پارە</TableHead>
                <TableHead className="text-right text-primary font-bold">ڕێگەی پارەدان</TableHead>
                <TableHead className="text-right text-primary font-bold">بەروار</TableHead>
                <TableHead className="text-right text-primary font-bold">تێبینی</TableHead>
                <TableHead className="text-center text-primary font-bold">کرداری</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {expenses.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground hover:bg-transparent">
                    هیچ خەرجییەک نەدۆزرایەوە بۆ ئەم مانگە.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedExpenses.map((expense, index) => (
                  <TableRow
                    key={expense.id}
                    className={`transition-all duration-200 border-b border-gray-100 dark:border-gray-800 ${
                      index % 2 === 0
                        ? 'bg-white dark:bg-slate-950'
                        : 'bg-primary/2 dark:bg-slate-900/30'
                    } hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors`}
                  >
                    <TableCell className="text-xs font-semibold text-foreground">{expense.title}</TableCell>
                    <TableCell className="text-xs font-semibold text-foreground/80">{expense.category}</TableCell>
                    <TableCell className="text-foreground/70">
                      <span className="inline-flex h-5 items-center justify-center whitespace-nowrap rounded-4xl bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-800 dark:bg-red-900/40 dark:text-red-300">
                        {formatAmount(expense.amount)}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-foreground/80">{expense.paymentMethod}</TableCell>
                    <TableCell className="text-xs font-semibold text-foreground/80">
                      {new Date(expense.date).toLocaleDateString('ku-IQ', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                      })}
                    </TableCell>
                    <TableCell className="max-w-65 truncate text-xs font-semibold text-foreground/80">
                      {expense.notes || '-'}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(expense)}
                          className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(expense)}
                          disabled={deleting === expense.id}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900"
                        >
                          {deleting === expense.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
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

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent dir="rtl" className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>زیادکردنی خەرجی نوێ</DialogTitle>
            <DialogDescription>زانیاریی خەرجیەکە بنووسە و تۆماری بکە.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleCreateExpense}>
            <ExpenseForm
              formData={addForm}
              setFormData={setAddForm}
              submitting={submitting}
              submitLabel="تۆمارکردن"
            />
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent dir="rtl" className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>دەستکاریکردنی خەرجی</DialogTitle>
            <DialogDescription>زانیارییەکان نوێ بکەرەوە و پاشان پاشەکەوتی بکە.</DialogDescription>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleEditExpense}>
            <ExpenseForm
              formData={editForm}
              setFormData={setEditForm}
              submitting={submitting}
              submitLabel="نوێکردنەوە"
            />
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-destructive text-center">سڕینەوەی خەرجی</DialogTitle>
            <DialogDescription>
              ئایا دڵنیایت لە سڕینەوەی ئەم خەرجییە؟ ئەم کردارە ناگەڕێتەوە.
            </DialogDescription>
          </DialogHeader>

          <div className="rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-sm">
            {selectedExpense?.title}
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={() => setDeleteOpen(false)}>
              داخستن
            </Button>
            <Button
              variant="destructive"
              className="flex-1"
              onClick={handleDeleteExpense}
              disabled={deleting === selectedExpense?.id}
            >
              {deleting === selectedExpense?.id ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  چاوەڕوان بە...
                </>
              ) : (
                'سڕینەوە'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}

function ExpenseForm({
  formData,
  setFormData,
  submitting,
  submitLabel,
}: {
  formData: ExpenseFormData;
  setFormData: React.Dispatch<React.SetStateAction<ExpenseFormData>>;
  submitting: boolean;
  submitLabel: string;
}) {
  return (
    <>
      <div className="grid gap-2">
        <label className="text-sm font-medium">ناونیشانی خەرجی</label>
        <Input
          required
          value={formData.title}
          onChange={(e) => setFormData((prev) => ({ ...prev, title: e.target.value }))}
          placeholder="بۆ نموونە: کڕینی حەشووی ددان"
        />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-medium">جۆری خەرجی</label>
          <Select
            value={formData.category}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, category: value as ExpenseCategory }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {expenseCategories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">ڕێگەی پارەدان</label>
          <Select
            value={formData.paymentMethod}
            onValueChange={(value) =>
              setFormData((prev) => ({ ...prev, paymentMethod: value as PaymentMethod }))
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {paymentMethods.map((method) => (
                <SelectItem key={method} value={method}>
                  {method}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="grid gap-2">
          <label className="text-sm font-medium">بڕی پارە</label>
          <Input
            required
            type="number"
            min="0"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
            placeholder="0"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-medium">بەروار</label>
          <Input
            required
            type="date"
            value={formData.date}
            onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
          />
        </div>
      </div>

      <div className="grid gap-2">
        <label className="text-sm font-medium">تێبینی</label>
        <Input
          value={formData.notes}
          onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
          placeholder="تێبینیی زیادە (هەڵبژاردەیی)"
        />
      </div>

      <Button type="submit" disabled={submitting} className="w-full gap-2">
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {submitLabel}
      </Button>
    </>
  );
}
