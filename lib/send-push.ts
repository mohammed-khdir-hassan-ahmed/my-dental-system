import webpush from 'web-push'
import { db } from '@/db/drizzle'
import { pushSubscriptionsTable, usersTable } from '@/db/schema'
import { eq } from 'drizzle-orm'

// VAPID keys setup - lazy initialization
let vapidDetailsInitialized = false

function initializeVapidDetails() {
  if (vapidDetailsInitialized) return

  const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY
  const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY

  if (!VAPID_PUBLIC_KEY || !VAPID_PRIVATE_KEY) {
    console.warn('VAPID keys not configured, push notifications will not work')
    return
  }

  webpush.setVapidDetails(
    'mailto:admin@dental-system.com',
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY
  )
  vapidDetailsInitialized = true
}

/**
 * نێردنی Web Push Notification بۆ هەموو ئەدمینەکان
 */
export async function sendPushToAdmins(payload: {
  title: string
  body: string
  icon?: string
  tag?: string
  url?: string
}) {
  const summary = {
    vapidConfigured: vapidDetailsInitialized,
    subscriptionsFound: 0,
    sent: 0,
    failed: 0,
  }

  try {
    // Initialize VAPID details on first use
    initializeVapidDetails()
    summary.vapidConfigured = vapidDetailsInitialized
    if (!summary.vapidConfigured) {
      return summary
    }

    // هەموو ئەدمینەکان بدۆزەرەوە
    const admins = await db
      .select({ id: usersTable.id })
      .from(usersTable)
      .where(eq(usersTable.role, 'admin'))

    const adminIds = admins.map((a) => a.id)
    if (adminIds.length === 0) return summary

    // هەموو push subscriptions ی ئەدمینەکان بهێنە
    const subscriptions = await db
      .select()
      .from(pushSubscriptionsTable)

    // تەنها ئەوانەی کە بۆ ئەدمینن فلتەر بکە
    const adminSubscriptions = subscriptions.filter((sub) =>
      adminIds.includes(sub.userId)
    )

    summary.subscriptionsFound = adminSubscriptions.length
    if (adminSubscriptions.length === 0) return summary

    const pushPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      icon: payload.icon || '/icon/tooth.png',
      tag: payload.tag || 'admin-login-' + Date.now(),
      url: payload.url || '/dashboard',
      timestamp: Date.now(),
    })

    // نێردنی push بۆ هەموو subscription ەکان
    const results = await Promise.allSettled(
      adminSubscriptions.map(async (sub) => {
        try {
          await webpush.sendNotification(
            {
              endpoint: sub.endpoint,
              keys: {
                p256dh: sub.p256dh,
                auth: sub.auth,
              },
            },
            pushPayload
          )
        } catch (error: unknown) {
          // ئەگەر subscription بەسەرچوو (410 Gone یان 404)، بیسڕەوە
          if (
            error &&
            typeof error === 'object' &&
            'statusCode' in error &&
            ((error as { statusCode: number }).statusCode === 410 ||
              (error as { statusCode: number }).statusCode === 404)
          ) {
            await db
              .delete(pushSubscriptionsTable)
              .where(eq(pushSubscriptionsTable.id, sub.id))
          }
          throw error
        }
      })
    )

    const succeeded = results.filter((r) => r.status === 'fulfilled').length
    const failed = results.filter((r) => r.status === 'rejected').length
    summary.sent = succeeded
    summary.failed = failed
    if (failed > 0) {
      console.warn(`Push notifications: ${succeeded} sent, ${failed} failed`)
    }
    return summary
  } catch (error) {
    console.error('sendPushToAdmins error:', error)
    summary.failed += 1
    return summary
  }
}
