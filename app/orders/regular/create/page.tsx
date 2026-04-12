"use client";
import OrderForm from '@/components/orders/OrderFormV2'

export default function CreateRegularOrderPage() {
    return (
        <div className="p-4 md:p-8 max-w-7xl mx-auto">
            <div className="mb-8">
                <h1 className="text-3xl font-black text-gray-800">New Regular Order</h1>
                <p className="text-gray-500 mt-1">Create a new daily order, lunch pack, or prasadam entry</p>
            </div>

            <OrderForm initialOrderType="LUNCH_PACK" />
        </div>
    )
}
