'use client'

import Link from 'next/link'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { PERMISSION_LABELS } from '@/lib/permissions'

function getSectionLabel(pathname: string, search: string): string {
  if (pathname.startsWith('/dashboard/admin')) {
    return PERMISSION_LABELS.manage_users
  }
  if (pathname.startsWith('/dashboard/staff')) {
    return PERMISSION_LABELS.staff
  }
  if (pathname.startsWith('/dashboard/reports')) {
    const type = new URLSearchParams(search).get('type')
    if (type === 'employees') return PERMISSION_LABELS.reports_employees
    if (type === 'installments') return PERMISSION_LABELS.reports_installments
    if (type === 'sales') return PERMISSION_LABELS.reports_sales
    return PERMISSION_LABELS.reports_expenses
  }
  if (pathname.startsWith('/dashboard/appointments')) return PERMISSION_LABELS.appointments
  if (pathname.startsWith('/dashboard/seller')) return PERMISSION_LABELS.seller
  if (pathname.startsWith('/dashboard/installments')) return PERMISSION_LABELS.installments
  if (pathname.startsWith('/dashboard/expenses')) return PERMISSION_LABELS.expenses
  if (pathname.startsWith('/dashboard/settings')) return PERMISSION_LABELS.settings
  if (pathname === '/dashboard') return PERMISSION_LABELS.dashboard
  return 'ئەم بەشە'
}

type AccessDeniedProps = {
  pathname: string
  search?: string
}

export function AccessDenied({ pathname, search = '' }: AccessDeniedProps) {
  const sectionName = getSectionLabel(pathname, search)

  return (
    <div className="flex min-h-[50vh] items-center justify-center px-4 py-28"dir="rtl">
      <Card className="w-full max-w-sm items-center gap-0 px-6 py-10 text-center">
        <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
          <Lock className="h-6 w-6 text-muted-foreground bg-" strokeWidth={1.75} />
        </div>

        <h2 className="mb-2 text-lg font-semibold text-foreground">
          تۆ ناتوانیت ئەم بەشە بەکاربهێنیت
        </h2>

        <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
          دەسەڵاتت نییە بۆ{' '}
          <span className="font-medium text-foreground">{sectionName}</span> ئەگەر پێویستت بە
          دەستگەیشتنە بۆ ئەم بەشە ، پەیوەندی بە ئەدمین بکە
        </p>

        <Button asChild size="sm">
          <Link href="/dashboard">گەڕانەوە بۆ داشبۆرد</Link>
        </Button>
      </Card>
    </div>
  )
}

