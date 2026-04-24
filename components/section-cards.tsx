"use client"

import { useEffect, useState, memo } from "react"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { TrendingUpIcon, TrendingDownIcon, DollarSignIcon, CalendarIcon, UsersIcon, CreditCardIcon, ShoppingCartIcon, ReceiptIcon, ArrowUpRightIcon } from "lucide-react"

interface DashboardStats {
  totalRevenue: number
  appointmentsRevenue: number
  salesRevenue: number
  totalExpenses: number
  todayExpenses: number
  todayPatientsCount: number
  netProfit: number
  appointmentsCount: number
  uniquePatients: number
  activeStaff: number
  pendingInstallmentsAmount: number
  monthlyInstallmentAmount: number
  patientsWithInstallments: number
  totalSalaries: number
  totalAdvancesThisMonth: number
  appointmentTrend: number
  revenueTrend: number
}

// Simple in-memory cache
let statsCache: DashboardStats | null = null
let cacheTimestamp = 0
const CACHE_DURATION = 30000 // 30 seconds

export const SectionCards = memo(function SectionCards() {
  const [stats, setStats] = useState<DashboardStats | null>(() => statsCache)
  const [loading, setLoading] = useState(() => !statsCache)

  useEffect(() => {
    let isMounted = true
    
    // Use cache if valid
    const now = Date.now()
    if (statsCache && (now - cacheTimestamp) < CACHE_DURATION) {
      setStats(statsCache)
      setLoading(false)
      return
    }

    async function fetchStats() {
      try {
        const response = await fetch('/api/dashboard/stats', {
          cache: 'no-store'
        })
        const data = await response.json()
        if (isMounted) {
          setStats(data.stats)
          statsCache = data.stats
          cacheTimestamp = Date.now()
        }
      } catch (error) {
        console.error('Error fetching stats:', error)
      } finally {
        if (isMounted) {
          setLoading(false)
        }
      }
    }
    fetchStats()
    return () => {
      isMounted = false
    }
  }, [])

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 gap-4 px-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 lg:px-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-44 rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    )
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('ku-IQ', { style: 'currency', currency: 'IQD', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount)
  }

  const formatCompact = (amount: number | undefined) => {
    const val = amount || 0
    if (val >= 1000000) return `${(val / 1000000).toFixed(1)}M`
    if (val >= 1000) return `${(val / 1000).toFixed(0)} هەزار`
    return val.toString()
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ku-IQ').format(num)
  }

  return (
    <div className="grid grid-cols-1 gap-4 px-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 lg:px-6">
      {/* Revenue Card */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-emerald-500 to-teal-500 opacity-0 rounded-2xl group-hover:opacity-100 transition duration-300 " />
        <div className="relative bg-emerald-50 dark:bg-slate-900 rounded-2xl p-5 transition-all duration-300 group-hover:shadow-lg border border-transparent hover:border-emerald-200 dark:hover:border-slate-600">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <DollarSignIcon className="size-6 text-white" />
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 ${stats.revenueTrend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {stats.revenueTrend >= 0 ? <TrendingUpIcon className="size-3.5" /> : <TrendingDownIcon className="size-3.5" />}
              {stats.revenueTrend >= 0 ? '+' : ''}{stats.revenueTrend.toFixed(1)}%
            </div>
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">کۆی داهات</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{formatCurrency(stats.totalRevenue)}</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
              <div className="flex items-center gap-2">
                <CalendarIcon className="size-3.5 text-slate-500 dark:text-slate-400" />
                <span className="text-xs text-slate-600 dark:text-slate-400">دانیشتەکان</span>
              </div>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{formatCompact(stats.appointmentsRevenue)}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingCartIcon className="size-3.5 text-slate-500 dark:text-slate-400" />
                <span className="text-xs text-slate-600 dark:text-slate-400">فرۆشتن</span>
              </div>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{formatCompact(stats.salesRevenue)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Appointments Card */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-indigo-500 opacity-0 group-hover:opacity-100 transition duration-300 rounded-3xl" />
        <div className="relative bg-blue-50 dark:bg-slate-900 rounded-3xl p-5 transition-all duration-300 group-hover:shadow-lg border border-transparent hover:border-blue-200 dark:hover:border-slate-600">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <CalendarIcon className="size-6 text-white" />
            </div>
            <div className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-blue-100 dark:bg-blue-900/30 ${stats.appointmentTrend >= 0 ? 'text-blue-600 dark:text-blue-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {stats.appointmentTrend >= 0 ? <TrendingUpIcon className="size-3.5" /> : <TrendingDownIcon className="size-3.5" />}
              {stats.appointmentTrend >= 0 ? '+' : ''}{stats.appointmentTrend.toFixed(1)}%
            </div>
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">کۆی موچەی کارمەندەکان</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{formatCurrency(stats.totalSalaries)}</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
              <div className="flex items-center gap-2">
                <UsersIcon className="size-3.5 text-slate-500 dark:text-slate-400" />
                <span className="text-xs text-slate-600 dark:text-slate-400">کارمەند</span>
              </div>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{stats.activeStaff}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
              <div className="flex items-center gap-2">
                <CalendarIcon className="size-3.5 text-slate-500 dark:text-slate-400" />
                <span className="text-xs text-slate-600 dark:text-slate-400">دانیشتەکان</span>
              </div>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{stats.appointmentsCount}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Expenses Card */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-rose-500 to-pink-500 opacity-0 group-hover:opacity-100 transition duration-300 rounded-3xl" />
        <div className="relative bg-rose-50 dark:bg-slate-900 rounded-3xl p-5 transition-all duration-300 group-hover:shadow-lg border border-transparent hover:border-rose-200 dark:hover:border-slate-600">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-rose-500 to-pink-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <DollarSignIcon className="size-6 text-white" />
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400">
              داهات
            </div>
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">کۆی داهاتی فرۆشتن</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{formatCurrency(stats.salesRevenue)}</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
              <div className="flex items-center gap-2">
                <CalendarIcon className="size-3.5 text-slate-500 dark:text-slate-400" />
                <span className="text-xs text-slate-600 dark:text-slate-400">نەخۆشەکان</span>
              </div>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{stats.appointmentsCount}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
              <div className="flex items-center gap-2">
                <ShoppingCartIcon className="size-3.5 text-slate-500 dark:text-slate-400" />
                <span className="text-xs text-slate-600 dark:text-slate-400">فرۆشتن</span>
              </div>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{formatCompact(stats.salesRevenue)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Installments Card */}
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-amber-500 to-orange-500 opacity-0 group-hover:opacity-100 transition duration-300 rounded-3xl" />
        <div className="relative bg-amber-50 dark:bg-slate-900 rounded-3xl p-5 transition-all duration-300 group-hover:shadow-lg border border-transparent hover:border-amber-200 dark:hover:border-slate-600">
          <div className="flex items-start justify-between mb-4">
            <div className="p-3 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl shadow-lg group-hover:scale-110 transition-transform duration-300">
              <CreditCardIcon className="size-6 text-white" />
            </div>
            <div className="flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-bold bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400">
              چاوەڕوان
            </div>
          </div>
          <p className="text-sm font-medium text-slate-600 dark:text-slate-400 mb-1">قەرزی مانگانە</p>
          <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">{formatCurrency(stats.pendingInstallmentsAmount)}</h3>
          <div className="space-y-2">
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
              <div className="flex items-center gap-2">
                <DollarSignIcon className="size-3.5 text-slate-500 dark:text-slate-400" />
                <span className="text-xs text-slate-600 dark:text-slate-400">قیستی مانگانە</span>
              </div>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{formatCompact(stats.monthlyInstallmentAmount)}</span>
            </div>
            <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800">
              <div className="flex items-center gap-2">
                <UsersIcon className="size-3.5 text-slate-500 dark:text-slate-400" />
                <span className="text-xs text-slate-600 dark:text-slate-400">نەخۆشانی قیست</span>
              </div>
              <span className="text-sm font-semibold text-slate-900 dark:text-white">{stats.patientsWithInstallments || 0}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})
