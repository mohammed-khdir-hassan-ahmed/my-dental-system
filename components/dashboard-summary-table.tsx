"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CalendarIcon, DollarSignIcon } from "lucide-react"
import { useEffect, useState } from "react"

interface TreatmentData {
  treatmentType: string
  count: number
  percentage: number
}

interface IncomeData {
  section: string
  amount: number
  percentage: number
}

export function DashboardSummaryTable() {
  const [treatmentData, setTreatmentData] = useState<TreatmentData[]>([])
  const [incomeData, setIncomeData] = useState<IncomeData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const [treatmentRes, incomeRes] = await Promise.all([
          fetch('/api/dashboard/treatment-stats'),
          fetch('/api/dashboard/income-sections')
        ])
        const treatmentResult = await treatmentRes.json()
        const incomeResult = await incomeRes.json()
        setTreatmentData(treatmentResult.data || [])
        setIncomeData(incomeResult.data || [])
      } catch (error) {
        console.error('Error fetching data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ku-IQ', { style: 'currency', currency: 'IQD', maximumFractionDigits: 0 }).format(amount)
  }

  const treatmentColors = [
    'bg-blue-600',
    'bg-emerald-600',
    'bg-purple-600',
    'bg-orange-600',
    'bg-pink-600',
  ]

  const incomeColors = [
    'bg-emerald-600',
    'bg-blue-600',
    'bg-purple-600',
    'bg-orange-600',
  ]

  if (loading) {
    return (
      <Card className="border-1 bg-white dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">پوختەی داشبۆرد</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="h-12 bg-slate-100 dark:bg-slate-800 rounded-xl animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-1 bg-white dark:bg-slate-900">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">پوختەی داشبۆرد</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Appointments by Treatment */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-blue-600 rounded-lg">
                <CalendarIcon className="size-4 text-white" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">دانیشتن بەپێی جۆری چارەسەر</h3>
            </div>
            <div className="space-y-2">
              {treatmentData.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-2 h-2 rounded-full ${treatmentColors[index % treatmentColors.length]} flex-shrink-0`} />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{item.treatmentType}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-base font-bold text-slate-900 dark:text-white tabular-nums">{item.count}</span>
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 w-12 text-right">{item.percentage}%</span>
                  </div>
                </div>
              ))}
              {treatmentData.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">هیچ دانیشتنێک نییە</p>
              )}
            </div>
          </div>

          {/* Income by Section */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="p-2 bg-emerald-600 rounded-lg">
                <DollarSignIcon className="size-4 text-white" />
              </div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">بەشی داهات</h3>
            </div>
            <div className="space-y-2">
              {incomeData.map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex items-center gap-3 flex-1">
                    <div className={`w-2 h-2 rounded-full ${incomeColors[index % incomeColors.length]} flex-shrink-0`} />
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300 truncate">{item.section}</span>
                  </div>
                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums">{formatCurrency(item.amount)}</span>
                    <span className="text-sm font-semibold text-slate-600 dark:text-slate-400 w-12 text-right">{item.percentage}%</span>
                  </div>
                </div>
              ))}
              {incomeData.length === 0 && (
                <p className="text-sm text-slate-500 dark:text-slate-400 text-center py-4">هیچ داهاتێک نییە</p>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
