"use client";
import { FaPlus, FaUtensils, FaCalendarAlt, FaClock, FaMapMarkerAlt, FaUsers, FaChevronDown, FaChevronUp, FaTimes, FaTrashAlt } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'
import { sanitizeMealLabel } from '@/lib/utils'

interface SessionsStepProps {
    formData: any;
    setFormData: React.Dispatch<React.SetStateAction<any>>;
    collapsedSessions: Record<string, boolean>;
    setCollapsedSessions: React.Dispatch<React.SetStateAction<Record<string, boolean>>>;
}

export default function SessionsStep({ 
    formData, 
    setFormData, 
    collapsedSessions,
    setCollapsedSessions 
}: SessionsStepProps) {

    const handleAddSession = () => {
        const id = crypto.randomUUID()
        setFormData((prev: any) => ({
            ...prev,
            mealTypes: [{
                id,
                eventName: '',
                venue: '',
                menuType: '',
                selectedMenuItems: [],
                pricingMethod: 'manual',
                numberOfPlates: '',
                platePrice: '',
                manualAmount: '',
                date: '',
                time: '',
                services: [],
                numberOfMembers: '',
                itemCustomizations: {},
                itemQuantities: {},
                itemPrices: {},
                description: '',
            }, ...prev.mealTypes]
        }))
        setCollapsedSessions(prev => ({ ...prev, [id]: false }))
    }

    const handleRemoveSession = (id: string) => {
        setFormData((prev: any) => ({
            ...prev,
            mealTypes: prev.mealTypes.filter((mt: any) => mt.id !== id)
        }))
    }

    const handleUpdateSession = (id: string, field: string, value: any) => {
        setFormData((prev: any) => ({
            ...prev,
            mealTypes: prev.mealTypes.map((mt: any) => {
                if (mt.id === id) {
                    const updated = { ...mt, [field]: value }
                    if (field === 'numberOfMembers' && mt.pricingMethod === 'plate-based') updated.numberOfPlates = value
                    if (field === 'pricingMethod' && value === 'plate-based') updated.numberOfPlates = mt.numberOfMembers
                    return updated
                }
                return mt
            })
        }))
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
        >
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-orange-100 flex items-center justify-center text-orange-600 shadow-inner">
                        <FaUtensils size={24} />
                    </div>
                    <div>
                        <h2 className="text-2xl font-black text-gray-800">Meal Sessions</h2>
                        <p className="text-sm text-gray-500 font-bold">Define the schedule and scope</p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={handleAddSession}
                    className="v2-button bg-primary-600 text-white px-6 py-3 flex items-center gap-2"
                >
                    <FaPlus /> ADD SESSION
                </button>
            </div>

            <div className="space-y-6">
                <AnimatePresence mode="popLayout">
                    {formData.mealTypes.map((mt: any, index: number) => (
                        <motion.div
                            key={mt.id}
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="v2-card overflow-hidden border-orange-100"
                        >
                            {/* Header */}
                            <div className="bg-gray-50/50 p-5 border-b border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-white border border-gray-200 flex items-center justify-center font-black text-primary-600 text-sm shadow-sm">
                                        {formData.mealTypes.length - index}
                                    </div>
                                    <div>
                                        <h3 className="font-black text-gray-800 flex items-center gap-2">
                                            {mt.menuType ? sanitizeMealLabel(mt.menuType) : "Draft Session"}
                                            {mt.eventName && <span className="text-xs font-bold text-gray-400 capitalize bg-gray-100 px-2 py-0.5 rounded ml-2">{mt.eventName}</span>}
                                        </h3>
                                        <div className="flex items-center gap-4 mt-1 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                                            <span className="flex items-center gap-1"><FaCalendarAlt /> {mt.date || 'Pending'}</span>
                                            <span className="flex items-center gap-1"><FaClock /> {mt.time || 'Pending'}</span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setCollapsedSessions(p => ({ ...p, [mt.id]: !p[mt.id] }))}
                                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-all rounded-xl hover:bg-white"
                                    >
                                        {collapsedSessions[mt.id] ? <FaChevronDown /> : <FaChevronUp />}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveSession(mt.id)}
                                        className="w-10 h-10 flex items-center justify-center text-red-300 hover:text-red-500 transition-all rounded-xl hover:bg-red-50"
                                    >
                                        <FaTrashAlt />
                                    </button>
                                </div>
                            </div>

                            {!collapsedSessions[mt.id] && (
                                <div className="p-8 space-y-8 animate-in fade-in duration-300">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Session Branding</label>
                                            <input
                                                type="text"
                                                value={mt.eventName}
                                                onChange={(e) => handleUpdateSession(mt.id, 'eventName', e.target.value)}
                                                className="v2-input bg-gray-50/50"
                                                placeholder="e.g., Groom's Breakfast"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Category</label>
                                            <select
                                                value={mt.menuType}
                                                onChange={(e) => handleUpdateSession(mt.id, 'menuType', e.target.value)}
                                                className="v2-input bg-gray-50/50 capitalize font-black text-sm"
                                            >
                                                <option value="">SELECT CATEGORY</option>
                                                <option value="breakfast">BREAKFAST</option>
                                                <option value="lunch">LUNCH</option>
                                                <option value="dinner">DINNER</option>
                                                <option value="snacks">SNACKS</option>
                                                <option value="tiffins">TIFFINS</option>
                                                <option value="sweets">SWEETS</option>
                                                <option value="special_order">SPECIAL ORDER</option>
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Venue</label>
                                            <div className="relative">
                                                <FaMapMarkerAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="text"
                                                    value={mt.venue}
                                                    onChange={(e) => handleUpdateSession(mt.id, 'venue', e.target.value)}
                                                    className="v2-input pl-11 bg-gray-50/50"
                                                    placeholder="e.g., Function Hall A"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Date</label>
                                            <input
                                                type="date"
                                                value={mt.date}
                                                onChange={(e) => handleUpdateSession(mt.id, 'date', e.target.value)}
                                                className="v2-input bg-gray-50/50 font-black text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Service Time</label>
                                            <input
                                                type="time"
                                                value={mt.time}
                                                onChange={(e) => handleUpdateSession(mt.id, 'time', e.target.value)}
                                                className="v2-input bg-gray-50/50 font-black text-sm"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Est. Guests</label>
                                            <div className="relative">
                                                <FaUsers className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                                                <input
                                                    type="number"
                                                    value={mt.numberOfMembers}
                                                    onChange={(e) => handleUpdateSession(mt.id, 'numberOfMembers', e.target.value)}
                                                    className="v2-input pl-11 bg-gray-50/50 font-black"
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-1">Pricing Model</label>
                                            <div className="flex bg-gray-100 p-1 rounded-xl h-12">
                                                <button
                                                    type="button"
                                                    onClick={() => handleUpdateSession(mt.id, 'pricingMethod', 'manual')}
                                                    className={`flex-1 py-1 px-3 text-[10px] font-black rounded-lg transition-all ${mt.pricingMethod === 'manual' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500'}`}
                                                >
                                                    MANUAL
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => handleUpdateSession(mt.id, 'pricingMethod', 'plate-based')}
                                                    className={`flex-1 py-1 px-3 text-[10px] font-black rounded-lg transition-all ${mt.pricingMethod === 'plate-based' ? 'bg-white shadow-sm text-primary-600' : 'text-gray-500'}`}
                                                >
                                                    PLATE-WISE
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Sub-Pricing Section */}
                                    {mt.pricingMethod === 'plate-based' ? (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="p-6 bg-emerald-50 rounded-3xl border border-emerald-100 grid grid-cols-2 gap-6"
                                        >
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block">Actual Plates</label>
                                                <input
                                                    type="number"
                                                    value={mt.numberOfPlates}
                                                    onChange={(e) => handleUpdateSession(mt.id, 'numberOfPlates', e.target.value)}
                                                    className="v2-input border-emerald-100 bg-white"
                                                    placeholder="0"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <label className="text-[10px] font-black text-emerald-600 uppercase tracking-widest block">Rate per Plate</label>
                                                <div className="relative">
                                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400 font-bold">₹</span>
                                                    <input
                                                        type="number"
                                                        value={mt.platePrice}
                                                        onChange={(e) => handleUpdateSession(mt.id, 'platePrice', e.target.value)}
                                                        className="v2-input pl-8 border-emerald-100 bg-white"
                                                        placeholder="0.00"
                                                    />
                                                </div>
                                            </div>
                                        </motion.div>
                                    ) : (
                                        <motion.div 
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            className="p-6 bg-orange-50/50 rounded-3xl border border-orange-100"
                                        >
                                            <label className="text-[10px] font-black text-orange-600 uppercase tracking-widest block mb-2">Total Fixed Session Amount</label>
                                            <div className="relative">
                                                <span className="absolute left-6 top-1/2 -translate-y-1/2 text-orange-300 text-2xl font-black">₹</span>
                                                <input
                                                    type="number"
                                                    value={mt.manualAmount}
                                                    onChange={(e) => handleUpdateSession(mt.id, 'manualAmount', e.target.value)}
                                                    className="v2-input pl-12 h-20 text-3xl font-black bg-white border-orange-100 text-orange-700"
                                                    placeholder="0.00"
                                                />
                                            </div>
                                        </motion.div>
                                    )}
                                </div>
                            )}
                        </motion.div>
                    ))}
                </AnimatePresence>

                {formData.mealTypes.length === 0 && (
                    <div className="text-center py-20 border-2 border-dashed border-gray-100 rounded-3xl space-y-4">
                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-200 mx-auto">
                            <FaUtensils size={32} />
                        </div>
                        <div>
                            <p className="text-gray-400 font-bold">No sessions added yet.</p>
                            <button 
                                type="button" 
                                onClick={handleAddSession}
                                className="text-primary-600 font-black text-xs uppercase tracking-widest mt-2 hover:underline"
                            >
                                + Add First Session
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </motion.div>
    )
}
