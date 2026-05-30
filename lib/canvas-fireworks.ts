import confetti from "canvas-confetti"

const FIREWORK_COLORS = ["#2ea7b8", "#3dc1d3", "#5eead4", "#fcd34d", "#f472b6", "#ffffff"]

function randomInRange(min: number, max: number) {
  return Math.random() * (max - min) + min
}

/** Classic canvas-confetti fireworks (15s, dual cannons) */
export function fireCanvasFireworks(durationMs = 5 * 1000): () => void {
  const animationEnd = Date.now() + durationMs
  const defaults = {
    startVelocity: 30,
    spread: 360,
    ticks: 60,
    zIndex: 9999,
    colors: FIREWORK_COLORS,
    disableForReducedMotion: true,
  }

  const interval = window.setInterval(() => {
    const timeLeft = animationEnd - Date.now()

    if (timeLeft <= 0) {
      window.clearInterval(interval)
      return
    }

    const particleCount = 50 * (timeLeft / durationMs)

    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
    })
    confetti({
      ...defaults,
      particleCount,
      origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
    })
  }, 250)

  return () => window.clearInterval(interval)
}

export function isDashboardPageReload(): boolean {
  if (typeof window === "undefined") return false
  const nav = performance.getEntriesByType("navigation")[0] as
    | PerformanceNavigationTiming
    | undefined
  return nav?.type === "reload"
}
