'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
    LayoutDashboard,
    UserCheck,
    Users,
    LogOut,
    Clock,
    ShieldCheck,
    CalendarCheck,
    ChevronLeft,
    Menu,
    Settings,
    AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useSidebar } from '@/hooks/use-sidebar';
import { logout } from '@/actions/auth';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { toast } from 'sonner';

export default function Sidebar({ user }: { user: any }) {
    const pathname = usePathname();
    const router = useRouter();
    const { isOpen, isCollapsed, toggleCollapse, setOpen } = useSidebar();

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
        { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard', roles: ['ADMIN', 'PIC', 'RT', 'SECURITY', 'LINGKUNGAN', 'KEBERSIHAN', 'STAFF'] },
        { icon: UserCheck, label: 'Absensi Presensi', href: '/attendance', roles: ['ADMIN', 'PIC', 'RT', 'SECURITY', 'LINGKUNGAN', 'KEBERSIHAN', 'STAFF'] },
        { icon: Clock, label: 'Riwayat Absensi', href: '/history', roles: ['ADMIN', 'PIC', 'RT', 'SECURITY', 'LINGKUNGAN', 'KEBERSIHAN', 'STAFF'] },
        { icon: Users, label: 'Data Karyawan', href: '/employees', roles: ['ADMIN', 'PIC', 'RT'] },
        { icon: AlertTriangle, label: 'Laporan Kejadian', href: '/admin/incidents', roles: ['ADMIN', 'PIC', 'RT'] },
        { icon: ShieldCheck, label: 'Jadwal Kerja', href: '/schedules', roles: ['ADMIN', 'PIC', 'RT', 'STAFF', 'SECURITY', 'LINGKUNGAN', 'KEBERSIHAN'] },
        { icon: CalendarCheck, label: 'Ijin & Pergantian Shift', href: '/permits', roles: ['ADMIN', 'PIC', 'RT', 'SECURITY', 'LINGKUNGAN', 'KEBERSIHAN', 'STAFF'] },
        { icon: Settings, label: 'Pengaturan', href: '/admin/settings', roles: ['ADMIN', 'PIC', 'RT'] },
    ];

    // Filter menu based on user role
    const filteredMenu = menuItems.filter(item => {
        if (!user) return false;
        return item.roles.includes(user.role);
    });

    return (
        <>
            {/* Mobile Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 z-30 bg-black/50 lg:hidden backdrop-blur-sm"
                    onClick={() => setOpen(false)}
                />
            )}

            <aside
                className={cn(
                    "fixed left-0 top-0 z-40 h-screen border-r border-slate-200 bg-white transition-all duration-300 ease-in-out dark:border-slate-800 dark:bg-slate-900",
                    isCollapsed ? "w-20" : "w-64",
                    isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
                )}
            >
                <TooltipProvider delayDuration={0}>
                    <div className="flex h-full flex-col px-3 py-4 overflow-y-auto overflow-x-hidden">
                        {/* Logo Section */}
                        <div className={cn(
                            "mb-10 flex items-center px-2 transition-all duration-300",
                            isCollapsed ? "justify-center" : "justify-between"
                        )}>
                            <div className="flex items-center">
                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none">
                                    <ShieldCheck size={24} />
                                </div>
                                {!isCollapsed && (
                                    <span className="ml-3 text-xl font-bold text-slate-900 dark:text-white transition-opacity duration-300">
                                        Absensi<span className="text-indigo-600">Marunda</span>
                                    </span>
                                )}
                            </div>
                        </div>

                        <nav className="flex-1 space-y-2 font-medium">
                            {filteredMenu.map((item) => {
                                const isActive = pathname === item.href;
                                const menuLink = (
                                    <Link
                                        key={item.href}
                                        href={item.href}
                                        onClick={() => setOpen(false)}
                                        className={cn(
                                            "flex items-center rounded-xl px-4 py-3 text-sm transition-all duration-200 group relative",
                                            isActive
                                                ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-900/20 dark:text-indigo-400"
                                                : "text-slate-600 hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800",
                                            isCollapsed && "justify-center px-0"
                                        )}
                                    >
                                        <item.icon
                                            className={cn(
                                                "h-5 w-5 shrink-0 transition-colors",
                                                isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300"
                                            )}
                                        />
                                        {!isCollapsed && (
                                            <span className="ml-3 transition-opacity duration-300">{item.label}</span>
                                        )}
                                        {isActive && !isCollapsed && (
                                            <div className="ml-auto h-1.5 w-1.5 rounded-full bg-indigo-600 dark:bg-indigo-400" />
                                        )}
                                        {isActive && isCollapsed && (
                                            <div className="absolute right-0 h-8 w-1 rounded-l-full bg-indigo-600 dark:bg-indigo-400" />
                                        )}
                                    </Link>
                                );

                                return isCollapsed ? (
                                    <Tooltip key={item.href}>
                                        <TooltipTrigger asChild>
                                            {menuLink}
                                        </TooltipTrigger>
                                        <TooltipContent side="right" className="font-semibold">
                                            {item.label}
                                        </TooltipContent>
                                    </Tooltip>
                                ) : menuLink;
                            })}
                        </nav>

                        {/* Footer Actions */}
                        <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 space-y-2">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={toggleCollapse}
                                        className={cn(
                                            "hidden lg:flex w-full items-center rounded-xl px-4 py-3 text-sm font-medium text-slate-600 transition-colors hover:bg-slate-50 dark:text-slate-400 dark:hover:bg-slate-800",
                                            isCollapsed && "justify-center px-0"
                                        )}
                                    >
                                        <div className={cn("transition-transform duration-300", isCollapsed && "rotate-180")}>
                                            <ChevronLeft className="h-5 w-5" />
                                        </div>
                                        {!isCollapsed && <span className="ml-3">Minimize Menu</span>}
                                    </button>
                                </TooltipTrigger>
                                {isCollapsed && (
                                    <TooltipContent side="right" className="font-semibold">
                                        Expand Menu
                                    </TooltipContent>
                                )}
                            </Tooltip>

                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <button
                                        onClick={handleLogout}
                                        className={cn(
                                            "flex w-full items-center rounded-xl px-4 py-3 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 dark:hover:bg-red-900/10",
                                            isCollapsed && "justify-center px-0"
                                        )}
                                    >
                                        <LogOut className="h-5 w-5 shrink-0" />
                                        {!isCollapsed && <span className="ml-3">Keluar</span>}
                                    </button>
                                </TooltipTrigger>
                                {isCollapsed && (
                                    <TooltipContent side="right" className="font-semibold">
                                        Keluar
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        </div>
                    </div>
                </TooltipProvider>
            </aside>
        </>
    );
}
