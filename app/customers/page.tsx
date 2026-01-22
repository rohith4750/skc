'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { Storage } from '@/lib/storage-api'
import { Customer } from '@/types'
import { FaPlus, FaEdit, FaTrash, FaSearch } from 'react-icons/fa'
import toast from 'react-hot-toast'
import Table from '@/components/Table'
import { getCustomerTableConfig } from '@/components/table-configs'
import ConfirmModal from '@/components/ConfirmModal'
import Link from 'next/link'

export default function CustomersPage() {
  const router = useRouter()
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  })

  useEffect(() => {
    loadCustomers()
  }, [])

  const loadCustomers = async () => {
    try {
      const data = await Storage.getCustomers()
      setCustomers(data)
    } catch (error) {
      console.error('Failed to load customers:', error)
      toast.error('Failed to load customers. Please try again.')
    }
  }

  const handleEdit = (customer: Customer) => {
    router.push(`/customers/create?id=${customer.id}`)
  }

  const handleDelete = (id: string) => {
    setDeleteConfirm({ isOpen: true, id })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return
    try {
      const response = await fetch(`/api/customers/${deleteConfirm.id}`, {
        method: 'DELETE',
      })
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.details || errorData.error || 'Failed to delete customer')
      }
      
      await loadCustomers()
      toast.success('Customer deleted successfully!')
      setDeleteConfirm({ isOpen: false, id: null })
    } catch (error: any) {
      console.error('Failed to delete customer:', error)
      toast.error(error.message || 'Failed to delete customer. Please try again.')
      setDeleteConfirm({ isOpen: false, id: null })
    }
  }


  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return customers
    const searchLower = searchTerm.toLowerCase().trim()
    return customers.filter(customer =>
      customer.name.toLowerCase().includes(searchLower) ||
      customer.phone.toLowerCase().includes(searchLower) ||
      customer.email.toLowerCase().includes(searchLower) ||
      customer.address.toLowerCase().includes(searchLower)
    )
  }, [customers, searchTerm])

  // Reset to page 1 when search term changes
  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const tableConfig = getCustomerTableConfig()

  return (
    <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Customers</h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Manage your customer database</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Link
            href="/customers/create"
            className="bg-primary-500 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-primary-600 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <FaPlus /> Add Customer
          </Link>
        </div>
      </div>

      {/* Search Input */}
      <div className="mb-4">
        <div className="relative">
          <FaSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search customers..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-sm sm:text-base"
          />
        </div>
      </div>

      <Table
        columns={tableConfig.columns}
        data={filteredCustomers}
        emptyMessage={searchTerm.trim() ? `No customers found matching "${searchTerm}"` : tableConfig.emptyMessage}
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        totalItems={filteredCustomers.length}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
        itemName={tableConfig.itemName}
        getItemId={tableConfig.getItemId}
        renderActions={(customer) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleEdit(customer)}
              className="text-primary-500 hover:text-primary-700 p-2 hover:bg-primary-50 rounded"
              title="Edit"
            >
              <FaEdit />
            </button>
            <button
              onClick={() => handleDelete(customer.id)}
              className="text-secondary-500 hover:text-secondary-700 p-2 hover:bg-secondary-50 rounded"
              title="Delete"
            >
              <FaTrash />
            </button>
          </div>
        )}
      />

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Customer"
        message="Are you sure you want to delete this customer? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: null })}
        variant="danger"
      />
    </div>
  )
}
