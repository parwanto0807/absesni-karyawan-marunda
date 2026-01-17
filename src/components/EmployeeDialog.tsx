'use client';

import React, { useState, useEffect } from 'react';
import { X, Loader2, Shield, User as UserIcon, Lock, Fingerprint, Briefcase, Leaf, Sparkles, Home } from 'lucide-react';
import { cn } from '@/lib/utils';
import { User, UserRole } from '@/types/attendance';
import { createUser, updateUser } from '@/actions/employees';
import NextImage from 'next/image';

interface EmployeeDialogProps {
    isOpen: boolean;
    onClose: () => void;
    employee?: User | null; // If provided, we are in "Update" mode
}

export default function EmployeeDialog({ isOpen, onClose, employee }: EmployeeDialogProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [preview, setPreview] = useState<string | null>(employee?.image || null);
    const [imageBase64, setImageBase64] = useState<string | null>(employee?.image || null);
    const [selectedRole, setSelectedRole] = useState<string>(employee?.role || 'STAFF');

    useEffect(() => {
        if (employee) {
            setSelectedRole(employee.role);
            setPreview(employee.image || null);
            setImageBase64(employee.image || null);
        }
    }, [employee]);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {


            // Compress image before converting to base64
            const reader = new FileReader();
            reader.onloadend = () => {
                const img = new window.Image();
                img.onload = () => {
                    // Create canvas for compression
                    const canvas = document.createElement('canvas');
                    const ctx = canvas.getContext('2d');

                    // Calculate new dimensions (max 800px)
                    let width = img.width;
                    let height = img.height;
                    const maxSize = 800;

                    if (width > height && width > maxSize) {
                        height = (height * maxSize) / width;
                        width = maxSize;
                    } else if (height > maxSize) {
                        width = (width * maxSize) / height;
                        height = maxSize;
                    }

                    canvas.width = width;
                    canvas.height = height;

                    // Draw and compress
                    ctx?.drawImage(img, 0, 0, width, height);
                    const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8); // 80% quality



                    setPreview(compressedBase64);
                    setImageBase64(compressedBase64);
                };
                img.src = reader.result as string;
            };
            reader.readAsDataURL(file);
        }
    };

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(event.currentTarget);

        // Debug logging


        // Explicitly append the base64 image to FormData
        if (imageBase64) {
            formData.set('image', imageBase64);

        } else {

        }

        let result: { success: boolean; message?: string };

        if (employee) {
            result = await updateUser(employee.id, formData);
        } else {
            result = await createUser(formData);
        }

        if (result.success) {
            setIsLoading(false);
            onClose();
        } else {
            setError(result.message || 'Gagal menyimpan data');
            setIsLoading(false);
        }
    }

    const roleOptions = [
        { id: 'ADMIN', label: 'Admin', icon: Shield },
        { id: 'RT', label: 'RT', icon: Home },
        { id: 'SECURITY', label: 'Security', icon: Shield },
        { id: 'PIC', label: 'PIC', icon: Briefcase },
        { id: 'LINGKUNGAN', label: 'Lingkungan', icon: Leaf },
        { id: 'KEBERSIHAN', label: 'Kebersihan', icon: Sparkles },
        { id: 'STAFF', label: 'Staff', icon: UserIcon },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-50 dark:border-slate-800 shrink-0">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                        {employee ? 'Edit Data Karyawan' : 'Tambah Karyawan'}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
                    {error && (
                        <div className="p-3 rounded-xl bg-rose-50 text-rose-600 text-[10px] font-bold border border-rose-100 animate-in shake-2">
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {/* Photo Upload */}
                        <div className="space-y-1 md:col-span-2 flex flex-col items-center pb-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 w-full ml-1 text-center">Foto</label>
                            <div className="relative group mt-1">
                                <div className="h-20 w-20 rounded-[1.5rem] bg-slate-50 dark:bg-slate-800 border-2 border-dashed border-slate-200 dark:border-slate-700 flex items-center justify-center overflow-hidden ring-4 ring-white dark:ring-slate-900 shadow-lg">
                                    {preview ? (
                                        <div className="relative h-full w-full">
                                            <img
                                                src={preview}
                                                alt="Preview"
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    (e.target as HTMLImageElement).src = '/no-image.png';
                                                }}
                                            />
                                        </div>
                                    ) : (
                                        <UserIcon size={28} className="text-slate-300" />
                                    )}
                                </div>
                                <label className="absolute -bottom-1 -right-1 h-8 w-8 bg-indigo-600 text-white rounded-xl flex items-center justify-center cursor-pointer shadow-lg hover:bg-indigo-700 transition-all active:scale-90 border-2 border-white dark:border-slate-900">
                                    <Fingerprint size={14} />
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleFileChange}
                                    />
                                </label>
                            </div>
                        </div>

                        {/* Name */}
                        <div className="space-y-1 md:col-span-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Nama Lengkap</label>
                            <div className="relative group">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                    <UserIcon size={16} />
                                </span>
                                <input
                                    name="name"
                                    defaultValue={employee?.name}
                                    required
                                    className="w-full h-10 pl-9 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 outline-none transition-all dark:text-white text-xs font-bold"
                                    placeholder="Contoh: Budi Santoso"
                                />
                            </div>
                        </div>

                        {/* Username */}
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Username</label>
                            <div className="relative group">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                    <Fingerprint size={16} />
                                </span>
                                <input
                                    name="username"
                                    defaultValue={employee?.username}
                                    required
                                    className="w-full h-10 pl-9 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 outline-none transition-all dark:text-white text-xs font-bold"
                                    placeholder="budi_s"
                                />
                            </div>
                        </div>

                        {/* Employee ID */}
                        <div className="space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">ID Karyawan</label>
                            <div className="relative group">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                    <Briefcase size={16} />
                                </span>
                                <input
                                    name="employeeId"
                                    defaultValue={employee?.employeeId}
                                    required
                                    className="w-full h-10 pl-9 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 outline-none transition-all dark:text-white text-xs font-bold font-mono"
                                    placeholder="SEC-001"
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div className="space-y-1 md:col-span-2">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                Password {employee && '(Opsional)'}
                            </label>
                            <div className="relative group">
                                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 group-focus-within:text-indigo-600 transition-colors">
                                    <Lock size={16} />
                                </span>
                                <input
                                    name="password"
                                    type="password"
                                    required={!employee}
                                    className="w-full h-10 pl-9 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 outline-none transition-all dark:text-white text-xs font-bold"
                                    placeholder="••••••••"
                                />
                            </div>
                        </div>

                        {/* Role selection */}
                        <div className="md:col-span-2 space-y-1">
                            <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Jabatan / Role</label>
                            <div className="grid grid-cols-3 gap-2">
                                {roleOptions.map((opt) => (
                                    <label
                                        key={opt.id}
                                        className={cn(
                                            "flex items-center justify-center p-2 rounded-xl border-2 cursor-pointer transition-all active:scale-95",
                                            "has-[:checked]:border-indigo-600 has-[:checked]:bg-indigo-50 dark:has-[:checked]:bg-indigo-900/20",
                                            "border-transparent bg-slate-50 dark:bg-slate-800"
                                        )}
                                    >
                                        <input
                                            type="radio"
                                            name="role"
                                            value={opt.id}
                                            checked={selectedRole === opt.id}
                                            onChange={(e) => setSelectedRole(e.target.value)}
                                            className="hidden"
                                        />
                                        <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 has-[:checked]:text-indigo-700">{opt.label}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Schedule Info based on Role */}
                        {selectedRole === 'SECURITY' && (
                            <div className="md:col-span-2 space-y-1 animate-in fade-in slide-in-from-top-2 duration-300">
                                <label className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">
                                    Pola Awal (Januari 1)
                                </label>
                                <select
                                    name="rotationOffset"
                                    defaultValue={employee?.rotationOffset || 0}
                                    className="w-full h-10 px-3 rounded-xl bg-slate-50 dark:bg-slate-800 border-2 border-transparent focus:border-indigo-600 outline-none transition-all dark:text-white text-xs font-bold"
                                >
                                    <option value="0">Tipe 1: P → PM → M → OFF → OFF</option>
                                    <option value="4">Tipe 2: OFF → P → PM → M → OFF</option>
                                    <option value="3">Tipe 3: OFF → OFF → P → PM → M</option>
                                    <option value="2">Tipe 4: M → OFF → OFF → P → PM</option>
                                    <option value="1">Tipe 5: PM → M → OFF → OFF → P</option>
                                </select>
                            </div>
                        )}

                        {selectedRole === 'LINGKUNGAN' && (
                            <div className="md:col-span-2 p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-100 dark:border-emerald-800/50 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <Leaf size={18} className="text-emerald-600 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-xs font-black text-emerald-700 dark:text-emerald-400 uppercase tracking-wide">Jadwal Reguler</h4>
                                    <p className="text-[11px] font-medium text-emerald-600/80 dark:text-emerald-500 mt-0.5">
                                        Senin - Jumat (08:00 - 17:00)<br />
                                        Sabtu - Minggu (Libur)
                                    </p>
                                </div>
                            </div>
                        )}

                        {selectedRole === 'KEBERSIHAN' && (
                            <div className="md:col-span-2 p-4 rounded-xl bg-teal-50 dark:bg-teal-900/20 border-2 border-teal-100 dark:border-teal-800/50 flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                <Sparkles size={18} className="text-teal-600 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="text-xs font-black text-teal-700 dark:text-teal-400 uppercase tracking-wide">Jadwal Kebersihan</h4>
                                    <p className="text-[11px] font-medium text-teal-600/80 dark:text-teal-500 mt-0.5">
                                        Senin - Sabtu (07:00 - 16:00)<br />
                                        Minggu (Libur)
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="flex space-x-3 pt-2 shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 h-12 rounded-xl font-bold text-xs text-slate-600 dark:text-slate-400 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 transition-all active:scale-95"
                        >
                            Batal
                        </button>
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="flex-[2] h-12 rounded-xl font-bold text-xs text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none flex items-center justify-center space-x-2 transition-all active:scale-95 disabled:opacity-70"
                        >
                            {isLoading ? (
                                <Loader2 className="animate-spin h-4 w-4" />
                            ) : (
                                <span>{employee ? 'Simpan' : 'Tambah'}</span>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
