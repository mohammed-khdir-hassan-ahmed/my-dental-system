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
import { ArrowUpDown, ArrowUp, ArrowDown, Search, Plus, Trash2, Pencil, TrendingUp, Package } from 'lucide-react';
import { usePagination } from '@/hooks/usePagination';
import { Pagination } from '@/components/pagination';
import { type Sale, type ProductCategory, defaultCategories } from '@/lib/types/product';

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

  // Memoized calculations - must be called before any conditional logic
  const totalPages = useMemo(() => Math.ceil(sales.length / paginationPageSize) || 1, [sales.length, paginationPageSize]);
  const startIndex = useMemo(() => (paginationPage - 1) * paginationPageSize, [paginationPage, paginationPageSize]);
  const endIndex = useMemo(() => startIndex + paginationPageSize, [startIndex, paginationPageSize]);

  const paginatedSales = useMemo(() => {
    return sales.slice(startIndex, endIndex);
  }, [sales, startIndex, endIndex]);

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
      toast.error('هەڵە لە هێنانی فرۆشتنەکان');
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
    return sales
      .filter(s => s.date === today)
      .reduce((sum, s) => sum + Number(s.profit), 0);
  }, [sales]);

  const yesterdayProfit = useMemo(() => {
    const yesterday = getYesterday();
    return sales
      .filter(s => s.date === yesterday)
      .reduce((sum, s) => sum + Number(s.profit), 0);
  }, [sales]);

  const lastMonthProfit = useMemo(() => {
    const start = getLastMonthStart();
    const end = getLastMonthEnd();
    return sales
      .filter(s => s.date >= start && s.date <= end)
      .reduce((sum, s) => sum + Number(s.profit), 0);
  }, [sales]);

  const totalProfit = useMemo(() => {
    return sales.reduce((sum, s) => sum + Number(s.profit), 0);
  }, [sales]);

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
      toast.error('تکایە ناوی کاڵا بنووسە');
      return;
    }
    if (!formData.category && !customCategory) {
      toast.error('تکایە کاتیگۆری هەڵبژێرە');
      return;
    }
    const cleanedPrice = stripCommas(formData.price);
    if (!cleanedPrice || isNaN(Number(cleanedPrice)) || Number(cleanedPrice) <= 0) {
      toast.error('تکایە نرخی دروست بنووسە');
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

      let response;
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

      if (!response.ok) {
        throw new Error('هەڵە لە تۆمارکردنی فرۆشتن');
      }

      await fetchSales(searchQuery);
      toast.success(editingSale ? 'فرۆشتن بە سەرکەوتوویی نوێکرایەوە' : 'فرۆشتن بە سەرکەوتوویی تۆمارکرا');
      setIsFormOpen(false);
    } catch (error) {
      console.error('Error saving sale:', error);
      toast.error('هەڵە لە تۆمارکردنی فرۆشتن');
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

        await fetchSales(searchQuery);
        toast.success('فرۆشتن بە سەرکەوتوویی سڕایەوە');
        setIsDeleteDialogOpen(false);
        setDeletingSale(null);
      } catch (error) {
        console.error('Error deleting sale:', error);
        toast.error('هەڵە لە سڕینەوەی فرۆشتن');
      }
    }
  };

  const exportPDF = async () => {
    if (sales.length === 0) {
      toast.error('هیچ داتایەک نییە بۆ PDF');
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
      toast.success('PDF بە سەرکەوتوویی دابەزێنرا');
    } catch (error) {
      toast.error('هەڵە لە دروستکردنی PDF');
    }
  };

  return (
    <div className="space-y-6" dir="rtl">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
             <Card className="border border-green-500 shadow-lg p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs sm:text-sm text-green-600 dark:text-green-400">فرۆشتنی ئەمرۆ</p>
              <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-green-900 dark:text-green-100">
                {formatMoney(todayProfit)}
              </p>
            </div>
            <TrendingUp className="h-8 w-8 sm:h-10 sm:w-10 text-green-500" />
          </div>
        </Card>
        <Card className="border border-primary shadow-lg p-4 sm:p-6">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-xs sm:text-sm text-primary">کۆی فرۆشتن</p>
              <p className="mt-1 sm:mt-2 text-xl sm:text-2xl font-bold text-primary">
                {formatMoney(todayProfit)}
              </p>
            </div>
            <Package className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
          </div>
        </Card>


      </div>

      {/* Search and Add Button */}
      <div className="flex flex-row items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="گەڕان بە ناوی کاڵا یان کەتیگۆری"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pr-10 text-sm h-10"
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
          onClick={() => handleOpenForm()}
          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 px-4 py-2 whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          زیادکردنی فرۆشتن
        </Button>
      </div>

      {/* Sales Table */}
      <div className="rounded-xl border border-border/40 shadow-lg overflow-hidden bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="bg-primary/5 border-b border-border/40">
              <TableRow className="hover:bg-primary/2 transition-colors">
                <TableHead className="text-right text-primary font-bold">ناوی کاڵا</TableHead>
                <TableHead className="text-right text-primary font-bold">پۆل</TableHead>
                <TableHead className="text-right text-primary font-bold">نرخی فرۆشتن</TableHead>
                <TableHead className="text-right text-primary font-bold">بڕی فرۆشتن</TableHead>
                <TableHead className="text-right text-primary font-bold">بەروار</TableHead>
                <TableHead className="text-center text-primary font-bold">کردارەکان</TableHead>
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
                    <TableCell className="text-xs font-semibold text-foreground">{sale.productName}</TableCell>
                    <TableCell className="text-xs font-semibold text-foreground/80">
                      <span className="inline-flex h-5 items-center justify-center whitespace-nowrap rounded-4xl bg-primary/10 px-2 py-0.5 text-xs font-semibold text-primary">
                        {sale.category}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-foreground/80">{formatMoney(Number(sale.price))}</TableCell>
                    <TableCell className="text-xs font-semibold text-foreground/80">{sale.quantity}</TableCell>
                    <TableCell className="text-xs font-semibold text-foreground/80">
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

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-md" dir="rtl">
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
                  value={formData.price.replace(/,/g, '')}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^0-9.]/g, '');
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
              disabled={!formData.productName || (!formData.category && !customCategory) || !formData.price}
            >
              {editingSale ? 'نوێکردنەوە' : 'تۆمارکردن'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent dir="rtl">
          <DialogHeader>
            <DialogTitle>سڕینەوەی فرۆشتن</DialogTitle>
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
    </div>
  );
}
