import {
  FaChartLine,
  FaDollarSign,
  FaShoppingCart,
  FaStar,
  FaUsers,
} from 'react-icons/fa'

export const ANALYTICS_PAGE_HEADER = {
  title: 'Business Analytics & Reports',
  description: 'Comprehensive overview of your business performance',
}

export const ANALYTICS_DATE_FILTER_OPTIONS = [
  { key: 'all', label: 'All Time' },
  { key: 'month', label: 'Month' },
  { key: 'year', label: 'Year' },
] as const

export const ANALYTICS_TABS = [
  { id: 'overview', label: 'Overview', icon: FaChartLine },
  { id: 'financial', label: 'Financial', icon: FaDollarSign },
  { id: 'operations', label: 'Operations', icon: FaShoppingCart },
  { id: 'customers', label: 'Customers', icon: FaUsers },
  { id: 'predictive', label: 'Predictive Analysis', icon: FaStar },
] as const
