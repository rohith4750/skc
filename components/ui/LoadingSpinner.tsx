"use client";

import React from 'react'

interface LoadingSpinnerProps {
    message?: string;
    subtext?: string;
    fullScreen?: boolean;
    size?: 'sm' | 'md' | 'lg';
}

export function LoadingSpinner({
    message = "Loading...",
    subtext = "Please wait a moment",
    fullScreen = false,
    size = 'md'
}: LoadingSpinnerProps) {
    const sizeClasses = {
        sm: 'w-8 h-8 border-2',
        md: 'w-12 h-12 border-[3px]',
        lg: 'w-16 h-16 border-4'
    }[size];

    const content = (
        <div className="flex flex-col items-center justify-center p-8 text-center animate-fade-in">
            <div className="relative flex items-center justify-center mb-5">
                {/* Glowing Ambient Backdrop Blur */}
                <div className="absolute w-20 h-20 rounded-full bg-gradient-to-tr from-amber-400/40 via-primary-500/30 to-indigo-500/40 blur-xl animate-pulse" />

                {/* Outer Rotating Dual-Gradient Ring */}
                <div className={`relative ${sizeClasses} rounded-full border-t-amber-500 border-r-primary-500 border-b-indigo-500 border-l-transparent animate-spin shadow-lg`} />

                {/* Inner Breathing Center Dot */}
                <div className="absolute w-3.5 h-3.5 rounded-full bg-gradient-to-r from-amber-500 to-primary-600 animate-ping opacity-75" />
            </div>

            {/* Premium Typography */}
            <h3 className="text-sm font-black text-slate-800 tracking-widest uppercase bg-gradient-to-r from-slate-900 via-slate-800 to-primary-800 bg-clip-text text-transparent">
                {message}
            </h3>
            {subtext && (
                <p className="text-xs font-semibold text-slate-400 mt-1.5 animate-pulse">
                    {subtext}
                </p>
            )}
        </div>
    );

    if (fullScreen) {
        return (
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/40 backdrop-blur-sm transition-all duration-300">
                <div className="bg-white/95 backdrop-blur-md rounded-2xl border border-slate-200/80 shadow-2xl max-w-sm w-full mx-4">
                    {content}
                </div>
            </div>
        );
    }

    return (
        <div className="w-full flex items-center justify-center py-12">
            <div className="bg-white/90 backdrop-blur-xs rounded-2xl border border-slate-200/80 shadow-sm">
                {content}
            </div>
        </div>
    );
}
