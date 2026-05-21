'use client';

import React, { useState, useEffect } from 'react';
import { ZoomableImage } from './ImageModal';
import { getPatrolLogImage } from '@/actions/patrol';

export function LazyPatrolImage({ logId, checkpointName }: { logId: string; checkpointName: string }) {
    const [image, setImage] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchImage = async () => {
            const result = await getPatrolLogImage(logId);
            if (isMounted && result.success && result.data) {
                setImage(result.data);
            }
            if (isMounted) {
                setIsLoading(false);
            }
        };
        fetchImage();
        return () => {
            isMounted = false;
        };
    }, [logId]);

    if (isLoading) {
        return (
            <div className="space-y-1.5 mt-4">
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Foto Bukti Lapangan</span>
                <div className="rounded-xl overflow-hidden border-2 border-white dark:border-slate-800 shadow-md max-w-sm h-32 bg-slate-100 dark:bg-slate-800 animate-pulse flex items-center justify-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Memuat foto...</span>
                </div>
            </div>
        );
    }

    if (!image) return null;

    return (
        <div className="space-y-1.5 mt-4">
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest block">Foto Bukti Lapangan</span>
            <div className="rounded-xl overflow-hidden border-2 border-white dark:border-slate-800 shadow-md max-w-sm">
                <ZoomableImage src={image} alt={`Bukti ${checkpointName}`} />
            </div>
        </div>
    );
}
