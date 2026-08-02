"use client";

import React, { useState, useRef, useEffect } from 'react';
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
    const wrapperRef = useRef<HTMLDivElement>(null);

    const hasValue = value !== undefined && value !== null && value !== '';
    const displayValue = options.find(opt => opt.value === String(value))?.label;
    const strVal = String(value || '').toLowerCase();
    const statusDotClass = hasValue ? STATUS_DOTS[strVal] : undefined;

    const hasEmptyOption = options.some(opt => opt.value === '');

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

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
        <div ref={wrapperRef} className={`relative ${isOpen ? 'z-[9999]' : 'z-30'} ${className}`}>
            {/* Trigger button — clean white background with subtle border and crisp text */}
            <button
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
                    className={`flex-shrink-0 ml-2 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-primary-600' : ''
                        }`}
                    size={11}
                />
            </button>

            {/* Dropdown menu — solid white card floating above all sibling z-index contexts (z-[9999]) */}
            {isOpen && (
                <div
                    className="absolute z-[9999] w-full min-w-[120px] left-0 mt-1 bg-white !bg-white py-1.5 overflow-auto rounded-xl border border-slate-200/90 shadow-2xl"
                    style={{
                        maxHeight: '240px',
                        backgroundColor: '#ffffff',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
                    }}
                >
                    {/* Placeholder / clear option (only render if options doesn't already have empty value) */}
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
                </div>
            )}
        </div>
    );
}
