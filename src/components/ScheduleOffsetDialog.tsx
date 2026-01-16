'use client';

import React, { useState } from 'react';
import { X, Loader2, Save, User as UserIcon } from 'lucide-react';
import { updateRotationOffset } from '@/actions/employees';

interface RotationUser {
    id: string;
    name: string;
    rotationOffset: number;
    employeeId: string;
}

interface ScheduleOffsetDialogProps {
    isOpen: boolean;
    onClose: () => void;
    users: RotationUser[];
}

export default function ScheduleOffsetDialog({ isOpen, onClose, users }: ScheduleOffsetDialogProps) {
    const [isLoading, setIsLoading] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleUpdateOffset = async (userId: string, offset: string) => {
        setIsLoading(userId);
        await updateRotationOffset(userId, parseInt(offset));
        setIsLoading(null);
    };

    const offsetOptions = [
        { value: "0", label: "P → PM → M → OFF → OFF" },
        { value: "4", label: "OFF → P → PM → M → OFF" },
        { value: "3", label: "OFF → OFF → P → PM → M" },
        { value: "2", label: "M → OFF → OFF → P → PM" },
        { value: "1", label: "PM → M → OFF → OFF → P" },
    ];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div
                className="w-full max-w-2xl bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-100 dark:border-slate-800"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between px-8 py-6 border-b border-slate-50 dark:border-slate-800">
                    <div>
                        <h2 className="text-xl font-bold text-slate-900 dark:text-white">Atur Offset Rotasi</h2>
                        <p className="text-xs text-slate-500">Sesuaikan urutan shift security dengan kondisi riil.</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-8 max-h-[60vh] overflow-y-auto space-y-4">
                    {users.map((user) => (
                        <div key={user.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 gap-4">
                            <div className="flex items-center space-x-3">
                                <div className="h-10 w-10 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center font-bold">
                                    {user.name.charAt(0)}
                                </div>
                                <div>
                                    <div className="text-sm font-bold text-slate-900 dark:text-white">{user.name}</div>
                                    <div className="text-[10px] text-slate-400 font-mono italic">{user.employeeId}</div>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 flex-grow md:max-w-xs">
                                <select
                                    defaultValue={user.rotationOffset || 0}
                                    onChange={(e) => handleUpdateOffset(user.id, e.target.value)}
                                    disabled={isLoading === user.id}
                                    className="flex-grow h-10 px-4 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 outline-none text-xs font-bold dark:text-white disabled:opacity-50"
                                >
                                    {offsetOptions.map((opt) => (
                                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                                    ))}
                                </select>
                                {isLoading === user.id && (
                                    <Loader2 className="animate-spin h-4 w-4 text-indigo-600" />
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="p-8 border-t border-slate-50 dark:border-slate-800 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-8 h-12 rounded-2xl font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200 dark:shadow-none transition-all active:scale-95"
                    >
                        Selesai
                    </button>
                </div>
            </div>
        </div>
    );
}
