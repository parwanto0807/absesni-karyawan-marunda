'use client';

import { useState } from 'react';
import { login } from '@/actions/auth';
import {
    ShieldCheck,
    User,
    Lock,
    Eye,
    EyeOff,
    Loader2,
    ChevronRight,
    Shield,
    Briefcase,
    Users,
    Leaf,
    Sparkles,
    Home,
    ArrowLeft,
    ArrowRight
} from 'lucide-react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedRole, setSelectedRole] = useState<string>('SECURITY');

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        const result = await login(formData);

        if (result?.error) {
            setError(result.error);
            setIsLoading(false);
        }
    }

    const roles = [
        { id: 'ADMIN', label: 'Admin BPL', icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-50', border: 'border-indigo-100', activeBorder: 'border-indigo-600' },
        { id: 'RT', label: 'RT', icon: Home, color: 'text-rose-600', bg: 'bg-rose-50', border: 'border-rose-100', activeBorder: 'border-rose-600' },
        { id: 'KEBERSIHAN', label: 'Kebersihan', icon: Sparkles, color: 'text-sky-600', bg: 'bg-sky-50', border: 'border-sky-100', activeBorder: 'border-sky-600' },
        { id: 'SECURITY', label: 'Security', icon: ShieldCheck, color: 'text-amber-600', bg: 'bg-amber-50', border: 'border-amber-100', activeBorder: 'border-amber-600' },
        { id: 'LINGKUNGAN', label: 'Lingkungan', icon: Leaf, color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-100', activeBorder: 'border-emerald-600' },
    ];

    return (
        <div className="min-h-screen flex bg-white font-sans overflow-hidden">
            {/* Left Side: Aesthetic Residential Image (Hidden on Mobile) */}
            <div className="hidden lg:flex lg:w-1/2 relative">
                <div className="absolute inset-0 bg-indigo-900/40 z-10" />
                <img
                    src="/metland_marunda_gate_ultra.png"
                    alt="Metland Cluster Gate"
                    className="absolute inset-0 w-full h-full object-cover"
                />

                <div className="relative z-20 p-20 flex flex-col justify-between h-full text-white">
                    <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 rounded-2xl bg-white flex items-center justify-center text-indigo-600 shadow-xl">
                            <Home size={28} />
                        </div>
                        <div>
                            <span className="block text-xl font-black uppercase tracking-tighter">Cluster Taman</span>
                            <span className="block text-[8px] font-black uppercase tracking-[0.4em] opacity-80 -mt-1">Marunda | Metland Cibitung</span>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <h2 className="text-6xl font-black leading-none tracking-tighter uppercase">
                            Sistem <br />
                            <span className="text-indigo-400">Monitoring</span> <br />
                            Cluster Perumahan
                        </h2>
                        <p className="text-lg font-medium text-slate-200 max-w-md leading-relaxed">
                            Portal khusus tim pengelola, security, dan kebersihan RT 003 & 004 RW 26 Metland Cibitung.
                        </p>
                    </div>

                    <div className="text-[10px] font-black uppercase tracking-widest opacity-60">
                        © 2024 Pengurus Lingkungan RW 26 • Secure & Integrated
                    </div>
                </div>
            </div>

            {/* Right Side: Stylized Login Form */}
            <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 md:p-12 lg:p-20 bg-slate-50 relative">

                {/* Back to Website Button */}
                <div className="absolute top-4 left-4 md:top-8 md:left-8 lg:left-20 z-30">
                    <Link
                        href="/?landing=true"
                        className="flex items-center space-x-2 text-slate-400 hover:text-indigo-600 transition-colors group"
                    >
                        <ArrowLeft size={16} className="group-hover:-translate-x-1 transition-transform" />
                        <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest">Halaman Utama Warga</span>
                    </Link>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full space-y-10"
                >
                    {/* Header */}
                    <div className="space-y-3 pt-12 lg:pt-0">
                        <div className="lg:hidden flex items-center space-x-2 mb-6">
                            <img src="/logo_marunda.png" alt="Logo" className="w-8 h-8 object-contain" />
                            <span className="text-[10px] font-black text-slate-900 uppercase tracking-tighter leading-none">RT 003/004 | RW 26 Metland Cibitung</span>
                        </div>

                        <h1 className="text-3xl md:text-4xl font-black text-slate-900 tracking-tighter uppercase leading-none">
                            Login <span className="text-indigo-600">Petugas</span>
                        </h1>
                        <p className="text-slate-500 text-xs md:text-sm font-medium">Monitoring & Absensi Terpadu.</p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <input type="hidden" name="selectedRole" value={selectedRole} />

                        {/* Role Selector (Compact & Aesthetic) */}
                        <div className="space-y-4">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Pilih Divisi / Jabatan</label>
                            <div className="grid grid-cols-5 gap-2">
                                {roles.map((role) => (
                                    <button
                                        key={role.id}
                                        type="button"
                                        onClick={() => setSelectedRole(role.id)}
                                        title={role.label}
                                        className={cn(
                                            "flex flex-col items-center justify-center aspect-square rounded-2xl border-2 transition-all duration-500 active:scale-90",
                                            selectedRole === role.id
                                                ? cn("bg-white shadow-2xl scale-105 z-10", role.activeBorder, "shadow-indigo-100")
                                                : "border-slate-100 bg-white hover:border-slate-200 hover:scale-[1.02]"
                                        )}
                                    >
                                        <div className={cn(
                                            "p-2 rounded-xl transition-all duration-500",
                                            role.bg
                                        )}>
                                            <role.icon size={20} className={cn(
                                                "transition-colors duration-500",
                                                role.color
                                            )} />
                                        </div>
                                        <span className={cn(
                                            "text-[7px] font-black uppercase tracking-tight mt-1.5 truncate w-full text-center px-1 transition-colors duration-500",
                                            selectedRole === role.id ? "text-slate-900" : "text-slate-400"
                                        )}>
                                            {role.label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {error && (
                            <div className="p-4 rounded-2xl bg-rose-50 text-rose-600 text-xs font-bold border border-rose-100 animate-in fade-in slide-in-from-top-2">
                                ⚠️ {error}
                            </div>
                        )}

                        <div className="space-y-5">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 ml-1 uppercase tracking-widest">Username</label>
                                <div className="relative group">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors">
                                        <User size={18} />
                                    </span>
                                    <input
                                        name="username"
                                        type="text"
                                        required
                                        className="w-full h-14 pl-12 pr-4 rounded-2xl border-2 border-slate-100 focus:border-indigo-600 bg-white outline-none transition-all text-slate-900 font-semibold text-sm"
                                        placeholder="Username karyawan"
                                    />
                                </div>
                            </div>

                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-slate-500 ml-1 uppercase tracking-widest">Password</label>
                                <div className="relative group">
                                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-300 group-focus-within:text-indigo-600 transition-colors">
                                        <Lock size={18} />
                                    </span>
                                    <input
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        required
                                        className="w-full h-14 pl-12 pr-12 rounded-2xl border-2 border-slate-100 focus:border-indigo-600 bg-white outline-none transition-all text-slate-900 font-semibold text-sm"
                                        placeholder="••••••••"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-300 hover:text-indigo-600 transition-colors"
                                    >
                                        {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                    </button>
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-16 bg-slate-900 hover:bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm shadow-2xl shadow-slate-200 hover:shadow-indigo-200 flex items-center justify-center space-x-3 transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin h-6 w-6" />
                            ) : (
                                <>
                                    <span>Masuk Portal</span>
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="text-center">
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-relaxed">
                            Lupa password? Hubungi <br />
                            <button type="button" className="text-indigo-600 hover:underline">Administrator IT BPL Marunda</button>
                        </p>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
