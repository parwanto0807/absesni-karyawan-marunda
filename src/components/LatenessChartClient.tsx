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
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const [chartType, setChartType] = useState<'bar' | 'line'>('line');
    const [hoveredDataPoint, setHoveredDataPoint] = useState<{ index: number; x: number; y: number } | null>(null);

    React.useEffect(() => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
        }
    }, [data, chartType]);

    // Find max value for scaling
    const maxMinutes = Math.max(...data.map(d => d.totalLateMinutes), 1);

    const renderBarChart = () => (
        <div className="h-64 min-w-[800px] flex items-end justify-between gap-2 px-2 relative">
            {/* Grid Lines */}
            <div className="absolute inset-x-0 inset-y-0 flex flex-col justify-between pointer-events-none opacity-10">
                {[...Array(5)].map((_, i) => <div key={i} className="border-t border-slate-500 w-full" />)}
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
                            />
                            {/* Hover Highlight */}
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
    );

    const renderLineChart = () => {
        const height = 180;
        const width = 800; // Match min-width
        const paddingX = 20;
        const stepX = (width - paddingX * 2) / (data.length - 1);

        const points = data.map((d, i) => ({
            x: paddingX + i * stepX,
            y: height - ((d.totalLateMinutes / maxMinutes) * height)
        }));

        const pathD = `M ${points.map(p => `${p.x},${p.y}`).join(' L ')}`;
        const areaD = `${pathD} L ${points[points.length - 1].x},${height} L ${points[0].x},${height} Z`;

        return (
            <div className="h-64 min-w-[800px] relative px-2">
                {/* Grid Lines */}
                <div className="absolute inset-x-0 top-0 h-[180px] flex flex-col justify-between pointer-events-none opacity-10">
                    {[...Array(5)].map((_, i) => <div key={i} className="border-t border-slate-500 w-full" />)}
                </div>

                <div className="h-[180px] w-full relative">
                    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
                        <defs>
                            <linearGradient id="line-gradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#e11d48" stopOpacity="0.5" />
                                <stop offset="100%" stopColor="#e11d48" stopOpacity="0" />
                            </linearGradient>
                        </defs>
                        {/* Area */}
                        <motion.path
                            initial={{ opacity: 0, d: `M ${points[0].x},${height} L ${points[data.length - 1].x},${height} L ${points[data.length - 1].x},${height} L ${points[0].x},${height} Z` }}
                            animate={{ opacity: 1, d: areaD }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            fill="url(#line-gradient)"
                        />
                        {/* Line */}
                        <motion.path
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1.5, ease: "easeInOut" }}
                            d={pathD}
                            fill="none"
                            stroke="#e11d48"
                            strokeWidth="3"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                        />

                        {/* Interactive Points */}
                        {points.map((p, i) => (
                            <g key={i}>
                                <circle
                                    cx={p.x} cy={p.y} r="6" fill="transparent"
                                    onMouseEnter={() => setHoveredDataPoint({ index: i, x: p.x, y: p.y })}
                                    onMouseLeave={() => setHoveredDataPoint(null)}
                                    className="cursor-pointer"
                                />
                                {/* Visible dot on hover or always? Let's show small dots always */}
                                <circle cx={p.x} cy={p.y} r="3" fill="#fff" stroke="#e11d48" strokeWidth="2" />
                            </g>
                        ))}
                    </svg>

                    {/* Tooltip for Line Chart */}
                    <AnimatePresence>
                        {hoveredDataPoint && (
                            <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                className="absolute bottom-full mb-2 z-20 w-32 bg-slate-900 text-white p-3 rounded-xl shadow-xl pointer-events-none"
                                style={{
                                    left: ((hoveredDataPoint.x / width) * 100) + '%',
                                    transform: 'translate(-50%, -10px)' // Correctly center tooltip relative to standard positioning
                                }}
                            >
                                <div className="text-[10px] font-bold text-white/50 uppercase tracking-widest mb-1">{data[hoveredDataPoint.index].formattedDate}</div>
                                <div className="text-sm font-black text-white mb-0.5">{data[hoveredDataPoint.index].totalLateMinutes} Menit</div>
                                <div className="text-[10px] text-white/80">{data[hoveredDataPoint.index].lateCount} Personil Telat</div>
                                <div className="absolute top-full left-1/2 -ml-1 border-4 border-transparent border-t-slate-900" />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* X-Axis Labels for Line Chart */}
                <div className="relative h-10 w-full">
                    {points.map((p, i) => (
                        <div
                            key={i}
                            className="absolute top-2 text-[9px] font-bold text-slate-400 uppercase tracking-wider -translate-x-1/2 whitespace-nowrap"
                            style={{ left: `${(p.x / width) * 100}%` }}
                        >
                            <span className="block rotate-[-45deg] origin-top-left translate-y-2 md:rotate-0 md:translate-y-0 text-center">
                                {data[i].formattedDate}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden mb-8">
            <div className="px-6 py-6 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-xl bg-rose-100 dark:bg-rose-900/20 text-rose-600 flex items-center justify-center shrink-0">
                        {chartType === 'bar' ? <Calendar size={20} /> : <Users size={20} />}
                        {/* Swapping icon just for visual variety or keep Clock */}
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

                <div className="flex items-center gap-4">
                    {/* Chart Type Selector */}
                    <div className="relative">
                        <select
                            value={chartType}
                            onChange={(e) => setChartType(e.target.value as 'bar' | 'line')}
                            className="appearance-none bg-slate-100 dark:bg-slate-800 border-none text-xs font-bold text-slate-700 dark:text-slate-300 rounded-xl py-2 pl-4 pr-8 focus:ring-2 focus:ring-rose-500 outline-none cursor-pointer"
                        >
                            <option value="bar">Bar Chart</option>
                            <option value="line">Line Chart</option>
                        </select>
                        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-slate-500">
                            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" /></svg>
                        </div>
                    </div>

                    {/* Summary Stats */}
                    <div className="hidden md:flex items-center space-x-6">
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
            </div>

            <div ref={scrollContainerRef} className="p-6 overflow-x-auto custom-scrollbar">
                {chartType === 'bar' ? renderBarChart() : renderLineChart()}
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
