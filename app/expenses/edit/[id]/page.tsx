"use client";
import ExpenseForm from '@/components/expenses/ExpenseForm'
import { useParams, useRouter } from 'next/navigation'
import { FaArrowLeft } from 'react-icons/fa'
import Link from 'next/link'

export default function EditExpensePage() {
    const params = useParams()
    const expenseId = params.id as string

    return (
        <div className="p-4 sm:p-6 lg:p-8 bg-gray-50 min-h-screen">
            <div className="max-w-4xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Edit Expense</h1>
                    <p className="text-gray-600 mt-1">Update expense information</p>
                </div>
                <ExpenseForm id={expenseId} />
            </div>
        </div>
    )
}
