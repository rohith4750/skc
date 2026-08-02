"use client";
import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { 
  FaLock, FaUser, FaEye, FaEyeSlash, FaAward, FaUsers, FaCalendarCheck,
  FaPhone, FaEnvelope, FaMapMarkerAlt, FaLeaf, FaCheckCircle, FaUtensils,
  FaStar, FaHeart
} from 'react-icons/fa'
import { toast } from 'sonner'
import { setAuth, isLoggedIn, getToken } from '@/lib/auth-storage'
import { isNonEmptyString } from '@/lib/validation'
import FormError from '@/components/FormError'

import FormEngine, { FormFieldSchema } from '@/components/FormEngine'

const loginFields: FormFieldSchema[] = [
  {
    name: 'username',
    label: 'Username or Email',
    type: 'text',
    icon: FaUser,
    placeholder: 'Enter username or email',
    required: true,
  },
  {
    name: 'password',
    label: 'Password',
    type: 'password',
    icon: FaLock,
    placeholder: 'Enter password',
    required: true,
  }
]

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    }>
      <LoginPageContent />
    </Suspense>
  )
}

function LoginPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false,
  })
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState('')

  useEffect(() => {
    if (isLoggedIn() && getToken()) {
      router.push('/')
    }
  }, [router])

  useEffect(() => {
    const reason = searchParams?.get('reason')
    if (reason === 'session_expired') {
      toast.error('Your session expired. Please sign in again.')
    } else if (reason === 'timeout') {
      toast.error('You were signed out due to inactivity. Please sign in again.')
    }
  }, [searchParams])

  const handleFormSubmit = async (data: any) => {
    const loginData = {
      ...data,
      rememberMe: formData.rememberMe
    }
    
    setIsLoading(true)
    setFormError('')

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

      setAuth(
        data.accessToken,
        {
          id: data.user.id,
          username: data.user.username,
          email: data.user.email ?? null,
          role: data.user.role || 'admin',
        },
        [],
        loginData.rememberMe
      )
      toast.success('Login successful!')
      router.push('/')
    } catch (error: any) {
      const message = error.message || 'Login failed. Please check your credentials.'
      toast.error(message)
      setFormError(message)
      setIsLoading(false)
    }
  }

  return (
    <div className="h-screen bg-white overflow-hidden flex flex-col lg:flex-row">
      {/* Mobile & Tablet Header with Logo */}
      <div className="lg:hidden bg-gradient-to-r from-red-800 via-red-900 to-amber-900 text-white py-6 px-4">
        <div className="flex flex-col items-center">
          <Image 
            src="/images/logo-dark.png" 
            alt="SKC Logo" 
            width={120} 
            height={120}
            className="drop-shadow-lg w-24 h-24 sm:w-28 sm:h-28"
            priority
          />
          <p className="text-amber-200 text-xs sm:text-sm mt-2 font-medium">Pure Vegetarian • Since 1989</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row w-full h-[calc(100vh-100px)] sm:h-[calc(100vh-120px)] lg:h-screen">
        {/* Left Side - Login Form */}
        <div className="flex-1 flex items-center justify-center p-6 sm:p-8 md:p-12 bg-white overflow-y-auto">
          <div className="w-full max-w-md lg:max-w-lg">
            {/* Single Border Card Container containing Logo, Welcome Header & Form */}
            <div className="bg-white rounded-[5px] p-6 sm:p-8 border border-slate-200 shadow-sm transition-all">
              {/* Logo & Welcome Header inside the card */}
              <div className="mb-6 text-center sm:text-left flex flex-col items-center sm:items-start">
                <div className="flex flex-col sm:flex-row items-center sm:items-center gap-3 mb-4">
                  <Image 
                    src="/images/logo-dark.png" 
                    alt="SKC Caterers Logo" 
                    width={90} 
                    height={90}
                    unoptimized
                    className="w-16 h-16 sm:w-20 sm:h-20 object-contain"
                    priority
                  />
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-900 text-xs font-black rounded-[5px] border border-amber-200 shadow-xs">
                    ✨ Serving Quality Catering Since 1989
                  </span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-black text-slate-900 mb-1 tracking-tight">
                  Welcome Back
                </h1>
                <p className="text-slate-500 text-xs sm:text-sm font-medium">
                  Sign in to manage your catering business
                </p>
              </div>

              <FormEngine
                fields={loginFields}
                onSubmit={handleFormSubmit}
                defaultValues={formData}
                isLoading={isLoading}
                serverError={formError}
                submitButtonText="Sign In"
                submitButtonIcon={FaUtensils}
              >
                <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
                  <label className="flex items-center cursor-pointer touch-manipulation">
                    <input
                      type="checkbox"
                      checked={formData.rememberMe}
                      onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                      className="rounded-[3px] border-slate-300 text-amber-600 focus:ring-amber-500 w-4 h-4 cursor-pointer"
                    />
                    <span className="ml-2 text-slate-600 font-medium">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => router.push('/reset-password')}
                    className="text-amber-700 hover:text-amber-800 font-bold transition-colors text-xs"
                  >
                    Forgot password?
                  </button>
                </div>
              </FormEngine>
            </div>

            {/* Mobile & Tablet Contact & Stats Section */}
            <div className="lg:hidden mt-4 sm:mt-6 md:mt-8 space-y-3 sm:space-y-4">
              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3 md:gap-4">
                <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 text-center shadow-sm hover:shadow-md border border-gray-100 transition-shadow">
                  <FaAward className="text-amber-600 text-xl sm:text-2xl md:text-3xl mx-auto mb-1 sm:mb-2" />
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">35+</div>
                  <div className="text-[10px] sm:text-xs md:text-sm text-gray-500">Years</div>
                </div>
                <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 text-center shadow-sm hover:shadow-md border border-gray-100 transition-shadow">
                  <FaUsers className="text-amber-600 text-xl sm:text-2xl md:text-3xl mx-auto mb-1 sm:mb-2" />
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">10K+</div>
                  <div className="text-[10px] sm:text-xs md:text-sm text-gray-500">Customers</div>
                </div>
                <div className="bg-white rounded-xl sm:rounded-2xl p-3 sm:p-4 md:p-5 text-center shadow-sm hover:shadow-md border border-gray-100 transition-shadow">
                  <FaCalendarCheck className="text-amber-600 text-xl sm:text-2xl md:text-3xl mx-auto mb-1 sm:mb-2" />
                  <div className="text-lg sm:text-xl md:text-2xl font-bold text-gray-800">50K+</div>
                  <div className="text-[10px] sm:text-xs md:text-sm text-gray-500">Events</div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-sm hover:shadow-md border border-gray-100 transition-shadow">
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                  <FaPhone className="text-red-600 text-base sm:text-lg" /> Contact Us
                </h3>
                <div className="space-y-2 sm:space-y-2.5 md:space-y-3 text-xs sm:text-sm md:text-base text-gray-600">
                  <p className="flex items-center gap-2">📞 <span className="break-all">9866525102, 9963691393, 9390015302</span></p>
                  <p className="flex items-center gap-2">✉️ <span className="break-all">pujyasri1989cya@gmail.com</span></p>
                  <p className="flex items-center gap-2">📍 Vanathalipuram, Hyderabad - 500070</p>
                </div>
              </div>

              {/* Services */}
              <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-5 md:p-6 shadow-sm hover:shadow-md border border-gray-100 transition-shadow">
                <h3 className="text-sm sm:text-base md:text-lg font-semibold text-gray-800 mb-3 sm:mb-4 flex items-center gap-2">
                  <FaLeaf className="text-green-600 text-base sm:text-lg" /> Our Services
                </h3>
                <div className="grid grid-cols-2 gap-2 sm:gap-3 text-xs sm:text-sm md:text-base text-gray-600">
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <FaCheckCircle className="text-green-500 text-xs sm:text-sm flex-shrink-0" />
                    <span>Weddings</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <FaCheckCircle className="text-green-500 text-xs sm:text-sm flex-shrink-0" />
                    <span>Corporate</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <FaCheckCircle className="text-green-500 text-xs sm:text-sm flex-shrink-0" />
                    <span>Birthdays</span>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2">
                    <FaCheckCircle className="text-green-500 text-xs sm:text-sm flex-shrink-0" />
                    <span>Religious</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-6 text-center text-xs text-slate-500 font-medium px-4">
              <p>© {new Date().getFullYear()} SKC Caterers (Srivatsasa & Koundinya Caterers). All rights reserved.</p>
            </div>
          </div>
        </div>

        {/* Right Side - Desktop Only */}
        <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:items-center lg:justify-center lg:p-4 xl:p-6 bg-gradient-to-br from-red-800 via-red-900 to-amber-900 relative overflow-y-auto">
          {/* Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-[450px] h-[450px] border border-amber-400/15 rounded-full"></div>
            <div className="absolute -bottom-20 -left-20 w-[450px] h-[450px] border border-amber-400/15 rounded-full"></div>
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-red-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>

          {/* Content */}
          <div className="relative z-10 w-full max-w-md lg:max-w-lg xl:max-w-xl text-center">
            {/* Logo */}
            <div className="mb-3 lg:mb-2 xl:mb-2.5">
              <Image 
                src="/images/logo-dark.png" 
                alt="SKC Logo" 
                width={160} 
                height={160}
                unoptimized
                className="drop-shadow-2xl mx-auto w-28 h-28 lg:w-32 lg:h-32 xl:w-36 xl:h-36"
                priority
              />
            </div>

            {/* Decorative Line */}
            <div className="flex items-center justify-center gap-3 lg:gap-4 mb-2.5 lg:mb-2 xl:mb-2.5">
              <div className="w-12 lg:w-16 h-0.5 bg-gradient-to-r from-transparent to-amber-400/70"></div>
              <FaStar className="text-amber-400/70 text-xs lg:text-sm" />
              <div className="w-12 lg:w-16 h-0.5 bg-gradient-to-l from-transparent to-amber-400/70"></div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-2 lg:gap-2 xl:gap-3 mb-3 lg:mb-2.5 xl:mb-3">
              <div className="bg-white/10 backdrop-blur-sm rounded-lg lg:rounded-xl p-2 lg:p-2 xl:p-2.5 border border-amber-400/30 hover:bg-white/15 hover:scale-105 transition-all cursor-pointer">
                <FaAward className="text-amber-300 text-lg lg:text-lg xl:text-xl mx-auto mb-0.5" />
                <div className="text-white text-base lg:text-base xl:text-lg font-bold">35+</div>
                <div className="text-amber-200/80 text-[9px] lg:text-[9px] xl:text-[10px]">Years</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg lg:rounded-xl p-2 lg:p-2 xl:p-2.5 border border-amber-400/30 hover:bg-white/15 hover:scale-105 transition-all cursor-pointer">
                <FaUsers className="text-amber-300 text-lg lg:text-lg xl:text-xl mx-auto mb-0.5" />
                <div className="text-white text-base lg:text-base xl:text-lg font-bold">10K+</div>
                <div className="text-amber-200/80 text-[9px] lg:text-[9px] xl:text-[10px]">Customers</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-lg lg:rounded-xl p-2 lg:p-2 xl:p-2.5 border border-amber-400/30 hover:bg-white/15 hover:scale-105 transition-all cursor-pointer">
                <FaCalendarCheck className="text-amber-300 text-lg lg:text-lg xl:text-xl mx-auto mb-0.5" />
                <div className="text-white text-base lg:text-base xl:text-lg font-bold">50K+</div>
                <div className="text-amber-200/80 text-[9px] lg:text-[9px] xl:text-[10px]">Events</div>
              </div>
            </div>

            {/* Services & Contact Side by Side */}
            <div className="grid lg:grid-cols-2 gap-2 lg:gap-2 xl:gap-3 mb-2.5 lg:mb-2 xl:mb-3">
              {/* Services */}
              <div className="bg-black/20 backdrop-blur-sm rounded-lg lg:rounded-xl p-2.5 lg:p-2.5 xl:p-3 border border-amber-400/20 hover:bg-black/30 transition-all">
                <h3 className="text-amber-300 font-semibold mb-1.5 lg:mb-1.5 xl:mb-2 text-[9px] lg:text-[10px] xl:text-xs uppercase tracking-wider flex items-center justify-center gap-1">
                  <FaLeaf className="text-[10px] lg:text-xs" /> Our Services
                </h3>
                <div className="flex flex-col items-center gap-1 lg:gap-1 xl:gap-1.5">
                  <div className="flex items-center gap-1 text-amber-100/90 text-[9px] lg:text-[10px] xl:text-xs">
                    <FaCheckCircle className="text-green-400 text-[8px] lg:text-[9px] xl:text-[10px] flex-shrink-0" />
                    <span>Weddings</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-100/90 text-[9px] lg:text-[10px] xl:text-xs">
                    <FaCheckCircle className="text-green-400 text-[8px] lg:text-[9px] xl:text-[10px] flex-shrink-0" />
                    <span>Corporate</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-100/90 text-[9px] lg:text-[10px] xl:text-xs">
                    <FaCheckCircle className="text-green-400 text-[8px] lg:text-[9px] xl:text-[10px] flex-shrink-0" />
                    <span>Birthdays</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-100/90 text-[9px] lg:text-[10px] xl:text-xs">
                    <FaCheckCircle className="text-green-400 text-[8px] lg:text-[9px] xl:text-[10px] flex-shrink-0" />
                    <span>Religious</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-100/90 text-[9px] lg:text-[10px] xl:text-xs">
                    <FaCheckCircle className="text-green-400 text-[8px] lg:text-[9px] xl:text-[10px] flex-shrink-0" />
                    <span>House Warming</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-100/90 text-[9px] lg:text-[10px] xl:text-xs">
                    <FaCheckCircle className="text-green-400 text-[8px] lg:text-[9px] xl:text-[10px] flex-shrink-0" />
                    <span>Anniversary</span>
                  </div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-black/20 backdrop-blur-sm rounded-lg lg:rounded-xl p-2.5 lg:p-2.5 xl:p-3 border border-amber-400/20 hover:bg-black/30 transition-all">
                <h3 className="text-amber-300 font-semibold mb-1.5 lg:mb-1.5 xl:mb-2 text-[9px] lg:text-[10px] xl:text-xs uppercase tracking-wider flex items-center justify-center gap-1">
                  <FaPhone className="text-[10px] lg:text-xs" /> Contact
                </h3>
                <div className="flex flex-col items-center gap-1 lg:gap-1 xl:gap-1.5 text-[9px] lg:text-[10px] xl:text-xs">
                  <div className="flex items-center gap-1 text-amber-100">
                    <FaPhone className="text-amber-400 flex-shrink-0 text-[10px] lg:text-xs" />
                    <span className="break-all leading-tight">9866525102 9963691393</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-100">
                    <FaPhone className="text-amber-400 flex-shrink-0 text-[10px] lg:text-xs opacity-0" />
                    <span className="break-all leading-tight">9390015302</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-100">
                    <FaEnvelope className="text-amber-400 flex-shrink-0 text-[10px] lg:text-xs" />
                    <span className="break-all leading-tight">pujyasri1989cya@gmail.com</span>
                  </div>
                  <div className="flex items-center gap-1 text-amber-100">
                    <FaMapMarkerAlt className="text-amber-400 flex-shrink-0 text-[10px] lg:text-xs" />
                    <span className="leading-tight">Vanathalipuram, HYD</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Tagline */}
            <div className="flex items-center justify-center gap-2 text-amber-200/90">
              <FaHeart className="text-red-400 text-[10px] lg:text-xs animate-pulse" />
              <p className="text-[10px] lg:text-xs xl:text-sm italic">"Catering to your success, one event at a time"</p>
              <FaHeart className="text-red-400 text-[10px] lg:text-xs animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

