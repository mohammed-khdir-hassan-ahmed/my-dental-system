'use client'

import { useEffect, useRef, useState } from 'react'
import { BellRing } from 'lucide-react'
import { useUser } from '@/contexts/user-context'
import { isPushSupported, subscribeToPush, isSubscribedToPush } from '@/lib/push-subscribe'

/**
 * Push manager for admin users.
 * Helps keep background/lock-screen notifications enabled.
 */
export function PushNotificationManager() {
  const { user, loading } = useUser()
  const hasAttempted = useRef(false)
  const [showBanner, setShowBanner] = useState(false)
  const [permissionDenied, setPermissionDenied] = useState(false)

  useEffect(() => {
    if (loading || !user?.isAdmin) return
    if (hasAttempted.current) return
    hasAttempted.current = true

    if (!isPushSupported()) return

    const checkAndSubscribe = async () => {
      const alreadySubscribed = await isSubscribedToPush()
      if (alreadySubscribed) {
        await subscribeToPush()
        return
      }

      const permission = Notification.permission
      if (permission === 'default') {
        setShowBanner(true)
        return
      }

      if (permission === 'denied') {
        setPermissionDenied(true)
        return
      }

      const success = await subscribeToPush()
      if (!success) {
        setShowBanner(true)
      }
    }

    const timer = setTimeout(checkAndSubscribe, 2000)
    return () => clearTimeout(timer)
  }, [loading, user?.isAdmin])

  const handleEnable = async () => {
    const success = await subscribeToPush()
    setShowBanner(!success)
    setPermissionDenied(!success && Notification.permission === 'denied')
  }

  const handleDismiss = () => {
    setShowBanner(false)
  }

  if (!user?.isAdmin) return null

  if (showBanner || permissionDenied) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 duration-500 md:left-auto md:right-6 md:max-w-sm">
        <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-blue-600 to-indigo-600 p-4 text-white shadow-2xl">
          <div className="flex items-start gap-3" dir="rtl">
            <div className="shrink-0 rounded-xl bg-white/20 p-2.5">
              <BellRing className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="mb-1 text-sm font-bold">Push Notification چالاک بکە</h4>
              <p className="text-xs leading-relaxed text-white/80">
                {permissionDenied
                  ? 'لە Settings ـی مۆبایلەکەت Notification بۆ ئەم ماڵپەڕە چالاک بکە. لە iPhone پێویستە ماڵپەڕەکە Add to Home Screen بکرێت.'
                  : 'ئاگاداری دەکرێیتەوە کاتێک یوزەرێک دەچێتە ژوورەوە، تەنانەت ئەگەر مۆبایلەکەت قفڵ بێت.'}
              </p>
              <div className="mt-3 flex gap-2">
                {!permissionDenied ? (
                  <button
                    onClick={handleEnable}
                    className="rounded-xl bg-white px-4 py-2 text-xs font-bold text-blue-600 transition-colors hover:bg-blue-50"
                  >
                    چالاک بکە ✓
                  </button>
                ) : null}
                <button
                  onClick={handleDismiss}
                  className="px-3 py-2 text-xs text-white/70 transition-colors hover:text-white"
                >
                  دواتر
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return null
}
