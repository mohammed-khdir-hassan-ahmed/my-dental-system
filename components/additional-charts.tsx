"use client"

import * as React from "react"
import { memo, useState, useEffect } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const COLORS = ["#10b981", "#3b82f6", "#8b5cf6", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899"]

interface DashboardStats {
  treatmentBreakdown: Record<string, number>
  appointmentsRevenue: number
  salesRevenue: number
  monthlyInstallmentAmount: number
}

export const AdditionalCharts = memo(function AdditionalCharts() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/dashboard/stats')
        const data = await response.json()
        setStats(data.stats)
      } catch (error) {
        console.error('Error fetching chart data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  // Transform treatment breakdown for chart
  const treatmentData = stats
    ? Object.entries(stats.treatmentBreakdown || {}).map(([name, value], index) => ({
        name,
        value,
        color: COLORS[index % COLORS.length]
      }))
    : []

  // Transform revenue data for chart
  const totalRevenue = stats
    ? stats.appointmentsRevenue + stats.salesRevenue + stats.monthlyInstallmentAmount
    : 0

  const revenueData = stats && totalRevenue > 0
    ? [
        {
          name: "دانیشتن",
          value: Math.round((stats.appointmentsRevenue / totalRevenue) * 100),
          color: "#10b981"
        },
        {
          name: "فرۆشتن",
          value: Math.round((stats.salesRevenue / totalRevenue) * 100),
          color: "#3b82f6"
        },
        {
          name: "قیست",
          value: Math.round((stats.monthlyInstallmentAmount / totalRevenue) * 100),
          color: "#8b5cf6"
        }
      ].filter(item => item.value > 0)
    : []

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <Card className="border-0 bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white">دانیشتن بەپێی جۆری چارەسەر</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[300px]">
              <div className="text-slate-500">بارکردن...</div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 s bg-white dark:bg-slate-900">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white">بەشی داهات</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center h-[300px]">
              <div className="text-slate-500">بارکردن...</div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-0 bg-white dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-white">دانیشتن بەپێی جۆری چارەسەر</CardTitle>
        </CardHeader>
        <CardContent>
          {treatmentData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={treatmentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {treatmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `${value} دانیشتن`}
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    borderRadius: '8px',
                    border: 'none'
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value: string, entry: any) => (
                    <span style={{ color: entry.color }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <div className="text-slate-500">هیچ داتایەک نیە</div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 bg-white dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-white">بەشی داهات</CardTitle>
        </CardHeader>
        <CardContent>
          {revenueData.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={revenueData}
                  cx="50%"
                  cy="50%"
                  innerRadius={80}
                  outerRadius={120}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {revenueData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: number) => `${value}%`}
                  contentStyle={{
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    borderRadius: '8px',
                    border: 'none'
                  }}
                />
                <Legend
                  verticalAlign="bottom"
                  height={36}
                  formatter={(value: string, entry: any) => (
                    <span style={{ color: entry.color }}>{value}</span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px]">
              <div className="text-slate-500">هیچ داتایەک نیە</div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
})
