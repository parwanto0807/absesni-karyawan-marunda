"use client";

import React, { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { SessionPayload } from '@/types/auth';
import { Key, Loader2, AlertTriangle, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { changePassword } from '@/actions/auth';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';

interface MandatoryPasswordChangeProps {
    user: SessionPayload;
}

export function MandatoryPasswordChange({ user }: MandatoryPasswordChangeProps) {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showOldPassword, setShowOldPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        if (user.isPasswordDefault) {
            setIsOpen(true);
        }
    }, [user.isPasswordDefault]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error('Password baru dan konfirmasi tidak cocok.');
            return;
        }

        if (newPassword.length < 6) {
            toast.error('Password baru minimal 6 karakter demi keamanan.');
            return;
        }

        // Check if new password is still the default one
        if (newPassword === 'password123') {
            toast.error('Jangan gunakan password default kembali!');
            return;
        }

        setIsLoading(true);
        try {
            const result = await changePassword(user.userId, oldPassword, newPassword);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success('Password berhasil diperbarui. Halaman akan dimuat ulang...');
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
                setIsOpen(false);
                // Reload to refresh the session with isPasswordDefault: false
                window.location.reload();
            }
        } catch (error) {
            toast.error('Terjadi kesalahan saat mengubah password.');
        } finally {
            setIsLoading(false);
        }
    };

    if (!user.isPasswordDefault) return null;

    return (
        <Dialog open={isOpen} onOpenChange={() => { }}>
            <DialogContent
                className="w-[95vw] sm:max-w-[480px] rounded-[2rem] sm:rounded-3xl bg-white dark:bg-slate-950 border-none shadow-[0_0_80px_-20px_rgba(0,0,0,0.3)] p-0 overflow-hidden focus:outline-none"
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
            >
                {/* Premium Animated Header */}
                <div className="relative h-32 sm:h-40 bg-slate-950 flex items-center justify-center overflow-hidden">
                    {/* Background Abstract Shapes */}
                    <div className="absolute inset-0 opacity-40">
                        <div className="absolute top-[-20%] left-[-10%] w-64 h-64 bg-red-600 rounded-full blur-[80px] animate-pulse"></div>
                        <div className="absolute bottom-[-20%] right-[-10%] w-64 h-64 bg-orange-600 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }}></div>
                    </div>

                    <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 0.15, scale: 1.2 }}
                        transition={{ duration: 4, repeat: Infinity, repeatType: "reverse" }}
                        className="absolute inset-0 flex items-center justify-center pointer-events-none"
                    >
                        <ShieldAlert size={200} className="text-white" />
                    </motion.div>

                    <div className="relative z-10 flex flex-col items-center text-center px-4">
                        <motion.div
                            initial={{ y: 20, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            className="bg-white/10 backdrop-blur-xl p-3 sm:p-4 rounded-2xl border border-white/20 mb-3"
                        >
                            <AlertTriangle size={28} className="text-orange-400 sm:text-orange-300" />
                        </motion.div>
                        <DialogHeader>
                            <DialogTitle className="text-white font-black text-lg sm:text-2xl tracking-tighter uppercase leading-none">
                                Proteksi Akun <span className="text-orange-500 italic">Wajib</span>
                            </DialogTitle>
                        </DialogHeader>
                    </div>
                </div>

                <div className="p-5 sm:p-8 space-y-5 sm:space-y-6">
                    {/* Professional Warning Card */}
                    <div className="bg-red-50/50 dark:bg-red-950/20 border border-red-100/50 dark:border-red-900/30 p-4 sm:p-5 rounded-2xl sm:rounded-[1.5rem] relative overflow-hidden group">
                        <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
                        <DialogDescription className="text-slate-700 dark:text-slate-300 text-xs sm:text-sm leading-relaxed">
                            <span className="font-black text-red-600 dark:text-red-400 uppercase text-[10px] sm:text-xs block mb-1 tracking-widest">Security Alert</span>
                            Sistem mendeteksi Anda masih menggunakan kredensial bawaan. Untuk menjaga integritas data operasional, silakan perbarui kata sandi Anda sekarang.
                        </DialogDescription>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
                        <div className="space-y-1.5 sm:space-y-2">
                            <div className="flex justify-between items-center px-1">
                                <Label htmlFor="oldPasswordMandatory" className="text-[10px] sm:text-xs uppercase font-black text-slate-400 tracking-tighter">Password Sekarang</Label>
                                <span className="text-[9px] sm:text-[10px] text-amber-600 dark:text-amber-500 font-bold bg-amber-50 dark:bg-amber-950/40 px-2 py-0.5 rounded-full">Default: password123</span>
                            </div>
                            <div className="relative group">
                                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-red-500 transition-colors">
                                    <Key size={18} />
                                </div>
                                <Input
                                    id="oldPasswordMandatory"
                                    type={showOldPassword ? "text" : "password"}
                                    value={oldPassword}
                                    onChange={(e) => setOldPassword(e.target.value)}
                                    className="pl-12 pr-10 h-12 sm:h-14 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all text-sm sm:text-base font-medium"
                                    placeholder="Masukkan password lama"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowOldPassword(!showOldPassword)}
                                    className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                                >
                                    {showOldPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1.5 sm:space-y-2">
                                <Label htmlFor="newPasswordMandatory" className="text-[10px] sm:text-xs uppercase font-black text-slate-400 tracking-tighter px-1">Password Baru</Label>
                                <div className="relative">
                                    <Input
                                        id="newPasswordMandatory"
                                        type={showNewPassword ? "text" : "password"}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="pr-10 h-12 sm:h-14 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm sm:text-base font-medium"
                                        placeholder="Min. 6 karakter"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    >
                                        {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-1.5 sm:space-y-2">
                                <Label htmlFor="confirmPasswordMandatory" className="text-[10px] sm:text-xs uppercase font-black text-slate-400 tracking-tighter px-1">Konfirmasi Baru</Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPasswordMandatory"
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="pr-10 h-12 sm:h-14 bg-slate-50 dark:bg-slate-900/50 border-slate-200 dark:border-slate-800 rounded-2xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm sm:text-base font-medium"
                                        placeholder="Ulangi password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                                    >
                                        {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="pt-2 sm:pt-4">
                            <Button
                                type="submit"
                                disabled={isLoading}
                                className="w-full bg-slate-950 dark:bg-white text-white dark:text-slate-950 hover:bg-slate-800 dark:hover:bg-slate-100 font-black rounded-2xl h-14 sm:h-16 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.3)] dark:shadow-[0_20px_40px_-15px_rgba(255,255,255,0.1)] transition-all active:scale-[0.96] text-sm tracking-widest sm:text-base"
                            >
                                {isLoading ? (
                                    <div className="flex items-center gap-3">
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        <span>MEMPROSES...</span>
                                    </div>
                                ) : (
                                    'PERBARUI SEKARANG'
                                )}
                            </Button>
                        </div>
                    </form>

                    <p className="text-[10px] text-center text-slate-400 font-medium uppercase tracking-widest">
                        Integrity • Security • Professionalism
                    </p>
                </div>
            </DialogContent>
        </Dialog>
    );
}
