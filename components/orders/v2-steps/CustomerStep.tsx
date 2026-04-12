"use client";
import { useState, useRef, useEffect } from 'react'
import { FaSearch, FaPlus, FaUser, FaTag, FaInfoCircle } from 'react-icons/fa'
import { Customer } from '@/types'
import { motion } from 'framer-motion'

interface CustomerStepProps {
    formData: any;
    setFormData: React.Dispatch<React.SetStateAction<any>>;
    customers: Customer[];
    currentOrderStatus: string;
    setCurrentOrderStatus: (status: string) => void;
    isEditMode: boolean;
}

export default function CustomerStep({ 
    formData, 
    setFormData, 
    customers, 
    currentOrderStatus, 
    setCurrentOrderStatus,
    isEditMode 
}: CustomerStepProps) {
    const [searchTerm, setSearchTerm] = useState('')
    const [showDropdown, setShowDropdown] = useState(false)
    const dropdownRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const filteredCustomers = customers.filter(c => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.phone.includes(searchTerm)
    )

    const selectedCustomer = customers.find(c => c.id === formData.customerId)

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div className="v2-card p-8 space-y-8 border-primary-50">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-600 shadow-inner">
                        <FaUser size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-800">Customer Identity</h2>
                        <p className="text-sm text-gray-500 font-bold">Who is this order for?</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {/* Customer Selection */}
                    <div className="space-y-4 relative" ref={dropdownRef}>
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">
                            Search or Select Customer
                        </label>
                        <div className="relative group">
                            <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                            <input
                                type="text"
                                value={selectedCustomer ? selectedCustomer.name : searchTerm}
                                onChange={(e) => {
                                    setSearchTerm(e.target.value)
                                    setShowDropdown(true)
                                    if (selectedCustomer) setFormData((p: any) => ({ ...p, customerId: '' }))
                                }}
                                onFocus={() => setShowDropdown(true)}
                                className="v2-input pl-12 h-14 text-base font-black bg-gray-50/50"
                                placeholder={isEditMode ? "Change Customer..." : "Enterprise Name or Phone..."}
                            />
                        </div>

                        {showDropdown && filteredCustomers.length > 0 && (
                            <div className="absolute z-50 w-full mt-2 bg-white border border-gray-100 rounded-2xl shadow-2xl max-h-60 overflow-y-auto v2-glass p-2">
                                {filteredCustomers.map(c => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => {
                                            setFormData((p: any) => ({ ...p, customerId: c.id }))
                                            setSearchTerm(c.name)
                                            setShowDropdown(false)
                                        }}
                                        className="w-full px-4 py-3 text-left hover:bg-primary-50 rounded-xl transition-all group border-b border-gray-50 last:border-0"
                                    >
                                        <div className="font-black text-gray-800 text-sm group-hover:text-primary-700">{c.name}</div>
                                        <div className="text-[10px] text-gray-500 font-bold mt-0.5">{c.phone}</div>
                                    </button>
                                ))}
                            </div>
                        )}
                        
                        {selectedCustomer && (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl relative overflow-hidden"
                            >
                                <div className="absolute -right-4 -bottom-4 opacity-5 text-emerald-900">
                                    <FaUser size={100} />
                                </div>
                                <div className="flex justify-between items-start relative z-10">
                                    <div>
                                        <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Active Selection</div>
                                        <div className="text-sm font-black text-emerald-900">{selectedCustomer.name}</div>
                                        <div className="text-[10px] font-bold text-emerald-700/70">{selectedCustomer.phone} • {selectedCustomer.address}</div>
                                    </div>
                                    <button 
                                        type="button"
                                        onClick={() => setFormData((p: any) => ({ ...p, customerId: '' }))}
                                        className="text-[10px] font-black text-emerald-600 hover:underline"
                                    >
                                        REPLACE
                                    </button>
                                </div>
                            </motion.div>
                        )}
                    </div>

                    {/* Event Name */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">
                            Event Title / Reference
                        </label>
                        <div className="relative group">
                            <FaTag className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary-500 transition-colors" />
                            <input
                                type="text"
                                value={formData.eventName}
                                onChange={(e) => setFormData((p: any) => ({ ...p, eventName: e.target.value }))}
                                className="v2-input pl-12 h-14 text-base font-black bg-gray-50/50"
                                placeholder={formData.orderType === 'EVENT' ? "e.g., Wedding Reception" : "e.g., Monthly Corporate Lunch"}
                            />
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4">
                    {/* Order Type */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">
                            Order Category
                        </label>
                        <div className="flex bg-gray-100 p-1.5 rounded-2xl border border-gray-200">
                            <button
                                type="button"
                                onClick={() => setFormData((p: any) => ({ ...p, orderType: 'EVENT' }))}
                                className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all ${formData.orderType === 'EVENT' ? 'bg-white shadow-lg text-primary-600 scale-100' : 'text-gray-500 hover:text-gray-700 scale-95'}`}
                            >
                                PREMIUM EVENT
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData((p: any) => ({ ...p, orderType: 'LUNCH_PACK' }))}
                                className={`flex-1 py-3 px-4 rounded-xl text-xs font-black transition-all ${formData.orderType === 'LUNCH_PACK' ? 'bg-white shadow-lg text-primary-600 scale-100' : 'text-gray-500 hover:text-gray-700 scale-95'}`}
                            >
                                LUNCH PACKS
                            </button>
                        </div>
                    </div>

                    {/* Status */}
                    <div className="space-y-4">
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">
                            Pipeline Status
                        </label>
                        <select
                            value={currentOrderStatus}
                            onChange={(e) => setCurrentOrderStatus(e.target.value)}
                            className={`w-full h-14 px-6 rounded-2xl border-2 outline-none font-black text-sm transition-all appearance-none cursor-pointer ${
                                currentOrderStatus === 'quotation' ? 'bg-purple-50 text-purple-700 border-purple-200' :
                                currentOrderStatus === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                                currentOrderStatus === 'in_progress' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                                currentOrderStatus === 'cancelled' ? 'bg-red-50 text-red-700 border-red-200' :
                                'bg-orange-50 text-orange-700 border-orange-200'
                            }`}
                        >
                            <option value="quotation">QUOTATION (PROPOSAL)</option>
                            <option value="pending">PENDING (CONFIRMED)</option>
                            <option value="in_progress">IN PROGRESS (ACTIVE)</option>
                            <option value="completed">COMPLETED (DELIVERED)</option>
                            <option value="cancelled">CANCELLED</option>
                        </select>
                    </div>
                </div>

                <div className="mt-8 p-6 bg-primary-50/30 rounded-3xl border border-primary-100/50 flex gap-4 items-start">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-primary-500 shrink-0 shadow-sm border border-primary-100">
                        <FaInfoCircle />
                    </div>
                    <div>
                        <h4 className="font-black text-gray-800 text-sm">Pro Tip</h4>
                        <p className="text-xs text-primary-700 font-bold mt-1 leading-relaxed">
                            Selecting 'Premium Event' enables high-density session management. Use 'Lunch Packs' for repetitive daily orders with simplified logistics.
                        </p>
                    </div>
                </div>
            </div>
        </motion.div>
    )
}
