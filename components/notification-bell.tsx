'use client'

import { useState } from 'react'
import { Bell, Trash2, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useNotifications } from '@/contexts/notifications-context'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { formatNotificationTime, getNotificationStyle } from '@/lib/notification-utils'
import { cn } from '@/lib/utils'

export function NotificationBell() {
  const { notifications, removeNotification, markAsRead, clearAll, unreadCount } =
    useNotifications()
  const [open, setOpen] = useState(false)

  const markServerNotificationsRead = async (serverIds: number[]) => {
    if (serverIds.length === 0) return
    try {
      await fetch('/api/admin/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: serverIds }),
      })
    } catch {
      // ناسینەوە لەسەر سێرڤەر — نەگەیەنراوە بە بەکارهێنەر
    }
  }

  const handleOpenChange = (next: boolean) => {
    setOpen(next)
    if (next && unreadCount > 0) {
      const unread = notifications.filter((n) => !n.read)
      unread.forEach((n) => markAsRead(n.id))
      const serverIds = unread
        .map((n) => n.serverId)
        .filter((id): id is number => typeof id === 'number')
      void markServerNotificationsRead(serverIds)
    }
  }

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon" className="relative" aria-label="ئاگادارکردنەوەکان">
          <Bell className="h-[1.2rem] w-[1.2rem]" />
          {unreadCount > 0 && (
            <span className="text-white absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full border border-background bg-destructive px-0.5 text-[9px] font-bold text-destructive-foreground">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
          <span className="sr-only">ئاگادارکردنەوەکان</span>
        </Button>
      </SheetTrigger>

      <SheetContent
        side="left"
        dir="rtl"
        showCloseButton={false}
        className={cn(
          'flex w-[min(100vw,calc(min(22vw,220px)))] flex-col gap-0 border-border bg-sidebar p-0 text-sidebar-foreground sm:max-w-[calc(min(22vw,220px))]',
          '[&>button]:hidden'
        )}
      >
        <SheetHeader className="sr-only">
          <SheetTitle>ئاگادارکردنەوەکان</SheetTitle>
          <SheetDescription>لیستی ئاگادارکردنەوەکانی سیستەم</SheetDescription>
        </SheetHeader>

        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-sidebar-border px-4 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-sidebar-border bg-background">
              <Bell className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-sidebar-foreground">ئاگادارکردنەوەکان</h2>
              {unreadCount > 0 ? (
                <p className="text-[11px] text-sidebar-foreground/60">{unreadCount} نوێ</p>
              ) : (
                <p className="text-[11px] text-sidebar-foreground/60">هەموو خوێندراونەتەوە</p>
              )}
            </div>
          </div>
          <Button
            variant="outline"
            size="icon-sm"
            className="shrink-0 border-sidebar-border bg-background"
            onClick={() => setOpen(false)}
            aria-label="داخستن"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        {notifications.length > 0 && (
          <div className="shrink-0 border-b border-sidebar-border px-3 py-2">
            <Button
              variant="outline"
              size="sm"
              onClick={clearAll}
              className="h-8 w-full gap-1.5 border-sidebar-border bg-background text-xs text-muted-foreground hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
              سڕینەوەی هەموو
            </Button>
          </div>
        )}

        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto px-2 py-2">
          {notifications.length === 0 ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-3 px-4 py-16 text-center">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg border border-sidebar-border bg-background">
                <Bell className="h-6 w-6 text-sidebar-foreground/30" />
              </div>
              <div>
                <p className="text-sm font-medium text-sidebar-foreground/80">
                  هیچ ئاگادارکردنەوەیەک نییە
                </p>
                <p className="mt-1 text-[11px] leading-relaxed text-sidebar-foreground/50">
                  کاتێک کردارێک لە سیستەمەکە بکەیت ، لێرە دەردەکەوێت
                </p>
              </div>
            </div>
          ) : (
            <ul className="flex flex-col gap-1">
              {notifications.map((notification) => {
                const style = getNotificationStyle(notification.type)
                const Icon = style.icon
                return (
                  <li key={notification.id}>
                    <button
                      type="button"
                      className={cn(
                        'group relative w-full rounded-md border border-sidebar-border bg-background p-2.5 text-right transition-colors',
                        'hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
                        !notification.read && 'ring-1 ring-primary/30'
                      )}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-2.5">
                        <div
                          className={cn(
                            'flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-sidebar-border bg-sidebar',
                            style.iconClass
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-semibold leading-snug">
                            {notification.title}
                          </p>
                          <p className="mt-0.5 text-[11px] leading-relaxed text-sidebar-foreground/70">
                            {notification.message}
                          </p>
                          <p className="mt-1.5 text-[10px] text-sidebar-foreground/45">
                            {formatNotificationTime(notification.timestamp)}
                          </p>
                        </div>
                        <span
                          role="button"
                          tabIndex={0}
                          className="shrink-0 rounded-md p-1 opacity-0 transition-opacity hover:bg-sidebar-accent group-hover:opacity-100"
                          onClick={(e) => {
                            e.stopPropagation()
                            removeNotification(notification.id)
                          }}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                              e.stopPropagation()
                              removeNotification(notification.id)
                            }
                          }}
                          aria-label="سڕینەوە"
                        >
                          <X className="h-3.5 w-3.5 text-muted-foreground" />
                        </span>
                      </div>
                      {!notification.read && (
                        <span className="absolute left-2 top-2 h-1.5 w-1.5 rounded-full bg-primary" />
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
