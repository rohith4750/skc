'use client'

import { useEffect, useState } from 'react'
import { Storage } from '@/lib/storage-api'
import { Supervisor } from '@/types'
import { FaPlus, FaEdit, FaTrash } from 'react-icons/fa'
import Table from '@/components/Table'
import { getSupervisorTableConfig } from '@/components/table-configs'
import ConfirmModal from '@/components/ConfirmModal'
import toast from 'react-hot-toast'
import FormError from '@/components/FormError'

export default function SupervisorsPage() {
  const [supervisors, setSupervisors] = useState<Supervisor[]>([])
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [editingSupervisor, setEditingSupervisor] = useState<Supervisor | null>(null)
  const [formError, setFormError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  })
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    cateringServiceName: '',
    isActive: true,
  })

  useEffect(() => {
    loadSupervisors()
  }, [])

  const loadSupervisors = async () => {
    try {
      const data = await Storage.getSupervisors()
      setSupervisors(data)
    } catch (error) {
      console.error('Failed to load supervisors:', error)
      toast.error('Failed to load supervisors. Please try again.')
    }
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    setFormError('')
    
    try {
      // For new supervisors, don't include ID (database will generate it)
      // For editing, include the existing ID
      const supervisor: any = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        cateringServiceName: formData.cateringServiceName,
        isActive: formData.isActive,
      }
      
      if (editingSupervisor?.id) {
        supervisor.id = editingSupervisor.id
      }

      await Storage.saveSupervisor(supervisor)
      await loadSupervisors()
      resetForm()
      toast.success(editingSupervisor ? 'Supervisor updated successfully!' : 'Supervisor created successfully!')
    } catch (error) {
      console.error('Failed to save supervisor:', error)
      const message = 'Failed to save supervisor. Please try again.'
      toast.error(message)
      setFormError(message)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      cateringServiceName: '',
      isActive: true,
    })
    setEditingSupervisor(null)
    setShowModal(false)
    setFormError('')
  }

  const handleEdit = (supervisor: Supervisor) => {
    setEditingSupervisor(supervisor)
    setFormData({
      name: supervisor.name,
      email: supervisor.email,
      phone: supervisor.phone,
      cateringServiceName: supervisor.cateringServiceName,
      isActive: supervisor.isActive,
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
      await Storage.deleteSupervisor(deleteConfirm.id)
      await loadSupervisors()
      toast.success('Supervisor deleted successfully!')
      setDeleteConfirm({ isOpen: false, id: null })
    } catch (error) {
      console.error('Failed to delete supervisor:', error)
      toast.error('Failed to delete supervisor. Please try again.')
      setDeleteConfirm({ isOpen: false, id: null })
    }
  }

  const toggleActive = async (supervisor: Supervisor) => {
    try {
      const updatedSupervisor = { ...supervisor, isActive: !supervisor.isActive }
      await Storage.saveSupervisor(updatedSupervisor)
      await loadSupervisors()
      toast.success(`Supervisor ${!supervisor.isActive ? 'activated' : 'deactivated'} successfully!`)
    } catch (error) {
      console.error('Failed to update supervisor:', error)
      toast.error('Failed to update supervisor. Please try again.')
    }
  }

  const tableConfig = getSupervisorTableConfig()
  
  // Update status column to use toggleActive handler
  const statusColumnIndex = tableConfig.columns.findIndex(col => col.key === 'status')
  if (statusColumnIndex !== -1) {
    tableConfig.columns[statusColumnIndex] = {
      ...tableConfig.columns[statusColumnIndex],
      render: (supervisor) => (
        <button
          onClick={() => toggleActive(supervisor)}
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            supervisor.isActive 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}
        >
          {supervisor.isActive ? 'Active' : 'Inactive'}
        </button>
      ),
    }
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Supervisors</h1>
          <p className="text-gray-600 mt-2">Manage catering service supervisors</p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setShowModal(true)
          }}
          className="bg-primary-500 text-white px-6 py-3 rounded-lg hover:bg-primary-600 transition-colors flex items-center gap-2"
        >
          <FaPlus /> Add Supervisor
        </button>
      </div>

      <Table
        columns={tableConfig.columns}
        data={supervisors}
        emptyMessage={tableConfig.emptyMessage}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        totalItems={supervisors.length}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
        itemName={tableConfig.itemName}
        getItemId={tableConfig.getItemId}
        renderActions={(supervisor) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleEdit(supervisor)}
              className="text-primary-500 hover:text-primary-700 p-2 hover:bg-primary-50 rounded"
              title="Edit"
            >
              <FaEdit />
            </button>
            <button
              onClick={() => handleDelete(supervisor.id)}
              className="text-secondary-500 hover:text-secondary-700 p-2 hover:bg-secondary-50 rounded"
              title="Delete"
            >
              <FaTrash />
            </button>
          </div>
        )}
      />

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">
                {editingSupervisor ? 'Edit Supervisor' : 'Add New Supervisor'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
              <FormError message={formError} className="mb-4" />
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Phone *
                  </label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Catering Service Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.cateringServiceName}
                    onChange={(e) => setFormData({ ...formData, cateringServiceName: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
                  />
                  <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
                    Active
                  </label>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors"
                >
                  {editingSupervisor ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Supervisor"
        message="Are you sure you want to delete this supervisor? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: null })}
        variant="danger"
      />
    </div>
  )
}
