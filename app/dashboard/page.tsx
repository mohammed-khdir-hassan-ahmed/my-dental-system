"use client"

import { SectionCards } from "@/components/section-cards"
import { QuickAccess } from "@/components/quick-access"
import { AdditionalCharts } from "@/components/additional-charts"

export default function Page() {
  return (
    <>
      <SectionCards />
      <QuickAccess />
      <AdditionalCharts />
    </>
  )
}
