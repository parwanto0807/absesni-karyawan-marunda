'use client';

import React from 'react';
import { useSidebar } from '@/hooks/use-sidebar';
import Header from '@/components/Header';
import { cn } from '@/lib/utils';
import { SessionPayload } from '@/types/auth';
import { Home as HomeIcon, Sparkles } from 'lucide-react';
import { usePathname, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { MandatoryPasswordChange } from '@/components/MandatoryPasswordChange';

export default function LayoutContent({ children, user }: { children: React.ReactNode, user: SessionPayload | null }) {
    const { isCollapsed } = useSidebar();
    const pathname = usePathname();
    const router = useRouter();

    return (
        <div
            className={cn(
                "flex flex-col min-h-screen transition-all duration-300 ease-in-out",
                isCollapsed ? "lg:ml-20" : "lg:ml-64"
            )}
        >
            <Header user={user} />
            <main className="flex-1 p-4 md:p-8">
                {user && <MandatoryPasswordChange user={user} />}
                {children}
            </main>

            {/* Mobile Draggable Premium Home Button - Only visible when NOT on dashboard */}
            {pathname !== '/dashboard' && (
                <motion.div
                    drag
                    dragConstraints={{ left: -200, right: 0, top: -500, bottom: 0 }}
                    whileDrag={{ scale: 1.1, cursor: "grabbing" }}
                    whileTap={{ scale: 0.9 }}
                    dragMomentum={false}
                    onTap={() => router.push('/dashboard')}
                    className="md:hidden fixed bottom-6 right-6 z-[100] cursor-grab active:cursor-grabbing"
                    initial={{ y: 100, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    exit={{ y: 100, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 20 }}
                >
                    <div className="relative group block cursor-pointer">
                        {/* Animated Glow Effect */}
                        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-[1.25rem] blur opacity-40 group-hover:opacity-100 transition duration-1000 group-hover:duration-200 animate-pulse"></div>

                        {/* Main Button Body */}
                        <div className="relative flex items-center justify-center h-[52px] w-[52px] rounded-[1.25rem] bg-slate-900/90 dark:bg-white/90 text-white dark:text-slate-900 shadow-2xl backdrop-blur-xl border border-white/20 dark:border-black/10 overflow-hidden">
                            <motion.div
                                animate={{
                                    rotate: [0, 5, -5, 0],
                                    scale: [1, 1.05, 0.95, 1]
                                }}
                                transition={{
                                    duration: 4,
                                    repeat: Infinity,
                                    ease: "easeInOut"
                                }}
                            >
                                <HomeIcon size={24} className="relative z-10" />
                            </motion.div>

                            {/* Particle/Sparkle Decorations */}
                            <div className="absolute top-1 right-2 pointer-events-none opacity-50">
                                <Sparkles size={10} className="text-indigo-400 animate-bounce" />
                            </div>
                        </div>

                        {/* Floating Label (appears on hover) */}
                        <div className="absolute -top-10 right-0 bg-slate-800 text-white text-[8px] font-black uppercase tracking-widest px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl">
                            Kembali Ke Beranda
                        </div>
                    </div>
                </motion.div>
            )}
        </div>
    );
}
