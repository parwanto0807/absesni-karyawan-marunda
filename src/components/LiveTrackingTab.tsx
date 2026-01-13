'use client';

import React, { useState, useEffect } from 'react';
import { MapPin, Calendar, User, Search, Loader2, Navigation, Clock, ExternalLink, Map as MapIcon, ChevronRight, History, ShieldCheck } from 'lucide-react';
import { getLocationLogs, getTrackableUsers } from '@/actions/tracking';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';

interface LocationLog {
    id: string;
    userId: string;
    latitude: number;
    longitude: number;
    createdAt: Date;
    user: {
        name: string;
        role: string;
    };
}

interface TrackableUser {
    id: string;
    name: string;
    role: string;
    employeeId: string;
}

export default function LiveTrackingTab() {
    const [users, setUsers] = useState<TrackableUser[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>('');
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [logs, setLogs] = useState<LocationLog[]>([]);
    const [previewLog, setPreviewLog] = useState<LocationLog | null>(null);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            const result = await getTrackableUsers();
            if (result.success && result.data) {
                setUsers(result.data as TrackableUser[]);
            }
            setInitialLoading(false);
        };
        fetchUsers();
    }, []);

    const fetchLogs = async () => {
        if (!selectedUserId) {
            toast.error('Pilih personil terlebih dahulu');
            return;
        }

        setLoading(true);
        try {
            const result = await getLocationLogs(selectedUserId, new Date(selectedDate));
            if (result.success && result.data) {
                const fetchedLogs = result.data as LocationLog[];
                setLogs(fetchedLogs);
                if (fetchedLogs.length > 0) {
                    setPreviewLog(fetchedLogs[fetchedLogs.length - 1]);
                }
                if (fetchedLogs.length === 0) {
                    toast.info('Tidak ada log pergerakan ditemukan untuk tanggal ini');
                }
            } else {
                toast.error(result.error || 'Gagal mengambil log');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan');
        } finally {
            setLoading(false);
        }
    };

    const openPointOnMap = (lat: number, lng: number) => {
        window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
    };

    if (initialLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center space-x-2 text-slate-400">
                <Loader2 className="animate-spin" />
                <span className="text-xs font-bold uppercase tracking-widest">Memuat Data Personil...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Policy Reference Section */}
            <div className="bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-xl md:rounded-2xl shadow-xl p-5 md:p-6 text-white relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <ShieldCheck size={120} />
                </div>
                <div className="relative z-10 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-white/20 backdrop-blur-md">
                            <ShieldCheck className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl font-black uppercase tracking-tight">Kebijakan & Acuan Live Tracking</h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                            <h3 className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-80">1. Filtrasi Role</h3>
                            <p className="text-xs font-medium leading-relaxed">Hanya melacak role Security, Lingkungan, dan Kebersihan. Role Admin/PIC lainnya sepenuhnya terproteksi.</p>
                        </div>
                        <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                            <h3 className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-80">2. Validasi Jam Kerja</h3>
                            <p className="text-xs font-medium leading-relaxed">Tracking hanya aktif saat jam kerja aktif (Setelah Clock In dan sebelum Clock Out saja).</p>
                        </div>
                        <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                            <h3 className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-80">3. Proteksi Izin/Sakit</h3>
                            <p className="text-xs font-medium leading-relaxed">Lacak otomatis dihentikan jika personil dalam status Izin (PERMIT/SICK) demi menjaga privasi personil.</p>
                        </div>
                        <div className="p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                            <h3 className="text-[10px] font-black uppercase tracking-widest mb-2 opacity-80">4. Keamanan Akses</h3>
                            <p className="text-xs font-medium leading-relaxed">Data lokasi hanya berupa koordinat mentah dan hanya bisa diakses oleh Admin yang memiliki otoritas khusus.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filter Section */}
            <div className="bg-white dark:bg-slate-900 rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg p-4 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* User Selection */}
                    <div className="space-y-1.5">
                        <label className="block text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            Pilih Personil
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <select
                                value={selectedUserId}
                                onChange={(e) => setSelectedUserId(e.target.value)}
                                className="w-full h-10 md:h-12 pl-10 pr-4 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs md:text-sm font-semibold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 outline-none text-slate-900 dark:text-white appearance-none"
                            >
                                <option value="">-- Pilih Personil --</option>
                                {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                        {user.name} ({user.role})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Date Selection */}
                    <div className="space-y-1.5">
                        <label className="block text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                            Pilih Tanggal
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full h-10 md:h-12 pl-10 pr-4 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs md:text-sm font-semibold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 outline-none text-slate-900 dark:text-white"
                            />
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="flex items-end">
                        <button
                            onClick={fetchLogs}
                            disabled={loading || !selectedUserId}
                            className="w-full h-10 md:h-12 rounded-lg md:rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-bold text-xs md:text-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                        >
                            {loading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Search className="w-4 h-4" />
                            )}
                            Tampilkan Pergerakan
                        </button>
                    </div>
                </div>
            </div>

            {/* Results Section */}
            {logs.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Log List */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden flex flex-col h-[400px] md:h-[600px] order-2 lg:order-1">
                        <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-900/20">
                                    <History className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                                </div>
                                <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">Riwayat Pergerakan</h2>
                            </div>
                            <span className="px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-[10px] font-black text-slate-500 uppercase">
                                {logs.length} Titik
                            </span>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
                            {logs.map((log, index) => (
                                <div
                                    key={log.id}
                                    className={cn(
                                        "group flex items-start gap-4 p-3 rounded-xl border transition-all cursor-pointer",
                                        previewLog?.id === log.id
                                            ? "border-indigo-500 bg-indigo-50/50 dark:bg-indigo-900/20"
                                            : "border-slate-100 dark:border-slate-800 hover:border-indigo-300 dark:hover:border-indigo-700 hover:bg-slate-50 dark:hover:bg-slate-800/50"
                                    )}
                                    onClick={() => setPreviewLog(log)}
                                >
                                    <div className="flex flex-col items-center">
                                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center text-xs font-bold">
                                            {index + 1}
                                        </div>
                                        {index !== logs.length - 1 && (
                                            <div className="w-0.5 h-full bg-slate-200 dark:bg-slate-800 my-1" />
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-slate-100">
                                                <Clock className="w-3.5 h-3.5 text-indigo-500" />
                                                {format(new Date(log.createdAt), 'HH:mm:ss', { locale: id })} WIB
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    openPointOnMap(log.latitude, log.longitude);
                                                }}
                                                className="text-[10px] text-indigo-600 dark:text-indigo-400 font-bold hover:underline"
                                            >
                                                Buka Maps
                                            </button>
                                        </div>
                                        <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                                            <Navigation className="w-3 h-3" />
                                            {log.latitude.toFixed(6)}, {log.longitude.toFixed(6)}
                                        </div>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-indigo-500 transition-colors self-center" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Timeline Preview (Simple Map Mockup or visualization) */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg p-4 md:p-6 flex flex-col space-y-4 h-[500px] md:h-[600px] order-1 lg:order-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20">
                                <MapIcon className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                            </div>
                            <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">Mapping Pergerakan</h2>
                        </div>

                        <div className="flex-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 flex flex-col items-center justify-center p-8 text-center space-y-4 overflow-hidden relative">
                            {/* Display the selected point in frame with a marker */}
                            <iframe
                                width="100%"
                                height="100%"
                                className="absolute inset-0"
                                style={{ border: 0 }}
                                loading="lazy"
                                src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${previewLog?.latitude},${previewLog?.longitude}&zoom=17`}
                            />

                            <div className="absolute bottom-2 left-2 right-2 md:bottom-4 md:left-4 md:right-4 p-3 md:p-4 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 text-left">
                                <h3 className="text-[10px] md:text-xs font-black uppercase text-indigo-600 mb-1 md:mb-2">Statistik Pergerakan</h3>
                                <div className="grid grid-cols-2 gap-2 md:gap-4">
                                    <div>
                                        <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Titik Terpilih</p>
                                        <p className="text-xs md:text-sm font-black text-slate-900 dark:text-white">Ke-{logs.findIndex(l => l.id === previewLog?.id) + 1} dari {logs.length}</p>
                                    </div>
                                    <div>
                                        <p className="text-[8px] md:text-[9px] font-bold text-slate-400 uppercase leading-none mb-1">Waktu Titik</p>
                                        <p className="text-xs md:text-sm font-black text-slate-900 dark:text-white">
                                            {previewLog && format(new Date(previewLog.createdAt), 'HH:mm', { locale: id })} WIB
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => {
                                        const waypoints = logs.map(l => `${l.latitude},${l.longitude}`).join('/');
                                        window.open(`https://www.google.com/maps/dir/${waypoints}`, '_blank');
                                    }}
                                    className="mt-3 md:mt-4 w-full h-9 md:h-10 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] md:text-xs font-bold flex items-center justify-center gap-2 transition-all"
                                >
                                    <ExternalLink size={12} className="md:w-3.5 md:h-3.5" />
                                    Lihat Jalur Pergerakan
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            ) : selectedUserId && !loading ? (
                <div className="flex flex-col items-center justify-center h-[400px] bg-white dark:bg-slate-900 rounded-xl md:rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
                    <MapPin className="w-12 h-12 mb-2 opacity-20" />
                    <p className="text-sm font-medium">Klik "Tampilkan Pergerakan" untuk melihat data</p>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center h-[400px] bg-white dark:bg-slate-900 rounded-xl md:rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 text-slate-400">
                    <User className="w-12 h-12 mb-2 opacity-20" />
                    <p className="text-sm font-medium">Pilih personil untuk memantau pergerakan</p>
                </div>
            )}
        </div>
    );
}
