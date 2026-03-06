"use client";
import OrderForm from '@/components/orders/OrderForm'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { FaChevronLeft } from 'react-icons/fa'

export default function EditOrderPage() {
    const params = useParams()
    const orderId = params?.id as string
    const router = useRouter()

    if (!orderId) {
        router.push('/orders/center')
        return null
    }

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
                    <h1 className="text-2xl md:text-3xl font-black text-gray-800">Edit Order</h1>
                    <p className="text-gray-500 text-sm mt-1">Review and update details for this catering event</p>
                </div>
            </div>

            <OrderForm orderId={orderId} isEditMode={true} />
        </div>
    )
}
