"use client";
import OrderForm from '@/components/orders/OrderFormV2'
import { useParams } from 'next/navigation'

export default function EditRegularOrderPage() {
    const params = useParams()
    const id = params.id as string

    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-800">Edit Regular Order</h1>
                <p className="text-gray-500 mt-1">Update details for this daily/regular order</p>
            </div>

            <OrderForm orderId={id} isEditMode={true} initialOrderType="LUNCH_PACK" />
        </div>
    )
}
