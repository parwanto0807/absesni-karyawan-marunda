'use client';

import React, { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface DigitalClockProps {
    className?: string;
    timezone?: 'WIB' | 'WITA' | 'WIT';
    showSeconds?: boolean;
    compact?: boolean;
}

export default function DigitalClock({
    className,
    timezone = 'WIB',
    showSeconds = true,
    compact = false
}: DigitalClockProps) {
    const [time, setTime] = useState<Date | null>(null);
    const [isHovered, setIsHovered] = useState(false);
    const [isMobile, setIsMobile] = useState(false);

    useEffect(() => {
        const updateTime = () => {
            const now = new Date();
            if (timezone === 'WITA') {
                now.setHours(now.getHours() + 1);
            } else if (timezone === 'WIT') {
                now.setHours(now.getHours() + 2);
            }
            setTime(now);
        };

        // Check mobile on mount and resize
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 640);
        };

        updateTime();
        checkMobile();

        const timer = setInterval(updateTime, 1000);
        window.addEventListener('resize', checkMobile);

        return () => {
            clearInterval(timer);
            window.removeEventListener('resize', checkMobile);
        };
    }, [timezone]);

    if (!time) {
        return (
            <div className={cn(
                "h-12 w-36 bg-gradient-to-br from-slate-800/10 to-slate-800/5",
                "dark:from-slate-100/5 dark:to-slate-100/10",
                "backdrop-blur-xl rounded-xl border border-slate-300/20",
                "dark:border-slate-700/30 animate-pulse",
                className
            )} />
        );
    }

    const hours = time.getHours().toString().padStart(2, '0');
    const minutes = time.getMinutes().toString().padStart(2, '0');
    const seconds = time.getSeconds().toString().padStart(2, '0');

    // Layout untuk mobile: location dipindahkan ke bawah
    const shouldStack = isMobile && !compact;

    return (
        <div
            className={cn(
                "relative inline-flex flex-col items-center justify-center",
                "font-sans select-none transition-all duration-300",
                "w-auto max-w-full",
                shouldStack ? "gap-1" : "",
                className
            )}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
        >
            {/* Outer subtle glow */}
            <div className={cn(
                "absolute -inset-1 bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-pink-500/10",
                "rounded-xl blur-md transition-all duration-500",
                isHovered ? "opacity-60 scale-105" : "opacity-30"
            )} />

            {/* Main container - Lebih ramping */}
            <div className={cn(
                "relative flex items-center",
                "bg-gradient-to-br from-white/95 to-white/90",
                "dark:from-slate-900/95 dark:to-slate-950/90",
                "backdrop-blur-xl border",
                "border-white/40 dark:border-slate-800/50",
                "shadow-lg dark:shadow-black/20",
                "transition-all duration-300",
                compact ? "px-3 py-2 rounded-xl" : "px-4 py-2 rounded-xl",
                shouldStack ? "w-full justify-center" : "",
                isHovered ? "scale-[1.02] shadow-xl dark:shadow-black/30" : ""
            )}>
                {/* Time display - Lebih compact */}
                <div className="flex items-baseline space-x-0.5">
                    {/* Hours */}
                    <span className={cn(
                        "font-light text-slate-900 dark:text-white tabular-nums",
                        "tracking-tight transition-all duration-300",
                        compact ? "text-xl" : "text-2xl",
                        isHovered ? "drop-shadow-[0_0_12px_rgba(79,70,229,0.15)]" : ""
                    )}>
                        {hours}
                    </span>

                    {/* Separator */}
                    <span className={cn(
                        "font-light text-indigo-500 dark:text-indigo-400",
                        "transition-all duration-1000",
                        compact ? "text-xl" : "text-2xl",
                        isHovered ? "animate-pulse" : ""
                    )}>
                        :
                    </span>

                    {/* Minutes */}
                    <span className={cn(
                        "font-light text-slate-900 dark:text-white tabular-nums",
                        "tracking-tight transition-all duration-300",
                        compact ? "text-xl" : "text-2xl",
                        isHovered ? "drop-shadow-[0_0_12px_rgba(168,85,247,0.15)]" : ""
                    )}>
                        {minutes}
                    </span>

                    {/* Seconds dengan layout lebih ketat */}
                    {showSeconds && (
                        <div className={cn(
                            "flex items-center ml-2 pl-2",
                            "border-l border-slate-200/30 dark:border-slate-800/50"
                        )}>
                            <div className="relative flex items-center">
                                {/* Live indicator dot */}
                                <div className={cn(
                                    "absolute -left-1.5 w-1.5 h-1.5 rounded-full",
                                    "bg-gradient-to-r from-emerald-400 to-cyan-400",
                                    "animate-pulse shadow-[0_0_4px_rgba(52,211,153,0.5)]"
                                )} />
                                <span className={cn(
                                    "font-light text-slate-500 dark:text-slate-400 tabular-nums",
                                    compact ? "text-xs" : "text-sm"
                                )}>
                                    {seconds}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Timezone badge - Lebih kecil */}
                <div className={cn(
                    "ml-2 pl-2 border-l border-slate-200/30 dark:border-slate-800/50"
                )}>
                    <div className="relative group/timezone">
                        <div className={cn(
                            "px-1.5 py-0.5 rounded-md",
                            "bg-gradient-to-r from-indigo-500/5 to-purple-500/5",
                            "border border-indigo-500/10 dark:border-indigo-500/20",
                            "transition-all duration-300",
                            isHovered ? "bg-indigo-500/10 dark:bg-indigo-500/15" : ""
                        )}>
                            <span className={cn(
                                "font-semibold tracking-wider",
                                compact ? "text-[10px]" : "text-xs",
                                "text-indigo-600 dark:text-indigo-300"
                            )}>
                                {timezone}
                            </span>
                        </div>

                        {/* Tooltip on hover */}
                        <div className="absolute -bottom-7 left-1/2 -translate-x-1/2 opacity-0 group-hover/timezone:opacity-100 transition-opacity duration-200 pointer-events-none">
                            <div className="bg-slate-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                GMT+{timezone === 'WIB' ? '7' : timezone === 'WITA' ? '8' : '9'}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Location - Desktop hanya di dalam container */}
                {!isMobile && !shouldStack && !compact && (
                    <div className={cn(
                        "ml-2 pl-2 border-l border-slate-200/30 dark:border-slate-800/50",
                        "opacity-70 hover:opacity-100 transition-opacity duration-300",
                        "hidden sm:flex items-center space-x-1.5"
                    )}>
                        <svg
                            className="w-3 h-3 text-slate-400 dark:text-slate-500 flex-shrink-0"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        <span className={cn(
                            "font-medium text-slate-600 dark:text-slate-400",
                            "whitespace-nowrap tracking-tight text-xs truncate max-w-[100px]"
                        )}>
                            Cluster Marunda
                        </span>
                    </div>
                )}
            </div>

            {/* Progress bar - SELALU TERLIHAT, bukan hanya saat hover */}
            <div className={cn(
                "w-full h-0.5 mt-1",
                "bg-slate-200/20 dark:bg-slate-800/30",
                "rounded-full overflow-hidden transition-all duration-300",
                compact ? "max-w-48" : "max-w-56"
            )}>
                <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-1000 ease-linear"
                    style={{ width: `${(time.getSeconds() / 59) * 100}%` }}
                />
            </div>

            {/* Location - Mobile dipindahkan ke bawah (di luar main container) */}
            {isMobile && !compact && (
                <div className={cn(
                    "flex items-center justify-center space-x-1 mt-1",
                    "opacity-70 transition-opacity duration-300 w-full"
                )}>
                    <svg
                        className="w-2.5 h-2.5 text-slate-400 dark:text-slate-500 flex-shrink-0"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className={cn(
                        "font-medium text-slate-600 dark:text-slate-400",
                        "whitespace-nowrap tracking-tight text-[10px] truncate max-w-[140px]"
                    )}>
                        Cluster Taman Marunda
                    </span>
                </div>
            )}
        </div>
    );
}