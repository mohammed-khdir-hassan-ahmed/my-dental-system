'use client'

import { createContext, useContext, useState, ReactNode } from 'react'

export type TimePeriod = 'today' | 'week' | 'month' | 'custom' | 'all'

interface DashboardFilterContextType {
  period: TimePeriod
  startDate?: string
  endDate?: string
  setPeriod: (period: TimePeriod, startDate?: string, endDate?: string) => void
}

const DashboardFilterContext = createContext<DashboardFilterContextType | undefined>(undefined)

export function DashboardFilterProvider({ children }: { children: ReactNode }) {
  const [period, setPeriodState] = useState<TimePeriod>('today')
  const [startDate, setStartDate] = useState<string | undefined>()
  const [endDate, setEndDate] = useState<string | undefined>()

  const setPeriod = (newPeriod: TimePeriod, newStartDate?: string, newEndDate?: string) => {
    setPeriodState(newPeriod)
    setStartDate(newStartDate)
    setEndDate(newEndDate)
  }

  return (
    <DashboardFilterContext.Provider value={{ period, startDate, endDate, setPeriod }}>
      {children}
    </DashboardFilterContext.Provider>
  )
}

export function useDashboardFilter() {
  const context = useContext(DashboardFilterContext)
  if (context === undefined) {
    throw new Error('useDashboardFilter must be used within a DashboardFilterProvider')
  }
  return context
}
