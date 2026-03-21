"use client";
import CustomerForm from "@/components/customers/CustomerForm";
import { FaArrowLeft } from "react-icons/fa";
import Link from "next/link";

export default function EditCustomerPage({ params }: { params: { id: string } }) {
    const { id } = params;

    return (
        <div className="p-4 sm:p-6 lg:p-8 pt-16 lg:pt-8 min-h-screen bg-gray-50">
            {/* Header */}
            <div className="mb-6">
                <Link
                    href="/customers"
                    className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4 transition-colors"
                >
                    <FaArrowLeft className="w-4 h-4" />
                    <span className="text-sm font-medium">Back to Customers</span>
                </Link>
                <h1 className="text-3xl font-bold text-gray-900">Edit Customer</h1>
                <p className="text-gray-600 mt-1">Update customer information</p>
            </div>

            <CustomerForm id={id} />
        </div>
    );
}
