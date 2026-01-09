'use client'

import { useEffect, useState } from 'react'
import { FaPlus, FaEdit, FaTrash, FaUtensils, FaUserTie, FaTruck } from 'react-icons/fa'
import toast from 'react-hot-toast'
import Table from '@/components/Table'
import ConfirmModal from '@/components/ConfirmModal'

interface Workforce {
  id: string
  name: string
  role: string
  isActive: boolean
  createdAt: string
  updatedAt: string
}

const roleIcons: Record<string, any> = {
  chef: FaUtensils,
  supervisor: FaUserTie,
  transport: FaTruck,
}

const roleColors: Record<string, string> = {
  chef: 'bg-orange-100 text-orange-800',
  supervisor: 'bg-green-100 text-green-800',
  transport: 'bg-yellow-100 text-yellow-800',
}

export default function WorkforcePage() {
  const [workforce, setWorkforce] = useState<Workforce[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingMember, setEditingMember] = useState<Workforce | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  })
  const [formData, setFormData] = useState({
    name: '',
    role: 'chef',
    isActive: true,
  })

  useEffect(() => {
    loadWorkforce()
  }, [])

  const loadWorkforce = async () => {
    try {
      const response = await fetch('/api/workforce')
      if (!response.ok) throw new Error('Failed to fetch workforce')
      const data = await response.json()
      setWorkforce(data)
    } catch (error: any) {
      console.error('Failed to load workforce:', error)
      toast.error('Failed to load workforce. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = () => {
    setEditingMember(null)
    setFormData({
      name: '',
      role: 'chef',
      isActive: true,
    })
    setShowModal(true)
  }

  const handleEdit = (member: Workforce) => {
    setEditingMember(member)
    setFormData({
      name: member.name,
      role: member.role,
      isActive: member.isActive,
    })
    setShowModal(true)
  }

  const handleDelete = (id: string) => {
    setDeleteConfirm({ isOpen: true, id })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return

    try {
      const response = await fetch(`/api/workforce/${deleteConfirm.id}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete workforce member')
      }

      await loadWorkforce()
      toast.success('Workforce member deleted successfully!')
      setDeleteConfirm({ isOpen: false, id: null })
    } catch (error: any) {
      console.error('Failed to delete workforce member:', error)
      toast.error(error.message || 'Failed to delete workforce member. Please try again.')
      setDeleteConfirm({ isOpen: false, id: null })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const url = editingMember ? `/api/workforce/${editingMember.id}` : '/api/workforce'
      const method = editingMember ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to save workforce member')
      }

      await loadWorkforce()
      setShowModal(false)
      toast.success(`Workforce member ${editingMember ? 'updated' : 'created'} successfully!`)
    } catch (error: any) {
      console.error('Failed to save workforce member:', error)
      toast.error(error.message || 'Failed to save workforce member. Please try again.')
    }
  }

  const columns = [
    {
      key: 'name',
      header: 'Name',
      render: (member: Workforce) => (
        <div className="flex items-center gap-2">
          {roleIcons[member.role] && (
            <span className={`px-2 py-1 rounded-full text-xs ${roleColors[member.role]}`}>
              {(() => {
                const Icon = roleIcons[member.role]
                return <Icon className="w-4 h-4" />
              })()}
            </span>
          )}
          <span className="font-medium">{member.name}</span>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (member: Workforce) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${roleColors[member.role] || 'bg-gray-100 text-gray-800'}`}>
          {member.role.toUpperCase()}
        </span>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (member: Workforce) => (
        <span className={`px-2 py-1 rounded-full text-xs font-medium ${member.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {member.isActive ? 'Active' : 'Inactive'}
        </span>
      ),
    },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          <p className="mt-4 text-gray-600">Loading workforce...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Workforce Management</h1>
          <p className="text-gray-600 mt-2">Manage chefs, supervisors, and transport staff</p>
        </div>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 bg-primary-500 text-white px-4 py-2 rounded-lg hover:bg-primary-600 transition-colors"
        >
          <FaPlus /> Add Member
        </button>
      </div>

      <Table
        columns={columns}
        data={workforce}
        emptyMessage="No workforce members found. Add your first member."
        getItemId={(member) => member.id}
        renderActions={(member) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleEdit(member)}
              className="text-primary-600 hover:text-primary-700 p-2 hover:bg-primary-50 rounded"
              title="Edit"
            >
              <FaEdit />
            </button>
            <button
              onClick={() => handleDelete(member.id)}
              className="text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded"
              title="Delete"
            >
              <FaTrash />
            </button>
          </div>
        )}
      />

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">
                {editingMember ? 'Edit Workforce Member' : 'Add Workforce Member'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  required
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
                  <option value="chef">Chef</option>
                  <option value="supervisor">Supervisor</option>
                  <option value="transport">Transport</option>
                </select>
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
                  {editingMember ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Workforce Member"
        message="Are you sure you want to delete this workforce member? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        variant="danger"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: null })}
      />
    </div>
  )
}
