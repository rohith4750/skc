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
      <div className={`bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden ${className}`}>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead className="bg-slate-50/50 border-b border-slate-100">
              <tr>
                {showCheckbox && (
                  <th className="px-3 lg:px-6 py-3 lg:py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {onSelectAll && (
                      <input
                        type="checkbox"
                        checked={selectedItems.length === data.length && data.length > 0}
                        onChange={onSelectAll}
                        className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                      />
                    )}
                  </th>
                )}
                {columns.map((column) => (
                  <th
                    key={column.key}
                    className={`px-3 lg:px-6 py-3 lg:py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest ${column.headerClassName || ''}`}
                  >
                    {column.header}
                  </th>
                ))}
                {renderActions && (
                  <th className="px-3 lg:px-6 py-3 lg:py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan={colSpan} className="px-4 lg:px-6 py-6 lg:py-8 text-center text-gray-500">
                    {emptyMessage}
                  </td>
                </tr>
              ) : renderRow ? (
                paginatedData.map((row, index) => (
                  <tr key={getItemId ? getItemId(row) : index} className="hover:bg-slate-50/50 transition-colors">
                    {renderRow(row, columns)}
                  </tr>
                ))
              ) : (
                paginatedData.map((row, index) => {
                  const itemId = getItemId ? getItemId(row) : index.toString()
                  return (
                    <tr key={itemId} className="hover:bg-slate-50/50 transition-colors">
                      {showCheckbox && (
                        <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                          {onSelectItem && (
                            <input
                              type="checkbox"
                              checked={selectedItems.includes(itemId)}
                              onChange={() => onSelectItem(itemId)}
                              className="w-4 h-4 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
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
                            className={`px-3 lg:px-6 py-3 lg:py-4 ${column.className || ''}`}
                          >
                            {typeof content === 'string' || typeof content === 'number' ? (
                              <div className="text-sm font-medium text-slate-600">{content}</div>
                            ) : (
                              content
                            )}
                          </td>
                        )
                      })}
                      {renderActions && (
                        <td className="px-3 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-sm font-medium">
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
      </div>

      {/* Pagination Controls */}
      {(showPagination || onItemsPerPageChange) && (
        <div className="mt-6 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 bg-white px-6 py-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
            <div className="text-xs sm:text-sm font-medium text-slate-500 whitespace-nowrap">
              Showing <span className="text-slate-900 font-bold">{startIndex + 1}</span> to <span className="text-slate-900 font-bold">{Math.min(endIndex, totalItemsCount)}</span> of <span className="text-slate-900 font-bold">{totalItemsCount}</span> {itemName}
            </div>
            {onItemsPerPageChange && (
              <div className="flex items-center gap-2">
                <label htmlFor="itemsPerPage" className="text-xs sm:text-sm font-medium text-slate-500 whitespace-nowrap">
                  Show:
                </label>
                <select
                  id="itemsPerPage"
                  value={effectiveItemsPerPage >= totalItemsCount ? 'all' : itemsPerPage}
                  onChange={handleItemsPerPageChange}
                  className="px-3 py-1.5 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-700 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-slate-50/50 outline-none transition-all"
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
            <div className="flex items-center justify-center gap-1 sm:gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className={`p-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${currentPage === 1
                    ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-90 shadow-sm'
                  }`}
              >
                <FaChevronLeft className="w-3 h-3" />
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
                        className={`w-8 h-8 sm:w-10 sm:h-10 flex items-center justify-center rounded-xl text-xs sm:text-sm font-bold transition-all ${currentPage === page
                            ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200 scale-110'
                            : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-90 shadow-sm'
                          }`}
                      >
                        {page}
                      </button>
                    )
                  } else if (page === currentPage - 2 || page === currentPage + 2) {
                    return <span key={page} className="w-8 flex items-center justify-center text-slate-300 font-bold">...</span>
                  }
                  return null
                })}
              </div>
              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className={`p-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${currentPage === totalPages
                    ? 'bg-slate-50 text-slate-300 cursor-not-allowed'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 active:scale-90 shadow-sm'
                  }`}
              >
                <FaChevronRight className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      )}
    </>
  )
}
