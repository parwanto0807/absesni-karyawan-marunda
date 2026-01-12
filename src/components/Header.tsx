'use client';

import React from 'react';
import { Bell, Search, User as UserIcon, Menu, LogOut, Settings } from 'lucide-react';
import { useSidebar } from '@/hooks/use-sidebar';
import { ModeToggle } from '@/components/ModeToggle';
import { SessionPayload } from '@/types/auth';
import { useState } from 'react';
import { ProfileDialog } from './ProfileDialog';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { logout } from '@/actions/auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

interface HeaderProps {
    user: SessionPayload | null;
}

export default function Header({ user }: HeaderProps) {
    const { toggleOpen } = useSidebar();
    const router = useRouter();
    const [isProfileOpen, setIsProfileOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await logout();
            toast.success('Berhasil keluar');
            router.push('/login');
        } catch (error) {
            toast.error('Gagal keluar');
        }
    };

    return (
        <header className="sticky top-0 z-30 flex h-16 w-full items-center justify-between border-b border-slate-200 bg-white/80 px-4 md:px-8 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/80">
            <div className="flex items-center space-x-4">
                <button
                    onClick={toggleOpen}
                    className="flex lg:hidden h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600 transition-colors hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700"
                >
                    <Menu className="h-5 w-5" />
                </button>

                <div className="hidden md:flex w-64 lg:w-96 items-center">
                    <div className="relative w-full">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <Search className="h-4 w-4 text-slate-400" />
                        </span>
                        <input
                            type="text"
                            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                            placeholder="Cari data..."
                        />
                    </div>
                </div>
            </div>

            <div className="flex items-center space-x-2 md:space-x-4">
                <ModeToggle />
                <button className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-slate-50 text-slate-600 transition-colors hover:bg-slate-100 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700">
                    <Bell className="h-5 w-5" />
                    <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-900" />
                </button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="flex items-center space-x-3 border-l border-slate-200 pl-4 dark:border-slate-700 outline-none">
                            <div className="hidden sm:flex flex-col items-end">
                                <span className="text-sm font-semibold text-slate-900 dark:text-white capitalize">
                                    {user?.username || 'Guest'}
                                </span>
                                <span className="text-xs text-slate-500 uppercase tracking-tighter">
                                    {user?.role || 'User'}
                                </span>
                            </div>
                            <Avatar className="h-10 w-10 border-2 border-white dark:border-slate-800 shadow-md rounded-xl cursor-pointer hover:opacity-90 transition-opacity">
                                <AvatarImage src={user?.image || `https://ui-avatars.com/api/?name=${user?.username || 'G'}&background=6366f1&color=fff`} className="object-cover" />
                                <AvatarFallback className="bg-indigo-600 text-white rounded-xl">
                                    {user?.username?.charAt(0).toUpperCase() || 'G'}
                                </AvatarFallback>
                            </Avatar>
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 rounded-xl p-2">
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-medium leading-none">{user?.username}</p>
                                <p className="text-xs leading-none text-muted-foreground uppercase">{user?.role}</p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem className="rounded-lg cursor-pointer" onClick={() => setIsProfileOpen(true)}>
                            <UserIcon className="mr-2 h-4 w-4" />
                            <span>Profile</span>
                        </DropdownMenuItem>
                        {(user?.role !== 'SECURITY' && user?.role !== 'LINGKUNGAN') && (
                            <DropdownMenuItem className="rounded-lg cursor-pointer" onClick={() => router.push('/admin/settings')}>
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Settings</span>
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            className="rounded-lg cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/10"
                            onClick={handleLogout}
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Log out</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
            <ProfileDialog user={user} open={isProfileOpen} onOpenChange={setIsProfileOpen} />
        </header>
    );
}
