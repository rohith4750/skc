"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FaCalendarAlt, FaChevronLeft, FaChevronRight, FaTimes } from 'react-icons/fa';

interface CustomDatePickerProps {
    value?: string; // YYYY-MM-DD
    onChange?: (dateStr: string) => void;
    placeholder?: string;
    className?: string;
    disabled?: boolean;
}

const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
];

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export function CustomDatePicker({
    value = '',
    onChange,
    placeholder = 'dd-mm-yyyy',
    className = '',
    disabled = false,
}: CustomDatePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [mounted, setMounted] = useState(false);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const popoverRef = useRef<HTMLDivElement>(null);
    const [coords, setCoords] = useState<{ top: number; left: number }>({ top: 0, left: 0 });

    const parsedDate = React.useMemo(() => {
        if (!value) return null;
        const [y, m, d] = value.split('-').map(Number);
        if (y && m && d) {
            return new Date(y, m - 1, d);
        }
        return null;
    }, [value]);

    const [viewDate, setViewDate] = useState<Date>(() => parsedDate || new Date());

    useEffect(() => {
        setMounted(true);
    }, []);

    useEffect(() => {
        if (parsedDate) {
            setViewDate(parsedDate);
        }
    }, [parsedDate]);

    const updateCoords = useCallback(() => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const popoverWidth = 288;
        const popoverHeight = 320;
        const spaceBelow = window.innerHeight - rect.bottom;
        const placeAbove = spaceBelow < popoverHeight && rect.top > popoverHeight;

        let left = rect.left;
        if (left + popoverWidth > window.innerWidth - 8) {
            left = Math.max(8, window.innerWidth - popoverWidth - 8);
        }

        setCoords({
            top: placeAbove ? Math.max(8, rect.top - popoverHeight - 4) : rect.bottom + 4,
            left: Math.max(8, left),
        });
    }, []);

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
                    popoverRef.current && !popoverRef.current.contains(target)
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

    const displayString = React.useMemo(() => {
        if (!parsedDate) return '';
        const day = parsedDate.getDate();
        const month = MONTH_NAMES[parsedDate.getMonth()];
        const year = parsedDate.getFullYear();
        return `${day} ${month}, ${year}`;
    }, [parsedDate]);

    const prevMonth = () => {
        setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const nextMonth = () => {
        setViewDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const handleSelectDay = (day: number) => {
        const selectedYear = viewDate.getFullYear();
        const selectedMonth = viewDate.getMonth() + 1;
        const formatted = `${selectedYear}-${String(selectedMonth).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
        onChange?.(formatted);
        setIsOpen(false);
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange?.('');
        setIsOpen(false);
    };

    const handleSetToday = () => {
        const today = new Date();
        const y = today.getFullYear();
        const m = today.getMonth() + 1;
        const d = today.getDate();
        const formatted = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
        onChange?.(formatted);
        setIsOpen(false);
    };

    const currentYear = viewDate.getFullYear();
    const currentMonth = viewDate.getMonth();

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfWeek = new Date(currentYear, currentMonth, 1).getDay();
    const prevMonthDays = new Date(currentYear, currentMonth, 0).getDate();

    const todayDate = new Date();
    const isTodayInCurrentView =
        todayDate.getFullYear() === currentYear && todayDate.getMonth() === currentMonth;

    return (
        <div className={`relative inline-block ${className}`}>
            <button
                ref={triggerRef}
                type="button"
                disabled={disabled}
                data-open={isOpen ? 'true' : 'false'}
                onClick={() => !disabled && setIsOpen(!isOpen)}
                className={`custom-date-picker-trigger bg-white border border-slate-200 hover:border-slate-300 rounded-xl px-3.5 transition-all text-slate-800 font-bold select-none ${className}`}
            >
                <span className={`truncate leading-5 ${parsedDate ? 'text-slate-800' : 'text-slate-400 font-medium'}`}>
                    {displayString || placeholder}
                </span>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {parsedDate && (
                        <button
                            type="button"
                            onClick={handleClear}
                            className="text-slate-400 hover:text-red-500 transition-colors p-0.5"
                            title="Clear date"
                        >
                            <FaTimes size={10} />
                        </button>
                    )}
                    <FaCalendarAlt className="text-slate-500" size={13} />
                </div>
            </button>

            {isOpen && mounted && createPortal(
                <div
                    ref={popoverRef}
                    className="fixed bg-white rounded-2xl border border-slate-200/90 shadow-2xl p-4 w-72 select-none animate-fade-in"
                    style={{
                        position: 'fixed',
                        top: `${coords.top}px`,
                        left: `${coords.left}px`,
                        backgroundColor: '#ffffff',
                        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.25), 0 8px 10px -6px rgba(0, 0, 0, 0.15)',
                        zIndex: 999999,
                    }}
                >
                    <div className="flex items-center justify-between mb-4 px-1">
                        <div className="text-base font-black text-slate-800">
                            {MONTH_NAMES[currentMonth]} {currentYear}
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                type="button"
                                onClick={prevMonth}
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                            >
                                <FaChevronLeft size={11} />
                            </button>
                            <button
                                type="button"
                                onClick={nextMonth}
                                className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-600 transition-colors"
                            >
                                <FaChevronRight size={11} />
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center mb-2">
                        {WEEKDAYS.map(day => (
                            <div key={day} className="text-xs font-bold text-slate-400 py-1">
                                {day}
                            </div>
                        ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1 text-center">
                        {Array.from({ length: firstDayOfWeek }).map((_, idx) => {
                            const pDay = prevMonthDays - firstDayOfWeek + idx + 1;
                            return (
                                <div key={`prev-${idx}`} className="text-xs text-slate-300 py-1.5 font-medium">
                                    {pDay}
                                </div>
                            );
                        })}

                        {Array.from({ length: daysInMonth }).map((_, idx) => {
                            const dayNum = idx + 1;
                            const isSelected =
                                parsedDate &&
                                parsedDate.getFullYear() === currentYear &&
                                parsedDate.getMonth() === currentMonth &&
                                parsedDate.getDate() === dayNum;

                            const isToday = isTodayInCurrentView && todayDate.getDate() === dayNum;

                            return (
                                <button
                                    key={dayNum}
                                    type="button"
                                    onClick={() => handleSelectDay(dayNum)}
                                    className={`
                                        h-8 w-8 text-xs font-bold rounded-full flex items-center justify-center mx-auto transition-all
                                        ${isSelected
                                            ? 'bg-slate-800 text-white shadow-md'
                                            : isToday
                                                ? 'bg-slate-100 text-slate-800 ring-1 ring-slate-400'
                                                : 'text-slate-700 hover:bg-slate-100'
                                        }
                                    `}
                                >
                                    {dayNum}
                                </button>
                            );
                        })}
                    </div>

                    <div className="flex items-center justify-between pt-3 mt-3 border-t border-slate-100 text-xs font-bold">
                        <button
                            type="button"
                            onClick={handleSetToday}
                            className="text-primary-600 hover:text-primary-700 transition-colors"
                        >
                            Today
                        </button>
                        {parsedDate && (
                            <button
                                type="button"
                                onClick={handleClear}
                                className="text-slate-400 hover:text-red-500 transition-colors"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
