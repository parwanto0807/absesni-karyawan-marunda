'use client';

import React, { useState } from 'react';
import { UserPlus, Filter, Download } from 'lucide-react';
import EmployeeDialog from '@/components/EmployeeDialog';

export default function EmployeeHeader() {
    const [isCreateOpen, setIsCreateOpen] = useState(false);

    return (
        <>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Data Karyawan</h1>
                    <p className="text-slate-500 dark:text-slate-400">Kelola informasi seluruh personil security dan staff Marunda Center.</p>
                </div>

                <div className="flex items-center space-x-3">
                    <button className="flex items-center space-x-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 transition-all">
                        <Filter size={18} />
                        <span>Filter</span>
                    </button>
                    <button className="flex items-center space-x-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 transition-all">
                        <Download size={18} />
                        <span>Export</span>
                    </button>
                    <button
                        onClick={() => setIsCreateOpen(true)}
                        className="flex items-center space-x-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
                    >
                        <UserPlus size={18} />
                        <span>Tambah Karyawan</span>
                    </button>
                </div>
            </div>

            <EmployeeDialog
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
            />
        </>
    );
}
