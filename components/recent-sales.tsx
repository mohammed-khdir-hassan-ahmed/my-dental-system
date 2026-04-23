"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ShoppingCartIcon, TrendingUpIcon } from "lucide-react"
import { useEffect, useState } from "react"

interface SalesData {
  totalMonthSales: number
  totalMonthProfit: number
  recentSales: Array<{
    id: number
    productName: string
    category: string
    price: number
    quantity: number
    totalPrice: number
    profit: number
    date: string
  }>
}

type TimePeriod = 'month' | 'week' | 'today' | 'all'

export function RecentSales() {
  const [data, setData] = useState<SalesData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month')

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/dashboard/recent-sales?period=${timePeriod}`)
        const result = await response.json()
        setData(result.data)
      } catch (error) {
        console.error('Error fetching recent sales:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [timePeriod])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ku-IQ', { style: 'currency', currency: 'IQD', maximumFractionDigits: 0 }).format(amount)
  }

  if (loading || !data) {
    return (
      <Card className="border-0 shadow-xl bg-white dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">فرۆشتن</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-xl bg-white dark:bg-slate-900">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">فرۆشتن</CardTitle>
          <Select value={timePeriod} onValueChange={(value: TimePeriod) => setTimePeriod(value)}>
            <SelectTrigger size="sm" className="w-fit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="month">ئەم مانگە</SelectItem>
              <SelectItem value="week">ئەم حەفتەیە</SelectItem>
              <SelectItem value="today">ئەمڕۆ</SelectItem>
              <SelectItem value="all">سەرجەم</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <ShoppingCartIcon className="size-5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">فرۆشتی مانگ</span>
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(data.totalMonthSales)}</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUpIcon className="size-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">قازانج</span>
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(data.totalMonthProfit)}</p>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">دواین فرۆشتنەکان</p>
          {data.recentSales.slice(0, 5).map((sale) => (
            <div key={sale.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{sale.productName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{sale.category} × {sale.quantity}</p>
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(sale.totalPrice)}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
