"use client"

import { SectionCards } from "@/components/section-cards"
import { QuickAccess } from "@/components/quick-access"
import { ChartJSDashboard } from "@/components/chartjs-dashboard"
import { DashboardPageShell } from "@/components/dashboard-page-shell"

export default function Page() {
  return (
    <DashboardPageShell className="space-y-6 sm:space-y-8">
      <SectionCards />
      <QuickAccess />
      <ChartJSDashboard />
    </DashboardPageShell>
  )
}
