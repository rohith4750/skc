'use client'

import { useEffect, useState, useMemo } from 'react'
import { Storage } from '@/lib/storage-api'
import { initializeMenuItems } from '@/lib/initMenu'
import { MenuItem } from '@/types'
import { FaPlus, FaEdit, FaTrash, FaDownload, FaPrint } from 'react-icons/fa'
import toast from 'react-hot-toast'
import Table from '@/components/Table'
import { getMenuItemTableConfig } from '@/components/table-configs'
import ConfirmModal from '@/components/ConfirmModal'
import { isNonEmptyString } from '@/lib/validation'
import FormError from '@/components/FormError'

export default function MenuPage() {
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [selectedSubFilter, setSelectedSubFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null)
  const [formError, setFormError] = useState('')
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  })
  const [initializeConfirm, setInitializeConfirm] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    type: [] as string[],
    description: '',
    price: '',
    unit: '',
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
    const categoryItems = menuItems.filter(item => {
      const itemTypes = (item.type || []).map(t => t.toLowerCase())
      if (selectedFilter.toLowerCase() === 'snacks') {
        return itemTypes.includes('snacks') || itemTypes.includes('sweets')
      }
      return itemTypes.includes(selectedFilter.toLowerCase())
    })
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
      filtered = filtered.filter(item => {
        const itemTypes = (item.type || []).map(t => t.toLowerCase())
        if (selectedFilter.toLowerCase() === 'snacks') {
          return itemTypes.includes('snacks') || itemTypes.includes('sweets')
        }
        return itemTypes.includes(selectedFilter.toLowerCase())
      })
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
          className={`px-3 py-1 rounded-full text-xs font-medium ${item.isActive
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
    setFormError('')

    try {
      if (!isNonEmptyString(formData.name) || formData.type.length === 0) {
        toast.error('Please enter name and select at least one type')
        setFormError('Please enter name and select at least one type')
        return
      }

      // For new menu items, don't include ID (database will generate it)
      // For editing, include the existing ID
      const menuItem: any = {
        name: formData.name,
        type: formData.type,
        description: formData.description,
        price: formData.price ? parseFloat(formData.price) : null,
        unit: formData.unit,
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
      const message = 'Failed to save menu item. Please try again.'
      toast.error(message)
      setFormError(message)
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      type: [],
      description: '',
      price: '',
      unit: '',
      isActive: true,
    })
    setEditingItem(null)
    setShowModal(false)
    setFormError('')
  }

  const handleEdit = (item: MenuItem) => {
    setEditingItem(item)
    setFormData({
      name: item.name,
      type: Array.isArray(item.type) ? item.type : [item.type],
      description: item.description || '',
      price: item.price ? item.price.toString() : '',
      unit: item.unit || '',
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

  const handlePrintMenu = () => {
    // Group menu items by type
    const breakfastItems = menuItems.filter(item => item.type.includes('breakfast') && item.isActive)
    const lunchItems = menuItems.filter(item => item.type.includes('lunch') && item.isActive)
    const dinnerItems = menuItems.filter(item => item.type.includes('dinner') && item.isActive)
    const snacksItems = menuItems.filter(item => (item.type.includes('snacks') || item.type.includes('sweets')) && item.isActive)

    // Group items by subcategory within each meal type
    const groupBySubcategory = (items: MenuItem[]) => {
      const grouped: Record<string, MenuItem[]> = {}
      items.forEach(item => {
        const subcategory = extractSubcategory(item.description) || 'Other'
        if (!grouped[subcategory]) {
          grouped[subcategory] = []
        }
        grouped[subcategory].push(item)
      })
      return grouped
    }

    const breakfastGrouped = groupBySubcategory(breakfastItems)
    const lunchGrouped = groupBySubcategory(lunchItems)
    const dinnerGrouped = groupBySubcategory(dinnerItems)
    const snacksGrouped = groupBySubcategory(snacksItems)

    // Create a new window for printing
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Please allow popups to print the menu')
      return
    }

    // Generate HTML for printing
    const renderCategory = (title: string, grouped: Record<string, MenuItem[]>) => {
      if (Object.keys(grouped).length === 0) return ''

      return `
        <div class="category">
          <h2 class="category-title">${title}</h2>
          <div class="items-grid">
            ${Object.entries(grouped).map(([subcategory, items]) => `
              <div class="subcategory">
                <h3 class="subcategory-title">${subcategory}</h3>
                <div class="items-list">
                  ${items.map(item => `
                    <div class="item">• ${item.name}${item.nameTelugu ? ` (${item.nameTelugu})` : ''}</div>
                  `).join('')}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      `
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>SKC Caterers - Complete Menu</title>
          <meta charset="utf-8">
          <style>
            @page {
              size: A4;
              margin: 10mm;
            }
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              font-family: Arial, sans-serif;
              font-size: 7px;
              line-height: 1.2;
              color: #000;
              background: white;
            }
            .container {
              width: 100%;
              height: 100%;
              padding: 8px;
            }
            .header {
              text-align: center;
              margin-bottom: 6px;
              border-bottom: 2px solid #d97706;
              padding-bottom: 4px;
            }
            .header h1 {
              font-size: 14px;
              color: #c2410c;
              margin-bottom: 2px;
            }
            .header p {
              font-size: 7px;
              color: #666;
            }
            .menu-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 6px;
            }
            .category {
              border: 1px solid #ddd;
              padding: 4px;
              background: #fafafa;
            }
            .category-title {
              font-size: 9px;
              font-weight: bold;
              color: #c2410c;
              margin-bottom: 3px;
              text-transform: uppercase;
              border-bottom: 1px solid #d97706;
              padding-bottom: 2px;
            }
            .items-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 3px;
            }
            .subcategory {
              margin-bottom: 2px;
            }
            .subcategory-title {
              font-size: 7px;
              font-weight: bold;
              color: #047857;
              margin-bottom: 1px;
            }
            .items-list {
              font-size: 6px;
              line-height: 1.3;
            }
            .item {
              margin-bottom: 1px;
              padding-left: 2px;
            }
            .footer {
              margin-top: 6px;
              text-align: center;
              font-size: 6px;
              color: #666;
              border-top: 1px solid #ddd;
              padding-top: 3px;
            }
            @media print {
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>SRIVATSASA & KOWNDINYA CATERERS</h1>
              <p>Pure Vegetarian • Complete Menu • Est. 1989</p>
              <p>📞 9866525102, 9963691393, 9390015302 • 📧 pujyasri1989cya@gmail.com</p>
            </div>
            
            <div class="menu-grid">
              ${renderCategory('BREAKFAST', breakfastGrouped)}
              ${renderCategory('LUNCH', lunchGrouped)}
              ${renderCategory('DINNER', dinnerGrouped)}
              ${renderCategory('SNACKS', snacksGrouped)}
            </div>
            
            <div class="footer">
              <p>Vanathalipuram, Hyderabad - 500070 • www.skccaterers.in</p>
              <p>Serving quality vegetarian food since 1989</p>
            </div>
          </div>
        </body>
      </html>
    `)

    printWindow.document.close()

    // Wait for content to load, then print
    setTimeout(() => {
      printWindow.print()
    }, 250)
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
            onClick={handlePrintMenu}
            className="bg-purple-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base"
          >
            <FaPrint /> <span className="hidden sm:inline">Print Menu</span><span className="sm:hidden">Print</span>
          </button>
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
            className={`px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${selectedFilter === 'all'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            All
          </button>
          <button
            onClick={() => handleMainCategoryChange('breakfast')}
            className={`px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${selectedFilter === 'breakfast'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            Breakfast
          </button>
          <button
            onClick={() => handleMainCategoryChange('lunch')}
            className={`px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${selectedFilter === 'lunch'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            Lunch
          </button>
          <button
            onClick={() => handleMainCategoryChange('dinner')}
            className={`px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${selectedFilter === 'dinner'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            Dinner
          </button>
          <button
            onClick={() => handleMainCategoryChange('snacks')}
            className={`px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${selectedFilter === 'snacks'
              ? 'bg-primary-500 text-white'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            Snacks
          </button>
          <button
            onClick={() => handleMainCategoryChange('sweets')}
            className={`px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${selectedFilter === 'sweets'
              ? 'bg-primary-500 text-white'
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
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedSubFilter === 'all'
                ? 'bg-primary-500 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              All {selectedFilter}
            </button>
            {availableSubcategories.map((subcategory) => (
              <button
                key={subcategory}
                onClick={() => setSelectedSubFilter(subcategory)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${selectedSubFilter === subcategory
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
              <FormError message={formError} className="mb-4" />
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Menu Types *
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    {[
                      { id: 'breakfast', label: 'Breakfast' },
                      { id: 'lunch', label: 'Lunch' },
                      { id: 'dinner', label: 'Dinner' },
                      { id: 'snacks', label: 'Snacks' },
                      { id: 'sweets', label: 'Sweets' },
                      { id: 'saree', label: 'Saree' },
                      { id: 'water_bottles', label: 'Water Bottles' }
                    ].map(type => (
                      <label key={type.id} className="flex items-center group cursor-pointer">
                        <div className="relative flex items-center">
                          <input
                            type="checkbox"
                            checked={formData.type.includes(type.id)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const newTypes = checked
                                ? [...formData.type, type.id]
                                : formData.type.filter(t => t !== type.id);
                              setFormData({ ...formData, type: newTypes });
                            }}
                            className="peer h-5 w-5 cursor-pointer appearance-none rounded-md border border-slate-300 transition-all checked:bg-indigo-600 checked:border-indigo-600"
                          />
                          <svg className="absolute h-3.5 w-3.5 opacity-0 peer-checked:opacity-100 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white pointer-events-none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
                        </div>
                        <span className="ml-2 text-sm text-slate-600 group-hover:text-indigo-600 transition-colors">{type.label}</span>
                      </label>
                    ))}
                  </div>
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
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (Optional)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Unit (Optional)
                    </label>
                    <input
                      type="text"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                      className="w-full px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                      placeholder="e.g. bottle, plate"
                    />
                  </div>
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
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
                  className="px-4 sm:px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 transition-colors text-sm sm:text-base"
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
