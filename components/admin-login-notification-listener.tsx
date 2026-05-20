'use client'

import { useAdminLoginNotifications } from '@/hooks/useAdminLoginNotifications'

/** بێ UI — تەنها گوێ لە چوونەژوورەوەی بەکارهێنەران دەگرێت بۆ ئەدمین */
export function AdminLoginNotificationListener() {
  useAdminLoginNotifications()
  return null
}
