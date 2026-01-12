'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, Shield, User as UserIcon, Lock, Fingerprint, Briefcase, Leaf } from 'lucide-react';
import { cn } from '@/lib/utils';
import { User, UserRole } from '@/types/attendance';
import { createUser, updateUser } from '@/actions/employees';

interface EmployeeDialogProps {
    isOpen: boolean;
    onClose: () => void;
    employee?: User | null; // If provided, we are in "Update" mode
}

export default function EmployeeDialog({ isOpen, onClose, employee }: EmployeeDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(employee?.image || null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(event.currentTarget);
        let result;

        if (employee) {
            result = await updateUser(employee.id, formData);
        } else {
            result = await createUser(formData);
        }

        if (result.success) {
            setIsLoading(false);
            onClose();
        } else {
            setError(result.message);
            setIsLoading(false);
        }
    }

    const roleOptions = [
        { id: 'ADMIN', label: 'Admin', icon: Shield },
        { id: 'SECURITY', label: 'Security', icon: Shield },
        { id: 'PIC', label: 'PIC', icon: Briefcase },
        { id: 'LINGKUNGAN', label: 'Lingkungan', icon: Leaf },
        { id: 'STAFF', label: 'Staff', icon: UserIcon },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-8 py-6 border-b border-slate-50 dark:border-slate-800">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                        {employee ? 'Edit Data Karyawan' : 'Tambah Karyawan Baru'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-8 space-y-6">
                    {error && (
                        <div className="p-3 rounded-2xl bg-rose-50 text-rose-600 text-xs font-bold border border-rose-100 animate-in shake-2">
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Photo Upload */}
                        <div className="space-y-1.5 md:col-span-2 flex flex-col items-center pb-4">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 w-full ml-1">Foto Karyawan</label>
                            <div className="relative group mt-2">
                                <div className="h-24 w-24 rounded-[2rem] bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden ring-4 ring-white dark:ring-slate-900 shadow-xl">
                                    {preview ? (
                                        <img src={preview} alt="Preview" className="h-full w-full object-cover" />
                                    ) : (
                                        <UserIcon size={32} className="text-slate-300" />
                                    )}
                                </div>
                                <label className="absolute -bottom-2 -right-2 h-10 w-10 bg-indigo-600 text-white rounded-2xl flex items-center justify-center cursor-pointer shadow-lg hover:bg-indigo-700 transition-all active:scale-90 border-4 border-white dark:border-slate-900">
                                    <Fingerprint size={18} />
                                    <input
                                        type="file"
                                        name="image"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </label>
                            </div>
                            <p className="text-[10px] text-slate-400 mt-3 font-medium text-center">Format: JPG, PNG • Maks: 2MB</p>
                        </div>

                        {/* Name */}
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nama Lengkap</label>
                            <div className="relative group">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                    <UserIcon size={18} />
                                </span>
                                <input
                                    name="name"
                                    defaultValue={employee?.name}
                                    required
                                    className="w-full h-12 pl-11 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 outline-none transition-all dark:text-white"
                                    placeholder="Contoh: Budi Santoso"
                                />
                            </div>
                        </div>

                        {/* Username */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Username</label>
                            <div className="relative group">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                    <Fingerprint size={18} />
                                </span>
                                <input
                                    name="username"
                                    defaultValue={employee?.username}
                                    required
                                    className="w-full h-12 pl-11 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 outline-none transition-all dark:text-white"
                                    placeholder="budi_s"
                                />
                            </div>
                        </div>

                        {/* Employee ID */}
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">ID Karyawan</label>
                            <div className="relative group">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                    <Briefcase size={18} />
                                </span>
                                <input
                                    name="employeeId"
                                    defaultValue={employee?.employeeId}
                                    required
                                    className="w-full h-12 pl-11 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 outline-none transition-all dark:text-white font-mono"
                                    placeholder="SEC-001"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1.5 md:col-span-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                Password {employee && '(Kosongkan jika tidak diubah)'}
                            </label>
                            <div className="relative group">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                    <Lock size={18} />
                                </span>
                                <input
                                    name="password"
                                    type="password"
                                    required={!employee}
                                    className="w-full h-12 pl-11 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 outline-none transition-all dark:text-white"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {/* Role selection */}
                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Jabatan / Role</label>
                            <div className="grid grid-cols-3 gap-2">
                                {roleOptions.map((opt) => (
                                    <label
                                        key={opt.id}
                                        className={cn(
                                            "flex items-center justify-center p-3 rounded-2xl border-2 cursor-pointer transition-all active:scale-95",
                                            "has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50 dark:has-[:checked]:bg-indigo-900/20",
                                            "border-transparent bg-slate-50 dark:bg-slate-800"
                                        )}
                                    >
                                        <input
                                            type="radio"
                                            name="role"
                                            value={opt.id}
                                            defaultChecked={employee?.role === opt.id || (!employee && opt.id === 'STAFF')}
                                            className="hidden"
                                        />
                                        <span className="text-xs font-bold text-slate-600 dark:text-slate-400 has-[:checked]:text-indigo-700">{opt.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Rotation Offset (Only for Security) */}
                        <div className="md:col-span-2 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                Pola Awal (Januari 1)
                            </label>
                            <select
                                name="rotationOffset"
                                defaultValue={employee?.rotationOffset || 0}
                                className="w-full h-12 px-4 rounded-2xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 outline-none transition-all dark:text-white text-sm font-bold"
                            >
                                <option value="0">Tipe 1: P → PM → M → OFF → OFF (Mulai Pagi)</option>
                                <option value="4">Tipe 2: OFF → P → PM → M → OFF</option>
                                <option value="3">Tipe 3: OFF → OFF → P → PM → M</option>
                                <option value="2">Tipe 4: M → OFF → OFF → P → PM</option>
                                <option value="1">Tipe 5: PM → M → OFF → OFF → P</option>
                            </select>
                            <p className="text-[10px] text-slate-400 ml-1 font-medium italic">
                                *Gunakan pilihan ini untuk menyelaraskan urutan shift sesuai tabel Excel.
                            </p>
                        </div>
                    </div>

                    <div className="flex space-x-3 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-14 rounded-2xl font-bold text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 transition-all active:scale-95"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-[2] h-14 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-70"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin h-5 w-5" />
                            ) : (
                                <span>{employee ? 'Simpan Perubahan' : 'Tambah Karyawan'}</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
