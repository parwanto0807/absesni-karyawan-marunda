'use client';

import React, { useState, useEffect } from 'react';
import { Settings, BookOpen, MapPin, Save, ExternalLink, Loader2, Calendar, ClipboardList, History as HistoryIcon } from 'lucide-react';
import { toast } from 'sonner';
import PerformanceGuideTab from '@/components/PerformanceGuideTab';
import HolidaySettingsTab from '@/components/HolidaySettingsTab';
import DutySettingsTab from '@/components/DutySettingsTab';
import ActivityLogTab from '@/components/ActivityLogTab';
import { getSettings, updateSettings } from '@/actions/settings';

export default function SettingsClient({ username }: { username: string }) {
    const [activeTab, setActiveTab] = useState<'location' | 'performance' | 'holidays' | 'duty' | 'logs'>('location');
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [locationName, setLocationName] = useState('POS Cluster Taman Marunda');
    const [latitude, setLatitude] = useState('-6.251427');
    const [longitude, setLongitude] = useState('107.113802');
    const [radius, setRadius] = useState('500');

    // Load settings from database on mount
    useEffect(() => {
        const loadSettings = async () => {
            try {
                const settings = await getSettings();
                if (settings.OFFICE_NAME) setLocationName(settings.OFFICE_NAME);
                if (settings.OFFICE_LAT) setLatitude(settings.OFFICE_LAT);
                if (settings.OFFICE_LNG) setLongitude(settings.OFFICE_LNG);
                if (settings.ALLOWED_RADIUS) setRadius(settings.ALLOWED_RADIUS);
            } catch (error) {
                console.error('Failed to load settings:', error);
            } finally {
                setInitialLoading(false);
            }
        };
        loadSettings();
    }, []);

    const handleSaveSettings = async () => {
        setLoading(true);
        try {
            const result = await updateSettings({
                OFFICE_NAME: locationName,
                OFFICE_LAT: latitude,
                OFFICE_LNG: longitude,
                ALLOWED_RADIUS: radius
            });

            if (result.success) {
                toast.success('Pengaturan Berhasil Disimpan', {
                    description: 'Lokasi absensi telah diperbarui'
                });
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            toast.error('Gagal Menyimpan', {
                description: 'Terjadi kesalahan saat menyimpan pengaturan'
            });
        } finally {
            setLoading(false);
        }
    };

    const openGoogleMaps = () => {
        const url = `https://www.google.com/maps?q=${latitude},${longitude}`;
        window.open(url, '_blank');
    };

    if (initialLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center space-x-2 text-slate-400">
                <Loader2 className="animate-spin" />
                <span className="text-xs font-bold uppercase tracking-widest">Memuat Pengaturan...</span>
            </div>
        );
    }

    return (
        <div className="w-full mx-auto space-y-6 animate-in fade-in duration-700">
            {/* Header */}
            <div className="space-y-1.5 md:space-y-2">
                <div className="inline-flex items-center space-x-1.5 md:space-x-2 px-2 md:px-3 py-0.5 md:py-1 rounded-full bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 text-[9px] md:text-[10px] font-black uppercase tracking-widest">
                    <Settings size={10} className="md:w-3 md:h-3" />
                    <span>Pengaturan Sistem</span>
                </div>
                <h1 className="text-2xl md:text-3xl lg:text-4xl font-black text-slate-900 dark:text-white tracking-tighter uppercase">
                    Pengaturan <span className="text-indigo-600">Admin</span>
                </h1>
                <p className="text-xs md:text-sm text-slate-500 dark:text-slate-400 font-medium">
                    Kelola lokasi absensi dan panduan performance
                </p>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-1 md:gap-2 border-b border-slate-200 dark:border-slate-800 overflow-x-auto no-scrollbar scroll-smooth">
                <button
                    onClick={() => setActiveTab('location')}
                    title="Lokasi Absensi"
                    className={`px-4 md:px-6 py-3 font-bold text-xs md:text-sm transition-all relative whitespace-nowrap ${activeTab === 'location'
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                        }`}
                >
                    <div className="flex items-center gap-1.5 md:gap-2">
                        <MapPin size={18} className="w-4.5 h-4.5 md:w-[18px] md:h-[18px]" />
                        <span className="hidden md:inline">Lokasi Absensi</span>
                        <span className="md:hidden text-[10px] uppercase">{activeTab === 'location' && 'Lokasi'}</span>
                    </div>
                    {activeTab === 'location' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('performance')}
                    title="Panduan Performance"
                    className={`px-4 md:px-6 py-3 font-bold text-xs md:text-sm transition-all relative whitespace-nowrap ${activeTab === 'performance'
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                        }`}
                >
                    <div className="flex items-center gap-1.5 md:gap-2">
                        <BookOpen size={18} className="w-4.5 h-4.5 md:w-[18px] md:h-[18px]" />
                        <span className="hidden md:inline">Panduan Performance</span>
                        <span className="md:hidden text-[10px] uppercase">{activeTab === 'performance' && 'Performance'}</span>
                    </div>
                    {activeTab === 'performance' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('holidays')}
                    title="Hari Libur"
                    className={`px-4 md:px-6 py-3 font-bold text-xs md:text-sm transition-all relative whitespace-nowrap ${activeTab === 'holidays'
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                        }`}
                >
                    <div className="flex items-center gap-1.5 md:gap-2">
                        <Calendar size={18} className="w-4.5 h-4.5 md:w-[18px] md:h-[18px]" />
                        <span className="hidden md:inline">Hari Libur</span>
                        <span className="md:hidden text-[10px] uppercase">{activeTab === 'holidays' && 'Libur'}</span>
                    </div>
                    {activeTab === 'holidays' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('duty')}
                    title="Tugas & Kewajiban"
                    className={`px-4 md:px-6 py-3 font-bold text-xs md:text-sm transition-all relative whitespace-nowrap ${activeTab === 'duty'
                        ? 'text-indigo-600 dark:text-indigo-400'
                        : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                        }`}
                >
                    <div className="flex items-center gap-1.5 md:gap-2">
                        <ClipboardList size={18} className="w-4.5 h-4.5 md:w-[18px] md:h-[18px]" />
                        <span className="hidden md:inline">Tugas & Kewajiban</span>
                        <span className="md:hidden text-[10px] uppercase">{activeTab === 'duty' && 'Tugas'}</span>
                    </div>
                    {activeTab === 'duty' && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
                    )}
                </button>

                {username === 'adminit' && (
                    <button
                        onClick={() => setActiveTab('logs')}
                        title="Log Aktivitas"
                        className={`px-4 md:px-6 py-3 font-bold text-xs md:text-sm transition-all relative whitespace-nowrap ${activeTab === 'logs'
                            ? 'text-indigo-600 dark:text-indigo-400'
                            : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'
                            }`}
                    >
                        <div className="flex items-center gap-1.5 md:gap-2">
                            <HistoryIcon size={18} className="w-4.5 h-4.5 md:w-[18px] md:h-[18px]" />
                            <span className="hidden md:inline">Log Aktivitas</span>
                            <span className="md:hidden text-[10px] uppercase">{activeTab === 'logs' && 'Log'}</span>
                        </div>
                        {activeTab === 'logs' && (
                            <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600 dark:bg-indigo-400" />
                        )}
                    </button>
                )}
            </div>

            {/* Tab Content */}
            {activeTab === 'location' ? (
                // Location Settings Tab
                <div className="grid gap-6 lg:grid-cols-2">
                    {/* Map Preview */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg p-4 md:p-6 space-y-3 md:space-y-4">
                        <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-4">
                            <div className="p-2 md:p-3 rounded-lg md:rounded-xl bg-indigo-50 dark:bg-indigo-900/20">
                                <MapPin className="w-5 h-5 md:w-6 md:h-6 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">Preview Lokasi</h2>
                                <p className="text-[10px] md:text-xs text-slate-500">Peta lokasi absensi karyawan</p>
                            </div>
                        </div>

                        {/* Map Preview - Google Maps */}
                        <div className="relative w-full h-[250px] md:h-[350px] lg:h-[400px] rounded-lg md:rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700">
                            <iframe
                                width="100%"
                                height="100%"
                                style={{ border: 0 }}
                                loading="lazy"
                                allowFullScreen
                                referrerPolicy="no-referrer-when-downgrade"
                                src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyBFw0Qbyq9zTFTd-tUY6dZWTgaQzuU17R8&q=${latitude},${longitude}&zoom=17`}
                            />
                        </div>

                        {/* Location Info */}
                        <div className="grid grid-cols-2 gap-2 md:gap-4 p-3 md:p-4 rounded-lg md:rounded-xl bg-slate-50 dark:bg-slate-800/50">
                            <div>
                                <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 md:mb-1">Nama Lokasi</p>
                                <p className="text-xs md:text-sm font-bold text-slate-900 dark:text-white truncate">{locationName}</p>
                            </div>
                            <div>
                                <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 md:mb-1">Radius Aman</p>
                                <p className="text-xs md:text-sm font-bold text-slate-900 dark:text-white">{radius} Meter</p>
                            </div>
                            <div>
                                <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 md:mb-1">Latitude</p>
                                <p className="text-[10px] md:text-xs font-mono text-slate-700 dark:text-slate-300">{latitude}</p>
                            </div>
                            <div>
                                <p className="text-[9px] md:text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5 md:mb-1">Longitude</p>
                                <p className="text-[10px] md:text-xs font-mono text-slate-700 dark:text-slate-300">{longitude}</p>
                            </div>
                        </div>

                        <button
                            onClick={openGoogleMaps}
                            className="w-full h-10 md:h-12 rounded-lg md:rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs md:text-sm flex items-center justify-center gap-1.5 md:gap-2 transition-all active:scale-95"
                        >
                            <ExternalLink size={16} className="md:w-[18px] md:h-[18px]" />
                            <span>Buka di Google Maps</span>
                        </button>
                    </div>

                    {/* Settings Form */}
                    <div className="bg-white dark:bg-slate-900 rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg p-4 md:p-6 space-y-4 md:space-y-6">
                        <div>
                            <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white mb-2 md:mb-4">Pengaturan Lokasi Absensi</h2>
                            <p className="text-[10px] md:text-xs text-slate-500 dark:text-slate-400">
                                Tentukan titik koordinat dan radius aman untuk absen karyawan.
                            </p>
                        </div>

                        {/* Form Fields */}
                        <div className="space-y-3 md:space-y-4">
                            {/* Location Name */}
                            <div>
                                <label className="block text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 md:mb-2 uppercase tracking-wider">
                                    Nama Lokasi / Kantor
                                </label>
                                <input
                                    type="text"
                                    value={locationName}
                                    onChange={(e) => setLocationName(e.target.value)}
                                    className="w-full h-10 md:h-12 px-3 md:px-4 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs md:text-sm font-semibold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 outline-none text-slate-900 dark:text-white"
                                    placeholder="POS Cluster Taman Marunda"
                                />
                            </div>

                            {/* Latitude */}
                            <div>
                                <label className="block text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 md:mb-2 uppercase tracking-wider">
                                    Latitude
                                </label>
                                <input
                                    type="text"
                                    value={latitude}
                                    onChange={(e) => setLatitude(e.target.value)}
                                    className="w-full h-10 md:h-12 px-3 md:px-4 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs md:text-sm font-mono focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 outline-none text-slate-900 dark:text-white"
                                    placeholder="-6.251427"
                                />
                            </div>

                            {/* Longitude */}
                            <div>
                                <label className="block text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 md:mb-2 uppercase tracking-wider">
                                    Longitude
                                </label>
                                <input
                                    type="text"
                                    value={longitude}
                                    onChange={(e) => setLongitude(e.target.value)}
                                    className="w-full h-10 md:h-12 px-3 md:px-4 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs md:text-sm font-mono focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 outline-none text-slate-900 dark:text-white"
                                    placeholder="107.113802"
                                />
                            </div>

                            {/* Radius */}
                            <div>
                                <label className="block text-[10px] md:text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5 md:mb-2 uppercase tracking-wider">
                                    Radius Aman (Meter)
                                </label>
                                <input
                                    type="number"
                                    value={radius}
                                    onChange={(e) => setRadius(e.target.value)}
                                    className="w-full h-10 md:h-12 px-3 md:px-4 rounded-lg md:rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs md:text-sm font-semibold focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 dark:focus:ring-indigo-800 outline-none text-slate-900 dark:text-white"
                                    placeholder="500"
                                />
                                <p className="mt-1.5 md:mt-2 text-[10px] md:text-xs text-slate-500 dark:text-slate-400">
                                    Karyawan hanya bisa absen dalam radius {radius} meter dari lokasi ini
                                </p>
                            </div>
                        </div>

                        {/* Save Button */}
                        <button
                            onClick={handleSaveSettings}
                            disabled={loading}
                            className="w-full h-12 md:h-14 rounded-lg md:rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-bold text-xs md:text-sm flex items-center justify-center gap-1.5 md:gap-2 transition-all active:scale-95 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <>
                                    <Loader2 size={16} className="md:w-[18px] md:h-[18px] animate-spin" />
                                    <span>Menyimpan...</span>
                                </>
                            ) : (
                                <>
                                    <Save size={16} className="md:w-[18px] md:h-[18px]" />
                                    <span>Simpan Pengaturan</span>
                                </>
                            )}
                        </button>

                        {/* Info */}
                        <div className="p-3 md:p-4 rounded-lg md:rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
                            <p className="text-[10px] md:text-xs text-blue-700 dark:text-blue-300">
                                <strong>Catatan:</strong> Perubahan pengaturan lokasi akan mempengaruhi semua karyawan yang melakukan absensi.
                                Pastikan koordinat dan radius sudah sesuai sebelum menyimpan.
                            </p>
                        </div>
                    </div>
                </div>
            ) : activeTab === 'performance' ? (
                // Performance Guide Tab
                <PerformanceGuideTab />
            ) : activeTab === 'duty' ? (
                // Duty Settings Tab
                <DutySettingsTab />
            ) : activeTab === 'logs' ? (
                // Activity Log Tab
                <ActivityLogTab />
            ) : (
                // Holiday Settings Tab
                <HolidaySettingsTab />
            )}
        </div>
    );
}
