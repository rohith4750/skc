"use client";
import { FaArrowLeft } from 'react-icons/fa'
import Link from 'next/link'
import CustomerForm from '@/components/customers/CustomerForm'

export default function CreateCustomerPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="mb-6">
        <Link
          href="/customers"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
        >
          <FaArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Customers</span>
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">
          Add New Customer
        </h1>
        <p className="text-gray-600 mt-1">
          Add a new customer to the system
        </p>
      </div>

      <CustomerForm />
    </div>
  )
}
