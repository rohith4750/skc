"use client";
import React, { useState, useEffect } from 'react'
import { MenuItem, StallTemplate } from '@/types'
import { FaSave, FaTimes, FaSearch, FaCheck, FaSortAlphaDown, FaUtensils, FaCheckCircle, FaMinusCircle, FaPlusCircle } from 'react-icons/fa'
import { Storage } from '@/lib/storage-api'
import toast from 'react-hot-toast'

interface StallFormProps {
    stall: StallTemplate | null;
    menuItems: MenuItem[];
    onClose: () => void;
    onSuccess: () => void;
}

export default function StallForm({ stall, menuItems, onClose, onSuccess }: StallFormProps) {
    const [name, setName] = useState(stall?.name || '')
    const [description, setDescription] = useState(stall?.description || '')
    const [selectedItemIds, setSelectedItemIds] = useState<string[]>(stall?.menuItemIds || [])
    const [searchTerm, setSearchTerm] = useState('')
    const [selectedCategory, setSelectedCategory] = useState<string>('all')
    const [saveLoading, setSaveLoading] = useState(false)

    // Extract unique categories from menu items for filtering
    const allCategories = ['all', ...Array.from(new Set(menuItems.flatMap(item => item.type)))].sort()

    const filteredItems = menuItems.filter(item => {
        const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase())
        const matchesCategory = selectedCategory === 'all' || item.type.includes(selectedCategory)
        return matchesSearch && matchesCategory
    })

    const toggleItem = (id: string) => {
        if (selectedItemIds.includes(id)) {
            setSelectedItemIds(selectedItemIds.filter(itemId => itemId !== id))
        } else {
            setSelectedItemIds([...selectedItemIds, id])
        }
    }

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!name) {
            toast.error('Please enter a stall name')
            return
        }
        if (selectedItemIds.length === 0) {
            toast.error('Please select at least one menu item')
            return
        }

        try {
            setSaveLoading(true)
            await Storage.saveStallTemplate({
                id: stall?.id,
                name,
                description,
                menuItemIds: selectedItemIds
            })
            toast.success(stall ? 'Stall template updated!' : 'Stall template created!')
            onSuccess()
        } catch (error) {
            console.error('Failed to save stall template:', error)
            toast.error('Failed to save stall template')
        } finally {
            setSaveLoading(false)
        }
    }

    // Items grouped by whether they are selected or not
    const selectedItems = menuItems.filter(item => selectedItemIds.includes(item.id))
    const availableItems = filteredItems.filter(item => !selectedItemIds.includes(item.id))

    return (
        <div className="flex flex-col h-full bg-slate-50">
            {/* Header */}
            <div className="p-6 bg-white border-b border-slate-200 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-4">
                    <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-100">
                        <FaUtensils className="w-5 h-5 text-white" />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-slate-800 tracking-tight">
                            {stall ? 'Edit Stall Template' : 'Create New Stall Template'}
                        </h3>
                        <p className="text-slate-400 text-sm font-medium">Define your stall package and its menu</p>
                    </div>
                </div>
                <button
                    onClick={onClose}
                    className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-all"
                >
                    <FaTimes className="w-5 h-5" />
                </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
                <div className="p-6 space-y-6 overflow-y-auto flex-1">
                    {/* Basic Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Stall Name *</label>
                            <input
                                type="text"
                                value={name}
                                required
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm font-medium"
                                placeholder="e.g., Panipuri Chat Stall"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Description (Optional)</label>
                            <input
                                type="text"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                className="w-full px-5 py-3 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all shadow-sm font-medium"
                                placeholder="Short notes about this stall..."
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[50vh]">
                        {/* Selector Area */}
                        <div className="flex flex-col space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">Available Menu Items</label>
                            <div className="bg-white border border-slate-200 rounded-[2rem] p-4 flex flex-col h-full overflow-hidden shadow-sm">
                                <div className="space-y-3 mb-4 shrink-0">
                                    <div className="relative">
                                        <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-3.5 h-3.5" />
                                        <input
                                            type="text"
                                            placeholder="Quick search items..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-100 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20"
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1 scrollbar-hide">
                                        {allCategories.map(cat => (
                                            <button
                                                key={cat}
                                                type="button"
                                                onClick={() => setSelectedCategory(cat)}
                                                className={`px-3 py-1.5 rounded-lg text-[11px] font-bold uppercase tracking-tight transition-all ${
                                                    selectedCategory === cat
                                                        ? 'bg-indigo-600 text-white shadow-md'
                                                        : 'bg-slate-50 text-slate-500 hover:bg-slate-200'
                                                }`}
                                            >
                                                {cat}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                
                                <div className="overflow-y-auto pr-2 custom-scrollbar">
                                    <div className="space-y-1">
                                        {availableItems.length === 0 ? (
                                            <div className="p-8 text-center text-slate-400 text-sm">
                                                No items found matching filter.
                                            </div>
                                        ) : (
                                            availableItems.map(item => (
                                                <button
                                                    key={item.id}
                                                    type="button"
                                                    onClick={() => toggleItem(item.id)}
                                                    className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 group text-left transition-colors border border-transparent hover:border-slate-100"
                                                >
                                                    <div>
                                                        <div className="text-sm font-bold text-slate-700">{item.name}</div>
                                                        <div className="text-[10px] text-slate-400 font-medium uppercase">{item.type.join(', ')}</div>
                                                    </div>
                                                    <FaPlusCircle className="text-slate-200 group-hover:text-indigo-500 transition-colors w-5 h-5 shrink-0" />
                                                </button>
                                            ))
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Selection Result Area */}
                        <div className="flex flex-col space-y-3">
                            <label className="text-xs font-bold text-slate-500 uppercase tracking-wider ml-1">
                                Selected Items ({selectedItemIds.length})
                            </label>
                            <div className="bg-indigo-50/50 border border-indigo-100 rounded-[2rem] p-4 flex flex-col h-full overflow-hidden shadow-inner">
                                {selectedItems.length === 0 ? (
                                    <div className="flex-1 flex flex-col items-center justify-center text-slate-400 space-y-3 p-6 text-center">
                                        <FaCheckCircle className="w-8 h-8 opacity-20" />
                                        <p className="text-sm font-medium">Pick items from the list to add them to this stall package.</p>
                                    </div>
                                ) : (
                                    <div className="overflow-y-auto pr-2 custom-scrollbar space-y-2">
                                        {selectedItems.map(item => (
                                            <div 
                                                key={item.id}
                                                className="bg-white p-3 rounded-2xl shadow-sm border border-indigo-100 flex items-center justify-between group animate-in slide-in-from-right-3 duration-200"
                                            >
                                                <div>
                                                    <div className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                                                        {item.name}
                                                    </div>
                                                    <div className="text-[10px] text-slate-400 font-medium uppercase pl-3">{item.type.join(', ')}</div>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleItem(item.id)}
                                                    className="p-2 text-slate-200 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                                                >
                                                    <FaMinusCircle className="w-5 h-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="p-6 bg-white border-t border-slate-200 flex flex-col sm:flex-row justify-end gap-3 shrink-0">
                    <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-bold hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                    >
                        Discard
                    </button>
                    <button
                        type="submit"
                        disabled={saveLoading}
                        className={`px-10 py-3 bg-indigo-600 text-white rounded-2xl font-bold transition-all flex items-center justify-center gap-2 shadow-xl shadow-indigo-100 hover:shadow-indigo-200 active:scale-95 ${saveLoading ? 'opacity-70 cursor-not-allowed' : 'hover:bg-indigo-700'}`}
                    >
                        {saveLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <FaSave className="w-4 h-4" />
                        )}
                        <span>{stall ? 'Save Changes' : 'Create Stall Template'}</span>
                    </button>
                </div>
            </form>
        </div>
    )
}
