import React from 'react';
import { getMonthlyLateness } from '@/actions/attendance';
import Header from '@/components/Header';
import { Calendar, FileText, User, Clock, AlertCircle } from 'lucide-react';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import AdministrationClient from './AdministrationClient';

export default async function AdministrationPage({
    searchParams
}: {
    searchParams: Promise<{ month?: string; year?: string }>
}) {
    const params = await searchParams;
    const session = await getSession();
    if (!session || !['ADMIN', 'PIC', 'RT'].includes(session.role)) {
        redirect('/login');
    }

    const now = new Date();
    const currentMonth = params.month ? parseInt(params.month) : now.getMonth() + 1;
    const currentYear = params.year ? parseInt(params.year) : now.getFullYear();

    const result = await getMonthlyLateness(currentMonth, currentYear);
    const latenessData = result.success ? result.data : [];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <main className="p-4 md:p-8 w-full space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            Laporan <span className="text-indigo-600">Keterlambatan</span>
                        </h1>
                        <p className="text-sm text-slate-500 font-medium">
                            Rekapitulasi keterlambatan karyawan periode {currentMonth}/{currentYear}
                        </p>
                    </div>
                </div>

                <AdministrationClient
                    initialData={latenessData}
                    currentMonth={currentMonth}
                    currentYear={currentYear}
                />
            </main>
        </div>
    );
}
