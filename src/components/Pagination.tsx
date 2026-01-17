'use client';

import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PaginationProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    totalItems: number;
    itemsPerPage: number;
    className?: string;
}

export default function Pagination({
    currentPage,
    totalPages,
    onPageChange,
    totalItems,
    itemsPerPage,
    className
}: PaginationProps) {
    if (totalPages <= 1) return null;

    const startItem = (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;

        if (totalPages <= maxVisiblePages) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            let start = Math.max(1, currentPage - 2);
            let end = Math.min(totalPages, start + maxVisiblePages - 1);

            if (end === totalPages) {
                start = Math.max(1, end - maxVisiblePages + 1);
            }

            for (let i = start; i <= end; i++) pages.push(i);
        }
        return pages;
    };

    return (
        <div className={cn("flex flex-col md:flex-row items-center justify-between gap-4 px-2 py-4", className)}>
            {/* Items Info */}
            <div className="text-[10px] md:text-xs font-medium text-slate-500 dark:text-slate-400 order-2 md:order-1 uppercase tracking-wider">
                Menampilkan <span className="font-bold text-slate-900 dark:text-white">{startItem}-{endItem}</span> dari <span className="font-bold text-slate-900 dark:text-white">{totalItems}</span> data
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center space-x-1 order-1 md:order-2">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 disabled:opacity-30 disabled:pointer-events-none transition-all"
                    title="Halaman Sebelumnya"
                >
                    <ChevronLeft size={18} />
                </button>

                <div className="hidden md:flex items-center space-x-1">
                    {getPageNumbers().map((page) => (
                        <button
                            key={page}
                            onClick={() => onPageChange(page)}
                            className={cn(
                                "min-w-[40px] h-10 rounded-xl text-xs font-bold transition-all",
                                currentPage === page
                                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none"
                                    : "text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
                            )}
                        >
                            {page}
                        </button>
                    ))}
                    {totalPages > 5 && getPageNumbers()[getPageNumbers().length - 1] < totalPages && (
                        <>
                            <span className="text-slate-400 px-1">...</span>
                            <button
                                onClick={() => onPageChange(totalPages)}
                                className="min-w-[40px] h-10 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
                            >
                                {totalPages}
                            </button>
                        </>
                    )}
                </div>

                {/* Mobile Page Indicator */}
                <div className="md:hidden flex items-center px-4 h-10 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-800 text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-300">
                    Hal {currentPage} / {totalPages}
                </div>

                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/10 disabled:opacity-30 disabled:pointer-events-none transition-all"
                    title="Halaman Selanjutnya"
                >
                    <ChevronRight size={18} />
                </button>
            </div>
        </div>
    );
}
