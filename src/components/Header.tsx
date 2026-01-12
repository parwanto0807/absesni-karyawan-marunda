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
import NotificationBell from '@/components/NotificationBell';
import { cn } from '@/lib/utils';

interface HeaderProps {
    user: SessionPayload | null;
}

export default function Header({ user }: HeaderProps) {
    const { toggleOpen } = useSidebar();
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<{ label: string; href: string }[]>([]);
    const [isSearchOpen, setIsSearchOpen] = useState(false);
    const [selectedIndex, setSelectedIndex] = useState(-1);

    // Restore profile state and logic
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

    const menuItems = [
        { label: 'Dashboard', href: '/', roles: ['ADMIN', 'PIC', 'SECURITY', 'LINGKUNGAN', 'STAFF'] },
        { label: 'Absensi Presensi', href: '/attendance', roles: ['ADMIN', 'PIC', 'SECURITY', 'LINGKUNGAN', 'STAFF'] },
        { label: 'Riwayat Absensi', href: '/history', roles: ['ADMIN', 'PIC', 'SECURITY', 'LINGKUNGAN', 'STAFF'] },
        { label: 'Data Karyawan', href: '/employees', roles: ['ADMIN', 'PIC'] },
        { label: 'Jadwal Security', href: '/schedules', roles: ['ADMIN', 'PIC', 'STAFF', 'SECURITY', 'LINGKUNGAN'] },
        { label: 'Izin & Cuti', href: '/permits', roles: ['ADMIN', 'PIC', 'SECURITY', 'LINGKUNGAN', 'STAFF'] },
        { label: 'Pengaturan', href: '/admin/settings', roles: ['ADMIN', 'PIC'] },
    ];

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        const query = e.target.value;
        setSearchQuery(query);

        if (query.trim() === '') {
            setSearchResults([]);
            setIsSearchOpen(false);
            return;
        }

        const filtered = menuItems.filter(item =>
            item.label.toLowerCase().includes(query.toLowerCase()) &&
            (user && item.roles.includes(user.role))
        );
        setSearchResults(filtered);
        setIsSearchOpen(true);
        setSelectedIndex(-1); // Reset selection
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (!isSearchOpen || searchResults.length === 0) return;

        if (e.key === 'ArrowDown') {
            e.preventDefault();
            setSelectedIndex(prev => (prev < searchResults.length - 1 ? prev + 1 : prev));
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            setSelectedIndex(prev => (prev > 0 ? prev - 1 : -1));
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selectedIndex >= 0) {
                handleSelectResult(searchResults[selectedIndex].href);
            }
        } else if (e.key === 'Escape') {
            setIsSearchOpen(false);
        }
    };

    const handleSelectResult = (href: string) => {
        router.push(href);
        setSearchQuery('');
        setSearchResults([]);
        setIsSearchOpen(false);
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

                <div className="hidden md:flex w-64 lg:w-96 items-center relative z-50">
                    <div className="relative w-full">
                        <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                            <Search className="h-4 w-4 text-slate-400" />
                        </span>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={handleSearch}
                            onKeyDown={handleKeyDown}
                            onFocus={() => {
                                if (searchQuery) setIsSearchOpen(true);
                            }}
                            onBlur={() => {
                                // Delay closing to allow click event
                                setTimeout(() => setIsSearchOpen(false), 200);
                            }}
                            className="h-10 w-full rounded-xl border border-slate-200 bg-slate-50 pl-10 pr-4 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white transition-all"
                            placeholder="Cari menu... (Misal: Izin, Absensi)"
                        />

                        {isSearchOpen && searchResults.length > 0 && (
                            <div className="absolute top-12 left-0 w-full bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
                                <div className="p-2">
                                    <p className="px-2 py-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Hasil Pencarian
                                    </p>
                                    {searchResults.map((result, index) => (
                                        <button
                                            key={result.href}
                                            onClick={() => handleSelectResult(result.href)}
                                            onMouseEnter={() => setSelectedIndex(index)}
                                            className={cn(
                                                "w-full text-left px-3 py-2 text-sm rounded-lg transition-colors flex items-center",
                                                index === selectedIndex
                                                    ? "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                                                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800"
                                            )}
                                        >
                                            <Search size={14} className="mr-2 opacity-50" />
                                            {result.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        {isSearchOpen && searchQuery && searchResults.length === 0 && (
                            <div className="absolute top-12 left-0 w-full bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-4 text-center">
                                <p className="text-sm text-slate-500">Tidak ditemukan hasil untuk "{searchQuery}"</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="flex items-center space-x-2 md:space-x-4">
                <ModeToggle />
                {user && <NotificationBell userId={user.userId} />}

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
