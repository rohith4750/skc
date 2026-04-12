"use client";
import { FaCalculator, FaTruck, FaGlassWhiskey, FaTag, FaWallet, FaStore, FaPlus, FaTrashAlt, FaChevronDown, FaChevronUp } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'
import { formatCurrency } from '@/lib/utils'

interface FinancialsStepProps {
    formData: any;
    setFormData: React.Dispatch<React.SetStateAction<any>>;
    totals: any;
    isEditMode: boolean;
    originalAdvancePaid: number;
}

export default function FinancialsStep({ 
    formData, 
    setFormData, 
    totals, 
    isEditMode, 
    originalAdvancePaid 
}: FinancialsStepProps) {

    const handleAddStall = () => {
        const id = crypto.randomUUID()
        setFormData((prev: any) => ({
            ...prev,
            stalls: [{
                id,
                category: '',
                description: '',
                selectedMenuItems: [],
                itemCustomizations: {},
                itemQuantities: {},
                pricingMethod: 'manual',
                numberOfPlates: '',
                platePrice: '',
                manualAmount: '',
                cost: '',
                numberOfMembers: '',
                eventName: '',
                venue: '',
                date: '',
                time: '',
                services: [],
            }, ...(prev.stalls || [])]
        }))
    }

    const handleRemoveStall = (id: string) => {
        setFormData((prev: any) => ({
            ...prev,
            stalls: prev.stalls.filter((s: any) => s.id !== id)
        }))
    }

    const handleUpdateStall = (id: string, field: string, value: any) => {
        setFormData((prev: any) => ({
            ...prev,
            stalls: prev.stalls.map((s: any) => s.id === id ? { ...s, [field]: value } : s)
        }))
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            {/* Extras & Stalls Section */}
            <div className="v2-card p-8 border-primary-50">
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-primary-100 flex items-center justify-center text-primary-600 shadow-inner">
                            <FaStore size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-gray-800">Live Stalls & Extras</h2>
                            <p className="text-sm text-gray-500 font-bold">Additional counters and equipment</p>
                        </div>
                    </div>
                    <button
                        type="button"
                        onClick={handleAddStall}
                        className="text-primary-600 font-black text-xs uppercase tracking-widest border-2 border-primary-100 px-4 py-2 rounded-xl hover:bg-primary-50 transition-all flex items-center gap-2"
                    >
                        <FaPlus /> ADD STALL
                    </button>
                </div>

                <div className="space-y-4">
                    <AnimatePresence mode="popLayout">
                        {formData.stalls?.map((stall: any, idx: number) => (
                            <motion.div 
                                key={stall.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="v2-glass p-6 rounded-3xl border-gray-100 group relative"
                            >
                                <button
                                    type="button"
                                    onClick={() => handleRemoveStall(stall.id)}
                                    className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-50 text-red-400 hover:text-red-600 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all border border-red-100"
                                >
                                    <FaTrashAlt size={12} />
                                </button>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Stall Name</label>
                                        <input
                                            type="text"
                                            value={stall.category}
                                            onChange={(e) => handleUpdateStall(stall.id, 'category', e.target.value)}
                                            className="v2-input h-12 bg-white/50 text-sm font-black"
                                            placeholder="e.g., Live Jalebi Counter"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Pricing</label>
                                        <div className="flex bg-gray-200/50 p-1 rounded-xl h-12">
                                            <button
                                                type="button"
                                                onClick={() => handleUpdateStall(stall.id, 'pricingMethod', 'manual')}
                                                className={`flex-1 px-3 text-[10px] font-black rounded-lg transition-all ${stall.pricingMethod === 'manual' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500'}`}
                                            >
                                                FIXED
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleUpdateStall(stall.id, 'pricingMethod', 'plate-based')}
                                                className={`flex-1 px-3 text-[10px] font-black rounded-lg transition-all ${stall.pricingMethod === 'plate-based' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500'}`}
                                            >
                                                PLATE
                                            </button>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Amount</label>
                                        <div className="relative">
                                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
                                            <input
                                                type="number"
                                                value={stall.pricingMethod === 'manual' ? stall.manualAmount : (parseFloat(stall.numberOfPlates || 0) * parseFloat(stall.platePrice || 0))}
                                                onChange={(e) => handleUpdateStall(stall.id, 'manualAmount', e.target.value)}
                                                readOnly={stall.pricingMethod === 'plate-based'}
                                                className={`v2-input h-12 pl-8 bg-white/50 text-sm font-black ${stall.pricingMethod === 'plate-based' ? 'opacity-50 select-none' : ''}`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {!formData.stalls?.length && (
                        <div className="text-center py-10 rounded-3xl border-2 border-dashed border-gray-100 text-gray-400 text-[10px] font-black uppercase tracking-widest">
                            No active stalls configured
                        </div>
                    )}
                </div>
            </div>

            {/* Financials Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Fixed Costs */}
                <div className="v2-card p-8 space-y-8">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center text-orange-600">
                            <FaTruck />
                        </div>
                        <h3 className="text-lg font-black text-gray-800 uppercase tracking-tight">Logistics & Buffer</h3>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Transport Cost</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary-500 font-black">₹</span>
                                <input
                                    type="number"
                                    value={formData.transportCost}
                                    onChange={(e) => setFormData((p:any) => ({ ...p, transportCost: e.target.value }))}
                                    className="v2-input h-14 pl-10 font-black text-gray-700 bg-gray-50/50"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Mineral Water / Beverages</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-primary-500 font-black">₹</span>
                                <input
                                    type="number"
                                    value={formData.waterBottlesCost}
                                    onChange={(e) => setFormData((p:any) => ({ ...p, waterBottlesCost: e.target.value }))}
                                    className="v2-input h-14 pl-10 font-black text-gray-700 bg-gray-50/50"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Final Settlements */}
                <div className="v2-card p-8 space-y-8 bg-gray-900 text-white border-none shadow-2xl">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-primary-600 flex items-center justify-center text-white">
                            <FaWallet />
                        </div>
                        <h3 className="text-lg font-black uppercase tracking-tight">Treasury</h3>
                    </div>

                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block pl-1">Discount (Offerings)</label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 font-black">₹</span>
                                <input
                                    type="number"
                                    value={formData.discount}
                                    onChange={(e) => setFormData((p:any) => ({ ...p, discount: e.target.value }))}
                                    className="v2-input h-14 pl-10 font-black text-red-400 bg-white/5 border-white/10 focus:border-red-500"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block pl-1">
                                {isEditMode ? "Additional Collection" : "Initial Advance"}
                            </label>
                            <div className="relative group">
                                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500 font-black text-lg">₹</span>
                                <input
                                    type="number"
                                    value={formData.advancePaid}
                                    onChange={(e) => setFormData((p:any) => ({ ...p, advancePaid: e.target.value }))}
                                    className="v2-input h-14 pl-10 font-black text-emerald-400 bg-white/5 border-white/10 focus:border-emerald-500"
                                    placeholder="0.00"
                                />
                            </div>
                        </div>
                        
                        <div className="pt-4 flex justify-between items-center border-t border-white/10">
                            <div>
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Grand Total</span>
                                <div className="text-2xl font-black text-white">{formatCurrency(totals.total)}</div>
                            </div>
                            <div className="text-right">
                                <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Settlement Due</span>
                                <div className="text-2xl font-black text-emerald-500">{formatCurrency(totals.balance)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Internal Notes */}
            <div className="v2-card p-8 border-gray-100">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-4">Internal Notes & Payment Terms</label>
                <textarea
                    value={formData.paymentNotes}
                    onChange={(e) => setFormData((p:any) => ({ ...p, paymentNotes: e.target.value }))}
                    rows={4}
                    className="v2-input bg-gray-50 p-6 text-sm font-bold min-h-[120px]"
                    placeholder="Specific payment schedule, bank transfer details, or special logistical requirements..."
                />
            </div>
        </motion.div>
    )
}
