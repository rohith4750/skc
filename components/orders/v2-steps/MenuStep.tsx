"use client";
import { useState, useMemo } from 'react'
import { FaSearch, FaPlus, FaUtensils, FaGripLines, FaTimes, FaMagic, FaBolt, FaChevronRight } from 'react-icons/fa'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { motion, AnimatePresence } from 'framer-motion'
import { MenuItem } from '@/types'
import { sanitizeMealLabel, formatCurrency } from '@/lib/utils'
import toast from 'react-hot-toast'

interface MenuStepProps {
    formData: any;
    setFormData: React.Dispatch<React.SetStateAction<any>>;
    menuItems: MenuItem[];
}

export default function MenuStep({ formData, setFormData, menuItems }: MenuStepProps) {
    const [activeSessionId, setActiveSessionId] = useState(formData.mealTypes[0]?.id || '')
    const [itemSearch, setItemSearch] = useState('')

    const activeSession = formData.mealTypes.find((mt: any) => mt.id === activeSessionId)

    const handleToggleItem = (itemId: string) => {
        if (!activeSessionId) return
        const item = menuItems.find(m => m.id === itemId)
        
        setFormData((prev: any) => ({
            ...prev,
            mealTypes: prev.mealTypes.map((mt: any) => {
                if (mt.id === activeSessionId) {
                    const isSelecting = !mt.selectedMenuItems.includes(itemId)
                    const updatedMt = {
                        ...mt,
                        selectedMenuItems: isSelecting
                            ? [...mt.selectedMenuItems, itemId]
                            : mt.selectedMenuItems.filter((i: string) => i !== itemId),
                    }

                    if (isSelecting && item?.description) {
                        updatedMt.itemCustomizations = {
                            ...mt.itemCustomizations,
                            [itemId]: item.description
                        }
                    }
                    if (isSelecting && !mt.itemQuantities[itemId]) {
                        updatedMt.itemQuantities = {
                            ...mt.itemQuantities,
                            [itemId]: '1'
                        }
                    }
                    return updatedMt
                }
                return mt
            })
        }))
    }

    const handleSelectCommon = () => {
        const commonItems = menuItems.filter(item => {
            const isCommonFlag = item.isCommon === true;
            const nameMatch = item.name.toLowerCase().includes('common');
            const typeMatch = item.type.some(t => t?.toLowerCase()?.includes('common'));
            return isCommonFlag || nameMatch || typeMatch;
        });

        if (commonItems.length === 0) {
            toast.error('No common items defined in menu.')
            return
        }

        const commonIds = commonItems.map(i => i.id)
        setFormData((prev: any) => ({
            ...prev,
            mealTypes: prev.mealTypes.map((mt: any) => {
                if (mt.id === activeSessionId) {
                    const uniqueIds = Array.from(new Set([...mt.selectedMenuItems, ...commonIds]))
                    const newCusts = { ...mt.itemCustomizations }
                    const newQtys = { ...mt.itemQuantities }
                    commonItems.forEach(i => {
                        if (!newCusts[i.id] && i.description) newCusts[i.id] = i.description
                        if (!newQtys[i.id]) newQtys[i.id] = '1'
                    })
                    return { ...mt, selectedMenuItems: uniqueIds, itemCustomizations: newCusts, itemQuantities: newQtys }
                }
                return mt
            })
        }))
        toast.success(`Added ${commonItems.length} common items`)
    }

    const onDragEnd = (result: any) => {
        if (!result.destination || !activeSessionId) return
        const { source, destination } = result

        setFormData((prev: any) => ({
            ...prev,
            mealTypes: prev.mealTypes.map((mt: any) => {
                if (mt.id === activeSessionId) {
                    const newItems = Array.from(mt.selectedMenuItems);
                    const [removed] = newItems.splice(source.index, 1);
                    newItems.splice(destination.index, 0, removed);
                    return { ...mt, selectedMenuItems: newItems }
                }
                return mt
            })
        }))
    }

    const filteredMenu = useMemo(() => {
        if (!activeSession) return []
        return menuItems.filter(item => {
            const search = itemSearch.toLowerCase()
            const matchesSearch = item.name.toLowerCase().includes(search) || item.description?.toLowerCase().includes(search)
            const matchesType = activeSession.menuType === 'special_order' || 
                               item.type.some(t => t?.toLowerCase() === activeSession.menuType?.toLowerCase())
            return matchesSearch && (matchesType || itemSearch.length > 0)
        })
    }, [menuItems, itemSearch, activeSession])

    if (formData.mealTypes.length === 0) {
        return (
            <div className="v2-card p-20 text-center space-y-4">
                <FaUtensils className="mx-auto text-gray-200" size={48} />
                <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">Please configure sessions in Step 2 first.</p>
            </div>
        )
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-[calc(100vh-280px)]">
            {/* Left Rail: Session Selector */}
            <div className="lg:col-span-3 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest block pl-2 mb-4">Active Sessions</span>
                {formData.mealTypes.map((mt: any) => (
                    <button
                        key={mt.id}
                        onClick={() => setActiveSessionId(mt.id)}
                        className={`w-full p-4 rounded-2xl text-left transition-all border-2 flex items-center justify-between group ${
                            activeSessionId === mt.id 
                            ? 'bg-primary-600 border-primary-600 text-white shadow-lg shadow-primary-900/10' 
                            : 'bg-white border-gray-100 text-gray-700 hover:border-primary-200'
                        }`}
                    >
                        <div className="min-w-0">
                            <div className="text-sm font-black truncate">{sanitizeMealLabel(mt.menuType) || 'DRAFT'}</div>
                            <div className={`text-[10px] font-bold mt-0.5 ${activeSessionId === mt.id ? 'text-primary-100' : 'text-gray-400'}`}>
                                {mt.selectedMenuItems.length} Items Selected
                            </div>
                        </div>
                        <FaChevronRight className={`transition-transform ${activeSessionId === mt.id ? 'translate-x-1 opacity-100' : 'opacity-0'}`} />
                    </button>
                ))}
            </div>

            {/* Middle: Item Browser */}
            <div className="lg:col-span-5 space-y-6 flex flex-col min-h-0">
                <div className="v2-card p-6 flex-1 flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-black text-gray-800 flex items-center gap-2">
                             Browser
                        </h3>
                        <div className="flex gap-2">
                            <button 
                                onClick={handleSelectCommon}
                                className="px-3 py-1.5 rounded-lg border border-amber-200 text-amber-600 font-black text-[9px] uppercase tracking-tighter hover:bg-amber-50"
                            >
                                <FaMagic className="inline mr-1" /> Common
                            </button>
                        </div>
                    </div>

                    <div className="relative mb-6">
                        <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            value={itemSearch}
                            onChange={(e) => setItemSearch(e.target.value)}
                            className="v2-input pl-12 h-12 text-sm font-bold bg-gray-50/50"
                            placeholder={`Search ${activeSession?.menuType || 'items'}...`}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-3 overflow-y-auto pr-2 custom-scrollbar content-start">
                        {filteredMenu.map(item => (
                            <button
                                key={item.id}
                                onClick={() => handleToggleItem(item.id)}
                                className={`p-3 rounded-2xl text-left border-2 transition-all relative overflow-hidden group ${
                                    activeSession?.selectedMenuItems.includes(item.id)
                                    ? 'bg-primary-50 border-primary-500 shadow-inner'
                                    : 'bg-white border-gray-50 hover:border-primary-200'
                                }`}
                            >
                                <div className={`text-xs font-black leading-tight ${activeSession?.selectedMenuItems.includes(item.id) ? 'text-primary-700' : 'text-gray-700'}`}>
                                    {item.name}
                                </div>
                                <div className="text-[9px] text-gray-400 font-bold mt-1 line-clamp-1 italic">{item.description || 'No description'}</div>
                                {activeSession?.selectedMenuItems.includes(item.id) && (
                                    <div className="absolute top-2 right-2">
                                        <div className="w-4 h-4 rounded-full bg-primary-600 flex items-center justify-center text-[10px] text-white">
                                            <FaBolt size={8} />
                                        </div>
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* Right: Selected Configuration */}
            <div className="lg:col-span-4 flex flex-col min-h-0">
                <div className="v2-card p-6 flex-1 flex flex-col min-h-0 border-primary-50">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-sm font-black text-gray-800 uppercase tracking-widest">Selected List</h3>
                        <span className="w-8 h-8 rounded-full bg-primary-100 text-primary-600 flex items-center justify-center text-xs font-black">
                            {activeSession?.selectedMenuItems.length || 0}
                        </span>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        {activeSession && activeSession.selectedMenuItems.length > 0 ? (
                            <DragDropContext onDragEnd={onDragEnd}>
                                <Droppable droppableId="selected-items">
                                    {(provided) => (
                                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                                            {activeSession.selectedMenuItems.map((itemId: string, idx: number) => {
                                                const item = menuItems.find(m => m.id === itemId)
                                                if (!item) return null
                                                return (
                                                    <Draggable key={itemId} draggableId={itemId} index={idx}>
                                                        {(provided) => (
                                                            <div
                                                                ref={provided.innerRef}
                                                                {...provided.draggableProps}
                                                                className="v2-glass p-3 rounded-2xl border-gray-100 group hover:border-primary-200 transition-all"
                                                            >
                                                                <div className="flex items-start gap-3">
                                                                    <div {...provided.dragHandleProps} className="mt-1 text-gray-300 cursor-grab active:cursor-grabbing hover:text-gray-500">
                                                                        <FaGripLines size={14} />
                                                                    </div>
                                                                    <div className="flex-1 min-w-0">
                                                                        <div className="flex justify-between items-start">
                                                                            <span className="text-xs font-black text-gray-800 truncate">{item.name}</span>
                                                                            <button 
                                                                                onClick={() => handleToggleItem(itemId)}
                                                                                className="text-gray-300 hover:text-red-500 transition-colors"
                                                                            >
                                                                                <FaTimes size={12} />
                                                                            </button>
                                                                        </div>
                                                                        <input 
                                                                            type="text"
                                                                            placeholder="Note/Customization..."
                                                                            value={activeSession.itemCustomizations[itemId] || ''}
                                                                            onChange={(e) => {
                                                                                const val = e.target.value
                                                                                setFormData((p: any) => ({
                                                                                    ...p,
                                                                                    mealTypes: p.mealTypes.map((mt: any) => mt.id === activeSessionId ? { ...mt, itemCustomizations: { ...mt.itemCustomizations, [itemId]: val } } : mt)
                                                                                }))
                                                                            }}
                                                                            className="w-full bg-transparent border-none text-[10px] text-gray-500 font-bold p-0 mt-1 focus:ring-0 placeholder:text-gray-300"
                                                                        />
                                                                        <div className="flex items-center gap-3 mt-3">
                                                                            <div className="flex items-center bg-white rounded-lg border border-gray-100 p-1">
                                                                                <span className="text-[8px] font-black text-gray-400 px-1.5 uppercase">Qty</span>
                                                                                <input 
                                                                                    type="number"
                                                                                    value={activeSession.itemQuantities[itemId] || '1'}
                                                                                    onChange={(e) => {
                                                                                        const val = e.target.value
                                                                                        setFormData((p: any) => ({
                                                                                            ...p,
                                                                                            mealTypes: p.mealTypes.map((mt: any) => mt.id === activeSessionId ? { ...mt, itemQuantities: { ...mt.itemQuantities, [itemId]: val } } : mt)
                                                                                        }))
                                                                                    }}
                                                                                    className="w-10 h-6 bg-transparent border-none text-[10px] font-black p-0 text-center focus:ring-0"
                                                                                />
                                                                            </div>
                                                                            {activeSession.menuType === 'saree' && (
                                                                                <div className="flex items-center bg-primary-50 rounded-lg border border-primary-100 p-1">
                                                                                    <span className="text-[8px] font-black text-primary-400 px-1.5 uppercase">Price</span>
                                                                                    <input 
                                                                                        type="number"
                                                                                        value={activeSession.itemPrices[itemId] || ''}
                                                                                        onChange={(e) => {
                                                                                            const val = e.target.value
                                                                                            setFormData((p: any) => ({
                                                                                                ...p,
                                                                                                mealTypes: p.mealTypes.map((mt: any) => mt.id === activeSessionId ? { ...mt, itemPrices: { ...mt.itemPrices, [itemId]: val } } : mt)
                                                                                            }))
                                                                                        }}
                                                                                        className="w-14 h-6 bg-transparent border-none text-[10px] font-black p-0 text-center text-primary-700 focus:ring-0"
                                                                                    />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </Draggable>
                                                )
                                            })}
                                            {provided.placeholder}
                                        </div>
                                    )}
                                </Droppable>
                            </DragDropContext>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-center p-8 space-y-4">
                                <div className="w-12 h-12 rounded-full bg-gray-50 flex items-center justify-center text-gray-200">
                                    <FaPlus size={20} />
                                </div>
                                <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">No items configured for this session</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}
