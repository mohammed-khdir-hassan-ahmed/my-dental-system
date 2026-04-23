"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { UserIcon, MailIcon, LockIcon, KeyIcon, CheckCircleIcon, XCircleIcon } from "lucide-react"
import { useUser } from "@/contexts/user-context"

export default function SettingsPage() {
  const { user, refreshUser } = useUser()
  const [loading, setLoading] = useState(true)
  
  // Email form state
  const [currentEmail, setCurrentEmail] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [emailMessage, setEmailMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [emailLoading, setEmailLoading] = useState(false)
  
  // Password form state
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [passwordLoading, setPasswordLoading] = useState(false)
  
  // OTP form state
  const [currentOTP, setCurrentOTP] = useState("")
  const [newOTP, setNewOTP] = useState("")
  const [confirmOTP, setConfirmOTP] = useState("")
  const [otpMessage, setOtpMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [otpLoading, setOtpLoading] = useState(false)
  const [otpErrors, setOtpErrors] = useState<{
    newOTP?: string
    confirmOTP?: string
  }>({})
  const [showOTPSuccessModal, setShowOTPSuccessModal] = useState(false)
  
  // Success modals state
  const [showEmailSuccessModal, setShowEmailSuccessModal] = useState(false)
  const [showPasswordSuccessModal, setShowPasswordSuccessModal] = useState(false)

  const handleOTPInput = (value: string, setter: (val: string) => void, field: 'newOTP' | 'confirmOTP') => {
    // Only allow digits and limit to 6 characters
    const digitsOnly = value.replace(/\D/g, '').slice(0, 6)
    setter(digitsOnly)
    
    // Clear errors when user types
    if (digitsOnly.length === 6) {
      setOtpErrors(prev => ({ ...prev, [field]: undefined }))
    }
  }

  useEffect(() => {
    // Validate new OTP length
    if (newOTP.length > 0 && newOTP.length !== 6) {
      setOtpErrors(prev => ({ ...prev, newOTP: 'دەبێت تەنها ٦ ژمارە بێت' }))
    } else {
      setOtpErrors(prev => ({ ...prev, newOTP: undefined }))
    }

    // Validate confirm OTP
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
    if (user) {
      setCurrentEmail(user.email)
    }
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
        await refreshUser()
        setCurrentEmail(newEmail)
        setNewEmail("")
        setShowEmailSuccessModal(true)
      } else {
        setEmailMessage({ type: 'error', text: data.message })
      }
    } catch (error) {
      setEmailMessage({ type: 'error', text: 'هەڵەیەک ڕویدا' })
    } finally {
      setEmailLoading(false)
    }
  }

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordMessage(null)

    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'وشەی نهێنی نوێ یەک ناچێت' })
      return
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'وشەی نهێنی نوێ دەبێت لە 6 پیت زیاتر بێت' })
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
        setCurrentPassword("")
        setNewPassword("")
        setConfirmPassword("")
        setShowPasswordSuccessModal(true)
      } else {
        setPasswordMessage({ type: 'error', text: data.message })
      }
    } catch (error) {
      setPasswordMessage({ type: 'error', text: 'هەڵەیەک ڕویدا' })
    } finally {
      setPasswordLoading(false)
    }
  }

  const handleOTPUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setOtpMessage(null)

    if (newOTP !== confirmOTP) {
      setOtpMessage({ type: 'error', text: 'کۆدی نوێ یەک ناچێت' })
      return
    }

    if (!/^\d{6}$/.test(newOTP)) {
      setOtpMessage({ type: 'error', text: 'کۆدی تایبەت دەبێت تەنها ٦ ژمارە بێت' })
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
        setCurrentOTP("")
        setNewOTP("")
        setConfirmOTP("")
        setShowOTPSuccessModal(true)
      } else {
        setOtpMessage({ type: 'error', text: data.message })
      }
    } catch (error) {
      setOtpMessage({ type: 'error', text: 'هەڵەیەک ڕویدا' })
    } finally {
      setOtpLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#3dc1d3]"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      

      {/* Profile Card */}
      {!user?.isOTPLogin && (
        <Card className="border-2 border-slate-200/50 dark:border-slate-700/50  bg-white dark:bg-slate-900 overflow-hidden rounded-3xl">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
              <UserIcon className="size-5 text-[#3dc1d3]" />
              زانیاری پڕۆفایل
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              زانیاری بنەڕەتی ئەکاونتەکەت
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800 rounded-2xl">
              <div className="size-16 bg-[#3dc1d3] rounded-full flex items-center justify-center">
                <UserIcon className="size-8 text-white" />
              </div>
              <div>
                <p className="text-sm text-slate-600 dark:text-slate-400">ئیمەیڵ</p>
                <p className="text-lg font-semibold text-slate-900 dark:text-white">{user?.email}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Email Update Card */}
      {!user?.isOTPLogin && (
        <Card className="border-2 border-slate-200/50 dark:border-slate-700/50 bg-white dark:bg-slate-900 overflow-hidden rounded-3xl">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
              <MailIcon className="size-5 text-[#3dc1d3]" />
              گۆڕینی ئیمەیڵ
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              ئیمەیڵەکەت بگۆڕە
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleEmailUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  ئیمەیڵی ئێستا
                </label>
                <Input
                  type="email"
                  value={currentEmail}
                  onChange={(e) => setCurrentEmail(e.target.value)}
                  disabled
                  className="bg-slate-50 dark:bg-slate-800"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  ئیمەیڵی نوێ
                </label>
                <Input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="ئیمەیڵی نوێ بنووسە"
                  required
                />
              </div>
              {emailMessage && (
                <div className={`flex items-center gap-2 p-3 rounded-lg ${
                  emailMessage.type === 'success' 
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                }`}>
                  {emailMessage.type === 'success' ? (
                    <CheckCircleIcon className="size-5" />
                  ) : (
                    <XCircleIcon className="size-5" />
                  )}
                  <span>{emailMessage.text}</span>
                </div>
              )}
              <Button
                type="submit"
                disabled={emailLoading || !newEmail}
                className="w-full bg-[#3dc1d3] hover:bg-[#3dc1d3]/90"
              >
                {emailLoading ? '...چاوەڕوانبە' : 'گۆڕینی ئیمەیڵ'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Password Update Card */}
      {!user?.isOTPLogin && (
        <Card className="border-2 border-slate-200/50 dark:border-slate-700/50 bg-white dark:bg-slate-900 overflow-hidden rounded-3xl">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
              <LockIcon className="size-5 text-[#3dc1d3]" />
              گۆڕینی وشەی نهێنی
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              وشەی نهێنیەکەت بگۆڕە
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  وشەی نهێنی ئێستا
                </label>
                <Input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder="وشەی نهێنی ئێستا بنووسە"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  وشەی نهێنی نوێ
                </label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="وشەی نهێنی نوێ بنووسە (لە 6 پیت زیاتر)"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  دووبارەی وشەی نهێنی نوێ
                </label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="دووبارەی وشەی نهێنی نوێ بنووسە"
                  required
                  minLength={6}
                />
              </div>
              {passwordMessage && (
                <div className={`flex items-center gap-2 p-3 rounded-lg ${
                  passwordMessage.type === 'success' 
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                }`}>
                  {passwordMessage.type === 'success' ? (
                    <CheckCircleIcon className="size-5" />
                  ) : (
                    <XCircleIcon className="size-5" />
                  )}
                  <span>{passwordMessage.text}</span>
                </div>
              )}
              <Button
                type="submit"
                disabled={passwordLoading || !currentPassword || !newPassword || !confirmPassword}
                className="w-full bg-[#3dc1d3] hover:bg-[#3dc1d3]/90"
              >
                {passwordLoading ? '...چاوەڕوانبە' : 'گۆڕینی وشەی نهێنی'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* OTP Update Card */}
      {user?.isOTPLogin && (
        <Card className="border-2 border-slate-200/50 dark:border-slate-700/50 shadow-xl bg-white dark:bg-slate-900 overflow-hidden rounded-3xl">
          <CardHeader>
            <CardTitle className="text-slate-900 dark:text-white flex items-center gap-2">
              <KeyIcon className="size-5 text-[#3dc1d3]" />
              گۆڕینی کۆدی تایبەت
            </CardTitle>
            <CardDescription className="text-slate-600 dark:text-slate-400">
              کۆدی تایبەتەکەت بگۆڕە
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleOTPUpdate} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  کۆدی تایبەتی ئێستا
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={currentOTP}
                  onChange={(e) => setCurrentOTP(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  placeholder="کۆدی تایبەتی ئێستا بنووسە"
                  required
                  maxLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  کۆدی تایبەتی نوێ
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={newOTP}
                  onChange={(e) => handleOTPInput(e.target.value, setNewOTP, 'newOTP')}
                  placeholder="کۆدی تایبەتی نوێ بنووسە (٦ ژمارە)"
                  required
                  maxLength={6}
                />
                {otpErrors.newOTP && (
                  <p className="text-red-600 dark:text-red-400 text-xs mt-1">{otpErrors.newOTP}</p>
                )}
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                  دووبارەی کۆدی تایبەتی نوێ
                </label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={confirmOTP}
                  onChange={(e) => handleOTPInput(e.target.value, setConfirmOTP, 'confirmOTP')}
                  placeholder="دووبارەی کۆدی تایبەتی نوێ بنووسە"
                  required
                  maxLength={6}
                />
                {otpErrors.confirmOTP && (
                  <p className="text-red-600 dark:text-red-400 text-xs mt-1">{otpErrors.confirmOTP}</p>
                )}
              </div>
              {otpMessage && (
                <div className={`flex items-center gap-2 p-3 rounded-lg ${
                  otpMessage.type === 'success' 
                    ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400' 
                    : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                }`}>
                  {otpMessage.type === 'success' ? (
                    <CheckCircleIcon className="size-5" />
                  ) : (
                    <XCircleIcon className="size-5" />
                  )}
                  <span>{otpMessage.text}</span>
                </div>
              )}
              <Button
                type="submit"
                disabled={otpLoading || !currentOTP || !newOTP || !confirmOTP}
                className="w-full bg-[#3dc1d3] hover:bg-[#3dc1d3]/90"
              >
                {otpLoading ? '...چاوەڕوانبە' : 'گۆڕینی کۆدی تایبەت'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Email Success Modal */}
      <Dialog open={showEmailSuccessModal} onOpenChange={setShowEmailSuccessModal}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="size-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <CheckCircleIcon className="size-8 text-green-600 dark:text-green-400" />
              </div>
              <DialogTitle className="text-center text-2xl">ئیمەیڵ گۆڕا</DialogTitle>
              <DialogDescription className="text-center">
                ئیمەیڵەکەت بە سەرکەوتوویی گۆڕا
              </DialogDescription>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* Password Success Modal */}
      <Dialog open={showPasswordSuccessModal} onOpenChange={setShowPasswordSuccessModal}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="size-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <CheckCircleIcon className="size-8 text-green-600 dark:text-green-400" />
              </div>
              <DialogTitle className="text-center text-2xl">وشەی نهێنی گۆڕا</DialogTitle>
              <DialogDescription className="text-center">
                وشەی نهێنیەکەت بە سەرکەوتوویی گۆڕا
              </DialogDescription>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>

      {/* OTP Success Modal */}
      <Dialog open={showOTPSuccessModal} onOpenChange={setShowOTPSuccessModal}>
        <DialogContent dir="rtl" className="max-w-md">
          <DialogHeader>
            <div className="flex flex-col items-center gap-4 py-4">
              <div className="size-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <CheckCircleIcon className="size-8 text-green-600 dark:text-green-400" />
              </div>
              <DialogTitle className="text-center text-2xl">کۆدی تایبەت گۆڕا</DialogTitle>
              <DialogDescription className="text-center">
                کۆدی تایبەتەکەت بە سەرکەوتوویی گۆڕا
              </DialogDescription>
            </div>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    </div>
  )
}
