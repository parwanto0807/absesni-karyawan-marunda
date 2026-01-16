import React from 'react';
import { getPermits } from '@/actions/permits';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import PermitTable from '@/components/PermitTable';
import PermitDialog from '@/components/PermitDialog';
import { ShieldCheck, CalendarRange, Clock } from 'lucide-react';
import { prisma } from '@/lib/db';

export default async function PermitsPage() {
    const session = await getSession();
    if (!session) {
        redirect('/login');
    }

    // Filter permits based on role
    const permits = (session.role === 'ADMIN' || session.role === 'PIC' || session.role === 'RT')
        ? await getPermits()
        : await getPermits(session.userId);

    // For approval logic, we need the user's current role, ID, and employeeId
    const dbUser = await prisma.user.findUnique({
        where: { id: session.userId },
        select: { employeeId: true }
    });

    const currentUser = {
        id: session.userId,
        role: session.role,
        employeeId: dbUser?.employeeId || ''
    };

    return (

        <div className="w-ful mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-700">
            {/* Header Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
                <div className="space-y-1.5 md:space-y-2">
                    <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[9px] font-black uppercase tracking-widest">
                        <CalendarRange size={10} />
                        <span>Sistem Pengajuan Izin</span>
                    </div>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">
                        Ijin & <span className="text-indigo-600">Pergantian Shift</span>
                    </h1>
                    <p className="text-[10px] md:text-sm text-slate-500 dark:text-slate-400 font-medium max-w-lg leading-relaxed">
                        Manajemen pengajuan izin, pergantian shift, dan sakit dengan sistem persetujuan bertingkat.
                    </p>
                </div>

                {(session.role === 'SECURITY' || session.role === 'LINGKUNGAN') && (
                    <div className="pt-2 md:pt-0">
                        <PermitDialog userId={session.userId} />
                    </div>
                )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
                <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none flex items-center space-x-3 md:space-x-4">
                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 flex items-center justify-center">
                        <Clock size={20} className="md:w-6 md:h-6" />
                    </div>
                    <div>
                        <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tabular-nums">{permits.filter(p => p.finalStatus === 'PENDING').length}</div>
                        <div className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Menunggu Approval</div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none flex items-center space-x-3 md:space-x-4">
                    <div className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 flex items-center justify-center">
                        <ShieldCheck size={20} className="md:w-6 md:h-6" />
                    </div>
                    <div>
                        <div className="text-xl md:text-2xl font-black text-slate-900 dark:text-white tabular-nums">{permits.filter(p => p.finalStatus === 'APPROVED').length}</div>
                        <div className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">Izin Disetujui</div>
                    </div>
                </div>
                <div className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none flex items-center justify-center md:justify-start">
                    <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase leading-relaxed tracking-wider text-center md:text-left">
                        Workflow: <span className="text-indigo-600">Pengajuan (Sec/Ling)</span> → <span className="text-indigo-600">Persetujuan (Admin/PIC)</span>
                    </p>
                </div>
            </div>

            {/* Table Section */}
            <div className="space-y-3 md:space-y-4">
                <div className="flex items-center space-x-2 px-1 md:px-2">
                    <ShieldCheck className="text-indigo-600 w-4 h-4 md:w-[18px] md:h-[18px]" />
                    <h2 className="text-[10px] md:text-xs font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">Daftar Pengajuan Terbaru</h2>
                </div>
                <PermitTable permits={permits} currentUser={currentUser} />
            </div>
        </div>
    );
}
