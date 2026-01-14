import React from 'react';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import IncidentCenter from '@/components/IncidentCenter';
import { AlertTriangle } from 'lucide-react';

export default async function AdminIncidentsPage() {
    const session = await getSession();
    if (!session || (session.role !== 'ADMIN' && session.role !== 'PIC' && session.role !== 'RT')) {
        redirect('/login');
    }

    return (
        <div className="px-0 md:px-8 space-y-4 md:space-y-8 pb-24 pt-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-4 md:px-0">
                <div>
                    <h1 className="text-lg md:text-4xl font-black text-slate-900 dark:text-white uppercase tracking-tighter">Incident Monitoring</h1>
                    <div className="flex items-center gap-2 mt-1">
                        <div className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-[10px] font-black uppercase tracking-widest">
                            <AlertTriangle size={12} />
                            Pusat Monitoring
                        </div>
                        <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest">Pusat Komando & Pelaporan Peristiwa Marunda</p>
                    </div>
                </div>
            </div>

            <IncidentCenter adminId={session.userId} />
        </div>
    );
}
