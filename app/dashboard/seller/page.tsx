'use client';

import { useEffect, useMemo, useState } from 'react';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import {
  notifySaleAdded,
  notifySaleUpdated,
  notifySaleDeleted,
  notifyActionError,
  notifyPdfExported,
  notifyPdfError,
} from '@/lib/notify';
import { getOfflineQueue, addToOfflineQueue } from '@/lib/offline-sync';
import { toast } from '@/lib/toast';
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
import { ArrowUpDown, ArrowUp, ArrowDown, Plus, Trash2, Pencil, TrendingUp, Package } from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/pagination';
import { type Sale, type ProductCategory, defaultCategories } from '@/lib/types/product';
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

interface SaleFormData {
  productName: string;
  category: ProductCategory;
  price: string;
  quantity: string;
  date: string;
  notes: string;
}

const formatMoney = (value: number) => {
  const formatted = Number(value).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  return `${formatted} د.ع`;
};

const formatNumberWithCommas = (value: string) => {
  const cleaned = value.replace(/,/g, '');
  if (!cleaned) return '';
  return Number(cleaned).toLocaleString('en-US');
};

const stripCommas = (value: string) => {
  return value.replace(/,/g, '');
};

const formatDate = (dateStr: string) => {
  return new Date(dateStr).toLocaleDateString('ku-IQ');
};

const getToday = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const getYesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const getLastMonthStart = () => {
  const d = new Date();
  d.setMonth(d.getMonth() - 1);
  d.setDate(1);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};
const getLastMonthEnd = () => {
  const d = new Date();
  d.setDate(0);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export default function SellerPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [timePeriod, setTimePeriod] = useState<'month' | 'week' | 'today' | 'all' | 'custom'>('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [paginationPage, setPaginationPage] = useState(1);
  const [paginationPageSize, setPaginationPageSize] = useState(10);
  const [queueVersion, setQueueVersion] = useState(0);
  const [offlineItems, setOfflineItems] = useState<any[]>([]);

  useEffect(() => {
    const handleQueueChange = () => setQueueVersion(v => v + 1);
    window.addEventListener('offline-queue-changed', handleQueueChange);
    window.addEventListener('offline-sync-complete', () => fetchSales(searchQuery));
    return () => {
      window.removeEventListener('offline-queue-changed', handleQueueChange);
      window.removeEventListener('offline-sync-complete', () => fetchSales(searchQuery));
    };
  }, [searchQuery]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [editingSale, setEditingSale] = useState<Sale | null>(null);
  const [deletingSale, setDeletingSale] = useState<Sale | null>(null);
  const [customCategory, setCustomCategory] = useState('');
  const [showCustomCategory, setShowCustomCategory] = useState(false);
  const [categories, setCategories] = useState<ProductCategory[]>(defaultCategories);

  const [formData, setFormData] = useState<SaleFormData>({
    productName: '',
    category: '',
    price: '',
    quantity: '1',
    date: getToday(),
    notes: '',
  });

  useEffect(() => {
    const items = getOfflineQueue()
      .filter((item) => item.type === 'sale' && item.action === 'create')
      .map((item) => ({
        id: item.id as any,
        productId: 0,
        productName: item.body.productName,
        category: item.body.category,
        price: item.body.price,
        quantity: item.body.quantity,
        totalPrice: item.body.price * item.body.quantity,
        profit: item.body.price * item.body.quantity,
        date: item.body.date,
        notes: item.body.notes,
        pending_sync: true,
      }));
    setOfflineItems(items);
  }, [queueVersion]);

  // Memoized calculations - must be called before any conditional logic
  const mergedSales = useMemo(() => {
    return [...offlineItems, ...sales];
  }, [sales, offlineItems]);

  const totalPages = useMemo(() => Math.ceil(mergedSales.length / paginationPageSize) || 1, [mergedSales.length, paginationPageSize]);
  const startIndex = useMemo(() => (paginationPage - 1) * paginationPageSize, [paginationPage, paginationPageSize]);
  const endIndex = useMemo(() => startIndex + paginationPageSize, [startIndex, paginationPageSize]);

  const paginatedSales = useMemo(() => {
    return mergedSales.slice(startIndex, endIndex);
  }, [mergedSales, startIndex, endIndex]);

  const handlePageChange = (newPage: number) => {
    setPaginationPage(newPage);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPaginationPageSize(newPageSize);
    setPaginationPage(1);
  };

  // Load from API
  const fetchSales = async (search = '') => {
    try {
      setLoading(true);
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

      const response = await fetch(`/api/sales${params.toString() ? `?${params.toString()}` : ''}`);
      if (!response.ok) {
        throw new Error('هەڵە لە هێنانی فرۆشتنەکاندا');
      }

      const data = await response.json();
      setSales(data);
    } catch (error) {
      console.error('Error fetching sales:', error);
      notifyActionError('هەڵە لە هێنانی فرۆشتنەکان');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales(searchQuery);
  }, [searchQuery, timePeriod, customStartDate, customEndDate]);

  
  // Calculate profits
  const todayProfit = useMemo(() => {
    const today = getToday();
    return mergedSales
      .filter(s => s.date === today)
      .reduce((sum, s) => sum + Number(s.profit), 0);
  }, [mergedSales]);

  const yesterdayProfit = useMemo(() => {
    const yesterday = getYesterday();
    return mergedSales
      .filter(s => s.date === yesterday)
      .reduce((sum, s) => sum + Number(s.profit), 0);
  }, [mergedSales]);

  const lastMonthProfit = useMemo(() => {
    const start = getLastMonthStart();
    const end = getLastMonthEnd();
    return mergedSales
      .filter(s => s.date >= start && s.date <= end)
      .reduce((sum, s) => sum + Number(s.profit), 0);
  }, [mergedSales]);

  const totalProfit = useMemo(() => {
    return mergedSales.reduce((sum, s) => sum + Number(s.profit), 0);
  }, [mergedSales]);

  // Handlers
  const handleOpenForm = (sale?: Sale) => {
    if (sale) {
      setEditingSale(sale);
      setFormData({
        productName: sale.productName,
        category: sale.category,
        price: sale.price.toString(),
        quantity: sale.quantity.toString(),
        date: sale.date,
        notes: sale.notes || '',
      });
    } else {
      setEditingSale(null);
      setFormData({
        productName: '',
        category: '',
        price: '',
        quantity: '1',
        date: getToday(),
        notes: '',
      });
    }
    setShowCustomCategory(false);
    setCustomCategory('');
    setIsFormOpen(true);
  };

  const handleSaveSale = async () => {
    if (!formData.productName.trim()) {
      notifyActionError('تکایە ناوی کاڵا بنووسە', 'فۆرم ناتەواو');
      return;
    }
    if (!formData.category && !customCategory) {
      notifyActionError('تکایە کاتیگۆری هەڵبژێرە', 'فۆرم ناتەواو');
      return;
    }
    const cleanedPrice = stripCommas(formData.price);
    if (!cleanedPrice || isNaN(Number(cleanedPrice)) || Number(cleanedPrice) <= 0) {
      notifyActionError('تکایە نرخی دروست بنووسە', 'فۆرم ناتەواو');
      return;
    }
    if (!formData.date) {
      notifyActionError('تکایە بەرواری فرۆشتن دیاری بکە', 'فۆرم ناتەواو');
      return;
    }

    const finalCategory = showCustomCategory ? customCategory : formData.category;

    if (showCustomCategory && customCategory && !categories.includes(customCategory)) {
      setCategories(prev => [...prev, customCategory]);
    }

    try {
      const saleData = {
        productName: formData.productName.trim(),
        category: finalCategory,
        price: Number(cleanedPrice),
        quantity: Number(formData.quantity) || 1,
        date: formData.date,
        notes: formData.notes.trim(),
      };

      if (!navigator.onLine) {
        addToOfflineQueue(
          'sale',
          editingSale ? 'update' : 'create',
          editingSale ? `/api/sales` : '/api/sales',
          editingSale ? 'PUT' : 'POST',
          editingSale ? { ...saleData, id: editingSale.id } : saleData
        );
        toast.success("داتاکان بە شێوازی ئۆفلایین پاشکەوت کران");
        setIsFormOpen(false);
        return;
      }

      let response;
      try {
        if (editingSale) {
          response = await fetch(`/api/sales`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...saleData, id: editingSale.id }),
          });
        } else {
          response = await fetch('/api/sales', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(saleData),
          });
        }
      } catch (fetchErr) {
        addToOfflineQueue(
          'sale',
          editingSale ? 'update' : 'create',
          editingSale ? `/api/sales` : '/api/sales',
          editingSale ? 'PUT' : 'POST',
          editingSale ? { ...saleData, id: editingSale.id } : saleData
        );
        toast.success("داتاکان بە شێوازی ئۆفلایین پاشکەوت کران");
        setIsFormOpen(false);
        return;
      }

      if (!response.ok) {
        if (response.status >= 500) {
          addToOfflineQueue(
            'sale',
            editingSale ? 'update' : 'create',
            editingSale ? `/api/sales` : '/api/sales',
            editingSale ? 'PUT' : 'POST',
            editingSale ? { ...saleData, id: editingSale.id } : saleData
          );
          toast.success("داتاکان بە شێوازی ئۆفلایین پاشکەوت کران");
          setIsFormOpen(false);
          return;
        }
        throw new Error('هەڵە لە تۆمارکردنی فرۆشتن');
      }

      await fetchSales(searchQuery);
      if (editingSale) {
        notifySaleUpdated(saleData.productName);
      } else {
        notifySaleAdded(saleData.productName, saleData.price, saleData.quantity);
      }
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error saving sale:', error);
      notifyActionError('هەڵە لە تۆمارکردنی فرۆشتن');
    }
  };

  const handleDeleteClick = (sale: Sale) => {
    setDeletingSale(sale);
    setIsDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (deletingSale) {
      try {
        const response = await fetch(`/api/sales?id=${deletingSale.id}`, {
          method: 'DELETE',
        });

        if (!response.ok) {
          throw new Error('هەڵە لە سڕینەوەی فرۆشتن');
        }

        const total = Number(deletingSale.totalPrice) || Number(deletingSale.price) * Number(deletingSale.quantity)
        notifySaleDeleted(deletingSale.productName, total)
        await fetchSales(searchQuery);
        setIsDeleteDialogOpen(false);
        setDeletingSale(null);
      } catch (error) {
        console.error('Error deleting sale:', error);
        notifyActionError('هەڵە لە سڕینەوەی فرۆشتن');
      }
    }
  };

  const exportPDF = async () => {
    if (sales.length === 0) {
      notifyActionError('هیچ داتایەک نییە بۆ PDF', 'PDF');
      return;
    }

    const element = document.getElementById('sales-report');
    if (!element) return;

    try {
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth - 20;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'JPEG', 10, 10, imgWidth, imgHeight);
      pdf.save(`frushiten-report-${getToday()}.pdf`);
      notifyPdfExported('PDF فرۆشتن');
    } catch (error) {
      notifyPdfError('هەڵە لە دروستکردنی PDF');
    }
  };

  return (
    <DashboardPageShell>
      {/* Stats Cards */}
      <div className={`${mobileStatsGrid} ${mobileInset}`}>
        {/* Today's Sales Card */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-emerald-500 opacity-0 rounded-2xl group-hover:opacity-100 transition duration-300" />
          <div className="relative bg-green-50 dark:bg-slate-900 rounded-xl sm:rounded-2xl p-3 sm:p-5 transition-all duration-300 group-hover:shadow-lg border border-transparent hover:border-green-200 dark:hover:border-slate-600 h-full">
            <div className="flex items-start justify-between mb-2 sm:mb-4">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg sm:rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <TrendingUp className="size-4 sm:size-6 text-white" />
              </div>
              <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-bold bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">
                ئەمڕۆ
              </div>
            </div>
            <p className="text-[11px] sm:text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">فرۆشتنی ئەمرۆ</p>
            <h3 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white mb-2 sm:mb-4">{formatMoney(todayProfit)}</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                <div className="flex items-center gap-2">
                  <TrendingUp className="size-3.5 text-slate-500 dark:text-slate-400" />
                  <span className="text-xs text-slate-600 dark:text-slate-400">فرۆشتن</span>
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">{mergedSales.filter(s => s.date === getToday()).length}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Total Sales Card */}
        <div className="relative group">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 rounded-2xl group-hover:opacity-100 transition duration-300" />
          <div className="relative bg-blue-50 dark:bg-slate-900 rounded-xl sm:rounded-2xl p-3 sm:p-5 transition-all duration-300 group-hover:shadow-lg border border-transparent hover:border-blue-200 dark:hover:border-slate-600 h-full">
            <div className="flex items-start justify-between mb-2 sm:mb-4">
              <div className="p-2 sm:p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg sm:rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
                <Package className="size-4 sm:size-6 text-white" />
              </div>
              <div className="flex items-center gap-1 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">
                کۆی
              </div>
            </div>
            <p className="text-[11px] sm:text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">کۆی فرۆشتن</p>
            <h3 className="text-lg sm:text-2xl font-bold text-slate-900 dark:text-white mb-2 sm:mb-4">{formatMoney(totalProfit)}</h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
                <div className="flex items-center gap-2">
                  <Package className="size-3.5 text-slate-500 dark:text-slate-400" />
                  <span className="text-xs text-slate-600 dark:text-slate-400">فرۆشتن</span>
                </div>
                <span className="text-sm font-semibold text-slate-900 dark:text-white">{mergedSales.length}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <MobileListToolbar
        searchValue={searchQuery}
        onSearchChange={setSearchQuery}
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
            onClick={() => handleOpenForm()}
            className={`flex-1 sm:flex-none gap-1.5 bg-primary text-primary-foreground hover:bg-primary/90 px-3 sm:px-4 whitespace-nowrap ${mobileBtn}`}
          >
            <Plus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            زیادکردنی فرۆشتن
          </Button>
        }
      />

      {/* Sales Table */}
      <div className={mobileTableShell}>
        <div className={mobileTableScroll}>
          <Table className={mobileTableMin}>
            <TableHeader className="bg-primary/5 border-b border-border/40">
              <TableRow className="hover:bg-primary/2 transition-colors">
                <TableHead className={mobileTh}>ناوی کاڵا</TableHead>
                <TableHead className={mobileTh}>پۆل</TableHead>
                <TableHead className={mobileTh}>نرخی فرۆشتن</TableHead>
                <TableHead className={mobileTh}>بڕی فرۆشتن</TableHead>
                <TableHead className={mobileTh}>بەروار</TableHead>
                <TableHead className={`${mobileTh} text-center`}>کردارەکان</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-12 text-muted-foreground hover:bg-transparent">
                    هیچ فرۆشتنێک نەدۆزرایەوە.
                  </TableCell>
                </TableRow>
              ) : (
                paginatedSales.map((sale, index) => (
                  <TableRow
                    key={sale.id}
                    className={`transition-all duration-200 border-b border-gray-100 dark:border-gray-800 ${
                      index % 2 === 0
                        ? 'bg-white dark:bg-slate-950'
                        : 'bg-primary/2 dark:bg-slate-900/30'
                    } hover:bg-primary/5 dark:hover:bg-primary/10 transition-colors`}
                  >
                    <TableCell className={mobileTdPrimary}>
                      <div className="flex items-center gap-2">
                        <span>{sale.productName}</span>
                        {sale.pending_sync && (
                          <span className="inline-flex h-4 items-center justify-center rounded bg-amber-50 px-1.5 text-[9px] font-bold text-amber-600 dark:bg-amber-950/30 dark:text-amber-400 border border-amber-200/40 shrink-0">
                            <span className="h-1 w-1 rounded-full bg-amber-500 animate-pulse mr-1" />
                            لە چاوەڕوانیدا
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className={mobileTd}>
                      <span className="inline-flex h-5 items-center justify-center whitespace-nowrap rounded-4xl bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        {sale.category}
                      </span>
                    </TableCell>
                    <TableCell className={mobileTd}>{formatMoney(Number(sale.price))}</TableCell>
                    <TableCell className={mobileTd}>{sale.quantity}</TableCell>
                    <TableCell className={mobileTd}>
                      {new Date(sale.date).toLocaleDateString('ku-IQ', {
                        year: 'numeric',
                        month: '2-digit',
                        day: '2-digit',
                      })}
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenForm(sale)}
                          className="text-blue-600 hover:bg-blue-50 hover:text-blue-700 dark:hover:bg-blue-900"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteClick(sale)}
                          className="text-red-600 hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900"
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

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className={mobileDialogContent} dir="rtl">
          <DialogHeader>
            <DialogTitle className='text-center'>{editingSale ? 'دەستکاری فرۆشتن' : 'فرۆشتنی نوێ'}</DialogTitle>
            <DialogDescription className='text-center'>
              زانیارییەکانی فرۆشتن بنووسە
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">ناوی کاڵا</label>
              <Input
                value={formData.productName}
                onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                placeholder="ناوی کاڵا بنووسە"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">کەتیگۆری</label>
              {!showCustomCategory ? (
                <Select
                  value={formData.category}
                  onValueChange={(value) => {
                    if (value === 'custom') {
                      setShowCustomCategory(true);
                      setFormData({ ...formData, category: '' });
                    } else {
                      setFormData({ ...formData, category: value });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="کەتیگۆری هەڵبژێرە" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                    <SelectItem value="custom">+ کاتیگۆری نوێ</SelectItem>
                  </SelectContent>
                </Select>
              ) : (
                <div className="flex gap-2">
                  <Input
                    value={customCategory}
                    onChange={(e) => setCustomCategory(e.target.value)}
                    placeholder="ناوی کاتیگۆری نوێ بنووسە..."
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setShowCustomCategory(false);
                      setCustomCategory('');
                    }}
                  >
                    گەڕانەوە
                  </Button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">نرخی فرۆشتن</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={formatNumberWithCommas(formData.price)}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9]/g, '');
                    setFormData({ ...formData, price: value });
                  }}
                  placeholder="0"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">ژمارەی دانە</label>
                <Input
                  type="number"
                  value={formData.quantity}
                  onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                  placeholder="1"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">بەرواری فرۆشتن</label>
              <Input
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                max={getToday()}
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">تێبینی</label>
              <Input
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="تێبینی (ئارەزوومەندانەیە)"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsFormOpen(false)}>
              پاشگەزبوونەوە
            </Button>
            <Button
              onClick={handleSaveSale}
              className="bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={!formData.productName || (!formData.category && !customCategory) || !formData.price || !formData.date}
            >
              {editingSale ? 'نوێکردنەوە' : 'تۆمارکردن'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className={mobileDialogContent} dir="rtl">
          <DialogHeader>
            <DialogTitle className="text-sm sm:text-base">سڕینەوەی فرۆشتن</DialogTitle>
            <DialogDescription>
              ئایا دڵنیای لە سڕینەوەی ئەم فرۆشتنە؟
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
              پاشگەزبوونەوە
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDelete}
            >
              سڕینەوە
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardPageShell>
  );
}
