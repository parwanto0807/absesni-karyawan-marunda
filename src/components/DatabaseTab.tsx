'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Database, Download, Upload, Loader2, AlertTriangle, CheckCircle2, History, Image } from 'lucide-react';
import { toast } from 'sonner';
import { backupDatabase, restoreDatabase } from '@/actions/database';

export default function DatabaseTab() {
    const [loading, setLoading] = useState(false);
    const [lastBackup, setLastBackup] = useState<{ name: string; date: Date } | null>(null);
    const [migrationLoading, setMigrationLoading] = useState(false);
    const [migrationStatus, setMigrationStatus] = useState<{
        needsMigration: number;
        total: number;
        base64ClockIn: number;
        base64ClockOut: number;
    } | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleBackup = async () => {
        setLoading(true);
        try {
            const result = await backupDatabase();
            if (result.success && result.content && result.fileName) {
                // Trigger download in browser
                const blob = new Blob([result.content], { type: 'text/plain' });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = result.fileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                document.body.removeChild(a);

                setLastBackup({ name: result.fileName, date: new Date() });
                toast.success('Backup Berhasil', {
                    description: `File ${result.fileName} telah diunduh.`
                });
            } else {
                throw new Error(result.message || 'Gagal melakukan backup');
            }
        } catch (error: unknown) {
            const err = error as Error;
            toast.error('Gagal Backup', {
                description: err.message || 'Terjadi kesalahan saat memproses backup'
            });
        } finally {
            setLoading(false);
        }
    };

    const handleRestoreClick = () => {
        fileInputRef.current?.click();
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (!confirm('PERINGATAN: Restore database akan menimpa data saat ini. Apakah Anda yakin ingin melanjutkan?')) {
            event.target.value = '';
            return;
        }

        setLoading(true);
        try {
            const text = await file.text();
            const result = await restoreDatabase(text);

            if (result.success) {
                toast.success('Restore Berhasil', {
                    description: 'Database telah diperbarui dengan data dari file backup.'
                });
                // Optional: refresh page to see new data
                setTimeout(() => window.location.reload(), 2000);
            } else {
                throw new Error(result.message);
            }
        } catch (error: unknown) {
            const err = error as Error;
            toast.error('Restore Gagal', {
                description: err.message || 'Terjadi kesalahan saat memproses restore'
            });
        } finally {
            setLoading(false);
            event.target.value = '';
        }
    };

    useEffect(() => {
        checkMigrationStatus();
    }, []);

    const checkMigrationStatus = async () => {
        try {
            const response = await fetch('/api/migrate-photos');
            if (response.ok) {
                const data = await response.json();
                setMigrationStatus(data);
            }
        } catch (error) {
            console.error('Error checking migration status:', error);
        }
    };

    const handleMigratePhotos = async () => {
        if (!confirm('Apakah Anda yakin ingin mengkonversi semua foto base64 ke file WebP? Proses ini mungkin memakan waktu beberapa menit.')) {
            return;
        }

        setMigrationLoading(true);
        try {
            const response = await fetch('/api/migrate-photos', {
                method: 'POST'
            });

            const result = await response.json();

            if (result.success) {
                toast.success('Migrasi Berhasil', {
                    description: result.message
                });
                // Refresh status
                await checkMigrationStatus();
            } else {
                throw new Error(result.message);
            }
        } catch (error: unknown) {
            const err = error as Error;
            toast.error('Migrasi Gagal', {
                description: err.message || 'Terjadi kesalahan saat migrasi'
            });
        } finally {
            setMigrationLoading(false);
        }
    };

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="bg-white dark:bg-slate-900 rounded-xl md:rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg overflow-hidden">
                <div className="p-4 md:p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/20">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400">
                            <Database size={24} />
                        </div>
                        <div>
                            <h2 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">Database Management</h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Backup dan Restore data sistem</p>
                        </div>
                    </div>
                </div>

                <div className="p-4 md:p-6 space-y-8">
                    {/* Warning Box */}
                    <div className="flex gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800/50">
                        <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0" />
                        <div className="space-y-1">
                            <p className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wider">Peringatan Penting</p>
                            <p className="text-[11px] leading-relaxed text-amber-700 dark:text-amber-500/80 font-medium">
                                Melakukan <strong>Restore</strong> akan menghapus data yang ada saat ini dan menggantinya dengan data dari file backup.
                                Pastikan Anda telah melakukan backup sebelum melakukan restore. File backup berformat <strong>.sql</strong>.
                            </p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Backup Section */}
                        <div className="space-y-4 p-5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
                                <Download size={20} />
                                <h3 className="font-bold text-sm uppercase tracking-wide">Backup Database</h3>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                Simpan seluruh data database ke komputer Anda dalam format file SQL. Ini disarankan dilakukan secara berkala.
                            </p>

                            <button
                                onClick={handleBackup}
                                disabled={loading}
                                className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-400 text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-indigo-200 dark:shadow-none"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                                {loading ? 'Memproses...' : 'Download Backup (.sql)'}
                            </button>

                            {lastBackup && (
                                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50">
                                    <CheckCircle2 size={14} />
                                    <span className="text-[10px] font-bold uppercase tracking-tight">Terakhir: {lastBackup.name}</span>
                                </div>
                            )}
                        </div>

                        {/* Restore Section */}
                        <div className="space-y-4 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                            <div className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                                <Upload size={20} />
                                <h3 className="font-bold text-sm uppercase tracking-wide">Restore Database</h3>
                            </div>
                            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
                                Unggah file SQL hasil backup sebelumnya untuk memulihkan data. Semua data saat ini akan ditimpa.
                            </p>

                            <input
                                type="file"
                                ref={fileInputRef}
                                onChange={handleFileChange}
                                accept=".sql"
                                className="hidden"
                            />

                            <button
                                onClick={handleRestoreClick}
                                disabled={loading}
                                className="w-full h-12 rounded-xl border-2 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-50 text-slate-700 dark:text-slate-300 font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95"
                            >
                                {loading ? <Loader2 size={18} className="animate-spin" /> : <Upload size={18} />}
                                {loading ? 'Memproses...' : 'Upload & Restore'}
                            </button>
                        </div>
                    </div>

                    {/* Photo Migration Section */}
                    <div className="space-y-4 p-5 rounded-2xl bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/10 dark:to-purple-900/10 border border-violet-200 dark:border-violet-800/50">
                        <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
                            <Image size={20} />
                            <h3 className="font-bold text-sm uppercase tracking-wide">Migrasi Foto Absensi</h3>
                        </div>
                        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            Konversi foto base64 lama ke file WebP (100-200KB) untuk mengurangi ukuran database dan meningkatkan performa.
                        </p>

                        {migrationStatus && (
                            <div className="space-y-2">
                                <div className="grid grid-cols-2 gap-2 text-[10px]">
                                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-violet-100 dark:border-violet-800/30">
                                        <div className="text-slate-500 dark:text-slate-400 font-medium">Total Records</div>
                                        <div className="text-lg font-black text-violet-600 dark:text-violet-400">{migrationStatus.total}</div>
                                    </div>
                                    <div className="p-2 rounded-lg bg-white dark:bg-slate-900 border border-violet-100 dark:border-violet-800/30">
                                        <div className="text-slate-500 dark:text-slate-400 font-medium">Perlu Migrasi</div>
                                        <div className="text-lg font-black text-amber-600 dark:text-amber-400">{migrationStatus.needsMigration}</div>
                                    </div>
                                </div>

                                {migrationStatus.needsMigration > 0 ? (
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
                                        <AlertTriangle size={14} />
                                        <span className="text-[10px] font-bold uppercase tracking-tight">
                                            {migrationStatus.base64ClockIn} Clock In + {migrationStatus.base64ClockOut} Clock Out
                                        </span>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-800/50">
                                        <CheckCircle2 size={14} />
                                        <span className="text-[10px] font-bold uppercase tracking-tight">Semua foto sudah migrated!</span>
                                    </div>
                                )}
                            </div>
                        )}

                        <button
                            onClick={handleMigratePhotos}
                            disabled={migrationLoading || (migrationStatus?.needsMigration === 0)}
                            className="w-full h-12 rounded-xl bg-violet-600 hover:bg-violet-700 disabled:bg-slate-400 text-white font-bold text-xs uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-violet-200 dark:shadow-none"
                        >
                            {migrationLoading ? <Loader2 size={18} className="animate-spin" /> : <Image size={18} />}
                            {migrationLoading ? 'Memproses Migrasi...' : 'Migrate Foto ke WebP'}
                        </button>
                    </div>

                    {/* Quick History / Info */}
                    <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-2 text-slate-400">
                            <History size={14} />
                            <span className="text-[10px] font-bold uppercase tracking-widest">Database Tool v1.0</span>
                        </div>
                        <div className="text-[10px] font-medium text-slate-400">
                            Engine: PostgreSQL 17
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
