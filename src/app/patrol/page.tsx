import React from 'react';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import PatrolClient from './PatrolClient';
import Link from 'next/link';
import { ChevronLeft } from 'lucide-react';

export default async function PatrolPage() {
    const session = await getSession();
    if (!session) {
        redirect('/login');
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
            <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 p-4">
                <div className="max-w-md mx-auto flex items-center justify-between">
                    <Link href="/dashboard" className="flex items-center text-slate-500 hover:text-indigo-600 transition-colors">
                        <ChevronLeft size={20} />
                        <span className="text-[10px] font-black uppercase tracking-widest ml-1">Dashboard</span>
                    </Link>
                    <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-black text-[10px]">
                        {session.username.substring(0, 2).toUpperCase()}
                    </div>
                </div>
            </header>

            <main className="p-4 pt-6">
                <PatrolClient userId={session.userId} />
            </main>
        </div>
    );
}
