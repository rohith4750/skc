"use client";
import { FaArrowLeft } from 'react-icons/fa'
import Link from 'next/link'
import CustomerForm from '@/components/customers/CustomerForm'

export default function CreateCustomerPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 min-h-screen bg-gray-50">
      {/* Header */}
      <div className="mb-6">
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
