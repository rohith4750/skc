'use client'

import { useState } from 'react'
import { Order } from '@/types'
import { formatDate, formatCurrency } from '@/lib/utils'
import { FaLayerGroup, FaCheckCircle } from 'react-icons/fa'

interface MergeOrdersModalProps {
    isOpen: boolean
    onClose: () => void
    onMerge: (primaryOrderId: string) => void
    selectedOrders: Order[]
    isMerging: boolean
}

export default function MergeOrdersModal({
    isOpen,
    onClose,
    onMerge,
    selectedOrders,
    isMerging,
}: MergeOrdersModalProps) {
    const [primaryOrderId, setPrimaryOrderId] = useState<string>('')

    if (!isOpen) return null

    const handleMerge = () => {
        if (!primaryOrderId) return
        onMerge(primaryOrderId)
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center gap-4 bg-primary-50">
                    <div className="w-12 h-12 rounded-xl bg-primary-600 flex items-center justify-center text-white shadow-lg">
                        <FaLayerGroup size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-800">Merge Orders</h2>
                        <p className="text-sm font-medium text-primary-600">Select the primary order to merge others into</p>
                    </div>
                </div>

                <div className="p-6 max-h-[60vh] overflow-y-auto">
                    <div className="space-y-3">
                        {selectedOrders.map((order) => (
                            <div
                                key={order.id}
                                onClick={() => setPrimaryOrderId(order.id)}
                                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${primaryOrderId === order.id
                                        ? 'border-primary-500 bg-primary-50 ring-2 ring-primary-200'
                                        : 'border-gray-100 hover:border-primary-200 hover:bg-gray-50'
                                    }`}
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-lg font-black text-gray-800">Order #{order.serialNumber}</span>
                                            <span className="text-xs font-bold px-2 py-0.5 bg-gray-200 text-gray-600 rounded-full">
                                                {order.status.toUpperCase()}
                                            </span>
                                        </div>
                                        <p className="text-sm font-bold text-gray-500">{order.customer?.name}</p>
                                        <p className="text-xs font-medium text-gray-400">{order.eventName || 'No Event Name'}</p>
                                    </div>
                                    <div className="text-right flex items-center gap-4">
                                        <div>
                                            <p className="text-lg font-black text-primary-600">{formatCurrency(order.totalAmount)}</p>
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none"> Total Amount</p>
                                        </div>
                                        {primaryOrderId === order.id && (
                                            <FaCheckCircle className="text-primary-500 animate-in zoom-in" size={24} />
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-6 p-4 bg-amber-50 rounded-xl border border-amber-100">
                        <p className="text-sm text-amber-800">
                            <strong>Warning:</strong> The selected "Primary Order" will keep its identity. All other selected orders will be
                            <strong> deleted</strong>, and their sessions, items, and financials will be moved into this primary order.
                        </p>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 border-t border-gray-100 flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-6 py-3 border border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-100 transition-all"
                        disabled={isMerging}
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleMerge}
                        disabled={!primaryOrderId || isMerging}
                        className={`px-8 py-3 rounded-xl text-white font-bold transition-all shadow-lg flex items-center gap-2 ${!primaryOrderId || isMerging
                                ? 'bg-gray-400 cursor-not-allowed'
                                : 'bg-primary-600 hover:bg-primary-700 active:scale-95'
                            }`}
                    >
                        {isMerging ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Merging...
                            </>
                        ) : (
                            'Confirm Merge'
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}
