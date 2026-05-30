"use client"

import { useState, useEffect } from "react"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { useDashboardFilter } from "@/contexts/dashboard-filter-context"

export type TimePeriod = 'today' | 'week' | 'month' | 'custom' | 'all'

export function TimeFilter() {
  const { period: currentPeriod, setPeriod: onPeriodChange } = useDashboardFilter()
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')

  const handlePeriodChange = (value: TimePeriod) => {
    if (value === 'custom') {
      // Don't trigger immediately for custom, wait for dates to be selected
      setCustomStartDate('')
      setCustomEndDate('')
    } else {
      onPeriodChange(value)
    }
  }

  const handleStartDateChange = (value: string) => {
    setCustomStartDate(value)
    if (customEndDate && value) {
      onPeriodChange('custom', value, customEndDate)
    }
  }

  const handleEndDateChange = (value: string) => {
    setCustomEndDate(value)
    if (customStartDate && value) {
      onPeriodChange('custom', customStartDate, value)
    }
  }

  // Reset dates when switching away from custom
  useEffect(() => {
    if (currentPeriod !== 'custom') {
      setCustomStartDate('')
      setCustomEndDate('')
    }
  }, [currentPeriod])

  return (
    <div className="flex items-center gap-2 ">
      <Select value={currentPeriod} onValueChange={handlePeriodChange}>
        <SelectTrigger
          size="sm"
          className="!h-8 !min-h-7 border-black-1 py-0 text-xs"
        >
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="today">ئەمڕۆ</SelectItem>
          <SelectItem value="week">ئەم حەفتەیە</SelectItem>
          <SelectItem value="month">ئەم مانگە</SelectItem>
          <SelectItem value="all">سەرجەم</SelectItem>
          <SelectItem value="custom">بەرواری تایبەت</SelectItem>
        </SelectContent>
      </Select>
      {currentPeriod === 'custom' && (
        <div className="flex gap-2">
          <Input
            type="date"
            value={customStartDate}
            onChange={(e) => handleStartDateChange(e.target.value)}
            className="h-7 py-0 text-xs"
          />
          <Input
            type="date"
            value={customEndDate}
            onChange={(e) => handleEndDateChange(e.target.value)}
            className="h-7 py-0 text-xs"
          />
        </div>
      )}
    </div>
  )
}
