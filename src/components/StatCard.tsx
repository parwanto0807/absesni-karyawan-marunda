import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        isUp: boolean;
    };
    color: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky';
}

const colorMap = {
    indigo: 'bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 border-indigo-100 dark:border-indigo-900/50',
    emerald: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50',
    amber: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/50',
    rose: 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400 border-rose-100 dark:border-rose-900/50',
    sky: 'bg-sky-50 text-sky-600 dark:bg-sky-900/20 dark:text-sky-400 border-sky-100 dark:border-sky-900/50',
};

export default function StatCard({ title, value, icon: Icon, trend, color }: StatCardProps) {
    return (
        <div className="rounded-xl md:rounded-2xl border border-slate-200 bg-white p-3 md:p-6 shadow-sm transition-all hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-center justify-between">
                <div className={cn("flex h-8 w-8 md:h-12 md:w-12 items-center justify-center rounded-lg md:rounded-xl border", colorMap[color])}>
                    <Icon className="h-4 w-4 md:h-6 md:w-6" />
                </div>
                {trend && (
                    <div className={cn(
                        "flex items-center text-[10px] md:text-xs font-medium px-1.5 py-0.5 md:px-2 md:py-1 rounded-full",
                        trend.isUp ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20" : "bg-rose-50 text-rose-600 dark:bg-rose-900/20"
                    )}>
                        {trend.isUp ? '↑' : '↓'} {trend.value}%
                    </div>
                )}
            </div>
            <div className="mt-2 md:mt-4">
                <h3 className="text-[9px] md:text-sm font-bold uppercase tracking-widest text-slate-400 dark:text-slate-400 truncate">{title}</h3>
                <p className="mt-0.5 md:mt-1 text-lg md:text-2xl font-black text-slate-900 dark:text-white">{value}</p>
            </div>
        </div>
    );
}
