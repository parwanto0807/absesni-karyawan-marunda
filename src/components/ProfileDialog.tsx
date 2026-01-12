"use client";

import React, { useState } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import { SessionPayload } from '@/types/auth';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { User, Shield, Key, Loader2 } from 'lucide-react';
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { changePassword } from '@/actions/auth';
import { toast } from 'sonner';

interface ProfileDialogProps {
    user: SessionPayload | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function ProfileDialog({ user, open, onOpenChange }: ProfileDialogProps) {
    const [oldPassword, setOldPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    if (!user) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            toast.error('Password baru dan konfirmasi tidak cocok.');
            return;
        }

        if (newPassword.length < 1) {
            toast.error('Password baru tidak boleh kosong.');
            return;
        }

        setIsLoading(true);
        try {
            const result = await changePassword(user.userId, oldPassword, newPassword);
            if (result.error) {
                toast.error(result.error);
            } else {
                toast.success('Password berhasil diubah.');
                setOldPassword('');
                setNewPassword('');
                setConfirmPassword('');
                onOpenChange(false);
            }
        } catch (error) {
            toast.error('Terjadi kesalahan saat mengubah password.');
        } finally {
            setIsLoading(false);
        }
    };

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

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="username" className="text-xs uppercase font-black text-slate-400 tracking-widest">Username</Label>
                            <div className="flex items-center space-x-2 p-2 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
                                <User size={16} className="text-slate-400" />
                                <span className="text-sm font-bold text-slate-700 dark:text-slate-300">{user.username}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="oldPassword" className="text-xs uppercase font-black text-slate-400 tracking-widest">Old Password</Label>
                            <Input
                                id="oldPassword"
                                type="password"
                                value={oldPassword}
                                onChange={(e) => setOldPassword(e.target.value)}
                                className="h-9"
                                placeholder="••••••"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="newPassword" className="text-xs uppercase font-black text-slate-400 tracking-widest">New Password</Label>
                            <Input
                                id="newPassword"
                                type="password"
                                value={newPassword}
                                onChange={(e) => setNewPassword(e.target.value)}
                                className="h-9"
                                placeholder="••••••"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" className="text-xs uppercase font-black text-slate-400 tracking-widest">Retype New Password</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="h-9"
                                placeholder="••••••"
                                required
                            />
                        </div>

                        <div className="pt-2">
                            <Button type="submit" disabled={isLoading} className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl h-10">
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating...
                                    </>
                                ) : (
                                    'Submit Change Password'
                                )}
                            </Button>
                        </div>
                    </form>
                </div>
            </DialogContent>
        </Dialog>
    );
}
