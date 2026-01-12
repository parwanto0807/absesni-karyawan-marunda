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
    Sparkles
} from 'lucide-react';
import { cn } from '@/lib/utils';

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedRole, setSelectedRole] = useState<string>('ADMIN');

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
        { id: 'ADMIN', label: 'Admin', icon: Shield, color: 'text-indigo-600', bg: 'bg-indigo-50' },
        { id: 'KEBERSIHAN', label: 'Kebersihan', icon: Sparkles, color: 'text-teal-600', bg: 'bg-teal-50' },
        { id: 'SECURITY', label: 'Security', icon: ShieldCheck, color: 'text-amber-600', bg: 'bg-amber-50' },
        { id: 'LINGKUNGAN', label: 'Lingkungan', icon: Leaf, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    ];

    return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950 p-4 font-sans">
            <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-900 p-8 rounded-[2.5rem] shadow-2xl shadow-indigo-100 dark:shadow-none border border-slate-100 dark:border-slate-800 transition-all duration-300">

                {/* Logo & Header */}
                <div className="text-center space-y-2">
                    <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-600 text-white shadow-xl shadow-indigo-200 dark:shadow-none mb-4">
                        <ShieldCheck size={32} />
                    </div>
                    <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight">
                        Absensi<span className="text-indigo-600">Marunda</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">Selamat datang kembali! Silakan masuk.</p>
                </div>

                {/* Role Selection */}
                <div className="grid grid-cols-4 gap-2">
                    {roles.map((role) => (
                        <button
                            key={role.id}
                            type="button"
                            onClick={() => setSelectedRole(role.id)}
                            className={cn(
                                "flex flex-col items-center p-3 rounded-2xl border-2 transition-all duration-200 active:scale-95",
                                selectedRole === role.id
                                    ? "border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20"
                                    : "border-transparent bg-slate-50 dark:bg-slate-800 grayscale opacity-60 hover:grayscale-0 hover:opacity-100"
                            )}
                        >
                            <role.icon className={cn("h-6 w-6 mb-1", selectedRole === role.id ? "text-indigo-600" : "text-slate-400")} />
                            <span className={cn("text-[10px] font-bold uppercase", selectedRole === role.id ? "text-indigo-700" : "text-slate-500")}>
                                {role.label}
                            </span>
                        </button>
                    ))}
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                    <input type="hidden" name="selectedRole" value={selectedRole} />
                    {error && (
                        <div className="p-4 rounded-2xl bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 text-xs font-bold border border-rose-100 dark:border-rose-900/30 animate-in fade-in slide-in-from-top-2">
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wider">Username</label>
                        <div className="relative group">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                <User size={18} />
                            </span>
                            <input
                                name="username"
                                type="text"
                                required
                                className="w-full h-14 pl-11 pr-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all text-slate-900 dark:text-white font-medium"
                                placeholder="Masukkan username"
                            />
                        </div>
                    </div>

                    <div className="space-y-1">
                        <label className="text-xs font-bold text-slate-500 dark:text-slate-400 ml-1 uppercase tracking-wider">Password</label>
                        <div className="relative group">
                            <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                <Lock size={18} />
                            </span>
                            <input
                                name="password"
                                type={showPassword ? "text" : "password"}
                                required
                                className="w-full h-14 pl-11 pr-12 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 focus:bg-white dark:focus:bg-slate-900 outline-none transition-all text-slate-900 dark:text-white font-medium"
                                placeholder="••••••••"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 flex items-center pr-4 text-slate-400 hover:text-indigo-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-bold shadow-xl shadow-indigo-200 dark:shadow-none flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100"
                    >
                        {isLoading ? (
                            <Loader2 className="animate-spin h-6 w-6" />
                        ) : (
                            <>
                                <span>Masuk Sekarang</span>
                                <ChevronRight size={20} />
                            </>
                        )}
                    </button>
                </form>

                <div className="text-center pt-2">
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Lupa password atau kendala akses? <br />
                        <button type="button" className="text-indigo-600 font-bold hover:underline mt-1">Hubungi Support IT</button>
                    </p>
                </div>
            </div>
        </div>
    );
}
