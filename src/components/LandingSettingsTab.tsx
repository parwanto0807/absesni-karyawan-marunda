'use client';

import React, { useState, useEffect } from 'react';
import {
    Layout,
    Image as ImageIcon,
    List,
    Bell,
    Plus,
    Trash2,
    Save,
    Loader2,
    Type,
    Smartphone,
    Activity as ActivityIcon,
    Shield,
    Info,
    CheckCircle2,
    Users,
    Calendar,
    Megaphone,
    TreePine
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
    getLandingSettings,
    updateLandingSetting,
    getLandingActivities,
    addLandingActivity,
    deleteLandingActivity,
    getLandingServices,
    addLandingService,
    deleteLandingService
} from '@/actions/landing';
import NextImage from 'next/image';

interface Activity {
    id: string;
    title: string;
    time: string;
    description: string | null;
    image: string | null;
}

interface Service {
    id: string;
    icon: string;
    title: string;
    description: string;
}

export default function LandingSettingsTab() {
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);

    // Settings State
    const [heroTitle, setHeroTitle] = useState('');
    const [heroSubtitle, setHeroSubtitle] = useState('');
    const [footerInfo, setFooterInfo] = useState('');
    const [defaultPage, setDefaultPage] = useState('landing');

    // Lists State
    const [activities, setActivities] = useState<Activity[]>([]);
    const [services, setServices] = useState<Service[]>([]);

    // Form Inputs
    const [newActivityTitle, setNewActivityTitle] = useState('');
    const [newActivityTime, setNewActivityTime] = useState('');
    const [newActivityDesc, setNewActivityDesc] = useState('');
    const [newActivityImage, setNewActivityImage] = useState('');
    const [newServiceTitle, setNewServiceTitle] = useState('');
    const [newServiceIcon, setNewServiceIcon] = useState('Info');
    const [newServiceDesc, setNewServiceDesc] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    async function loadData() {
        try {
            const [settings, acts, svcs] = await Promise.all([
                getLandingSettings(),
                getLandingActivities(),
                getLandingServices()
            ]);

            setHeroTitle(settings['landing_hero_title'] || 'Sejuk, Aman & Harmonis Untuk Warga');
            setHeroSubtitle(settings['landing_hero_subtitle'] || 'Menyatukan keberagaman suku bangsa dari Jawa, Sumatera, Kalimantan, Papua, hingga NTT dalam satu lingkungan yang asri dan nyaman di Metland Cibitung.');
            setFooterInfo(settings['landing_footer_info'] || 'Membangun komunitas multikultural yang harmonis, aman, dan sejuk di jantung Bekasi. Wadah aspirasi untuk warga RT 003 & 004 RW 26 Metland Cibitung.');
            setDefaultPage(settings['landing_default_page'] || 'landing');
            setActivities(acts as Activity[]);
            setServices(svcs as Service[]);
        } catch (_error) {
            toast.error('Gagal memuat data landing');
        } finally {
            setInitialLoading(false);
        }
    }

    const handleSaveGeneral = async () => {
        setLoading(true);
        try {
            await Promise.all([
                updateLandingSetting('hero_title', heroTitle),
                updateLandingSetting('hero_subtitle', heroSubtitle),
                updateLandingSetting('footer_info', footerInfo),
                updateLandingSetting('default_page', defaultPage)
            ]);
            toast.success('Pengaturan teks berhasil disimpan');
        } catch (_error) {
            toast.error('Gagal menyimpan pengaturan');
        } finally {
            setLoading(false);
        }
    };

    const handleAddActivity = async () => {
        if (!newActivityTitle || !newActivityTime) return;
        setLoading(true);
        try {
            await addLandingActivity(newActivityTitle, newActivityTime, newActivityDesc, newActivityImage);
            setNewActivityTitle('');
            setNewActivityTime('');
            setNewActivityDesc('');
            setNewActivityImage('');
            const acts = await getLandingActivities();
            setActivities(acts as Activity[]);
            toast.success('Kegiatan berhasil ditambahkan');
        } catch (_error) {
            toast.error('Gagal menambah kegiatan');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteActivity = async (id: string) => {
        setLoading(true);
        try {
            await deleteLandingActivity(id);
            const acts = await getLandingActivities();
            setActivities(acts as Activity[]);
            toast.success('Kegiatan berhasil dihapus');
        } catch (_error) {
            toast.error('Gagal menghapus kegiatan');
        } finally {
            setLoading(false);
        }
    };

    const handleAddService = async () => {
        if (!newServiceTitle || !newServiceDesc) return;
        setLoading(true);
        try {
            await addLandingService(newServiceIcon, newServiceTitle, newServiceDesc);
            setNewServiceTitle('');
            setNewServiceDesc('');
            const svcs = await getLandingServices();
            setServices(svcs as Service[]);
            toast.success('Layanan berhasil ditambahkan');
        } catch (_error) {
            toast.error('Gagal menambah layanan');
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteService = async (id: string) => {
        setLoading(true);
        try {
            await deleteLandingService(id);
            const svcs = await getLandingServices();
            setServices(svcs as Service[]);
            toast.success('Layanan berhasil dihapus');
        } catch (_error) {
            toast.error('Gagal menghapus layanan');
        } finally {
            setLoading(false);
        }
    };

    const handleImageUpload = async (key: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = reader.result as string;
            setLoading(true);
            try {
                await updateLandingSetting(key, base64String);
                toast.success('Foto berhasil diperbarui');
            } catch (_error) {
                toast.error('Gagal memperbarui foto');
            } finally {
                setLoading(false);
            }
        };
        reader.readAsDataURL(file);
    };

    if (initialLoading) {
        return (
            <div className="flex h-[400px] items-center justify-center space-x-2 text-slate-400">
                <Loader2 className="animate-spin" />
                <span className="text-xs font-bold uppercase tracking-widest">Memuat Konfigurasi Website...</span>
            </div>
        );
    }

    return (
        <div className="grid gap-6 lg:grid-cols-2 pb-20">
            {/* Website Configuration & Redirect Settings */}
            <div className="lg:col-span-2 bg-gradient-to-r from-indigo-600 to-blue-700 rounded-[2rem] p-8 text-white shadow-xl overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                    <Smartphone size={120} />
                </div>
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-white/20 backdrop-blur-md rounded-lg">
                                <Layout size={24} />
                            </div>
                            <h2 className="text-xl font-black uppercase tracking-tight">Konfigurasi Halaman Utama</h2>
                        </div>
                        <p className="text-sm text-indigo-100 font-medium">Tentukan halaman mana yang akan tampil pertama kali saat membuka website.</p>
                    </div>

                    <div className="flex items-center bg-white/10 backdrop-blur-xl p-2 rounded-2xl border border-white/20">
                        <button
                            onClick={() => setDefaultPage('landing')}
                            className={cn(
                                "flex items-center gap-3 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                defaultPage === 'landing' ? "bg-white text-indigo-600 shadow-lg scale-105" : "text-white hover:bg-white/10"
                            )}
                        >
                            <Layout size={16} />
                            Landing Page
                        </button>
                        <button
                            onClick={() => setDefaultPage('login')}
                            className={cn(
                                "flex items-center gap-3 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                                defaultPage === 'login' ? "bg-white text-indigo-600 shadow-lg scale-105" : "text-white hover:bg-white/10"
                            )}
                        >
                            <ImageIcon size={16} />
                            Halaman Login
                        </button>
                    </div>
                </div>
            </div>

            {/* General Content Settings */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg p-6 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600">
                        <Type size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">Teks Utama Website</h2>
                        <p className="text-xs text-slate-500">Judul, deskripsi hero, dan informasi footer.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hero Title</label>
                        <textarea
                            value={heroTitle}
                            onChange={(e) => setHeroTitle(e.target.value)}
                            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm font-semibold outline-none focus:border-indigo-500 min-h-[100px]"
                            placeholder="Contoh: Sejuk, Aman & Harmonis"
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Hero Subtitle</label>
                        <textarea
                            value={heroSubtitle}
                            onChange={(e) => setHeroSubtitle(e.target.value)}
                            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-sm font-medium outline-none focus:border-indigo-500 min-h-[120px]"
                            placeholder="Deskripsi singkat lingkungan..."
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Footer Info</label>
                        <textarea
                            value={footerInfo}
                            onChange={(e) => setFooterInfo(e.target.value)}
                            className="w-full p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900 text-xs font-medium outline-none focus:border-indigo-500 min-h-[80px]"
                            placeholder="Informasi hak cipta / visi..."
                        />
                    </div>
                    <button
                        onClick={handleSaveGeneral}
                        disabled={loading}
                        className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 hover:bg-indigo-600 transition-all disabled:opacity-50"
                    >
                        {loading ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                        Simpan Perubahan Teks
                    </button>
                </div>
            </div>

            {/* Image Settings */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg p-6 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600">
                        <ImageIcon size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">Galeri Foto Utama</h2>
                        <p className="text-xs text-slate-500">Update foto hero, kegiatan, dan keamanan.</p>
                    </div>
                </div>

                <div className="grid gap-4">
                    {[
                        { key: 'hero_image', label: 'Foto Hero (Diversity)', icon: Users },
                        { key: 'activity_image', label: 'Foto Kegiatan Warga', icon: ActivityIcon },
                        { key: 'security_image', label: 'Foto Keamanan (Gate)', icon: Shield },
                    ].map((img) => (
                        <div key={img.key} className="p-4 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between group">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-400">
                                    <img.icon size={18} />
                                </div>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-tight">{img.label}</span>
                            </div>
                            <label className="cursor-pointer bg-white border border-slate-200 px-4 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm">
                                Ganti Foto
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={(e) => handleImageUpload(img.key, e)}
                                />
                            </label>
                        </div>
                    ))}
                </div>

                <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20">
                    <div className="flex gap-3">
                        <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                        <p className="text-[10px] text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
                            <strong>Note:</strong> Unggahan foto menggunakan sistem base64. Disarankan ukuran file tidak lebih dari 1MB untuk performa terbaik.
                        </p>
                    </div>
                </div>
            </div>

            {/* Activities Management */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg p-6 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600">
                        <Calendar size={20} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">Agenda & Kegiatan</h2>
                        <p className="text-xs text-slate-500">Kelola jadwal rutin warga.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-3">
                        <input
                            type="text"
                            value={newActivityTitle}
                            onChange={(e) => setNewActivityTitle(e.target.value)}
                            placeholder="Nama Kegiatan (ex: Senam Pagi)"
                            className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none"
                        />
                        <input
                            type="text"
                            value={newActivityTime}
                            onChange={(e) => setNewActivityTime(e.target.value)}
                            placeholder="Waktu (ex: Setiap Minggu)"
                            className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none"
                        />
                        <textarea
                            value={newActivityDesc}
                            onChange={(e) => setNewActivityDesc(e.target.value)}
                            placeholder="Detail / Deskripsi Kegiatan..."
                            className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-medium outline-none min-h-[80px]"
                        />

                        {/* Activity Image Upload */}
                        <div className="flex items-center gap-2">
                            <label className="flex-1 cursor-pointer bg-white dark:bg-slate-900 border border-dashed border-slate-300 dark:border-slate-700 p-3 rounded-lg text-center hover:border-emerald-500 transition-colors">
                                <div className="flex flex-col items-center gap-1">
                                    {newActivityImage ? (
                                        <div className="flex items-center gap-2">
                                            <ImageIcon size={14} className="text-emerald-600" />
                                            <span className="text-[10px] font-bold text-emerald-600 truncate max-w-[150px]">Foto Terpilih</span>
                                        </div>
                                    ) : (
                                        <>
                                            <ImageIcon size={16} className="text-slate-400" />
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Upload Foto Detail</span>
                                        </>
                                    )}
                                </div>
                                <input
                                    type="file"
                                    className="hidden"
                                    accept="image/*"
                                    onChange={async (e) => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onloadend = () => {
                                                setNewActivityImage(reader.result as string);
                                            };
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                            </label>
                            {newActivityImage && (
                                <button
                                    onClick={() => setNewActivityImage('')}
                                    className="p-3 rounded-lg bg-rose-50 text-rose-600 hover:bg-rose-100"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>

                        <button
                            onClick={handleAddActivity}
                            disabled={loading || !newActivityTitle}
                            className="w-full py-3 bg-emerald-600 text-white rounded-lg font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all"
                        >
                            <Plus size={14} /> Tambah Agenda
                        </button>
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {activities.map((act) => (
                            <div key={act.id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-start justify-between">
                                <div className="flex gap-3">
                                    {act.image && (
                                        <div className="w-12 h-12 rounded-lg overflow-hidden shrink-0 border border-slate-100 relative bg-slate-100">
                                            <img
                                                src={act.image}
                                                alt=""
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = '/no-image.png';
                                                }}
                                            />
                                        </div>
                                    )}
                                    <div className="min-w-0">
                                        <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{act.title}</div>
                                        <div className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">{act.time}</div>
                                        {act.description && (
                                            <div className="text-[10px] text-slate-500 line-clamp-2 leading-relaxed">{act.description}</div>
                                        )}
                                    </div>
                                </div>
                                <button
                                    onClick={() => handleDeleteActivity(act.id)}
                                    className="p-2 text-slate-300 hover:text-rose-600 transition-colors"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Services Management */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg p-6 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600">
                        <Bell size={18} />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">Pusat Layanan Warga</h2>
                        <p className="text-xs text-slate-500">Kartu informasi layanan warga.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl space-y-3">
                        <div className="grid grid-cols-2 gap-2">
                            <input
                                type="text"
                                value={newServiceTitle}
                                onChange={(e) => setNewServiceTitle(e.target.value)}
                                placeholder="Judul Layanan"
                                className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none"
                            />
                            <select
                                value={newServiceIcon}
                                onChange={(e) => setNewServiceIcon(e.target.value)}
                                className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-xs font-bold outline-none"
                            >
                                <option value="Megaphone">Warta</option>
                                <option value="TreePine">Lingkungan</option>
                                <option value="Shield">Keamanan</option>
                                <option value="Info">Info</option>
                            </select>
                        </div>
                        <textarea
                            value={newServiceDesc}
                            onChange={(e) => setNewServiceDesc(e.target.value)}
                            placeholder="Keterangan singkat..."
                            className="w-full p-3 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-[10px] font-medium outline-none min-h-[60px]"
                        />
                        <button
                            onClick={handleAddService}
                            disabled={loading || !newServiceTitle}
                            className="w-full py-3 bg-blue-600 text-white rounded-lg font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-blue-700 transition-all"
                        >
                            <Plus size={14} /> Tambah Layanan
                        </button>
                    </div>

                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                        {services.map((svc) => (
                            <div key={svc.id} className="p-3 rounded-xl border border-slate-100 dark:border-slate-800 flex items-center justify-between">
                                <div className="min-w-0 pr-4">
                                    <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-tight truncate">{svc.title}</div>
                                    <div className="text-[9px] font-medium text-slate-400 line-clamp-1">{svc.description}</div>
                                </div>
                                <button
                                    onClick={() => handleDeleteService(svc.id)}
                                    className="p-2 text-slate-300 hover:text-rose-600 transition-colors shrink-0"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
