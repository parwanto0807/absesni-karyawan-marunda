"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, X, ChevronRight, Clock, Navigation } from "lucide-react";
import * as Dialog from "@radix-ui/react-dialog";

interface InfoSlide {
    id: number | string;
    type: "prayer" | "news";
    title: string;
    content: string;
    image: string;
    sourceUrl?: string;
    details?: React.ReactNode;
}

interface InfoCarouselProps {
    data: {
        prayer: {
            subuh: string;
            dzuhur: string;
            ashar: string;
            maghrib: string;
            isya: string;
            image: string;
            sourceUrl?: string;
        } | null;
        news: { id: string | number; text: string; image: string; sourceUrl?: string; title?: string }[];
    };
}

const DEFAULT_IMAGE = "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&q=80&w=800";

const InfoCarousel: React.FC<InfoCarouselProps> = ({ data }) => {
    const [index, setIndex] = useState(0);
    const [open, setOpen] = useState(false);
    const [imgErrors, setImgErrors] = useState<Record<string, boolean>>({});

    const handleImgError = (id: string | number) => {
        setImgErrors(prev => ({ ...prev, [id]: true }));
    };

    const slides: InfoSlide[] = [
        ...(data.prayer
            ? [
                {
                    id: "prayer",
                    type: "prayer" as const,
                    title: "Jadwal Sholat",
                    content: `Maghrib ${data.prayer.maghrib} · Isya ${data.prayer.isya}`,
                    image: imgErrors["prayer"] ? DEFAULT_IMAGE : data.prayer.image,
                    sourceUrl: data.prayer.sourceUrl,
                    details: (
                        <div className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                {[
                                    { label: "Subuh", time: data.prayer.subuh, icon: Clock },
                                    { label: "Dzuhur", time: data.prayer.dzuhur, icon: Clock },
                                    { label: "Ashar", time: data.prayer.ashar, icon: Clock },
                                    { label: "Maghrib", time: data.prayer.maghrib, icon: Clock },
                                    { label: "Isya", time: data.prayer.isya, icon: Clock },
                                ].map((p, i) => (
                                    <div key={i} className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl flex items-center justify-between border border-slate-100 dark:border-slate-800">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{p.label}</span>
                                            <span className="text-lg font-black text-indigo-600 dark:text-indigo-400">{p.time}</span>
                                        </div>
                                        <p.icon size={20} className="text-slate-300" />
                                    </div>
                                ))}
                            </div>
                            <div className="bg-indigo-50 dark:bg-indigo-500/10 p-5 rounded-[2rem] border border-indigo-100 dark:border-indigo-500/20">
                                <p className="text-xs font-bold text-indigo-700 dark:text-indigo-300 leading-relaxed italic text-center">
                                    &quot;Dirikanlah shalat dari sesudah matahari tergelincir sampai gelap malam dan (dirikanlah pula shalat) subuh.&quot;
                                </p>
                            </div>
                        </div>
                    ),
                },
            ]
            : []),
        ...data.news.map((item) => ({
            id: item.id,
            type: "news" as const,
            title: item.title || "Update Bekasi",
            content: item.text,
            image: imgErrors[item.id] ? DEFAULT_IMAGE : item.image,
            sourceUrl: item.sourceUrl,
            details: (
                <div className="space-y-6">
                    <div className="relative h-48 rounded-[2.5rem] overflow-hidden border-2 border-slate-100 dark:border-slate-800 shadow-xl">
                        <img
                            src={imgErrors[item.id] ? DEFAULT_IMAGE : item.image}
                            alt="News Illustration"
                            className="w-full h-full object-cover"
                            onError={() => handleImgError(item.id)}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-transparent" />
                        <div className="absolute bottom-6 left-6 right-6">
                            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md border border-white/30 mb-2">
                                <Navigation size={12} className="text-white" />
                                <span className="text-[10px] font-black text-white uppercase tracking-widest">Informasi Terkini</span>
                            </div>
                            <h3 className="text-xl font-black text-white leading-tight uppercase tracking-tighter">
                                {item.title || "Berita Kota Bekasi Hari Ini"}
                            </h3>
                        </div>
                    </div>
                    <div className="bg-slate-50 dark:bg-slate-800/50 p-6 rounded-[2rem] border border-slate-100 dark:border-slate-800">
                        <p className="text-sm font-bold text-slate-600 dark:text-slate-300 leading-relaxed">
                            {item.text}
                        </p>
                    </div>
                </div>
            )
        })),
    ];

    useEffect(() => {
        if (open) return;
        const timer = setInterval(() => {
            setIndex((prev) => (prev + 1) % slides.length);
        }, 6000);
        return () => clearInterval(timer);
    }, [slides.length, open]);

    if (slides.length === 0) return null;

    const currentSlide = slides[index];

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <div className="w-[calc(100%+2rem)] -mx-4 md:mx-0 md:w-full px-4 mb-6">
                <Dialog.Trigger asChild>
                    <motion.div
                        whileTap={{ scale: 0.98 }}
                        className="group relative h-[70px] rounded-2xl overflow-hidden cursor-pointer shadow-lg shadow-indigo-100 dark:shadow-none border border-white/50 dark:border-slate-800/50"
                    >
                        {/* Slide Images Background */}
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, scale: 1.1 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.8 }}
                                className="absolute inset-0"
                            >
                                <img
                                    src={currentSlide.image}
                                    alt={currentSlide.title}
                                    className="w-full h-full object-cover grayscale-[0.3] brightness-[0.7] group-hover:scale-110 transition-transform duration-1000"
                                    onError={() => handleImgError(currentSlide.id)}
                                />
                                <div className="absolute inset-0 bg-gradient-to-r from-slate-900/90 via-slate-900/40 to-transparent" />
                            </motion.div>
                        </AnimatePresence>

                        {/* Content Overlay */}
                        <div className="absolute inset-0 flex items-center px-5">
                            <div className="flex items-center space-x-4 w-full">
                                <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shrink-0">
                                    <Bell size={18} className="text-white" />
                                </div>
                                <div className="flex flex-col min-w-0 flex-1">
                                    <AnimatePresence mode="wait">
                                        <motion.div
                                            key={index}
                                            initial={{ opacity: 0, x: 10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            exit={{ opacity: 0, x: -10 }}
                                            transition={{ duration: 0.4 }}
                                        >
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 leading-none mb-1.5 block">
                                                {currentSlide.title}
                                            </span>
                                            <p className="text-xs font-black text-white truncate uppercase tracking-tight">
                                                {currentSlide.content}
                                            </p>
                                        </motion.div>
                                    </AnimatePresence>
                                </div>
                                <div className="shrink-0 bg-white/10 p-2 rounded-full backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                                    <ChevronRight size={14} className="text-white" />
                                </div>
                            </div>
                        </div>

                        {/* Progress Bar Container */}
                        <div className="absolute bottom-0 left-0 w-full h-[3px] bg-white/10">
                            <motion.div
                                key={index}
                                initial={{ width: 0 }}
                                animate={{ width: "100%" }}
                                transition={{ duration: 6, ease: "linear" }}
                                className="h-full bg-indigo-500"
                            />
                        </div>
                    </motion.div>
                </Dialog.Trigger>
            </div>

            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-[100] transition-all" />
                <Dialog.Content className="fixed top-[50%] left-[50%] translate-x-[-50%] translate-y-[-50%] w-[90vw] max-w-md bg-white dark:bg-slate-900 rounded-[2.5rem] shadow-2xl z-[101] focus:outline-none overflow-hidden flex flex-col max-h-[85vh]">
                    {/* Header */}
                    <div className="relative p-8 pb-4">
                        <Dialog.Close className="absolute top-6 right-6 w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 hover:text-rose-500 transition-colors">
                            <X size={20} />
                        </Dialog.Close>
                        <div className="flex flex-col">
                            <Dialog.Title className="text-xs font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-[0.3em] mb-2">
                                {currentSlide.title}
                            </Dialog.Title>
                            <Dialog.Description className="text-[10px] font-black text-slate-400 italic uppercase">
                                Detail Informasi Wilayah Marunda-Bekasi
                            </Dialog.Description>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto custom-scrollbar p-8 pt-2">
                        {currentSlide.details}
                    </div>

                    <div className="p-8 pt-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 space-y-3">
                        {currentSlide.sourceUrl && (
                            <a
                                href={currentSlide.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="w-full h-12 border-2 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center space-x-2 active:scale-95 transition-all hover:bg-slate-100 dark:hover:bg-slate-800"
                            >
                                <span>Lihat Sumber Resmi</span>
                                <ChevronRight size={14} />
                            </a>
                        )}
                        <button
                            onClick={() => setOpen(false)}
                            className="w-full h-14 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-indigo-200 dark:shadow-none transition-all active:scale-95"
                        >
                            Tutup Informasi
                        </button>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default InfoCarousel;
