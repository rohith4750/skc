'use client'

import { useEffect, useState } from 'react'
import { formatDateTime } from '@/lib/utils'
import { FaPlus, FaEdit, FaTrash, FaUserShield, FaUtensils, FaUserTie, FaTruck, FaUser, FaHistory } from 'react-icons/fa'
import toast from 'react-hot-toast'
import Table from '@/components/Table'
import ConfirmModal from '@/components/ConfirmModal'
import RoleGuard from '@/components/RoleGuard'
import { isSuperAdmin } from '@/lib/auth'
import FormError from '@/components/FormError'
import Link from 'next/link'

interface User {
  id: string
  username: string
  email: string
  role: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const roleIcons: Record<string, any> = {
  super_admin: FaUserShield,
  admin: FaUserShield,
  chef: FaUtensils,
  supervisor: FaUserTie,
  transport: FaTruck,
}

const roleColors: Record<string, string> = {
  super_admin: 'bg-purple-100 text-purple-800',
  admin: 'bg-blue-100 text-blue-800',
  chef: 'bg-orange-100 text-orange-800',
  supervisor: 'bg-green-100 text-green-800',
  transport: 'bg-yellow-100 text-yellow-800',
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  })
  const [formError, setFormError] = useState('')
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'admin',
    isActive: true,
  })

  useEffect(() => {
    loadUsers()
  }, [])

  const loadUsers = async () => {
    try {
      const response = await fetch('/api/users')
      if (!response.ok) throw new Error('Failed to fetch users')
      const data = await response.json()
      setUsers(data)
    } catch (error: any) {
      console.error('Failed to load users:', error)
      toast.error('Failed to load users. Please try again.')
    } finally {
      setLoading(false)
    }
  }


  const handleCreate = () => {
    setEditingUser(null)
    setFormData({
      username: '',
      email: '',
      password: '',
      role: 'admin',
      isActive: true,
    })
    setFormError('')
    setShowModal(true)
  }

  const handleEdit = (user: User) => {
    setEditingUser(user)
    setFormData({
      username: user.username,
      email: user.email,
      password: '', // Don't pre-fill password
      role: user.role,
      isActive: user.isActive,
    })
    setFormError('')
    setShowModal(true)
  }

  const handleDelete = (id: string) => {
    setDeleteConfirm({ isOpen: true, id })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return

    try {
      const response = await fetch(`/api/users/${deleteConfirm.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete user')
      }

      await loadUsers()
      toast.success('User deleted successfully!')
      setDeleteConfirm({ isOpen: false, id: null })
    } catch (error: any) {
      console.error('Failed to delete user:', error)
      toast.error(error.message || 'Failed to delete user. Please try again.')
      setDeleteConfirm({ isOpen: false, id: null })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')

    try {
      const url = editingUser ? `/api/users/${editingUser.id}` : '/api/users'
      const method = editingUser ? 'PUT' : 'POST'

      // If editing and password is empty, don't send it
      const submitData: any = { ...formData }
      if (editingUser && !submitData.password) {
        delete submitData.password
      }

      // If creating, password is required
      if (!editingUser && !submitData.password) {
        toast.error('Password is required for new users')
        setFormError('Password is required for new users')
        return
      }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submitData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save user')
      }

      await loadUsers()
      setShowModal(false)
      toast.success(`User ${editingUser ? 'updated' : 'created'} successfully!`)
    } catch (error: any) {
      console.error('Failed to save user:', error)
      const message = error.message || 'Failed to save user. Please try again.'
      toast.error(message)
      setFormError(message)
    }
  }

  const columns = [
    {
      key: 'username',
      header: 'Username',
      render: (user: User) => (
        <div className="flex items-center gap-2">
          {roleIcons[user.role] && (
            <span className={roleColors[user.role]}>
              {(() => {
                const Icon = roleIcons[user.role]
                return <Icon className="w-4 h-4" />
              })()}
            </span>
          )}
          <span className="font-medium">{user.username}</span>
        </div>
      ),
    },
    {
      key: 'email',
      header: 'Email',
      render: (user: User) => <span className="text-gray-700">{user.email}</span>,
    },
    {
      key: 'role',
      header: 'Role',
      render: (user: User) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[user.role] || 'bg-gray-100 text-gray-800'}`}>
          {user.role.replace('_', ' ').toUpperCase()}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (user: User) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {user.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (user: User) => <span className="text-gray-600 text-sm">{formatDateTime(user.createdAt)}</span>,
    },
  ]

  return (
    <RoleGuard requiredRole="super_admin">
      <div className="p-6 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">User Management</h1>
            <p className="text-gray-600 mt-2">Manage internal users (chef, supervisor, transport, admin)</p>
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
          >
            <FaPlus /> Create User
          </button>
        </div>

        <Table
          columns={columns}
          data={users}
          emptyMessage="No users found. Create your first user."
          getItemId={(user) => user.id}
          renderActions={(user) => (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleEdit(user)}
                className="text-primary-600 hover:text-primary-700 p-2 hover:bg-primary-50 rounded"
                title="Edit User"
              >
                <FaEdit />
              </button>
              {user.role !== 'super_admin' && (
                <button
                  onClick={() => handleDelete(user.id)}
                  className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded"
                  title="Delete User"
                >
                  <FaTrash />
                </button>
              )}
            </div>
          )}
        />

        {/* Link to Audit Logs */}
        <div className="mt-6">
          <Link
            href="/audit-logs"
            className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-medium rounded-lg hover:from-indigo-600 hover:to-purple-600 transition-all shadow-md"
          >
            <FaHistory className="w-4 h-4" />
            View Login Audit Logs
          </Link>
        </div>

        {/* Create/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <h2 className="text-xl font-bold text-gray-800">
                  {editingUser ? 'Edit User' : 'Create User'}
                </h2>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <FormError message={formError} />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Password {editingUser ? '(leave empty to keep current)' : '*'}
                  </label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required={!editingUser}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Role *
                  </label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    required
                  >
                    <option value="admin">Admin</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Note: Chef, Supervisor, and Transport roles are managed in Workforce Management</p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                    Active
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                  >
                    {editingUser ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={deleteConfirm.isOpen}
          title="Delete User"
          message="Are you sure you want to delete this user? This action cannot be undone."
          confirmText="Delete"
          cancelText="Cancel"
          variant="danger"
          onConfirm={confirmDelete}
          onCancel={() => setDeleteConfirm({ isOpen: false, id: null })}
        />
      </div>
    </RoleGuard>
  )
}
