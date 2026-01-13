'use client';

import React, { useState, useEffect } from 'react';
import { ShieldCheck, User, Save, Loader2, Info } from 'lucide-react';
import { getAllPICSAndAdmins } from '@/actions/tracking';
import { getSettings, updateSettings } from '@/actions/settings';
import { toast } from 'sonner';

export default function TrackingAuthTab() {
    const [users, setUsers] = useState<any[]>([]);
    const [authorizedUsernames, setAuthorizedUsernames] = useState<string[]>([]);
    const [trackingRoles, setTrackingRoles] = useState<string>('SECURITY,LINGKUNGAN,KEBERSIHAN');
    const [requireActive, setRequireActive] = useState<boolean>(true);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        const loadData = async () => {
            setLoading(true);
            const [usersResult, settings] = await Promise.all([
                getAllPICSAndAdmins(),
                getSettings()
            ]);

            if (usersResult.success && usersResult.data) {
                setUsers(usersResult.data);
            }

            if (settings.TRACKING_AUTHORIZED_USERS) {
                setAuthorizedUsernames(settings.TRACKING_AUTHORIZED_USERS.split(',').map(u => u.trim()).filter(u => u !== ''));
            }
            if (settings.TRACKING_ROLES) {
                setTrackingRoles(settings.TRACKING_ROLES);
            }
            if (settings.TRACKING_REQUIRE_ACTIVE) {
                setRequireActive(settings.TRACKING_REQUIRE_ACTIVE === 'true');
            }
            setLoading(false);
        };
        loadData();
    }, []);

    const toggleUser = (username: string) => {
        setAuthorizedUsernames(prev =>
            prev.includes(username)
                ? prev.filter(u => u !== username)
                : [...prev, username]
        );
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const result = await updateSettings({
                TRACKING_AUTHORIZED_USERS: authorizedUsernames.join(','),
                TRACKING_ROLES: trackingRoles,
                TRACKING_REQUIRE_ACTIVE: requireActive.toString()
            });
            if (result.success) {
                toast.success('Otoritas Berhasil Diperbarui', {
                    description: 'Hak akses live tracking telah disimpan'
                });
            } else {
                toast.error('Gagal Menyimpan: ' + result.message);
            }
        } catch (error) {
            toast.error('Gagal Menyimpan: Terjadi kesalahan sistem');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center space-x-2 text-slate-400">
                <Loader2 className="animate-spin" />
                <span className="text-xs font-bold uppercase tracking-widest">Memuat Pengaturan Otoritas...</span>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden font-jakarta">
                {/* Header Section */}
                <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2.5 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Otoritas Live Tracking</h2>
                            <p className="text-xs text-slate-500 font-medium">Pilih personil Admin/PIC mana yang boleh melihat data pergerakan real-time</p>
                        </div>
                    </div>
                </div>

                <div className="p-6 space-y-6">
                    {/* Security Notice */}
                    <div className="flex gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50">
                        <Info className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                        <div className="text-[11px] md:text-xs text-amber-800 dark:text-amber-300 font-medium">
                            <strong>PENTING:</strong> Username <code className="px-1.5 py-0.5 rounded bg-amber-200 dark:bg-amber-800 font-bold">adminit</code> selalu memiliki akses penuh secara default dan tidak perlu didaftarkan di sini.
                        </div>
                    </div>

                    {/* Users List */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {users.length === 0 ? (
                            <div className="col-span-2 py-10 text-center text-slate-400 italic text-sm border-2 border-dashed border-slate-100 dark:border-slate-800 rounded-2xl">
                                Tidak ada user dengan role Admin atau PIC ditemukan.
                            </div>
                        ) : (
                            users.map((user) => (
                                <div
                                    key={user.username}
                                    onClick={() => toggleUser(user.username)}
                                    className={`relative flex items-center justify-between p-4 rounded-2xl border-2 transition-all cursor-pointer group ${authorizedUsernames.includes(user.username)
                                        ? 'border-indigo-500 bg-indigo-50/30 dark:bg-indigo-900/10'
                                        : 'border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-slate-200 dark:hover:border-slate-700'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className={`p-2.5 rounded-xl transition-colors ${authorizedUsernames.includes(user.username)
                                            ? 'bg-indigo-600 text-white'
                                            : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                            }`}>
                                            <User size={18} />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold text-slate-900 dark:text-white leading-tight">{user.name}</p>
                                            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">{user.role} • @{user.username}</p>
                                        </div>
                                    </div>

                                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${authorizedUsernames.includes(user.username)
                                        ? 'border-indigo-600 bg-indigo-600'
                                        : 'border-slate-300 dark:border-slate-600'
                                        }`}>
                                        {authorizedUsernames.includes(user.username) && (
                                            <div className="w-1.5 h-1.5 rounded-full bg-white shadow-sm" />
                                        )}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Privacy & Configuration Parameters */}
                    <div className="pt-6 border-t border-slate-100 dark:border-slate-800 space-y-4">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="w-1.5 h-6 bg-indigo-600 rounded-full" />
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-wider">Konfigurasi & Parameter Privasi</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Roles Configuration */}
                            <div className="space-y-2">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Role yang Dilacak</label>
                                <input
                                    type="text"
                                    value={trackingRoles}
                                    onChange={(e) => setTrackingRoles(e.target.value.toUpperCase())}
                                    className="w-full h-11 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500/20 outline-none"
                                    placeholder="SECURITY,LINGKUNGAN,KEBERSIHAN"
                                />
                                <p className="text-[10px] text-slate-400">Pisahkan dengan koma (Contoh: SECURITY,PIC,ADMIN)</p>
                            </div>

                            {/* Privacy Toggle */}
                            <div className="space-y-4">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest">Parameter Jam Kerja</label>
                                <div
                                    onClick={() => setRequireActive(!requireActive)}
                                    className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all cursor-pointer ${requireActive ? 'border-emerald-500 bg-emerald-50/30 dark:bg-emerald-900/10' : 'border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-900'
                                        }`}
                                >
                                    <div className={`w-10 h-6 rounded-full relative transition-colors ${requireActive ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                                        <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${requireActive ? 'left-5' : 'left-1'}`} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-xs font-bold text-slate-900 dark:text-white leading-tight">Wajib Clock-In Aktif</p>
                                        <p className="text-[10px] text-slate-500">Hanya lacak jika personil sedang bertugas (Clock-In)</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Button */}
                    <div className="pt-8 flex items-center justify-end">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="h-12 px-8 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-black text-xs uppercase tracking-widest flex items-center gap-3 shadow-lg shadow-indigo-500/20 transition-all active:scale-95"
                        >
                            {saving ? (
                                <Loader2 size={16} className="animate-spin" />
                            ) : (
                                <Save size={16} />
                            )}
                            Simpan Perubahan & Parameter
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
