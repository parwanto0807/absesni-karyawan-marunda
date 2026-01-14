'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
    AlertTriangle,
    MessageSquare,
    MapPin,
    Clock,
    ChevronRight,
    CheckCircle2,
    Loader2,
    ExternalLink,
    Send,
    Filter,
    ShieldAlert,
    History,
    UserCircle2,
    FileText,
    Download
} from 'lucide-react';
import { toast } from 'sonner';
import { getIncidentReports, addIncidentComment } from '@/actions/incident';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

export default function IncidentCenter({ adminId }: { adminId: string }) {
    const [reports, setReports] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReport, setSelectedReport] = useState<any | null>(null);
    const [reply, setReply] = useState('');
    const [replyLoading, setReplyLoading] = useState(false);
    const [filter, setFilter] = useState<'ALL' | 'PENDING' | 'RESOLVED'>('ALL');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetchReports();
    }, []);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [selectedReport?.comments]);

    const fetchReports = async () => {
        setLoading(true);
        const result = await getIncidentReports();
        if (result.success) {
            setReports(result.data || []);
            // Update selected report if it exists
            if (selectedReport) {
                const updated = result.data?.find((r: any) => r.id === selectedReport.id);
                if (updated) setSelectedReport(updated);
            }
        }
        setLoading(false);
    };

    const generatePDF = async (report: any) => {
        const doc = new jsPDF() as any;
        const pageWidth = doc.internal.pageSize.getWidth();

        // 1. Header (Logo Text Style)
        doc.setFillColor(15, 23, 42); // slate-900
        doc.rect(0, 0, pageWidth, 40, 'F');

        doc.setTextColor(255, 255, 255);
        doc.setFontSize(18);
        doc.setFont('helvetica', 'bold');
        doc.text('BADAN PENGELOLA LINGKUNGAN (BPL) MARUNDA', 20, 20);

        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text('Pusat Komando & Respon Insiden Keamanan', 20, 28);
        doc.text(`ID Laporan: ${report.id}`, pageWidth - 20, 28, { align: 'right' });

        // 2. Report Title
        doc.setTextColor(15, 23, 42);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('LAPORAN RESMI KEJADIAN / PERISTIWA', 20, 55);

        doc.setDrawColor(226, 232, 240); // slate-200
        doc.line(20, 60, pageWidth - 20, 60);

        // 3. Information Table
        const infoData = [
            ['Kategori', report.category],
            ['Status Akhir', report.status],
            ['Waktu Lapor', format(new Date(report.createdAt), 'dd MMMM yyyy, HH:mm', { locale: id }) + ' WIB'],
            ['Pelapor', `${report.user.name} (${report.user.role})`],
            ['Lokasi', report.address || 'Koordinat tercatat (lihat detail GPS)'],
            ['Koordinat', `${report.latitude}, ${report.longitude}`]
        ];

        autoTable(doc, {
            startY: 65,
            head: [['Informasi Dasar', 'Keterangan']],
            body: infoData,
            theme: 'striped',
            headStyles: { fillColor: [248, 250, 252], textColor: [100, 116, 139], fontSize: 8, fontStyle: 'bold' },
            styles: { fontSize: 10, cellPadding: 3 },
            columnStyles: { 0: { fontStyle: 'bold', cellWidth: 40 } }
        });

        // 4. Incident Description
        let finalY = (doc as any).lastAutoTable.finalY + 10;
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('NARASI KEJADIAN:', 20, finalY);

        doc.setFont('helvetica', 'normal');
        const splitDescription = doc.splitTextToSize(report.description, pageWidth - 40);
        doc.text(splitDescription, 20, finalY + 7);
        finalY += 7 + (splitDescription.length * 5) + 10;

        // 5. Evidence Photo
        if (report.evidenceImg) {
            try {
                doc.setFont('helvetica', 'bold');
                doc.text('BUKTI VISUAL:', 20, finalY);
                doc.addImage(report.evidenceImg, 'JPEG', 20, finalY + 5, 80, 60);
                finalY += 70;
            } catch (e) {
                console.error('PDF Image Error:', e);
            }
        }

        // 6. Communication Thread
        if (report.comments && report.comments.length > 0) {
            finalY += 5;
            doc.setFont('helvetica', 'bold');
            doc.text('ALUR KOMUNIKASI & INSTRUKSI:', 20, finalY);

            const commentData = report.comments.map((c: any) => [
                format(new Date(c.createdAt), 'HH:mm', { locale: id }),
                c.user.role === 'ADMIN' || c.user.role === 'PIC' ? 'ADMIN' : 'PETUGAS',
                c.content
            ]);

            autoTable(doc, {
                startY: finalY + 5,
                head: [['Waktu', 'Pihak', 'Pesan / Instruksi']],
                body: commentData,
                theme: 'grid',
                headStyles: { fillColor: [79, 70, 229] }, // indigo-600
                styles: { fontSize: 9 },
                columnStyles: { 0: { cellWidth: 20 }, 1: { cellWidth: 30, fontStyle: 'bold' } }
            });
            finalY = (doc as any).lastAutoTable.finalY + 15;
        }

        // 7. Footer / Verification
        doc.setFontSize(8);
        doc.setTextColor(150, 150, 150);
        doc.text(`Dicetak pada: ${format(new Date(), 'dd/MM/yyyy HH:mm:ss', { locale: id })}`, 20, doc.internal.pageSize.getHeight() - 10);
        doc.text('Dokumen ini dihasilkan secara otomatis oleh Marunda Integrated System.', pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

        doc.save(`Laporan_Kejadian_${report.id.substring(0, 8)}_${format(new Date(), 'yyyyMMdd')}.pdf`);
        toast.success('File PDF berhasil dibuat.');
    };

    const handleReply = async (status: string) => {
        if (!reply.trim()) {
            toast.error('Harap isi pesan atau instruksi.');
            return;
        }

        setReplyLoading(true);
        const result = await addIncidentComment(selectedReport.id, adminId, reply, status);
        if (result.success) {
            toast.success('Komentar Terkirim!');
            setReply('');
            // Optimistic update or just refetch
            fetchReports();
        } else {
            toast.error(result.message);
        }
        setReplyLoading(false);
    };

    const filteredReports = reports.filter(r => {
        if (filter === 'ALL') return true;
        if (filter === 'PENDING') return r.status === 'PENDING' || r.status === 'ON_PROGRESS';
        return r.status === filter;
    });

    if (loading && reports.length === 0) {
        return (
            <div className="flex h-[400px] items-center justify-center space-x-2 text-slate-400">
                <Loader2 className="animate-spin" />
                <span className="text-xs font-bold uppercase tracking-widest">Memuat Pusat Insiden...</span>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* List Reports */}
            <div className="lg:col-span-1 space-y-6">
                <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col h-[700px]">
                    <div className="p-6 border-b border-slate-50 dark:border-slate-800 space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Antrean Laporan</h3>
                            <button onClick={fetchReports} className="p-2 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-all">
                                <History size={16} className="text-slate-400" />
                            </button>
                        </div>
                        <div className="flex gap-2">
                            {(['ALL', 'PENDING', 'RESOLVED'] as const).map(f => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={cn(
                                        "px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all",
                                        filter === f ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200 dark:shadow-none" : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-800"
                                    )}
                                >
                                    {f === 'ALL' ? 'Semua' : f === 'PENDING' ? 'Aktif' : 'Selesai'}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {filteredReports.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 text-center p-8">
                                <ShieldAlert size={48} className="mb-2 opacity-10" />
                                <p className="text-xs font-bold uppercase tracking-widest">Antrean Kosong</p>
                            </div>
                        ) : (
                            filteredReports.map(report => (
                                <button
                                    key={report.id}
                                    onClick={() => setSelectedReport(report)}
                                    className={cn(
                                        "w-full p-4 rounded-3xl border text-left transition-all group flex items-start gap-4",
                                        selectedReport?.id === report.id
                                            ? "border-rose-500 bg-rose-50/50 dark:bg-rose-900/20"
                                            : "border-slate-100 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-slate-900"
                                    )}
                                >
                                    <div className={cn(
                                        "h-10 w-10 shrink-0 rounded-2xl flex items-center justify-center",
                                        report.status === 'PENDING' ? "bg-rose-100 text-rose-600 animate-pulse" :
                                            report.status === 'ON_PROGRESS' ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600"
                                    )}>
                                        <AlertTriangle size={20} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <span className="text-[10px] font-black text-rose-600 dark:text-rose-400 uppercase tracking-widest">{report.category}</span>
                                            <span className="text-[9px] font-bold text-slate-400">{format(new Date(report.createdAt), 'HH:mm', { locale: id })}</span>
                                        </div>
                                        <p className="text-xs font-bold text-slate-900 dark:text-white truncate">{report.description}</p>
                                        <div className="mt-2 flex items-center justify-between">
                                            <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-500 uppercase">
                                                <div className="w-4 h-4 rounded-full bg-slate-200 overflow-hidden">
                                                    {report.user.image ? <img src={report.user.image} className="w-full h-full object-cover" /> : <UserCircle2 size={16} />}
                                                </div>
                                                {report.user.name.split(' ')[0]}
                                            </div>
                                            {report.comments?.length > 0 && (
                                                <div className="flex items-center gap-1 text-[9px] font-black text-indigo-500">
                                                    <MessageSquare size={10} />
                                                    {report.comments.length}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* Content Detail & Multi-Comment Thread */}
            <div className="lg:col-span-2 space-y-6">
                {selectedReport ? (
                    <div className="bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[700px] flex flex-col">
                        {/* Header */}
                        <div className="p-8 bg-slate-900 text-white relative">
                            <div className="flex items-center justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="p-3 rounded-2xl bg-white/10 backdrop-blur-md">
                                        <AlertTriangle className="w-6 h-6 text-rose-400" />
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <h2 className="text-xl font-black uppercase tracking-tight">{selectedReport.category}</h2>
                                            <span className={cn(
                                                "px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest",
                                                selectedReport.status === 'PENDING' ? "bg-rose-500" :
                                                    selectedReport.status === 'ON_PROGRESS' ? "bg-amber-500" : "bg-emerald-500"
                                            )}>
                                                {selectedReport.status}
                                            </span>
                                        </div>
                                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{selectedReport.user.name} • {format(new Date(selectedReport.createdAt), 'dd MMMM yyyy, HH:mm', { locale: id })} WIB</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => generatePDF(selectedReport)}
                                        className="h-10 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 text-rose-400 border border-rose-400/20"
                                    >
                                        <Download size={14} />
                                        <span className="hidden sm:inline">Cetak PDF</span>
                                    </button>
                                    <button
                                        onClick={() => window.open(`https://www.google.com/maps?q=${selectedReport.latitude},${selectedReport.longitude}`, '_blank')}
                                        className="h-10 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2"
                                    >
                                        <MapPin size={14} />
                                        <span className="hidden sm:inline">Peta</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Thread & Comments */}
                        <div ref={scrollRef} className="flex-1 p-8 space-y-8 overflow-y-auto custom-scrollbar">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Keterangan Kejadian</label>
                                    <div className="p-5 rounded-3xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 text-sm font-medium leading-relaxed">
                                        {selectedReport.description}
                                    </div>
                                </div>
                                {selectedReport.evidenceImg && (
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bukti Foto</label>
                                        <div className="relative aspect-video rounded-3xl overflow-hidden border border-slate-200 dark:border-slate-800 group cursor-pointer" onClick={() => window.open(selectedReport.evidenceImg, '_blank')}>
                                            <img src={selectedReport.evidenceImg} className="w-full h-full object-cover" />
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <ExternalLink className="text-white" size={24} />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-6 pt-4 border-t border-slate-50 dark:border-slate-800">
                                <div className="flex items-center gap-2">
                                    <MessageSquare size={16} className="text-indigo-600" />
                                    <h3 className="text-[10px] font-black text-indigo-600 uppercase tracking-widest">Percakapan & Instruksi</h3>
                                </div>

                                {/* First Message from Reporter (Virtual) */}
                                <div className="flex flex-col items-start space-y-1">
                                    <div className="max-w-[80%] p-4 rounded-3xl rounded-tl-none bg-slate-100 dark:bg-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300">
                                        Laporan awal: {selectedReport.description}
                                    </div>
                                    <span className="text-[9px] font-bold text-slate-400 uppercase px-1">{selectedReport.user.name} • {format(new Date(selectedReport.createdAt), 'HH:mm', { locale: id })}</span>
                                </div>

                                {/* Iterating Comments */}
                                {selectedReport.comments?.map((comment: any) => {
                                    const isAdmin = ['ADMIN', 'PIC'].includes(comment.user.role);
                                    return (
                                        <div key={comment.id} className={cn(
                                            "flex flex-col space-y-1 animate-in slide-in-from-bottom-2 duration-300",
                                            isAdmin ? "items-end" : "items-start"
                                        )}>
                                            <div className={cn(
                                                "max-w-[80%] p-4 rounded-3xl transition-all",
                                                isAdmin
                                                    ? "rounded-tr-none bg-indigo-600 text-white shadow-lg shadow-indigo-100 dark:shadow-none"
                                                    : "rounded-tl-none bg-emerald-50 dark:bg-emerald-900/20 text-emerald-900 dark:text-emerald-300 border border-emerald-100 dark:border-emerald-800/50"
                                            )}>
                                                <p className="text-xs font-bold leading-relaxed">{comment.content}</p>
                                            </div>
                                            <span className="text-[9px] font-bold text-slate-400 uppercase px-1">
                                                {isAdmin ? '🛡️ Admin' : comment.user.name} • {format(new Date(comment.createdAt), 'HH:mm', { locale: id })}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Input */}
                        <div className="p-8 border-t border-slate-50 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900">
                            <div className="space-y-4">
                                <div className="flex gap-3">
                                    <div className="flex-1 relative">
                                        <textarea
                                            value={reply}
                                            onChange={(e) => setReply(e.target.value)}
                                            placeholder="Tulis instruksi tambahan pesan di sini..."
                                            className="w-full h-20 p-5 rounded-3xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold focus:border-indigo-500 outline-none transition-all resize-none shadow-sm"
                                        />
                                    </div>
                                    <div className="flex flex-col gap-2">
                                        <button
                                            onClick={() => handleReply('ON_PROGRESS')}
                                            disabled={replyLoading || !reply.trim()}
                                            className="h-10 px-5 rounded-2xl bg-slate-900 dark:bg-indigo-600 text-white font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-slate-800 transition-all disabled:opacity-50"
                                        >
                                            {replyLoading ? <Loader2 className="animate-spin" size={14} /> : <Send size={14} />}
                                            Balas
                                        </button>
                                        <button
                                            onClick={() => handleReply('RESOLVED')}
                                            disabled={replyLoading || !reply.trim()}
                                            className="h-10 px-5 rounded-2xl bg-emerald-600 text-white font-black text-[9px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all disabled:opacity-50"
                                        >
                                            <CheckCircle2 size={14} />
                                            Selesai
                                        </button>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {['Segera meluncur', 'Amankan lokasi', 'Harap lapor koordinator', 'Dokumentasikan kerusakan'].map(t => (
                                        <button
                                            key={t}
                                            onClick={() => setReply(t)}
                                            className="px-3 py-1.5 rounded-xl bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 text-[9px] font-bold text-slate-500 hover:text-indigo-600 hover:border-indigo-500 transition-all"
                                        >
                                            + {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="h-[700px] flex flex-col items-center justify-center bg-white dark:bg-slate-900 rounded-[2.5rem] border border-slate-200 dark:border-slate-800 text-slate-400">
                        <ShieldAlert size={64} className="opacity-10 mb-6" />
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-900 dark:text-white mb-2">Pilih Laporan</h3>
                        <p className="text-xs font-bold text-slate-400 uppercase tracking-widest max-w-[200px] text-center">Silakan pilih laporan di sisi kiri untuk melihat detail.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
