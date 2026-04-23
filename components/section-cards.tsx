"use client"

import { useEffect, useState } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TrendingUpIcon, TrendingDownIcon, DollarSignIcon, CalendarIcon, UsersIcon, CreditCardIcon, ArrowUpRightIcon } from "lucide-react"

interface DashboardStats {
  totalRevenue: number
  totalExpenses: number
  netProfit: number
  appointmentsCount: number
  uniquePatients: number
  activeStaff: number
  pendingInstallmentsAmount: number
  appointmentTrend: number
  revenueTrend: number
}

export function SectionCards() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch('/api/dashboard/stats')
        const data = await response.json()
        setStats(data.stats)
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 lg:px-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-40 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ku-IQ', { style: 'currency', currency: 'IQD', maximumFractionDigits: 0 }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ku-IQ').format(num)
  }

  return (
    <div className="grid grid-cols-1 gap-4 px-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 lg:px-6">
      {/* Revenue Card */}
      <div className="relative group overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border-2 border-emerald-100 dark:border-emerald-900/50 p-4 hover:shadow-2xl hover:shadow-emerald-500/20 transition-all duration-300 hover:-translate-y-1">
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-emerald-100 to-emerald-50 dark:from-emerald-900/20 dark:to-transparent rounded-bl-3xl" />
        <div className="relative">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <DollarSignIcon className="size-5 text-white" />
            </div>
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${stats.revenueTrend >= 0 ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
              {stats.revenueTrend >= 0 ? <TrendingUpIcon className="size-3" /> : <TrendingDownIcon className="size-3" />}
              {stats.revenueTrend >= 0 ? '+' : ''}{stats.revenueTrend.toFixed(1)}%
            </div>
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">کۆی داهات</p>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white tabular-nums leading-none">
            {formatCurrency(stats.totalRevenue)}
          </h3>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {stats.revenueTrend >= 0 ? 'بەرزبوون' : 'نزمبوون'} بەرا بە مانگی پێشوو
            </p>
          </div>
        </div>
      </div>

      {/* Appointments Card */}
      <div className="relative group overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border-2 border-blue-100 dark:border-blue-900/50 p-4 hover:shadow-2xl hover:shadow-blue-500/20 transition-all duration-300 hover:-translate-y-1">
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/20 dark:to-transparent rounded-bl-3xl" />
        <div className="relative">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <CalendarIcon className="size-5 text-white" />
            </div>
            <div className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${stats.appointmentTrend >= 0 ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
              {stats.appointmentTrend >= 0 ? <TrendingUpIcon className="size-3" /> : <TrendingDownIcon className="size-3" />}
              {stats.appointmentTrend >= 0 ? '+' : ''}{stats.appointmentTrend.toFixed(1)}%
            </div>
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">دانیشتەکانی ئەم مانگە</p>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white tabular-nums leading-none">
            {stats.appointmentsCount}
          </h3>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {stats.appointmentTrend >= 0 ? 'بەرزبوون' : 'نزمبوون'} بەرا بە مانگی پێشوو
            </p>
          </div>
        </div>
      </div>

      {/* Patients Card */}
      <div className="relative group overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border-2 border-purple-100 dark:border-purple-900/50 p-4 hover:shadow-2xl hover:shadow-purple-500/20 transition-all duration-300 hover:-translate-y-1">
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-purple-100 to-purple-50 dark:from-purple-900/20 dark:to-transparent rounded-bl-3xl" />
        <div className="relative">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <UsersIcon className="size-5 text-white" />
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
              کۆی گشتی
            </div>
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">نەخۆشەکان</p>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white tabular-nums leading-none">
            {formatNumber(stats.uniquePatients)}
          </h3>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {stats.activeStaff} کارمەند چالاک
            </p>
          </div>
        </div>
      </div>

      {/* Installments Card */}
      <div className="relative group overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border-2 border-orange-100 dark:border-orange-900/50 p-4 hover:shadow-2xl hover:shadow-orange-500/20 transition-all duration-300 hover:-translate-y-1">
        <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900/20 dark:to-transparent rounded-bl-3xl" />
        <div className="relative">
          <div className="flex items-start justify-between mb-3">
            <div className="p-2 bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <CreditCardIcon className="size-5 text-white" />
            </div>
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
              چاوەڕوان
            </div>
          </div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wide mb-1">قەرزی مانگانە</p>
          <h3 className="text-xl font-bold text-slate-900 dark:text-white tabular-nums leading-none">
            {formatCurrency(stats.pendingInstallmentsAmount)}
          </h3>
          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700">
            <p className="text-xs text-slate-500 dark:text-slate-400">
              پێویستی کۆکردنەوە
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
