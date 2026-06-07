"use client"

import { useState, useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { MailIcon, LockIcon, KeyIcon, CheckCircleIcon, ShieldIcon, DownloadIcon, UploadIcon, RefreshCwIcon } from "lucide-react"
import { useUser } from "@/contexts/user-context"
import { notifySettingsUpdated, notifyActionError, notifySuccess } from "@/lib/notify"
import { DashboardPageShell, mobileDialogContent } from "@/components/dashboard-page-shell"
import { AdminUserManagement } from "@/components/admin-user-management"
import {
  SettingsHero,
  SettingsCard,
  SettingsField,
  SettingsAlert,
  SettingsSubmitButton,
  settingsInputClass,
} from "@/components/settings-ui"

export default function SettingsPage() {
  const { user, refreshUser } = useUser()
  const [loading, setLoading] = useState(true)

  const [currentEmail, setCurrentEmail] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [emailMessage, setEmailMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [emailLoading, setEmailLoading] = useState(false)

  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [passwordLoading, setPasswordLoading] = useState(false)

  const [currentOTP, setCurrentOTP] = useState("")
  const [newOTP, setNewOTP] = useState("")
  const [confirmOTP, setConfirmOTP] = useState("")
  const [otpMessage, setOtpMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpErrors, setOtpErrors] = useState<{ newOTP?: string; confirmOTP?: string }>({})
  const [showOTPSuccessModal, setShowOTPSuccessModal] = useState(false)
  const [showEmailSuccessModal, setShowEmailSuccessModal] = useState(false)
  const [showPasswordSuccessModal, setShowPasswordSuccessModal] = useState(false)
  const [backupLoading, setBackupLoading] = useState(false)
  const [restoreLoading, setRestoreLoading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleBackup = async () => {
    setBackupLoading(true)
    try {
      const response = await fetch('/api/backup')
      if (!response.ok) throw new Error('Failed to create backup')

      // Download file
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      const contentDisposition = response.headers.get('Content-Disposition')
      const filenameMatch = contentDisposition?.match(/filename="?([^";]+)"?/)
      const filename = filenameMatch ? filenameMatch[1] : `dental-system-backup-${new Date().toISOString().split('T')[0]}.json`
      a.download = filename
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
      notifySuccess('بەکاپ بە سەرکەوتوویی دروستکرا و خزایەندرا')
    } catch (error) {
      console.error(error)
      notifyActionError('هەڵەیەک ڕویدا لە دروستکردنی بەکاپ')
    } finally {
      setBackupLoading(false)
    }
  }

  const handleRestore = async (file: File) => {
    setRestoreLoading(true)
    try {
      const text = await file.text()
      const data = JSON.parse(text)
      
      const response = await fetch('/api/backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Failed to restore')
      
      notifySuccess('دەیتاکان بە سەرکەوتوویی گەڕانەوەکران!')
    } catch (error) {
      console.error(error)
      notifyActionError('هەڵەیەک ڕویدا لە گەڕانەوەی دەیتاکان')
    } finally {
      setRestoreLoading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      handleRestore(file)
    }
  }

  const handleOTPInput = (value: string, setter: (val: string) => void, field: 'newOTP' | 'confirmOTP') => {
    const digitsOnly = value.replace(/\D/g, '').slice(0, 6)
    setter(digitsOnly)
    if (digitsOnly.length === 6) {
      setOtpErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  useEffect(() => {
    if (newOTP.length > 0 && newOTP.length !== 6) {
      setOtpErrors(prev => ({ ...prev, newOTP: 'دەبێت تەنها ٦ ژمارە بێت' }))
    } else {
      setOtpErrors(prev => ({ ...prev, newOTP: undefined }))
    }

    if (confirmOTP.length > 0) {
      if (confirmOTP.length !== 6) {
        setOtpErrors(prev => ({ ...prev, confirmOTP: 'دەبێت تەنها ٦ ژمارە بێت' }))
      } else if (confirmOTP !== newOTP) {
        setOtpErrors(prev => ({ ...prev, confirmOTP: 'کۆدی نوێ یەک ناچێت' }))
      } else {
        setOtpErrors(prev => ({ ...prev, confirmOTP: undefined }))
      }
    } else {
      setOtpErrors(prev => ({ ...prev, confirmOTP: undefined }))
    }
  }, [newOTP, confirmOTP])

  useEffect(() => {
    if (user) setCurrentEmail(user.email)
    setLoading(false)
  }, [user])

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailMessage(null)
    setEmailLoading(true)
    try {
      const response = await fetch('/api/user/email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: newEmail, currentEmail }),
      })
      const data = await response.json()
      if (response.ok) {
        setEmailMessage({ type: 'success', text: data.message })
        notifySettingsUpdated('ئیمەیڵ نوێکرایەوە', data.message)
        await refreshUser()
        setCurrentEmail(newEmail)
        setNewEmail("")
        setShowEmailSuccessModal(true)
      } else {
        setEmailMessage({ type: 'error', text: data.message })
        notifyActionError(data.message || 'هەڵە لە نوێکردنەوەی ئیمەیڵ')
      }
    } catch {
      setEmailMessage({ type: 'error', text: 'هەڵەیەک ڕویدا' })
      notifyActionError('هەڵەیەک ڕویدا')
    } finally {
      setEmailLoading(false)
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMessage(null)
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'وشەی نهێنی نوێ یەک ناچێت' })
      notifyActionError('وشەی نهێنی نوێ یەک ناچێت')
      return
    }
    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'وشەی نهێنی نوێ دەبێت لە 6 پیت زیاتر بێت' })
      notifyActionError('وشەی نهێنی نوێ دەبێت لە 6 پیت زیاتر بێت')
      return
    }
    setPasswordLoading(true)
    try {
      const response = await fetch('/api/user/password', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await response.json()
      if (response.ok) {
        setPasswordMessage({ type: 'success', text: data.message })
        notifySettingsUpdated('وشەی نهێنی گۆڕدرا', data.message)
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        setShowPasswordSuccessModal(true)
      } else {
        setPasswordMessage({ type: 'error', text: data.message })
        notifyActionError(data.message || 'هەڵە لە گۆڕینی وشەی نهێنی')
      }
    } catch {
      setPasswordMessage({ type: 'error', text: 'هەڵەیەک ڕویدا' })
      notifyActionError('هەڵەیەک ڕویدا')
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleOTPUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setOtpMessage(null)
    if (newOTP !== confirmOTP) {
      setOtpMessage({ type: 'error', text: 'کۆدی نوێ یەک ناچێت' })
      notifyActionError('کۆدی نوێ یەک ناچێت')
      return
    }
    if (!/^\d{6}$/.test(newOTP)) {
      setOtpMessage({ type: 'error', text: 'کۆدی تایبەت دەبێت تەنها ٦ ژمارە بێت' })
      notifyActionError('کۆدی تایبەت دەبێت تەنها ٦ ژمارە بێت')
      return
    }
    setOtpLoading(true)
    try {
      const response = await fetch('/api/user/otp', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentCode: currentOTP, newCode: newOTP }),
      })
      const data = await response.json()
      if (response.ok) {
        setOtpMessage({ type: 'success', text: data.message })
        notifySettingsUpdated('کۆدی تایبەت گۆڕدرا', data.message)
        setCurrentOTP("")
        setNewOTP("")
        setConfirmOTP("")
        setShowOTPSuccessModal(true)
      } else {
        setOtpMessage({ type: 'error', text: data.message })
        notifyActionError(data.message || 'هەڵە لە گۆڕینی کۆدی تایبەت')
      }
    } catch {
      setOtpMessage({ type: 'error', text: 'هەڵەیەک ڕویدا' })
      notifyActionError('هەڵەیەک ڕویدا')
    } finally {
      setOtpLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="size-10 animate-spin rounded-full border-[3px] border-[#3dc1d3]/20 border-t-[#3dc1d3]" />
      </div>
    )
  }

  return (
    <DashboardPageShell className="space-y-0 md:space-y-6">
      <div className="flex flex-col gap-0 md:gap-6 [&>*+*]:-mt-px md:[&>*+*]:mt-0">
      <SettingsHero
        email={user?.email}
        isAdmin={user?.isAdmin}
        isOTPLogin={user?.isOTPLogin}
      />

      {!user?.isOTPLogin && (
        <div className="grid grid-cols-1 gap-0 md:grid-cols-2 md:gap-6 [&>*+*]:-mt-px md:[&>*+*]:mt-0">
          <SettingsCard
            icon={MailIcon}
            title="گۆڕینی ئیمەیڵ"
            description="ئیمەیڵی چوونەژوورەوەکەت نوێ بکەرەوە"
          >
            <form onSubmit={handleEmailUpdate} className="space-y-4">
              <SettingsField label="ئیمەیڵی ئێستا">
                <Input
                  type="email"
                  value={currentEmail}
                  disabled
                  className={`${settingsInputClass} opacity-60`}
                />
              </SettingsField>
              <SettingsField label="ئیمەیڵی نوێ">
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="example@email.com"
                  required
                  className={settingsInputClass}
                />
              </SettingsField>
              {emailMessage && <SettingsAlert type={emailMessage.type} message={emailMessage.text} />}
              <SettingsSubmitButton loading={emailLoading} disabled={!newEmail}>
                گۆڕینی ئیمەیڵ
              </SettingsSubmitButton>
            </form>
          </SettingsCard>

          <SettingsCard
            icon={LockIcon}
            title="گۆڕینی وشەی نهێنی"
            description="وشەی نهێنیەکەت بە ئاسایش نوێ بکەرەوە"
          >
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <SettingsField label="وشەی نهێنی ئێستا">
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className={settingsInputClass}
                />
              </SettingsField>
              <SettingsField label="وشەی نهێنی نوێ">
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="لە 6 پیت زیاتر"
                  required
                  minLength={6}
                  className={settingsInputClass}
                />
              </SettingsField>
              <SettingsField label="دووبارەی وشەی نهێنی نوێ">
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  minLength={6}
                  className={settingsInputClass}
                />
              </SettingsField>
              {passwordMessage && <SettingsAlert type={passwordMessage.type} message={passwordMessage.text} />}
              <SettingsSubmitButton
                loading={passwordLoading}
                disabled={!currentPassword || !newPassword || !confirmPassword}
              >
                گۆڕینی وشەی نهێنی
              </SettingsSubmitButton>
            </form>
          </SettingsCard>
        </div>
      )}

      {user?.isOTPLogin && (
        <SettingsCard
          icon={KeyIcon}
          title="گۆڕینی کۆدی تایبەت"
          description="کۆدی ٦ ژمارەیی OTP نوێ بکەرەوە"
        >
          <form onSubmit={handleOTPUpdate} className="space-y-4">
            <SettingsField label="کۆدی تایبەتی ئێستا">
              <Input
                type="text"
                inputMode="numeric"
                value={currentOTP}
                onChange={(e) => setCurrentOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
                placeholder="• • • • • •"
                required
                maxLength={6}
                className={`${settingsInputClass} text-center tracking-[0.5em] font-mono text-lg`}
              />
            </SettingsField>
            <SettingsField label="کۆدی تایبەتی نوێ">
              <Input
                type="text"
                inputMode="numeric"
                value={newOTP}
                onChange={(e) => handleOTPInput(e.target.value, setNewOTP, 'newOTP')}
                placeholder="• • • • • •"
                required
                maxLength={6}
                className={`${settingsInputClass} text-center tracking-[0.5em] font-mono text-lg`}
              />
              {otpErrors.newOTP && (
                <p className="text-xs text-red-500">{otpErrors.newOTP}</p>
              )}
            </SettingsField>
            <SettingsField label="دووبارەی کۆدی نوێ">
              <Input
                type="text"
                inputMode="numeric"
                value={confirmOTP}
                onChange={(e) => handleOTPInput(e.target.value, setConfirmOTP, 'confirmOTP')}
                placeholder="• • • • • •"
                required
                maxLength={6}
                className={`${settingsInputClass} text-center tracking-[0.5em] font-mono text-lg`}
              />
              {otpErrors.confirmOTP && (
                <p className="text-xs text-red-500">{otpErrors.confirmOTP}</p>
              )}
            </SettingsField>
            {otpMessage && <SettingsAlert type={otpMessage.type} message={otpMessage.text} />}
            <SettingsSubmitButton
              loading={otpLoading}
              disabled={!currentOTP || !newOTP || !confirmOTP}
            >
              گۆڕینی کۆدی تایبەت
            </SettingsSubmitButton>
          </form>
        </SettingsCard>
      )}

      {user?.isAdmin && (
        <SettingsCard
          icon={ShieldIcon}
          title="بەڕێوەبردنی ئەکاونتەکان"
          description="دروستکردن، دەستکاری و سڕینەوەی ئەکاونتی بەکارهێنەر و ئەدمین"
        >
          <AdminUserManagement />
        </SettingsCard>
      )}
      
      {/* Backup & Restore Section */}
      <SettingsCard
        icon={DownloadIcon}
        title="بەکاپ و گەڕانەوەی دەیتا"
        description="بەکاپی تەواو دەیتا بکە، لە دەستکەوتنەوەی هەڵەکان پشتبەی دەیتاکانت بگرە"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Backup Card */}
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-6 border border-blue-100 dark:border-slate-600">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-blue-100 dark:bg-slate-600 rounded-full">
                <DownloadIcon className="h-5 w-5 text-blue-600 dark:text-blue-300" />
              </div>
              <div>
                <h3 className="font-semibold text-base">دروستکردنی بەکاپ</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">فایلی JSON لە تەواو دەیتا</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              دەیتاکانی نەخۆش، خرج، فروش، مۆچی، و هەموو زانیارییەکان بە فایلی ئاسان خزایەندرێت
            </p>
            <Button
              onClick={handleBackup}
              disabled={backupLoading}
              className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white shadow-lg shadow-blue-200 dark:shadow-none"
            >
              {backupLoading ? (
                <RefreshCwIcon className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <DownloadIcon className="h-4 w-4 mr-2" />
              )}
              {backupLoading ? 'دەستکەوتنەوەی بەکاپ...' : 'دروستکردنی بەکاپ (Download)'}
            </Button>
          </div>

          {/* Restore Card */}
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-slate-800 dark:to-slate-700 rounded-xl p-6 border border-green-100 dark:border-slate-600">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-3 bg-green-100 dark:bg-slate-600 rounded-full">
                <UploadIcon className="h-5 w-5 text-green-600 dark:text-green-300" />
              </div>
              <div>
                <h3 className="font-semibold text-base">گەڕانەوەی دەیتا</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400">فایلی بەکاپی پێشوەت بخێنەرەوە</p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
              فایلی بەکاپی پێشوەت بخێنە و دەیتاکانت بە تەواوی گەڕانەوەبکە
            </p>
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleFileSelect}
              className="hidden"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={restoreLoading}
              className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg shadow-green-200 dark:shadow-none"
            >
              {restoreLoading ? (
                <RefreshCwIcon className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <UploadIcon className="h-4 w-4 mr-2" />
              )}
              {restoreLoading ? 'گەڕانەوەی دەیتا...' : 'خستنەڕووی فایل و گەڕانەوە'}
            </Button>
          </div>
        </div>

        {/* Info Banner */}
        <div className="mt-6 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4 flex items-start gap-3">
          <CheckCircleIcon className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
          <div className="text-sm text-amber-800 dark:text-amber-200">
            <p className="font-medium mb-1">رێکخستن</p>
            <p>بەکاپ لە مانگدا جارێک بکە! لە کاتی گەڕانەوەدا، ئەو ریکۆردانەی کە پێشتر هەبوون دەستنیشان دەکەن، تەنها تازەکان زیاد دەکرێن</p>
          </div>
        </div>
      </SettingsCard>
      </div>

      <Dialog open={showEmailSuccessModal} onOpenChange={setShowEmailSuccessModal}>
        <DialogContent dir="rtl" className={`${mobileDialogContent} rounded-2xl`}>
          <DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="flex size-14 items-center justify-center rounded-xl bg-[#3dc1d3]/10 sm:size-16">
                <CheckCircleIcon className="size-7 text-[#3dc1d3] sm:size-8" />
              </div>
              <DialogTitle className="text-center text-lg sm:text-xl">ئیمەیڵ گۆڕا</DialogTitle>
              <DialogDescription className="text-center">
                ئیمەیڵەکەت بە سەرکەوتوویی گۆڕا
              </DialogDescription>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <Dialog open={showPasswordSuccessModal} onOpenChange={setShowPasswordSuccessModal}>
        <DialogContent dir="rtl" className={`${mobileDialogContent} rounded-2xl`}>
          <DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="flex size-14 items-center justify-center rounded-xl bg-[#3dc1d3]/10 sm:size-16">
                <CheckCircleIcon className="size-7 text-[#3dc1d3] sm:size-8" />
              </div>
              <DialogTitle className="text-center text-lg sm:text-xl">وشەی نهێنی گۆڕا</DialogTitle>
              <DialogDescription className="text-center">
                وشەی نهێنیەکەت بە سەرکەوتوویی گۆڕا
              </DialogDescription>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      <Dialog open={showOTPSuccessModal} onOpenChange={setShowOTPSuccessModal}>
        <DialogContent dir="rtl" className={`${mobileDialogContent} rounded-2xl`}>
          <DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="flex size-14 items-center justify-center rounded-xl bg-[#3dc1d3]/10 sm:size-16">
                <CheckCircleIcon className="size-7 text-[#3dc1d3] sm:size-8" />
              </div>
              <DialogTitle className="text-center text-lg sm:text-xl">کۆدی تایبەت گۆڕا</DialogTitle>
              <DialogDescription className="text-center">
                کۆدی تایبەتەکەت بە سەرکەوتوویی گۆڕا
              </DialogDescription>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </DashboardPageShell>
  )
}
