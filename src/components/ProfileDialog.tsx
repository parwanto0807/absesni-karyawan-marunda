"use client";

import React from 'react';
import {
    Dialog,
    DialogContent,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { SessionPayload } from '@/types/auth';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Shield } from 'lucide-react';

interface ProfileDialogProps {
    user: SessionPayload | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ProfileDialog({ user, open, onOpenChange }: ProfileDialogProps) {
    if (!user) return null;



    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] rounded-2xl bg-white dark:bg-slate-950 border-slate-100 dark:border-slate-800 shadow-2xl p-0 overflow-hidden">
                <div className="relative h-24 bg-gradient-to-r from-indigo-500 to-purple-500">
                    <div className="absolute -bottom-10 left-6">
                        <Avatar className="h-20 w-20 border-4 border-white dark:border-slate-950 shadow-lg rounded-2xl">
                            <AvatarImage src={user.image || `https://ui-avatars.com/api/?name=${user.username}&background=6366f1&color=fff`} className="object-cover" />
                            <AvatarFallback className="bg-indigo-600 text-white text-2xl font-bold rounded-2xl">
                                {user.username.charAt(0).toUpperCase()}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                </div>

                <div className="pt-12 px-6 pb-6 space-y-6">
                    <div>
                        <DialogTitle className="text-2xl font-black tracking-tight text-slate-900 dark:text-white capitalize">
                            {user.username}
                        </DialogTitle>
                        <DialogDescription className="text-slate-500 dark:text-slate-400 font-medium flex items-center gap-1 mt-1">
                            <Shield size={14} className="text-indigo-500" />
                            {user.role}
                        </DialogDescription>
                    </div>

                    <div className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 p-4 rounded-xl text-center">
                        <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 italic">Informasi Keamanan</p>
                        <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
                            Penggantian kata sandi melalui menu profil telah dinonaktifkan untuk keamanan sistem.
                            Silakan hubungi Administrator jika Anda memerlukan perubahan kredensial lebih lanjut.
                        </p>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
