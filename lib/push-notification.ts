import type { Notification } from '@/contexts/notifications-context'

export type NotificationInput = Omit<Notification, 'id' | 'read' | 'timestamp'> & {
  timestamp?: Date
}

let handler: ((notification: NotificationInput) => void) | null = null

export function registerPushNotificationHandler(
  fn: (notification: NotificationInput) => void
) {
  handler = fn
}

export function pushNotification(notification: NotificationInput) {
  handler?.(notification)
}
