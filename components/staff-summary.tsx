"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { UsersIcon, DollarSignIcon, TrendingUpIcon } from "lucide-react"
import { useEffect, useState } from "react"

interface StaffData {
  totalStaff: number
  activeStaff: number
  inactiveStaff: number
  totalSalaries: number
  activeSalaries: number
  totalAdvances: number
  staffList: Array<{
    id: number
    fullName: string
    role: string
    basicSalary: number
    status: string
  }>
}

export function StaffSummary() {
  const [data, setData] = useState<StaffData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/dashboard/staff-summary')
        const result = await response.json()
        setData(result.data)
      } catch (error) {
        console.error('Error fetching staff summary:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ku-IQ', { style: 'currency', currency: 'IQD', maximumFractionDigits: 0 }).format(amount)
  }

  if (loading || !data) {
    return (
      <Card className="border-0 shadow-xl bg-white dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">زانیاری کارمەندان</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-20 bg-slate-100 dark:bg-slate-800 rounded-lg animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-xl bg-white dark:bg-slate-900">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">زانیاری کارمەندان</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <UsersIcon className="size-5 text-blue-600 dark:text-blue-400" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">کارمەندی چالاک</span>
            </div>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{data.activeStaff}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">کۆی {data.totalStaff} کارمەند</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <DollarSignIcon className="size-5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">مووچەی گشتی</span>
            </div>
            <p className="text-xl font-bold text-slate-900 dark:text-white">{formatCurrency(data.activeSalaries)}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">مانگانە</p>
          </div>
        </div>
        {data.totalAdvances > 0 && (
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4 mb-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUpIcon className="size-5 text-orange-600 dark:text-orange-400" />
                <span className="text-sm font-medium text-slate-600 dark:text-slate-400">پێشکەشکردنی ئەم مانگە</span>
              </div>
              <p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(data.totalAdvances)}</p>
            </div>
          </div>
        )}
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">کارمەندانی چالاک</p>
          {data.staffList.slice(0, 4).map((staff) => (
            <div key={staff.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{staff.fullName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">{staff.role}</p>
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(staff.basicSalary)}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
