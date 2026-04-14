"use client";
import { useState, useEffect, useRef } from 'react';
import { FaUser, FaCalendarAlt, FaMapMarkerAlt, FaPlus, FaTrash, FaCalculator, FaWallet, FaTimes, FaCheck } from 'react-icons/fa';
import { Customer } from '@/types';
import { Storage } from '@/lib/storage-api';
import { formatCurrency, getLocalISODate } from '@/lib/utils';
import { toast } from 'sonner';

interface QuickBillFormProps {
    onSuccess: (newBill: any) => void;
    onCancel: () => void;
}

const DEFAULT_SESSIONS: any[] = [];

const SESSION_TYPES = [
    'Breakfast',
    'Morning Tiffin',
    'Welcome Drinks',
    'Muhurtham',
    'Muhurtham Breakfast',
    'Muhurtham Lunch',
    'Reception',
    'Reception Dinner',
    'Lunch',
    'Hi-Tea',
    'Dinner',
    'Engagement',
    'Birthday',
    'Saree Function',
    'Half Saree',
    'Snacks',
    'Sweets',
    'Special Order',
    'Other'
];

export default function QuickBillForm({ onSuccess, onCancel }: QuickBillFormProps) {
    const [customers, setCustomers] = useState<Customer[]>([]);
    const [searchQuery, setSearchQuery] = useState('');
    const [showDropdown, setShowDropdown] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [form, setForm] = useState({
        customerId: '',
        customerName: '',
        customerPhone: '',
        eventName: '',
        eventDate: getLocalISODate(),
        eventVenue: '',
        sessions: [...DEFAULT_SESSIONS],
        transportCost: '',
        discount: '',
        advancePaid: '',
        paymentMethod: 'cash'
    });

    useEffect(() => {
        loadCustomers();
        const handleClickOutside = (e: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const loadCustomers = async () => {
        try {
            const data = await Storage.getCustomers();
            setCustomers(data);
        } catch (error) {
            console.error('Failed to load customers', error);
        }
    };

    const filteredCustomers = customers.filter(c => 
        c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
        c.phone.includes(searchQuery)
    ).slice(0, 5);

    const handleSelectCustomer = (c: Customer) => {
        setForm(prev => ({ ...prev, customerId: c.id, customerName: c.name, customerPhone: c.phone }));
        setSearchQuery(c.name);
        setShowDropdown(false);
    };

    const handleAddSession = () => {
        setForm(prev => ({
            ...prev,
            sessions: [...prev.sessions, { type: '', plates: '', rate: '', amount: '', date: prev.eventDate }]
        }));
    };

    const handleRemoveSession = (index: number) => {
        setForm(prev => ({
            ...prev,
            sessions: prev.sessions.filter((_, i) => i !== index)
        }));
    };

    const updateSession = (index: number, field: string, value: string) => {
        const newSessions = [...form.sessions];
        newSessions[index] = { ...newSessions[index], [field]: value };

        // Auto-calculate amount if plates and rate are present
        if (field === 'plates' || field === 'rate') {
            const plates = parseFloat(field === 'plates' ? value : newSessions[index].plates) || 0;
            const rate = parseFloat(field === 'rate' ? value : newSessions[index].rate) || 0;
            if (plates && rate) {
                newSessions[index].amount = (plates * rate).toString();
            }
        }

        setForm(prev => ({ ...prev, sessions: newSessions }));
    };

    const calculateTotal = () => {
        const sessionTotal = form.sessions.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
        const transport = parseFloat(form.transportCost) || 0;
        const discount = parseFloat(form.discount) || 0;
        return Math.max(0, sessionTotal + transport - discount);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Basic Validation
        if (!form.customerId && !searchQuery) {
            toast.error('Please select or enter customer name');
            return;
        }
        if (form.sessions.length === 0) {
            toast.error('Please add at least one session');
            return;
        }

        setIsSubmitting(true);
        try {
            const payload = {
                customer: form.customerId ? { id: form.customerId } : { name: searchQuery, phone: form.customerPhone },
                eventDetails: { name: form.eventName, date: form.eventDate, venue: form.eventVenue },
                sessions: form.sessions,
                financials: {
                    transport: form.transportCost,
                    discount: form.discount,
                    advancePaid: form.advancePaid,
                    paymentMethod: form.paymentMethod
                }
            };

            const response = await fetch('/api/bills/direct', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.details || err.error || 'Failed to create bill');
            }

            const newBill = await response.json();
            toast.success('Bill generated successfully!');
            onSuccess(newBill);
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const totalCalculated = calculateTotal();

    return (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-2xl overflow-hidden mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="bg-indigo-600 px-6 py-4 flex items-center justify-between text-white">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center backdrop-blur-md">
                        <FaPlus className="text-white" />
                    </div>
                    <div>
                        <h2 className="font-black text-lg">Quick Bill Generation</h2>
                        <p className="text-xs text-indigo-100">Create bill for unrecorded orders</p>
                    </div>
                </div>
                <button 
                    onClick={onCancel}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors"
                >
                    <FaTimes />
                </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 md:p-8 space-y-8">
                {/* Section 1: Customer & Event Header */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="relative" ref={dropdownRef}>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Customer Name</label>
                        <div className="relative">
                            <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    setShowDropdown(true);
                                    if (form.customerId) setForm(prev => ({ ...prev, customerId: '', customerPhone: '' }));
                                }}
                                onFocus={() => setShowDropdown(true)}
                                placeholder="Search or Enter Name"
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700"
                            />
                        </div>
                        {showDropdown && (searchQuery || filteredCustomers.length > 0) && (
                            <div className="absolute z-10 w-full mt-2 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
                                {filteredCustomers.map(c => (
                                    <button
                                        key={c.id}
                                        type="button"
                                        onClick={() => handleSelectCustomer(c)}
                                        className="w-full px-4 py-3 text-left hover:bg-slate-50 flex flex-col border-b border-slate-100 last:border-0"
                                    >
                                        <span className="font-bold text-slate-700">{c.name}</span>
                                        <span className="text-xs text-slate-500">{c.phone}</span>
                                    </button>
                                ))}
                                {!form.customerId && searchQuery && (
                                    <div className="px-4 py-3 bg-indigo-50 text-indigo-600 text-xs font-bold">
                                        Creating new customer entry...
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {!form.customerId && (
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Phone Number</label>
                            <input
                                type="tel"
                                value={form.customerPhone}
                                onChange={(e) => setForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                                placeholder="Phone Number"
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700"
                            />
                        </div>
                    )}

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Event Name</label>
                        <input
                            type="text"
                            value={form.eventName}
                            onChange={(e) => setForm(prev => ({ ...prev, eventName: e.target.value }))}
                            placeholder="e.g., Marriage, Reception"
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700"
                        />
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Main Event Date</label>
                        <div className="relative">
                            <FaCalendarAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="date"
                                value={form.eventDate}
                                onChange={(e) => {
                                    setForm(prev => ({ 
                                        ...prev, 
                                        eventDate: e.target.value,
                                        sessions: prev.sessions.map(s => ({ ...s, date: e.target.value }))
                                    }));
                                }}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Venue</label>
                        <div className="relative">
                            <FaMapMarkerAlt className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                            <input
                                type="text"
                                value={form.eventVenue}
                                onChange={(e) => setForm(prev => ({ ...prev, eventVenue: e.target.value }))}
                                placeholder="Function Hall Name"
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none font-bold text-slate-700"
                            />
                        </div>
                    </div>
                </div>

                {/* Section 2: Session Breakdown */}
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                            <div className="w-2 h-6 bg-indigo-500 rounded-full"></div>
                            Session Breakdown
                        </h3>
                        <button
                            type="button"
                            onClick={handleAddSession}
                            className="flex items-center gap-2 px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-all text-xs font-bold"
                        >
                            <FaPlus /> Add Session
                        </button>
                    </div>

                    <div className="overflow-x-auto rounded-2xl border border-slate-100">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-left">
                                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Session Type</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Event Date</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Plates</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Rate/Plate</th>
                                    <th className="px-4 py-3 text-[10px] font-black text-slate-400 uppercase tracking-widest whitespace-nowrap">Total Amount</th>
                                    <th className="px-4 py-3 text-right"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {form.sessions.map((session, idx) => (
                                    <tr key={idx} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="p-2">
                                            <select
                                                value={session.type}
                                                onChange={(e) => updateSession(idx, 'type', e.target.value)}
                                                className="w-full px-3 py-2 bg-transparent border-0 focus:ring-0 font-bold text-slate-700 outline-none cursor-pointer"
                                            >
                                                <option value="">Select Type</option>
                                                {SESSION_TYPES.map(type => (
                                                    <option key={type} value={type}>{type}</option>
                                                ))}
                                            </select>
                                        </td>
                                        <td className="p-2">
                                            <input
                                                type="date"
                                                value={session.date}
                                                onChange={(e) => updateSession(idx, 'date', e.target.value)}
                                                className="w-full px-3 py-2 bg-transparent border-0 focus:ring-0 font-medium text-slate-600"
                                            />
                                        </td>
                                        <td className="p-2 w-28">
                                            <input
                                                type="number"
                                                value={session.plates}
                                                onChange={(e) => updateSession(idx, 'plates', e.target.value)}
                                                placeholder="0"
                                                className="w-full px-3 py-2 bg-transparent border-0 focus:ring-0 font-bold text-slate-700"
                                            />
                                        </td>
                                        <td className="p-2 w-28">
                                            <div className="flex items-center">
                                                <span className="text-slate-400 text-xs">₹</span>
                                                <input
                                                    type="number"
                                                    value={session.rate}
                                                    onChange={(e) => updateSession(idx, 'rate', e.target.value)}
                                                    placeholder="0"
                                                    className="w-full px-1 py-2 bg-transparent border-0 focus:ring-0 font-bold text-slate-700"
                                                />
                                            </div>
                                        </td>
                                        <td className="p-2 w-36">
                                            <div className="flex items-center bg-slate-100/50 rounded-lg px-2">
                                                <span className="text-slate-400 text-xs">₹</span>
                                                <input
                                                    type="number"
                                                    value={session.amount}
                                                    onChange={(e) => updateSession(idx, 'amount', e.target.value)}
                                                    className="w-full px-1 py-1.5 bg-transparent border-0 focus:ring-0 font-black text-indigo-600"
                                                />
                                            </div>
                                        </td>
                                        <td className="p-2 text-right">
                                            <button
                                                type="button"
                                                onClick={() => handleRemoveSession(idx)}
                                                className="p-2 text-slate-300 hover:text-red-500 transition-colors"
                                            >
                                                <FaTrash size={14} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Section 3: Financials & Payment */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                    <div className="bg-slate-50 p-6 rounded-3xl space-y-4 border border-slate-100">
                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                            <FaCalculator /> Summary & Adjustments
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Transport Cost</label>
                                <input
                                    type="number"
                                    value={form.transportCost}
                                    onChange={(e) => setForm(prev => ({ ...prev, transportCost: e.target.value }))}
                                    placeholder="₹ 0"
                                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none font-bold"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-600 mb-1">Total Discount</label>
                                <input
                                    type="number"
                                    value={form.discount}
                                    onChange={(e) => setForm(prev => ({ ...prev, discount: e.target.value }))}
                                    placeholder="₹ 0"
                                    className="w-full px-4 py-2 bg-white border border-slate-200 rounded-xl outline-none font-bold text-red-600 underline-offset-4"
                                />
                            </div>
                        </div>

                        <div className="pt-4 border-t border-slate-200 flex justify-between items-center">
                            <span className="text-sm font-black text-slate-800 uppercase">Gross Bill Amount</span>
                            <span className="text-2xl font-black text-indigo-600 tracking-tighter">{formatCurrency(totalCalculated)}</span>
                        </div>
                    </div>

                    <div className="bg-indigo-50/50 p-6 rounded-3xl space-y-4 border border-indigo-100">
                        <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest flex items-center gap-2">
                            <FaWallet /> Initial Payment (Advance)
                        </h4>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-indigo-800 mb-1">Advance Amount</label>
                                <input
                                    type="number"
                                    value={form.advancePaid}
                                    onChange={(e) => setForm(prev => ({ ...prev, advancePaid: e.target.value }))}
                                    placeholder="Enter amount"
                                    className="w-full px-4 py-2 bg-white border border-indigo-200 rounded-xl outline-none font-bold text-emerald-600"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-indigo-800 mb-1">Payment Method</label>
                                <select
                                    value={form.paymentMethod}
                                    onChange={(e) => setForm(prev => ({ ...prev, paymentMethod: e.target.value }))}
                                    className="w-full px-4 py-2 bg-white border border-indigo-200 rounded-xl outline-none font-bold text-slate-700"
                                >
                                    <option value="cash">Cash</option>
                                    <option value="upi">UPI / GPay</option>
                                    <option value="bank_transfer">Bank Transfer</option>
                                    <option value="cheque">Cheque</option>
                                </select>
                            </div>
                        </div>
                        <div className="pt-2">
                            <p className="text-[10px] text-indigo-400 font-bold italic">This payment will be immediately recorded in the bill history.</p>
                        </div>
                    </div>
                </div>

                {/* Footer Actions */}
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 mt-6 border-t border-slate-100">
                    <div className="text-left">
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Calculated Balance Due</div>
                        <div className="text-xl font-black text-red-500 tracking-tighter">{formatCurrency(Math.max(0, totalCalculated - (parseFloat(form.advancePaid) || 0)))}</div>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto">
                        <button
                            type="button"
                            onClick={onCancel}
                            className="flex-1 sm:flex-none px-8 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black hover:bg-slate-200 transition-all"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-12 py-3 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 disabled:opacity-50 active:scale-95"
                        >
                            {isSubmitting ? (
                              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                              <><FaCheck /> Generate Full Bill</>
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}
