'use client';

import { ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

export default function PatroliButton() {
    const handleClick = () => {
        toast.info('Fitur Laporan Patroli', {
            description: 'Masih dalam tahap pengembangan. Segera hadir!'
        });
    };

    return (
        <button
            onClick={handleClick}
            className="mt-6 flex items-center justify-center space-x-2 w-full rounded-xl bg-white/10 dark:bg-indigo-600 hover:bg-white/20 dark:hover:bg-indigo-700 py-3 text-[10px] font-black text-white uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl shadow-black/10 dark:shadow-indigo-500/20 border border-white/20 dark:border-indigo-500/50 backdrop-blur-sm"
        >
            <span>Laporan Patroli</span>
            <ArrowRight size={12} />
        </button>
    );
}
