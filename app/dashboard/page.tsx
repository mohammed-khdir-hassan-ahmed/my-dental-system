"use client"

import { SectionCards } from "@/components/section-cards"
import { QuickAccess } from "@/components/quick-access"
import { ChartJSDashboard } from "@/components/chartjs-dashboard"

export default function Page() {
  return (
    <>
      <SectionCards />
      <QuickAccess />
      <ChartJSDashboard />
    </>
  )
}
