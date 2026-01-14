'use client';

import React, { useState, useEffect } from 'react';
import { Zap, Save, Loader2, Info, CheckCircle2, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { getSettings, updateSettings, testPusherAction } from '@/actions/settings';
import { getPusherClient, clearPusherInstance } from '@/lib/pusher-client';

export default function PusherSettingsTab() {
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [enabled, setEnabled] = useState(false);
    const [appId, setAppId] = useState('');
    const [appKey, setAppKey] = useState('');
    const [appSecret, setAppSecret] = useState('');
    const [appCluster, setAppCluster] = useState('');
    const [reconnectKey, setReconnectKey] = useState(0);
    const [testLoading, setTestLoading] = useState(false);
    const [connectionStatus, setConnectionStatus] = useState<'connected' | 'connecting' | 'disconnected'>('disconnected');
    const [testLogs, setTestLogs] = useState<string[]>([]);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const settings = await getSettings();
                setEnabled(settings.PUSHER_ENABLE === 'true');
                setAppId(settings.PUSHER_APP_ID || '');
                setAppKey(settings.PUSHER_KEY || '');
                setAppSecret(settings.PUSHER_SECRET || '');
                setAppCluster(settings.PUSHER_CLUSTER || '');
            } catch (error) {
                console.error('Failed to load Pusher settings:', error);
            } finally {
                setInitialLoading(false);
            }
        };
        loadSettings();
    }, []);

    useEffect(() => {
        let isMounted = true;
        let pusher: any;
        const init = async () => {
            pusher = await getPusherClient();
            if (pusher) {
                if (isMounted) setConnectionStatus(pusher.connection.state as any);
                pusher.connection.bind('state_change', (states: any) => {
                    if (isMounted) setConnectionStatus(states.current);
                });

                const channel = pusher.subscribe('admin-test');
                channel.bind('test-event', (data: any) => {
                    if (isMounted) {
                        setTestLogs(prev => [`[${new Date().toLocaleTimeString()}] Event diteriman: ${data.message}`, ...prev]);
                        toast.success('Pesan Tes Realtime Diterima!', {
                            description: 'Koneksi Pusher Anda sudah berjalan sehat.'
                        });
                    }
                });
            }
        };
        init();
        return () => {
            isMounted = false;
            if (pusher) {
                pusher.unsubscribe('admin-test');
            }
        };
    }, [reconnectKey]);

    const handleTest = async () => {
        setTestLoading(true);
        // Force re-init pusher client before test to use latest credentials
        clearPusherInstance();
        setReconnectKey(prev => prev + 1);

        // Small delay to let useEffect re-init
        await new Promise(r => setTimeout(r, 800));

        try {
            const result = await testPusherAction();
            if (result.success) {
                toast.info(result.message);
                setTestLogs(prev => [`[${new Date().toLocaleTimeString()}] Sinyal terkirim ke server...`, ...prev]);
            } else {
                toast.error(result.message);
                setTestLogs(prev => [`[${new Date().toLocaleTimeString()}] Error: ${result.message}`, ...prev]);
            }
        } catch (error: any) {
            toast.error('Gagal menjalankan tes Pusher');
            setTestLogs(prev => [`[${new Date().toLocaleTimeString()}] Exception: ${error?.message || 'Unknown'}`, ...prev]);
        } finally {
            setTestLoading(false);
        }
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            const result = await updateSettings({
                PUSHER_ENABLE: String(enabled),
                PUSHER_APP_ID: appId,
                PUSHER_KEY: appKey,
                PUSHER_SECRET: appSecret,
                PUSHER_CLUSTER: appCluster
            });

            if (result.success) {
                toast.success('Pengaturan Realtime (Pusher) Berhasil Disimpan');
                // Refresh client instance after save
                clearPusherInstance();
                setReconnectKey(prev => prev + 1);
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            toast.error('Gagal Menyimpan Pengaturan Pusher');
        } finally {
            setLoading(false);
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
            <div className="bg-gradient-to-br from-indigo-500 to-purple-700 rounded-3xl p-6 text-white shadow-xl shadow-indigo-200 dark:shadow-none relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                    <Zap size={120} />
                </div>
                <div className="relative z-10 space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-white/20 backdrop-blur-md">
                            <Zap className="w-6 h-6 fill-current" />
                        </div>
                        <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">Realtime Center (Pusher)</h2>
                    </div>
                    <p className="text-xs md:text-sm font-medium text-indigo-50 opacity-90 leading-relaxed max-w-lg">
                        Fitur ini memungkinkan chat review dan instruksi admin muncul secara instan di layar petugas tanpa perlu refresh.
                    </p>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
                {/* Configuration Card */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8 space-y-6">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Pusher Credentials</h3>
                            <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${connectionStatus === 'connected' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : connectionStatus === 'connecting' ? 'bg-amber-50 text-amber-600 border border-amber-100' : 'bg-slate-100 text-slate-500 border border-slate-200'}`}>
                                <div className={cn("h-1.5 w-1.5 rounded-full", connectionStatus === 'connected' ? "bg-emerald-500 animate-pulse" : connectionStatus === 'connecting' ? "bg-amber-500 animate-pulse" : "bg-slate-400")} />
                                <span>{connectionStatus}</span>
                            </div>
                        </div>

                        <div className="space-y-4">
                            {/* Switch Enable */}
                            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
                                <div>
                                    <p className="text-xs font-black text-slate-900 dark:text-white uppercase">Aktifkan Realtime</p>
                                    <p className="text-[10px] text-slate-500">Gunakan koneksi WebSocket</p>
                                </div>
                                <button
                                    onClick={() => setEnabled(!enabled)}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${enabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'}`}
                                >
                                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${enabled ? 'translate-x-6' : 'translate-x-1'}`} />
                                </button>
                            </div>

                            {/* App ID */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">App ID</label>
                                <input
                                    type="text"
                                    value={appId}
                                    onChange={(e) => setAppId(e.target.value)}
                                    placeholder="Contoh: 1234567"
                                    className="w-full h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>

                            {/* Key */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">App Key</label>
                                <input
                                    type="text"
                                    value={appKey}
                                    onChange={(e) => setAppKey(e.target.value)}
                                    placeholder="Masukkan Pusher Key"
                                    className="w-full h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>

                            {/* Secret */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">App Secret</label>
                                <input
                                    type="password"
                                    value={appSecret}
                                    onChange={(e) => setAppSecret(e.target.value)}
                                    placeholder="Masukkan Pusher Secret"
                                    className="w-full h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>

                            {/* Cluster */}
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">App Cluster</label>
                                <input
                                    type="text"
                                    value={appCluster}
                                    onChange={(e) => setAppCluster(e.target.value)}
                                    placeholder="Contoh: ap1"
                                    className="w-full h-11 px-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 text-xs font-bold focus:border-indigo-500 outline-none transition-all"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleSave}
                                disabled={loading}
                                className="h-12 rounded-2xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-100 dark:shadow-none"
                            >
                                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                <span>Simpan</span>
                            </button>
                            <button
                                onClick={handleTest}
                                disabled={testLoading || !enabled}
                                className="h-12 rounded-2xl bg-white dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-700 hover:border-indigo-500 text-slate-900 dark:text-white font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 disabled:opacity-50"
                            >
                                {testLoading ? <Loader2 className="w-4 h-4 animate-spin text-indigo-600" /> : <Zap className="w-4 h-4 text-indigo-600" />}
                                <span>Coba Tes</span>
                            </button>
                        </div>
                    </div>

                    {/* Live Log */}
                    <div className="bg-slate-900 rounded-[2rem] p-6 text-emerald-400 font-mono text-[10px] h-[150px] overflow-y-auto border-4 border-slate-800 shadow-inner">
                        <div className="flex items-center justify-between mb-2 pb-2 border-b border-white/10">
                            <span className="font-black text-white/50 uppercase tracking-widest">Live Diagnostic Logs</span>
                            <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        </div>
                        {testLogs.length === 0 ? (
                            <p className="opacity-50 italic">Menunggu sinyal...</p>
                        ) : (
                            testLogs.map((log, i) => <div key={i} className="mb-1 leading-relaxed">{log}</div>)
                        )}
                    </div>
                </div>

                {/* Info & Steps */}
                <div className="space-y-6">
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm p-6 md:p-8 space-y-4">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400">
                                <Info size={20} />
                            </div>
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Cara Mendapatkan Key</h3>
                        </div>

                        <div className="space-y-4">
                            <div className="flex gap-4">
                                <div className="h-6 w-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center text-[10px] font-black shrink-0">1</div>
                                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                                    Login ke <a href="https://pusher.com" target="_blank" className="text-indigo-600 font-bold hover:underline">Pusher.com</a> dan buat "App" baru di menu **Channels**.
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <div className="h-6 w-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center text-[10px] font-black shrink-0">2</div>
                                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                                    Pilih cluster terdekat (misal: **ap1** untuk Asia/Singapore).
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <div className="h-6 w-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center text-[10px] font-black shrink-0">3</div>
                                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                                    Buka menu **App Keys** dan Anda akan melihat data App ID, Key, Secret, dan Cluster.
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <div className="h-6 w-6 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 flex items-center justify-center text-[10px] font-black shrink-0">4</div>
                                <p className="text-[11px] text-slate-600 dark:text-slate-400 font-medium leading-relaxed">
                                    Copy dan masukkan data tersebut ke form di sebelah kiri, lalu simpan.
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-3xl p-6">
                        <p className="text-[10px] text-amber-700 dark:text-amber-300 font-bold leading-relaxed">
                            ⚠️ Penting: Jangan bagikan **Secret Key** Anda kepada siapapun. Jika bocor, buat ulang (Regenerate) di dashboard Pusher.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
