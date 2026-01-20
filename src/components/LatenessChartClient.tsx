"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils'; // Assuming this exists based on other files
import { Calendar, Clock, Users } from 'lucide-react';

interface DailyLateness {
    date: string; // ISO String or similar
    formattedDate: string; // "20 Jan"
    totalLateMinutes: number;
    lateCount: number;
}

interface LatenessChartClientProps {
    data: DailyLateness[];
}

export default function LatenessChartClient({ data }: LatenessChartClientProps) {
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
        }
    }, [data]);

    // Find max value for scaling
    const maxMinutes = Math.max(...data.map(d => d.totalLateMinutes), 1);

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden mb-8">
            <div className="px-6 py-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-xl bg-rose-100 dark:bg-rose-900/20 text-rose-600 flex items-center justify-center shrink-0">
                        <Clock size={20} />
                    </div>
                    <div>
                        <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest leading-tight">
                            Monitoring Keterlambatan
                        </h2>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                            Statistik 30 Hari Terakhir
                        </p>
                    </div>
                </div>

                {/* Summary Stats */}
                <div className="flex items-center space-x-6">
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Menit</span>
                        <span className="text-lg font-black text-rose-600">
                            {data.reduce((acc, curr) => acc + curr.totalLateMinutes, 0)}m
                        </span>
                    </div>
                    <div className="flex flex-col items-end">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Kasus</span>
                        <span className="text-lg font-black text-slate-700 dark:text-white">
                            {data.reduce((acc, curr) => acc + curr.lateCount, 0)}
                        </span>
                    </div>
                </div>
            </div>

            <div ref={scrollContainerRef} className="p-6 overflow-x-auto custom-scrollbar">
                {/* Chart Container - Fixed height, min-width for scrolling on mobile */}
                <div className="h-64 min-w-[800px] flex items-end justify-between gap-2 px-2 relative">

                    {/* Grid Lines (Optional - simplified) */}
                    <div className="absolute inset-x-0 inset-y-0 flex flex-col justify-between pointer-events-none opacity-10">
                        <div className="border-t border-slate-500 w-full" />
                        <div className="border-t border-slate-500 w-full" />
                        <div className="border-t border-slate-500 w-full" />
                        <div className="border-t border-slate-500 w-full" />
                        <div className="border-t border-slate-500 w-full" />
                    </div>

                    {data.map((item, index) => {
                        const heightPercentage = (item.totalLateMinutes / maxMinutes) * 100;
                        const isHovered = hoveredIndex === index;

                        return (
                            <div
                                key={index}
                                className="flex-1 flex flex-col items-center group relative"
                                onMouseEnter={() => setHoveredIndex(index)}
                                onMouseLeave={() => setHoveredIndex(null)}
                            >
                                {/* Tooltip */}
                                <AnimatePresence>
                                    {isHovered && (
                                        <motion.div
                                            initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                            animate={{ opacity: 1, y: 0, scale: 1 }}
                                            exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                            className="absolute bottom-full mb-2 z-10 w-32 bg-slate-900 text-white p-3 rounded-xl shadow-xl pointer-events-none"
                                            style={{ left: '50%', x: '-50%' }}
                                        >
                                            <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">{item.formattedDate}</div>
                                            <div className="text-sm font-black text-white mb-0.5">{item.totalLateMinutes} Menit</div>
                                            <div className="text-[10px] text-white/80">{item.lateCount} Personil Telat</div>
                                            {/* Pointer arrow */}
                                            <div className="absolute top-full left-1/2 -ml-1 border-4 border-transparent border-t-slate-900" />
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                                {/* Bar */}
                                <div className="w-full relative h-[180px] flex items-end justify-center">
                                    <motion.div
                                        initial={{ height: 0 }}
                                        animate={{ height: `${heightPercentage}%` }}
                                        transition={{ type: "spring", stiffness: 300, damping: 30, delay: index * 0.02 }}
                                        className={cn(
                                            "w-full max-w-[24px] rounded-t-lg bg-gradient-to-t transition-all duration-300 relative",
                                            isHovered ? "from-rose-600 to-rose-400 shadow-lg shadow-rose-200 dark:shadow-rose-900/40" : "from-rose-500/80 to-rose-300/80 dark:from-rose-600/60 dark:to-rose-800/60"
                                        )}
                                    >
                                        {/* Value Label on Top of Bar (if tall enough, or always visible on hover?) Let's show on hover mainly, or sparse */}
                                    </motion.div>

                                    {/* Hover Highlight Full Height Background */}
                                    <div className={cn(
                                        "absolute inset-x-0 bottom-0 h-full bg-slate-100/50 dark:bg-slate-800/50 rounded-lg -z-10 transition-opacity duration-200",
                                        isHovered ? "opacity-100" : "opacity-0"
                                    )} />
                                </div>

                                {/* X-Axis Label */}
                                <div className="mt-3 text-[9px] font-bold text-slate-400 uppercase tracking-wider rotate-[-45deg] origin-top-left translate-y-2 md:rotate-0 md:translate-y-0 md:text-center shrink-0 w-full truncate">
                                    {item.formattedDate}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wide flex items-center">
                    <Clock size={12} className="mr-2" />
                    Data ditampilkan berdasarkan akumulasi menit keterlambatan seluruh personil (Security, Lingkungan, Kebersihan).
                </p>
            </div>
        </div>
    );
}
