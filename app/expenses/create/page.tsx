"use client";
import ExpenseForm from '@/components/expenses/ExpenseForm'
import { FaArrowLeft } from 'react-icons/fa'
import Link from 'next/link'

export default function CreateExpensePage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Create New Expense</h1>
          <p className="text-gray-600 mt-1">Add a new expense to your records</p>
        </div>
        <ExpenseForm />
      </div>
    </div>
  )
}
