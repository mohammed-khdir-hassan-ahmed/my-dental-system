export type NotificationSoundVariant = 'sale' | 'patient'

/** دەنگی سەرەکی: public/sounds/soundalert.mp3 */
const SOUND_BY_VARIANT: Record<NotificationSoundVariant, string[]> = {
  sale: ['/sounds/soundalert.mp3'],
  patient: ['/sounds/soundalert.mp3'],
}

/** دەنگی لێدان — ٠ تا ١ (٠.٥ = ناوەند) */
const VOLUME = 0.5

let audioContext: AudioContext | null = null
const resolvedPath = new Map<NotificationSoundVariant, string | null>()
const audioCache = new Map<string, HTMLAudioElement>()

function getContext(): AudioContext | null {
  if (typeof window === 'undefined') return null
  if (!audioContext) {
    const Ctx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctx) return null
    audioContext = new Ctx()
  }
  return audioContext
}

async function resolveSoundPath(variant: NotificationSoundVariant): Promise<string | null> {
  if (resolvedPath.has(variant)) {
    return resolvedPath.get(variant) ?? null
  }

  for (const path of SOUND_BY_VARIANT[variant]) {
    try {
      const res = await fetch(path, { method: 'HEAD' })
      if (res.ok) {
        resolvedPath.set(variant, path)
        return path
      }
    } catch {
      // هەوڵی فایلی داهاتوو
    }
  }

  resolvedPath.set(variant, null)
  return null
}

function getAudio(path: string): HTMLAudioElement {
  let el = audioCache.get(path)
  if (!el) {
    el = new Audio(path)
    el.preload = 'auto'
    el.volume = VOLUME
    audioCache.set(path, el)
  }
  return el
}

function playSoftPop() {
  const ctx = getContext()
  if (!ctx) return
  if (ctx.state === 'suspended') void ctx.resume()

  const now = ctx.currentTime
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = 1800
  osc.type = 'sine'
  osc.frequency.setValueAtTime(660, now)
  osc.frequency.exponentialRampToValueAtTime(520, now + 0.06)
  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(0.09, now + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.14)
  osc.connect(filter)
  filter.connect(gain)
  gain.connect(ctx.destination)
  osc.start(now)
  osc.stop(now + 0.16)
}

export async function playNotificationSound(variant: NotificationSoundVariant = 'sale') {
  const path = await resolveSoundPath(variant)

  if (path) {
    const el = getAudio(path)
    el.volume = VOLUME
    el.currentTime = 0
    try {
      await el.play()
      return
    } catch {
      // فایل هەیە بەڵام لێدان سەرنەکەوت
    }
  }

  playSoftPop()
}

export function preloadNotificationSounds() {
  if (typeof window === 'undefined') return
  void Promise.all(
    (['sale', 'patient'] as const).map(async (variant) => {
      const path = await resolveSoundPath(variant)
      if (path) getAudio(path).load()
    })
  )
}

/** دوای گۆڕینی فایل لە کاش دەردەهێنێت — لە کۆنسۆڵ: clearNotificationSoundCache() */
export function clearNotificationSoundCache() {
  resolvedPath.clear()
  audioCache.clear()
}

if (typeof window !== 'undefined') {
  ;(window as unknown as { clearNotificationSoundCache?: () => void }).clearNotificationSoundCache =
    clearNotificationSoundCache
}
