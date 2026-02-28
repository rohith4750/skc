"use client";
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
    <div className="p-4 sm:p-6 md:p-8 bg-slate-50/50 min-h-screen pt-16 lg:pt-8">
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Customer Directory</h1>
          <p className="text-slate-500 mt-1">Manage and track your business relationships</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <Link
            href="/customers/create"
            className="flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 active:scale-95 transition-all shadow-lg text-sm font-bold"
          >
            <FaPlus className="w-4 h-4" />
            <span>Add New Customer</span>
          </Link>
        </div>
      </div>

      {/* Search Input */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="relative group">
          <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 transition-colors group-focus-within:text-indigo-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by name, phone, email or address..."
            className="w-full pl-12 pr-6 py-4 bg-white border border-slate-200 rounded-2xl text-slate-700 font-medium placeholder:text-slate-400 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm group-hover:shadow-md"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto">

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
            <div className="flex items-center gap-1 justify-end">
              <button
                onClick={() => handleEdit(customer)}
                className="p-2.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all active:scale-90"
                title="Edit"
              >
                <FaEdit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(customer.id)}
                className="p-2.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-90"
                title="Delete"
              >
                <FaTrash className="w-4 h-4" />
              </button>
            </div>
          )}
        />
      </div>

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
