"use client";
import { formatCurrency, sanitizeMealLabel } from '@/lib/utils'
import { FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUtensils, FaStore, FaCalculator, FaChevronRight } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'

interface OrderSummaryProps {
    formData: any;
    totals: {
        total: number;
        balance: number;
        waterTotal: number;
        stallsTotal: number;
        mealTypesTotal: number;
    };
    currentStep: number;
}

export default function OrderSummary({ formData, totals, currentStep }: OrderSummaryProps) {
    return (
        <div className="v2-card sticky top-24 overflow-hidden border-primary-100/50 shadow-xl shadow-primary-900/5">
            <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                    <div className="w-1.5 h-6 bg-primary-600 rounded-full" />
                    Order Intelligence
                </h3>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1">Real-time valuation</p>
            </div>

            <div className="p-5 space-y-6 max-h-[calc(100vh-350px)] overflow-y-auto custom-scrollbar">
                {/* Event Name & Customer */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Event Identity</span>
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${formData.orderType === 'EVENT' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                            {formData.orderType}
                        </span>
                    </div>
                    <div className="v2-glass p-3 rounded-xl border-gray-100">
                        <div className="text-sm font-black text-gray-800 truncate">
                            {formData.eventName || 'Untitled Event'}
                        </div>
                        <div className="text-[10px] text-gray-500 font-bold mt-1">
                            Step {currentStep} Progress: {Math.round((currentStep / 4) * 100)}%
                        </div>
                    </div>
                </div>

                {/* Sessions Summary */}
                {formData.mealTypes.length > 0 && (
                    <div className="space-y-3">
                        <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Configured Sessions</span>
                        <div className="space-y-2">
                            {formData.mealTypes.map((mt: any, i: number) => (
                                <motion.div 
                                    key={mt.id}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: i * 0.1 }}
                                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50/50 border border-gray-100"
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        <div className="w-6 h-6 rounded bg-white border border-gray-200 flex items-center justify-center text-[10px] font-black text-primary-600">
                                            {i + 1}
                                        </div>
                                        <div className="min-w-0">
                                            <div className="text-[10px] font-black text-gray-700 truncate capitalize">{sanitizeMealLabel(mt.menuType) || 'Draft'}</div>
                                            <div className="text-[8px] text-gray-400 font-bold truncate">{mt.date || 'No Date'} • {mt.time || 'No Time'}</div>
                                        </div>
                                    </div>
                                    <div className="text-[10px] font-black text-gray-800">
                                        {mt.selectedMenuItems.length} Items
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Financial Quick Look */}
                <div className="space-y-4 pt-4 border-t border-dashed border-gray-100">
                    <div className="flex justify-between items-center bg-emerald-50/50 p-3 rounded-xl border border-emerald-100">
                        <div>
                            <span className="text-[8px] font-black text-emerald-600 uppercase tracking-widest block mb-0.5">Total Valuation</span>
                            <div className="text-xl font-black text-emerald-700 leading-none">
                                {formatCurrency(totals.total)}
                            </div>
                        </div>
                        <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-emerald-500 shadow-sm">
                            <FaCalculator />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                            <span className="text-[8px] font-black text-gray-400 uppercase block mb-1">Sessions</span>
                            <div className="text-xs font-bold text-gray-700">{formatCurrency(totals.mealTypesTotal)}</div>
                        </div>
                        <div className="bg-gray-50 p-2 rounded-lg border border-gray-100">
                            <span className="text-[8px] font-black text-gray-400 uppercase block mb-1">Stalls</span>
                            <div className="text-xs font-bold text-gray-700">{formatCurrency(totals.stallsTotal)}</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-5 bg-gray-50/80 border-t border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-black text-gray-500 uppercase">Balance Due</span>
                    <span className="text-sm font-black text-red-600">{formatCurrency(totals.balance)}</span>
                </div>
                
                <div className="flex gap-2">
                    <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <motion.div 
                            className="h-full bg-primary-600"
                            initial={{ width: 0 }}
                            animate={{ width: `${(currentStep / 4) * 100}%` }}
                        />
                    </div>
                </div>
                <div className="text-[8px] font-bold text-gray-400 mt-2 text-center uppercase tracking-widest">
                    Step {currentStep} of 4
                </div>
            </div>
        </div>
    )
}
