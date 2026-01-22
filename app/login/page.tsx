'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { FaUtensils, FaLock, FaUser, FaEye, FaEyeSlash, FaAward, FaUsers, FaCalendarCheck, FaLeaf, FaHeart, FaStar, FaCheckCircle, FaPhone, FaEnvelope, FaMapMarkerAlt } from 'react-icons/fa'
import toast from 'react-hot-toast'
import { setAuth, isAuthenticated } from '@/lib/auth'
import { isNonEmptyString } from '@/lib/validation'
import FormError from '@/components/FormError'

export default function LoginPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    username: '',
    password: '',
  })
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formError, setFormError] = useState('')

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated()) {
      router.push('/')
    }
  }, [router])

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
      const message = error.message || 'Login failed. Please check your credentials.'
      toast.error(message)
      setFormError(message)
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Side - Login Form */}
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 bg-gradient-to-br from-gray-50 via-orange-50 to-red-50">
        <div className="w-full max-w-md">
          {/* Mobile Logo - Only visible on small screens */}
          <div className="mb-6 lg:hidden text-center">
            <div className="flex justify-center">
              <Image 
                src="/images/logo.png" 
                alt="SKC Logo" 
                width={150} 
                height={150}
                className="drop-shadow-lg"
                priority
              />
            </div>
          </div>

          {/* Welcome Text */}
          <div className="mb-6 text-center lg:text-left">
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
              <FormError message={formError} />
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
                  onClick={() => router.push('/reset-password')}
                  className="text-primary-600 hover:text-primary-700 font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-red-700 to-amber-700 text-white py-3.5 rounded-lg font-semibold hover:from-red-800 hover:to-amber-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 flex items-center justify-center gap-2"
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

            {/* Divider */}
            <div className="my-6 flex items-center">
              <div className="flex-1 border-t border-gray-200"></div>
              <span className="px-4 text-sm text-gray-400">Pure Vegetarian Since 1989</span>
              <div className="flex-1 border-t border-gray-200"></div>
            </div>

            {/* Contact Info */}
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-center gap-2">
                <FaPhone className="text-red-600" />
                <span>9866652150, 9900119302, 9656501388</span>
              </div>
              <div className="flex items-center gap-2">
                <FaEnvelope className="text-red-600" />
                <span>pujaysri1989@gmail.com</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 text-center text-xs text-gray-500">
            <p>© 2024 Srivatsasa & Koundinya Caterers. All rights reserved.</p>
          </div>
        </div>
      </div>

      {/* Right Side - Logo & Creative Elements */}
      <div className="hidden lg:flex lg:flex-1 lg:flex-col lg:items-center lg:justify-center lg:p-8 xl:p-12 bg-gradient-to-br from-red-800 via-red-900 to-amber-900 relative overflow-hidden">
        {/* Decorative Background Pattern */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {/* Mandala-style decorative circles */}
          <div className="absolute top-10 right-10 w-64 h-64 border border-amber-400/20 rounded-full animate-spin" style={{ animationDuration: '60s' }}></div>
          <div className="absolute top-10 right-10 w-80 h-80 border border-amber-400/10 rounded-full animate-spin" style={{ animationDuration: '90s', animationDirection: 'reverse' }}></div>
          <div className="absolute bottom-20 left-10 w-48 h-48 border border-amber-400/20 rounded-full animate-spin" style={{ animationDuration: '45s' }}></div>
          <div className="absolute bottom-20 left-10 w-64 h-64 border border-amber-400/10 rounded-full animate-spin" style={{ animationDuration: '75s', animationDirection: 'reverse' }}></div>
          
          {/* Glowing effects */}
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 left-1/4 w-72 h-72 bg-red-500/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
          
          {/* Floating decorative icons */}
          <div className="absolute top-20 left-20 text-amber-400/20 animate-bounce" style={{ animationDuration: '3s' }}>
            <FaLeaf className="text-4xl" />
          </div>
          <div className="absolute bottom-32 right-20 text-amber-400/20 animate-bounce" style={{ animationDuration: '4s', animationDelay: '1s' }}>
            <FaUtensils className="text-5xl" />
          </div>
          <div className="absolute top-1/2 left-16 text-amber-400/20 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '0.5s' }}>
            <FaHeart className="text-3xl" />
          </div>
        </div>

        {/* Content */}
        <div className="relative z-10 w-full max-w-xl text-center">
          {/* Logo Image */}
          <div className="mb-6 animate-fade-in">
            <div className="flex justify-center">
              <Image 
                src="/images/logo-dark.png" 
                alt="SKC Logo" 
                width={280} 
                height={280}
                className="drop-shadow-2xl"
                priority
              />
            </div>
          </div>

          {/* Tagline with decorative elements */}
          <div className="mb-8">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-0.5 bg-gradient-to-r from-transparent to-amber-400"></div>
              <FaStar className="text-amber-400 text-lg" />
              <div className="w-12 h-0.5 bg-gradient-to-l from-transparent to-amber-400"></div>
            </div>
            <p className="text-amber-100 text-xl font-medium mb-2">
              Trusted by Thousands
            </p>
            <p className="text-amber-200/70 text-sm">
              Making every celebration memorable with authentic vegetarian cuisine
            </p>
          </div>

          {/* Stats/Features Cards */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            {/* Stat 1 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-amber-400/30 hover:bg-white/15 transition-all hover:scale-105 cursor-default">
              <div className="flex flex-col items-center">
                <FaAward className="text-amber-300 text-3xl mb-2" />
                <div className="text-white text-2xl font-bold">35+</div>
                <div className="text-amber-200/80 text-xs">Years of Excellence</div>
              </div>
            </div>

            {/* Stat 2 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-amber-400/30 hover:bg-white/15 transition-all hover:scale-105 cursor-default">
              <div className="flex flex-col items-center">
                <FaUsers className="text-amber-300 text-3xl mb-2" />
                <div className="text-white text-2xl font-bold">10K+</div>
                <div className="text-amber-200/80 text-xs">Happy Customers</div>
              </div>
            </div>

            {/* Stat 3 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-amber-400/30 hover:bg-white/15 transition-all hover:scale-105 cursor-default">
              <div className="flex flex-col items-center">
                <FaCalendarCheck className="text-amber-300 text-3xl mb-2" />
                <div className="text-white text-2xl font-bold">50K+</div>
                <div className="text-amber-200/80 text-xs">Events Served</div>
              </div>
            </div>
          </div>

          {/* Services Highlights */}
          <div className="bg-black/20 backdrop-blur-sm rounded-xl p-5 border border-amber-400/20 mb-6">
            <h3 className="text-amber-300 font-semibold mb-4 text-sm uppercase tracking-wider">Our Services</h3>
            <div className="grid grid-cols-2 gap-3 text-left">
              <div className="flex items-center gap-2 text-amber-100/90 text-sm">
                <FaCheckCircle className="text-green-400 text-xs flex-shrink-0" />
                <span>Wedding Catering</span>
              </div>
              <div className="flex items-center gap-2 text-amber-100/90 text-sm">
                <FaCheckCircle className="text-green-400 text-xs flex-shrink-0" />
                <span>Corporate Events</span>
              </div>
              <div className="flex items-center gap-2 text-amber-100/90 text-sm">
                <FaCheckCircle className="text-green-400 text-xs flex-shrink-0" />
                <span>Birthday Parties</span>
              </div>
              <div className="flex items-center gap-2 text-amber-100/90 text-sm">
                <FaCheckCircle className="text-green-400 text-xs flex-shrink-0" />
                <span>Religious Functions</span>
              </div>
              <div className="flex items-center gap-2 text-amber-100/90 text-sm">
                <FaCheckCircle className="text-green-400 text-xs flex-shrink-0" />
                <span>Anniversary Celebrations</span>
              </div>
              <div className="flex items-center gap-2 text-amber-100/90 text-sm">
                <FaCheckCircle className="text-green-400 text-xs flex-shrink-0" />
                <span>House Warming</span>
              </div>
            </div>
          </div>

          {/* Quote */}
          <div className="relative">
            <p className="text-amber-200/90 text-base italic">
              "Catering to your success, one event at a time"
            </p>
            <div className="flex items-center justify-center gap-2 mt-3">
              <FaMapMarkerAlt className="text-amber-400/70 text-sm" />
              <span className="text-amber-300/70 text-xs">Hyderabad, Telangana</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
