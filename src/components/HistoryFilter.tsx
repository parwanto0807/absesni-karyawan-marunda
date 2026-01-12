'use client';

import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { X, Loader2 } from 'lucide-react';

interface UserOption {
    id: string;
    name: string;
}

interface HistoryFilterProps {
    users?: UserOption[];
}

export default function HistoryFilter({ users }: HistoryFilterProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();

    const [userId, setUserId] = useState(searchParams.get('userId') || '');
    const [startDate, setStartDate] = useState(searchParams.get('startDate') || '');
    const [endDate, setEndDate] = useState(searchParams.get('endDate') || '');

    const applyFilters = (newUserId: string, newStartDate: string, newEndDate: string) => {
        const params = new URLSearchParams();

        if (newUserId) params.set('userId', newUserId);
        if (newStartDate) params.set('startDate', newStartDate);
        if (newEndDate) params.set('endDate', newEndDate);

        startTransition(() => {
            router.push(`${pathname}${params.toString() ? '?' + params.toString() : ''}`);
        });
    };

    const handleUserChange = (value: string) => {
        setUserId(value);
        applyFilters(value, startDate, endDate);
    };

    const handleStartDateChange = (value: string) => {
        setStartDate(value);
        applyFilters(userId, value, endDate);
    };

    const handleEndDateChange = (value: string) => {
        setEndDate(value);
        applyFilters(userId, startDate, value);
    };

    const handleReset = () => {
        setUserId('');
        setStartDate('');
        setEndDate('');
        startTransition(() => {
            router.push(pathname);
        });
    };

    const hasActiveFilters = searchParams.get('userId') || searchParams.get('startDate') || searchParams.get('endDate');

    return (
        <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 md:space-y-0 md:flex md:items-end md:gap-4 animate-in fade-in slide-in-from-top-4 duration-500 relative">
            {isPending && (
                <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 backdrop-blur-sm rounded-2xl flex items-center justify-center z-10">
                    <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
                </div>
            )}

            {users && (
                <div className="space-y-1 flex-1 md:max-w-xs">
                    <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Karyawan</label>
                    <div className="relative">
                        <select
                            value={userId}
                            onChange={(e) => handleUserChange(e.target.value)}
                            className="w-full h-10 pl-3 pr-8 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none appearance-none cursor-pointer text-slate-700 dark:text-slate-200"
                        >
                            <option value="">Semua Karyawan</option>
                            {users.map(u => (
                                <option key={u.id} value={u.id}>{u.name}</option>
                            ))}
                        </select>
                        <div className="absolute inset-y-0 right-3 flex items-center pointer-events-none text-slate-400">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                        </div>
                    </div>
                </div>
            )}

            <div className="space-y-1 flex-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Dari Tanggal</label>
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => handleStartDateChange(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-slate-700 dark:text-slate-200"
                />
            </div>

            <div className="space-y-1 flex-1">
                <label className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">Sampai Tanggal</label>
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => handleEndDateChange(e.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 outline-none text-slate-700 dark:text-slate-200"
                />
            </div>

            {hasActiveFilters && (
                <div className="flex gap-2 pt-1 md:pt-0">
                    <button
                        onClick={handleReset}
                        className="h-10 px-4 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-all flex items-center gap-2 active:scale-95 font-bold text-xs uppercase tracking-wider"
                        title="Reset Filter"
                    >
                        <X size={16} />
                        <span className="hidden md:inline">Reset</span>
                    </button>
                </div>
            )}
        </div>
    );
}
