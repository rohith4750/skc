"use client";
import OrderForm from '@/components/orders/OrderForm'
import Link from 'next/link'
import { FaChevronLeft } from 'react-icons/fa'
import { Suspense } from 'react'

export default function CreateOrderPage() {
    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <div className="flex items-center gap-4 mb-8">
                <Link
                    href="/orders/center"
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <FaChevronLeft className="text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-2xl md:text-3xl font-black text-gray-800">Create New Order</h1>
                    <p className="text-gray-500 text-sm mt-1">Fill in the details to schedule a new catering event</p>
                </div>
            </div>

            <Suspense fallback={<div className="p-8 text-center text-gray-500">Loading form...</div>}>
                <OrderForm />
            </Suspense>
        </div>
    )
}
