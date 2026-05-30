'use client'

import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from 'react'
import { preloadNotificationSounds } from '@/lib/notification-sound'
import {
  registerPushNotificationHandler,
  type NotificationInput,
} from '@/lib/push-notification'

export type NotificationType =
  | 'sale'
  | 'patient'
  | 'sale_delete'
  | 'patient_delete'
  | 'staff'
  | 'staff_delete'
  | 'staff_advance'
  | 'expense'
  | 'expense_delete'
  | 'installment'
  | 'installment_payment'
  | 'installment_delete'
  | 'appointment'
  | 'success'
  | 'error'
  | 'info'
  | 'login'

export interface Notification {
  id: string
  type: NotificationType
  title: string
  message: string
  timestamp: Date
  read: boolean
  /** ناسنامەی ڕیز لە داتابەیس — بۆ نۆتیفیکەیشنی چوونەژوورەوەی ئەدمین */
  serverId?: number
}

interface NotificationsContextType {
  notifications: Notification[]
  addNotification: (notification: NotificationInput) => void
  removeNotification: (id: string) => void
  markAsRead: (id: string) => void
  clearAll: () => void
  unreadCount: number
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined)

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  const addNotification = useCallback((notification: NotificationInput) => {
    const { timestamp: providedAt, ...rest } = notification
    const newNotification: Notification = {
      ...rest,
      id: `${Date.now()}-${Math.random()}`,
      timestamp: providedAt ?? new Date(),
      read: false,
    }

    setNotifications((prev) => [newNotification, ...prev].slice(0, 50))
  }, [])

  useEffect(() => {
    preloadNotificationSounds()
    registerPushNotificationHandler(addNotification)
    return () => registerPushNotificationHandler(() => {})
  }, [addNotification])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id))
  }, [])

  const markAsRead = useCallback((id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    )
  }, [])

  const clearAll = useCallback(() => {
    setNotifications([])
  }, [])

  const unreadCount = notifications.filter((n) => !n.read).length

  return (
    <NotificationsContext.Provider
      value={{
        notifications,
        addNotification,
        removeNotification,
        markAsRead,
        clearAll,
        unreadCount,
      }}
    >
      {children}
    </NotificationsContext.Provider>
  )
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (context === undefined) {
    throw new Error('useNotifications must be used within a NotificationsProvider')
  }
  return context
}
