'use client'

import { usePathname } from 'next/navigation'
import { Separator } from "@/components/ui/separator"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { ThemeToggle } from "@/components/theme-toggle"
import { TimeFilter } from "@/components/time-filter"
import { NotificationBell } from "@/components/notification-bell"

const pageNames: Record<string, string> = {
  '/dashboard': 'داشبۆرد',
  '/dashboard/appointments': 'سەرەبڕین',
  '/dashboard/patients': ' بەشی فرۆشتن',
  '/dashboard/patients/new': 'تۆمارکردنی نەخۆشی نوێ',
  '/dashboard/dental-map': 'نەخشەی ددان و چارەسەر',
  '/dashboard/prescriptions': 'ڕەچەتەی دەرمان',
  '/dashboard/installments': ' قیستەکان',
  '/dashboard/expenses': 'خەرجیەکان',
  '/dashboard/reports': 'راپۆرتەکان',
  '/dashboard/settings': 'ڕێکخستنەکان',
  '/dashboard/seller': 'بەشی فرۆشتن',
  '/dashboard/admin/users': 'بەکارهێنەرەکان',
}

export function SiteHeader() {
  const pathname = usePathname()
  const pageTitle = pageNames[pathname] || 'کارمەندەکان'
  const isDashboard = pathname === '/dashboard'

  return (
    <header className="fixed top-0 right-0 left-0 z-40 flex h-16 shrink-0 items-center justify-between gap-2 border-b border-border/40 bg-background backdrop-blur-sm transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-16">
      <div className="flex items-center gap-1 px-3 sm:px-4 lg:gap-2 lg:px-6">
        <SidebarTrigger className="-ml-1 h-8 w-8 sm:h-9 sm:w-9" />
        <Separator
          orientation="vertical"
          className="mx-1 sm:mx-2 data-[orientation=vertical]:h-4"
        />
        <div className="flex items-center gap-3">
          <h1 className="text-base font-bold text-primary sm:text-lg">{pageTitle}</h1>
          {isDashboard && <TimeFilter />}
        </div>
      </div>
      <div className="flex items-center gap-2 px-3 sm:px-4 lg:gap-3 lg:px-6">
      <ThemeToggle />
        <NotificationBell />
     
      </div>
    </header>
  )
}
