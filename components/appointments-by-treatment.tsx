"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { useEffect, useState } from "react"

interface TreatmentData {
  treatmentType: string
  count: number
  percentage: number
}

export function AppointmentsByTreatment() {
  const [data, setData] = useState<TreatmentData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchData() {
      try {
        const response = await fetch('/api/dashboard/treatment-stats')
        const result = await response.json()
        setData(result.data || [])
      } catch (error) {
        console.error('Error fetching treatment stats:', error)
        // Fallback data
        setData([
          { treatmentType: 'کاشتنی ددان', count: 45, percentage: 35 },
          { treatmentType: 'چارەسەری گشتی', count: 38, percentage: 30 },
          { treatmentType: 'بەیەکەردانەدانپڵەستە', count: 25, percentage: 20 },
          { treatmentType: 'پاککردنەوەی ددان', count: 19, percentage: 15 },
        ])
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <Card className="border-0 shadow-xl bg-white dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-slate-900 dark:text-white ">دانیشتن بەپێی جۆری چارەسەر</CardTitle>
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
    'bg-blue-500',
    'bg-emerald-500',
    'bg-purple-500',
    'bg-orange-500',
  ]

  return (
    <Card className="border-0 shadow-xl bg-white dark:bg-slate-900">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-slate-900 dark:text-white">دانیشتن بەپێی جۆری چارەسەر</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {data.map((item, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-300">{item.treatmentType}</span>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-slate-900 dark:text-white">{item.count}</span>
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
