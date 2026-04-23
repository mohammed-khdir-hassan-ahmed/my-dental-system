"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CreditCardIcon, AlertCircleIcon } from "lucide-react"
import { useEffect, useState } from "react"

interface InstallmentData {
  totalPendingAmount: number
  totalPaidAmount: number
  totalAmount: number
  pendingCount: number
  recentInstallments: Array<{
    id: number
    patientName: string
    totalAmount: number
    paidAmount: number
    remainingAmount: number
    installmentValue: number
    nextPaymentDate: string | null
    status: string
  }>
}

export function RecentInstallments() {
  const [data, setData] = useState<InstallmentData | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/dashboard/recent-installments')
        const result = await response.json()
        setData(result.data)
      } catch (error) {
        console.error('Error fetching recent installments:', error)
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
          <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">قیستەکان</CardTitle>
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
        <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">قیستەکان</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircleIcon className="size-5 text-orange-600 dark:text-orange-400" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">قەرزی چاوەڕوان</span>
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(data.totalPendingAmount)}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{data.pendingCount} نەخۆش</p>
          </div>
          <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <CreditCardIcon className="size-5 text-emerald-600 dark:text-emerald-400" />
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">دراوکراوە</span>
            </div>
            <p className="text-lg font-bold text-slate-900 dark:text-white">{formatCurrency(data.totalPaidAmount)}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">کۆی گشتی</p>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide">دواین قیستەکان</p>
          {data.recentInstallments.slice(0, 5).map((inst) => (
            <div key={inst.id} className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800 last:border-0">
              <div>
                <p className="text-sm font-medium text-slate-900 dark:text-white">{inst.patientName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  {inst.status === 'Pending' ? 'چاوەڕوان' : inst.status}
                  {inst.nextPaymentDate && ` • ${inst.nextPaymentDate}`}
                </p>
              </div>
              <p className="text-sm font-semibold text-slate-900 dark:text-white">{formatCurrency(inst.remainingAmount)}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
