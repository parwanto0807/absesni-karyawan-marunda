'use client';

import React, { useState, useEffect } from 'react';
import { getSettings, updateSettings } from '@/actions/settings';
import { MapPin, Save, Loader2, Radius, Map as MapIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function SettingsPage() {
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [settings, setSettings] = useState({
        OFFICE_LAT: '-6.123',
        OFFICE_LNG: '106.123',
        ALLOWED_RADIUS: '100', // in meters
        OFFICE_NAME: 'Marunda Center'
    });

    useEffect(() => {
        const loadSettings = async () => {
            const data = await getSettings();
            if (Object.keys(data).length > 0) {
                setSettings({
                    OFFICE_LAT: data.OFFICE_LAT || '-6.123',
                    OFFICE_LNG: data.OFFICE_LNG || '106.123',
                    ALLOWED_RADIUS: data.ALLOWED_RADIUS || '100',
                    OFFICE_NAME: data.OFFICE_NAME || 'Marunda Center'
                });
            }
            setFetching(false);
        };
        loadSettings();
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        const result = await updateSettings(settings);
        setLoading(false);
        if (result.success) {
            alert(result.message);
        } else {
            alert(result.message);
        }
    };

    if (fetching) {
        return (
            <div className="flex h-[400px] items-center justify-center">
                <Loader2 className="animate-spin text-indigo-600" size={40} />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight text-center md:text-left">Pengaturan Lokasi Absensi</h1>
                <p className="text-slate-500 dark:text-slate-400 text-center md:text-left">Tentukan titik kordinat dan radius aman untuk absen karyawan.</p>
            </div>

            {/* Grid Layout: Map (Left) + Form (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Map Preview - Left Side */}
                <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden lg:sticky lg:top-6 h-fit">
                    <div className="px-4 md:px-6 py-3 md:py-4 border-b border-slate-100 dark:border-slate-800 flex items-center space-x-2">
                        <MapIcon className="text-indigo-600" size={18} />
                        <h2 className="text-xs md:text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">
                            Preview Lokasi
                        </h2>
                    </div>
                    <div className="p-3 md:p-4">
                        {settings.OFFICE_LAT && settings.OFFICE_LNG ? (
                            <div className="space-y-3">
                                {/* Google Maps Embed */}
                                <div className="rounded-xl md:rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-lg">
                                    <iframe
                                        width="100%"
                                        height="300"
                                        className="md:h-[400px]"
                                        style={{ border: 0 }}
                                        loading="lazy"
                                        allowFullScreen
                                        referrerPolicy="no-referrer-when-downgrade"
                                        src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${settings.OFFICE_LAT},${settings.OFFICE_LNG}&zoom=18&maptype=satellite`}
                                    />
                                </div>

                                {/* Location Info */}
                                <div className="grid grid-cols-2 gap-2 md:gap-3">
                                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg md:rounded-xl p-2 md:p-3 space-y-1">
                                        <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-400">Nama Lokasi</p>
                                        <p className="text-[10px] md:text-xs font-bold text-slate-900 dark:text-white truncate">{settings.OFFICE_NAME}</p>
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800 rounded-lg md:rounded-xl p-2 md:p-3 space-y-1">
                                        <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-slate-400">Radius Aman</p>
                                        <p className="text-[10px] md:text-xs font-bold text-slate-900 dark:text-white">{settings.ALLOWED_RADIUS} Meter</p>
                                    </div>
                                    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg md:rounded-xl p-2 md:p-3 space-y-1">
                                        <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-indigo-400">Latitude</p>
                                        <p className="text-[10px] md:text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 truncate">{settings.OFFICE_LAT}</p>
                                    </div>
                                    <div className="bg-indigo-50 dark:bg-indigo-900/20 rounded-lg md:rounded-xl p-2 md:p-3 space-y-1">
                                        <p className="text-[8px] md:text-[9px] font-black uppercase tracking-widest text-indigo-400">Longitude</p>
                                        <p className="text-[10px] md:text-xs font-mono font-bold text-indigo-600 dark:text-indigo-400 truncate">{settings.OFFICE_LNG}</p>
                                    </div>
                                </div>

                                {/* Google Maps Link */}
                                <a
                                    href={`https://www.google.com/maps?q=${settings.OFFICE_LAT},${settings.OFFICE_LNG}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="flex items-center justify-center space-x-2 w-full py-2.5 md:py-3 rounded-lg md:rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-[10px] md:text-xs uppercase tracking-widest transition-all active:scale-95 shadow-lg"
                                >
                                    <MapIcon size={14} className="md:w-4 md:h-4" />
                                    <span>Buka di Google Maps</span>
                                </a>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-8 md:py-12 space-y-3 text-slate-400">
                                <MapPin size={40} className="md:w-12 md:h-12 opacity-20" />
                                <p className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-center">Masukkan koordinat untuk melihat preview peta</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Form - Right Side */}
                <form onSubmit={handleSave} className="bg-white dark:bg-slate-900 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 p-4 md:p-8 shadow-xl space-y-6 md:space-y-8 h-fit">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        {/* Office Name */}
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400">Nama Lokasi / Kantor</label>
                            <div className="relative">
                                <MapIcon className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    value={settings.OFFICE_NAME}
                                    onChange={(e) => setSettings({ ...settings, OFFICE_NAME: e.target.value })}
                                    className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-3 md:py-4 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-xs md:text-sm text-slate-900 dark:text-white"
                                    placeholder="Contoh: Marunda Center Pos 1"
                                />
                            </div>
                        </div>

                        {/* Lat */}
                        <div className="space-y-2">
                            <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400">Latitude</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    value={settings.OFFICE_LAT}
                                    onChange={(e) => setSettings({ ...settings, OFFICE_LAT: e.target.value })}
                                    className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-3 md:py-4 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-xs md:text-sm text-slate-900 dark:text-white uppercase"
                                    placeholder="-6.123456"
                                />
                            </div>
                        </div>

                        {/* Lng */}
                        <div className="space-y-2">
                            <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400">Longitude</label>
                            <div className="relative">
                                <MapPin className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="text"
                                    value={settings.OFFICE_LNG}
                                    onChange={(e) => setSettings({ ...settings, OFFICE_LNG: e.target.value })}
                                    className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-3 md:py-4 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-xs md:text-sm text-slate-900 dark:text-white uppercase"
                                    placeholder="106.123456"
                                />
                            </div>
                        </div>

                        {/* Radius */}
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-400">Radius Aman (Meter)</label>
                            <div className="relative">
                                <Radius className="absolute left-3 md:left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                <input
                                    type="number"
                                    value={settings.ALLOWED_RADIUS}
                                    onChange={(e) => setSettings({ ...settings, ALLOWED_RADIUS: e.target.value })}
                                    className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-3 md:py-4 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-xs md:text-sm text-slate-900 dark:text-white"
                                    placeholder="100"
                                />
                            </div>
                            <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Karyawan tidak bisa absen jika jarak dari kordinat di atas melebihi radius ini.</p>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className={cn(
                            "w-full py-4 md:py-5 rounded-xl md:rounded-[1.5rem] text-xs md:text-sm font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center space-x-3",
                            "bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-indigo-200 dark:shadow-none"
                        )}
                    >
                        {loading ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                        <span>Simpan Pengaturan</span>
                    </button>
                </form>
            </div>

            <div className="rounded-xl md:rounded-[2rem] border border-indigo-100 bg-indigo-50/50 p-4 md:p-6 dark:border-indigo-900/30 dark:bg-indigo-900/5 flex items-start space-x-3 md:space-x-4">
                <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shrink-0">
                    <MapIcon className="text-indigo-600" size={20} />
                </div>
                <div className="space-y-1">
                    <p className="text-xs font-bold leading-relaxed text-indigo-800 dark:text-indigo-300 uppercase tracking-tight">
                        Tips Kordinat:
                    </p>
                    <p className="text-[10px] font-medium text-indigo-600/80 dark:text-indigo-400/80 leading-relaxed uppercase tracking-widest">
                        Buka Google Maps, klik kanan pada lokasi kantor Anda, lalu salin angka kordinat yang muncul (Latitude, Longitude).
                    </p>
                </div>
            </div>
        </div>
    );
}
