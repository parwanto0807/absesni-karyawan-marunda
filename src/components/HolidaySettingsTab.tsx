'use client';

import React, { useState, useEffect } from 'react';
import { Calendar, Plus, Trash2, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { getHolidays, addHoliday, deleteHoliday } from '@/actions/holidays';
import { toZonedTime } from 'date-fns-tz';
import { TIMEZONE } from '@/lib/date-utils';
import { INDONESIAN_HOLIDAYS_2026 } from '@/lib/holiday-utils';

export default function HolidaySettingsTab() {
    const [holidays, setHolidays] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [isAdding, setIsAdding] = useState(false);
    const [isSeeding, setIsSeeding] = useState(false);

    // Form state
    const [newDate, setNewDate] = useState('');
    const [newName, setNewName] = useState('');
    const [isCuti, setIsCuti] = useState(false);

    const currentYear = new Date().getFullYear();

    useEffect(() => {
        loadHolidays();
    }, []);

    const loadHolidays = async () => {
        setLoading(true);
        try {
            const data = await getHolidays();
            setHolidays(data);
        } catch (error) {
            toast.error('Gagal memuat data hari libur');
        } finally {
            setLoading(false);
        }
    };

    const handleAddHoliday = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newDate || !newName) return;

        setIsAdding(true);
        try {
            const result = await addHoliday({
                date: new Date(newDate),
                name: newName,
                isCutiBersama: isCuti
            });

            if (result.success) {
                toast.success('Hari libur ditambahkan');
                setNewDate('');
                setNewName('');
                setIsCuti(false);
                loadHolidays();
            } else {
                toast.error(result.message || 'Gagal menambah hari libur');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan');
        } finally {
            setIsAdding(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Hapus hari libur ini?')) return;

        try {
            const result = await deleteHoliday(id);
            if (result.success) {
                toast.success('Hari libur dihapus');
                loadHolidays();
            }
        } catch (error) {
            toast.error('Gagal menghapus');
        }
    };

    const handleSeedData = async () => {
        if (!confirm('Ingin mengisi otomatis daftar libur nasional 2026 ke Database?')) return;

        setIsSeeding(true);
        try {
            let successCount = 0;
            for (const h of INDONESIAN_HOLIDAYS_2026) {
                const res = await addHoliday({
                    date: new Date(h.date),
                    name: h.name,
                    isCutiBersama: h.isCutiBersama
                });
                if (res.success) successCount++;
            }
            toast.success(`${successCount} Hari libur berhasil diimpor`);
            loadHolidays();
        } catch (error) {
            toast.error('Gagal mengimpor data');
        } finally {
            setIsSeeding(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="grid lg:grid-cols-3 gap-6">
                {/* Form Add */}
                <div className="lg:col-span-1">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-6 shadow-sm sticky top-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-600">
                                <Plus size={20} />
                            </div>
                            <h2 className="font-black text-slate-900 dark:text-white uppercase tracking-tight">Tambah Libur</h2>
                        </div>

                        <form onSubmit={handleAddHoliday} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Tanggal</label>
                                <input
                                    type="date"
                                    required
                                    value={newDate}
                                    onChange={(e) => setNewDate(e.target.value)}
                                    className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 px-1">Nama Hari Libur</label>
                                <input
                                    type="text"
                                    required
                                    placeholder="Contoh: Idul Fitri"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                    className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-bold focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all"
                                />
                            </div>
                            <div className="flex items-center gap-3 px-1">
                                <input
                                    type="checkbox"
                                    id="isCuti"
                                    checked={isCuti}
                                    onChange={(e) => setIsCuti(e.target.checked)}
                                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                />
                                <label htmlFor="isCuti" className="text-xs font-bold text-slate-600 dark:text-slate-400 cursor-pointer">Cuti Bersama</label>
                            </div>
                            <button
                                type="submit"
                                disabled={isAdding}
                                className="w-full h-12 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-black text-xs uppercase tracking-widest shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50"
                            >
                                {isAdding ? <Loader2 className="animate-spin mx-auto" size={18} /> : 'Simpan Hari Libur'}
                            </button>
                        </form>
                    </div>
                </div>

                {/* List Table/Cards */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 md:p-5 rounded-2xl border border-slate-200 dark:border-slate-800">
                        <div>
                            <h2 className="font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2 text-sm md:text-base">
                                <Calendar className="text-indigo-600" size={18} />
                                Daftar Hari Libur
                            </h2>
                            <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tahun {currentYear} & Mendatang</p>
                        </div>
                        <button
                            onClick={handleSeedData}
                            disabled={isSeeding}
                            className="flex items-center justify-center gap-2 px-4 py-2 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-colors border border-emerald-100 dark:border-emerald-800 w-full sm:w-auto"
                        >
                            {isSeeding ? <Loader2 className="animate-spin" size={14} /> : <RefreshCw size={14} />}
                            Sinkron SKB 2026
                        </button>
                    </div>

                    <div className="space-y-3">
                        {loading ? (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center text-slate-400 font-bold text-xs uppercase tracking-widest">
                                <Loader2 className="animate-spin mx-auto mb-2" />
                                Memuat data...
                            </div>
                        ) : holidays.length === 0 ? (
                            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-12 text-center">
                                <AlertCircle className="mx-auto mb-2 text-slate-300" size={32} />
                                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Belum ada hari libur</p>
                                <p className="text-[10px] text-slate-400 mt-1 uppercase tracking-tighter italic">Klik "Sinkron SKB 2026" untuk mengisi cepat.</p>
                            </div>
                        ) : (
                            <>
                                {/* Desktop View (Table) */}
                                <div className="hidden sm:block bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead>
                                                <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Tanggal</th>
                                                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Keterangan</th>
                                                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Jenis</th>
                                                    <th className="px-5 py-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-bold">
                                                {holidays.map((h) => (
                                                    <tr key={h.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                                                        <td className="px-5 py-4">
                                                            <span className="text-xs font-black text-slate-700 dark:text-slate-200">
                                                                {new Date(h.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                            </span>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            <span className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase">{h.name}</span>
                                                        </td>
                                                        <td className="px-5 py-4">
                                                            {h.isCutiBersama ? (
                                                                <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded text-[8px] font-black uppercase tracking-tighter border border-amber-100 dark:border-amber-800">Cuti Bersama</span>
                                                            ) : (
                                                                <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded text-[8px] font-black uppercase tracking-tighter border border-rose-100 dark:border-rose-800">Libur Nasional</span>
                                                            )}
                                                        </td>
                                                        <td className="px-5 py-4 text-right">
                                                            <button
                                                                onClick={() => handleDelete(h.id)}
                                                                className="p-2 text-slate-300 hover:text-rose-600 transition-colors"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>

                                {/* Mobile View (Cards) */}
                                <div className="sm:hidden space-y-3">
                                    {holidays.map((h) => (
                                        <div key={h.id} className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-4 shadow-sm relative group active:scale-[0.98] transition-all">
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="space-y-0.5">
                                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                                        {new Date(h.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                    </p>
                                                    <h4 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight">{h.name}</h4>
                                                </div>
                                                <button
                                                    onClick={() => handleDelete(h.id)}
                                                    className="p-1.5 text-slate-300 active:text-rose-600 transition-colors"
                                                >
                                                    <Trash2 size={15} />
                                                </button>
                                            </div>
                                            <div className="mt-2 text-right">
                                                {h.isCutiBersama ? (
                                                    <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 rounded text-[8px] font-black uppercase tracking-tighter border border-amber-100 dark:border-amber-800">Cuti Bersama</span>
                                                ) : (
                                                    <span className="px-2 py-0.5 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded text-[8px] font-black uppercase tracking-tighter border border-rose-100 dark:border-rose-800">Libur Nasional</span>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
