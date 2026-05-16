import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function PatroliButton({ disabled = false }: { disabled?: boolean }) {
    if (disabled) {
        return (
            <div className="mt-6 flex items-center justify-center space-x-2 w-full rounded-xl bg-slate-100 dark:bg-slate-800 py-3 text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] border border-slate-200 dark:border-slate-700 cursor-not-allowed opacity-60">
                <span>Laporan Patroli (Absen Dahulu)</span>
                <ArrowRight size={12} />
            </div>
        );
    }

    return (
        <Link href="/patrol" className="block w-full">
            <button
                className="mt-6 flex items-center justify-center space-x-2 w-full rounded-xl bg-white/10 dark:bg-indigo-600 hover:bg-white/20 dark:hover:bg-indigo-700 py-3 text-[10px] font-black text-white uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl shadow-black/10 dark:shadow-indigo-500/20 border border-white/20 dark:border-indigo-500/50 backdrop-blur-sm"
            >
                <span>Laporan Patroli</span>
                <ArrowRight size={12} />
            </button>
        </Link>
    );
}
