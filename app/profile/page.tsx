'use client'

import { useEffect, useState } from 'react'
import { getAuth, getUserRole } from '@/lib/auth'
import { FaUser, FaEnvelope, FaShieldAlt, FaCalendarAlt, FaEdit } from 'react-icons/fa'
import { formatDate } from '@/lib/utils'

interface UserProfile {
  username: string
  role: string
  email?: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const auth = getAuth()
    const role = getUserRole()
    
    if (auth) {
      setProfile({
        username: auth.username,
        role: role || 'admin',
      })
    }
    setLoading(false)
  }, [])

  const getRoleDisplay = (role: string | null) => {
    if (!role) return 'Admin'
    return role.split('_').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ')
  }

  const getRoleColor = (role: string | null) => {
    switch (role) {
      case 'super_admin':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'admin':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  if (loading) {
    return (
      <div className="p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 pt-14 sm:pt-16 lg:pt-6 xl:pt-8 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading profile...</p>
        </div>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 pt-14 sm:pt-16 lg:pt-6 xl:pt-8 min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600">No profile data available</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 pt-14 sm:pt-16 lg:pt-6 xl:pt-8 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="mb-4 sm:mb-5 md:mb-6">
        <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-gray-900">My Profile</h1>
        <p className="text-gray-600 mt-1 text-xs sm:text-sm md:text-base">View and manage your account information</p>
      </div>

      {/* Profile Card */}
      <div className="max-w-2xl mx-auto">
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-6 sm:p-8 text-white">
            <div className="flex items-center gap-4">
              <div className="bg-white bg-opacity-20 rounded-full p-4 sm:p-5">
                <FaUser className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl sm:text-2xl font-bold mb-1">{profile.username}</h2>
                <div className="flex items-center gap-2 mt-2">
                  <FaShieldAlt className="w-4 h-4" />
                  <span className="text-sm sm:text-base text-primary-100">
                    {getRoleDisplay(profile.role)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-4 sm:p-6 md:p-8">
            <div className="space-y-4 sm:space-y-6">
              {/* Username */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 p-2 sm:p-3 rounded-lg">
                    <FaUser className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 font-medium">Username</p>
                    <p className="text-sm sm:text-base font-semibold text-gray-900 mt-0.5">{profile.username}</p>
                  </div>
                </div>
              </div>

              {/* Role */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-gray-200">
                <div className="flex items-center gap-3">
                  <div className="bg-gray-100 p-2 sm:p-3 rounded-lg">
                    <FaShieldAlt className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                  </div>
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500 font-medium">Role</p>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs sm:text-sm font-semibold border mt-1.5 ${getRoleColor(profile.role)}`}>
                      {getRoleDisplay(profile.role)}
                    </span>
                  </div>
                </div>
              </div>

              {/* Email (if available) */}
              {profile.email && (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-gray-200">
                  <div className="flex items-center gap-3">
                    <div className="bg-gray-100 p-2 sm:p-3 rounded-lg">
                      <FaEnvelope className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                    </div>
                    <div>
                      <p className="text-xs sm:text-sm text-gray-500 font-medium">Email</p>
                      <p className="text-sm sm:text-base font-semibold text-gray-900 mt-0.5">{profile.email}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Account Information */}
              <div className="pt-2">
                <h3 className="text-sm sm:text-base font-semibold text-gray-900 mb-4">Account Information</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-gray-600">Account Status</span>
                    <span className="font-semibold text-green-600">Active</span>
                  </div>
                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-gray-600">Last Login</span>
                    <span className="font-semibold text-gray-900">Recently</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Info Message */}
        <div className="mt-4 sm:mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs sm:text-sm text-blue-800">
            <strong>Note:</strong> Profile information is managed by the system administrator. 
            Contact your administrator to update your account details.
          </p>
        </div>
      </div>
    </div>
  )
}
