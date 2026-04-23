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
    if (val >= 1000) return `${(val / 1000).toFixed(0)}K`
    return val.toString()
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('ku-IQ').format(num)
  }

  return (
    <div className="grid grid-cols-1 gap-4 px-4 @xl/main:grid-cols-2 @5xl/main:grid-cols-4 lg:px-6">
      {/* Revenue Card */}
      <div className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-emerald-600 to-teal-700 p-5 hover:shadow-2xl hover:shadow-emerald-500/30 transition-all duration-300 hover:-translate-y-1">
        <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-full -translate-x-8 -translate-y-8" />
        <div className="absolute bottom-0 right-0 w-16 h-16 bg-white/5 rounded-full translate-x-4 translate-y-4" />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
              <DollarSignIcon className="size-5 text-white" />
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm text-white">
              {stats.revenueTrend >= 0 ? <TrendingUpIcon className="size-3" /> : <TrendingDownIcon className="size-3" />}
              {stats.revenueTrend >= 0 ? '+' : ''}{stats.revenueTrend.toFixed(1)}%
            </div>
          </div>
          <p className="text-sm font-semibold text-emerald-100 mb-1">کۆی داهات</p>
          <h3 className="text-2xl font-bold text-white tabular-nums leading-none mb-4">
            {formatCurrency(stats.totalRevenue)}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <CalendarIcon className="size-3 text-emerald-200" />
                <p className="text-[10px] font-medium text-emerald-200">دانیشتەکان</p>
              </div>
              <p className="text-xs font-bold text-white">{formatCompact(stats.appointmentsRevenue)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <ShoppingCartIcon className="size-3 text-emerald-200" />
                <p className="text-[10px] font-medium text-emerald-200">فرۆشتن</p>
              </div>
              <p className="text-xs font-bold text-white">{formatCompact(stats.salesRevenue)}</p>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-white/20">
            <p className="text-xs text-emerald-100">
              {stats.revenueTrend >= 0 ? 'بەرزبوون' : 'نزمبوون'} بەرامبەر بە مانگی پێشوو
            </p>
          </div>
        </div>
      </div>

      {/* Appointments Card */}
      <div className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 p-5 hover:shadow-2xl hover:shadow-blue-500/30 transition-all duration-300 hover:-translate-y-1">
        <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-full -translate-x-8 -translate-y-8" />
        <div className="absolute bottom-0 right-0 w-16 h-16 bg-white/5 rounded-full translate-x-4 translate-y-4" />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
              <CalendarIcon className="size-5 text-white" />
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm text-white">
              {stats.appointmentTrend >= 0 ? <TrendingUpIcon className="size-3" /> : <TrendingDownIcon className="size-3" />}
              {stats.appointmentTrend >= 0 ? '+' : ''}{stats.appointmentTrend.toFixed(1)}%
            </div>
          </div>
          <p className="text-sm font-semibold text-blue-100 mb-1">دانیشتەکانی ئەم مانگە</p>
          <h3 className="text-2xl font-bold text-white tabular-nums leading-none mb-4">
            {stats.appointmentsCount}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <UsersIcon className="size-3 text-blue-200" />
                <p className="text-[10px] font-medium text-blue-200">نەخۆشەکان</p>
              </div>
              <p className="text-xs font-bold text-white">{formatNumber(stats.uniquePatients)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <UsersIcon className="size-3 text-blue-200" />
                <p className="text-[10px] font-medium text-blue-200">کارمەند</p>
              </div>
              <p className="text-xs font-bold text-white">{stats.activeStaff}</p>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-white/20">
            <p className="text-xs text-blue-100">
              {stats.appointmentTrend >= 0 ? 'بەرزبوون' : 'نزمبوون'} بەرامبەر بە مانگی پێشوو
            </p>
          </div>
        </div>
      </div>

      {/* Expenses Card */}
      <div className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-rose-500 via-rose-600 to-pink-700 p-5 hover:shadow-2xl hover:shadow-rose-500/30 transition-all duration-300 hover:-translate-y-1">
        <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-full -translate-x-8 -translate-y-8" />
        <div className="absolute bottom-0 right-0 w-16 h-16 bg-white/5 rounded-full translate-x-4 translate-y-4" />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
              <ReceiptIcon className="size-5 text-white" />
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm text-white">
              سەرەبرین
            </div>
          </div>
          <p className="text-sm font-semibold text-rose-100 mb-1">کۆی سەرەبرین</p>
          <h3 className="text-2xl font-bold text-white tabular-nums leading-none mb-4">
            {formatCurrency(stats.totalExpenses)}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <DollarSignIcon className="size-3 text-rose-200" />
                <p className="text-[10px] font-medium text-rose-200">داهات</p>
              </div>
              <p className="text-xs font-bold text-white">{formatCompact(stats.totalRevenue)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <TrendingUpIcon className="size-3 text-rose-200" />
                <p className="text-[10px] font-medium text-rose-200">قازانج</p>
              </div>
              <p className={`text-xs font-bold ${stats.netProfit >= 0 ? 'text-emerald-200' : 'text-red-200'}`}>{formatCompact(stats.netProfit)}</p>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-white/20">
            <p className="text-xs text-rose-100">
              قازانج: {formatCurrency(stats.netProfit)}
            </p>
          </div>
        </div>
      </div>

      {/* Installments Card */}
      <div className="relative group overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-5 hover:shadow-2xl hover:shadow-orange-500/30 transition-all duration-300 hover:-translate-y-1">
        <div className="absolute top-0 left-0 w-24 h-24 bg-white/10 rounded-full -translate-x-8 -translate-y-8" />
        <div className="absolute bottom-0 right-0 w-16 h-16 bg-white/5 rounded-full translate-x-4 translate-y-4" />
        <div className="relative">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2.5 bg-white/20 backdrop-blur-sm rounded-xl">
              <CreditCardIcon className="size-5 text-white" />
            </div>
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-white/20 backdrop-blur-sm text-white">
              چاوەڕوان
            </div>
          </div>
          <p className="text-sm font-semibold text-amber-100 mb-1">قەرزی مانگانە</p>
          <h3 className="text-2xl font-bold text-white tabular-nums leading-none mb-4">
            {formatCurrency(stats.pendingInstallmentsAmount)}
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <DollarSignIcon className="size-3 text-amber-200" />
                <p className="text-[10px] font-medium text-amber-200">کۆی داهات</p>
              </div>
              <p className="text-xs font-bold text-white">{formatCompact(stats.totalRevenue)}</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-2 text-center">
              <div className="flex items-center justify-center gap-1 mb-0.5">
                <UsersIcon className="size-3 text-amber-200" />
                <p className="text-[10px] font-medium text-amber-200">نەخۆشانی ئەمرۆ</p>
              </div>
              <p className="text-xs font-bold text-white">{stats.todayPatientsCount || 0}</p>
            </div>
          </div>
          <div className="mt-3 pt-2 border-t border-white/20">
            <p className="text-xs text-amber-100">
              کۆی قەرزەکان لای نەخۆشەکان
            </p>
          </div>
        </div>
      </div>
    </div>
  )
})
