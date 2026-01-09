'use client'

import { useEffect, useState, useMemo } from 'react'
import { Storage } from '@/lib/storage-api'
import { initializeMenuItems } from '@/lib/initMenu'
import { MenuItem } from '@/types'
import { FaPlus, FaEdit, FaTrash, FaDownload } from 'react-icons/fa'
import toast from 'react-hot-toast'
import Table from '@/components/Table'
import { getMenuItemTableConfig } from '@/components/table-configs'
import ConfirmModal from '@/components/ConfirmModal'

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [selectedSubFilter, setSelectedSubFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  })
  const [initializeConfirm, setInitializeConfirm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    description: '',
    isActive: true,
  })

  // Extract subcategory from description (e.g., "FRY (Any One)" -> "FRY")
  const extractSubcategory = (description: string | undefined): string => {
    if (!description) return ''
    // Extract text before "(" - this is the subcategory
    const match = description.match(/^([^(]+)/)
    return match ? match[1].trim() : description.trim()
  }

  // Get unique subcategories for the selected main category
  const availableSubcategories = useMemo(() => {
    if (selectedFilter === 'all') return []
    const categoryItems = menuItems.filter(item => item.type.toLowerCase() === selectedFilter.toLowerCase())
    const subcategories = categoryItems
      .map(item => extractSubcategory(item.description))
      .filter(sub => sub !== '')
    // Remove duplicates and sort
    return Array.from(new Set(subcategories)).sort()
  }, [menuItems, selectedFilter])

  // Filter menu items based on selected category and subcategory
  const filteredMenuItems = useMemo(() => {
    let filtered = menuItems

    // Filter by main category
    if (selectedFilter !== 'all') {
      filtered = filtered.filter(item => item.type.toLowerCase() === selectedFilter.toLowerCase())
    }

    // Filter by subcategory if selected
    if (selectedSubFilter !== 'all' && selectedFilter !== 'all') {
      filtered = filtered.filter(item => {
        const subcategory = extractSubcategory(item.description)
        return subcategory.toLowerCase() === selectedSubFilter.toLowerCase()
      })
    }

    return filtered
  }, [menuItems, selectedFilter, selectedSubFilter])

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedFilter, selectedSubFilter])

  const tableConfig = getMenuItemTableConfig()
  
  // Update status column to use toggleActive handler
  const statusColumnIndex = tableConfig.columns.findIndex((col) => col.key === 'status')
  if (statusColumnIndex !== -1) {
    tableConfig.columns[statusColumnIndex] = {
      ...tableConfig.columns[statusColumnIndex],
      render: (item) => (
        <button
          onClick={() => toggleActive(item)}
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            item.isActive 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}
        >
          {item.isActive ? 'Active' : 'Inactive'}
        </button>
      ),
    }
  }

  // Reset subcategory filter when main category changes
  const handleMainCategoryChange = (category: string) => {
    setSelectedFilter(category)
    setSelectedSubFilter('all') // Reset subcategory when main category changes
  }

  useEffect(() => {
    loadMenuItems()
  }, [])

  const loadMenuItems = async () => {
    try {
      const data = await Storage.getMenuItems()
      setMenuItems(data)
    } catch (error) {
      console.error('Failed to load menu items:', error)
      toast.error('Failed to load menu items. Please try again.')
    }
  }

  const handleSubmit = async (e: any) => {
    e.preventDefault()
    
    try {
      // For new menu items, don't include ID (database will generate it)
      // For editing, include the existing ID
      const menuItem: any = {
        name: formData.name,
        type: formData.type,
        description: formData.description,
        isActive: formData.isActive,
      }
      
      if (editingItem?.id) {
        menuItem.id = editingItem.id
      }

      await Storage.saveMenuItem(menuItem)
      await loadMenuItems()
      resetForm()
      toast.success(editingItem ? 'Menu item updated successfully!' : 'Menu item created successfully!')
    } catch (error) {
      console.error('Failed to save menu item:', error)
      toast.error('Failed to save menu item. Please try again.')
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: '',
      description: '',
      isActive: true,
    })
    setEditingItem(null)
    setShowModal(false)
  }

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      type: item.type,
      description: item.description || '',
      isActive: item.isActive,
    })
    setShowModal(true)
  }

  const handleDelete = (id: string) => {
    setDeleteConfirm({ isOpen: true, id })
  }

  const confirmDelete = async () => {
    if (!deleteConfirm.id) return
    try {
      await Storage.deleteMenuItem(deleteConfirm.id)
      await loadMenuItems()
      toast.success('Menu item deleted successfully!')
      setDeleteConfirm({ isOpen: false, id: null })
    } catch (error) {
      console.error('Failed to delete menu item:', error)
      toast.error('Failed to delete menu item. Please try again.')
      setDeleteConfirm({ isOpen: false, id: null })
    }
  }

  const toggleActive = async (item: MenuItem) => {
    try {
      const updatedItem = { ...item, isActive: !item.isActive }
      await Storage.saveMenuItem(updatedItem)
      await loadMenuItems()
      toast.success(`Menu item ${!item.isActive ? 'activated' : 'deactivated'} successfully!`)
    } catch (error) {
      console.error('Failed to update menu item:', error)
      toast.error('Failed to update menu item. Please try again.')
    }
  }

  const handleInitialize = () => {
    setInitializeConfirm(true)
  }

  const confirmInitialize = async () => {
    try {
      const initialized = await initializeMenuItems()
      if (initialized) {
        toast.success('Menu items initialized successfully!')
      } else {
        toast.error('Menu items already exist. To re-initialize, please clear existing items first.')
      }
      await loadMenuItems()
      setInitializeConfirm(false)
    } catch (error) {
      console.error('Failed to initialize menu items:', error)
      toast.error('Failed to initialize menu items. Please try again.')
      setInitializeConfirm(false)
    }
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6 sm:mb-8">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-800">Menu Management</h1>
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">Manage your catering menu items</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            onClick={handleInitialize}
            className="bg-green-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <FaDownload /> <span className="hidden sm:inline">Load Predefined Menu</span><span className="sm:hidden">Load Menu</span>
          </button>
          <button
            onClick={() => {
              resetForm()
              setShowModal(true)
            }}
            className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <FaPlus /> Add Menu Item
          </button>
        </div>
      </div>

      {/* Main Category Filter Buttons */}
      <div className="mb-4">
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <button
            onClick={() => handleMainCategoryChange('all')}
            className={`px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${
              selectedFilter === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            All
          </button>
          <button
            onClick={() => handleMainCategoryChange('breakfast')}
            className={`px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${
              selectedFilter === 'breakfast'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Breakfast
          </button>
          <button
            onClick={() => handleMainCategoryChange('lunch')}
            className={`px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${
              selectedFilter === 'lunch'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Lunch
          </button>
          <button
            onClick={() => handleMainCategoryChange('dinner')}
            className={`px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${
              selectedFilter === 'dinner'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Dinner
          </button>
          <button
            onClick={() => handleMainCategoryChange('snacks')}
            className={`px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${
              selectedFilter === 'snacks'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Snacks
          </button>
          <button
            onClick={() => handleMainCategoryChange('sweets')}
            className={`px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${
              selectedFilter === 'sweets'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            Sweets
          </button>
        </div>
      </div>

      {/* Subcategory Filter Buttons - Show only when main category is selected */}
      {selectedFilter !== 'all' && availableSubcategories.length > 0 && (
        <div className="mb-6">
          <div className="mb-2">
            <span className="text-sm font-medium text-gray-700">
              {selectedFilter.charAt(0).toUpperCase() + selectedFilter.slice(1)} Categories:
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedSubFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedSubFilter === 'all'
                  ? 'bg-green-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All {selectedFilter}
            </button>
            {availableSubcategories.map((subcategory) => (
              <button
                key={subcategory}
                onClick={() => setSelectedSubFilter(subcategory)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedSubFilter === subcategory
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {subcategory}
              </button>
            ))}
          </div>
        </div>
      )}

      <Table
        columns={tableConfig.columns}
        data={filteredMenuItems}
        emptyMessage={
          menuItems.length === 0 
            ? tableConfig.emptyMessage
            : selectedSubFilter !== 'all'
            ? `No menu items found in "${selectedFilter}" - "${selectedSubFilter}" category.`
            : `No menu items found in "${selectedFilter}" category.`
        }
        itemsPerPage={itemsPerPage}
        currentPage={currentPage}
        totalItems={filteredMenuItems.length}
        onPageChange={setCurrentPage}
        onItemsPerPageChange={setItemsPerPage}
        itemName={tableConfig.itemName}
        getItemId={tableConfig.getItemId}
        renderActions={(item) => (
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleEdit(item)}
              className="text-yellow-600 hover:text-yellow-900 p-2 hover:bg-yellow-50 rounded"
              title="Edit"
            >
              <FaEdit />
            </button>
            <button
              onClick={() => handleDelete(item.id)}
              className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded"
              title="Delete"
            >
              <FaTrash />
            </button>
          </div>
        )}
      />

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6 border-b border-gray-200">
              <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
                {editingItem ? 'Edit Menu Item' : 'Add New Menu Item'}
              </h2>
            </div>
            <form onSubmit={handleSubmit} className="p-4 sm:p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Menu Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    placeholder="e.g., Biryani, Pulao, Dessert"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Menu Type *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    placeholder="e.g., Main Course, Dessert, Beverages, Starter"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={4}
                    className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    placeholder="Enter menu item description..."
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm font-medium text-gray-700">
                    Active
                  </label>
                </div>
              </div>
              <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={resetForm}
                  className="px-4 sm:px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 sm:px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base"
                >
                  {editingItem ? 'Update' : 'Create'} Menu Item
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Menu Item"
        message="Are you sure you want to delete this menu item? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirm({ isOpen: false, id: null })}
        variant="danger"
      />

      <ConfirmModal
        isOpen={initializeConfirm}
        title="Initialize Menu Items"
        message="This will add all predefined menu items to your menu. Continue?"
        confirmText="Initialize"
        cancelText="Cancel"
        onConfirm={confirmInitialize}
        onCancel={() => setInitializeConfirm(false)}
        variant="info"
      />
    </div>
  )
}
