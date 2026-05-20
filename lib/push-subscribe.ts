/**
 * کلاینت: ڕەجیستەرکردنی Service Worker و subscribe بۆ push notifications
 */

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

/** چەکی push notification پشتگیری دەکرێت؟ */
export function isPushSupported(): boolean {
  return (
    typeof window !== 'undefined' &&
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window
  )
}

/** ڕەجیستەرکردنی service worker */
export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) return null

  try {
    const registration = await navigator.serviceWorker.register('/sw.js')
    return registration
  } catch (error) {
    console.error('Service Worker registration failed:', error)
    return null
  }
}

/** داواکردنی ئیزنی نۆتیفیکەیشن */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied'
  return await Notification.requestPermission()
}

/** subscribe بکە بۆ push notifications و بینێرە بۆ سێرڤەر */
export async function subscribeToPush(): Promise<boolean> {
  try {
    if (!isPushSupported()) {
      console.warn('Push notifications are not supported')
      return false
    }

    const permission = await requestNotificationPermission()
    if (permission !== 'granted') {
      console.warn('Notification permission denied')
      return false
    }

    const registration = await registerServiceWorker()
    if (!registration) return false

    // بپشکنە ئایا subscription ی پێشتر هەیە
    let subscription = await registration.pushManager.getSubscription()

    if (!subscription) {
      const applicationServerKey = urlBase64ToUint8Array(VAPID_PUBLIC_KEY)
      const applicationServerKeyView = new Uint8Array(applicationServerKey)
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKeyView,
      })
    }

    // subscription بنێرە بۆ سێرڤەر
    const response = await fetch('/api/push/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        endpoint: subscription.endpoint,
        keys: {
          p256dh: btoa(
            String.fromCharCode(...new Uint8Array(subscription.getKey('p256dh')!))
          ),
          auth: btoa(
            String.fromCharCode(...new Uint8Array(subscription.getKey('auth')!))
          ),
        },
      }),
    })

    return response.ok
  } catch (error) {
    console.error('Push subscription error:', error)
    return false
  }
}

/** ئایا ئێستا subscribe کراوە؟ */
export async function isSubscribedToPush(): Promise<boolean> {
  if (!isPushSupported()) return false

  try {
    const registration = await navigator.serviceWorker.ready
    const subscription = await registration.pushManager.getSubscription()
    return subscription !== null
  } catch {
    return false
  }
}
