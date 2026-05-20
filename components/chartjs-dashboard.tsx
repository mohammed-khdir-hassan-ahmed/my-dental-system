"use client"

import * as React from "react"
import { memo, useState, useEffect } from "react"
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from "chart.js"
import { Line, Bar, Doughnut, Radar } from "react-chartjs-2"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useDashboardFilter } from "@/contexts/dashboard-filter-context"

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
)

interface DashboardStats {
  treatmentBreakdown: Record<string, number>
  appointmentsRevenue: number
  salesRevenue: number
  monthlyInstallmentAmount: number
  totalExpenses: number
  appointmentsCount: number
  patientsWithInstallments: number
  activeStaff: number
  expensesBreakdown: Record<string, number>
}

interface ChartData {
  month?: string
  day?: string
  revenue: number
  appointments: number
  sales?: number
}

export const ChartJSDashboard = memo(function ChartJSDashboard() {
  const { period, startDate, endDate } = useDashboardFilter()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [chartData, setChartData] = useState<ChartData[]>([])
  const [expensesData, setExpensesData] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const params = new URLSearchParams({ period })
        if (startDate) params.append('from', startDate)
        if (endDate) params.append('to', endDate)
        
        const response = await fetch(`/api/dashboard/stats?${params.toString()}`)
        const data = await response.json()
        setStats(data.stats)
        setChartData(data.chartData || [])
      } catch (error) {
        console.error('Error fetching chart data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [period, startDate, endDate])

  useEffect(() => {
    async function fetchExpenses() {
      try {
        const params = new URLSearchParams({ period })
        if (startDate) params.append('from', startDate)
        if (endDate) params.append('to', endDate)
        
        const response = await fetch(`/api/expenses?${params.toString()}`)
        const expenses = await response.json()
        
        // Group expenses by category
        const breakdown = expenses.reduce((acc: Record<string, number>, exp: any) => {
          const category = exp.category || 'خەرجی گشتی'
          acc[category] = (acc[category] || 0) + Number(exp.amount || 0)
          return acc
        }, {})
        
        setExpensesData(breakdown)
      } catch (error) {
        console.error('Error fetching expenses:', error)
      }
    }
    fetchExpenses()
  }, [period, startDate, endDate])

  // Treatment breakdown data
  const treatmentData = stats
    ? {
        labels: Object.keys(stats.treatmentBreakdown || {}),
        datasets: [
          {
            label: "دانیشتن",
            data: Object.values(stats.treatmentBreakdown || {}),
            backgroundColor: [
              'rgba(16, 185, 129, 0.8)',
              'rgba(59, 130, 246, 0.8)',
              'rgba(139, 92, 246, 0.8)',
              'rgba(245, 158, 11, 0.8)',
              'rgba(239, 68, 68, 0.8)',
              'rgba(6, 182, 212, 0.8)',
              'rgba(236, 72, 153, 0.8)'
            ],
            borderColor: [
              'rgba(16, 185, 129, 1)',
              'rgba(59, 130, 246, 1)',
              'rgba(139, 92, 246, 1)',
              'rgba(245, 158, 11, 1)',
              'rgba(239, 68, 68, 1)',
              'rgba(6, 182, 212, 1)',
              'rgba(236, 72, 153, 1)'
            ],
            borderWidth: 2,
            hoverOffset: 10
          }
        ]
      }
    : null

  // Revenue breakdown data
  const totalRevenue = stats
    ? stats.appointmentsRevenue + stats.salesRevenue + stats.monthlyInstallmentAmount
    : 0

  const revenueData = stats && totalRevenue > 0
    ? {
        labels: ['دانیشتن', 'فرۆشتن', 'قیست'],
        datasets: [
          {
            data: [
              stats.appointmentsRevenue,
              stats.salesRevenue,
              stats.monthlyInstallmentAmount
            ].filter(v => v > 0),
            backgroundColor: [
              'rgba(16, 185, 129, 0.8)',
              'rgba(59, 130, 246, 0.8)',
              'rgba(139, 92, 246, 0.8)'
            ],
            borderColor: [
              'rgba(16, 185, 129, 1)',
              'rgba(59, 130, 246, 1)',
              'rgba(139, 92, 246, 1)'
            ],
            borderWidth: 2,
            hoverOffset: 15
          }
        ]
      }
    : null

  // Expenses breakdown data
  const expensesBreakdownData = Object.keys(expensesData).length > 0
    ? {
        labels: Object.keys(expensesData),
        datasets: [
          {
            label: "خەرجی",
            data: Object.values(expensesData),
            backgroundColor: [
              'rgba(239, 68, 68, 0.8)',
              'rgba(245, 158, 11, 0.8)',
              'rgba(168, 85, 247, 0.8)',
              'rgba(14, 165, 233, 0.8)',
              'rgba(236, 72, 153, 0.8)'
            ],
            borderColor: [
              'rgba(239, 68, 68, 1)',
              'rgba(245, 158, 11, 1)',
              'rgba(168, 85, 247, 1)',
              'rgba(14, 165, 233, 1)',
              'rgba(236, 72, 153, 1)'
            ],
            borderWidth: 2,
            hoverOffset: 10
          }
        ]
      }
    : null

  const getChartLabel = (dataPoint: ChartData) => {
    return dataPoint.month || dataPoint.day || ''
  }

  // Bar chart data - uses chart data from API
  const appointmentLabels = chartData.map(d => getChartLabel(d))
  const appointmentValues = chartData.map(d => d.appointments)
  const salesValues = chartData.map(d => d.sales || 0)

  const barData = {
    labels: appointmentLabels,
    datasets: [
      {
        label: 'دانیشتن',
        data: appointmentValues,
        backgroundColor: 'rgba(139, 92, 246, 0.8)',
        borderColor: 'rgba(139, 92, 246, 1)',
        borderWidth: 2,
        borderRadius: 8
      }
    ]
  }

  const salesBarData = {
    labels: appointmentLabels,
    datasets: [{
      label: 'فرۆشتن',
      data: salesValues,
      backgroundColor: 'rgba(59, 130, 246, 0.8)',
      borderColor: 'rgba(59, 130, 246, 1)',
      borderWidth: 2,
      borderRadius: 8
    }]
  }

  // Radar chart data (real performance metrics)
  const maxRevenue = Math.max(
    stats?.appointmentsRevenue || 0,
    stats?.salesRevenue || 0,
    stats?.monthlyInstallmentAmount || 0,
    stats?.totalExpenses || 0
  ) || 1

  const radarData = stats ? {
    labels: ['دانیشتن', 'فرۆشتن', 'قیست', 'خەرجی', 'نەخۆش', 'ستاف'],
    datasets: [
      {
        label: 'ئەم مانگە',
        data: [
          Math.min(100, (stats.appointmentsRevenue / maxRevenue) * 100),
          Math.min(100, (stats.salesRevenue / maxRevenue) * 100),
          Math.min(100, (stats.monthlyInstallmentAmount / maxRevenue) * 100),
          Math.min(100, (stats.totalExpenses / maxRevenue) * 100),
          Math.min(100, stats.appointmentsCount * 5),
          Math.min(100, stats.activeStaff * 10)
        ],
        backgroundColor: 'rgba(16, 185, 129, 0.2)',
        borderColor: 'rgba(16, 185, 129, 1)',
        borderWidth: 2,
        pointBackgroundColor: 'rgba(16, 185, 129, 1)',
        pointBorderColor: '#fff',
        pointBorderWidth: 2
      }
    ]
  } : null

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'bottom' as const,
        labels: {
          color: 'rgba(15, 23, 42, 0.8)',
          font: {
            size: 12,
            family: 'system-ui'
          },
          padding: 20,
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleFont: {
          size: 14
        },
        bodyFont: {
          size: 13
        },
        padding: 12,
        cornerRadius: 8
      }
    }
  }

  const barOptions = {
    ...chartOptions,
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        },
        ticks: {
          color: 'rgba(15, 23, 42, 0.6)'
        }
      },
      x: {
        grid: {
          display: false
        },
        ticks: {
          color: 'rgba(15, 23, 42, 0.6)'
        }
      }
    }
  }

  const radarOptions = {
    ...chartOptions,
    scales: {
      r: {
        beginAtZero: true,
        max: 100,
        grid: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        angleLines: {
          color: 'rgba(0, 0, 0, 0.1)'
        },
        pointLabels: {
          color: 'rgba(15, 23, 42, 0.8)',
          font: {
            size: 11
          }
        },
        ticks: {
          display: false
        }
      }
    }
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="border-0 bg-white dark:bg-slate-900">
            <CardHeader>
              <div className="h-6 bg-slate-200 dark:bg-slate-700 rounded animate-pulse w-1/3" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center h-[300px]">
                <div className="text-slate-500">تکایە چاوەڕێبکە...</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Doughnut Chart - Treatment Breakdown */}
        <Card className="border-0 bg-white dark:bg-slate-900 shadow-lg">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white text-lg font-bold">
              دانیشتن بەپێی جۆری چارەسەر
            </CardTitle>
          </CardHeader>
          <CardContent>
            {treatmentData && treatmentData.labels.length > 0 ? (
              <div className="h-[300px]">
                <Doughnut data={treatmentData} options={chartOptions} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <div className="text-slate-500">هیچ داتایەک نیە</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Doughnut Chart - Revenue Breakdown */}
        <Card className="border-0 bg-white dark:bg-slate-900 shadow-lg">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white text-lg font-bold">
              بەشی داهات
            </CardTitle>
          </CardHeader>
          <CardContent>
            {revenueData && revenueData.labels.length > 0 ? (
              <div className="h-[300px]">
                <Doughnut data={revenueData} options={chartOptions} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <div className="text-slate-500">هیچ داتایەک نیە</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Doughnut Chart - Expenses Breakdown */}
        <Card className="border-0 bg-white dark:bg-slate-900 shadow-lg">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white text-lg font-bold">
              بەشی خەرجی
            </CardTitle>
          </CardHeader>
          <CardContent>
            {expensesBreakdownData && expensesBreakdownData.labels.length > 0 ? (
              <div className="h-[300px]">
                <Doughnut data={expensesBreakdownData} options={chartOptions} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <div className="text-slate-500">هیچ داتایەک نیە</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Radar Chart - Performance Metrics */}
        <Card className="border-0 bg-white dark:bg-slate-900 shadow-lg">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white text-lg font-bold">
              ئاستی کارکردن
            </CardTitle>
          </CardHeader>
          <CardContent>
            {radarData ? (
              <div className="h-[300px]">
                <Radar data={radarData} options={radarOptions} />
              </div>
            ) : (
              <div className="flex items-center justify-center h-[300px]">
                <div className="text-slate-500">هیچ داتایەک نیە</div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart - Weekly Appointments */}
        <Card className="border-0 bg-white dark:bg-slate-900 shadow-lg">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white text-lg font-bold">
              دانیشتن بەپێی ڕۆژ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Bar data={barData} options={barOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Bar Chart - Sales by Day */}
        <Card className="border-0 bg-white dark:bg-slate-900 shadow-lg">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white text-lg font-bold">
              فرۆشتن بەپێی ڕۆژ
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <Bar data={salesBarData} options={barOptions} />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
})
