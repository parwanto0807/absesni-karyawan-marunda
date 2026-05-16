import React from 'react';
import { getMonthlyLateness } from '@/actions/attendance';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import AdministrationClient from './AdministrationClient';
import AnnouncementClient from './AnnouncementClient';
import PatrolCheckpointClient from './PatrolCheckpointClient';

export default async function AdministrationPage({
    searchParams
}: {
    searchParams: Promise<{ month?: string; year?: string; endMonth?: string; endYear?: string; tab?: string }>
}) {
    const params = await searchParams;
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
        redirect('/login');
    }

    const now = new Date();
    const currentMonth = params.month ? parseInt(params.month) : now.getMonth() + 1;
    const currentYear = params.year ? parseInt(params.year) : now.getFullYear();
    const endMonth = params.endMonth ? parseInt(params.endMonth) : currentMonth;
    const endYear = params.endYear ? parseInt(params.endYear) : currentYear;

    const result = await getMonthlyLateness(currentMonth, currentYear, endMonth, endYear);
    const latenessData = result.success ? result.data : [];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <main className="p-4 md:p-8 w-full space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            Administrasi <span className="text-indigo-600">HRD</span>
                        </h1>
                        <p className="text-sm text-slate-500 font-medium">
                            Pemrosesan dokumen HRD, laporan, dan pengumuman resmi.
                        </p>
                    </div>
                </div>

                {/* Tabs Navigation */}
                <div className="flex items-center space-x-2 border-b border-slate-200 dark:border-slate-800 pb-px mb-6 overflow-x-auto hide-scrollbar">
                    <a
                        href={`/admin/administration?tab=lateness&month=${currentMonth}&year=${currentYear}`}
                        className={`px-4 py-2.5 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 ${(!params.tab || params.tab === 'lateness')
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                            }`}
                    >
                        📝 Laporan Keterlambatan
                    </a>
                    <a
                        href={`/admin/administration?tab=announcement&month=${currentMonth}&year=${currentYear}`}
                        className={`px-4 py-2.5 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 ${params.tab === 'announcement'
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                            }`}
                    >
                        📢 Pengumuman Resmi
                    </a>
                    <a
                        href={`/admin/administration?tab=patrol&month=${currentMonth}&year=${currentYear}`}
                        className={`px-4 py-2.5 text-xs font-black uppercase tracking-widest whitespace-nowrap transition-colors border-b-2 ${params.tab === 'patrol'
                            ? 'border-indigo-600 text-indigo-600 dark:text-indigo-400'
                            : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                            }`}
                    >
                        🛡️ Titik Patroli
                    </a>
                </div>

                {/* Tab Content */}
                {(!params.tab || params.tab === 'lateness') && (
                    <AdministrationClient
                        initialData={latenessData}
                        currentMonth={currentMonth}
                        currentYear={currentYear}
                        endMonth={endMonth}
                        endYear={endYear}
                    />
                )}

                {params.tab === 'announcement' && (
                    <AnnouncementClient />
                )}

                {params.tab === 'patrol' && (
                    <PatrolCheckpointClient />
                )}
            </main>
        </div>
    );
}
