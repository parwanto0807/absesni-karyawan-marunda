/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageModalProps {
    src: string;
    alt: string;
}

export function ZoomableImage({ src, alt, className }: { src: string; alt: string; className?: string }) {
    const [isZoomed, setIsZoomed] = useState(false);
    const [imgSrc, setImgSrc] = useState(src);

    const toggleZoom = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsZoomed(!isZoomed);
    };

    return (
        <div className={cn("relative overflow-hidden flex items-center justify-center transition-all duration-300", isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in')}>
            <img
                src={imgSrc}
                alt={alt}
                className={cn(
                    "transition-transform duration-300",
                    isZoomed ? 'scale-[3] max-w-none' : 'max-w-full h-auto',
                    className
                )}
                onClick={toggleZoom}
                onError={() => setImgSrc('/no-image.png')}
            />
            {!isZoomed && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full pointer-events-none">
                    <p className="text-[8px] font-black text-white uppercase tracking-widest">Klik untuk Zoom</p>
                </div>
            )}
        </div>
    );
}

export function ImageModal({ src, alt }: ImageModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [imgSrc, setImgSrc] = useState(src);

    if (!src) return null;

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="block w-12 h-12 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 hover:ring-2 hover:ring-indigo-500 transition-all focus:outline-none"
            >
                <img
                    src={imgSrc}
                    alt={alt}
                    className="w-full h-full object-cover"
                    onError={() => setImgSrc('/no-image.png')}
                />
            </button>

            {isOpen && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-auto" 
                    onClick={() => setIsOpen(false)}
                >
                    <div className="relative w-full max-w-4xl flex flex-col items-center">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                            }}
                            className="fixed top-4 right-4 p-2 text-white hover:text-slate-300 transition-colors bg-black/40 rounded-full backdrop-blur-md z-[60]"
                        >
                            <X size={32} />
                        </button>
                        <ZoomableImage src={src} alt={alt} className="rounded-2xl shadow-2xl border border-white/10 max-h-[85vh]" />
                    </div>
                </div>
            )}
        </>
    );
}

export function ImageModalMobile({ src, alt }: ImageModalProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [imgSrc, setImgSrc] = useState(src);

    if (!src) return null;

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="block w-10 h-10 rounded-lg overflow-hidden border border-slate-200 dark:border-slate-800 hover:ring-2 hover:ring-indigo-500 transition-all shrink-0 focus:outline-none"
            >
                <img
                    src={imgSrc}
                    alt={alt}
                    className="w-full h-full object-cover"
                    onError={() => setImgSrc('/no-image.png')}
                />
            </button>

            {isOpen && (
                <div 
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 animate-in fade-in duration-200 overflow-auto" 
                    onClick={() => setIsOpen(false)}
                >
                    <div className="relative w-full flex flex-col items-center">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setIsOpen(false);
                            }}
                            className="fixed top-4 right-4 p-2 text-white/80 hover:text-white bg-black/40 rounded-full backdrop-blur-md z-[60]"
                        >
                            <X size={24} />
                        </button>
                        <ZoomableImage src={src} alt={alt} className="rounded-xl shadow-2xl max-h-[80vh]" />
                    </div>
                </div>
            )}
        </>
    );
}
