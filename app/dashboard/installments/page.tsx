'use client';

import { useEffect, useState, useMemo } from 'react';
import {
  notifyInstallmentAdded,
  notifyInstallmentPayment,
  notifyInstallmentDeleted,
  notifyActionError,
  notifyPdfExported,
  notifyPdfError,
} from '@/lib/notify';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Wallet, Calendar, Trash2, AlertCircle, Plus, DollarSign, RotateCcw, Search, Printer } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Pagination } from '@/components/pagination';

interface Installment {
  id: number;
  patientName: string;
  totalAmount: string;
  paidAmount: string;
  remainingAmount: string;
  installmentValue: string;
  nextPaymentDate: string | null;
  status: 'Paid' | 'Pending' | 'Overdue';
  createdAt: string;
  paymentHistory?: Array<{
    paymentDate: string;
    amountPaid: string;
  }>;
  age?: string;
  phoneNumber?: string;
  address?: string;
}

interface FormData {
  patientName: string;
  totalAmount: string;
  paidAmount: string;
  installmentValue: string;
  nextPaymentDate: string;
  age?: string;
  phoneNumber?: string;
  address?: string;
}

interface PaymentFormData {
  amountPaid: string;
  paymentDate: string;
}

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Paid':
      return 'bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-300';
    case 'Pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-300';
    case 'Overdue':
      return 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
  }
};

const getStatusLabel = (status: string) => {
  switch (status) {
    case 'Paid': return 'دراوە';
    case 'Pending': return 'چاوەڕوانکراوە';
    case 'Overdue': return 'دواکەوتووە';
    default: return status;
  }
};

const formatNumber = (value: string): string => {
  const numeric = value.replace(/,/g, '');
  if (numeric === '') return '';
  const num = parseFloat(numeric);
  if (isNaN(num)) return value;
  return num.toLocaleString('en-US');
};

const parseFormattedNumber = (value: string): string => {
  return value.replace(/,/g, '');
};

export default function InstallmentsPage() {
  const [installments, setInstallments] = useState<Installment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openAddDialog, setOpenAddDialog] = useState(false);
  const [openPaymentDialog, setOpenPaymentDialog] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedInstallment, setSelectedInstallment] = useState<Installment | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Paid' | 'Pending' | 'Overdue'>('all');
  const [paginationPage, setPaginationPage] = useState(1);
  const [paginationPageSize, setPaginationPageSize] = useState(10);
  const [formData, setFormData] = useState<FormData>({
    patientName: '',
    totalAmount: '',
    paidAmount: '0',
    installmentValue: '',
    nextPaymentDate: '',
    age: '',
    phoneNumber: '',
    address: '',
  });
  const [paymentFormData, setPaymentFormData] = useState<PaymentFormData>({
    amountPaid: '',
    paymentDate: new Date().toISOString().split('T')[0],
  });

  // Memoized calculations - must be called before any conditional logic
  const filteredInstallments = useMemo(() => {
    const searchLower = searchTerm.toLowerCase();
    return installments.filter((installment) => {
      const matchesSearch = 
        installment.patientName.toLowerCase().includes(searchLower) ||
        installment.status.toLowerCase().includes(searchLower);
      const matchesStatus = statusFilter === 'all' || installment.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [installments, searchTerm, statusFilter]);

  const totalPages = useMemo(() => Math.ceil(filteredInstallments.length / paginationPageSize) || 1, [filteredInstallments.length, paginationPageSize]);
  const startIndex = useMemo(() => (paginationPage - 1) * paginationPageSize, [paginationPage, paginationPageSize]);
  const endIndex = useMemo(() => startIndex + paginationPageSize, [startIndex, paginationPageSize]);

  const paginatedInstallments = useMemo(() => {
    return filteredInstallments.slice(startIndex, endIndex);
  }, [filteredInstallments, startIndex, endIndex]);

  const handlePageChange = (newPage: number) => {
    setPaginationPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPaginationPageSize(newPageSize);
    setPaginationPage(1);
  };

  const fetchInstallments = async () => {
    try {
      const response = await fetch('/api/installments');
      if (!response.ok) {
        throw new Error('هەڵە لە هێنانی قیستەکان');
      }
      const data = await response.json();
      setInstallments(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'هەڵەیەک ڕویدا');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInstallments();
  }, []);

  const handleAddInstallment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const totalAmount = parseFloat(formData.totalAmount);
      const paidAmount = parseFloat(formData.paidAmount || '0');
      const remainingAmount = totalAmount - paidAmount;
      const installmentValue = parseFloat(formData.installmentValue);

      const response = await fetch('/api/installments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientName: formData.patientName,
          totalAmount,
          paidAmount,
          remainingAmount,
          installmentValue,
          nextPaymentDate: formData.nextPaymentDate || null,
          age: formData.age,
          phoneNumber: formData.phoneNumber,
          address: formData.address,
        }),
      });

      if (!response.ok) {
        throw new Error('وەک نەتوانیت قیست زیادبکە');
      }

      await fetchInstallments();
      notifyInstallmentAdded(formData.patientName);
      setOpenAddDialog(false);
      setFormData({
        patientName: '',
        totalAmount: '',
        paidAmount: '0',
        installmentValue: '',
        nextPaymentDate: '',
        age: '',
        phoneNumber: '',
        address: '',
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'هەڵەیەک ڕویدا';
      setError(message);
      notifyActionError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecordPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInstallment) return;

    setSubmitting(true);

    try {
      const response = await fetch('/api/installments/record-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          installmentId: selectedInstallment.id,
          amountPaid: paymentFormData.amountPaid,
          paymentDate: paymentFormData.paymentDate,
        }),
      });

      if (!response.ok) {
        throw new Error('وەک نەتوانیت پارە تۆماربکە');
      }

      await fetchInstallments();
      notifyInstallmentPayment(
        selectedInstallment.patientName,
        Number(paymentFormData.amountPaid)
      );
      setOpenPaymentDialog(false);
      setPaymentFormData({
        amountPaid: '',
        paymentDate: new Date().toISOString().split('T')[0],
      });
      setSelectedInstallment(null);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'هەڵەیەک ڕویدا';
      setError(message);
      notifyActionError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteInstallment = async (id: number) => {
    setDeleting(true);
    const deleted = installments.find((i) => i.id === id);
    try {
      const response = await fetch(`/api/installments?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('وەک نەتوانیت قیست بسڕە');
      }

      await fetchInstallments();
      setDeleteConfirm(null);
      notifyInstallmentDeleted(deleted?.patientName ?? 'قیست');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'هەڵەیەک ڕویدا';
      setError(message);
      notifyActionError(message);
    } finally {
      setDeleting(false);
    }
  };

  const openPaymentModal = (installment: Installment) => {
    setSelectedInstallment(installment);
    setPaymentFormData({
      amountPaid: installment.installmentValue,
      paymentDate: new Date().toISOString().split('T')[0],
    });
    setOpenPaymentDialog(true);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'totalAmount' || name === 'paidAmount' || name === 'installmentValue') {
      const numericValue = value.replace(/[^0-9.]/g, '');
      setFormData(prev => ({ ...prev, [name]: numericValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePaymentInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (name === 'amountPaid') {
      const numericValue = value.replace(/[^0-9.]/g, '');
      setPaymentFormData(prev => ({ ...prev, [name]: numericValue }));
    } else {
      setPaymentFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const printPatient = async (installment: Installment) => {
    let iframe: HTMLIFrameElement | null = null
    try {
      const totalAmount = Number(installment.totalAmount || 0)
      const paidAmount = Number(installment.paidAmount || 0)
      const remainingAmount = Number(installment.remainingAmount || 0)

      const formatDate = (dateStr: string) => {
        if (!dateStr) return '-'
        return new Date(dateStr).toLocaleDateString('ku-IQ', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        })
      }

      const formatMoney = (amount: number) => {
        return `${amount.toLocaleString('en-US')} د.ع`
      }

      // Calculate initial payment (the amount paid when installment was created)
      const historyTotal = installment.paymentHistory?.reduce((sum, ph) => sum + Number(ph.amountPaid || 0), 0) || 0
      const initialPayment = Math.max(0, paidAmount - historyTotal)

      let paymentRows: string[] = []

      // Add initial payment row if exists
      if (initialPayment > 0) {
        paymentRows.push(`
          <tr>
            <td style="border:1px solid #d1d5db;padding:8px;text-align:center;">1</td>
            <td style="border:1px solid #d1d5db;padding:8px;">${installment.createdAt ? formatDate(installment.createdAt) : '-'}</td>
            <td style="border:1px solid #d1d5db;padding:8px;">${formatMoney(initialPayment)}</td>
          </tr>
        `)
      }

      // Add recorded payment history rows
      if (installment.paymentHistory && installment.paymentHistory.length > 0) {
        paymentRows.push(...installment.paymentHistory.map((ph: any, i: number) => `
          <tr>
            <td style="border:1px solid #d1d5db;padding:8px;text-align:center;">${initialPayment > 0 ? i + 2 : i + 1}</td>
            <td style="border:1px solid #d1d5db;padding:8px;">${formatDate(ph.paymentDate)}</td>
            <td style="border:1px solid #d1d5db;padding:8px;">${formatMoney(Number(ph.amountPaid))}</td>
          </tr>
        `))
      }

      const paymentRowsHtml = paymentRows.length > 0
        ? paymentRows.join('')
        : `<tr><td colspan="3" style="border:1px solid #d1d5db;padding:8px;text-align:center;">هیچ پارەدانێک تۆمار نەکراوە</td></tr>`

      const patientHtml = `
        <div id="pdf-patient" style="direction:rtl;font-family:Arial,sans-serif;background:#ffffff;color:#0f172a;padding:20px;width:900px;">
          <h1 style="margin:0 0 6px 0;text-align:center;font-size:24px;color:#0f172a;">شا سیستەم - زانیاری قیستی نەخۆش</h1>
          <p style="margin:0 0 20px 0;text-align:center;color:#475569;font-size:14px;">بەرواری پرێنت: ${new Date().toLocaleDateString("ku-IQ")}</p>

          <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">
            <thead>
              <tr>
                <th colspan="2" style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;text-align:center;font-weight:bold;">زانیاری نەخۆش</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border:1px solid #d1d5db;padding:8px;width:30%;background:#f9fafb;font-weight:bold;">ناوی نەخۆش:</td>
                <td style="border:1px solid #d1d5db;padding:8px;">${installment.patientName}</td>
              </tr>
            </tbody>
          </table>

          <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:20px;">
            <thead>
              <tr>
                <th colspan="2" style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;text-align:center;font-weight:bold;">زانیاری قیست</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style="border:1px solid #d1d5db;padding:8px;width:30%;background:#f9fafb;font-weight:bold;">کۆی گشتی:</td>
                <td style="border:1px solid #d1d5db;padding:8px;">${formatMoney(totalAmount)}</td>
              </tr>
              <tr>
                <td style="border:1px solid #d1d5db;padding:8px;background:#f9fafb;font-weight:bold;">بڕی دراو:</td>
                <td style="border:1px solid #d1d5db;padding:8px;">${formatMoney(paidAmount)}</td>
              </tr>
              <tr>
                <td style="border:1px solid #d1d5db;padding:8px;background:#f9fafb;font-weight:bold;">بڕی ماوە:</td>
                <td style="border:1px solid #d1d5db;padding:8px;">${formatMoney(remainingAmount)}</td>
              </tr>
            </tbody>
          </table>

          <h3 style="margin:20px 0 10px 0;font-size:16px;font-weight:bold;text-align:center;">لیستی پارەدانەکان</h3>
          <table style="width:100%;border-collapse:collapse;font-size:13px;">
            <thead>
              <tr>
                <th style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;text-align:center;">#</th>
                <th style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;text-align:center;">بەروار</th>
                <th style="border:1px solid #9ca3af;padding:8px;background:#f1f5f9;text-align:center;">بڕی پارە</th>
              </tr>
            </thead>
            <tbody>
              ${paymentRowsHtml}
            </tbody>
          </table>

          <div style="margin-top:40px;text-align:center;font-size:12px;color:#6b7280;border-top:1px solid #e5e7eb;padding-top:20px;">
            <p>ئەم راپۆرتە لەلایەن شا سیستەم دروستکراوە</p>
          </div>
        </div>
      `

      iframe = document.createElement("iframe")
      iframe.style.position = "fixed"
      iframe.style.right = "0"
      iframe.style.bottom = "0"
      iframe.style.width = "0"
      iframe.style.height = "0"
      iframe.style.border = "0"
      document.body.appendChild(iframe)

      const iframeDoc = iframe.contentDocument
      if (!iframeDoc) {
        throw new Error("iframe document is not available")
      }

      iframeDoc.open()
      iframeDoc.write(`<!doctype html><html><head><meta charset="utf-8"></head><body style="margin:0;background:#fff;">${patientHtml}</body></html>`)
      iframeDoc.close()

      await new Promise((resolve) => setTimeout(resolve, 120))

      const reportElement = iframeDoc.getElementById("pdf-patient")
      if (!reportElement) {
        throw new Error("report element is missing")
      }

      const canvas = await html2canvas(reportElement, {
        backgroundColor: "#ffffff",
        scale: 2,
        useCORS: true,
      })

      const image = canvas.toDataURL("image/jpeg", 0.95)
      const doc = new jsPDF("p", "mm", "a4")

      const pageWidth = doc.internal.pageSize.getWidth()
      const pageHeight = doc.internal.pageSize.getHeight()

      const margin = 10
      const width = pageWidth - margin * 2
      const ratio = width / canvas.width
      const imageHeight = canvas.height * ratio

      let remaining = imageHeight
      let y = margin

      doc.addImage(image, "JPEG", margin, y, width, imageHeight, undefined, "MEDIUM")
      remaining -= pageHeight - margin * 2

      while (remaining > 0) {
        doc.addPage()
        y = margin - (imageHeight - remaining)
        doc.addImage(image, "JPEG", margin, y, width, imageHeight, undefined, "MEDIUM")
        remaining -= pageHeight - margin * 2
      }

      const fileName = `patient-${installment.patientName.replace(/\s+/g, '_')}-${new Date().toISOString().slice(0, 10)}.pdf`
      doc.save(fileName)
      notifyPdfExported("PDF قیست")
    } catch (error) {
      console.error("PDF export error:", error)
      const errorMessage = error instanceof Error ? error.message : "unknown"
      notifyPdfError(`هەڵە لە دروستکردنی PDF: ${errorMessage}`)
    } finally {
      if (iframe && document.body.contains(iframe)) {
        document.body.removeChild(iframe)
      }
    }
  }

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

  // Calculate summary cards
  const totalDebt = installments.reduce((sum, installment) => {
    return sum + parseFloat(installment.remainingAmount || '0');
  }, 0);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const expectedThisMonth = installments.reduce((sum, installment) => {
    if (installment.nextPaymentDate) {
      const paymentDate = new Date(installment.nextPaymentDate);
      if (paymentDate.getMonth() === currentMonth && paymentDate.getFullYear() === currentYear) {
        return sum + parseFloat(installment.installmentValue || '0');
      }
    }
    return sum;
  }, 0);

  // Pagination handlers

  return (
    <div dir="rtl" className="space-y-8">


      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-destructive flex items-start gap-3">
          <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
        {/* Total Debt Card */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 rounded-2xl group-hover:opacity-100 transition duration-300" />
          <div className="relative bg-blue-50 dark:bg-slate-900 rounded-2xl p-5 transition-all duration-300 group-hover:shadow-lg border border-transparent hover:border-blue-200 dark:hover:border-slate-600">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Wallet className="size-6 text-white" />
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                قەرز
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">کۆی قەرزەکان لای نەخۆش</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{totalDebt.toLocaleString('en-US')} IQD</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                <div className="flex items-center gap-2">
                  <Wallet className="size-3.5 text-slate-500 dark:text-slate-400" />
                  <span className="text-xs text-slate-600 dark:text-slate-400">نەخۆش</span>
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">{installments.length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Expected This Month Card */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 opacity-0 rounded-2xl group-hover:opacity-100 transition duration-300" />
          <div className="relative bg-green-50 dark:bg-slate-900 rounded-2xl p-5 transition-all duration-300 group-hover:shadow-lg border border-transparent hover:border-green-200 dark:hover:border-slate-600">
            <div className="flex items-start justify-between mb-4">
              <div className="p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Calendar className="size-6 text-white" />
              </div>
              <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                ئەم مانگە
              </div>
            </div>
            <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">قیستە چاوەڕوانکراوەکانی ئەم مانگە</p>
            <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{expectedThisMonth.toLocaleString('en-US')} IQD</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                <div className="flex items-center gap-2">
                  <Calendar className="size-3.5 text-slate-500 dark:text-slate-400" />
                  <span className="text-xs text-slate-600 dark:text-slate-400">قیست</span>
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">{installments.filter(i => i.nextPaymentDate && new Date(i.nextPaymentDate).getMonth() === currentMonth && new Date(i.nextPaymentDate).getFullYear() === currentYear).length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Search and Add Button */}
      <div className="flex flex-row items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="absolute opacity-60 right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground  pointer-events-none" />
          <Input 
            type="text"
            placeholder="گەڕان بە ناوی نەخۆش یان بارودۆخ"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg opacity-60 border border-border/90 focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20 pr-10 h-10"
          />
        </div>
        <div className="flex items-center gap-2">
          <Select value={statusFilter} onValueChange={(value: 'all' | 'Paid' | 'Pending' | 'Overdue') => setStatusFilter(value)}>
            <SelectTrigger className="w-[140px] rounded-lg border border-border/90 py-2 px-3" size="default">
              <SelectValue placeholder="فلتەری بارودۆخ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">هەموو</SelectItem>
              <SelectItem value="Paid">پارەیان داوە</SelectItem>
              <SelectItem value="Pending">چاوەڕوانکراو</SelectItem>
              <SelectItem value="Overdue">دواکەوتوو</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            onClick={() => setOpenAddDialog(true)}
            className="bg-primary hover:shadow-lg hover:shadow-primary/30 active:scale-95 active:shadow-inner gap-2 text-white font-semibold px-4 py-4.5 whitespace-nowrap transition-all duration-150"
          >
            پلانێکی نوێ
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-border/90 overflow-hidden bg-card">
        <Table>
          <TableHeader className="bg-primary/5 border-b border-border/40">
            <TableRow className="hover:bg-primary/2 transition-colors">
              <TableHead className="text-right text-primary font-bold">ناوی نەخۆش</TableHead>
              <TableHead className="text-right text-primary font-bold">تەمەن</TableHead>
              <TableHead className="text-right text-primary font-bold">ژمارە تەلەفۆن</TableHead>
              <TableHead className="text-right text-primary font-bold">ناونیشان</TableHead>
              <TableHead className="text-right text-primary font-bold">کۆی گشتی</TableHead>
              <TableHead className="text-right text-primary font-bold">بڕی دراو</TableHead>
              <TableHead className="text-right text-primary font-bold">بڕی ماوە</TableHead>
              <TableHead className="text-right text-primary font-bold">قیستی مانگانە</TableHead>
              <TableHead className="text-right text-primary font-bold">بەرواری داهاتوو</TableHead>
              <TableHead className="text-right text-primary font-bold">بارودۆخ</TableHead>
              <TableHead className="text-center text-primary font-bold">کرداری</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedInstallments.length === 0 ? (
              <TableRow>
                <TableCell colSpan={11} className="text-center py-12 text-muted-foreground hover:bg-transparent">
                  <div className="flex flex-col items-center gap-2">
                    <Wallet className="w-12 h-12 opacity-30 mx-auto" />
                    <span className="text-lg">{searchTerm ? 'هیچ قیستێک نەدۆزرایەوە !' : 'هیچ قیست نیە'}</span>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              paginatedInstallments.map((installment, index) => (
                <TableRow
                  key={installment.id}
                  className={`transition-all duration-200 border-b border-gray-100 dark:border-gray-800 ${
                    index % 2 === 0
                      ? 'bg-white dark:bg-slate-950'
                      : 'bg-primary/2 dark:bg-slate-900/30'
                  } hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors`}
                >
                  <TableCell className="text-xs font-semibold text-foreground">{installment.patientName}</TableCell>
                  <TableCell className="text-xs font-semibold text-foreground/80">{installment.age || '-'}</TableCell>
                  <TableCell className="text-xs font-semibold text-foreground/80">{installment.phoneNumber || '-'}</TableCell>
                  <TableCell className="text-xs font-semibold text-foreground/80">{installment.address || '-'}</TableCell>
                  <TableCell className="text-xs font-semibold text-foreground/80">
                    {parseFloat(installment.totalAmount).toLocaleString('en-US')} IQD
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-foreground/80">
                    {parseFloat(installment.paidAmount).toLocaleString('en-US')} IQD
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-foreground/80">
                    {parseFloat(installment.remainingAmount).toLocaleString('en-US')} IQD
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-foreground/80">
                    {parseFloat(installment.installmentValue).toLocaleString('en-US')} IQD
                  </TableCell>
                  <TableCell className="text-xs font-semibold text-foreground/80">
                    {installment.nextPaymentDate ? (
                      new Date(installment.nextPaymentDate).toLocaleDateString('ku-IQ', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit'
                      })
                    ) : (
                      '-'
                    )}
                  </TableCell>
                  <TableCell className="text-foreground/70">
                    <span className={`inline-flex h-5 items-center justify-center whitespace-nowrap rounded-4xl px-2 py-0.5 text-xs font-semibold ${getStatusColor(installment.status)}`}>
                      {getStatusLabel(installment.status)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openPaymentModal(installment)}
                        className="text-green-600 hover:bg-green-50 hover:text-green-700 dark:hover:bg-green-900"
                        disabled={installment.status === 'Paid'}
                        title="تۆمارکردنی قیست"
                      >
                        <DollarSign className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteConfirm(installment.id)}
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

      {/* Add Installment Dialog */}
      <Dialog open={openAddDialog} onOpenChange={(open) => {
        setOpenAddDialog(open);
        if (!open) {
          setFormData({
            patientName: '',
            totalAmount: '',
            paidAmount: '0',
            installmentValue: '',
            nextPaymentDate: '',
            age: '',
            phoneNumber: '',
            address: '',
          });
        }
      }}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>زیادکردنی پلانی قیست</DialogTitle>
            <DialogDescription>
              زانیاریەکانی پلانی قیست نوێەکە بنووسە
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddInstallment} className="space-y-4">
            <div className="space-y-3">
              <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:col-span-1">ناوی نەخۆش</label>
                <Input
                  className="sm:col-span-2"
                  name="patientName"
                  value={formData.patientName}
                  onChange={handleInputChange}
                  placeholder="ناوی نەخۆش"
                  required
                />
              </div>

              <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:col-span-1">تەمەن</label>
                <Input
                  className="sm:col-span-2"
                  name="age"
                  value={formData.age}
                  onChange={handleInputChange}
                  placeholder="تەمەن"
                />
              </div>

              <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:col-span-1">ژمارە تەلەفۆن</label>
                <Input
                  className="sm:col-span-2"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="ژمارە تەلەفۆن"
                />
              </div>

              <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:col-span-1">ناونیشان</label>
                <Input
                  className="sm:col-span-2"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="ناونیشان"
                />
              </div>

              <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:col-span-1"> کۆی گشتی</label>
                <div className="sm:col-span-2 relative">
                  <Input
                    className="pr-10"
                    name="totalAmount"
                    type="text"
                    step="0.01"
                    value={formData.totalAmount ? formatNumber(formData.totalAmount) : ''}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, totalAmount: '' }))}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:col-span-1">بڕی دراو</label>
                <div className="sm:col-span-2 relative">
                  <Input
                    className="pr-10"
                    name="paidAmount"
                    type="text"
                    step="0.01"
                    value={formData.paidAmount ? formatNumber(formData.paidAmount) : ''}
                    onChange={handleInputChange}
                    placeholder="0"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, paidAmount: '0' }))}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:col-span-1">قیستی مانگانە</label>
                <div className="sm:col-span-2 relative">
                  <Input
                    className="pr-10"
                    name="installmentValue"
                    type="text"
                    step="0.01"
                    value={formData.installmentValue ? formatNumber(formData.installmentValue) : ''}
                    onChange={handleInputChange}
                    placeholder="0.00"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setFormData(prev => ({ ...prev, installmentValue: '' }))}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:col-span-1">بەرواری داهاتوو</label>
                <Input
                  className="sm:col-span-2"
                  name="nextPaymentDate"
                  type="date"
                  value={formData.nextPaymentDate}
                  onChange={handleInputChange}
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
                onClick={() => setOpenAddDialog(false)}
              >
                داخستن
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Record Payment Dialog */}
      <Dialog open={openPaymentDialog} onOpenChange={(open) => {
        setOpenPaymentDialog(open);
        if (!open) {
          setSelectedInstallment(null);
          setPaymentFormData({
            amountPaid: '',
            paymentDate: new Date().toISOString().split('T')[0],
          });
        }
      }}>
        <DialogContent dir="rtl" className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>تۆمارکردنی قیست</DialogTitle>
            <DialogDescription>
              {selectedInstallment && `تۆمارکردنی قیست بۆ ${selectedInstallment.patientName}`}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleRecordPayment} className="space-y-4">
            <div className="space-y-3">
              {selectedInstallment && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm text-muted-foreground">
                    بڕی ماوە: <span className="font-bold text-foreground">{parseFloat(selectedInstallment.remainingAmount).toLocaleString('en-US')} IQD</span>
                  </p>
                </div>
              )}

              <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:col-span-1">بڕی پارە</label>
                <div className="sm:col-span-2 relative">
                  <Input
                    className="pr-10"
                    name="amountPaid"
                    type="text"
                    step="0.01"
                    value={paymentFormData.amountPaid ? formatNumber(paymentFormData.amountPaid) : ''}
                    onChange={handlePaymentInputChange}
                    placeholder="0.00"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setPaymentFormData(prev => ({ ...prev, amountPaid: '' }))}
                    className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 items-center gap-2 sm:grid-cols-3">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300 sm:col-span-1">بەرواری پارەدان</label>
                <Input
                  className="sm:col-span-2"
                  name="paymentDate"
                  type="date"
                  value={paymentFormData.paymentDate}
                  onChange={handlePaymentInputChange}
                  required
                />
              </div>
            </div>

            <div className="flex gap-2 pt-4">
              <Button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-primary hover:shadow-lg hover:shadow-primary/30 text-white font-semibold"
              >
                {submitting ? 'چونەژوورەوە...' : 'تۆمارکردن'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => setOpenPaymentDialog(false)}
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
            <div className="shrink-0">
              <div className="flex items-center justify-center h-12 w-12 rounded-full bg-destructive/10">
                <AlertCircle className="h-6 w-6 text-destructive" />
              </div>
            </div>
            
            <div className="space-y-2">
              <DialogTitle className="text-destructive text-lg font-bold">سڕینەوەی قیست</DialogTitle>
              <DialogDescription className="text-sm text-muted-foreground">
                ئایا دڵنیایت لە سڕینەوەی ئەم قیستە؟ ئەم کردارە ناگەڕێتەوە.
              </DialogDescription>
            </div>
            
            <div className="w-full p-4 bg-destructive/5 border border-destructive/20 rounded-lg">
              {deleteConfirm !== null && 
                installments.find(i => i.id === deleteConfirm)?.patientName && (
                <p className="font-bold text-destructive text-base">
                  {installments.find(i => i.id === deleteConfirm)?.patientName}
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
                onClick={() => deleteConfirm && handleDeleteInstallment(deleteConfirm)}
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
