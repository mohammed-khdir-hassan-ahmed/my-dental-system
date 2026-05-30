"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"
import { useUser } from "@/contexts/user-context"
import { consumeShowDashboardWelcome } from "@/lib/login-welcome"
import { fireCanvasFireworks, isDashboardPageReload } from "@/lib/canvas-fireworks"

/** Fireworks only — after login or dashboard refresh. No modal/card. */
export function DashboardWelcomeOverlay() {
  const pathname = usePathname()
  const { loading } = useUser()
  const fired = useRef(false)

  useEffect(() => {
    if (pathname !== "/dashboard") {
      fired.current = false
    }
  }, [pathname])

  useEffect(() => {
    if (loading || pathname !== "/dashboard" || fired.current) return

    const fromLogin = consumeShowDashboardWelcome()
    const fromRefresh = isDashboardPageReload()

    if (!fromLogin && !fromRefresh) return

    fired.current = true
    return fireCanvasFireworks()
  }, [loading, pathname])

  return null
}
