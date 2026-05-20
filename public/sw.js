/// <reference lib="webworker" />

// Service Worker  Web Push Notifications

self.addEventListener('push', function (event) {
  if (!event.data) return

  let data
  try {
    data = event.data.json()
  } catch {
    data = {
      title: 'ئاگادارکردنەوە',
      body: event.data.text(),
      icon: '/icon/tooth.png',
    }
  }

  const title = data.title || 'ئاگادارکردنەوە'
  const options = {
    body: data.body || data.message || '',
    icon: data.icon || '/icon/tooth.png',
    badge: data.badge || '/icon/tooth.png',
    vibrate: [200, 100, 200],
    tag: data.tag || 'admin-notification',
    renotify: true,
    requireInteraction: true,
    timestamp: data.timestamp || Date.now(),
    data: {
      url: data.url || '/dashboard',
    },
  }

  event.waitUntil(self.registration.showNotification(title, options))
})

// کاتێک نۆتیفیکەیشن کلیک دەکرێت
self.addEventListener('notificationclick', function (event) {
  event.notification.close()

  const url = event.notification.data?.url || '/dashboard'

  event.waitUntil(
    // @ts-ignore
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (clientList) {
      // ئەگەر تابێک کراوەیە بۆ ئەپەکە، فۆکەس بکە
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url.includes('/dashboard') && 'focus' in client) {
          return client.focus()
        }
      }
      // ئەگەر تابێک نەبوو، تابی نوێ بکەرەوە
      // @ts-ignore
      if (clients.openWindow) {
        // @ts-ignore
        return clients.openWindow(url)
      }
    })
  )
})

// ئەکتیڤکردنی service worker
self.addEventListener('activate', function (event) {
  // @ts-ignore
  event.waitUntil(clients.claim())
})
