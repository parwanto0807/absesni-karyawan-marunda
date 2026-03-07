'use client';

import React, { useState } from 'react';
import { Download, FileSignature, Clock, Trash2, Edit, Plus, History, Search, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import {
    getAnnouncements,
    createAnnouncement,
    updateAnnouncement,
    deleteAnnouncement,
    togglePublishAnnouncement
} from '@/actions/announcement';
import { cn } from '@/lib/utils';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { Globe, GlobeLock, Megaphone } from 'lucide-react';

interface Announcement {
    id: string;
    documentNumber: string;
    date: string | Date; // Depending on serialization
    to: string;
    subject: string;
    content: string;
    signatoryName: string;
    signatoryRole: string;
    isPublished: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}

export default function AnnouncementClient() {
    const [isExporting, setIsExporting] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showForm, setShowForm] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [deleteId, setDeleteId] = useState<string | null>(null);

    // Form State
    const [documentNumber, setDocumentNumber] = useState(`HR/${format(new Date(), 'yyyy/MM')}/001`);
    const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
    const [to, setTo] = useState('Seluruh Petugas Keamanan');
    const [subject, setSubject] = useState('');
    const [content, setContent] = useState('');
    const [signatoryName, setSignatoryName] = useState('Parwanto');
    const [signatoryRole, setSignatoryRole] = useState('Chief Keamanan');
    const [isPublished, setIsPublished] = useState(false);

    React.useEffect(() => {
        fetchAnnouncements();
    }, []);

    const fetchAnnouncements = async () => {
        setIsLoading(true);
        const res = await getAnnouncements();
        if (res.success) {
            setAnnouncements(res.data || []);
        }
        setIsLoading(false);
    };

    const resetForm = () => {
        setDocumentNumber(`HR/${format(new Date(), 'yyyy/MM')}/001`);
        setDate(format(new Date(), 'yyyy-MM-dd'));
        setTo('Seluruh Petugas Keamanan');
        setSubject('');
        setContent('');
        setSignatoryName('Parwanto');
        setSignatoryRole('Chief Keamanan');
        setIsPublished(false);
        setEditingId(null);
    };

    const handleEdit = (ann: Announcement) => {
        setDocumentNumber(ann.documentNumber);
        setDate(format(new Date(ann.date), 'yyyy-MM-dd'));
        setTo(ann.to);
        setSubject(ann.subject);
        setContent(ann.content);
        setSignatoryName(ann.signatoryName);
        setSignatoryRole(ann.signatoryRole);
        setIsPublished(ann.isPublished);
        setEditingId(ann.id);
        setShowForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleDelete = async () => {
        if (!deleteId) return;
        const res = await deleteAnnouncement(deleteId);
        if (res.success) {
            toast.success('Pengumuman dihapus');
            fetchAnnouncements();
            if (editingId === deleteId) resetForm();
        } else {
            toast.error(res.message);
        }
        setDeleteId(null);
    };

    const handleSave = async (printAfter = false) => {
        if (!subject || !content) {
            toast.error("Perihal dan Isi Pengumuman harus diisi.");
            return;
        }

        setIsLoading(true);
        const data = {
            documentNumber,
            date: new Date(date),
            to,
            subject,
            content,
            signatoryName,
            signatoryRole,
            isPublished
        };

        let res;
        if (editingId) {
            res = await updateAnnouncement(editingId, data);
        } else {
            res = await createAnnouncement(data);
        }

        if (res.success) {
            toast.success(editingId ? 'Data diperbarui' : 'Data disimpan');
            fetchAnnouncements();
            if (printAfter) {
                // Determine if we need to pass data to generatePDF
                // If it was just saved/updated, we might want the latest data
                generatePDF();
            }
            setShowForm(false);
            setEditingId(null);
            resetForm();
        }
        else {
            toast.error(res.message || 'Gagal menyimpan data');
        }
        setIsLoading(false);
    };

    const handleTogglePublish = async (ann: Announcement) => {
        const res = await togglePublishAnnouncement(ann.id, !ann.isPublished);
        if (res.success) {
            toast.success(res.message);
            fetchAnnouncements();
        } else {
            toast.error(res.message);
        }
    };

    const generatePDF = async (ann?: Announcement) => {
        const activeSubject = ann ? ann.subject : subject;
        const activeContent = ann ? ann.content : content;
        const activeDocNum = ann ? ann.documentNumber : documentNumber;
        const activeDate = ann ? ann.date : date;
        const activeTo = ann ? ann.to : to;
        const activeSigName = ann ? ann.signatoryName : signatoryName;
        const activeSigRole = ann ? ann.signatoryRole : signatoryRole;

        if (!activeSubject || !activeContent) {
            toast.error("Perihal dan Isi Pengumuman harus diisi.");
            return;
        }

        setIsExporting(true);
        try {
            const { jsPDF } = await import('jspdf');

            // Format A4
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const primaryColor = [30, 41, 59]; // Slate-800
            const accentColor = [79, 70, 229]; // Indigo-600
            const textColor = [51, 65, 85];    // Slate-700
            const lightColor = [241, 245, 249]; // Slate-100

            // Header Background
            doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.rect(0, 0, 210, 35, 'F');

            // Official Logo
            const logoX = 15;
            const logoY = 7;
            const logoSize = 18;
            const radius = 6;

            try {
                const img = new Image();
                img.src = '/logo_marunda.png';
                await new Promise((resolve) => {
                    img.onload = resolve;
                    img.onerror = resolve;
                });

                if (img.complete && img.naturalWidth > 0) {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.beginPath();
                        const canvasRadius = (radius / logoSize) * canvas.width;
                        ctx.roundRect(0, 0, canvas.width, canvas.height, canvasRadius);
                        ctx.clip();
                        ctx.drawImage(img, 0, 0);
                        doc.addImage(canvas.toDataURL('image/png'), 'PNG', logoX, logoY, logoSize, logoSize);
                    } else {
                        doc.addImage('/logo_marunda.png', 'PNG', logoX, logoY, logoSize, logoSize);
                    }
                }
            } catch (e) {
                console.error('Logo logic failed:', e);
                // Simple Fallback icon
                doc.setFillColor(accentColor[0], accentColor[1], accentColor[2]);
                doc.roundedRect(logoX, logoY, logoSize, logoSize, 2, 2, 'F');
            }

            // Company Name
            doc.setFontSize(16);
            doc.setTextColor(255, 255, 255);
            doc.setFont('helvetica', 'bold');
            doc.text('CLUSTER TAMAN MARUNDA', 40, 15);

            doc.setFontSize(9);
            doc.setFont('helvetica', 'normal');
            doc.text('Perum Metland Cibitung • Bekasi, Jawa Barat', 40, 21);
            doc.setTextColor(180, 180, 200);
            doc.text('Email: info@taman-marunda.com | Telp: +62 852-9296-2194', 40, 26);

            // Document Box
            doc.setFillColor(lightColor[0], lightColor[1], lightColor[2]);
            doc.roundedRect(140, 8, 55, 20, 4, 4, 'F');
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text('DOKUMEN PENGUMUMAN', 145, 14);
            doc.setFont('helvetica', 'normal');
            doc.text(`NO: ${activeDocNum}`, 145, 19);
            doc.text(`TGL: ${format(new Date(activeDate), 'dd MMM yyyy')}`, 145, 24);

            let currentY = 50;

            // Metadata (To, Date, Subject)
            doc.setFontSize(10);
            doc.setTextColor(textColor[0], textColor[1], textColor[2]);

            doc.setFont('helvetica', 'normal');
            doc.text('Bekasi,', 20, currentY);
            doc.text(format(new Date(activeDate), 'dd MMMM yyyy', { locale: id }), 35, currentY);

            currentY += 10;
            doc.text('Nomor', 20, currentY);
            doc.text(':', 40, currentY);
            doc.text(activeDocNum, 45, currentY);

            currentY += 6;
            doc.text('Perihal', 20, currentY);
            doc.text(':', 40, currentY);
            doc.setFont('helvetica', 'bold');
            doc.text(activeSubject, 45, currentY);

            currentY += 10;
            doc.setFont('helvetica', 'normal');
            doc.text('Kepada Yth.', 20, currentY);
            currentY += 6;
            doc.setFont('helvetica', 'bold');
            doc.text(activeTo, 20, currentY);
            currentY += 6;
            doc.setFont('helvetica', 'normal');
            doc.text('di tempat', 20, currentY);

            currentY += 15;

            // Content Opening
            doc.text('Dengan hormat,', 20, currentY);
            currentY += 10;

            // Main Content Formatting
            const paragraphs = activeContent.split('\n');

            for (let p = 0; p < paragraphs.length; p++) {
                const paragraph = paragraphs[p];

                // Jika baris kosong, tambahkan sedikit ruang vertikal untuk spasi antar paragraf
                if (paragraph.trim() === '') {
                    currentY += 3;
                    continue;
                }

                // Cek apakah paragraf adalah list item (misal "1. ", "a. ", atau "- ")
                const listMatch = paragraph.match(/^(\d+\.|[a-z]\.|-)\s+/i);
                const isList = !!listMatch;
                const bulletPoint = isList ? listMatch[0] : '';
                const textContent = isList ? paragraph.substring(bulletPoint.length) : paragraph;

                // Indentasi hanging untuk teks yang panjangnya melebihi satu baris pada list item
                const textX = isList ? 26 : 20;
                const maxLineW = 210 - 20 - textX; // Batas margin kanan di 190

                const lines = doc.splitTextToSize(textContent, maxLineW);

                for (let i = 0; i < lines.length; i++) {
                    if (currentY > 260) {
                        doc.addPage();
                        // Reset styling untuk halaman baru
                        doc.setFontSize(10);
                        doc.setTextColor(textColor[0], textColor[1], textColor[2]);
                        doc.setFont('helvetica', 'normal');
                        currentY = 20;
                    }

                    if (isList && i === 0) {
                        // Cetak bullet point atau angka
                        doc.text(bulletPoint.trim(), 20, currentY);
                    }

                    const isLastLine = i === lines.length - 1;
                    if (!isLastLine && lines[i].length > 40) {
                        // Teks dibuat justify rata kiri-kanan agar rapih (mirip Word)
                        doc.text(lines[i], textX, currentY, { align: 'justify', maxWidth: maxLineW });
                    } else {
                        // Sisa baris terakhir di paragraf dicetak rata kiri biasa
                        doc.text(lines[i], textX, currentY);
                    }

                    currentY += 5.5; // Tinggi baris (line height) yang lebih rapat agar rapih
                }

                // Tambahkan spasi tambahan setiap akhir paragraf
                currentY += 2;
            }

            // Signatures
            currentY += 20;

            if (currentY + 40 > 275) {
                doc.addPage();
                currentY = 20;
            }

            // Right side: Signatory
            doc.setFont('helvetica', 'normal');
            doc.text('Cluster Taman Marunda,', 130, currentY);
            currentY += 6;
            doc.setFont('helvetica', 'bold');
            doc.text(activeSigRole, 130, currentY);

            currentY += 25; // Space for signature

            // Signatory Stamp (Logo Transparan)
            try {
                const stampImg = new Image();
                stampImg.src = '/logo_marunda.png';
                await new Promise((resolve) => {
                    stampImg.onload = resolve;
                    stampImg.onerror = resolve;
                });

                if (stampImg.complete && stampImg.naturalWidth > 0) {
                    const canvas = document.createElement('canvas');
                    canvas.width = stampImg.naturalWidth;
                    canvas.height = stampImg.naturalHeight;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.save();
                        // Opacity 40% untuk kejelasan lebih baik
                        ctx.globalAlpha = 0.4;
                        ctx.drawImage(stampImg, 0, 0);
                        ctx.restore();

                        // Render stamp with rotation 20 degrees
                        const stampX = 138;
                        const stampY = currentY - 32;
                        const stampSize = 35;

                        // Use built-in rotation (20 degrees clockwise) with better quality
                        doc.addImage(canvas.toDataURL('image/png'), 'PNG', stampX, stampY, stampSize, stampSize, undefined, undefined, 20);
                    }
                }
            } catch (e) {
                console.error('Stamp logic failed:', e);
            }

            doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.line(130, currentY, 185, currentY);

            currentY += 4;
            doc.setFont('helvetica', 'bold');
            doc.text(activeSigName, 130, currentY);

            // Official System Note with wrapping
            currentY += 8;
            doc.setFont('helvetica', 'italic');
            doc.setFontSize(7);
            doc.setTextColor(120, 120, 120);

            const warningText = '*Dokumen ini sah dikeluarkan melalui Sistem Manajemen Cluster Taman Marunda dan tidak memerlukan tanda tangan basah.';
            const wrappedWarning = doc.splitTextToSize(warningText, 60); // Wrap within 60mm width

            for (let i = 0; i < wrappedWarning.length; i++) {
                doc.text(wrappedWarning[i], 130, currentY);
                currentY += 3;
            }

            // Footer
            const pageCount = doc.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setDrawColor(lightColor[0], lightColor[1], lightColor[2]);
                doc.setLineWidth(0.5);
                doc.line(20, 282, 190, 282);
                doc.setFontSize(7);
                doc.setTextColor(150, 150, 150);
                doc.setFont('helvetica', 'normal');
                doc.text(`Halaman ${i} dari ${pageCount}`, 190, 286, { align: 'right' });
                doc.text('Dokumen Elektronik - Dikeluarkan secara otomatis oleh Sistem Manajemen Cluster Taman Marunda', 20, 286);
            }

            const fileNameSafeSubject = activeSubject.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            doc.save(`Pengumuman_${fileNameSafeSubject}_${format(new Date(), 'yyyyMMdd')}.pdf`);
            toast.success('Pengumuman resmi berhasil dicetak');
        } catch (error) {
            console.error('PDF generation error:', error);
            toast.error('Gagal mencetak dokumen');
        } finally {
            setIsExporting(false);
        }
    };

    const filteredAnnouncements = announcements.filter(ann =>
        ann.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ann.documentNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        ann.to.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <TooltipProvider>
            <div className="space-y-6 w-full mx-auto pb-12">
                {/* Header Action Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-sm transition-all duration-300">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                            <FileSignature size={24} />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">
                                Manajemen <span className="text-indigo-600">Pengumuman</span>
                            </h2>
                            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                                Database arsip surat resmi Cluster Marunda
                            </p>
                        </div>
                    </div>
                    <Button
                        onClick={() => {
                            if (showForm) {
                                setShowForm(false);
                                resetForm();
                            } else {
                                setShowForm(true);
                                resetForm();
                            }
                        }}
                        className={cn(
                            "rounded-xl font-black uppercase tracking-widest text-[11px] h-12 px-6 shadow-lg transition-all",
                            showForm
                                ? "bg-slate-100 hover:bg-slate-200 text-slate-600 shadow-none border border-slate-200 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-300"
                                : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20"
                        )}
                    >
                        {showForm ? (
                            <>Batal & Tutup</>
                        ) : (
                            <><Plus size={16} className="mr-2" /> Buat Pengumuman Baru</>
                        )}
                    </Button>
                </div>

                {/* Form Section */}
                {showForm && (
                    <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden animate-in slide-in-from-top-4 duration-500">
                        <div className="p-6 md:p-8 space-y-8">
                            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                                    <Edit size={16} className="text-indigo-500" />
                                    {editingId ? 'Edit Draft Pengumuman' : 'Draft Pengumuman Baru'}
                                </h3>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Nomor Surat</Label>
                                    <Input
                                        value={documentNumber}
                                        onChange={e => setDocumentNumber(e.target.value)}
                                        className="bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 h-11 rounded-xl"
                                        placeholder="Contoh: HR/2026/05/001"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Tanggal</Label>
                                    <Input
                                        type="date"
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        className="bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 h-11 rounded-xl"
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Kepada Yth.</Label>
                                    <Input
                                        value={to}
                                        onChange={e => setTo(e.target.value)}
                                        className="bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 h-11 rounded-xl"
                                        placeholder="Contoh: Seluruh Karyawan / Petugas Keamanan"
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Perihal (Subject)</Label>
                                    <Input
                                        value={subject}
                                        onChange={e => setSubject(e.target.value)}
                                        className="bg-slate-50 border-slate-200 dark:bg-slate-800 dark:border-slate-700 h-11 rounded-xl font-bold"
                                        placeholder="Contoh: Perubahan Jadwal Kerja / Aturan Baru"
                                    />
                                </div>

                                <div className="space-y-2 md:col-span-2">
                                    <Label className="text-[10px] font-black uppercase tracking-widest text-slate-500 ml-1">Isi Pengumuman</Label>
                                    <textarea
                                        value={content}
                                        onChange={e => setContent(e.target.value)}
                                        className="w-full bg-slate-50 border border-slate-200 dark:bg-slate-800 dark:border-slate-700 rounded-xl p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[300px] resize-y font-medium leading-relaxed"
                                        placeholder="Tuliskan isi pengumuman secara detail di sini..."
                                    />
                                </div>

                                <div className="border border-dashed border-slate-200 dark:border-slate-700 rounded-[1.5rem] p-5 space-y-4 md:col-span-2 bg-slate-50/50 dark:bg-slate-800/30">
                                    <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Penandatangan (Signatory)</h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold text-slate-500 ml-1">Nama Terang</Label>
                                            <Input
                                                value={signatoryName}
                                                onChange={e => setSignatoryName(e.target.value)}
                                                className="bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700 h-11 rounded-lg"
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-[10px] font-bold text-slate-500 ml-1">Jabatan / Role</Label>
                                            <Input
                                                value={signatoryRole}
                                                onChange={e => setSignatoryRole(e.target.value)}
                                                className="bg-white border-slate-200 dark:bg-slate-900 dark:border-slate-700 h-11 rounded-lg"
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="border border-indigo-100 dark:border-indigo-900/30 rounded-2xl p-5 bg-indigo-50/30 dark:bg-indigo-900/10 md:col-span-2 flex items-center justify-between group">
                                    <div className="flex items-center gap-4">
                                        <div className={cn(
                                            "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300",
                                            isPublished ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "bg-slate-100 text-slate-400 dark:bg-slate-800"
                                        )}>
                                            {isPublished ? <Globe size={24} className="animate-pulse" /> : <GlobeLock size={24} />}
                                        </div>
                                        <div>
                                            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Status Publikasi</h4>
                                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-0.5">
                                                {isPublished ? 'Tampilkan di Dashboard Utama' : 'Simpan sebagai Draft Internal'}
                                            </p>
                                        </div>
                                    </div>
                                    <label className="relative inline-flex items-center cursor-pointer">
                                        <input
                                            type="checkbox"
                                            className="sr-only peer"
                                            checked={isPublished}
                                            onChange={(e) => setIsPublished(e.target.checked)}
                                        />
                                        <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
                                    </label>
                                </div>
                            </div>

                            <div className="pt-4 flex flex-col sm:flex-row justify-end gap-3">
                                <Button
                                    variant="outline"
                                    onClick={() => handleSave(false)}
                                    disabled={isLoading}
                                    className="rounded-xl border-slate-200 dark:border-slate-800 font-bold uppercase tracking-widest text-[10px] h-12 px-6"
                                >
                                    {isLoading ? 'Menyimpan...' : 'Simpan Draft'}
                                </Button>
                                <Button
                                    onClick={() => handleSave(true)}
                                    disabled={isExporting || isLoading}
                                    className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-widest text-[10px] h-12 px-8 shadow-lg shadow-indigo-600/20"
                                >
                                    {isExporting ? (
                                        <>
                                            <Clock size={16} className="mr-2 animate-spin" />
                                            MEMPROSES PDF...
                                        </>
                                    ) : (
                                        <>
                                            <Download size={16} className="mr-2" />
                                            Simpan & Cetak PDF
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* List Section */}
                <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden min-h-[400px]">
                    <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                            <History size={16} className="text-amber-500" />
                            Arsip Pengumuman Resmi
                        </h3>
                        <div className="relative w-full sm:w-64">
                            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="Cari arsip..."
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                className="pl-9 h-9 text-xs rounded-xl bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700"
                            />
                        </div>
                    </div>

                    {/* Desktop View - Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Tanggal</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Nomor / Perihal</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400">Kepada</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-center">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                {isLoading && announcements.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold italic">Memuat data...</td>
                                    </tr>
                                ) : filteredAnnouncements.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">Tidak ada arsip ditemukan</td>
                                    </tr>
                                ) : (
                                    filteredAnnouncements.map((ann) => (
                                        <tr key={ann.id} className="group hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="text-[11px] font-black text-slate-900 dark:text-white uppercase">
                                                    {format(new Date(ann.date), 'dd MMM yyyy', { locale: id })}
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="space-y-0.5">
                                                    <div className="text-[9px] font-bold text-slate-400 tracking-widest">{ann.documentNumber}</div>
                                                    <div className="text-sm font-bold text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 transition-colors line-clamp-1">{ann.subject}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <div className="text-xs font-medium text-slate-500 dark:text-slate-400 line-clamp-1">{ann.to}</div>
                                            </td>
                                            <td className="px-6 py-4 text-center">
                                                {ann.isPublished ? (
                                                    <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter shadow-sm border border-emerald-200 dark:border-emerald-800">
                                                        <Globe size={10} /> Published
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-500 px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter border border-slate-200 dark:border-slate-700">
                                                        <GlobeLock size={10} /> Draft
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="flex items-center justify-end gap-1 transition-all">
                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className={cn(
                                                                    "h-8 w-8 rounded-lg transition-colors",
                                                                    ann.isPublished
                                                                        ? "text-indigo-600 bg-indigo-50 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40"
                                                                        : "text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                                                                )}
                                                                onClick={() => handleTogglePublish(ann)}
                                                            >
                                                                <Megaphone size={14} className={ann.isPublished ? "animate-pulse" : ""} />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top" className="bg-slate-900 text-white border-none font-bold text-[10px] uppercase tracking-widest">
                                                            {ann.isPublished ? 'Un-Publish' : 'Publish Ke Dashboard'}
                                                        </TooltipContent>
                                                    </Tooltip>

                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20"
                                                                onClick={() => generatePDF(ann)}
                                                            >
                                                                <Download size={14} />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top" className="bg-indigo-600 text-white border-none font-bold text-[10px] uppercase tracking-widest">
                                                            Cetak PDF
                                                        </TooltipContent>
                                                    </Tooltip>

                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8 rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20"
                                                                onClick={() => handleEdit(ann)}
                                                            >
                                                                <Edit size={14} />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top" className="bg-amber-600 text-white border-none font-bold text-[10px] uppercase tracking-widest">
                                                            Edit Data
                                                        </TooltipContent>
                                                    </Tooltip>

                                                    <Tooltip>
                                                        <TooltipTrigger asChild>
                                                            <Button
                                                                size="icon"
                                                                variant="ghost"
                                                                className="h-8 w-8 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                                                                onClick={() => setDeleteId(ann.id)}
                                                            >
                                                                <Trash2 size={14} />
                                                            </Button>
                                                        </TooltipTrigger>
                                                        <TooltipContent side="top" className="bg-red-600 text-white border-none font-bold text-[10px] uppercase tracking-widest">
                                                            Hapus Arsip
                                                        </TooltipContent>
                                                    </Tooltip>
                                                    <ChevronRight size={14} className="text-slate-200 dark:text-slate-800 ml-1" />
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile View - Cards */}
                    <div className="md:hidden divide-y divide-slate-100 dark:divide-slate-800">
                        {isLoading && announcements.length === 0 ? (
                            <div className="px-6 py-12 text-center text-slate-400 font-bold italic">Memuat data...</div>
                        ) : filteredAnnouncements.length === 0 ? (
                            <div className="px-6 py-12 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">Tidak ada arsip ditemukan</div>
                        ) : (
                            filteredAnnouncements.map((ann) => (
                                <div key={ann.id} className="p-6 space-y-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                                    <div className="flex justify-between items-start gap-3">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <div className="text-[10px] font-black text-indigo-600 dark:text-indigo-400 uppercase tracking-widest">
                                                    {format(new Date(ann.date), 'dd MMMM yyyy', { locale: id })}
                                                </div>
                                                {ann.isPublished && (
                                                    <span className="flex items-center gap-1 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-tighter">
                                                        <Globe size={10} /> Published
                                                    </span>
                                                )}
                                            </div>
                                            <div className="text-[9px] font-bold text-slate-400 tracking-widest">{ann.documentNumber}</div>
                                            <h4 className="text-sm font-black text-slate-900 dark:text-white leading-tight mt-1">{ann.subject}</h4>
                                            <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 line-clamp-1 pt-1 italic">Kepada: {ann.to}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 pt-2">
                                        <Button
                                            onClick={() => handleTogglePublish(ann)}
                                            className={cn(
                                                "flex-1 rounded-xl h-10 font-black uppercase text-[10px] tracking-widest gap-2 shadow-none transition-all",
                                                ann.isPublished
                                                    ? "bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300"
                                                    : "bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/10"
                                            )}
                                        >
                                            {ann.isPublished ? (
                                                <>Unpublish</>
                                            ) : (
                                                <><Megaphone size={14} /> Publish</>
                                            )}
                                        </Button>
                                        <Button
                                            onClick={() => generatePDF(ann)}
                                            className="flex-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 dark:bg-indigo-900/20 dark:hover:bg-indigo-900/40 dark:text-indigo-400 rounded-xl h-10 font-black uppercase text-[10px] tracking-widest gap-2 shadow-none"
                                        >
                                            <Download size={14} /> Cetak
                                        </Button>
                                        <Button
                                            onClick={() => handleEdit(ann)}
                                            className="flex-1 bg-amber-50 hover:bg-amber-100 text-amber-600 dark:bg-amber-900/20 dark:hover:bg-amber-900/40 dark:text-amber-400 rounded-xl h-10 font-black uppercase text-[10px] tracking-widest gap-2 shadow-none"
                                        >
                                            <Edit size={14} /> Edit
                                        </Button>
                                        <Button
                                            onClick={() => setDeleteId(ann.id)}
                                            variant="ghost"
                                            className="h-10 w-10 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 shrink-0 rounded-xl"
                                        >
                                            <Trash2 size={16} />
                                        </Button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Delete Confirmation */}
                <Dialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
                    <DialogContent className="rounded-[2rem] bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 sm:max-w-md">
                        <DialogHeader>
                            <DialogTitle className="font-black uppercase tracking-tight text-xl p-2">Hapus Arsip?</DialogTitle>
                            <DialogDescription className="text-sm font-medium px-2">
                                Tindakan ini tidak dapat dibatalkan. Pengumuman ini akan dihapus secara permanen dari database.
                            </DialogDescription>
                        </DialogHeader>
                        <DialogFooter className="gap-3 mt-4 px-2 pb-2">
                            <Button
                                variant="ghost"
                                onClick={() => setDeleteId(null)}
                                className="rounded-xl font-bold uppercase text-[10px] tracking-widest border border-slate-200 dark:border-slate-800"
                            >
                                Batal
                            </Button>
                            <Button
                                onClick={handleDelete}
                                className="rounded-xl bg-red-600 hover:bg-red-700 text-white font-black uppercase text-[10px] tracking-widest px-6"
                            >
                                Ya, Hapus Permanen
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </TooltipProvider>
    );
}
