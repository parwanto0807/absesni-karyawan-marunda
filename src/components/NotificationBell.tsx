'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, Check, ExternalLink } from 'lucide-react';
import { getUserNotifications, markAsRead, markAllAsRead, getUnreadCount } from '@/actions/notifications';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import { TIMEZONE } from '@/lib/date-utils';

interface Notification {
    id: string;
    title: string;
    message: string;
    type: string;
    link?: string | null;
    isRead: boolean;
    createdAt: Date;
}

export default function NotificationBell({ userId }: { userId: string }) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const fetchUnreadCount = async () => {
        const count = await getUnreadCount(userId);
        setUnreadCount(count);
    };

    const fetchDetails = async () => {
        setLoading(true);
        const data = await getUserNotifications(userId);
        const count = await getUnreadCount(userId);
        setNotifications(data);
        setUnreadCount(count);
        setLoading(false);
    };

    useEffect(() => {
        fetchUnreadCount();
        // Poll every 60 seconds for count
        const interval = setInterval(fetchUnreadCount, 60000);

        // Refresh when window gains focus
        const onFocus = () => fetchUnreadCount();
        window.addEventListener('focus', onFocus);

        return () => {
            clearInterval(interval);
            window.removeEventListener('focus', onFocus);
        };
    }, [userId]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleMarkAsRead = async (id: string, link?: string | null) => {
        await markAsRead(id);
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
        setUnreadCount(prev => Math.max(0, prev - 1));
        if (link) setIsOpen(false); // Close if redirecting
    };

    const handleMarkAllRead = async () => {
        await markAllAsRead(userId);
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        setUnreadCount(0);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => {
                    if (!isOpen) fetchDetails();
                    setIsOpen(!isOpen);
                }}
                className="relative p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
                <Bell size={20} className="text-slate-600 dark:text-slate-300" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-rose-500 text-[10px] font-bold text-white flex items-center justify-center border-2 border-white dark:border-slate-950">
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                )}
            </button>

            {isOpen && (
                <div className="fixed left-1/2 top-20 z-50 w-[90vw] max-w-sm -translate-x-1/2 rounded-xl border border-slate-200 bg-white shadow-xl dark:border-slate-800 dark:bg-slate-900 lg:absolute lg:right-0 lg:top-full lg:mt-2 lg:w-96 lg:translate-x-0 lg:left-auto overflow-hidden animate-in fade-in zoom-in-95 duration-200 origin-top-right">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50 backdrop-blur">
                        <h3 className="font-bold text-sm text-slate-800 dark:text-white">Notifikasi</h3>
                        {unreadCount > 0 && (
                            <button
                                onClick={handleMarkAllRead}
                                className="text-[10px] font-medium text-indigo-600 dark:text-indigo-400 hover:underline flex items-center space-x-1"
                            >
                                <Check size={12} />
                                <span>Tandai semua dibaca</span>
                            </button>
                        )}
                    </div>

                    <div className="max-h-[60vh] overflow-y-auto">
                        {loading ? (
                            <div className="p-8 text-center text-xs text-slate-400">Loading...</div>
                        ) : notifications.length === 0 ? (
                            <div className="p-8 text-center flex flex-col items-center justify-center space-y-2 text-slate-400">
                                <Bell size={24} className="opacity-20" />
                                <span className="text-xs">Belum ada notifikasi</span>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                {notifications.map((notif) => (
                                    <div
                                        key={notif.id}
                                        className={cn(
                                            "p-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50 flex space-x-3",
                                            !notif.isRead ? "bg-indigo-50/30 dark:bg-indigo-900/10" : ""
                                        )}
                                    >
                                        <div className={cn(
                                            "mt-1 w-2 h-2 rounded-full shrink-0",
                                            !notif.isRead ? "bg-indigo-500" : "bg-transparent"
                                        )} />

                                        <div className="flex-1 space-y-1">
                                            <div className="flex items-start justify-between">
                                                <p className={cn("text-xs font-semibold", !notif.isRead ? "text-slate-900 dark:text-white" : "text-slate-600 dark:text-slate-400")}>
                                                    {notif.title}
                                                </p>
                                                <span className="text-[10px] text-slate-400 whitespace-nowrap ml-2">
                                                    {new Date(notif.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', timeZone: TIMEZONE })}
                                                </span>
                                            </div>
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                                                {notif.message}
                                            </p>

                                            <div className="flex items-center gap-2 pt-1">
                                                {!notif.isRead && (
                                                    <button
                                                        onClick={() => handleMarkAsRead(notif.id)}
                                                        className="text-[10px] text-indigo-600 dark:text-indigo-400 hover:underline"
                                                    >
                                                        Tandai dibaca
                                                    </button>
                                                )}
                                                {notif.link && (
                                                    <Link
                                                        href={notif.link}
                                                        onClick={() => handleMarkAsRead(notif.id, notif.link)}
                                                        className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 flex items-center space-x-1"
                                                    >
                                                        <span>Lihat Detail</span>
                                                        <ExternalLink size={10} />
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
