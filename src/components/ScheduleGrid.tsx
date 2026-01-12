'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { getShiftForDate, SHIFT_DETAILS } from '@/lib/schedule-utils';
import { createManualSchedule, deleteManualSchedule } from '@/actions/employees';
import { Loader2, RotateCcw } from 'lucide-react';

interface ScheduleGridProps {
    users: any[];
    days: number[];
    currentMonth: number;
    currentYear: number;
    manualSchedules: any[];
    canEdit: boolean;
}

export default function ScheduleGrid({ users, days, currentMonth, currentYear, manualSchedules, canEdit }: ScheduleGridProps) {
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [selectedCell, setSelectedCell] = useState<{ userId: string; day: number } | null>(null);

    const handleShiftChange = async (userId: string, day: number, shiftCode: string) => {
        const date = new Date(currentYear, currentMonth, day);
        setIsUpdating(`${userId}-${day}`);
        await createManualSchedule(userId, date, shiftCode);
        setIsUpdating(null);
        setSelectedCell(null);
    };

    const handleResetShift = async (userId: string, day: number) => {
        const date = new Date(currentYear, currentMonth, day);
        setIsUpdating(`${userId}-${day}`);
        await deleteManualSchedule(userId, date);
        setIsUpdating(null);
        setSelectedCell(null);
    };

    // Shared Popover Component
    const ShiftPopover = ({ user, day, shift, manual }: { user: any, day: number, shift: string, manual: any }) => (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200"
            onClick={(e) => {
                e.stopPropagation();
                setSelectedCell(null);
            }}
        >
            <div
                className="w-full max-w-xs bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 p-4 animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="text-center space-y-1 mb-4">
                    <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">
                        Ubah Shift: {new Date(currentYear, currentMonth, day).toLocaleDateString('id-ID', { day: 'numeric', month: 'long' })}
                    </h3>
                    <p className="text-xs font-medium text-slate-500">{user.name}</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                    {Object.keys(SHIFT_DETAILS).map((sCode) => (
                        <button
                            key={sCode}
                            onClick={() => handleShiftChange(user.id, day, sCode)}
                            className={cn(
                                "py-3 rounded-xl text-xs font-black text-center transition-all active:scale-95 border-2",
                                shift === sCode
                                    ? "border-indigo-600 ring-2 ring-indigo-200 dark:ring-indigo-900"
                                    : "border-transparent hover:bg-slate-50 dark:hover:bg-slate-800",
                                SHIFT_DETAILS[sCode as keyof typeof SHIFT_DETAILS].color
                            )}
                        >
                            {sCode}
                        </button>
                    ))}
                </div>

                {manual && (
                    <button
                        onClick={() => handleResetShift(user.id, day)}
                        className="w-full mt-3 flex items-center justify-center space-x-2 py-3 rounded-xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 text-xs font-black hover:bg-rose-100 transition-colors border border-rose-100 dark:border-rose-900/30 active:scale-95"
                    >
                        <RotateCcw size={14} />
                        <span>Reset Otomatis</span>
                    </button>
                )}
                <button
                    onClick={() => setSelectedCell(null)}
                    className="w-full mt-2 py-3 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                    Batalkan
                </button>
            </div>
        </div>
    );

    const today = new Date();
    const isCurrentMonth = currentMonth === today.getMonth() && currentYear === today.getFullYear();
    const startDay = isCurrentMonth ? today.getDate() : 1;
    const filteredDays = days.filter(day => day >= startDay);

    return (
        <>
            {/* Mobile/Tablet View (List of Cards) */}
            <div className="block lg:hidden space-y-4">
                {users.map(user => (
                    <div key={user.id} className="bg-white dark:bg-slate-900 rounded-[1.5rem] p-4 shadow-sm border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center font-black text-sm">
                                {user.name.charAt(0)}
                            </div>
                            <div>
                                <div className="font-black text-slate-900 dark:text-white uppercase text-sm tracking-tight">{user.name}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Security Guard</div>
                            </div>
                        </div>

                        <div className="flex overflow-x-auto pb-4 -mx-4 px-4 space-x-2 scrollbar-hide">
                            {filteredDays.map((day, index) => {
                                const date = new Date(currentYear, currentMonth, day);
                                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                const dayName = date.toLocaleString('id-ID', { weekday: 'short' }).charAt(0);

                                const manual = manualSchedules.find(m =>
                                    m.userId === user.id &&
                                    new Date(m.date).getDate() === day &&
                                    new Date(m.date).getMonth() === currentMonth &&
                                    new Date(m.date).getFullYear() === currentYear
                                );

                                const shift = manual ? manual.shiftCode : getShiftForDate(user.rotationOffset, date);
                                const detail = SHIFT_DETAILS[shift as keyof typeof SHIFT_DETAILS] || SHIFT_DETAILS.OFF;
                                const isSelected = selectedCell?.userId === user.id && selectedCell?.day === day;
                                const statusKey = `${user.id}-${day}`;

                                return (
                                    <div
                                        key={day}
                                        onClick={() => {
                                            if (canEdit) setSelectedCell({ userId: user.id, day });
                                        }}
                                        className={cn(
                                            "flex-shrink-0 flex flex-col items-center space-y-1.5 p-1.5 rounded-xl min-w-[40px] border transition-all",
                                            // Hides items > 7 on Mobile (< md)
                                            // Shows items 7-21 on Tablet (md to lg)
                                            // Hides items > 21 always on this view
                                            index >= 7 && "hidden md:flex",
                                            index >= 21 && "hidden",
                                            canEdit && "active:scale-95",
                                            isWeekend ? "bg-rose-50/50 border-rose-100 dark:bg-rose-900/10 dark:border-rose-900/20" : "bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-800"
                                        )}
                                    >
                                        <div className="text-center space-y-0.5">
                                            <span className={cn("text-[8px] font-black uppercase", isWeekend ? "text-rose-400" : "text-slate-400")}>{dayName}</span>
                                            <span className={cn("text-[10px] font-black", isWeekend ? "text-rose-600" : "text-slate-600 dark:text-slate-300")}>{day}</span>
                                        </div>

                                        <div className={cn(
                                            "h-7 w-7 rounded-md flex items-center justify-center text-[9px] font-black relative",
                                            manual
                                                ? "bg-amber-50 dark:bg-amber-900/30 border border-amber-400 text-amber-900 dark:text-amber-200"
                                                : detail.color
                                        )}>
                                            {isUpdating === statusKey ? (
                                                <Loader2 className="animate-spin h-3 w-3 text-indigo-600" />
                                            ) : (
                                                <>
                                                    {shift}
                                                    {manual && (
                                                        <span className="absolute -top-0.5 -right-0.5 h-1.5 w-1.5 rounded-full bg-amber-500 border border-white dark:border-slate-900"></span>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop View (Table) - Now only visible on Large screens */}
            <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-l-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                <div className="overflow-x-auto pb-4">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <th className="sticky left-0 z-20 bg-slate-50 dark:bg-slate-800/90 backdrop-blur px-6 py-4 text-left border-r border-slate-200 dark:border-slate-800 min-w-[200px]">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nama Personil</span>
                                </th>
                                {days.map(day => {
                                    const date = new Date(currentYear, currentMonth, day);
                                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                    const dayName = date.toLocaleString('id-ID', { weekday: 'short' }).charAt(0);

                                    return (
                                        <th key={day} className={cn(
                                            "px-1 py-3 text-center border-l border-slate-100 dark:border-slate-800/50 min-w-[40px]",
                                            isWeekend && "bg-rose-50/50 dark:bg-rose-900/10"
                                        )}>
                                            <div className="flex flex-col items-center justify-center space-y-1">
                                                <div className={cn("text-[9px] font-black uppercase", isWeekend ? "text-rose-600" : "text-slate-400")}>
                                                    {dayName}
                                                </div>
                                                <div className={cn("h-7 w-7 rounded-full flex items-center justify-center text-[10px] font-black",
                                                    isWeekend ? "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300" : "text-slate-700 dark:text-slate-300"
                                                )}>
                                                    {day}
                                                </div>
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50/30 dark:hover:bg-white/5 transition-colors group">
                                    <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 px-6 py-4 border-r border-slate-200 dark:border-slate-800">
                                        <div className="flex items-center space-x-3">
                                            <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center font-bold text-xs">
                                                {user.name.charAt(0)}
                                            </div>
                                            <span className="font-bold text-slate-900 dark:text-white uppercase text-xs tracking-tight">{user.name}</span>
                                        </div>
                                    </td>
                                    {days.map(day => {
                                        const date = new Date(currentYear, currentMonth, day);
                                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;

                                        const manual = manualSchedules.find(m =>
                                            m.userId === user.id &&
                                            new Date(m.date).getDate() === day &&
                                            new Date(m.date).getMonth() === currentMonth &&
                                            new Date(m.date).getFullYear() === currentYear
                                        );

                                        const shift = manual ? manual.shiftCode : getShiftForDate(user.rotationOffset, date);
                                        const detail = SHIFT_DETAILS[shift as keyof typeof SHIFT_DETAILS] || SHIFT_DETAILS.OFF;
                                        const isSelected = selectedCell?.userId === user.id && selectedCell?.day === day;
                                        const statusKey = `${user.id}-${day}`;

                                        return (
                                            <td
                                                key={day}
                                                className={cn(
                                                    "p-1 border-r border-slate-100 dark:border-slate-800 text-center transition-all relative",
                                                    isWeekend && "bg-rose-50/20 dark:bg-rose-900/5",
                                                    isSelected && "ring-2 ring-indigo-500 ring-inset z-20",
                                                    canEdit ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/10" : "cursor-default"
                                                )}
                                                onClick={() => {
                                                    if (canEdit) setSelectedCell({ userId: user.id, day });
                                                }}
                                            >
                                                <div className={cn(
                                                    "h-10 w-full flex items-center justify-center rounded-lg text-[10px] font-black transition-all relative",
                                                    manual
                                                        ? "bg-amber-50 dark:bg-amber-900/30 border-2 border-amber-400 text-amber-900 dark:text-amber-200"
                                                        : detail.color,
                                                    (shift === 'OFF' && !manual) ? "opacity-100" : "shadow-sm border border-slate-100 dark:border-slate-700",
                                                )}>
                                                    {isUpdating === statusKey ? (
                                                        <Loader2 className="animate-spin h-4 w-4 text-indigo-600" />
                                                    ) : (
                                                        <>
                                                            {shift}
                                                            {manual && (
                                                                <div className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                                                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                                                                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Global Popover (Rendered when needed) */}
            {selectedCell && (() => {
                const user = users.find(u => u.id === selectedCell.userId);
                if (!user) return null;

                const manual = manualSchedules.find(m =>
                    m.userId === selectedCell.userId &&
                    new Date(m.date).getDate() === selectedCell.day &&
                    new Date(m.date).getMonth() === currentMonth &&
                    new Date(m.date).getFullYear() === currentYear
                );

                const date = new Date(currentYear, currentMonth, selectedCell.day);
                const shift = manual ? manual.shiftCode : getShiftForDate(user.rotationOffset, date);

                return <ShiftPopover user={user} day={selectedCell.day} shift={shift} manual={manual} />;
            })()}
        </>
    );
}
