'use client';

import React, { useState, useEffect } from 'react';
import { Lock, User, ShieldAlert, Loader2, Sparkles, Key, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { resetUserPassword, getTargetUsers } from '@/actions/employees';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { cn } from '@/lib/utils';

export default function SecurityTab() {
    const [targetUsername, setTargetUsername] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [users, setUsers] = useState<{ username: string; name: string }[]>([]);
    const [isFetchingUsers, setIsFetchingUsers] = useState(true);

    useEffect(() => {
        const fetchUsers = async () => {
            const data = await getTargetUsers();
            setUsers(data);
            setIsFetchingUsers(false);
        };
        fetchUsers();
    }, []);

    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!targetUsername || !newPassword) {
            toast.error('Gagal', { description: 'Semua kolom wajib diisi.' });
            return;
        }

        if (newPassword.length < 6) {
            toast.error('Gagal', { description: 'Password minimal 6 karakter.' });
            return;
        }

        if (!confirm(`Apakah Anda yakin ingin mengganti password @${targetUsername} secara paksa?`)) {
            return;
        }

        setIsLoading(true);
        try {
            const result = await resetUserPassword(targetUsername, newPassword);
            if (result.success) {
                toast.success('Berhasil', { description: result.message });
                setTargetUsername('');
                setNewPassword('');
            } else {
                toast.error('Gagal', { description: result.message });
            }
        } catch (error) {
            toast.error('Gagal', { description: 'Terjadi kesalahan sistem.' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="grid gap-6 grid-cols-1 lg:grid-cols-2 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-10">
            {/* Info Card */}
            <div className="bg-slate-900 rounded-[2rem] p-6 sm:p-8 md:p-10 text-white relative overflow-hidden shadow-2xl flex flex-col justify-between min-h-[400px]">
                {/* Background Decorations */}
                <div className="absolute top-[-20%] right-[-10%] w-64 h-64 bg-indigo-600/20 rounded-full blur-[80px]"></div>
                <div className="absolute bottom-[-20%] left-[-10%] w-64 h-64 bg-rose-600/10 rounded-full blur-[80px]"></div>

                <div className="relative z-10 space-y-6 md:space-y-8">
                    <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 text-[10px] font-black uppercase tracking-widest">
                        <Lock size={12} className="mr-2" />
                        Super Admin Access
                    </div>

                    <div className="space-y-3">
                        <h2 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none">
                            Master <span className="text-indigo-400">Security</span>
                        </h2>
                        <p className="text-slate-400 text-sm md:text-base font-medium leading-relaxed max-w-md">
                            Alur darurat ini memungkinkan administrator sistem untuk meriset kata sandi karyawan mana pun secara instan.
                        </p>
                    </div>

                    <div className="bg-white/5 border border-white/10 p-4 sm:p-5 rounded-2xl sm:rounded-3xl flex items-start gap-4">
                        <div className="p-2.5 rounded-xl bg-orange-500/20 text-orange-400 shrink-0">
                            <ShieldAlert size={20} />
                        </div>
                        <div>
                            <h4 className="text-[11px] font-black uppercase tracking-wider text-orange-400">Protokol Keamanan</h4>
                            <p className="text-[11px] sm:text-xs text-slate-400 mt-1 leading-normal">
                                Tindakan ini bersifat final. Pengguna akan dipaksa untuk memperbarui kredensial mereka kembali saat akses berikutnya terdeteksi.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="relative z-10 pt-8 flex items-center justify-between">
                    <div className="flex items-center gap-2 text-slate-500">
                        <Sparkles size={16} className="text-indigo-400" />
                        <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Authorized Personnel Only</span>
                    </div>
                </div>
            </div>

            {/* Form Card */}
            <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl p-6 sm:p-8 md:p-10 space-y-8">
                <div className="space-y-2">
                    <h3 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Kontrol Reset</h3>
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 font-medium">Lengkapi parameter di bawah untuk memicu reset paksa.</p>
                </div>

                <form onSubmit={handleReset} className="space-y-6">
                    {/* Target User Select */}
                    <div className="space-y-2">
                        <Label htmlFor="targetUsername" className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-1">Karyawan Target</Label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-indigo-600 transition-colors z-10">
                                <User size={18} />
                            </div>
                            <div className="relative">
                                <select
                                    id="targetUsername"
                                    value={targetUsername}
                                    onChange={(e) => setTargetUsername(e.target.value)}
                                    disabled={isFetchingUsers || isLoading}
                                    className={cn(
                                        "w-full pl-12 pr-10 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-transparent focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all font-bold text-sm outline-none appearance-none cursor-pointer disabled:opacity-50 dark:text-white",
                                        !targetUsername && "text-slate-400"
                                    )}
                                    required
                                >
                                    <option value="">{isFetchingUsers ? 'Memuat data...' : 'Pilih Karyawan...'}</option>
                                    {users.map((u) => (
                                        <option key={u.username} value={u.username} className="text-slate-900 dark:text-white dark:bg-slate-900">
                                            {u.name} (@{u.username})
                                        </option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none">
                                    <ChevronDown size={18} />
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="masterNewPassword" className="text-[10px] uppercase font-black text-slate-400 tracking-widest ml-1">Password Baru</Label>
                        <div className="relative group">
                            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-rose-600 transition-colors">
                                <Key size={18} />
                            </div>
                            <Input
                                id="masterNewPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                disabled={isLoading}
                                className="pl-12 h-14 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border-transparent focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all font-bold text-sm dark:text-white"
                                placeholder="Minimal 6 karakter"
                                required
                                autoComplete="new-password"
                            />
                        </div>
                    </div>

                    <div className="pt-2">
                        <Button
                            type="submit"
                            disabled={isLoading || isFetchingUsers || !targetUsername}
                            className="w-full h-16 bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 font-black rounded-2xl shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] transition-all active:scale-[0.96] text-sm tracking-widest disabled:opacity-50"
                        >
                            {isLoading ? (
                                <div className="flex items-center gap-3">
                                    <Loader2 className="animate-spin" />
                                    <span>MENGEKSEKUSI RISET...</span>
                                </div>
                            ) : (
                                'EKSEKUSI RISET PASSWORD'
                            )}
                        </Button>
                    </div>
                </form>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 flex items-center justify-center gap-3 border border-slate-100 dark:border-slate-800">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>
                    <span className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest">Master Security Link Active</span>
                </div>
            </div>
        </div>
    );
}
