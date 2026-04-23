"use client"

import * as React from "react"
import { Area, AreaChart, Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig,
} from "@/components/ui/chart"

export const description = "An interactive area chart"

interface ChartData {
  month: string
  revenue: number
  appointments: number
}

const chartConfig = {
  revenue: {
    label: "داهات",
    color: "hsl(142 76% 36%)",
  },
  appointments: {
    label: "دانیشتن",
    color: "hsl(217 91% 60%)",
  },
} satisfies ChartConfig

export function ChartAreaInteractive() {
  const isMobile = useIsMobile()
  const [chartData, setChartData] = React.useState<ChartData[]>([])
  const [loading, setLoading] = React.useState(true)

  React.useEffect(() => {
    async function fetchChartData() {
      try {
        const response = await fetch('/api/dashboard/stats')
        const data = await response.json()
        const filteredData = data.chartData || []
        setChartData(filteredData.slice(-6))
      } catch (error) {
        console.error('Error fetching chart data:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchChartData()
  }, [])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('ku-IQ', { 
      style: 'currency', 
      currency: 'IQD',
      maximumFractionDigits: 0
    }).format(value)
  }

  if (loading) {
    return (
      <Card className="border-0 shadow-xl bg-white dark:bg-slate-900">
        <CardHeader className="relative">
          <div className="h-6 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-32 bg-muted animate-pulse rounded mt-2" />
        </CardHeader>
        <CardContent className="relative px-6 pt-6">
          <div className="h-[300px] w-full bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-0 shadow-xl bg-white dark:bg-slate-900">
      <CardHeader className="relative">
        <div>
          <CardTitle className="text-slate-900 dark:text-white">نەخشەی داهات و دانیشتن</CardTitle>
          <CardDescription className="text-slate-600 dark:text-slate-400">
            کۆی ئەنجامەکانی 6 مانگی دوایی
          </CardDescription>
        </div>
      </CardHeader>
      <CardContent className="relative px-6 pt-6">
        <ChartContainer config={chartConfig} className="aspect-auto h-[300px] w-full">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="fillRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-revenue)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-revenue)" stopOpacity={0.1} />
                  </linearGradient>
                  <linearGradient id="fillAppointments" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="var(--color-appointments)" stopOpacity={0.8} />
                    <stop offset="95%" stopColor="var(--color-appointments)" stopOpacity={0.1} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="4 4" className="stroke-slate-200 dark:stroke-slate-800" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  minTickGap={32}
                  className="text-xs text-slate-600 dark:text-slate-400"
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  tickMargin={8}
                  tickFormatter={formatCurrency}
                  className="text-xs text-slate-600 dark:text-slate-400"
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent indicator="dot" />}
                  formatter={(value: number, name: string) => {
                    if (name === 'داهات') return formatCurrency(value)
                    return `${value}`
                  }}
                />
                <Area
                  dataKey="revenue"
                  type="natural"
                  fill="url(#fillRevenue)"
                  stroke="var(--color-revenue)"
                  strokeWidth={2}
                  dot={{ fill: "var(--color-revenue)", strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </AreaChart>
            </ChartContainer>
      </CardContent>
    </Card>
  )
}
