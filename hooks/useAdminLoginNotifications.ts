'use client'

import { useEffect, useRef } from 'react'
import { useUser } from '@/contexts/user-context'
import type { NotificationType } from '@/contexts/notifications-context'
import { notifyAdminUserLogin } from '@/lib/notify'

const LAST_ID_KEY = 'admin-last-notification-id'
const POLL_MS = 3_000

type AdminNotificationRow = {
  id: number
  type: string
  title: string
  message: string
  read: boolean
  createdAt: string
}

function serverTypeToClient(type: string): NotificationType {
  const allowed: NotificationType[] = [
    'sale',
    'patient',
    'sale_delete',
    'patient_delete',
    'staff',
    'staff_delete',
    'staff_advance',
    'expense',
    'expense_delete',
    'installment',
    'installment_payment',
    'installment_delete',
    'login',
    'success',
    'error',
    'info',
  ]
  if (allowed.includes(type as NotificationType)) {
    return type as NotificationType
  }
  return 'info'
}

function loadLastId(): number {
  if (typeof window === 'undefined') return 0
  const n = parseInt(sessionStorage.getItem(LAST_ID_KEY) ?? '0', 10)
  return Number.isFinite(n) ? n : 0
}

function saveLastId(id: number) {
  sessionStorage.setItem(LAST_ID_KEY, String(id))
}

/** بۆ ئەدمین: گوێگرتن بۆ چوونەژوورەوە و کردارەکانی بەکارهێنەران */
export function useAdminLoginNotifications() {
  const { user, loading } = useUser()
  const lastIdRef = useRef(0)

  useEffect(() => {
    if (loading || !user?.isAdmin) return

    lastIdRef.current = loadLastId()

    const deliver = (row: AdminNotificationRow, force = false) => {
      if (!force && row.id <= lastIdRef.current) return
      lastIdRef.current = Math.max(lastIdRef.current, row.id)
      saveLastId(lastIdRef.current)
      notifyAdminUserLogin(
        row.title,
        row.message,
        row.id,
        new Date(row.createdAt),
        serverTypeToClient(row.type)
      )
    }

    const fetchNotifications = async (url: string) => {
      const res = await fetch(url, { cache: 'no-store', credentials: 'include' })
      if (!res.ok) {
        console.warn('admin notifications:', res.status)
        return [] as AdminNotificationRow[]
      }
      const data = (await res.json()) as { notifications: AdminNotificationRow[] }
      return [...(data.notifications ?? [])].sort((a, b) => a.id - b.id)
    }

    const bootstrap = async () => {
      const unread = await fetchNotifications('/api/admin/notifications')
      for (const row of unread) {
        deliver(row, true)
      }
    }

    const poll = async () => {
      const rows = await fetchNotifications(
        `/api/admin/notifications?afterId=${lastIdRef.current}`
      )
      for (const row of rows) {
        deliver(row)
      }
    }

    void bootstrap().then(() => {
      void poll()
    })

    const interval = setInterval(() => void poll(), POLL_MS)
    return () => clearInterval(interval)
  }, [loading, user?.isAdmin, user?.id])
}
