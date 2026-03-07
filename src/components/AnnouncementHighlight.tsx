'use client';

import React, { useState } from 'react';
import { Download, Megaphone, Clock, ChevronRight, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Announcement {
    id: string;
    documentNumber: string;
    date: string | Date;
    to: string;
    subject: string;
    content: string;
    signatoryName: string;
    signatoryRole: string;
}

export default function AnnouncementHighlight({ announcement }: { announcement: Announcement }) {
    const [isExporting, setIsExporting] = useState(false);

    const generatePDF = async () => {
        setIsExporting(true);
        try {
            const { jsPDF } = await import('jspdf');

            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const primaryColor = [30, 41, 59];
            const accentColor = [79, 70, 229];
            const textColor = [51, 65, 85];
            const lightColor = [241, 245, 249];

            doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.rect(0, 0, 210, 35, 'F');

            doc.setFontSize(16);
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.text('CLUSTER TAMAN MARUNDA', 40, 15);

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text('Perum Metland Cibitung • Bekasi, Jawa Barat', 40, 21);
            doc.setTextColor(180, 180, 200);
            doc.text('Email: info@taman-marunda.com | Telp: +62 852-9296-2194', 40, 26);

            doc.setFillColor(lightColor[0], lightColor[1], lightColor[2]);
            doc.roundedRect(140, 8, 55, 20, 4, 4, 'F');
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text('DOKUMEN PENGUMUMAN', 145, 14);
            doc.setFont('helvetica', 'normal');
            doc.text(`NO: ${announcement.documentNumber}`, 145, 19);
            doc.text(`TGL: ${format(new Date(announcement.date), 'dd MMM yyyy')}`, 145, 24);

            let currentY = 50;
            doc.setFontSize(10);
            doc.setTextColor(textColor[0], textColor[1], textColor[2]);
            doc.text('Bekasi,', 20, currentY);
            doc.text(format(new Date(announcement.date), 'dd MMMM yyyy', { locale: id }), 35, currentY);
            currentY += 10;
            doc.text('Nomor', 20, currentY);
            doc.text(':', 40, currentY);
            doc.text(announcement.documentNumber, 45, currentY);
            currentY += 6;
            doc.text('Perihal', 20, currentY);
            doc.text(':', 40, currentY);
            doc.setFont('helvetica', 'bold');
            doc.text(announcement.subject, 45, currentY);
            currentY += 10;
            doc.setFont('helvetica', 'normal');
            doc.text('Kepada Yth.', 20, currentY);
            currentY += 6;
            doc.setFont('helvetica', 'bold');
            doc.text(announcement.to, 20, currentY);
            currentY += 6;
            doc.setFont('helvetica', 'normal');
            doc.text('di tempat', 20, currentY);
            currentY += 15;
            doc.text('Dengan hormat,', 20, currentY);
            currentY += 10;

            const paragraphs = announcement.content.split('\n');
            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');

            for (const p of paragraphs) {
                if (p.trim() === '') {
                    currentY += 3;
                    continue;
                }
                const lines = doc.splitTextToSize(p, 170);
                doc.text(lines, 20, currentY);
                currentY += (lines.length * 6);
                if (currentY > 260) {
                    doc.addPage();
                    currentY = 20;
                }
            }

            currentY += 15;
            doc.text('Hormat kami,', 20, currentY);
            currentY += 20;
            doc.setFont('helvetica', 'bold');
            doc.text(announcement.signatoryName, 20, currentY);
            currentY += 5;
            doc.setFont('helvetica', 'normal');
            doc.text(announcement.signatoryRole, 20, currentY);

            doc.save(`Pengumuman_${announcement.documentNumber.replace(/\//g, '-')}.pdf`);
            toast.success('Pengumuman berhasil diunduh');
        } catch (error) {
            console.error('PDF Export Error:', error);
            toast.error('Gagal membuat PDF');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="mb-6 group relative">
            {/* Ambient Glow Background */}
            <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-purple-500/20 rounded-[1.6rem] blur-xl opacity-0 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>

            <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-[1.5rem] border border-indigo-100 dark:border-indigo-900/50 shadow-sm overflow-hidden flex flex-col sm:flex-row items-stretch sm:items-center relative transition-all duration-300 group-hover:shadow-indigo-500/10 group-hover:shadow-xl group-hover:-translate-y-0.5">
                {/* Status Bar */}
                <div className="w-1.5 self-stretch bg-indigo-600 dark:bg-indigo-500 relative overflow-hidden">
                    <div className="absolute inset-0 bg-white/20 animate-pulse" />
                </div>

                <div className="flex-1 p-4 md:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-indigo-50/30 to-transparent dark:from-indigo-900/10 dark:to-transparent">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shrink-0 shadow-lg shadow-indigo-200 dark:shadow-indigo-900/40 transition-transform duration-500 group-hover:rotate-12">
                            <Megaphone size={20} />
                        </div>

                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1.5">
                                <div className="flex items-center gap-1.5 bg-indigo-600 text-white px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">
                                    <FileText size={10} />
                                    <span>PENGUMUMAN PENTING</span>
                                </div>
                                <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter flex items-center gap-1 ml-1">
                                    <Clock size={10} />
                                    {format(new Date(announcement.date), 'dd MMMM yyyy', { locale: id })}
                                </span>
                            </div>
                            <h3 className="text-base md:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors leading-tight">
                                {announcement.subject}
                            </h3>
                            <p className="text-[10px] md:text-xs font-semibold text-slate-500 dark:text-slate-400 line-clamp-1 italic mt-1 flex items-center gap-1.5">
                                <span className="w-1 h-1 rounded-full bg-indigo-400" />
                                {announcement.to}
                            </p>
                        </div>
                    </div>

                    <div className="w-full md:w-auto flex items-center justify-end md:pl-6 border-t md:border-t-0 border-indigo-50 dark:border-indigo-900/30 pt-4 md:pt-0">
                        <Button
                            onClick={generatePDF}
                            disabled={isExporting}
                            className="w-full sm:w-auto px-6 h-12 rounded-2xl bg-slate-900 hover:bg-indigo-600 dark:bg-indigo-600 dark:hover:bg-indigo-500 text-white font-black uppercase tracking-widest text-[10px] gap-3 shadow-lg shadow-slate-200 dark:shadow-none transition-all duration-300 group/btn hover:scale-105 active:scale-95"
                        >
                            {isExporting ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    <span>UNDUH BERKAS</span>
                                    <Download size={16} className="group-hover/btn:translate-y-0.5 transition-transform" />
                                </>
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
