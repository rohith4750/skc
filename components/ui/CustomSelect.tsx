"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FaChevronDown } from 'react-icons/fa';

export interface SelectOption {
    value: string;
    label: string;
}

interface CustomSelectProps extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, 'onChange' | 'value'> {
    value?: string | number;
    onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void;
    onValueChange?: (value: string) => void;
    options: SelectOption[];
    placeholder?: string;
    className?: string;
    triggerClassName?: string;
    disabled?: boolean;
    name?: string;
}

const STATUS_DOTS: Record<string, string> = {
    quotation: 'bg-purple-500',
    pending: 'bg-amber-500',
    in_progress: 'bg-blue-500',
    completed: 'bg-emerald-500',
    cancelled: 'bg-rose-500',
};

export function CustomSelect({
    value,
    onChange,
    onValueChange,
    options,
    placeholder = 'Select an option',
    className = '',
    triggerClassName = '',
    disabled = false,
    name,
    ...props
}: CustomSelectProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState<{ top: number; left: number; width: number; placeAbove: boolean }>({
        top: 0,
        left: 0,
        width: 0,
        placeAbove: false,
    });

    const hasValue = value !== undefined && value !== null && value !== '';
    const displayValue = options.find(opt => opt.value === String(value))?.label;
    const strVal = String(value || '').toLowerCase();
    const statusDotClass = hasValue ? STATUS_DOTS[strVal] : undefined;
    const hasEmptyOption = options.some(opt => opt.value === '');

    useEffect(() => {
        setMounted(true);
    }, []);

    const updateCoords = useCallback(() => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const dropdownHeight = Math.min(240, Math.max(80, (options.length + (placeholder && !hasEmptyOption ? 1 : 0)) * 36 + 12));
        const spaceBelow = window.innerHeight - rect.bottom;
        const placeAbove = spaceBelow < dropdownHeight && rect.top > dropdownHeight;

        let left = rect.left;
        let width = Math.max(rect.width, 120);

        if (left + width > window.innerWidth - 8) {
            left = Math.max(8, window.innerWidth - width - 8);
        }

        setCoords({
            top: placeAbove ? Math.max(8, rect.top - dropdownHeight - 4) : rect.bottom + 4,
            left: Math.max(8, left),
            width,
            placeAbove,
        });
    }, [options.length, placeholder, hasEmptyOption]);

    useEffect(() => {
        if (isOpen) {
            updateCoords();
            const handleScrollOrResize = () => updateCoords();
            window.addEventListener('scroll', handleScrollOrResize, true);
            window.addEventListener('resize', handleScrollOrResize);

            const handleClickOutside = (event: MouseEvent) => {
                const target = event.target as Node;
                if (
                    triggerRef.current && !triggerRef.current.contains(target) &&
                    dropdownRef.current && !dropdownRef.current.contains(target)
                ) {
                    setIsOpen(false);
                }
            };
            document.addEventListener('mousedown', handleClickOutside);

            return () => {
                window.removeEventListener('scroll', handleScrollOrResize, true);
                window.removeEventListener('resize', handleScrollOrResize);
                document.removeEventListener('mousedown', handleClickOutside);
            };
        }
    }, [isOpen, updateCoords]);

    const handleSelect = (optionValue: string) => {
        if (disabled) return;

        if (onValueChange) {
            onValueChange(optionValue);
        }

        if (onChange) {
            const event = {
                target: { value: optionValue, name: name || '' },
                currentTarget: { value: optionValue, name: name || '' },
                preventDefault: () => { },
                stopPropagation: () => { },
            } as unknown as React.ChangeEvent<HTMLSelectElement>;
            onChange(event);
        }

        setIsOpen(false);
    };

    return (
        <div className={`relative inline-block ${className}`}>
            <button
                ref={triggerRef}
                type="button"
                disabled={disabled}
                data-open={isOpen ? 'true' : 'false'}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`custom-select-trigger bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 transition-all text-slate-800 font-bold ${triggerClassName}`}
            >
                <span className="flex items-center gap-2 truncate text-left leading-5">
                    {statusDotClass && (
                        <span className={`w-2 h-2 rounded-full shrink-0 ${statusDotClass}`} />
                    )}
                    <span className={hasValue && displayValue ? 'text-slate-800' : 'text-slate-400'}>
                        {(hasValue && displayValue) ? displayValue : placeholder}
                    </span>
                </span>
                <FaChevronDown
                    className={`flex-shrink-0 ml-2 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary-600' : ''}`}
                    size={11}
                />
            </button>

            {isOpen && mounted && createPortal(
                <div
                    ref={dropdownRef}
                    className="fixed py-1.5 overflow-auto rounded-xl border border-slate-200/90 shadow-2xl bg-white !bg-white animate-fade-in"
                    style={{
                        position: 'fixed',
                        top: `${coords.top}px`,
                        left: `${coords.left}px`,
                        width: `${coords.width}px`,
                        maxHeight: '240px',
                        backgroundColor: '#ffffff',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.15)',
                        zIndex: 999999,
                    }}
                >
                    {placeholder && !hasEmptyOption && (
                        <div
                            onClick={() => handleSelect('')}
                            className={`
                                px-4 py-2 text-xs font-semibold cursor-pointer hover:bg-slate-50 transition-colors bg-white
                                ${!hasValue ? 'text-primary-600 bg-primary-50/50 font-bold' : 'text-slate-400'}
                            `}
                        >
                            {placeholder}
                        </div>
                    )}

                    {options.map((opt, i) => {
                        const isSelected = String(value) === opt.value;
                        const optDotClass = STATUS_DOTS[opt.value.toLowerCase()];

                        return (
                            <div
                                key={i}
                                onClick={() => handleSelect(opt.value)}
                                className={`
                                    px-4 py-2 text-xs cursor-pointer transition-colors flex items-center justify-between
                                    ${isSelected
                                        ? 'text-primary-600 bg-primary-50/60 font-bold'
                                        : 'text-slate-700 hover:bg-slate-50 font-medium'
                                    }
                                `}
                            >
                                <span className="flex items-center gap-2">
                                    {optDotClass && (
                                        <span className={`w-2 h-2 rounded-full shrink-0 ${optDotClass}`} />
                                    )}
                                    <span>{opt.label}</span>
                                </span>

                                {isSelected && (
                                    <span className="w-1.5 h-1.5 rounded-full bg-primary-600 shrink-0" />
                                )}
                            </div>
                        );
                    })}
                </div>,
                document.body
            )}
        </div>
    );
}
