'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'
import { 
  FaLock, FaUser, FaEye, FaEyeSlash, FaAward, FaUsers, FaCalendarCheck,
  FaPhone, FaEnvelope, FaMapMarkerAlt, FaLeaf, FaCheckCircle, FaUtensils,
  FaStar, FaHeart
} from 'react-icons/fa'
import toast from 'react-hot-toast'
import { setAuth, isLoggedIn, getToken } from '@/lib/auth-storage'
import { isNonEmptyString } from '@/lib/validation'
import FormError from '@/components/FormError'

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    rememberMe: false,
  })
  const [showPassword, setShowPassword] = useState(false)
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setFormError('')

    try {
      if (!isNonEmptyString(formData.username) || !isNonEmptyString(formData.password)) {
        toast.error('Please enter your username/email and password')
        setFormError('Please enter your username/email and password')
        setIsLoading(false)
        return
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          rememberMe: formData.rememberMe,
        }),
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
        formData.rememberMe
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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-orange-50 to-red-50">
      {/* Mobile & Tablet Header with Logo */}
      <div className="lg:hidden bg-gradient-to-r from-red-800 via-red-900 to-amber-900 text-white py-4 sm:py-6 md:py-8 px-4">
        <div className="flex flex-col items-center">
          <Image 
            src="/images/logo-dark.png" 
            alt="SKC Logo" 
            width={120} 
            height={120}
            className="drop-shadow-lg w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32"
            priority
          />
          <p className="text-amber-200 text-xs sm:text-sm md:text-base mt-2">Pure Vegetarian • Since 1989</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row min-h-[calc(100vh-100px)] sm:min-h-[calc(100vh-120px)] lg:min-h-screen">
        {/* Left Side - Login Form */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 md:p-8 lg:p-10 xl:p-12">
          <div className="w-full max-w-md lg:max-w-lg xl:max-w-xl">
            {/* Welcome Text */}
            <div className="mb-4 sm:mb-6 md:mb-8 text-center lg:text-left">
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-4xl xl:text-5xl font-bold text-gray-900 mb-2">
                Welcome Back
              </h1>
              <p className="text-gray-600 text-sm sm:text-base md:text-lg">
                Sign in to manage your catering business
              </p>
            </div>

            {/* Login Form Card */}
            <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg sm:shadow-xl p-4 sm:p-6 md:p-7 lg:p-8 border border-gray-100 hover:shadow-2xl transition-shadow duration-300">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5 md:space-y-6">
                <FormError message={formError} />
                
                {/* Username Field */}
                <div>
                  <label htmlFor="username" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                    Username or Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                      <FaUser className="text-gray-400 text-sm sm:text-base" />
                    </div>
                    <input
                      id="username"
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="block w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-3.5 md:py-4 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none text-sm sm:text-base hover:border-gray-400"
                      placeholder="Enter username or email"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 sm:pl-4 flex items-center pointer-events-none">
                      <FaLock className="text-gray-400 text-sm sm:text-base" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="block w-full pl-10 sm:pl-12 pr-12 sm:pr-14 py-3 sm:py-3.5 md:py-4 border border-gray-300 rounded-lg sm:rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none text-sm sm:text-base hover:border-gray-400"
                      placeholder="Enter password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 sm:pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors touch-manipulation min-w-[44px] min-h-[44px] flex items-center justify-center"
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                    >
                      {showPassword ? <FaEyeSlash className="text-base sm:text-lg" /> : <FaEye className="text-base sm:text-lg" />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between text-xs sm:text-sm md:text-base gap-2">
                  <label className="flex items-center cursor-pointer touch-manipulation min-h-[44px]">
                    <input
                      type="checkbox"
                      checked={formData.rememberMe}
                      onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                      className="rounded border-gray-300 text-primary-500 focus:ring-primary-500 w-4 h-4 sm:w-5 sm:h-5 cursor-pointer"
                    />
                    <span className="ml-2 sm:ml-3 text-gray-600">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => router.push('/reset-password')}
                    className="text-primary-600 hover:text-primary-700 font-medium transition-colors touch-manipulation min-h-[44px] px-2"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-red-700 to-amber-700 text-white py-3 sm:py-3.5 md:py-4 rounded-lg sm:rounded-xl font-semibold text-sm sm:text-base md:text-lg hover:from-red-800 hover:to-amber-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:shadow-md flex items-center justify-center gap-2 touch-manipulation min-h-[48px] sm:min-h-[52px]"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 sm:border-3 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <FaUtensils className="text-amber-200 text-base sm:text-lg" />
                      Sign In
                    </>
                  )}
                </button>
              </form>
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
                  <p className="flex items-center gap-2">📞 <span className="break-all">9866652150, 9900119302, 9656501388</span></p>
                  <p className="flex items-center gap-2">✉️ <span className="break-all">pujaysri1989@gmail.com</span></p>
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
            <div className="mt-4 sm:mt-6 md:mt-8 text-center text-[10px] sm:text-xs md:text-sm text-gray-500 px-4">
              <p>© 2024 Srivatsasa & Koundinya Caterers. All rights reserved.</p>
            </div>
          </div>
        </div>

        {/* Right Side - Desktop Only */}
        <div className="hidden lg:flex lg:flex-1 xl:flex-[1.2] lg:flex-col lg:items-center lg:justify-center lg:p-8 xl:p-12 2xl:p-16 bg-gradient-to-br from-red-800 via-red-900 to-amber-900 relative overflow-hidden">
          {/* Decorative Elements */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-10 right-10 w-64 h-64 border border-amber-400/20 rounded-full"></div>
            <div className="absolute top-10 right-10 w-80 h-80 border border-amber-400/10 rounded-full"></div>
            <div className="absolute bottom-20 left-10 w-48 h-48 border border-amber-400/20 rounded-full"></div>
            <div className="absolute bottom-20 left-10 w-64 h-64 border border-amber-400/10 rounded-full"></div>
            <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-red-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          </div>

          {/* Content */}
          <div className="relative z-10 w-full max-w-lg xl:max-w-xl 2xl:max-w-2xl text-center">
            {/* Logo */}
            <div className="mb-6 xl:mb-8">
              <Image 
                src="/images/logo-dark.png" 
                alt="SKC Logo" 
                width={260} 
                height={260}
                className="drop-shadow-2xl mx-auto w-52 h-52 xl:w-64 xl:h-64 2xl:w-72 2xl:h-72"
                priority
              />
            </div>

            {/* Decorative Line */}
            <div className="flex items-center justify-center gap-4 mb-6">
              <div className="w-16 h-0.5 bg-gradient-to-r from-transparent to-amber-400/70"></div>
              <FaStar className="text-amber-400/70" />
              <div className="w-16 h-0.5 bg-gradient-to-l from-transparent to-amber-400/70"></div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-3 gap-3 xl:gap-4 mb-6 xl:mb-8">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl xl:rounded-2xl p-3 xl:p-4 2xl:p-5 border border-amber-400/30 hover:bg-white/15 hover:scale-105 transition-all cursor-pointer">
                <FaAward className="text-amber-300 text-2xl xl:text-3xl 2xl:text-4xl mx-auto mb-1 xl:mb-2" />
                <div className="text-white text-xl xl:text-2xl 2xl:text-3xl font-bold">35+</div>
                <div className="text-amber-200/80 text-[10px] xl:text-xs 2xl:text-sm">Years</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl xl:rounded-2xl p-3 xl:p-4 2xl:p-5 border border-amber-400/30 hover:bg-white/15 hover:scale-105 transition-all cursor-pointer">
                <FaUsers className="text-amber-300 text-2xl xl:text-3xl 2xl:text-4xl mx-auto mb-1 xl:mb-2" />
                <div className="text-white text-xl xl:text-2xl 2xl:text-3xl font-bold">10K+</div>
                <div className="text-amber-200/80 text-[10px] xl:text-xs 2xl:text-sm">Customers</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl xl:rounded-2xl p-3 xl:p-4 2xl:p-5 border border-amber-400/30 hover:bg-white/15 hover:scale-105 transition-all cursor-pointer">
                <FaCalendarCheck className="text-amber-300 text-2xl xl:text-3xl 2xl:text-4xl mx-auto mb-1 xl:mb-2" />
                <div className="text-white text-xl xl:text-2xl 2xl:text-3xl font-bold">50K+</div>
                <div className="text-amber-200/80 text-[10px] xl:text-xs 2xl:text-sm">Events</div>
              </div>
            </div>

            {/* Services */}
            <div className="bg-black/20 backdrop-blur-sm rounded-xl xl:rounded-2xl p-4 xl:p-5 2xl:p-6 border border-amber-400/20 mb-6 xl:mb-8 hover:bg-black/30 transition-all">
              <h3 className="text-amber-300 font-semibold mb-3 xl:mb-4 text-xs xl:text-sm 2xl:text-base uppercase tracking-wider flex items-center justify-center gap-2">
                <FaLeaf className="text-base xl:text-lg" /> Our Services
              </h3>
              <div className="grid grid-cols-2 gap-2 xl:gap-3 text-left">
                <div className="flex items-center gap-2 text-amber-100/90 text-xs xl:text-sm 2xl:text-base">
                  <FaCheckCircle className="text-green-400 text-xs xl:text-sm flex-shrink-0" />
                  <span>Wedding Catering</span>
                </div>
                <div className="flex items-center gap-2 text-amber-100/90 text-xs xl:text-sm 2xl:text-base">
                  <FaCheckCircle className="text-green-400 text-xs xl:text-sm flex-shrink-0" />
                  <span>Corporate Events</span>
                </div>
                <div className="flex items-center gap-2 text-amber-100/90 text-xs xl:text-sm 2xl:text-base">
                  <FaCheckCircle className="text-green-400 text-xs xl:text-sm flex-shrink-0" />
                  <span>Birthday Parties</span>
                </div>
                <div className="flex items-center gap-2 text-amber-100/90 text-xs xl:text-sm 2xl:text-base">
                  <FaCheckCircle className="text-green-400 text-xs xl:text-sm flex-shrink-0" />
                  <span>Religious Functions</span>
                </div>
                <div className="flex items-center gap-2 text-amber-100/90 text-xs xl:text-sm 2xl:text-base">
                  <FaCheckCircle className="text-green-400 text-xs xl:text-sm flex-shrink-0" />
                  <span>House Warming</span>
                </div>
                <div className="flex items-center gap-2 text-amber-100/90 text-xs xl:text-sm 2xl:text-base">
                  <FaCheckCircle className="text-green-400 text-xs xl:text-sm flex-shrink-0" />
                  <span>Anniversary</span>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-black/20 backdrop-blur-sm rounded-xl xl:rounded-2xl p-4 xl:p-5 2xl:p-6 border border-amber-400/20 mb-6 xl:mb-8 hover:bg-black/30 transition-all">
              <div className="grid grid-cols-1 gap-2 xl:gap-3 text-xs xl:text-sm 2xl:text-base">
                <div className="flex items-center justify-center gap-2 xl:gap-3 text-amber-100">
                  <FaPhone className="text-amber-400 flex-shrink-0 text-sm xl:text-base" />
                  <span className="break-all">9866652150 | 9900119302 | 9656501388</span>
                </div>
                <div className="flex items-center justify-center gap-2 xl:gap-3 text-amber-100">
                  <FaEnvelope className="text-amber-400 flex-shrink-0 text-sm xl:text-base" />
                  <span className="break-all">pujaysri1989@gmail.com</span>
                </div>
                <div className="flex items-center justify-center gap-2 xl:gap-3 text-amber-100">
                  <FaMapMarkerAlt className="text-amber-400 flex-shrink-0 text-sm xl:text-base" />
                  <span>Vanathalipuram, Hyderabad - 500070</span>
                </div>
              </div>
            </div>

            {/* Tagline */}
            <div className="flex items-center justify-center gap-2 xl:gap-3 text-amber-200/90">
              <FaHeart className="text-red-400 text-sm xl:text-base animate-pulse" />
              <p className="text-sm xl:text-base 2xl:text-lg italic">"Catering to your success, one event at a time"</p>
              <FaHeart className="text-red-400 text-sm xl:text-base animate-pulse" style={{ animationDelay: '0.5s' }} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
