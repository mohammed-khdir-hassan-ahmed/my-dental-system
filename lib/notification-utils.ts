import type { NotificationType } from '@/contexts/notifications-context'
import {
  ShoppingCart,
  Users,
  User,
  Calendar,
  CheckCircle2,
  XCircle,
  Info,
  Bell,
  Trash2,
  Wallet,
  Receipt,
  CreditCard,
  LogIn,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export function formatMoney(value: number) {
  const formatted = Number(value).toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
  return `${formatted} د.ع`
}

export function formatNotificationTime(date: Date) {
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  const seconds = Math.floor(diff / 1000)
  const minutes = Math.floor(seconds / 60)
  const hours = Math.floor(minutes / 60)

  if (seconds < 60) return 'ئێستا'
  if (minutes < 60) return `پێش ${minutes} خولەک`
  if (hours < 24) return `پێش ${hours} کاتژمێر`
  return date.toLocaleDateString('ku-IQ', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export interface NotificationStyle {
  icon: LucideIcon
  iconClass: string
  cardClass: string
  accentClass: string
  gradient: string
  ringClass: string
}

export function getNotificationStyle(type: NotificationType): NotificationStyle {
  switch (type) {
    case 'sale':
      return {
        icon: ShoppingCart,
        iconClass: 'text-emerald-600 dark:text-emerald-400',
        cardClass: 'bg-emerald-50/90 dark:bg-emerald-950/40 border-emerald-200/80 dark:border-emerald-800/60',
        accentClass: 'border-r-emerald-500',
        gradient: 'from-emerald-500/20 to-teal-500/10',
        ringClass: 'ring-emerald-500/30',
      }
    case 'patient':
      return {
        icon: Users,
        iconClass: 'text-blue-600 dark:text-blue-400',
        cardClass: 'bg-blue-50/90 dark:bg-blue-950/40 border-blue-200/80 dark:border-blue-800/60',
        accentClass: 'border-r-blue-500',
        gradient: 'from-blue-500/20 to-cyan-500/10',
        ringClass: 'ring-blue-500/30',
      }
    case 'sale_delete':
      return {
        icon: Trash2,
        iconClass: 'text-rose-600 dark:text-rose-400',
        cardClass: 'bg-rose-50/90 dark:bg-rose-950/40 border-rose-200/80 dark:border-rose-800/60',
        accentClass: 'border-r-rose-500',
        gradient: 'from-rose-500/20 to-orange-500/10',
        ringClass: 'ring-rose-500/30',
      }
    case 'patient_delete':
      return {
        icon: Trash2,
        iconClass: 'text-orange-600 dark:text-orange-400',
        cardClass: 'bg-orange-50/90 dark:bg-orange-950/40 border-orange-200/80 dark:border-orange-800/60',
        accentClass: 'border-r-orange-500',
        gradient: 'from-orange-500/20 to-amber-500/10',
        ringClass: 'ring-orange-500/30',
      }
    case 'staff':
    case 'staff_advance':
      return {
        icon: User,
        iconClass: 'text-violet-600 dark:text-violet-400',
        cardClass: 'bg-violet-50/90 dark:bg-violet-950/40 border-violet-200/80 dark:border-violet-800/60',
        accentClass: 'border-r-violet-500',
        gradient: 'from-violet-500/20 to-purple-500/10',
        ringClass: 'ring-violet-500/30',
      }
    case 'staff_delete':
      return {
        icon: Trash2,
        iconClass: 'text-violet-600 dark:text-violet-400',
        cardClass: 'bg-violet-50/90 dark:bg-violet-950/40 border-violet-200/80 dark:border-violet-800/60',
        accentClass: 'border-r-violet-500',
        gradient: 'from-violet-500/20 to-purple-500/10',
        ringClass: 'ring-violet-500/30',
      }
    case 'expense':
      return {
        icon: Receipt,
        iconClass: 'text-amber-600 dark:text-amber-400',
        cardClass: 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-800/60',
        accentClass: 'border-r-amber-500',
        gradient: 'from-amber-500/20 to-yellow-500/10',
        ringClass: 'ring-amber-500/30',
      }
    case 'expense_delete':
      return {
        icon: Trash2,
        iconClass: 'text-amber-600 dark:text-amber-400',
        cardClass: 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-800/60',
        accentClass: 'border-r-amber-500',
        gradient: 'from-amber-500/20 to-yellow-500/10',
        ringClass: 'ring-amber-500/30',
      }
    case 'installment':
      return {
        icon: CreditCard,
        iconClass: 'text-cyan-600 dark:text-cyan-400',
        cardClass: 'bg-cyan-50/90 dark:bg-cyan-950/40 border-cyan-200/80 dark:border-cyan-800/60',
        accentClass: 'border-r-cyan-500',
        gradient: 'from-cyan-500/20 to-blue-500/10',
        ringClass: 'ring-cyan-500/30',
      }
    case 'installment_payment':
      return {
        icon: Wallet,
        iconClass: 'text-cyan-600 dark:text-cyan-400',
        cardClass: 'bg-cyan-50/90 dark:bg-cyan-950/40 border-cyan-200/80 dark:border-cyan-800/60',
        accentClass: 'border-r-cyan-500',
        gradient: 'from-cyan-500/20 to-blue-500/10',
        ringClass: 'ring-cyan-500/30',
      }
    case 'installment_delete':
      return {
        icon: Trash2,
        iconClass: 'text-cyan-600 dark:text-cyan-400',
        cardClass: 'bg-cyan-50/90 dark:bg-cyan-950/40 border-cyan-200/80 dark:border-cyan-800/60',
        accentClass: 'border-r-cyan-500',
        gradient: 'from-cyan-500/20 to-blue-500/10',
        ringClass: 'ring-cyan-500/30',
      }
    case 'login':
      return {
        icon: LogIn,
        iconClass: 'text-sky-600 dark:text-sky-400',
        cardClass: 'bg-sky-50/90 dark:bg-sky-950/40 border-sky-200/80 dark:border-sky-800/60',
        accentClass: 'border-r-sky-500',
        gradient: 'from-sky-500/20 to-blue-500/10',
        ringClass: 'ring-sky-500/30',
      }
    case 'appointment':
      return {
        icon: Calendar,
        iconClass: 'text-amber-600 dark:text-amber-400',
        cardClass: 'bg-amber-50/90 dark:bg-amber-950/40 border-amber-200/80 dark:border-amber-800/60',
        accentClass: 'border-r-amber-500',
        gradient: 'from-amber-500/20 to-orange-500/10',
        ringClass: 'ring-amber-500/30',
      }
    case 'success':
      return {
        icon: CheckCircle2,
        iconClass: 'text-green-600 dark:text-green-400',
        cardClass: 'bg-green-50/90 dark:bg-green-950/40 border-green-200/80 dark:border-green-800/60',
        accentClass: 'border-r-green-500',
        gradient: 'from-green-500/20 to-emerald-500/10',
        ringClass: 'ring-green-500/30',
      }
    case 'error':
      return {
        icon: XCircle,
        iconClass: 'text-red-600 dark:text-red-400',
        cardClass: 'bg-red-50/90 dark:bg-red-950/40 border-red-200/80 dark:border-red-800/60',
        accentClass: 'border-r-red-500',
        gradient: 'from-red-500/20 to-rose-500/10',
        ringClass: 'ring-red-500/30',
      }
    default:
      return {
        icon: Info,
        iconClass: 'text-slate-600 dark:text-slate-400',
        cardClass: 'bg-slate-50/90 dark:bg-slate-900/40 border-slate-200/80 dark:border-slate-700/60',
        accentClass: 'border-r-slate-500',
        gradient: 'from-slate-500/20 to-slate-400/10',
        ringClass: 'ring-slate-500/30',
      }
  }
}

export const defaultNotificationStyle: NotificationStyle = {
  icon: Bell,
  iconClass: 'text-primary',
  cardClass: 'bg-card border-border',
  accentClass: 'border-r-primary',
  gradient: 'from-primary/20 to-primary/5',
  ringClass: 'ring-primary/30',
}
