import type { NextRequest } from 'next/server'
import { db } from '@/db/drizzle'
import { adminNotificationsTable } from '@/db/schema'
import { getSessionUser } from '@/lib/auth'
import { formatMoney } from '@/lib/notification-utils'
import { sendPushToAdmins } from '@/lib/send-push'

export type LoginMethod = 'email' | 'otp' | 'action'

export function formatLoginDateTime(date: Date) {
  const weekdays = [
    'یەکشەممە',
    'دووشەممە',
    'سێشەممە',
    'چوارشەممە',
    'پێنجشەممە',
    'هەینی',
    'شەممە'
  ]
  const months = [
    'کانوونی دووەم',
    'شوبات',
    'ئازار',
    'نیسان',
    'ئایار',
    'حوزەیران',
    'تەممووز',
    'ئاب',
    'ئەیلوول',
    'تشرینی یەکەم',
    'تشرینی دووەم',
    'کانوونی یەکەم'
  ]

  const weekday = weekdays[date.getDay()]
  const day = date.getDate()
  const month = months[date.getMonth()]
  const year = date.getFullYear()

  // Format time (e.g. 04:15 پێش نیوەڕۆ / دوای نیوەڕۆ)
  let hours = date.getHours()
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const ampm = hours >= 12 ? 'دوای نیوەڕۆ' : 'پێش نیوەڕۆ'
  hours = hours % 12
  hours = hours ? hours : 12 // the hour '0' should be '12'
  const hoursStr = String(hours).padStart(2, '0')

  const dateStr = `${weekday}، ${day}ی ${month}ی ${year}`
  const timeStr = `${hoursStr}:${minutes} ${ampm}`
  return { dateStr, timeStr, combined: `${dateStr} — کاتژمێر ${timeStr}` }
}

function actorLabel(session: NonNullable<Awaited<ReturnType<typeof getSessionUser>>>) {
  if (session.isOTPLogin) return 'بەکارهێنەری کۆدی تایبەت'
  return session.email
}

/** تۆمارکردنی ئاگادارکردنەوە لە داتابەیس بۆ ئەدمین */
export async function recordAdminNotification(params: {
  type: string
  title: string
  message: string
  userEmail: string
  userId?: number | null
  loginMethod?: LoginMethod | null
}) {
  try {
    await db.insert(adminNotificationsTable).values({
      type: params.type,
      userEmail: params.userEmail,
      userId: params.userId ?? null,
      loginMethod: params.loginMethod ?? 'action',
      title: params.title,
      message: params.message,
      read: false,
    })

    // ناردنی push notification بە شێوەیەکی خۆکار بۆ مۆبایل و وێبگەڕی ئەدمینەکان
    await sendPushToAdmins({
      title: params.title,
      body: params.message,
      tag: params.type + '-' + Date.now(),
      url: '/dashboard',
    })
  } catch (error) {
    console.error('recordAdminNotification error:', error)
  }
}

/** چوونەژوورەوە — تەنها بۆ بەکارهێنەری نا-ئەدمین */
export async function recordLoginNotification(params: {
  userEmail: string
  userId?: number | null
  method: 'email' | 'otp'
}) {
  const at = new Date()
  const { combined } = formatLoginDateTime(at)
  const methodLabel = params.method === 'otp' ? 'کۆدی تایبەت' : 'ئیمەیڵ و وشەی نهێنی'

  await recordAdminNotification({
    type: 'login',
    userEmail: params.userEmail,
    userId: params.userId ?? null,
    loginMethod: params.method,
    title: 'چوونەژوورەوەی نوێ',
    message: `بەکارهێنەری «${params.userEmail}» لە ${combined} بە ڕێگای ${methodLabel} چووە ژوورەوە`,
  })
}

/** کرداری بەکارهێنەر — ئەدمین ئاگادار دەکرێتەوە */
export async function recordAdminActionFromRequest(
  request: NextRequest | Request,
  event: { type: string; title: string; message: string }
) {
  const session = await getSessionUser(request as NextRequest)
  if (!session || session.isAdmin) return

  await recordAdminNotification({
    type: event.type,
    title: event.title,
    message: `${event.message} (لەلایەن «${actorLabel(session)}»)`,
    userEmail: session.isOTPLogin ? 'بەکارهێنەری کۆدی تایبەت' : session.email,
    userId: session.isOTPLogin ? null : session.id,
    loginMethod: 'action',
  })
}

// ——— پەیامەکانی ئامادە ———

export const adminActionMessages = {
  saleAdded: (productName: string, total: number) => ({
    type: 'sale',
    title: 'فرۆشتی نوێ',
    message: `کاڵای «${productName}» — ${formatMoney(total)} تۆمارکرا`,
  }),
  saleUpdated: (productName: string) => ({
    type: 'sale',
    title: 'فرۆشتن نوێکرایەوە',
    message: `کاڵای «${productName}» نوێکرایەوە`,
  }),
  saleDeleted: (productName: string) => ({
    type: 'sale_delete',
    title: 'فرۆشتن سڕایەوە',
    message: `کاڵای «${productName}» سڕایەوە`,
  }),
  patientAdded: (name: string, treatment?: string) => ({
    type: 'patient',
    title: 'نەخۆشی نوێ',
    message: treatment
      ? `نەخۆشی «${name}» — چارەسەر: ${treatment}`
      : `نەخۆشی «${name}» تۆمارکرا`,
  }),
  patientUpdated: (name: string) => ({
    type: 'patient',
    title: 'نەخۆش نوێکرایەوە',
    message: `نەخۆشی «${name}» نوێکرایەوە`,
  }),
  patientDeleted: (name: string) => ({
    type: 'patient_delete',
    title: 'نەخۆش سڕایەوە',
    message: `نەخۆشی «${name}» سڕایەوە`,
  }),
  expenseAdded: (title: string, amount: number) => ({
    type: 'expense',
    title: 'خەرجی نوێ',
    message: `«${title}» — ${formatMoney(amount)}`,
  }),
  expenseUpdated: (title: string) => ({
    type: 'expense',
    title: 'خەرجی نوێکرایەوە',
    message: `«${title}» نوێکرایەوە`,
  }),
  expenseDeleted: (title: string) => ({
    type: 'expense_delete',
    title: 'خەرجی سڕایەوە',
    message: `«${title}» سڕایەوە`,
  }),
  installmentAdded: (name: string) => ({
    type: 'installment',
    title: 'قیستی نوێ',
    message: `قیست بۆ «${name}» زیادکرا`,
  }),
  installmentPayment: (name: string, amount: number) => ({
    type: 'installment_payment',
    title: 'پارەدانی قیست',
    message: `${formatMoney(amount)} بۆ «${name}»`,
  }),
  installmentDeleted: (name: string) => ({
    type: 'installment_delete',
    title: 'قیست سڕایەوە',
    message: `قیستی «${name}» سڕایەوە`,
  }),
  staffAdded: (name: string) => ({
    type: 'staff',
    title: 'کارمەندی نوێ',
    message: `«${name}» زیادکرا`,
  }),
  staffUpdated: (name: string) => ({
    type: 'staff',
    title: 'کارمەند نوێکرایەوە',
    message: `«${name}» نوێکرایەوە`,
  }),
  staffDeleted: () => ({
    type: 'staff_delete',
    title: 'کارمەند سڕایەوە',
    message: 'کارمەندێک سڕایەوە',
  }),
}
