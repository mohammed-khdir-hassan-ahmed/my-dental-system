"use client"

import * as React from "react"
import { memo } from "react"
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const treatmentData = [
  { name: "چارەسەری گشتی", value: 400, color: "#10b981" },
  { name: "دانەدان", value: 300, color: "#3b82f6" },
  { name: "پڵەستە", value: 300, color: "#8b5cf6" },
  { name: "کاشتنی ددان", value: 200, color: "#f59e0b" },
  { name: "بەیەکەر", value: 150, color: "#ef4444" },
]

const revenueData = [
  { name: "دانیشتن", value: 65, color: "#10b981" },
  { name: "فرۆشتن", value: 25, color: "#3b82f6" },
  { name: "قیست", value: 10, color: "#8b5cf6" },
]

export const AdditionalCharts = memo(function AdditionalCharts() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-0 shadow-xl bg-white dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-white">دانیشتن بەپێی جۆری چارەسەر</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>

      <Card className="border-0 shadow-xl bg-white dark:bg-slate-900">
        <CardHeader>
          <CardTitle className="text-slate-900 dark:text-white">بەشی داهات</CardTitle>
        </CardHeader>
        <CardContent>
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
        </CardContent>
      </Card>
    </div>
  )
})
