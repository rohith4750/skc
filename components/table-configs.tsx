'use client'

import { ReactNode } from 'react'
import { Customer, Supervisor, MenuItem, Bill, Order } from '@/types'
import { formatDate, formatCurrency, formatDateTime } from '@/lib/utils'
import { FaEdit, FaTrash, FaEnvelope, FaWhatsapp, FaSms, FaCheck, FaPrint } from 'react-icons/fa'
import { TableColumn } from './Table'

export interface TableConfig<T> {
  columns: TableColumn<T>[]
  itemName: string
  emptyMessage: string
  showCheckbox?: boolean
  getItemId: (item: T) => string
}

// Customer Table Configuration Factory
export function getCustomerTableConfig(): TableConfig<Customer> {
  return {
    getItemId: (customer) => customer.id,
    itemName: 'customers',
    emptyMessage: 'No customers found. Add your first customer to get started.',
    showCheckbox: false,
    columns: [
      {
        key: 'name',
        header: 'Name',
        render: (customer) => <div className="text-sm font-medium text-gray-900">{customer.name}</div>,
      },
      {
        key: 'phone',
        header: 'Phone',
        render: (customer) => <div className="text-sm text-gray-900">{customer.phone}</div>,
      },
      {
        key: 'email',
        header: 'Email',
        render: (customer) => <div className="text-sm text-gray-900">{customer.email}</div>,
      },
      {
        key: 'address',
        header: 'Address',
        render: (customer) => <div className="text-sm text-gray-900">{customer.address}</div>,
        className: '',
      },
      {
        key: 'createdAt',
        header: 'Created',
        render: (customer) => <div className="text-sm text-gray-500">{formatDate(customer.createdAt)}</div>,
      },
    ],
  }
}

// Supervisor Table Configuration Factory
export function getSupervisorTableConfig(): TableConfig<Supervisor> {
  return {
    getItemId: (supervisor) => supervisor.id,
    itemName: 'supervisors',
    emptyMessage: 'No supervisors found. Add your first supervisor to get started.',
    columns: [
      {
        key: 'name',
        header: 'Name',
        render: (supervisor) => <div className="text-sm font-medium text-gray-900">{supervisor.name}</div>,
      },
      {
        key: 'email',
        header: 'Email',
        render: (supervisor) => <div className="text-sm text-gray-900">{supervisor.email}</div>,
      },
      {
        key: 'phone',
        header: 'Phone',
        render: (supervisor) => <div className="text-sm text-gray-900">{supervisor.phone}</div>,
      },
      {
        key: 'cateringServiceName',
        header: 'Catering Service',
        render: (supervisor) => <div className="text-sm text-gray-900">{supervisor.cateringServiceName}</div>,
      },
      {
        key: 'status',
        header: 'Status',
        render: (supervisor) => (
          <button
            onClick={(e) => {
              e.stopPropagation()
            }}
            className={`px-3 py-1 rounded-full text-xs font-medium ${supervisor.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
              }`}
          >
            {supervisor.isActive ? 'Active' : 'Inactive'}
          </button>
        ),
      },
    ],
  }
}

// Menu Item Table Configuration Factory
export function getMenuItemTableConfig(): TableConfig<MenuItem> {
  return {
    getItemId: (item) => item.id,
    itemName: 'menu items',
    emptyMessage: 'No menu items found. Add your first menu item to get started.',
    columns: [
      {
        key: 'name',
        header: 'Menu Name',
        render: (item) => <div className="text-sm font-medium text-gray-900">{item.name}</div>,
      },
      {
        key: 'type',
        header: 'Menu Type',
        render: (item) => <div className="text-sm text-gray-900">{item.type}</div>,
      },
      {
        key: 'description',
        header: 'Description',
        render: (item) => <div className="text-sm text-gray-900 max-w-md">{item.description || '-'}</div>,
        className: '',
      },
      {
        key: 'price',
        header: 'Price',
        render: (item) => <div className="text-sm text-gray-900">{item.price ? formatCurrency(item.price) : '-'}</div>,
      },
      {
        key: 'unit',
        header: 'Unit',
        render: (item) => <div className="text-sm text-gray-900">{item.unit || '-'}</div>,
      },
      {
        key: 'status',
        header: 'Status',
        render: (item) => (
          <button
            onClick={(e) => {
              e.stopPropagation()
            }}
            className={`px-3 py-1 rounded-full text-xs font-medium ${item.isActive
              ? 'bg-green-100 text-green-800'
              : 'bg-red-100 text-red-800'
              }`}
          >
            {item.isActive ? 'Active' : 'Inactive'}
          </button>
        ),
      },
    ],
  }
}

// Bill Table Configuration Factory
type BillWithOrder = Bill & { order?: Order & { customer?: Customer } }

export function getBillTableConfig(): TableConfig<BillWithOrder> {
  const getEventDate = (bill: BillWithOrder) => {
    const mealTypeAmounts = bill.order?.mealTypeAmounts as
      | Record<string, { date?: string } | number>
      | null
      | undefined
    if (!mealTypeAmounts) return null
    const firstDate = Object.values(mealTypeAmounts).find(
      (value) => typeof value === 'object' && value !== null && value.date
    ) as { date?: string } | undefined
    return firstDate?.date ? formatDate(firstDate.date) : null
  }

  const getServicesSummary = (bill: BillWithOrder) => {
    const services = bill.order?.services as string[] | undefined
    if (!services || services.length === 0) return 'No services'
    return services.map((service) => service.charAt(0).toUpperCase() + service.slice(1)).join(', ')
  }

  return {
    getItemId: (bill) => bill.id,
    itemName: 'bills',
    emptyMessage: 'No bills found. Bills are created automatically when orders are placed.',
    columns: [
      {
        key: 'id',
        header: 'Bill ID',
        render: (bill) => <div className="text-sm font-medium text-gray-900">#{bill.id.slice(0, 8).toUpperCase()}</div>,
      },
      {
        key: 'event',
        header: 'Event',
        render: (bill) => (
          <div>
            <div className="text-sm font-medium text-gray-900">
              {bill.order?.eventName || 'Event not set'}
            </div>
            <div className="text-xs text-gray-500">
              {getEventDate(bill) ? `Date: ${getEventDate(bill)}` : 'Date: Not specified'}
            </div>
          </div>
        ),
      },
      {
        key: 'customer',
        header: 'Customer',
        render: (bill) => (
          <>
            <div className="text-sm text-gray-900">{bill.order?.customer?.name || 'Unknown Customer'}</div>
            {bill.order?.customer?.phone && (
              <div className="text-sm text-gray-500">{bill.order.customer.phone}</div>
            )}
          </>
        ),
      },
      {
        key: 'createdAt',
        header: 'Event Date',
        render: (bill) => {
          const eventDate = getEventDate(bill)
          return <div className="text-sm text-gray-900">{eventDate || formatDateTime(bill.createdAt)}</div>
        },
      },
      {
        key: 'details',
        header: 'Details',
        render: (bill) => (
          <div className="text-xs text-gray-600 space-y-1">
            <div>Members: {bill.order?.numberOfMembers || 'N/A'}</div>
            <div>Services: {getServicesSummary(bill)}</div>
          </div>
        ),
      },
      {
        key: 'totalAmount',
        header: 'Total Amount',
        render: (bill) => <div className="text-sm font-medium text-gray-900">{formatCurrency(bill.totalAmount)}</div>,
      },
      {
        key: 'advancePaid',
        header: 'Advance Paid',
        render: (bill) => <div className="text-sm text-green-600">{formatCurrency(bill.advancePaid)}</div>,
      },
      {
        key: 'paidAmount',
        header: 'Paid Amount',
        render: (bill) => <div className="text-sm text-blue-600">{formatCurrency(bill.paidAmount)}</div>,
      },
      {
        key: 'remainingAmount',
        header: 'Remaining',
        render: (bill) => <div className="text-sm font-medium text-red-600">{formatCurrency(bill.remainingAmount)}</div>,
      },
      {
        key: 'progress',
        header: 'Progress',
        render: (bill) => {
          const total = bill.totalAmount || 0
          const paid = bill.paidAmount || 0
          const percentage = total > 0 ? Math.min(100, (paid / total) * 100) : 0
          return (
            <div className="min-w-[120px]">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                <span>{percentage.toFixed(0)}%</span>
                <span>{formatCurrency(paid)}</span>
              </div>
              <div className="h-2 w-full rounded-full bg-gray-100">
                <div
                  className="h-2 rounded-full bg-primary-500 transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          )
        },
      },
      {
        key: 'status',
        header: 'Status',
        render: (bill) => (
          <span className={`px-3 py-1 rounded-full text-xs font-medium ${bill.status === 'paid' ? 'bg-green-100 text-green-800' :
            bill.status === 'partial' ? 'bg-yellow-100 text-yellow-800' :
              'bg-red-100 text-red-800'
            }`}>
            {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
          </span>
        ),
      },
    ],
  }
}
