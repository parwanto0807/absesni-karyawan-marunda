'use client';

import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Save, Loader2, Info, Leaf, Sparkles, Check } from 'lucide-react';
import { toast } from 'sonner';
import { getSettings, updateSettings } from '@/actions/settings';

const DAYS = [
    { id: 1, label: 'Senin', short: 'Sen' },
    { id: 2, label: 'Selasa', short: 'Sel' },
    { id: 3, label: 'Rabu', short: 'Rab' },
    { id: 4, label: 'Kamis', short: 'Kam' },
    { id: 5, label: 'Jumat', short: 'Jum' },
    { id: 6, label: 'Sabtu', short: 'Sab' },
    { id: 0, label: 'Minggu', short: 'Min' }
];

export default function ScheduleSettingsTab() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    // Lingkungan Settings
    const [lnkStart, setLnkStart] = useState('07:00');
    const [lnkEnd, setLnkEnd] = useState('17:00');
    const [lnkDays, setLnkDays] = useState<number[]>([1, 2, 3, 4, 5]);

    // Kebersihan Settings
    const [kbrStart, setKbrStart] = useState('07:00');
    const [kbrEnd, setKbrEnd] = useState('16:00');
    const [kbrDays, setKbrDays] = useState<number[]>([1, 2, 3, 4, 5, 6]);

    useEffect(() => {
        const loadScheduleSettings = async () => {
            try {
                const settings = await getSettings();

                if (settings.SCHEDULE_LINGKUNGAN_START) setLnkStart(settings.SCHEDULE_LINGKUNGAN_START);
                if (settings.SCHEDULE_LINGKUNGAN_END) setLnkEnd(settings.SCHEDULE_LINGKUNGAN_END);
                if (settings.SCHEDULE_LINGKUNGAN_WORK_DAYS) {
                    setLnkDays(settings.SCHEDULE_LINGKUNGAN_WORK_DAYS.split(',').map(Number).filter(n => !isNaN(n)));
                }

                if (settings.SCHEDULE_KEBERSIHAN_START) setKbrStart(settings.SCHEDULE_KEBERSIHAN_START);
                if (settings.SCHEDULE_KEBERSIHAN_END) setKbrEnd(settings.SCHEDULE_KEBERSIHAN_END);
                if (settings.SCHEDULE_KEBERSIHAN_WORK_DAYS) {
                    setKbrDays(settings.SCHEDULE_KEBERSIHAN_WORK_DAYS.split(',').map(Number).filter(n => !isNaN(n)));
                }
            } catch (error) {
                console.error('Failed to load schedule settings:', error);
            } finally {
                setLoading(false);
            }
        };

        loadScheduleSettings();
    }, []);

    const toggleLnkDay = (dayId: number) => {
        setLnkDays(prev =>
            prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId].sort((a, b) => a - b)
        );
    };

    const toggleKbrDay = (dayId: number) => {
        setKbrDays(prev =>
            prev.includes(dayId) ? prev.filter(d => d !== dayId) : [...prev, dayId].sort((a, b) => a - b)
        );
    };

    const handleSave = async () => {
        if (lnkDays.length === 0) {
            toast.error('Divisi Lingkungan harus memilih minimal 1 hari kerja!');
            return;
        }
        if (kbrDays.length === 0) {
            toast.error('Divisi Kebersihan harus memilih minimal 1 hari kerja!');
            return;
        }

        setSaving(true);
        try {
            const result = await updateSettings({
                SCHEDULE_LINGKUNGAN_START: lnkStart,
                SCHEDULE_LINGKUNGAN_END: lnkEnd,
                SCHEDULE_LINGKUNGAN_WORK_DAYS: lnkDays.join(','),
                SCHEDULE_KEBERSIHAN_START: kbrStart,
                SCHEDULE_KEBERSIHAN_END: kbrEnd,
                SCHEDULE_KEBERSIHAN_WORK_DAYS: kbrDays.join(',')
            });

            if (result.success) {
                toast.success('Pengaturan Jam & Hari Kerja Berhasil Disimpan', {
                    description: 'Jadwal kerja otomatis untuk Lingkungan & Kebersihan telah diperbarui'
                });
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            console.error('Save schedule error:', error);
            toast.error('Gagal Menyimpan', {
                description: 'Terjadi kesalahan saat menyimpan pengaturan jadwal'
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center space-x-2 text-slate-400">
                <Loader2 className="animate-spin" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Memuat Pengaturan Jadwal...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-300">
            {/* Header Info */}
            <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 dark:from-amber-950/20 dark:via-emerald-950/20 dark:to-teal-950/20 p-5 rounded-2xl border border-emerald-200/50 dark:border-emerald-800/50 space-y-2">
                <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-black text-sm uppercase tracking-wide">
                    <Clock className="w-5 h-5" />
                    <span>Pengaturan Jadwal Kerja Reguler Divisi</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Atur jam masuk, jam pulang, dan hari kerja operasional untuk karyawan divisi non-rotasi (Lingkungan & Kebersihan). Perubahan jadwal di sini akan langsung berlaku pada perhitungan absensi dan performance.
                </p>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* DIVISI LINGKUNGAN */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400">
                                <Leaf size={22} />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">Divisi Lingkungan</h3>
                                <p className="text-xs text-slate-400 font-medium">Jadwal Reguler Estetika & Taman</p>
                            </div>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-xs font-bold">
                            {lnkDays.length} Hari Kerja / Minggu
                        </span>
                    </div>

                    {/* Jam Kerja */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                                Jam Masuk (Clock In)
                            </label>
                            <input
                                type="time"
                                value={lnkStart}
                                onChange={e => setLnkStart(e.target.value)}
                                className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold focus:ring-2 focus:ring-amber-500/20 outline-none text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                                Jam Pulang (Clock Out)
                            </label>
                            <input
                                type="time"
                                value={lnkEnd}
                                onChange={e => setLnkEnd(e.target.value)}
                                className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold focus:ring-2 focus:ring-amber-500/20 outline-none text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Hari Kerja Checkboxes */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider flex items-center justify-between">
                            <span>Hari Kerja Active</span>
                            <span className="text-[11px] text-slate-400 font-normal">Pilih hari yang wajib absen</span>
                        </label>
                        <div className="grid grid-cols-7 gap-1.5">
                            {DAYS.map(day => {
                                const active = lnkDays.includes(day.id);
                                return (
                                    <button
                                        key={day.id}
                                        type="button"
                                        onClick={() => toggleLnkDay(day.id)}
                                        className={`py-3 px-1 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 border ${active
                                            ? 'bg-amber-500 text-white border-amber-600 shadow-md shadow-amber-500/20 scale-[1.02]'
                                            : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                            }`}
                                    >
                                        <span>{day.short}</span>
                                        {active && <Check size={12} strokeWidth={3} />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Quick Info Box */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 font-medium">
                            <span>Status Hari Libur:</span>
                            <span className="font-bold text-amber-600 dark:text-amber-400">
                                {DAYS.filter(d => !lnkDays.includes(d.id)).map(d => d.label).join(', ') || 'Tidak Ada Libur'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 font-medium">
                            <span>Durasi Kerja per Hari:</span>
                            <span className="font-bold text-slate-900 dark:text-white">
                                {lnkStart && lnkEnd ? `${lnkStart} - ${lnkEnd} WIB` : '-'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* DIVISI KEBERSIHAN */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-md p-6 space-y-6">
                    <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                        <div className="flex items-center gap-3">
                            <div className="p-3 rounded-xl bg-teal-50 dark:bg-teal-900/20 text-teal-600 dark:text-teal-400">
                                <Sparkles size={22} />
                            </div>
                            <div>
                                <h3 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight">Divisi Kebersihan</h3>
                                <p className="text-xs text-slate-400 font-medium">Jadwal Reguler Kebersihan & Sanitasi</p>
                            </div>
                        </div>
                        <span className="px-3 py-1 rounded-full bg-teal-100 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-xs font-bold">
                            {kbrDays.length} Hari Kerja / Minggu
                        </span>
                    </div>

                    {/* Jam Kerja */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                                Jam Masuk (Clock In)
                            </label>
                            <input
                                type="time"
                                value={kbrStart}
                                onChange={e => setKbrStart(e.target.value)}
                                className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold focus:ring-2 focus:ring-teal-500/20 outline-none text-slate-900 dark:text-white"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-2 uppercase tracking-wider">
                                Jam Pulang (Clock Out)
                            </label>
                            <input
                                type="time"
                                value={kbrEnd}
                                onChange={e => setKbrEnd(e.target.value)}
                                className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm font-semibold focus:ring-2 focus:ring-teal-500/20 outline-none text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Hari Kerja Checkboxes */}
                    <div>
                        <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 uppercase tracking-wider flex items-center justify-between">
                            <span>Hari Kerja Active</span>
                            <span className="text-[11px] text-slate-400 font-normal">Pilih hari yang wajib absen</span>
                        </label>
                        <div className="grid grid-cols-7 gap-1.5">
                            {DAYS.map(day => {
                                const active = kbrDays.includes(day.id);
                                return (
                                    <button
                                        key={day.id}
                                        type="button"
                                        onClick={() => toggleKbrDay(day.id)}
                                        className={`py-3 px-1 rounded-xl text-xs font-bold transition-all flex flex-col items-center justify-center gap-1 border ${active
                                            ? 'bg-teal-600 text-white border-teal-700 shadow-md shadow-teal-500/20 scale-[1.02]'
                                            : 'bg-slate-50 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700 hover:border-slate-300'
                                            }`}
                                    >
                                        <span>{day.short}</span>
                                        {active && <Check size={12} strokeWidth={3} />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Quick Info Box */}
                    <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 text-xs space-y-1">
                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 font-medium">
                            <span>Status Hari Libur:</span>
                            <span className="font-bold text-teal-600 dark:text-teal-400">
                                {DAYS.filter(d => !kbrDays.includes(d.id)).map(d => d.label).join(', ') || 'Tidak Ada Libur'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between text-slate-600 dark:text-slate-400 font-medium">
                            <span>Durasi Kerja per Hari:</span>
                            <span className="font-bold text-slate-900 dark:text-white">
                                {kbrStart && kbrEnd ? `${kbrStart} - ${kbrEnd} WIB` : '-'}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Save Button */}
            <div className="flex justify-end pt-2">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50"
                >
                    {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    {saving ? 'Menyimpan...' : 'Simpan Pengaturan Jadwal'}
                </button>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800 flex items-start gap-4">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-800 text-indigo-600 dark:text-indigo-300">
                    <Info size={16} />
                </div>
                <div className="space-y-1">
                    <p className="text-xs font-black text-indigo-700 dark:text-indigo-300 uppercase tracking-tight">Catatan Perhitungan Otomatis</p>
                    <p className="text-[10px] font-medium text-indigo-600/80 dark:text-indigo-300/60 leading-relaxed">
                        Hari yang tidak dicentang (Non-Active) secara otomatis diidentifikasi sebagai hari libur (OFF). Karyawan yang absen di hari libur tidak akan dihitung keterlambatan atau tidak hadir.
                    </p>
                </div>
            </div>
        </div>
    );
}
