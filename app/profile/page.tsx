'use client'

import { useEffect, useState } from 'react'
import { getAuth, getUserRole } from '@/lib/auth'
import { FaUser, FaEnvelope, FaShieldAlt, FaEdit, FaLock, FaSave, FaTimes } from 'react-icons/fa'
import toast from 'react-hot-toast'

interface UserProfile {
  id?: string
  username: string
  role: string
  email?: string
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)
  const [formData, setFormData] = useState({
    username: '',
    email: '',
  })
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  })

  useEffect(() => {
    loadProfile()
  }, [])

  const loadProfile = async () => {
    const auth = getAuth()
    const role = getUserRole()
    
    if (auth) {
      try {
        // Fetch user details from API
        const response = await fetch('/api/auth/me', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ username: auth.username }),
        })

        if (response.ok) {
          const userData = await response.json()
          setProfile({
            id: userData.id,
            username: userData.username,
            email: userData.email || '',
            role: userData.role || role || 'admin',
          })
          setFormData({
            username: userData.username,
            email: userData.email || '',
          })
        } else {
          // Fallback to localStorage data
          setProfile({
            username: auth.username,
            role: role || 'admin',
          })
          setFormData({
            username: auth.username,
            email: '',
          })
        }
      } catch (error) {
        console.error('Error loading profile:', error)
        // Fallback to localStorage data
        setProfile({
          username: auth.username,
          role: role || 'admin',
        })
        setFormData({
          username: auth.username,
          email: '',
        })
      }
    }
    setLoading(false)
  }

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

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    loadProfile()
  }

  const handleSaveProfile = async () => {
    if (!formData.username.trim()) {
      toast.error('Username is required')
      return
    }

    if (!profile?.id) {
      toast.error('User ID not found')
      return
    }

    try {
      const response = await fetch(`/api/users/${profile.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email || undefined,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update profile')
      }

      const updatedUser = await response.json()
      setProfile({
        ...profile,
        username: updatedUser.username,
        email: updatedUser.email || '',
      })
      toast.success('Profile updated successfully')
      setIsEditing(false)
    } catch (error: any) {
      toast.error(error.message || 'Failed to update profile')
    }
  }

  const handleChangePassword = () => {
    setIsChangingPassword(true)
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
  }

  const handleCancelPasswordChange = () => {
    setIsChangingPassword(false)
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    })
  }

  const handleSavePassword = async () => {
    if (!passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword) {
      toast.error('All password fields are required')
      return
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters')
      return
    }

    if (!profile?.username) {
      toast.error('Username not found')
      return
    }

    try {
      const response = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: profile.username,
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to change password')
      }

      toast.success('Password changed successfully')
      setIsChangingPassword(false)
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      })
    } catch (error: any) {
      toast.error(error.message || 'Failed to change password')
    }
  }

  if (!profile) {
    return (
      <div className="p-3 sm:p-4 md:p-5 lg:p-6 xl:p-8 pt-14 sm:pt-16 lg:pt-6 xl:pt-8 min-h-screen flex items-center justify-center bg-gray-50">
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
        <p className="text-gray-600 mt-1 text-xs sm:text-sm md:text-base">Manage your account information and settings</p>
      </div>

      <div className="max-w-3xl mx-auto space-y-4 sm:space-y-6">
        {/* Profile Card */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          {/* Profile Header */}
          <div className="bg-gradient-to-r from-primary-500 to-primary-600 p-4 sm:p-6 md:p-8 text-white relative">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
              <div className="bg-white bg-opacity-20 rounded-full p-3 sm:p-4 flex-shrink-0">
                <FaUser className="w-8 h-8 sm:w-10 sm:h-10" />
              </div>
              <div className="flex-1 text-center sm:text-left">
                <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-1">{profile.username}</h2>
                <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                  <FaShieldAlt className="w-4 h-4" />
                  <span className="text-sm sm:text-base text-primary-100">
                    {getRoleDisplay(profile.role)}
                  </span>
                </div>
              </div>
              {!isEditing && (
                <button
                  onClick={handleEdit}
                  className="bg-white bg-opacity-20 hover:bg-opacity-30 text-white px-4 py-2 rounded-lg transition-all flex items-center gap-2 text-sm font-medium"
                >
                  <FaEdit className="w-4 h-4" />
                  Edit Profile
                </button>
              )}
            </div>
          </div>

          {/* Profile Details */}
          <div className="p-4 sm:p-6 md:p-8">
            <div className="space-y-4 sm:space-y-5">
              {/* Username */}
              <div className="pb-4 border-b border-gray-200">
                <label className="flex items-center gap-3 mb-2">
                  <div className="bg-gray-100 p-2 sm:p-2.5 rounded-lg">
                    <FaUser className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                  </div>
                  <span className="text-xs sm:text-sm text-gray-500 font-medium">Username</span>
                </label>
                {isEditing ? (
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="mt-2 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm sm:text-base"
                    placeholder="Enter username"
                  />
                ) : (
                  <p className="mt-2 text-sm sm:text-base font-semibold text-gray-900 ml-11 sm:ml-12">{profile.username}</p>
                )}
              </div>

              {/* Email */}
              <div className="pb-4 border-b border-gray-200">
                <label className="flex items-center gap-3 mb-2">
                  <div className="bg-gray-100 p-2 sm:p-2.5 rounded-lg">
                    <FaEnvelope className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                  </div>
                  <span className="text-xs sm:text-sm text-gray-500 font-medium">Email</span>
                </label>
                {isEditing ? (
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-2 w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm sm:text-base"
                    placeholder="Enter email"
                  />
                ) : (
                  <p className="mt-2 text-sm sm:text-base font-semibold text-gray-900 ml-11 sm:ml-12">
                    {profile.email || <span className="text-gray-400 italic">Not set</span>}
                  </p>
                )}
              </div>

              {/* Role */}
              <div className="pb-4 border-b border-gray-200">
                <label className="flex items-center gap-3 mb-2">
                  <div className="bg-gray-100 p-2 sm:p-2.5 rounded-lg">
                    <FaShieldAlt className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
                  </div>
                  <span className="text-xs sm:text-sm text-gray-500 font-medium">Role</span>
                </label>
                <div className="mt-2 ml-11 sm:ml-12">
                  <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold border ${getRoleColor(profile.role)}`}>
                    {getRoleDisplay(profile.role)}
                  </span>
                  <p className="text-xs text-gray-500 mt-2">Role cannot be changed. Contact administrator for role changes.</p>
                </div>
              </div>

              {/* Edit Actions */}
              {isEditing && (
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleSaveProfile}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium text-sm sm:text-base"
                  >
                    <FaSave className="w-4 h-4" />
                    Save Changes
                  </button>
                  <button
                    onClick={handleCancelEdit}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm sm:text-base"
                  >
                    <FaTimes className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
          <div className="p-4 sm:p-6 md:p-8">
            <div className="flex items-center justify-between mb-4 sm:mb-6">
              <div className="flex items-center gap-3">
                <div className="bg-primary-100 p-2 sm:p-2.5 rounded-lg">
                  <FaLock className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-semibold text-gray-900">Change Password</h3>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">Update your account password</p>
                </div>
              </div>
              {!isChangingPassword && (
                <button
                  onClick={handleChangePassword}
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium text-sm sm:text-base flex items-center gap-2"
                >
                  <FaLock className="w-4 h-4" />
                  Change Password
                </button>
              )}
            </div>

            {isChangingPassword && (
              <div className="space-y-4 pt-4 border-t border-gray-200">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter current password"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Enter new password (min. 6 characters)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    placeholder="Confirm new password"
                  />
                </div>
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={handleSavePassword}
                    className="flex items-center gap-2 px-4 py-2.5 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors font-medium text-sm sm:text-base"
                  >
                    <FaSave className="w-4 h-4" />
                    Update Password
                  </button>
                  <button
                    onClick={handleCancelPasswordChange}
                    className="flex items-center gap-2 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium text-sm sm:text-base"
                  >
                    <FaTimes className="w-4 h-4" />
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Info Message */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-xs sm:text-sm text-blue-800">
            <strong>Note:</strong> Your role cannot be changed through this page. Contact your system administrator for role changes or other account modifications.
          </p>
        </div>
      </div>
    </div>
  )
}
