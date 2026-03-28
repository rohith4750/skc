"use client";
import React, { useState } from 'react'
import { MenuItem, StallTemplate } from '@/types'
import { FaPlus, FaEdit, FaTrash, FaStore, FaSearch, FaHistory } from 'react-icons/fa'
import { Storage } from '@/lib/storage-api'
import toast from 'react-hot-toast'
import ConfirmModal from '@/components/ConfirmModal'
import StallForm from '@/components/menu/StallForm'

interface StallManagementProps {
    stallTemplates: StallTemplate[];
    menuItems: MenuItem[];
    onRefresh: () => void;
}

export default function StallManagement({ stallTemplates, menuItems, onRefresh }: StallManagementProps) {
    const [isFormOpen, setIsFormOpen] = useState(false)
    const [editingStall, setEditingStall] = useState<StallTemplate | null>(null)
    const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; id: string | null }>({
        isOpen: false,
        id: null,
    })
    const [searchTerm, setSearchTerm] = useState('')

    const handleCreate = () => {
        setEditingStall(null)
        setIsFormOpen(true)
    }

    const handleEdit = (stall: StallTemplate) => {
        setEditingStall(stall)
        setIsFormOpen(true)
    }

    const handleDelete = (id: string) => {
        setDeleteConfirm({ isOpen: true, id })
    }

    const confirmDelete = async () => {
        if (!deleteConfirm.id) return
        try {
            await Storage.deleteStallTemplate(deleteConfirm.id)
            toast.success('Stall template deleted successfully!')
            onRefresh()
            setDeleteConfirm({ isOpen: false, id: null })
        } catch (error) {
            console.error('Failed to delete stall template:', error)
            toast.error('Failed to delete stall template')
        }
    }

    const filteredStalls = stallTemplates.filter(stall => 
        stall.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        stall.description?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="relative w-full sm:w-96">
                    <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search stalls by name or description..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                    />
                </div>
                <button
                    onClick={handleCreate}
                    className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-2.5 rounded-xl hover:bg-indigo-700 transition-all shadow-md hover:shadow-lg active:scale-95 font-medium"
                >
                    <FaPlus className="w-4 h-4" />
                    <span>Create Stall Template</span>
                </button>
            </div>

            {filteredStalls.length === 0 ? (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center">
                    <div className="bg-white w-16 h-16 rounded-2xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-slate-100">
                        <FaStore className="w-8 h-8 text-slate-300" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-700">No stall templates found</h3>
                    <p className="text-slate-500 mt-2 max-w-sm mx-auto">
                        Create your first stall template to group menu items together for quick ordering.
                    </p>
                    <button
                        onClick={handleCreate}
                        className="mt-6 text-indigo-600 font-medium hover:text-indigo-700 underline underline-offset-4"
                    >
                        Define your first stall template
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredStalls.map((stall) => (
                        <div 
                            key={stall.id} 
                            className="bg-white rounded-3xl border border-slate-200 p-6 hover:shadow-xl hover:-translate-y-1 transition-all group overflow-hidden relative"
                        >
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full -mr-16 -mt-16 group-hover:bg-indigo-100 transition-colors -z-0 opacity-50" />
                            
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="bg-indigo-600 p-3 rounded-2xl shadow-lg shadow-indigo-100">
                                        <FaStore className="w-5 h-5 text-white" />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => handleEdit(stall)}
                                            className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                                            title="Edit Stall"
                                        >
                                            <FaEdit className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(stall.id)}
                                            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                            title="Delete Stall"
                                        >
                                            <FaTrash className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                                <h3 className="text-xl font-bold text-slate-800 mb-2">{stall.name}</h3>
                                {stall.description && (
                                    <p className="text-slate-500 text-sm mb-4 line-clamp-2">{stall.description}</p>
                                )}

                                <div className="space-y-2 mt-4">
                                    <div className="flex items-center justify-between text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                                        <span>Included Items</span>
                                        <span className="bg-slate-100 px-2 py-0.5 rounded-full text-slate-600">{stall.menuItemIds.length}</span>
                                    </div>
                                    <div className="flex flex-wrap gap-1.5">
                                        {stall.menuItemIds.slice(0, 5).map(itemId => {
                                            const item = menuItems.find(m => m.id === itemId)
                                            return item ? (
                                                <span key={itemId} className="px-2.5 py-1 bg-slate-50 text-slate-600 text-xs rounded-full border border-slate-100">
                                                    {item.name}
                                                </span>
                                            ) : null
                                        })}
                                        {stall.menuItemIds.length > 5 && (
                                            <span className="px-2.5 py-1 bg-slate-50 text-slate-400 text-xs rounded-full border border-slate-100 italic">
                                                +{stall.menuItemIds.length - 5} more...
                                            </span>
                                        )}
                                    </div>
                                </div>
                                
                                <div className="mt-6 pt-4 border-t border-slate-50 flex items-center justify-between text-[11px] text-slate-400 font-medium">
                                    <div className="flex items-center gap-1">
                                        <FaHistory className="w-3 h-3" />
                                        <span>Updated {new Date(stall.updatedAt).toLocaleDateString()}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {isFormOpen && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] w-full max-w-2xl max-h-[90vh] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-200">
                        <StallForm
                            stall={editingStall}
                            menuItems={menuItems}
                            onClose={() => setIsFormOpen(false)}
                            onSuccess={() => {
                                setIsFormOpen(false)
                                onRefresh()
                            }}
                        />
                    </div>
                </div>
            )}

            <ConfirmModal
                isOpen={deleteConfirm.isOpen}
                title="Delete Stall Template"
                message="Are you sure you want to delete this stall template? This will not remove the menu items, just the group definition."
                confirmText="Delete Template"
                cancelText="Cancel"
                onConfirm={confirmDelete}
                onCancel={() => setDeleteConfirm({ isOpen: false, id: null })}
                variant="danger"
            />
        </div>
    )
}
