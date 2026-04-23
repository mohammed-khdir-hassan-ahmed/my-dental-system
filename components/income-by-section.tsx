"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useEffect, useState } from "react"

interface IncomeData {
  section: string
  amount: number
  percentage: number
}

type TimePeriod = 'month' | 'week' | 'today' | 'all'

export function IncomeBySection() {
  const [data, setData] = useState<IncomeData[]>([])
  const [loading, setLoading] = useState(true)
  const [timePeriod, setTimePeriod] = useState<TimePeriod>('month')

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch(`/api/dashboard/income-sections?period=${timePeriod}`)
        const result = await response.json()
        setData(result.data || [])
      } catch (error) {
        console.error('Error fetching income sections:', error)
        // Fallback data
        setData([
          { section: 'فرۆشتن', amount: 15000000, percentage: 45 },
          { section: 'قیستەکان', amount: 8000000, percentage: 25 },
          { section: 'چارەسەری تایبەت', amount: 6000000, percentage: 18 },
          { section: 'خزمەتگوزاری', amount: 4400000, percentage: 12 },
        ])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [timePeriod])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ku-IQ', { style: 'currency', currency: 'IQD', maximumFractionDigits: 0 }).format(amount)
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-xl bg-white dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">بەشی داهات</CardTitle>
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

  const colors = [
    'bg-emerald-500',
    'bg-blue-500',
    'bg-purple-500',
    'bg-orange-500',
  ]

  return (
    <Card className="border-0 shadow-xl bg-white dark:bg-slate-900">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">بەشی داهات</CardTitle>
          
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.section}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{formatCurrency(item.amount)}</span>
                  <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">{item.percentage}%</span>
                </div>
              </div>
              <div className="h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${colors[index % colors.length]} rounded-full transition-all duration-500`}
                  style={{ width: `${item.percentage}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
