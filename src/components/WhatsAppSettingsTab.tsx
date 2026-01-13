'use client';

import React, { useState, useEffect } from 'react';
import { MessageSquare, Save, Loader2, Info, CheckCircle2, XCircle, Send } from 'lucide-react';
import { toast } from 'sonner';
import { getSettings, updateSettings, testWhatsAppMessage } from '@/actions/settings';

export default function WhatsAppSettingsTab() {
    const [loading, setLoading] = useState(false);
    const [testLoading, setTestLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [enabled, setEnabled] = useState(false);
    const [apiKey, setApiKey] = useState('');
    const [groupId, setGroupId] = useState('');
    const [testMessage, setTestMessage] = useState('Halo! Ini adalah pesan percobaan dari Sistem Absensi Marunda.');

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const settings = await getSettings();
                setEnabled(settings.WA_ENABLE_LATE_NOTIF === 'true');
                setApiKey(settings.WA_API_KEY || '');
                setGroupId(settings.WA_GROUP_ID || '');
            } catch (error) {
                console.error('Failed to load WhatsApp settings:', error);
            } finally {
                setInitialLoading(false);
            }
        };
        loadSettings();
    }, []);

    const handleSave = async () => {
        setLoading(true);
        try {
            const result = await updateSettings({
                WA_ENABLE_LATE_NOTIF: String(enabled),
                WA_API_KEY: apiKey,
                WA_GROUP_ID: groupId
            });

            if (result.success) {
                toast.success('Pengaturan WhatsApp Berhasil Disimpan');
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            toast.error('Gagal Menyimpan Pengaturan WhatsApp');
        } finally {
            setLoading(false);
        }
    };

    const handleTestSend = async () => {
        if (!apiKey || !groupId) {
            toast.error('API Key dan Group ID harus diisi untuk mencoba');
            return;
        }

        setTestLoading(true);
        try {
            const result = await testWhatsAppMessage(testMessage, groupId, apiKey);
            if (result.success) {
                toast.success('Pesan Percobaan Terkirim!');
            } else {
                toast.error(result.message || 'Gagal mengirim pesan percobaan');
            }
        } catch (error) {
            toast.error('Terjadi kesalahan saat mencoba');
        } finally {
            setTestLoading(false);
        }
    };

    if (initialLoading) {
        return (
            <div className="flex h-[200px] items-center justify-center space-x-2 text-slate-400">
                <Loader2 className="animate-spin" />
                <span className="text-xs font-bold uppercase tracking-widest">Memuat...</span>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header Card */}
            <div className="bg-gradient-to-br from-green-500 to-emerald-700 rounded-3xl p-6 text-white shadow-xl shadow-green-200 dark:shadow-none relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <MessageSquare size={120} />
                </div>
                <div className="relative z-10 space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md">
                            <MessageSquare className="w-6 h-6" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">Notifikasi WhatsApp</h2>
                    </div>
                    <p className="text-xs md:text-sm font-medium text-green-50 opacity-90 leading-relaxed max-w-lg">
                        Kirim notifikasi otomatis ke grup WhatsApp admin saat karyawan terdeteksi terlambat melakukan absensi masuk.
                    </p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Configuration Card */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Konfigurasi API</h3>
                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${enabled ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                                {enabled ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                                <span>{enabled ? 'Aktif' : 'Non-aktif'}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Switch Enable */}
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                <div>
                                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase">Aktifkan Notifikasi</p>
                                    <p className="text-[10px] text-slate-500">Aktifkan pengiriman otomatis</p>
                                </div>
                                <button
                                    onClick={() => setEnabled(!enabled)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${enabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            {/* API Key */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Fonnte API Key</label>
                                <input
                                    type="password"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                    placeholder="Masukkan API Key dari Fonnte"
                                    className="w-full h-12 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                />
                            </div>

                            {/* Group ID */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Group ID / Target</label>
                                <input
                                    type="text"
                                    value={groupId}
                                    onChange={(e) => setGroupId(e.target.value)}
                                    placeholder="Contoh: 1234567890-11223344@g.us"
                                    className="w-full h-12 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="w-full h-12 rounded-2xl bg-slate-900 dark:bg-indigo-600 hover:bg-slate-800 dark:hover:bg-indigo-700 disabled:bg-slate-400 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                            <span>Simpan Pengaturan</span>
                        </button>
                    </div>

                    {/* Test Send Card */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8 space-y-4">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Coba Kirim Pesan</h3>
                        <div className="space-y-3">
                            <textarea
                                value={testMessage}
                                onChange={(e) => setTestMessage(e.target.value)}
                                placeholder="Tulis pesan percobaan di sini..."
                                className="w-full min-h-[100px] p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 outline-none transition-all resize-none"
                            />
                            <button
                                onClick={handleTestSend}
                                disabled={testLoading || !apiKey || !groupId}
                                className="w-full h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-200 dark:disabled:bg-slate-800 disabled:text-slate-400 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg"
                            >
                                {testLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                <span>Kirim Pesan Percobaan</span>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Help/Guide Card */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8 space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                <Info size={20} />
                            </div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Cara Setup</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="h-6 w-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black shrink-0">1</div>
                                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                                    Daftar akun di <a href="https://fonnte.com" target="_blank" className="text-indigo-600 font-bold hover:underline">Fonnte.com</a> dan hubungkan nomor WhatsApp Anda.
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <div className="h-6 w-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black shrink-0">2</div>
                                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                                    Dapatkan **API Key** dari menu Profile/API pada dashboard Fonnte.
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <div className="h-6 w-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black shrink-0">3</div>
                                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                                    Undang bot Fonnte ke grup WhatsApp Anda untuk mendapatkan **Group ID**. Format biasanya: `xxxxxx-yyyyyy@g.us`.
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <div className="h-6 w-6 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-[10px] font-black shrink-0">4</div>
                                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                                    Simpan API Key dan Group ID di panel sebelah kiri untuk mulai menerima notifikasi.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-900/30 rounded-3xl p-6">
                        <p className="text-[10px] text-indigo-700 dark:text-indigo-300 font-bold leading-relaxed">
                            ⚠️ Tips: Gunakan nomor WhatsApp cadangan sebagai Bot agar tidak mengganggu penggunaan WhatsApp pribadi Anda.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
