"use client";

import React from 'react'
import { toast } from 'sonner'
import { FaCheckCircle, FaExclamationCircle, FaInfoCircle, FaExclamationTriangle } from 'react-icons/fa'

export function showToast(
    type: 'success' | 'error' | 'info' | 'warning',
    message: string,
    description?: string
) {
    const config = {
        success: {
            icon: <FaCheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />,
            border: 'border-l-4 border-l-emerald-500 border-slate-200/80',
            bg: 'bg-white',
            titleColor: 'text-slate-900'
        },
        error: {
            icon: <FaExclamationCircle className="w-5 h-5 text-rose-500 shrink-0" />,
            border: 'border-l-4 border-l-rose-500 border-slate-200/80',
            bg: 'bg-white',
            titleColor: 'text-slate-900'
        },
        info: {
            icon: <FaInfoCircle className="w-5 h-5 text-indigo-500 shrink-0" />,
            border: 'border-l-4 border-l-indigo-500 border-slate-200/80',
            bg: 'bg-white',
            titleColor: 'text-slate-900'
        },
        warning: {
            icon: <FaExclamationTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
            border: 'border-l-4 border-l-amber-500 border-slate-200/80',
            bg: 'bg-white',
            titleColor: 'text-slate-900'
        }
    }[type];

    return toast.custom((t) => (
        <div
            className={`
                flex items-center gap-3.5 px-4 py-3.5 rounded-2xl ${config.bg} ${config.border}
                backdrop-blur-md w-full max-w-md transition-all duration-300 relative overflow-hidden shadow-xl
            `}
            style={{
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
            }}
        >
            <div className="shrink-0">{config.icon}</div>
            <div className="flex-1 min-w-0">
                <h4 className={`text-xs font-black uppercase tracking-wider ${config.titleColor}`}>
                    {message}
                </h4>
                {description && (
                    <p className="text-xs font-semibold text-slate-500 mt-0.5 leading-relaxed">
                        {description}
                    </p>
                )}
            </div>
        </div>
    ));
}
