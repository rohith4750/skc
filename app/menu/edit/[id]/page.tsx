"use client";
import MenuForm from '@/components/menu/MenuForm'
import Link from 'next/link'
import { FaChevronLeft } from 'react-icons/fa'

export default function EditMenuItemPage({ params }: { params: { id: string } }) {
    const { id } = params

    return (
        <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 min-h-screen bg-slate-50/50">
            <div className="max-w-3xl mx-auto">
                <div className="mb-6">
                    <Link
                        href="/menu"
                        className="inline-flex items-center text-slate-500 hover:text-indigo-600 transition-colors gap-2 text-sm font-medium mb-4"
                    >
                        <FaChevronLeft className="w-3 h-3" />
                        Back to Menu
                    </Link>
                    <h1 className="text-3xl font-bold text-slate-900 tracking-tight">Edit Menu Item</h1>
                    <p className="text-slate-500 mt-1">Update the details of this menu item</p>
                </div>

                <MenuForm id={id} />
            </div>
        </div>
    )
}
