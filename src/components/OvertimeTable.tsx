'use client';

import React from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "./ui/table";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { Clock, Edit2, Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { toZonedTime } from 'date-fns-tz';
import { TIMEZONE } from '@/lib/date-utils';

export interface OvertimeRecord {
    id: string;
    userId: string;
    date: Date | string;
    startTime: Date | string;
    endTime: Date | string;
    totalHours: number;
    shiftRef?: string | null;
    reason?: string | null;
    notes?: string | null;
    status: string;
    user: {
        name: string;
        role: string;
        username: string;
        image?: string | null;
    };
}

interface OvertimeTableProps {
    data: OvertimeRecord[];
    onEdit: (record: OvertimeRecord) => void;
    onDelete: (id: string) => void;
}

export default function OvertimeTable({ data, onEdit, onDelete }: OvertimeTableProps) {
    if (data.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-slate-900 rounded-3xl border border-dashed border-slate-200 dark:border-slate-800">
                <div className="h-16 w-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center mb-4">
                    <Clock className="h-8 w-8 text-slate-300" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Tidak Ada Data Lembur</h3>
                <p className="text-sm text-slate-500 max-w-xs text-center mt-1">Belum ada catatan lembur untuk periode ini.</p>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
            {/* Desktop View */}
            <div className="hidden md:block overflow-x-auto">
                <Table>
                    <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
                        <TableRow>
                            <TableHead className="font-bold">Karyawan</TableHead>
                            <TableHead className="font-bold">Tanggal</TableHead>
                            <TableHead className="font-bold">Jam Lembur</TableHead>
                            <TableHead className="font-bold">Durasi</TableHead>
                            <TableHead className="font-bold">Keterangan</TableHead>
                            <TableHead className="text-right font-bold">Aksi</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {data.map((record) => {
                            const dateInJakarta = toZonedTime(record.date, TIMEZONE);
                            const startInJakarta = toZonedTime(record.startTime, TIMEZONE);
                            const endInJakarta = toZonedTime(record.endTime, TIMEZONE);

                            return (
                                <TableRow key={record.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                    <TableCell>
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-9 w-9 rounded-xl border-2 border-white dark:border-slate-800 shadow-sm">
                                                <AvatarImage src={`https://ui-avatars.com/api/?name=${record.user.name}&background=6366f1&color=fff`} />
                                                <AvatarFallback className="bg-indigo-600 text-white font-bold">
                                                    {record.user.name.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1 capitalize">
                                                    {record.user.name}
                                                </p>
                                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                                    {record.user.role}
                                                </p>
                                            </div>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <CalendarIcon size={14} className="text-slate-400" />
                                            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                                                {format(dateInJakarta, 'dd MMMM yyyy', { locale: id })}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-slate-900 dark:text-white">
                                                {format(startInJakarta, 'HH:mm')} – {format(endInJakarta, 'HH:mm')}
                                            </span>
                                            {record.shiftRef && (
                                                <Badge variant="outline" className="w-fit text-[9px] mt-1 bg-amber-50 text-amber-600 border-amber-200 px-1 py-0 font-black">
                                                    {record.shiftRef}
                                                </Badge>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-1.5">
                                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                                            <span className="text-sm font-bold text-slate-900 dark:text-white">
                                                {record.totalHours.toFixed(1)} Jam
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <p className="text-sm text-slate-600 dark:text-slate-400 max-w-[200px] truncate">
                                            {record.reason || '-'}
                                        </p>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onEdit(record)}
                                                className="h-8 w-8 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50"
                                            >
                                                <Edit2 size={16} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onDelete(record.id)}
                                                className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50"
                                            >
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
            </div>

            {/* Mobile View */}
            <div className="md:hidden p-4 space-y-4">
                {data.map((record) => {
                    const dateInJakarta = toZonedTime(record.date, TIMEZONE);
                    const startInJakarta = toZonedTime(record.startTime, TIMEZONE);
                    const endInJakarta = toZonedTime(record.endTime, TIMEZONE);

                    return (
                        <div key={record.id} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 flex flex-col gap-3">
                            <div className="flex justify-between items-start">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-10 w-10 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                                        <AvatarImage src={`https://ui-avatars.com/api/?name=${record.user.name}&background=6366f1&color=fff`} />
                                        <AvatarFallback className="bg-indigo-600 text-white font-bold">
                                            {record.user.name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <p className="text-sm font-bold text-slate-900 dark:text-white leading-none mb-1 capitalize">
                                            {record.user.name}
                                        </p>
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">
                                            {record.user.role}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-1" style={{ marginTop: '-4px', marginRight: '-4px' }}>
                                    <Button variant="ghost" size="icon" onClick={() => onEdit(record)} className="h-8 w-8 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50">
                                        <Edit2 size={16} />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => onDelete(record.id)} className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50">
                                        <Trash2 size={16} />
                                    </Button>
                                </div>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 text-sm mt-1">
                                <div className="flex items-center gap-2">
                                    <CalendarIcon size={14} className="text-slate-400 shrink-0" />
                                    <span className="font-medium text-slate-700 dark:text-slate-200 text-xs">
                                        {format(dateInJakarta, 'dd MMM yyyy', { locale: id })}
                                    </span>
                                </div>
                                <div className="flex flex-col items-start gap-1">
                                    <div className="font-black text-slate-900 dark:text-white flex items-center gap-1.5 text-xs">
                                        <Clock size={14} className="text-emerald-500 shrink-0" />
                                        {format(startInJakarta, 'HH:mm')} – {format(endInJakarta, 'HH:mm')}
                                    </div>
                                    <div className="flex items-center gap-1.5 mt-0.5">
                                        <Badge variant="outline" className="text-[9px] font-black bg-indigo-50 text-indigo-600 border-indigo-200 px-1.5 py-0">{record.totalHours.toFixed(1)} Jam</Badge>
                                        {record.shiftRef && (
                                            <Badge variant="outline" className="text-[9px] font-black bg-amber-50 text-amber-600 border-amber-200 px-1.5 py-0">
                                                {record.shiftRef}
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {record.reason && (
                                <div className="pt-3 mt-1 border-t border-slate-200 dark:border-slate-700/50">
                                    <p className="text-xs text-slate-600 dark:text-slate-400 italic leading-relaxed">
                                        &quot;{record.reason}&quot;
                                    </p>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
