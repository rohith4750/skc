"use client";
import { useEffect, useState, useMemo } from 'react'
import { Storage } from '@/lib/storage-api'
import { initializeMenuItems } from '@/lib/initMenu'
import { MenuItem, StallTemplate } from '@/types'
import { FaPlus, FaEdit, FaTrash, FaDownload, FaPrint, FaStore, FaUtensils, FaSearch, FaTimes } from 'react-icons/fa'
import { toast } from 'sonner'
import Table from '@/components/Table'
import { getMenuItemTableConfig } from '@/components/table-configs'
import ConfirmModal from '@/components/ConfirmModal'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import StallManagement from '../../components/menu/StallManagement'

export default function MenuPage() {
  const router = useRouter()
  const [view, setView] = useState<'items' | 'stalls'>('items')
  const [menuItems, setMenuItems] = useState<MenuItem[]>([])
  const [stallTemplates, setStallTemplates] = useState<StallTemplate[]>([])
  const [selectedFilter, setSelectedFilter] = useState<string>('all')
  const [selectedSubFilter, setSelectedSubFilter] = useState<string>('all')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
    isOpen: false,
    id: null,
  })
  const [initializeConfirm, setInitializeConfirm] = useState(false)

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

    // Filter by search term
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase()
      filtered = filtered.filter(item => 
        item.name.toLowerCase().includes(search) ||
        (item.nameTelugu && item.nameTelugu.toLowerCase().includes(search)) ||
        (item.description && item.description.toLowerCase().includes(search))
      )
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(item => 
        statusFilter === 'active' ? item.isActive : !item.isActive
      )
    }

    return filtered
  }, [menuItems, selectedFilter, selectedSubFilter, searchTerm, statusFilter])

  // Reset to page 1 when filter changes
  useEffect(() => {
    setCurrentPage(1)
  }, [selectedFilter, selectedSubFilter, searchTerm, statusFilter])

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
    loadStallTemplates()
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

  const loadStallTemplates = async () => {
    try {
      const data = await Storage.getStallTemplates()
      setStallTemplates(data || [])
    } catch (error) {
      console.error('Failed to load stall templates:', error)
    }
  }

  const handleEdit = (item: MenuItem) => {
    router.push(`/menu/edit/${item.id}`)
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
          <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
            {view === 'items' ? 'Manage your catering menu items' : 'Manage your pre-defined stall packages'}
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex bg-gray-100 p-1 rounded-xl items-center border border-gray-200">
          <button
            onClick={() => setView('items')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              view === 'items' 
              ? 'bg-white text-primary-600 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FaUtensils className="w-4 h-4" />
            <span>Menu Items</span>
          </button>
          <button
            onClick={() => setView('stalls')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              view === 'stalls' 
              ? 'bg-white text-primary-600 shadow-sm' 
              : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            <FaStore className="w-4 h-4" />
            <span>Stall Templates</span>
          </button>
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
          <Link
            href="/menu/create"
            className="bg-blue-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm sm:text-base font-medium"
          >
            <FaPlus /> Add Menu Item
          </Link>
        </div>
      </div>

      {/* Conditional Rendering based on View */}
      {view === 'stalls' ? (
        <StallManagement 
          stallTemplates={stallTemplates} 
          menuItems={menuItems} 
          onRefresh={loadStallTemplates} 
        />
      ) : (
        <>
          {/* Search and Status Filters */}
          <div className="mb-6 flex flex-col md:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-gray-100 shadow-sm">
            <div className="relative w-full md:w-96">
              <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name, telugu, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-10 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all text-sm font-medium"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                >
                  <FaTimes className="w-3 h-3" />
                </button>
              )}
            </div>

            <div className="flex bg-gray-100 p-1 rounded-xl items-center border border-gray-200 w-full md:w-auto">
              <button
                onClick={() => setStatusFilter('all')}
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === 'all' 
                  ? 'bg-white text-primary-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                All Status
              </button>
              <button
                onClick={() => setStatusFilter('active')}
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === 'active' 
                  ? 'bg-white text-green-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Active Only
              </button>
              <button
                onClick={() => setStatusFilter('inactive')}
                className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                  statusFilter === 'inactive' 
                  ? 'bg-white text-red-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                Inactive Only
              </button>
            </div>
          </div>

          {/* Main Category Filter Buttons */}
          <div className="mb-4">
            <div className="flex flex-wrap gap-2 sm:gap-3">
              <button
                onClick={() => handleMainCategoryChange('all')}
                className={`px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${selectedFilter === 'all'
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-200'
                  }`}
              >
                All Categories
              </button>
              <button
                onClick={() => handleMainCategoryChange('breakfast')}
                className={`px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${selectedFilter === 'breakfast'
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-200'
                  }`}
              >
                Breakfast
              </button>
              <button
                onClick={() => handleMainCategoryChange('lunch')}
                className={`px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${selectedFilter === 'lunch'
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-200'
                  }`}
              >
                Lunch
              </button>
              <button
                onClick={() => handleMainCategoryChange('dinner')}
                className={`px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${selectedFilter === 'dinner'
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-200'
                  }`}
              >
                Dinner
              </button>
              <button
                onClick={() => handleMainCategoryChange('snacks')}
                className={`px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${selectedFilter === 'snacks'
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-200'
                  }`}
              >
                Snacks
              </button>
              <button
                onClick={() => handleMainCategoryChange('sweets')}
                className={`px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${selectedFilter === 'sweets'
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-200'
                  }`}
              >
                Sweets
              </button>
              <button
                onClick={() => handleMainCategoryChange('saree')}
                className={`px-4 sm:px-6 py-2 rounded-lg text-sm sm:text-base font-medium transition-colors ${selectedFilter === 'saree'
                    ? 'bg-primary-500 text-white shadow-md'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 border border-gray-200'
                  }`}
              >
                Saree
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
            hideActionsOnPrint={true}
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
        </>
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

