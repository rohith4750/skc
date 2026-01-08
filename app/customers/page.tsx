'use client'

import { useEffect, useState, useMemo } from 'react'
import { Storage } from '@/lib/storage-api'
import { formatDate, sendEmail, sendWhatsAppMessage, sendSMS } from '@/lib/utils'
import { Customer } from '@/types'
import { FaPlus, FaEdit, FaTrash, FaEnvelope, FaWhatsapp, FaSms, FaPaperPlane, FaSearch } from 'react-icons/fa'
import toast from 'react-hot-toast'
import Table from '@/components/Table'
import { getCustomerTableConfig } from '@/components/table-configs'
import ConfirmModal from '@/components/ConfirmModal'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([])
  const [customMessage, setCustomMessage] = useState('')
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  })
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    address: '',
    message: '',
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      // For new customers, don't include ID (database will generate it)
      // For editing, include the existing ID
      const customerData: any = {
        ...formData,
      }
      
      if (editingCustomer?.id) {
        customerData.id = editingCustomer.id
        customerData.createdAt = editingCustomer.createdAt
      }

      await Storage.saveCustomer(customerData)
      await loadCustomers()
      resetForm()
      toast.success(editingCustomer ? 'Customer updated successfully!' : 'Customer created successfully!')
    } catch (error) {
      console.error('Failed to save customer:', error)
      toast.error('Failed to save customer. Please try again.')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      phone: '',
      email: '',
      address: '',
      message: '',
    })
    setEditingCustomer(null)
    setShowModal(false)
  }

  const handleEdit = (customer: Customer) => {
    setEditingCustomer(customer)
    setFormData({
      name: customer.name,
      phone: customer.phone,
      email: customer.email,
      address: customer.address,
      message: customer.message || '',
    })
    setShowModal(true)
  }

  const handleDelete = (id: string) => {
    setDeleteConfirm({ isOpen: true, id })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return
    try {
      await Storage.deleteCustomer(deleteConfirm.id)
      await loadCustomers()
      toast.success('Customer deleted successfully!')
      setDeleteConfirm({ isOpen: false, id: null })
    } catch (error) {
      console.error('Failed to delete customer:', error)
      toast.error('Failed to delete customer. Please try again.')
      setDeleteConfirm({ isOpen: false, id: null })
    }
  }

  const handleSendMessage = (customer: Customer, type: 'email' | 'whatsapp' | 'sms') => {
    const greeting = customer.message || `Hello ${customer.name}, thank you for choosing our catering service!`
    
    try {
      if (type === 'email') {
        sendEmail(customer.email, 'Greeting from Catering Service', greeting)
        toast.success('Opening email client...')
      } else if (type === 'whatsapp') {
        sendWhatsAppMessage(customer.phone, greeting)
        toast.success('Opening WhatsApp Business...')
      } else {
        sendSMS(customer.phone, greeting)
        toast.success('Opening SMS...')
      }
    } catch (error) {
      console.error('Failed to send message:', error)
      toast.error('Failed to send message. Please try again.')
    }
  }

  const handleToggleCustomer = (customerId: string) => {
    setSelectedCustomers(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    )
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

  const handleSelectAll = () => {
    if (selectedCustomers.length === filteredCustomers.length) {
      setSelectedCustomers([])
    } else {
      setSelectedCustomers(filteredCustomers.map(c => c.id))
    }
  }

  const tableConfig = getCustomerTableConfig()

  const handleSendCustomMessage = () => {
    if (selectedCustomers.length === 0) {
      toast.error('Please select at least one customer')
      return
    }
    if (!customMessage.trim()) {
      toast.error('Please enter a message')
      return
    }

    // Send message to each selected customer
    selectedCustomers.forEach(customerId => {
      const customer = customers.find(c => c.id === customerId)
      if (customer) {
        // Personalize message with customer name
        const personalizedMessage = customMessage.replace(/\{name\}/g, customer.name)
        sendWhatsAppMessage(customer.phone, personalizedMessage)
      }
    })

    toast.success(`Opening WhatsApp for ${selectedCustomers.length} customer(s)...`)
    setShowMessageModal(false)
    setCustomMessage('')
    setSelectedCustomers([])
  }

  const insertTemplate = (template: string) => {
    setCustomMessage(template)
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Customers</h1>
          <p className="text-gray-600 mt-2">Manage your customer database</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => {
              setSelectedCustomers([])
              setCustomMessage('')
              setShowMessageModal(true)
            }}
            className="bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
          >
            <FaPaperPlane /> Send Custom Message
          </button>
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
          >
            <FaPlus /> Add Customer
          </button>
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
            placeholder="Search customers by name, phone, email, or address..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
        showCheckbox={tableConfig.showCheckbox}
        selectedItems={selectedCustomers}
        onSelectAll={handleSelectAll}
        onSelectItem={handleToggleCustomer}
        getItemId={tableConfig.getItemId}
        renderActions={(customer) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleSendMessage(customer, 'email')}
              className="text-blue-600 hover:text-blue-900 p-2 hover:bg-blue-50 rounded"
              title="Send Email"
            >
              <FaEnvelope />
            </button>
            <button
              onClick={() => handleSendMessage(customer, 'whatsapp')}
              className="text-green-600 hover:text-green-900 p-2 hover:bg-green-50 rounded"
              title="Send WhatsApp"
            >
              <FaWhatsapp />
            </button>
            <button
              onClick={() => handleSendMessage(customer, 'sms')}
              className="text-purple-600 hover:text-purple-900 p-2 hover:bg-purple-50 rounded"
              title="Send SMS"
            >
              <FaSms />
            </button>
            <button
              onClick={() => handleEdit(customer)}
              className="text-yellow-600 hover:text-yellow-900 p-2 hover:bg-yellow-50 rounded"
              title="Edit"
            >
              <FaEdit />
            </button>
            <button
              onClick={() => handleDelete(customer.id)}
              className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded"
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
                {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-6">
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Address *
                  </label>
                  <textarea
                    required
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows={3}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Greeting Message
                  </label>
                  <textarea
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={3}
                    placeholder="Custom greeting message for this customer..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingCustomer ? 'Update' : 'Create'} Customer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-800">Send Custom WhatsApp Message</h2>
              <p className="text-gray-600 mt-1">Select customers and compose your message (e.g., festival greetings)</p>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                {/* Customer Selection */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-3">
                    Select Customers ({selectedCustomers.length} selected)
                  </label>
                  <div className="border border-gray-300 rounded-lg p-4 max-h-48 overflow-y-auto">
                    {customers.length === 0 ? (
                      <p className="text-gray-500 text-center py-4">No customers available</p>
                    ) : (
                      <div className="space-y-2">
                        {customers.map((customer) => (
                          <label key={customer.id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded cursor-pointer">
                            <input
                              type="checkbox"
                              checked={selectedCustomers.includes(customer.id)}
                              onChange={() => handleToggleCustomer(customer.id)}
                              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                            />
                            <div>
                              <div className="text-sm font-medium text-gray-900">{customer.name}</div>
                              <div className="text-xs text-gray-500">{customer.phone}</div>
                            </div>
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Message Templates */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Quick Templates</label>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => insertTemplate('🎉 Happy {name}! Wishing you and your family a wonderful festival filled with joy and happiness. From Catering Service')}
                      className="px-3 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                    >
                      Festival Greeting
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTemplate('Hello {name}, Thank you for choosing our catering service. We appreciate your business!')}
                      className="px-3 py-1 text-xs bg-green-50 text-green-700 rounded hover:bg-green-100 transition-colors"
                    >
                      Thank You
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTemplate('Dear {name}, We have exciting new menu items available. Would you like to place an order?')}
                      className="px-3 py-1 text-xs bg-purple-50 text-purple-700 rounded hover:bg-purple-100 transition-colors"
                    >
                      Promotion
                    </button>
                  </div>
                </div>

                {/* Message Input */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Message <span className="text-gray-500">(Use {"{name}"} to personalize)</span>
                  </label>
                  <textarea
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    rows={6}
                    placeholder="Type your message here... Use {name} to automatically insert customer name"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 resize-none"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {customMessage.length} characters | {selectedCustomers.length} customer(s) selected
                  </p>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowMessageModal(false)
                    setCustomMessage('')
                    setSelectedCustomers([])
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSendCustomMessage}
                  disabled={selectedCustomers.length === 0 || !customMessage.trim()}
                  className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  <FaPaperPlane /> Send via WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
