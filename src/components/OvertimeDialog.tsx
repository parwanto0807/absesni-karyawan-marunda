'use client';

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "./ui/select";
import { upsertOvertime, deleteOvertime } from '@/actions/overtime';
import { toast } from 'sonner';
import { Loader2, Clock, Calendar } from 'lucide-react';
import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';
import { TIMEZONE } from '@/lib/date-utils';

interface OvertimeUser {
    id: string;
    name: string;
    role: string;
    employeeId?: string;
}

import { OvertimeRecord } from './OvertimeTable';

interface OvertimeDialogProps {
    isOpen: boolean;
    onClose: () => void;
    users: OvertimeUser[];
    prefillUserId?: string;
    prefillDate?: string; // YYYY-MM-DD
    editRecord?: OvertimeRecord;
}

export default function OvertimeDialog({
    isOpen,
    onClose,
    users,
    prefillUserId,
    prefillDate,
    editRecord
}: OvertimeDialogProps) {
    const [userId, setUserId] = useState(editRecord?.userId || prefillUserId || '');
    const [date, setDate] = useState(editRecord ? format(toZonedTime(editRecord.date, TIMEZONE), 'yyyy-MM-dd') : prefillDate || format(new Date(), 'yyyy-MM-dd'));
    const [startTime, setStartTime] = useState(editRecord ? format(toZonedTime(editRecord.startTime, TIMEZONE), "yyyy-MM-dd'T'HH:mm") : '');
    const [endTime, setEndTime] = useState(editRecord ? format(toZonedTime(editRecord.endTime, TIMEZONE), "yyyy-MM-dd'T'HH:mm") : '');
    const [reason, setReason] = useState(editRecord?.reason || '');
    const [shiftRef, setShiftRef] = useState(editRecord?.shiftRef || '');
    const [notes, setNotes] = useState(editRecord?.notes || '');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [calculatedHours, setCalculatedHours] = useState(editRecord?.totalHours || 0);

    // Reset form when dialog opens
    useEffect(() => {
        if (isOpen) {
            setUserId(editRecord?.userId || prefillUserId || '');
            setDate(editRecord ? format(toZonedTime(editRecord.date, TIMEZONE), 'yyyy-MM-dd') : prefillDate || format(new Date(), 'yyyy-MM-dd'));
            setStartTime(editRecord ? format(toZonedTime(editRecord.startTime, TIMEZONE), "yyyy-MM-dd'T'HH:mm") : '');
            setEndTime(editRecord ? format(toZonedTime(editRecord.endTime, TIMEZONE), "yyyy-MM-dd'T'HH:mm") : '');
            setReason(editRecord?.reason || '');
            setShiftRef(editRecord?.shiftRef || '');
            setNotes(editRecord?.notes || '');
            setCalculatedHours(editRecord?.totalHours || 0);
        }
    }, [isOpen, editRecord, prefillUserId, prefillDate]);

    // Update derived values when date/start/end change
    useEffect(() => {
        if (startTime && endTime) {
            const start = new Date(startTime);
            const end = new Date(endTime);
            let diff = end.getTime() - start.getTime();
            if (diff < 0) {
                // cross midnight
                diff += 24 * 60 * 60 * 1000;
            }
            setCalculatedHours(diff / (1000 * 60 * 60));
        } else {
            setCalculatedHours(0);
        }
    }, [startTime, endTime]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userId || !date || !startTime || !endTime) {
            toast.error('Mohon lengkapi semua data wajib.');
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await upsertOvertime({
                id: editRecord?.id,
                userId,
                date: new Date(date + 'T12:00:00Z'), // UTC Noon for calendar tracking
                startTime: new Date(startTime),
                endTime: new Date(endTime),
                reason,
                shiftRef,
                notes,
            });

            if (result.success) {
                toast.success(editRecord ? 'Data lembur diperbarui.' : 'Lembur berhasil ditambahkan.');
                onClose();
            } else {
                toast.error(result.error || 'Terjadi kesalahan.');
            }
        } catch (_error) {
            toast.error('Terjadi kesalahan koneksi.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!editRecord?.id) return;
        if (!confirm('Hapus data lembur ini?')) return;

        setIsSubmitting(true);
        try {
            const result = await deleteOvertime(editRecord.id);
            if (result.success) {
                toast.success('Lembur berhasil dihapus.');
                onClose();
            } else {
                toast.error(result.error || 'Terjadi kesalahan.');
            }
        } catch (_error) {
            toast.error('Terjadi kesalahan koneksi.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="sm:max-w-[425px] rounded-2xl">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Clock className="h-5 w-5 text-indigo-600" />
                        {editRecord ? 'Edit Data Lembur' : 'Tambah Lembur Karyawan'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="user">Karyawan</Label>
                        <Select value={userId} onValueChange={setUserId} disabled={!!editRecord}>
                            <SelectTrigger className="rounded-xl border-slate-200">
                                <SelectValue placeholder="Pilih karyawan" />
                            </SelectTrigger>
                            <SelectContent>
                                {users.map(u => (
                                    <SelectItem key={u.id} value={u.id}>
                                        {u.name} ({u.role})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="date">Tanggal Kalender</Label>
                        <div className="relative">
                            <Input
                                id="date"
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="rounded-xl border-slate-200 pl-10"
                            />
                            <Calendar className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="startTime">Jam Mulai</Label>
                            <Input
                                id="startTime"
                                type="datetime-local"
                                value={startTime}
                                onChange={(e) => setStartTime(e.target.value)}
                                className="rounded-xl border-slate-200"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="endTime">Jam Selesai</Label>
                            <Input
                                id="endTime"
                                type="datetime-local"
                                value={endTime}
                                onChange={(e) => setEndTime(e.target.value)}
                                className="rounded-xl border-slate-200"
                            />
                        </div>
                    </div>

                    {calculatedHours > 0 && (
                        <div className="p-3 bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-xl">
                            <p className="text-xs font-bold text-indigo-600 uppercase tracking-widest text-center">
                                Estimasi: {calculatedHours.toFixed(1)} Jam Lembur
                            </p>
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="shiftRef">Shift Referensi (Opsional)</Label>
                        <Select value={shiftRef} onValueChange={setShiftRef}>
                            <SelectTrigger className="rounded-xl border-slate-200">
                                <SelectValue placeholder="Pilih shift (jika ada)" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="P">Shift P (Pagi)</SelectItem>
                                <SelectItem value="PM">Shift PM (Siang-Malam)</SelectItem>
                                <SelectItem value="M">Shift M (Malam-Pagi)</SelectItem>
                                <SelectItem value="EARLY">Pre-Shift (Lembur Awal)</SelectItem>
                                <SelectItem value="EXTRA">Ekstra (Lembur Tambahan)</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="reason">Alasan / Keterangan</Label>
                        <Input
                            id="reason"
                            placeholder="Misal: Penjagaan tambahan acara warga"
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            className="rounded-xl border-slate-200"
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="notes">Catatan Internal (Admin)</Label>
                        <Input
                            id="notes"
                            placeholder="Catatan tambahan (opsional)"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="rounded-xl border-slate-200"
                        />
                    </div>

                    <DialogFooter className="pt-4 flex sm:justify-between items-center">
                        {editRecord && (
                            <Button
                                type="button"
                                variant="ghost"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
                                onClick={handleDelete}
                                disabled={isSubmitting}
                            >
                                Hapus
                            </Button>
                        )}
                        <div className="flex gap-2 ml-auto">
                            <Button type="button" variant="outline" onClick={onClose} className="rounded-xl">Batal</Button>
                            <Button type="submit" className="rounded-xl bg-indigo-600 hover:bg-indigo-700" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Simpan Data
                            </Button>
                        </div>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
