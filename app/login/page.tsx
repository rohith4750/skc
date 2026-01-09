'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { FaUtensils, FaLock, FaUser, FaEye, FaEyeSlash, FaAward, FaUsers, FaCalendarCheck, FaTimes } from 'react-icons/fa'
import toast from 'react-hot-toast'
import { setAuth, isAuthenticated } from '@/lib/auth'
import Logo from '@/components/Logo'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showForgotPassword, setShowForgotPassword] = useState(false)
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('')
  const [isForgotPasswordLoading, setIsForgotPasswordLoading] = useState(false)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/')
    }
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Login failed')
      }

                  // Set authentication with role
                  setAuth(data.user.username, data.user.role || 'admin')
                  toast.success('Login successful!')
                  router.push('/')
    } catch (error: any) {
      toast.error(error.message || 'Login failed. Please check your credentials.')
      setIsLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsForgotPasswordLoading(true)

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: forgotPasswordEmail,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to process request')
      }

      toast.success(data.message || 'Password reset link has been sent to your email.')
      setShowForgotPassword(false)
      setForgotPasswordEmail('')
    } catch (error: any) {
      toast.error(error.message || 'Failed to process request. Please try again.')
    } finally {
      setIsForgotPasswordLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-gradient-to-br from-gray-50 via-orange-50 to-red-50">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 lg:max-w-2xl xl:max-w-3xl">
        <div className="w-full max-w-md">
          {/* Mobile Logo - Only visible on small screens */}
          <div className="mb-8 lg:hidden text-center">
            <Logo variant="compact" size="lg" textColor="dark" />
            <p className="text-gray-600 text-sm mt-2">Since 1989 - Serving Excellence</p>
          </div>

          {/* Welcome Text */}
          <div className="mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
              Welcome Back
            </h1>
            <p className="text-gray-600 text-base">
              Sign in to manage your catering business
            </p>
          </div>

          {/* Login Form */}
          <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 border border-gray-100">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Username Field */}
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
                  Username or Email
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaUser className="text-gray-400" />
                  </div>
                  <input
                    id="username"
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none text-sm sm:text-base"
                    placeholder="Enter your username or email"
                    required
                  />
                </div>
              </div>

              {/* Password Field */}
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FaLock className="text-gray-400" />
                  </div>
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="block w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none text-sm sm:text-base"
                    placeholder="Enter your password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>

              {/* Remember Me & Forgot Password */}
              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="rounded border-gray-300 text-primary-500 focus:ring-primary-500 cursor-pointer" 
                  />
                  <span className="ml-2 text-gray-600">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-primary-500 to-secondary-500 text-white py-3 rounded-lg font-semibold hover:from-primary-600 hover:to-secondary-600 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Signing in...
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-6 text-center text-sm text-gray-500">
              <p>Need help? <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">Contact support</a></p>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Logo & Creative Elements */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:items-center lg:justify-center lg:p-8 xl:p-12 bg-gradient-to-br from-primary-500 via-primary-600 to-secondary-500 relative overflow-hidden">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Floating circles */}
          <div className="absolute top-20 right-20 w-72 h-72 bg-white/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-32 left-16 w-96 h-96 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-white/5 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }}></div>
          
          {/* Floating utensils icons */}
          <div className="absolute top-1/4 right-1/4 text-white/20 animate-bounce" style={{ animationDelay: '0.5s' }}>
            <FaUtensils className="text-6xl transform rotate-12" />
          </div>
          <div className="absolute bottom-1/4 left-1/4 text-white/20 animate-bounce" style={{ animationDelay: '1.5s' }}>
            <FaUtensils className="text-5xl transform -rotate-12" />
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-lg text-center">
          {/* Logo */}
          <div className="mb-12">
            <Logo variant="full" size="lg" textColor="white" showTagline={true} />
          </div>

          {/* Tagline */}
          <div className="mb-12">
            <p className="text-white/90 text-xl sm:text-2xl font-medium mb-4">
              Since 1989
            </p>
            <p className="text-white text-3xl sm:text-4xl font-bold mb-2">
              Serving Excellence
            </p>
            <div className="flex items-center justify-center gap-2 mt-4">
              <div className="w-12 h-0.5 bg-white/50"></div>
              <FaUtensils className="text-white/70" />
              <div className="w-12 h-0.5 bg-white/50"></div>
            </div>
          </div>

          {/* Stats/Features Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16">
            {/* Stat 1 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20">
              <div className="flex flex-col items-center">
                <FaAward className="text-white text-3xl sm:text-4xl mb-3" />
                <div className="text-white text-2xl sm:text-3xl font-bold mb-1">35+</div>
                <div className="text-white/80 text-xs sm:text-sm text-center">Years of Excellence</div>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20">
              <div className="flex flex-col items-center">
                <FaUsers className="text-white text-3xl sm:text-4xl mb-3" />
                <div className="text-white text-2xl sm:text-3xl font-bold mb-1">10K+</div>
                <div className="text-white/80 text-xs sm:text-sm text-center">Happy Customers</div>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 sm:p-6 border border-white/20">
              <div className="flex flex-col items-center">
                <FaCalendarCheck className="text-white text-3xl sm:text-4xl mb-3" />
                <div className="text-white text-2xl sm:text-3xl font-bold mb-1">50K+</div>
                <div className="text-white/80 text-xs sm:text-sm text-center">Events Served</div>
              </div>
            </div>
          </div>

          {/* Additional decorative text */}
          <div className="mt-12">
            <p className="text-white/70 text-sm sm:text-base italic">
              "Catering to your success, one event at a time"
            </p>
          </div>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {showForgotPassword && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-8 relative">
            {/* Close Button */}
            <button
              onClick={() => {
                setShowForgotPassword(false)
                setForgotPasswordEmail('')
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <FaTimes className="text-xl" />
            </button>

            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Reset Password</h2>
              <p className="text-gray-600 text-sm">
                Enter your email address and we'll send you a link to reset your password.
              </p>
            </div>

            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <input
                  id="forgot-email"
                  type="email"
                  value={forgotPasswordEmail}
                  onChange={(e) => setForgotPasswordEmail(e.target.value)}
                  className="block w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all outline-none text-sm sm:text-base"
                  placeholder="Enter your email"
                  required
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotPassword(false)
                    setForgotPasswordEmail('')
                  }}
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isForgotPasswordLoading}
                  className="flex-1 px-4 py-3 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isForgotPasswordLoading ? 'Sending...' : 'Send Reset Link'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
