'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { usePermissions } from '@/hooks/usePermissions'
import { canAccessPath } from '@/lib/permissions'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { AccessDenied } from '@/components/access-denied'

export function DashboardRouteGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { user, loading } = usePermissions()

  const fullPath =
    searchParams.toString().length > 0
      ? `${pathname}?${searchParams.toString()}`
      : pathname

  const allowed =
    !loading &&
    user &&
    canAccessPath(fullPath, user.role, user.permissions)

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center" dir="rtl">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    return (
      <div className="flex min-h-[40vh] flex-col items-center justify-center gap-3 text-center" dir="rtl">
        <p className="text-lg font-semibold text-foreground">تکایە دووبارە بچۆرە ژوورەوە</p>
        <Button asChild>
          <Link href="/login">چوونە ژوورەوە</Link>
        </Button>
      </div>
    )
  }

  if (!allowed) {
    return (
      <AccessDenied
        pathname={pathname}
        search={searchParams.toString()}
      />
    )
  }

  return <>{children}</>
}
