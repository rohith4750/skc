'use client'

import { ReactNode } from 'react'
import { FaChevronLeft, FaChevronRight } from 'react-icons/fa'

export interface TableColumn<T> {
  key: string
  header: string | ReactNode
  accessor?: (row: T) => any
  render?: (row: T) => ReactNode
  className?: string
  headerClassName?: string
}

interface TableProps<T> {
  columns: TableColumn<T>[]
  data: T[]
  emptyMessage?: string
  emptyMessageColSpan?: number
  itemsPerPage?: number
  currentPage?: number
  totalItems?: number
  onPageChange?: (page: number) => void
  onItemsPerPageChange?: (itemsPerPage: number) => void
  itemName?: string // e.g., "customers", "orders" - used in pagination text
  showCheckbox?: boolean
  selectedItems?: string[]
  onSelectAll?: () => void
  onSelectItem?: (id: string) => void
  getItemId?: (item: T) => string
  renderActions?: (row: T) => ReactNode
  renderRow?: (row: T, columns: TableColumn<T>[]) => ReactNode // For completely custom rows
  className?: string
  itemsPerPageOptions?: number[] // Options for items per page dropdown (e.g., [5, 10, 25, 50, 100])
}

export default function Table<T>({
  columns,
  data,
  emptyMessage = 'No data found.',
  emptyMessageColSpan,
  itemsPerPage = 5,
  currentPage = 1,
  totalItems,
  onPageChange,
  onItemsPerPageChange,
  itemName = 'items',
  showCheckbox = false,
  selectedItems = [],
  onSelectAll,
  onSelectItem,
  getItemId,
  renderActions,
  renderRow,
  className = '',
  itemsPerPageOptions = [5, 10, 25, 40, 50, 100],
}: TableProps<T>) {
  const totalItemsCount = totalItems ?? data.length
  // Calculate effective items per page (handle "all" case)
  const effectiveItemsPerPage = itemsPerPage >= totalItemsCount && totalItemsCount > 0 ? totalItemsCount : itemsPerPage
  const totalPages = effectiveItemsPerPage > 0 ? Math.ceil(totalItemsCount / effectiveItemsPerPage) : 1
  const startIndex = (currentPage - 1) * effectiveItemsPerPage
  const endIndex = startIndex + effectiveItemsPerPage
  // If totalItems is provided and equals data.length, we're doing client-side pagination (slice the data)
  // If totalItems is not provided, assume server-side pagination (use data as-is)
  const paginatedData = (totalItems !== undefined && totalItems === data.length) 
    ? data.slice(startIndex, endIndex) 
    : data
  const showPagination = totalItemsCount > effectiveItemsPerPage && onPageChange

  const colSpan = emptyMessageColSpan ?? (columns.length + (showCheckbox ? 1 : 0) + (renderActions ? 1 : 0))

  const handlePageChange = (page: number) => {
    if (onPageChange) {
      onPageChange(page)
    }
  }

  const handleItemsPerPageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value
    if (value === 'all') {
      // When "all" is selected, set itemsPerPage to totalItemsCount
      if (onItemsPerPageChange) {
        onItemsPerPageChange(totalItemsCount)
      }
    } else {
      const newItemsPerPage = parseInt(value, 10)
      if (onItemsPerPageChange) {
        onItemsPerPageChange(newItemsPerPage)
      }
    }
    // Reset to page 1 when changing items per page
    if (onPageChange) {
      onPageChange(1)
    }
  }

  return (
    <>
      <div className={`bg-white rounded-lg shadow-md overflow-hidden ${className}`}>
        <table className="w-full">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              {showCheckbox && (
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {onSelectAll && (
                    <input
                      type="checkbox"
                      checked={selectedItems.length === data.length && data.length > 0}
                      onChange={onSelectAll}
                      className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                  )}
                </th>
              )}
              {columns.map((column) => (
                <th
                  key={column.key}
                  className={`px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider ${column.headerClassName || ''}`}
                >
                  {column.header}
                </th>
              ))}
              {renderActions && (
                <th className="px-6 py-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              )}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {paginatedData.length === 0 ? (
              <tr>
                <td colSpan={colSpan} className="px-6 py-8 text-center text-gray-500">
                  {emptyMessage}
                </td>
              </tr>
            ) : renderRow ? (
              paginatedData.map((row, index) => (
                <tr key={getItemId ? getItemId(row) : index} className="hover:bg-gray-50">
                  {renderRow(row, columns)}
                </tr>
              ))
            ) : (
              paginatedData.map((row, index) => {
                const itemId = getItemId ? getItemId(row) : index.toString()
                return (
                  <tr key={itemId} className="hover:bg-gray-50">
                    {showCheckbox && (
                      <td className="px-6 py-4 whitespace-nowrap">
                        {onSelectItem && (
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(itemId)}
                            onChange={() => onSelectItem(itemId)}
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                          />
                        )}
                      </td>
                    )}
                    {columns.map((column) => {
                      const content = column.render
                        ? column.render(row)
                        : column.accessor
                        ? column.accessor(row)
                        : (row as any)[column.key]

                      return (
                        <td
                          key={column.key}
                          className={`px-6 py-4 ${column.className || ''}`}
                        >
                          {typeof content === 'string' || typeof content === 'number' ? (
                            <div className="text-sm text-gray-900">{content}</div>
                          ) : (
                            content
                          )}
                        </td>
                      )
                    })}
                    {renderActions && (
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        {renderActions(row)}
                      </td>
                    )}
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls */}
      {(showPagination || onItemsPerPageChange) && (
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 bg-white px-4 py-3 rounded-lg shadow-md">
          <div className="flex items-center gap-4">
            <div className="text-sm text-gray-700">
              Showing {startIndex + 1} to {Math.min(endIndex, totalItemsCount)} of {totalItemsCount} {itemName}
            </div>
            {onItemsPerPageChange && (
              <div className="flex items-center gap-2">
                <label htmlFor="itemsPerPage" className="text-sm text-gray-700">
                  Show:
                </label>
                <select
                  id="itemsPerPage"
                  value={effectiveItemsPerPage >= totalItemsCount ? 'all' : itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
                >
                  {itemsPerPageOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                  <option value="all">All</option>
                </select>
              </div>
            )}
          </div>
          {showPagination && (
            <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <FaChevronLeft />
            </button>
            <div className="flex gap-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => {
                if (
                  page === 1 ||
                  page === totalPages ||
                  (page >= currentPage - 1 && page <= currentPage + 1)
                ) {
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                      }`}
                    >
                      {page}
                    </button>
                  )
                } else if (page === currentPage - 2 || page === currentPage + 2) {
                  return <span key={page} className="px-2 text-gray-400">...</span>
                }
                return null
              })}
            </div>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              <FaChevronRight />
            </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
