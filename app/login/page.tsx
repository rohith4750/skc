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
      {/* Mobile Header with Logo */}
      <div className="lg:hidden bg-gradient-to-r from-red-800 via-red-900 to-amber-900 text-white py-6 px-4">
        <div className="flex flex-col items-center">
          <Image 
            src="/images/logo-dark.png" 
            alt="SKC Logo" 
            width={120} 
            height={120}
            className="drop-shadow-lg"
            priority
          />
          <p className="text-amber-200 text-xs mt-2">Pure Vegetarian • Since 1989</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row min-h-screen lg:min-h-screen">
        {/* Left Side - Login Form */}
        <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8">
          <div className="w-full max-w-md">
            {/* Welcome Text */}
            <div className="mb-6 text-center lg:text-left">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
                Welcome Back
              </h1>
              <p className="text-gray-600 text-sm sm:text-base">
                Sign in to manage your catering business
              </p>
            </div>

            {/* Login Form Card */}
            <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-6 lg:p-8 border border-gray-100">
              <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                <FormError message={formError} />
                
                {/* Username Field */}
                <div>
                  <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Username or Email
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUser className="text-gray-400 text-sm" />
                    </div>
                    <input
                      id="username"
                      type="text"
                      value={formData.username}
                      onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                      className="block w-full pl-10 pr-3 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none text-sm"
                      placeholder="Enter username or email"
                      required
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLock className="text-gray-400 text-sm" />
                    </div>
                    <input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="block w-full pl-10 pr-10 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none text-sm"
                      placeholder="Enter password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <FaEyeSlash /> : <FaEye />}
                    </button>
                  </div>
                </div>

                {/* Remember Me & Forgot Password */}
                <div className="flex items-center justify-between text-xs sm:text-sm">
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.rememberMe}
                      onChange={(e) => setFormData({ ...formData, rememberMe: e.target.checked })}
                      className="rounded border-gray-300 text-primary-500 focus:ring-primary-500"
                    />
                    <span className="ml-2 text-gray-600">Remember me</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => router.push('/reset-password')}
                    className="text-primary-600 hover:text-primary-700 font-medium"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-gradient-to-r from-red-700 to-amber-700 text-white py-2.5 sm:py-3 rounded-lg font-semibold hover:from-red-800 hover:to-amber-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center gap-2"
                >
                  {isLoading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <FaUtensils className="text-amber-200" />
                      Sign In
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Mobile Contact & Stats Section */}
            <div className="lg:hidden mt-6 space-y-4">
              {/* Stats Row */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
                  <FaAward className="text-amber-600 text-xl mx-auto mb-1" />
                  <div className="text-lg font-bold text-gray-800">35+</div>
                  <div className="text-[10px] text-gray-500">Years</div>
                </div>
                <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
                  <FaUsers className="text-amber-600 text-xl mx-auto mb-1" />
                  <div className="text-lg font-bold text-gray-800">10K+</div>
                  <div className="text-[10px] text-gray-500">Customers</div>
                </div>
                <div className="bg-white rounded-xl p-3 text-center shadow-sm border border-gray-100">
                  <FaCalendarCheck className="text-amber-600 text-xl mx-auto mb-1" />
                  <div className="text-lg font-bold text-gray-800">50K+</div>
                  <div className="text-[10px] text-gray-500">Events</div>
                </div>
              </div>

              {/* Contact Info */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FaPhone className="text-red-600" /> Contact Us
                </h3>
                <div className="space-y-2 text-xs text-gray-600">
                  <p>📞 9866652150, 9900119302, 9656501388</p>
                  <p>✉️ pujaysri1989@gmail.com</p>
                  <p>📍 Vanathalipuram, Hyderabad - 500070</p>
                </div>
              </div>

              {/* Services */}
              <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                  <FaLeaf className="text-green-600" /> Our Services
                </h3>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <FaCheckCircle className="text-green-500 text-[10px]" />
                    <span>Weddings</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FaCheckCircle className="text-green-500 text-[10px]" />
                    <span>Corporate</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FaCheckCircle className="text-green-500 text-[10px]" />
                    <span>Birthdays</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <FaCheckCircle className="text-green-500 text-[10px]" />
                    <span>Religious</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-4 text-center text-[10px] sm:text-xs text-gray-500">
              <p>© 2024 Srivatsasa & Koundinya Caterers. All rights reserved.</p>
            </div>
          </div>
        </div>

        {/* Right Side - Desktop Only */}
        <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:items-center lg:justify-center lg:p-6 xl:p-10 bg-gradient-to-br from-red-800 via-red-900 to-amber-900 relative overflow-hidden">
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
          <div className="relative z-10 w-full max-w-lg text-center">
            {/* Logo */}
            <div className="mb-6">
              <Image 
                src="/images/logo-dark.png" 
                alt="SKC Logo" 
                width={260} 
                height={260}
                className="drop-shadow-2xl mx-auto"
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
            <div className="grid grid-cols-3 gap-3 mb-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-amber-400/30 hover:bg-white/15 transition-all">
                <FaAward className="text-amber-300 text-2xl mx-auto mb-1" />
                <div className="text-white text-xl font-bold">35+</div>
                <div className="text-amber-200/80 text-[10px]">Years</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-amber-400/30 hover:bg-white/15 transition-all">
                <FaUsers className="text-amber-300 text-2xl mx-auto mb-1" />
                <div className="text-white text-xl font-bold">10K+</div>
                <div className="text-amber-200/80 text-[10px]">Customers</div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-amber-400/30 hover:bg-white/15 transition-all">
                <FaCalendarCheck className="text-amber-300 text-2xl mx-auto mb-1" />
                <div className="text-white text-xl font-bold">50K+</div>
                <div className="text-amber-200/80 text-[10px]">Events</div>
              </div>
            </div>

            {/* Services */}
            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-amber-400/20 mb-6">
              <h3 className="text-amber-300 font-semibold mb-3 text-xs uppercase tracking-wider flex items-center justify-center gap-2">
                <FaLeaf /> Our Services
              </h3>
              <div className="grid grid-cols-2 gap-2 text-left">
                <div className="flex items-center gap-2 text-amber-100/90 text-xs">
                  <FaCheckCircle className="text-green-400 text-[10px]" />
                  <span>Wedding Catering</span>
                </div>
                <div className="flex items-center gap-2 text-amber-100/90 text-xs">
                  <FaCheckCircle className="text-green-400 text-[10px]" />
                  <span>Corporate Events</span>
                </div>
                <div className="flex items-center gap-2 text-amber-100/90 text-xs">
                  <FaCheckCircle className="text-green-400 text-[10px]" />
                  <span>Birthday Parties</span>
                </div>
                <div className="flex items-center gap-2 text-amber-100/90 text-xs">
                  <FaCheckCircle className="text-green-400 text-[10px]" />
                  <span>Religious Functions</span>
                </div>
                <div className="flex items-center gap-2 text-amber-100/90 text-xs">
                  <FaCheckCircle className="text-green-400 text-[10px]" />
                  <span>House Warming</span>
                </div>
                <div className="flex items-center gap-2 text-amber-100/90 text-xs">
                  <FaCheckCircle className="text-green-400 text-[10px]" />
                  <span>Anniversary</span>
                </div>
              </div>
            </div>

            {/* Contact Info */}
            <div className="bg-black/20 backdrop-blur-sm rounded-xl p-4 border border-amber-400/20 mb-6">
              <div className="grid grid-cols-1 gap-2 text-xs">
                <div className="flex items-center justify-center gap-2 text-amber-100">
                  <FaPhone className="text-amber-400" />
                  <span>9866652150 | 9900119302 | 9656501388</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-amber-100">
                  <FaEnvelope className="text-amber-400" />
                  <span>pujaysri1989@gmail.com</span>
                </div>
                <div className="flex items-center justify-center gap-2 text-amber-100">
                  <FaMapMarkerAlt className="text-amber-400" />
                  <span>Vanathalipuram, Hyderabad - 500070</span>
                </div>
              </div>
            </div>

            {/* Tagline */}
            <div className="flex items-center justify-center gap-2 text-amber-200/90">
              <FaHeart className="text-red-400 text-sm" />
              <p className="text-sm italic">"Catering to your success, one event at a time"</p>
              <FaHeart className="text-red-400 text-sm" />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
