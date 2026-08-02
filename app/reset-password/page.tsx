"use client";
import Image from 'next/image'
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { FaLock, FaEnvelope, FaKey, FaCheckCircle } from 'react-icons/fa'
import { HiOutlineEye, HiOutlineEyeSlash } from 'react-icons/hi2'
import { toast } from 'sonner'
import FormError from '@/components/FormError'

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-600"></div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}

function ResetPasswordContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const emailFromQuery = searchParams?.get('email') || ''

  const [formData, setFormData] = useState({
    email: emailFromQuery,
    code: '',
    newPassword: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [codeSent, setCodeSent] = useState(false)
  const [emailValid, setEmailValid] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (emailFromQuery) {
      setEmailValid(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailFromQuery))
    }
  }, [emailFromQuery])

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    setFormData({ ...formData, email: value })
    setEmailValid(validateEmail(value))
  }

  const handleSendCode = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSendingCode(true)
    setFormError('')

    if (!validateEmail(formData.email)) {
      toast.error('Please enter a valid email address')
      setFormError('Please enter a valid email address')
      setIsSendingCode(false)
      return
    }

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to send code')
      }

      toast.success('Verification code has been sent to your email. Please check your inbox.')
      setCodeSent(true)
    } catch (error: any) {
      const message = error.message || 'Failed to send code. Please try again.'
      toast.error(message)
      setFormError(message)
    } finally {
      setIsSendingCode(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setFormError('')

    if (!formData.code || formData.code.length !== 6) {
      toast.error('Please enter the 6-digit code')
      setFormError('Please enter the 6-digit code')
      setIsLoading(false)
      return
    }

    if (!formData.newPassword || formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      setFormError('Password must be at least 6 characters')
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          code: formData.code,
          newPassword: formData.newPassword,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password')
      }

      toast.success('Password reset successfully! Redirecting to login...')
      setTimeout(() => {
        router.push('/login')
      }, 2000)
    } catch (error: any) {
      const message = error.message || 'Failed to reset password. Please check your code and try again.'
      toast.error(message)
      setFormError(message)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50/60 p-4 sm:p-6">
      <div className="w-full max-w-md sm:max-w-lg">
        {/* Single Unified Border Card Div */}
        <div className="bg-white rounded-[5px] p-6 sm:p-8 border border-slate-200 shadow-sm transition-all">
          {/* Header & Logo inside the card */}
          <div className="mb-6 text-center flex flex-col items-center">
            <Image 
              src="/images/logo-dark.png" 
              alt="SKC Caterers Logo" 
              width={90} 
              height={90}
              className="w-16 h-16 sm:w-20 sm:h-20 mb-3 object-contain"
              priority
            />
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-900 text-xs font-black rounded-[5px] border border-amber-200 shadow-xs mb-4">
              ✨ SKC Caterers • Est. 1989
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1 tracking-tight">
              Reset Password
            </h1>
            <p className="text-slate-500 text-xs sm:text-sm font-medium leading-relaxed max-w-sm">
              {codeSent 
                ? 'Enter the verification code sent to your email and your new password.'
                : 'Enter your email address and we\'ll send you a 6-digit verification code to reset your password.'}
            </p>
          </div>

          {!codeSent ? (
            <form onSubmit={handleSendCode} className="space-y-5">
              <FormError message={formError} />
              {/* Email Field */}
              <div>
                <label htmlFor="email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Enter Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <FaEnvelope />
                  </div>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={handleEmailChange}
                    className={`block w-full pl-10 pr-10 py-3 border rounded-[5px] text-sm font-medium transition-all outline-none ${
                      emailValid && formData.email ? 'border-emerald-500 focus:ring-2 focus:ring-emerald-500/20' : 'border-slate-300 focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20'
                    }`}
                    placeholder="Enter your registered email"
                    required
                  />
                  {emailValid && formData.email && (
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <FaCheckCircle className="text-emerald-500" />
                    </div>
                  )}
                </div>
              </div>

              {/* Send Code Button */}
              <button
                type="submit"
                disabled={isSendingCode || !emailValid}
                className="w-full bg-gradient-to-r from-red-700 to-amber-700 text-white py-3 rounded-[5px] font-bold text-sm hover:from-red-800 hover:to-amber-800 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
              >
                {isSendingCode ? 'Sending Code...' : 'Send Verification Code'}
              </button>

              {/* Back to Login */}
              <div className="text-center pt-2">
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="text-xs text-amber-700 hover:text-amber-800 font-bold transition-colors"
                >
                  ← Back to Sign In
                </button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <FormError message={formError} />
              {/* Email Field - Read Only */}
              <div>
                <label htmlFor="reset-email" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <FaEnvelope />
                  </div>
                  <input
                    id="reset-email"
                    type="email"
                    value={formData.email}
                    readOnly
                    className="block w-full pl-10 pr-3 py-3 border border-slate-200 rounded-[5px] bg-slate-50 text-slate-600 font-medium cursor-not-allowed text-sm"
                  />
                </div>
              </div>

              {/* Code Field */}
              <div>
                <label htmlFor="code" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Enter 6-Digit Code
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <FaKey />
                  </div>
                  <input
                    id="code"
                    type="text"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value.replace(/\D/g, '').slice(0, 6) })}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-[5px] focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 text-sm font-medium tracking-widest"
                    placeholder="Enter Code"
                    maxLength={6}
                    required
                  />
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400 font-medium">Enter the 6-digit code sent to your email</p>
              </div>

              {/* New Password Field */}
              <div>
                <label htmlFor="newPassword" className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Enter New Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <FaLock />
                  </div>
                  <input
                    id="newPassword"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.newPassword}
                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                    className="block w-full pl-10 pr-10 py-3 border border-slate-300 rounded-[5px] focus:border-amber-600 focus:ring-2 focus:ring-amber-500/20 text-sm font-medium"
                    placeholder="Enter New Password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none flex items-center justify-center p-1"
                  >
                    {showPassword ? <HiOutlineEyeSlash className="w-5 h-5" /> : <HiOutlineEye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="mt-1.5 text-[11px] text-slate-400 font-medium">Minimum 6 characters</p>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-red-700 to-amber-700 text-white py-3 rounded-[5px] font-bold text-sm hover:from-red-800 hover:to-amber-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
              >
                {isLoading ? 'Resetting Password...' : 'SUBMIT RESET PASSWORD'}
              </button>

              {/* Back Button */}
              <div className="flex gap-3 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setCodeSent(false)
                    setFormData({ ...formData, code: '', newPassword: '' })
                  }}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-[5px] text-slate-700 hover:bg-slate-50 transition-colors text-xs font-bold"
                >
                  Change Email
                </button>
                <button
                  type="button"
                  onClick={() => router.push('/login')}
                  className="flex-1 px-4 py-2.5 border border-slate-200 rounded-[5px] text-slate-700 hover:bg-slate-50 transition-colors text-xs font-bold"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Help Info Message inside the single card */}
          <div className="mt-6 pt-4 border-t border-slate-100 text-center text-xs text-slate-400 font-medium">
            <p>Didn't receive a code? Check your spam folder or request a new one.</p>
          </div>
        </div>
      </div>
    </div>
  )
}

