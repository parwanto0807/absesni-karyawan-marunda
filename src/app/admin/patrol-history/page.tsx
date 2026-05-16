import React from 'react';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import PatrolHistoryClient from '../administration/PatrolHistoryClient';

export default async function AdminPatrolHistoryPage() {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
        redirect('/login');
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <main className="p-4 md:p-8 w-full space-y-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
                    <div>
                        <h1 className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                            Monitoring <span className="text-indigo-600">Patroli</span>
                        </h1>
                        <p className="text-sm text-slate-500 font-medium">
                            Pantau riwayat pengecekan keamanan dan temuan di lapangan.
                        </p>
                    </div>
                </div>

                <div className="mt-8">
                    <PatrolHistoryClient />
                </div>
            </main>
        </div>
    );
}
