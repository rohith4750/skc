import {
  FaArrowDown,
  FaArrowUp,
  FaBox,
  FaCalculator,
  FaChartLine,
  FaExclamationTriangle,
  FaFileInvoiceDollar,
  FaMoneyBillWave,
  FaPercent,
  FaShoppingCart,
  FaUserShield,
  FaUsers,
  FaUserTie,
  FaUtensils,
  FaWarehouse,
  FaWallet,
} from 'react-icons/fa'
import { formatCurrency } from '@/lib/utils'

export interface DashboardStats {
  customers: number
  menuItems: number
  orders: number
  bills: number
  expenses: number
  users: number
  workforce: number
  stockItems: number
  lowStockItems: number
  inventoryItems: number
  totalCollected: number
  totalExpenses: number
  totalBilled: number
  totalReceivable: number
  avgOrderValue: number
  profitMargin: number
  collectionRate: number
  pendingOrders: number
  completedOrders: number
  paidBills: number
  pendingBills: number
  pendingExpenses: number
  outstandingExpenses: number
}

export const DASHBOARD_MONTH_OPTIONS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]

export const DASHBOARD_YEAR_OPTIONS = [2024, 2025, 2026]

export const DASHBOARD_ADMIN_LANDING_CARDS = [
  {
    title: 'Customers',
    description: 'Add new customer',
    icon: FaUsers,
    color: 'bg-blue-500 hover:bg-blue-600',
    href: '/customers/create',
  },
  {
    title: 'Create Order',
    description: 'Create new orders',
    icon: FaShoppingCart,
    color: 'bg-green-500 hover:bg-green-600',
    href: '/orders',
  },
  {
    title: 'Orders History',
    description: 'View all orders',
    icon: FaShoppingCart,
    color: 'bg-purple-500 hover:bg-purple-600',
    href: '/orders/history',
  },
  {
    title: 'Bills',
    description: 'Manage bills and invoices',
    icon: FaFileInvoiceDollar,
    color: 'bg-orange-500 hover:bg-orange-600',
    href: '/bills',
  },
  {
    title: 'Menu',
    description: 'Manage menu items',
    icon: FaUtensils,
    color: 'bg-red-500 hover:bg-red-600',
    href: '/menu',
  },
]

export const DASHBOARD_QUICK_ACTIONS = [
  { label: 'Customers', href: '/customers', icon: FaUsers, className: 'p-4 bg-primary-50/50 rounded-2xl hover:bg-primary-50 transition-all text-center border border-transparent hover:border-primary-100 group', iconClassName: 'w-6 h-6 text-primary-600 mx-auto mb-2 group-hover:scale-110 transition-transform' },
  { label: 'New Order', href: '/orders', icon: FaShoppingCart, className: 'p-4 bg-accent-50/50 rounded-2xl hover:bg-accent-50 transition-all text-center border border-transparent hover:border-accent-100 group', iconClassName: 'w-6 h-6 text-accent-600 mx-auto mb-2 group-hover:scale-110 transition-transform' },
  { label: 'Orders', href: '/orders/history', icon: FaFileInvoiceDollar, className: 'p-4 bg-blue-50/50 rounded-2xl hover:bg-blue-50 transition-all text-center border border-transparent hover:border-blue-100 group', iconClassName: 'w-6 h-6 text-blue-600 mx-auto mb-2 group-hover:scale-110 transition-transform' },
  { label: 'Bills', href: '/bills', icon: FaFileInvoiceDollar, className: 'p-4 bg-green-50/50 rounded-2xl hover:bg-green-50 transition-all text-center border border-transparent hover:border-green-100 group', iconClassName: 'w-6 h-6 text-green-600 mx-auto mb-2 group-hover:scale-110 transition-transform' },
  { label: 'Expenses', href: '/expenses', icon: FaMoneyBillWave, className: 'p-4 bg-red-50/50 rounded-2xl hover:bg-red-50 transition-all text-center border border-transparent hover:border-red-100 group', iconClassName: 'w-6 h-6 text-red-600 mx-auto mb-2 group-hover:scale-110 transition-transform' },
]

export const DASHBOARD_SUPER_ADMIN_QUICK_ACTIONS = [
  { label: 'Users', href: '/users', icon: FaUserShield, className: 'p-4 bg-purple-50/50 rounded-2xl hover:bg-purple-50 transition-all text-center border border-transparent hover:border-purple-100 group', iconClassName: 'w-6 h-6 text-purple-600 mx-auto mb-2 group-hover:scale-110 transition-transform' },
  { label: 'Workforce', href: '/workforce', icon: FaUserTie, className: 'p-4 bg-blue-50/50 rounded-2xl hover:bg-blue-50 transition-all text-center border border-transparent hover:border-blue-100 group', iconClassName: 'w-6 h-6 text-blue-600 mx-auto mb-2 group-hover:scale-110 transition-transform' },
  { label: 'Stock', href: '/stock', icon: FaBox, className: 'p-4 bg-yellow-50/50 rounded-2xl hover:bg-yellow-50 transition-all text-center border border-transparent hover:border-yellow-100 group', iconClassName: 'w-6 h-6 text-yellow-600 mx-auto mb-2 group-hover:scale-110 transition-transform' },
  { label: 'Inventory', href: '/inventory', icon: FaWarehouse, className: 'p-4 bg-gray-50/50 rounded-2xl hover:bg-gray-50 transition-all text-center border border-transparent hover:border-gray-200 group', iconClassName: 'w-6 h-6 text-gray-600 mx-auto mb-2 group-hover:scale-110 transition-transform' },
  { label: 'Analytics', href: '/analytics', icon: FaChartLine, className: 'p-4 bg-blue-50/50 rounded-2xl hover:bg-blue-50 transition-all text-center border border-transparent hover:border-blue-100 group', iconClassName: 'w-6 h-6 text-blue-600 mx-auto mb-2 group-hover:scale-110 transition-transform' },
]

export const getDashboardMainStatCards = (stats: DashboardStats) => [
  {
    title: 'Total Customers',
    value: stats.customers,
    icon: FaUsers,
    color: 'text-primary-600',
    bgColor: 'bg-primary-50',
    href: '/customers',
  },
  {
    title: 'Total Billed (Gross)',
    value: formatCurrency(stats.totalBilled),
    icon: FaFileInvoiceDollar,
    color: 'text-primary-600',
    bgColor: 'bg-primary-50',
    href: '/bills',
    subValue: `Collected: ${formatCurrency(stats.totalCollected)}`,
  },
  {
    title: 'Total Collected',
    value: formatCurrency(stats.totalCollected),
    icon: FaArrowUp,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    href: '/bills',
    subValue: `Collected: ${formatCurrency(stats.totalCollected)}`,
  },
  {
    title: 'Net Profit',
    value: formatCurrency(stats.totalBilled - stats.totalExpenses),
    icon: FaChartLine,
    color: stats.totalBilled - stats.totalExpenses >= 0 ? 'text-green-600' : 'text-red-600',
    bgColor: stats.totalBilled - stats.totalExpenses >= 0 ? 'bg-green-50' : 'bg-red-50',
    href: '/analytics',
    subValue: `${stats.profitMargin.toFixed(1)}% margin`,
  },
  {
    title: 'Total Expenses',
    value: formatCurrency(stats.totalExpenses),
    icon: FaMoneyBillWave,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    href: '/expenses',
    subValue: `${stats.pendingExpenses} pending`,
  },
]

export const getDashboardAdminStatCards = (stats: DashboardStats, isSuperAdminUser: boolean) => {
  if (!isSuperAdminUser) return []

  return [
    {
      title: 'Menu Items',
      value: stats.menuItems,
      icon: FaUtensils,
      color: 'text-primary-600',
      bgColor: 'bg-primary-50',
      href: '/menu',
    },
    {
      title: 'Users',
      value: stats.users,
      icon: FaUserShield,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      href: '/users',
    },
    {
      title: 'Workforce',
      value: stats.workforce,
      icon: FaUserTie,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      href: '/workforce',
    },
    {
      title: 'Stock',
      value: stats.stockItems,
      icon: FaBox,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
      href: '/stock',
      subValue: `${stats.lowStockItems} low stock`,
    },
    {
      title: 'Inventory',
      value: stats.inventoryItems,
      icon: FaWarehouse,
      color: 'text-gray-600',
      bgColor: 'bg-gray-100',
      href: '/inventory',
    },
  ]
}

export const getDashboardAnalyticsCards = (stats: DashboardStats) => [
  {
    title: 'Order Status',
    icon: FaChartLine,
    items: [
      { label: 'Completed', value: stats.completedOrders, color: 'text-green-600' },
      { label: 'Pending', value: stats.pendingOrders, color: 'text-yellow-600' },
      { label: 'Total', value: stats.orders, color: 'text-gray-600' },
    ],
  },
  {
    title: 'Payment Status',
    icon: FaFileInvoiceDollar,
    items: [
      { label: 'Paid Bills', value: stats.paidBills, color: 'text-green-600' },
      { label: 'Pending Bills', value: stats.pendingBills, color: 'text-red-600' },
      { label: 'Total Bills', value: stats.bills, color: 'text-gray-600' },
    ],
  },
  {
    title: 'Financial Summary (Gross)',
    icon: FaMoneyBillWave,
    items: [
      { label: 'Gross Revenue', value: formatCurrency(stats.totalBilled), color: 'text-green-600', icon: FaArrowUp },
      { label: 'Total Expenses', value: formatCurrency(stats.totalExpenses), color: 'text-red-600', icon: FaArrowDown },
      { label: 'Total Collected', value: formatCurrency(stats.totalCollected), color: 'text-green-600', icon: FaArrowUp },
      {
        label: 'Net Profit (Gross)',
        value: formatCurrency(stats.totalBilled - stats.totalExpenses),
        color: stats.totalBilled - stats.totalExpenses >= 0 ? 'text-green-600' : 'text-red-600',
      },
    ],
  },
]

export const getDashboardSuperAdminHighlights = (stats: DashboardStats, isSuperAdminUser: boolean) => {
  if (!isSuperAdminUser) return []

  return [
    {
      title: 'Outstanding Receivables',
      value: formatCurrency(stats.totalReceivable),
      icon: FaWallet,
      color: 'text-orange-600',
      note: `${stats.pendingBills} pending bills`,
    },
    {
      title: 'Collection Rate',
      value: `${stats.collectionRate.toFixed(1)}%`,
      icon: FaPercent,
      color: stats.collectionRate >= 80 ? 'text-green-600' : 'text-yellow-600',
      note: 'Paid vs billed',
    },
    {
      title: 'Profit Margin',
      value: `${stats.profitMargin.toFixed(1)}%`,
      icon: FaChartLine,
      color: stats.profitMargin >= 0 ? 'text-green-600' : 'text-red-600',
      note: 'Net profit ratio',
    },
    {
      title: 'Average Order Value',
      value: formatCurrency(stats.avgOrderValue),
      icon: FaCalculator,
      color: 'text-blue-600',
      note: 'Revenue per order',
    },
  ]
}

export const getDashboardSuperAdminAlerts = (stats: DashboardStats, isSuperAdminUser: boolean) => {
  if (!isSuperAdminUser) return []

  return [
    { label: 'Pending Orders', value: stats.pendingOrders, color: 'text-yellow-600' },
    { label: 'Pending Bills', value: stats.pendingBills, color: 'text-red-600' },
    { label: 'Unpaid Expenses', value: stats.pendingExpenses, color: 'text-orange-600' },
    {
      label: 'Outstanding Expenses',
      value: formatCurrency(stats.outstandingExpenses),
      color: 'text-orange-700',
    },
  ]
}

export const DASHBOARD_OPERATIONAL_ALERT_ICON = FaExclamationTriangle
