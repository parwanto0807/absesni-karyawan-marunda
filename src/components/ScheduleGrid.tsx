'use client';

import React, { useState } from 'react';
import { cn } from '@/lib/utils';
import { getShiftForDate, getStaticSchedule, SHIFT_DETAILS } from '@/lib/schedule-utils';
import { createManualSchedule, deleteManualSchedule } from '@/actions/employees';
import { Loader2, RotateCcw, Clock } from 'lucide-react';
import { toZonedTime } from 'date-fns-tz';
import { TIMEZONE } from '@/lib/date-utils';
import { getHoliday, type Holiday } from '@/lib/holiday-utils';
import { format } from 'date-fns';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip"
import OvertimeDialog from './OvertimeDialog';

interface ScheduleUser {
    id: string;
    name: string;
    role: string;
    rotationOffset: number;
}

interface ManualSchedule {
    userId: string;
    date: Date;
    shiftCode: string;
}

import { OvertimeRecord } from './OvertimeTable';

export interface OvertimeUser {
    id: string;
    name: string;
    employeeId: string;
    role: string;
}

export interface ScheduleGridProps {
    users: ScheduleUser[];
    days: number[];
    currentMonth: number;
    currentYear: number;
    manualSchedules: ManualSchedule[];
    canEdit: boolean;
    holidays?: Holiday[];
    overtimes?: OvertimeRecord[];
    allUsers?: OvertimeUser[];
}

export default function ScheduleGrid({ 
    users, 
    days, 
    currentMonth, 
    currentYear, 
    manualSchedules, 
    canEdit, 
    holidays,
    overtimes = [],
    allUsers = []
}: ScheduleGridProps) {
    const [isUpdating, setIsUpdating] = useState<string | null>(null);
    const [selectedCell, setSelectedCell] = useState<{ userId: string; day: number } | null>(null);
    const [isOTDialogOpen, setIsOTDialogOpen] = useState(false);
    const [selectedOT, setSelectedOT] = useState<OvertimeRecord | undefined>(undefined);
    const [prefillData, setPrefillData] = useState<{ userId: string, date: string } | undefined>(undefined);

    const constructDate = (y: number, m: number, d: number) => {
        return new Date(Date.UTC(y, m, d, 6, 0, 0));
    };

    const getBaseShift = (user: ScheduleUser, date: Date) => {
        if (user.role === 'LINGKUNGAN' || user.role === 'KEBERSIHAN') {
            return getStaticSchedule(user.role, date);
        }
        return getShiftForDate(user.rotationOffset, date);
    };

    const getOvertimeForCell = (userId: string, day: number) => {
        return overtimes.find(ot => {
            const otDate = toZonedTime(new Date(ot.date), TIMEZONE);
            return ot.userId === userId && 
                   otDate.getDate() === day && 
                   otDate.getMonth() === currentMonth && 
                   otDate.getFullYear() === currentYear;
        });
    };

    const handleShiftChange = async (userId: string, day: number, shiftCode: string) => {
        const date = constructDate(currentYear, currentMonth, day);
        setIsUpdating(`${userId}-${day}`);
        await createManualSchedule(userId, date, shiftCode);
        setIsUpdating(null);
        setSelectedCell(null);
    };

    const handleResetShift = async (userId: string, day: number) => {
        const date = constructDate(currentYear, currentMonth, day);
        setIsUpdating(`${userId}-${day}`);
        await deleteManualSchedule(userId, date);
        setIsUpdating(null);
        setSelectedCell(null);
    };

    const ShiftPopover = ({ user, day, shift, manual }: { user: ScheduleUser, day: number, shift: string, manual: ManualSchedule | undefined }) => (
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
                        {constructDate(currentYear, currentMonth, day).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', timeZone: TIMEZONE })}
                    </h3>
                    {(() => {
                        const holiday = getHoliday(constructDate(currentYear, currentMonth, day));
                        return holiday ? (
                            <div className="text-[10px] font-bold text-rose-500 bg-rose-50 dark:bg-rose-900/20 py-1 px-2 rounded-lg inline-block">
                                🏮 {holiday.name}
                            </div>
                        ) : null;
                    })()}
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
                    onClick={() => {
                        const ot = getOvertimeForCell(user.id, day);
                        if (ot) {
                            setSelectedOT(ot);
                        } else {
                            const formattedDate = format(constructDate(currentYear, currentMonth, day), 'yyyy-MM-dd');
                            setPrefillData({ userId: user.id, date: formattedDate });
                        }
                        setIsOTDialogOpen(true);
                        setSelectedCell(null);
                    }}
                    className="w-full mt-2 flex items-center justify-center space-x-2 py-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 text-xs font-black hover:bg-amber-100 transition-colors border border-amber-100 dark:border-amber-900/30 active:scale-95"
                >
                    <Clock size={14} />
                    <span>{getOvertimeForCell(user.id, day) ? 'Edit Lembur' : 'Tambah Lembur'}</span>
                </button>

                <button
                    onClick={() => setSelectedCell(null)}
                    className="w-full mt-2 py-3 text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                    Batalkan
                </button>
            </div>
        </div>
    );

    const today = toZonedTime(new Date(), TIMEZONE);
    const isCurrentMonth = currentMonth === today.getMonth() && currentYear === today.getFullYear();
    const startDay = isCurrentMonth ? today.getDate() : 1;
    const filteredDays = days.filter(day => day >= startDay);

    return (
        <TooltipProvider>
            {/* Mobile/Tablet View */}
            <div className="block lg:hidden space-y-4">
                {users.map(user => (
                    <div key={user.id} className="bg-white dark:bg-slate-900 rounded-[1.5rem] p-4 shadow-sm border border-slate-200 dark:border-slate-800">
                        <div className="flex items-center space-x-3 mb-4">
                            <div className="h-10 w-10 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center font-black text-sm">
                                {user.name.charAt(0)}
                            </div>
                            <div>
                                <div className="font-black text-slate-900 dark:text-white uppercase text-sm tracking-tight">{user.name}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{user.role}</div>
                            </div>
                        </div>

                        <div className="flex overflow-x-auto pb-4 -mx-4 px-4 space-x-2 scrollbar-hide">
                            {filteredDays.map((day) => {
                                const date = constructDate(currentYear, currentMonth, day);
                                const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                const isToday = isCurrentMonth && day === today.getDate();
                                const dayName = date.toLocaleString('id-ID', { weekday: 'short', timeZone: TIMEZONE }).charAt(0);

                                const manual = manualSchedules.find(m => {
                                    const mDate = toZonedTime(m.date, TIMEZONE);
                                    return m.userId === user.id &&
                                        mDate.getDate() === day &&
                                        mDate.getMonth() === currentMonth &&
                                        mDate.getFullYear() === currentYear
                                });

                                const shift = manual ? manual.shiftCode : getBaseShift(user, date);
                                const detail = SHIFT_DETAILS[shift as keyof typeof SHIFT_DETAILS] || SHIFT_DETAILS.OFF;
                                const statusKey = `${user.id}-${day}`;
                                const ot = getOvertimeForCell(user.id, day);

                                return (
                                    <div key={day} className="flex flex-col items-center space-y-1.5 relative">
                                        <div
                                            onClick={() => {
                                                if (canEdit) setSelectedCell({ userId: user.id, day });
                                            }}
                                            className={cn(
                                                "flex-shrink-0 flex flex-col items-center space-y-1.5 p-1.5 rounded-xl min-w-[44px] border transition-all relative",
                                                canEdit && "active:scale-95",
                                                isToday
                                                    ? "bg-emerald-600 border-emerald-500 shadow-lg shadow-emerald-200/50 dark:shadow-none"
                                                    : isWeekend
                                                        ? "bg-rose-50/50 border-rose-100 dark:bg-rose-900/10 dark:border-rose-900/20"
                                                        : "bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-800",
                                                getHoliday(date, holidays) && !isToday && "border-rose-400 bg-rose-50 dark:bg-rose-900/30"
                                            )}
                                        >
                                            <div className="text-center space-y-0.5 relative">
                                                <span className={cn(
                                                    "text-[8px] font-black uppercase text-center block",
                                                    isToday ? "text-emerald-100" : (isWeekend || getHoliday(date, holidays)) ? "text-rose-400" : "text-slate-400"
                                                )}>{dayName}</span>
                                                <span className={cn(
                                                    "text-[10px] font-black block text-center",
                                                    isToday ? "text-white" : (isWeekend || getHoliday(date, holidays)) ? "text-rose-600" : "text-slate-600 dark:text-slate-300"
                                                )}>{day}</span>
                                            </div>

                                            <div className={cn(
                                                "h-7 w-7 rounded-md flex items-center justify-center text-[9px] font-black relative border shadow-sm transition-all",
                                                manual ? "bg-amber-50 dark:bg-amber-900/30 border-amber-400 text-amber-900 dark:text-amber-200" : detail.color
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
                                        {ot && (
                                            <div 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (canEdit) {
                                                        setSelectedOT(ot);
                                                        setIsOTDialogOpen(true);
                                                    }
                                                }}
                                                className="absolute -top-2 -left-2 bg-amber-500 text-white text-[8px] font-black px-1.5 py-0.5 rounded-md shadow-md border border-white z-10 animate-pulse whitespace-nowrap"
                                            >
                                                OT {ot.totalHours.toFixed(1)}j
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop View */}
            <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-l-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden">
                <div className="overflow-x-auto pb-4">
                    <table className="w-full border-collapse">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                <th className="sticky left-0 z-20 bg-slate-50 dark:bg-slate-800/90 backdrop-blur px-6 py-4 text-left border-r border-slate-200 dark:border-slate-800 min-w-[200px]">
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nama Personil</span>
                                </th>
                                {days.map(day => {
                                    const date = constructDate(currentYear, currentMonth, day);
                                    const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                    const isToday = isCurrentMonth && day === today.getDate();
                                    const dayName = date.toLocaleString('id-ID', { weekday: 'short', timeZone: TIMEZONE }).charAt(0);
                                    const holiday = getHoliday(date, holidays);
                                    return (
                                        <th key={day} className={cn(
                                            "px-1 py-4 text-center border-l border-slate-100 dark:border-slate-800/50 min-w-[44px] relative transition-all align-bottom",
                                            isToday && "bg-emerald-50/30 dark:bg-emerald-900/10",
                                            isWeekend && !isToday && "bg-rose-50/50 dark:bg-rose-900/10",
                                            holiday && !isToday && "bg-rose-100/40 dark:bg-rose-900/10"
                                        )}>
                                            <div className="flex flex-col items-center justify-end space-y-1.5 h-full relative">
                                                <Tooltip>
                                                    <TooltipTrigger asChild>
                                                        <div className="flex flex-col items-center justify-end space-y-1.5 cursor-help group">
                                                            <div className={cn(
                                                                "text-[9px] font-black uppercase tracking-widest transition-colors",
                                                                isToday ? "text-emerald-600 dark:text-emerald-400" : (isWeekend || holiday) ? "text-rose-600" : "text-slate-400 group-hover:text-indigo-600"
                                                            )}>{dayName}</div>
                                                            <div className={cn("h-8 w-8 rounded-xl flex items-center justify-center text-[11px] font-black relative shadow-sm border transition-all duration-200",
                                                                isToday ? "bg-emerald-500 text-white border-emerald-600 shadow-lg shadow-emerald-200 dark:shadow-none" : (isWeekend || holiday) ? "bg-rose-100 text-rose-700 border-rose-200 dark:bg-rose-900/40 dark:text-rose-300 dark:border-rose-800" : "bg-white text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700 group-hover:border-indigo-500 group-hover:text-indigo-600"
                                                            )}>{day}</div>
                                                        </div>
                                                    </TooltipTrigger>
                                                    {(holiday || isToday) && (
                                                        <TooltipContent side="top" sideOffset={10} className={cn("border font-black text-xs px-4 py-2 z-[100] shadow-2xl", isToday ? "bg-emerald-600 text-white border-emerald-500" : "bg-slate-900 text-white dark:bg-white dark:text-slate-900 border-slate-700 dark:border-slate-200")}>
                                                            <div className="flex flex-col gap-1">
                                                                {isToday && <div className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-white animate-pulse" /><span className="uppercase tracking-tight text-[10px]">HARI INI</span></div>}
                                                                {holiday && <div className="flex items-center gap-2 border-t border-emerald-400/30 pt-1 mt-1"><span className="text-lg">🏮</span><span className="uppercase tracking-tight">{holiday.name}</span></div>}
                                                            </div>
                                                        </TooltipContent>
                                                    )}
                                                </Tooltip>
                                            </div>
                                        </th>
                                    );
                                })}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {users.map((user) => (
                                <tr key={user.id} className="hover:bg-slate-50/30 dark:hover:bg-white/5 transition-colors group">
                                    <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 px-6 py-4 border-r border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-white uppercase text-xs tracking-tight">
                                        <div className="flex items-center space-x-3">
                                            <div className="h-9 w-9 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center font-bold text-xs">{user.name.charAt(0)}</div>
                                            <span>{user.name}</span>
                                        </div>
                                    </td>
                                    {days.map(day => {
                                        const date = constructDate(currentYear, currentMonth, day);
                                        const isWeekend = date.getDay() === 0 || date.getDay() === 6;
                                        const isToday = isCurrentMonth && day === today.getDate();
                                        const manual = manualSchedules.find(m => {
                                            const mDate = toZonedTime(m.date, TIMEZONE);
                                            return m.userId === user.id && mDate.getDate() === day && mDate.getMonth() === currentMonth && mDate.getFullYear() === currentYear;
                                        });
                                        const shift = manual ? manual.shiftCode : getBaseShift(user, date);
                                        const detail = SHIFT_DETAILS[shift as keyof typeof SHIFT_DETAILS] || SHIFT_DETAILS.OFF;
                                        const isSelected = selectedCell?.userId === user.id && selectedCell?.day === day;
                                        const statusKey = `${user.id}-${day}`;
                                        const ot = getOvertimeForCell(user.id, day);

                                        return (
                                            <td key={day} 
                                                className={cn("p-1 border-r border-slate-100 dark:border-slate-800 text-center transition-all relative", isToday && "bg-emerald-50/50 dark:bg-emerald-900/10", isWeekend && !isToday && "bg-rose-50/20 dark:bg-rose-900/5", isSelected && "ring-2 ring-indigo-500 ring-inset z-20", canEdit ? "cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/10" : "cursor-default")}
                                                onClick={() => { if (canEdit) setSelectedCell({ userId: user.id, day }); }}>
                                                <div className={cn("h-10 w-full flex items-center justify-center rounded-lg text-[10px] font-black transition-all relative border shadow-sm", manual ? "bg-amber-50 dark:bg-amber-900/30 border-2 border-amber-400 text-amber-900 dark:text-amber-200" : detail.color)}>
                                                    {isUpdating === statusKey ? <Loader2 className="animate-spin h-4 w-4 text-indigo-600" /> : <div className="flex flex-col items-center justify-center"><span>{shift}</span></div>}
                                                    {ot && (
                                                        <div 
                                                            onClick={(e) => { e.stopPropagation(); if (canEdit) { setSelectedOT(ot); setIsOTDialogOpen(true); }}}
                                                            className="absolute -top-2.5 -right-2.5 bg-amber-500 text-white text-[9px] sm:text-[10px] font-black px-1.5 py-0.5 rounded-md shadow-md border border-white z-20 cursor-pointer hover:scale-110 active:scale-95 transition-transform whitespace-nowrap"
                                                        >
                                                            OT {ot.totalHours.toFixed(1)}j
                                                        </div>
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

            {selectedCell && (() => {
                const user = users.find(u => u.id === selectedCell.userId);
                if (!user) return null;
                const manual = manualSchedules.find(m => {
                    const mDate = toZonedTime(m.date, TIMEZONE);
                    return m.userId === selectedCell.userId && mDate.getDate() === selectedCell.day && mDate.getMonth() === currentMonth && mDate.getFullYear() === currentYear;
                });
                const date = constructDate(currentYear, currentMonth, selectedCell.day);
                const shift = manual ? manual.shiftCode : getBaseShift(user, date);
                return <ShiftPopover user={user} day={selectedCell.day} shift={shift} manual={manual} />;
            })()}

            <OvertimeDialog 
                isOpen={isOTDialogOpen}
                onClose={() => { setIsOTDialogOpen(false); setSelectedOT(undefined); setPrefillData(undefined); }}
                users={allUsers}
                editRecord={selectedOT}
                prefillUserId={prefillData?.userId}
                prefillDate={prefillData?.date}
            />
        </TooltipProvider>
    );
}
