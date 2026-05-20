import type { NotificationType } from '@/contexts/notifications-context'
import { pushNotification } from '@/lib/push-notification'
import { playNotificationSound } from '@/lib/notification-sound'
import { formatMoney } from '@/lib/notification-utils'
import { showSonnerToast } from '@/lib/show-toast'

type SoundVariant = 'sale' | 'patient'

function notify({
  type,
  title,
  message,
  sound,
  isError = false,
  serverId,
  timestamp,
}: {
  type: NotificationType
  title: string
  message: string
  sound?: SoundVariant
  isError?: boolean
  serverId?: number
  timestamp?: Date
}) {
  showSonnerToast(message)
  pushNotification({ type, title, message, serverId, timestamp })
  if (sound && !isError) {
    void playNotificationSound(sound)
  }
}

// ——— فرۆشتن ———
export function notifySaleAdded(productName: string, amount: number, quantity = 1) {
  const total = amount * quantity
  notify({
    type: 'sale',
    title: 'فرۆشتی نوێ',
    message: `کاڵای «${productName}» — ${formatMoney(total)} تۆمارکرا`,
    sound: 'sale',
  })
}

export function notifySaleUpdated(productName: string) {
  notify({
    type: 'sale',
    title: 'فرۆشتن نوێکرایەوە',
    message: `کاڵای «${productName}» بە سەرکەوتوویی نوێکرایەوە`,
    sound: 'sale',
  })
}

export function notifySaleDeleted(productName: string, total?: number) {
  const amount = total != null && total > 0 ? ` — ${formatMoney(total)}` : ''
  notify({
    type: 'sale_delete',
    title: 'فرۆشتن سڕایەوە',
    message: `کاڵای «${productName}»${amount} لە تۆمارەوە سڕایەوە`,
    sound: 'sale',
  })
}

// ——— نەخۆش ———
export function notifyPatientAdded(patientName: string, treatmentType?: string) {
  const detail = treatmentType ? ` · چارەسەر: ${treatmentType}` : ''
  notify({
    type: 'patient',
    title: 'نەخۆشی نوێ',
    message: `نەخۆشی «${patientName}» بە سەرکەوتوویی تۆمارکرا${detail}`,
    sound: 'patient',
  })
}

export function notifyPatientUpdated(patientName: string) {
  notify({
    type: 'patient',
    title: 'نەخۆش نوێکرایەوە',
    message: `زانیاری «${patientName}» بە سەرکەوتوویی نوێکرایەوە`,
    sound: 'patient',
  })
}

export function notifyPatientDeleted(patientName: string) {
  notify({
    type: 'patient_delete',
    title: 'نەخۆش سڕایەوە',
    message: `نەخۆشی «${patientName}» لە تۆمارەوە سڕایەوە`,
    sound: 'patient',
  })
}

// ——— کارمەند ———
export function notifyStaffAdded(name: string) {
  notify({
    type: 'staff',
    title: 'کارمەندی نوێ',
    message: `«${name}» بە سەرکەوتوویی زیاد کرا`,
    sound: 'sale',
  })
}

export function notifyStaffUpdated(name: string) {
  notify({
    type: 'staff',
    title: 'کارمەند نوێکرایەوە',
    message: `زانیاری «${name}» بە سەرکەوتوویی نوێکرایەوە`,
    sound: 'sale',
  })
}

export function notifyStaffDeleted() {
  notify({
    type: 'staff_delete',
    title: 'کارمەند سڕایەوە',
    message: 'کارمەند بە سەرکەوتوویی سڕایەوە',
    sound: 'sale',
  })
}

export function notifyAdvanceRecorded(amount: string, isSalary = false) {
  const label = isSalary ? 'موچە' : 'پێشەکی'
  notify({
    type: 'staff_advance',
    title: `${label} تۆمارکرا`,
    message: `${label} بە بڕی ${formatMoney(Number(amount) || 0)} تۆمار کرا`,
    sound: 'sale',
  })
}

export function notifyMonthClosed() {
  notify({
    type: 'success',
    title: 'کۆتایی مانگ',
    message: 'مانگەکە بە سەرکەوتوویی کۆتایی هات',
    sound: 'sale',
  })
}

export function notifyMonthlyReportCreated() {
  notify({
    type: 'success',
    title: 'ڕاپۆرتی مانگانە',
    message: 'ڕاپۆرتی مانگانە بە سەرکەوتوویی دروستکرا',
    sound: 'sale',
  })
}

// ——— خەرجی ———
export function notifyExpenseAdded(title: string, amount: number) {
  notify({
    type: 'expense',
    title: 'خەرجی نوێ',
    message: `«${title}» — ${formatMoney(amount)} تۆمارکرا`,
    sound: 'sale',
  })
}

export function notifyExpenseUpdated(title: string) {
  notify({
    type: 'expense',
    title: 'خەرجی نوێکرایەوە',
    message: `«${title}» بە سەرکەوتوویی نوێکرایەوە`,
    sound: 'sale',
  })
}

export function notifyExpenseDeleted(title: string) {
  notify({
    type: 'expense_delete',
    title: 'خەرجی سڕایەوە',
    message: `«${title}» لە تۆمارەوە سڕایەوە`,
    sound: 'sale',
  })
}

// ——— قیست ———
export function notifyInstallmentAdded(patientName: string) {
  notify({
    type: 'installment',
    title: 'قیستی نوێ',
    message: `قیست بۆ «${patientName}» بە سەرکەوتوویی زیاد کرا`,
    sound: 'patient',
  })
}

export function notifyInstallmentPayment(patientName: string, amount: number) {
  notify({
    type: 'installment_payment',
    title: 'پارەدان',
    message: `پارەی ${formatMoney(amount)} بۆ «${patientName}» تۆمار کرا`,
    sound: 'patient',
  })
}

export function notifyInstallmentDeleted(patientName: string) {
  notify({
    type: 'installment_delete',
    title: 'قیست سڕایەوە',
    message: `قیستی «${patientName}» سڕایەوە`,
    sound: 'patient',
  })
}

// ——— ڕێکخستن ———
export function notifySettingsUpdated(label: string, detail?: string) {
  notify({
    type: 'success',
    title: label,
    message: detail ?? `${label} بە سەرکەوتوویی جێبەجێ کرا`,
    sound: 'sale',
  })
}

// ——— بەکارهێنەر (ئەدمین) ———
export function notifyUserAdded(email: string) {
  notify({
    type: 'staff',
    title: 'بەکارهێنەری نوێ',
    message: `«${email}» بە سەرکەوتوویی دروستکرا`,
    sound: 'sale',
  })
}

export function notifyUserUpdated(email: string) {
  notify({
    type: 'staff',
    title: 'بەکارهێنەر نوێکرایەوە',
    message: `«${email}» بە سەرکەوتوویی نوێکرایەوە`,
    sound: 'sale',
  })
}

export function notifyUserDeleted(email: string) {
  notify({
    type: 'staff_delete',
    title: 'بەکارهێنەر سڕایەوە',
    message: `«${email}» لە سیستەمەوە سڕایەوە`,
    sound: 'sale',
  })
}

// ——— چوونەژوورەوە ———
export function notifyLoginSuccess() {
  notify({
    type: 'success',
    title: 'چوونەژوورەوە',
    message: 'بەسەرکەوتوویی چوویتە ژوورەوە',
    sound: 'sale',
  })
}

export function notifyLoginError(message: string) {
  notify({ type: 'error', title: 'چوونەژوورەوە', message, isError: true })
}

export function notifyLogout() {
  notify({
    type: 'info',
    title: 'چوونەدەرەوە',
    message: 'بە سەرکەوتوویی لە سیستەمەکە دەرچوویت',
    sound: 'sale',
  })
}

// ——— PDF و ڕاپۆرت ———
export function notifyPdfExported(label = 'PDF') {
  notify({
    type: 'info',
    title: 'داگرتن',
    message: `${label} بە سەرکەوتوویی دابەزێنرا`,
    sound: 'sale',
  })
}

export function notifyPdfError(message: string) {
  notify({ type: 'error', title: 'هەڵە لە PDF', message, isError: true })
}

export function notifyPaymentAmountSynced() {
  notify({
    type: 'success',
    title: 'ڕێکخستن',
    message: 'بڕی دراو بە سەرکەوتوویی ڕێکخرا',
    sound: 'sale',
  })
}

export function notifyTestDataGenerated() {
  notify({
    type: 'success',
    title: 'داتای تاقیکاری',
    message: 'داتای وهمەیی بە سەرکەوتوویی زیادکرا',
    sound: 'sale',
  })
}

// ——— ئاگادارکردنەوەی ئەدمین (چوونەژوورەوە) ———
export function notifyAdminUserLogin(
  title: string,
  message: string,
  serverId: number,
  timestamp?: Date,
  type: NotificationType = 'login'
) {
  notify({
    type,
    title,
    message,
    sound: type === 'login' || type === 'patient' ? 'patient' : 'sale',
    serverId,
    timestamp,
  })
}

// ——— هەڵە ———
export function notifyActionError(message: string, title = 'هەڵە') {
  notify({ type: 'error', title, message, isError: true })
}
