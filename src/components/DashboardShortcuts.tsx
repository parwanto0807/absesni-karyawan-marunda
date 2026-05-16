'use client';

import React from 'react';
import Link from 'next/link';
import { 
    UserCheck, 
    Calendar, 
    Clock, 
    FileText, 
    ShieldCheck,
    AlertTriangle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import IncidentReportDialog from './IncidentReportDialog';

interface ShortcutItem {
    icon: any;
    label: string;
    color: string;
    href?: string;
    shadow: string;
    roles?: string[];
    disabled?: boolean;
    isDialog?: boolean;
}

interface DashboardShortcutsProps {
    role: string;
    isOnDuty: boolean;
    userId: string;
    isPowerful: boolean;
    isFieldRole: boolean;
}

export default function DashboardShortcuts({ role, isOnDuty, userId, isPowerful, isFieldRole }: DashboardShortcutsProps) {
    const shortcuts: ShortcutItem[] = [
        { icon: UserCheck, label: 'Absen', color: 'from-blue-500 to-blue-600', href: '/attendance', shadow: 'shadow-blue-200' },
        { icon: Calendar, label: 'Izin', color: 'from-orange-500 to-orange-600', href: '/permits', shadow: 'shadow-orange-200' },
        { icon: Clock, label: 'Jadwal', color: 'from-indigo-500 to-indigo-600', href: '/schedules', shadow: 'shadow-indigo-200' },
        { icon: FileText, label: 'History', color: 'from-emerald-500 to-emerald-600', href: '/history', shadow: 'shadow-emerald-200' },
        ...(role === 'SECURITY' ? [
            { 
                icon: ShieldCheck, 
                label: 'Patroli', 
                color: isOnDuty ? 'from-indigo-500 to-indigo-600' : 'from-slate-400 to-slate-500', 
                href: '/patrol', 
                shadow: isOnDuty ? 'shadow-indigo-200' : 'shadow-slate-200',
                disabled: !isOnDuty
            }
        ] : []),
        ...((isFieldRole || isPowerful) ? [
            {
                icon: AlertTriangle,
                label: 'Lapor',
                color: 'from-rose-500 to-rose-600',
                shadow: 'shadow-rose-200',
                isDialog: true,
                disabled: isFieldRole && !isOnDuty
            }
        ] : [])
    ];

    const handleShortcutClick = (e: React.MouseEvent, item: ShortcutItem) => {
        if (item.disabled) {
            e.preventDefault();
            toast.error('Silahkan Absen Masuk terlebih dahulu');
        }
    };

    return (
        <div className="grid grid-cols-3 gap-y-8 gap-x-4 md:hidden px-2 py-4">
            {shortcuts.map((item, i) => {
                const content = (
                    <div className={cn(
                        "flex flex-col items-center space-y-3 group transition-all duration-200",
                        item.disabled && "opacity-50 grayscale"
                    )}>
                        <div className={cn(
                            "w-14 h-14 rounded-[1.25rem] flex items-center justify-center text-white bg-gradient-to-br shadow-lg transition-all active:scale-95",
                            !item.disabled && "group-hover:translate-y-[-4px] group-hover:shadow-xl",
                            item.color,
                            item.shadow,
                            "dark:shadow-none"
                        )}>
                            <item.icon size={26} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.1em] text-slate-500 group-hover:text-indigo-600 transition-colors text-center">
                            {item.label}
                        </span>
                    </div>
                );

                if (item.isDialog) {
                    return (
                        <div key={i} className="flex flex-col items-center">
                            <IncidentReportDialog 
                                userId={userId} 
                                variant="shortcut" 
                                disabled={item.disabled} 
                                customTrigger={content}
                            />
                        </div>
                    );
                }

                return (
                    <Link 
                        key={i} 
                        href={item.disabled ? '#' : (item.href || '#')} 
                        onClick={(e) => handleShortcutClick(e, item)}
                        className="flex flex-col items-center"
                    >
                        {content}
                    </Link>
                );
            })}
        </div>
    );
}
