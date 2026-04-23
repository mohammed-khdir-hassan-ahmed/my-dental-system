"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { TrendingDownIcon } from "lucide-react"
import { useEffect, useState } from "react"

interface ExpenseData {
  totalExpenses: number
  expensesByCategory: Array<{
    category: string
    amount: number
    percentage: number
  }>
  recentExpenses: Array<{
    id: string
    title: string
    category: string
    amount: number
    date: string
    paymentMethod: string
  }>
}

type TimePeriod = 'month' | 'week' | 'today' | 'all'

export function ExpensesSummary() {
  const [data, setData] = useState<ExpenseData | null>(null)
  const [loading, setLoading] = useState(true)
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month')

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/dashboard/expenses-summary?period=${timePeriod}`)
        const result = await response.json()
        setData(result.data)
      } catch (error) {
        console.error('Error fetching expenses summary:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [timePeriod])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ku-IQ', { style: 'currency', currency: 'IQD', maximumFractionDigits: 0 }).format(amount)
  }

  const categoryColors: Record<string, string> = {
    'کەرەستەی پزیشکی': 'bg-red-500',
    'کرێ و خزمەتگوزاری': 'bg-orange-500',
    'مووچە': 'bg-blue-500',
    'چاککردنەوە': 'bg-purple-500',
    'خەرجی گشتی': 'bg-slate-500',
  }

  if (loading || !data) {
    return (
      <Card className="border-0 shadow-xl bg-white dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">خەرجییەکان</CardTitle>
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
          <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">خەرجییەکان</CardTitle>
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
        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <TrendingDownIcon className="size-5 text-red-600 dark:text-red-400" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">کۆی خەرجی ئەم مانگە</span>
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(data.totalExpenses)}</p>
          </div>
        </div>
        <div className="space-y-3 mb-4">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">بەپێی پۆلێن</p>
          {data.expensesByCategory.map((item, index) => (
            <div key={index} className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.category}</span>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(item.amount)}</span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{item.percentage}%</span>
                </div>
              </div>
              <div className="h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${categoryColors[item.category] || 'bg-slate-500'} rounded-full transition-all duration-500`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">دواین خەرجییەکان</p>
          {data.recentExpenses.slice(0, 3).map((expense) => (
            <div key={expense.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{expense.title}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{expense.category}</p>
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(expense.amount)}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
