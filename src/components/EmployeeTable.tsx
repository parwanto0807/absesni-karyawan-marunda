'use client';

import React, { useState } from 'react';
import { MoreHorizontal, Mail, Shield, User, Edit2, Trash2, X } from 'lucide-react';
import { User as UserType } from '@/types/attendance';
import { deleteUser } from '@/actions/employees';
import EmployeeDialog from './EmployeeDialog';
import { cn } from '@/lib/utils';

interface EmployeeTableProps {
    employees: UserType[];
}

export default function EmployeeTable({ employees }: EmployeeTableProps) {
    const [editingEmployee, setEditingEmployee] = useState<UserType | null>(null);
    const [previewImage, setPreviewImage] = useState<{ url: string, name: string } | null>(null);
    const [isDeleting, setIsDeleting] = useState<string | null>(null);

    const handleDelete = async (id: string) => {
        if (confirm('Apakah Anda yakin ingin menghapus karyawan ini? Seluruh data absensi terkait juga akan dihapus.')) {
            setIsDeleting(id);
            await deleteUser(id);
            setIsDeleting(null);
        }
    };

    const sortedEmployees = [...employees].sort((a, b) => {
        const roleOrder: Record<string, number> = {
            'ADMIN': 0,
            'PIC': 1,
            'SECURITY': 2,
            'LINGKUNGAN': 3,
            'KEBERSIHAN': 4
        };
        const roleA = roleOrder[a.role] ?? 99;
        const roleB = roleOrder[b.role] ?? 99;

        if (roleA !== roleB) return roleA - roleB;
        return a.name.localeCompare(b.name);
    });

    return (
        <>
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 dark:bg-slate-800/50 dark:text-slate-400">
                        <tr>
                            <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Karyawan</th>
                            <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">ID Karyawan</th>
                            <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px]">Tugas/Role</th>
                            <th className="px-6 py-4 font-semibold uppercase tracking-wider text-[10px] text-right">Aksi</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {sortedEmployees.map((emp) => (
                            <tr key={emp.id} className={cn(
                                "group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors",
                                isDeleting === emp.id && "opacity-50 pointer-events-none"
                            )}>
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-3">
                                        <div
                                            onClick={() => emp.image && setPreviewImage({ url: emp.image, name: emp.name })}
                                            className={cn(
                                                "h-10 w-10 flex items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800 transition-all overflow-hidden",
                                                emp.image && "cursor-zoom-in hover:ring-2 hover:ring-indigo-500 hover:ring-offset-2 dark:hover:ring-offset-slate-900"
                                            )}
                                        >
                                            {emp.image ? (
                                                <img src={emp.image} alt={emp.name} className="h-full w-full object-cover" />
                                            ) : (
                                                <User size={20} />
                                            )}
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="font-bold text-slate-900 dark:text-white uppercase tracking-tight">{emp.name}</span>
                                            <span className="text-[11px] text-slate-500 font-medium">@{emp.username}</span>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 font-mono text-slate-600 dark:text-slate-400 font-medium">{emp.employeeId}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center rounded-lg px-3 py-1 text-[10px] font-black uppercase tracking-wider ${emp.role === 'SECURITY'
                                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-400'
                                        : emp.role === 'ADMIN'
                                            ? 'bg-purple-50 text-purple-700 dark:bg-purple-400/10 dark:text-purple-400'
                                            : emp.role === 'PIC'
                                                ? 'bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400'
                                                : emp.role === 'LINGKUNGAN'
                                                    ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400'
                                                    : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                        }`}>
                                        {emp.role === 'SECURITY' && <Shield size={10} className="mr-1" />}
                                        {emp.role}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button
                                            onClick={() => setEditingEmployee(emp)}
                                            className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 rounded-xl transition-all"
                                            title="Edit"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(emp.id)}
                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-900/10 rounded-xl transition-all"
                                            title="Hapus"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile/Tablet Card View */}
            <div className="md:hidden space-y-3">
                {sortedEmployees.map((emp) => (
                    <div key={emp.id} className={cn(
                        "bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden",
                        isDeleting === emp.id && "opacity-50 pointer-events-none"
                    )}>
                        <div className="flex items-start space-x-3">
                            <div
                                onClick={() => emp.image && setPreviewImage({ url: emp.image, name: emp.name })}
                                className={cn(
                                    "h-12 w-12 flex items-center justify-center rounded-xl bg-slate-100 text-slate-400 dark:bg-slate-800 transition-all overflow-hidden shrink-0",
                                    emp.image && "active:scale-95"
                                )}
                            >
                                {emp.image ? (
                                    <img src={emp.image} alt={emp.name} className="h-full w-full object-cover" />
                                ) : (
                                    <User size={24} />
                                )}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                    <h3 className="font-bold text-slate-900 dark:text-white uppercase tracking-tight text-sm truncate pr-2">{emp.name}</h3>
                                    <div className="flex items-center space-x-1 shrink-0">
                                        <button
                                            onClick={() => setEditingEmployee(emp)}
                                            className="p-1.5 text-slate-400 hover:text-indigo-600 bg-slate-50 dark:bg-slate-800 rounded-lg"
                                        >
                                            <Edit2 size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(emp.id)}
                                            className="p-1.5 text-slate-400 hover:text-rose-600 bg-slate-50 dark:bg-slate-800 rounded-lg"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2 mb-2">
                                    <span className="text-[10px] text-slate-500 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-md">
                                        {emp.employeeId}
                                    </span>
                                    <span className="text-[10px] text-slate-400">
                                        @{emp.username}
                                    </span>
                                </div>
                                <span className={`inline-flex items-center rounded-md px-2 py-1 text-[9px] font-black uppercase tracking-wider ${emp.role === 'SECURITY'
                                    ? 'bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-blue-400'
                                    : emp.role === 'ADMIN'
                                        ? 'bg-purple-50 text-purple-700 dark:bg-purple-400/10 dark:text-purple-400'
                                        : emp.role === 'PIC'
                                            ? 'bg-amber-50 text-amber-700 dark:bg-amber-400/10 dark:text-amber-400'
                                            : emp.role === 'LINGKUNGAN'
                                                ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-400/10 dark:text-emerald-400'
                                                : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                                    }`}>
                                    {emp.role === 'SECURITY' && <Shield size={8} className="mr-1" />}
                                    {emp.role}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Image Preview Modal */}
            {previewImage && (
                <div
                    className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md animate-in fade-in duration-300"
                    onClick={() => setPreviewImage(null)}
                >
                    <div
                        className="relative max-w-2xl w-full bg-white dark:bg-slate-900 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-300 border-4 border-white dark:border-slate-800"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <button
                            onClick={() => setPreviewImage(null)}
                            className="absolute top-4 right-4 z-10 p-2 rounded-full bg-black/20 hover:bg-black/40 text-white backdrop-blur-md transition-all active:scale-95"
                        >
                            <X size={24} />
                        </button>
                        <img
                            src={previewImage.url}
                            alt={previewImage.name}
                            className="w-full h-auto max-h-[80vh] object-contain bg-slate-950"
                        />
                        <div className="p-6 text-center">
                            <h3 className="text-xl font-bold text-slate-900 dark:text-white uppercase tracking-tight">{previewImage.name}</h3>
                            <p className="text-sm text-slate-500 mt-1 font-medium">Foto Profil Karyawan</p>
                        </div>
                    </div>
                </div>
            )}

            {editingEmployee && (
                <EmployeeDialog
                    isOpen={true}
                    onClose={() => setEditingEmployee(null)}
                    employee={editingEmployee}
                />
            )}
        </>
    );
}
