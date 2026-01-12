'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';

interface ImageModalProps {
    src: string;
    alt: string;
}

export function ImageModal({ src, alt }: ImageModalProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (!src) return null;

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="block w-12 h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 hover:ring-2 hover:ring-indigo-500 transition-all focus:outline-none"
            >
                <img src={src} alt={alt} className="w-full h-full object-cover" />
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setIsOpen(false)}>
                    <div className="relative max-w-4xl w-full max-h-[90vh] flex flex-col items-center">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                            }}
                            className="absolute -top-12 right-0 p-2 text-white hover:text-slate-300 transition-colors"
                        >
                            <X size={32} />
                        </button>
                        <img
                            src={src}
                            alt={alt}
                            className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain border border-white/10"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
        </>
    );
}

export function ImageModalMobile({ src, alt }: ImageModalProps) {
    const [isOpen, setIsOpen] = useState(false);

    if (!src) return null;

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="block w-10 h-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 hover:ring-2 hover:ring-indigo-500 transition-all shrink-0 focus:outline-none"
            >
                <img src={src} alt={alt} className="w-full h-full object-cover" />
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200" onClick={() => setIsOpen(false)}>
                    <div className="relative w-full max-h-screen flex flex-col items-center">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                            }}
                            className="absolute top-4 right-4 p-2 text-white/80 hover:text-white bg-black/20 rounded-full backdrop-blur-md"
                        >
                            <X size={24} />
                        </button>
                        <img
                            src={src}
                            alt={alt}
                            className="max-w-full max-h-[80vh] rounded-xl shadow-2xl object-contain"
                            onClick={(e) => e.stopPropagation()}
                        />
                    </div>
                </div>
            )}
        </>
    );
}
