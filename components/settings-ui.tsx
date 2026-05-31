import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { LucideIcon } from 'lucide-react'

export const PRIMARY = '#3dc1d3'

/** Full-bleed on mobile (like tables), bordered card on desktop */
export const settingsSectionShell =
  'w-full border-y md:border md:rounded-2xl border-border/90 bg-card overflow-hidden'

export function SettingsHero({
  email,
  isAdmin,
  isOTPLogin,
}: {
  email?: string
  isAdmin?: boolean
  isOTPLogin?: boolean
}) {
  const initials = email?.charAt(0).toUpperCase() || '?'

  return (
    <div className={cn(settingsSectionShell, 'p-4 sm:p-6')}>
      <div className="flex flex-col items-center gap-4 text-center sm:flex-row sm:items-center sm:gap-5 sm:text-right">
        <div className="flex size-16 shrink-0 items-center justify-center rounded-xl bg-[#3dc1d3] text-2xl font-bold text-white sm:size-20">
          {initials}
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <span className="inline-flex items-center rounded-full bg-[#3dc1d3]/10 px-3 py-1 text-xs font-semibold text-[#3dc1d3]">
            {isAdmin ? 'ئەدمین' : isOTPLogin ? 'بەکارهێنەری OTP' : 'بەکارهێنەر'}
          </span>

          {!isOTPLogin && email ? (
            <>
              <h2 className="truncate text-lg font-bold text-foreground sm:text-xl">{email}</h2>
              <p className="text-sm text-muted-foreground">زانیاری ئەکاونتەکەت بەڕێوە ببە</p>
            </>
          ) : (
            <>
              <h2 className="text-lg font-bold text-foreground sm:text-xl">ئەکاونتی OTP</h2>
              <p className="text-sm text-muted-foreground">کۆدی تایبەتەکەت بەڕێوە ببە</p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export function SettingsCard({
  icon: Icon,
  title,
  description,
  children,
  className,
}: {
  icon: LucideIcon
  title: string
  description: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        settingsSectionShell,
        'p-4 sm:p-5 md:p-6',
        className,
      )}
    >
      <div className="mb-4 flex items-start gap-3 sm:mb-5">
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#3dc1d3]/10 text-[#3dc1d3] sm:size-10">
          <Icon className="size-4 sm:size-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-sm font-bold text-foreground sm:text-base">{title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground sm:text-sm">{description}</p>
        </div>
      </div>
      {children}
    </div>
  )
}

export function SettingsField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5 sm:space-y-2">
      <label className="text-xs font-medium text-foreground/80 sm:text-sm">{label}</label>
      {children}
    </div>
  )
}

export function SettingsAlert({
  type,
  message,
}: {
  type: 'success' | 'error'
  message: string
}) {
  return (
    <div
      className={cn(
        'rounded-lg border px-3 py-2.5 text-xs sm:px-4 sm:py-3 sm:text-sm',
        type === 'success'
          ? 'border-[#3dc1d3]/30 bg-[#3dc1d3]/5 text-foreground'
          : 'border-destructive/30 bg-destructive/5 text-destructive',
      )}
    >
      {message}
    </div>
  )
}

export function SettingsSubmitButton({
  loading,
  disabled,
  children,
}: {
  loading: boolean
  disabled?: boolean
  children: React.ReactNode
}) {
  return (
    <Button
      type="submit"
      disabled={disabled || loading}
      className="mt-1 h-10 w-full rounded-lg bg-[#3dc1d3] text-sm font-semibold text-white hover:bg-[#35b0c0] disabled:opacity-50 sm:h-11"
    >
      {loading ? (
        <span className="flex items-center gap-2">
          <span className="size-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          چاوەڕوانبە...
        </span>
      ) : (
        children
      )}
    </Button>
  )
}

export const settingsInputClass =
  'h-10 rounded-lg border-border bg-background text-sm sm:h-11 placeholder:!text-xs sm:placeholder:!text-sm'

export const settingsPrimaryBtnClass =
  'rounded-lg bg-[#3dc1d3] font-semibold text-white hover:bg-[#35b0c0]'
