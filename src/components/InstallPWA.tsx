'use client';

import React, { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BeforeInstallPromptEvent extends Event {
    readonly platforms: string[];
    readonly userChoice: Promise<{
        outcome: 'accepted' | 'dismissed';
        platform: string;
    }>;
    prompt(): Promise<void>;
}

export default function InstallPWA() {
    const [supportsPWA, setSupportsPWA] = useState(false);
    const [promptInstall, setPromptInstall] = useState<BeforeInstallPromptEvent | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const handler = (e: Event) => {
            // Prevent the mini-infobar from appearing on mobile
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setPromptInstall(e as BeforeInstallPromptEvent);
            setSupportsPWA(true);
            setIsVisible(true);
        };

        window.addEventListener('beforeinstallprompt', handler as EventListener);

        // Force show in development for UI testing
        if (process.env.NODE_ENV === 'development') {
            setIsVisible(true);
            setSupportsPWA(true);
        }

        return () => window.removeEventListener('beforeinstallprompt', handler as EventListener);
    }, []);

    const handleInstallClick = (e: React.MouseEvent) => {
        e.preventDefault();
        if (!promptInstall) {
            // Testing purpose in dev
            if (process.env.NODE_ENV === 'development') {
                alert("Ini adalah simulasi install di mode Development.\nDi Production, dialog install browser akan muncul.");
                return;
            }
            return;
        }
        promptInstall.prompt();
    };

    if ((!supportsPWA && process.env.NODE_ENV !== 'development') || !isVisible) {
        return null;
    }

    return (
        <div className="fixed bottom-20 left-4 right-4 z-50 md:hidden animate-in slide-in-from-bottom-5 duration-700">
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 p-0.5 shadow-2xl shadow-indigo-500/30">
                {/* Glowing Effect Background */}
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 opacity-70 animate-pulse" />

                <div className="relative flex items-center justify-between gap-3 bg-slate-900/90 backdrop-blur-sm p-4 rounded-[14px]">
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-500/20 animate-bounce">
                            <Download className="h-5 w-5 text-white" />
                        </div>
                        <div className="space-y-0.5">
                            <h3 className="text-sm font-black text-white leading-none">
                                Install Aplikasi
                            </h3>
                            <p className="text-[10px] font-medium text-slate-300 leading-tight">
                                Akses lebih cepat & notifikasi
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleInstallClick}
                        className="shrink-0 rounded-lg bg-white px-3 py-2 text-xs font-black text-indigo-700 hover:bg-slate-50 active:scale-95 transition-all shadow-lg"
                    >
                        INSTALL
                    </button>

                    <button
                        onClick={() => setIsVisible(false)}
                        className="absolute -top-1 -right-1 p-1.5 bg-slate-800 rounded-full text-slate-400 hover:text-white"
                    >
                        <X size={10} />
                    </button>
                </div>
            </div>
        </div>
    );
}
