'use client';

import React from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Calendar,
    FileText,
    ChevronLeft,
    ChevronRight,
    Search,
    User,
    Clock,
    Download,
    Home,
    Building2,
    MapPin,
    Phone,
    Mail,
    FileSignature
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';

interface LatenessRecord {
    id: string;
    userId: string;
    name: string;
    employeeId: string;
    role: string;
    date: Date;
    clockIn: Date;
    scheduledClockIn: Date | null;
    lateMinutes: number;
    status: string;
}

interface GroupedLateness {
    userId: string;
    name: string;
    employeeId: string;
    role: string;
    totalLateMinutes: number;
    frequency: number;
    records: LatenessRecord[];
}

interface AdministrationClientProps {
    initialData: LatenessRecord[];
    currentMonth: number;
    currentYear: number;
}

export default function AdministrationClient({
    initialData,
    currentMonth,
    currentYear
}: AdministrationClientProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = React.useState('');
    const [isExporting, setIsExporting] = React.useState<string | null>(null);

    const months = [
        { value: '1', label: 'Januari' },
        { value: '2', label: 'Februari' },
        { value: '3', label: 'Maret' },
        { value: '4', label: 'April' },
        { value: '5', label: 'Mei' },
        { value: '6', label: 'Juni' },
        { value: '7', label: 'Juli' },
        { value: '8', label: 'Agustus' },
        { value: '9', label: 'September' },
        { value: '10', label: 'Oktober' },
        { value: '11', label: 'November' },
        { value: '12', label: 'Desember' },
    ];

    const currentYearNum = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => (currentYearNum - 2 + i).toString());

    const handleFilterChange = (month: string, year: string) => {
        router.push(`/admin/administration?month=${month}&year=${year}`);
    };

    // Grouping logic
    const groupedData = React.useMemo(() => {
        const groups: { [key: string]: GroupedLateness } = {};

        initialData.forEach(record => {
            if (!groups[record.userId]) {
                groups[record.userId] = {
                    userId: record.userId,
                    name: record.name,
                    employeeId: record.employeeId,
                    role: record.role,
                    totalLateMinutes: 0,
                    frequency: 0,
                    records: []
                };
            }
            groups[record.userId].totalLateMinutes += (record.lateMinutes || 0);
            groups[record.userId].frequency += 1;
            groups[record.userId].records.push(record);
        });

        return Object.values(groups).filter(group =>
            group.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            group.employeeId.includes(searchQuery)
        ).sort((a, b) => b.totalLateMinutes - a.totalLateMinutes);
    }, [initialData, searchQuery]);

    const generateLatenessPDF = async (group: GroupedLateness) => {
        setIsExporting(group.userId);
        try {
            const { jsPDF } = await import('jspdf');
            const { default: autoTable } = await import('jspdf-autotable');
            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            });

            const primaryColor = [30, 41, 59]; // Slate-800
            const accentColor = [79, 70, 229]; // Indigo-600
            const textColor = [51, 65, 85]; // Slate-700
            const lightColor = [241, 245, 249]; // Slate-100

            // Header Section
            doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.rect(0, 0, 210, 35, 'F');

            // Official Logo (Rounded XL via Canvas for maximum stability)
            const logoX = 15;
            const logoY = 7;
            const logoSize = 18;
            const radius = 6; // Truly XL rounding

            // Background Card for Logo
            doc.setFillColor(255, 255, 255);
            doc.roundedRect(logoX - 1, logoY - 1, logoSize + 2, logoSize + 2, radius, radius, 'F');

            try {
                const img = new Image();
                img.src = '/logo_marunda.png';
                await new Promise((resolve) => {
                    img.onload = resolve;
                    img.onerror = resolve; // Continue even if logo fails
                });

                if (img.complete && img.naturalWidth > 0) {
                    const canvas = document.createElement('canvas');
                    canvas.width = img.naturalWidth;
                    canvas.height = img.naturalHeight;
                    const ctx = canvas.getContext('2d');
                    if (ctx) {
                        ctx.beginPath();
                        // Use a proportionally large radius for the high-res canvas
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
                console.error('Logo rounding failed:', e);
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

            // Document Info Box
            doc.setFillColor(lightColor[0], lightColor[1], lightColor[2]);
            doc.roundedRect(140, 8, 55, 20, 4, 4, 'F');
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text('DOKUMEN INTERNAL', 145, 14);
            doc.setFont('helvetica', 'normal');
            doc.text(`NO: HR/${format(new Date(), 'yyyy/MM')}/${group.employeeId}`, 145, 19);
            doc.text(`TGL: ${format(new Date(), 'dd MMM yyyy')}`, 145, 24);

            // Main Title
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('FORMULIR BERITA ACARA KETERLAMBATAN', 105, 45, { align: 'center' });

            // Professional Underline (Elegance Style)
            // doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
            // doc.setLineWidth(0.4);
            // doc.line(65, 47.2, 145, 47.2); // Mid-length accent 
            doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.setLineWidth(0.1);
            doc.line(50, 48.2, 160, 48.2); // Long elegant hairline

            // Section A: Employee Identity
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
            doc.text('A. IDENTITAS KARYAWAN', 20, 58);

            doc.setTextColor(textColor[0], textColor[1], textColor[2]);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(9);

            const identityY = 65;
            doc.text('Nama Lengkap', 20, identityY);
            doc.text(':', 55, identityY);
            doc.setFont('helvetica', 'bold');
            doc.text(group.name, 60, identityY);

            doc.setFont('helvetica', 'normal');
            doc.text('NIK / Employee ID', 20, identityY + 6);
            doc.text(':', 55, identityY + 6);
            doc.text(group.employeeId, 60, identityY + 6);

            doc.text('Jabatan / Role', 115, identityY);
            doc.text(':', 145, identityY);
            doc.text(group.role, 150, identityY);

            doc.text('Periode Laporan', 115, identityY + 6);
            doc.text(':', 145, identityY + 6);
            doc.text(`${months.find(m => m.value === currentMonth.toString())?.label} ${currentYear}`, 150, identityY + 6);

            // Section B: Lateness Table
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
            doc.text('B. RINCIAN TANGGAL KETERLAMBATAN', 20, 85);

            autoTable(doc, {
                startY: 90,
                head: [['NO', 'TANGGAL', 'JAM MASUK', 'JADWAL', 'DURASI (MENIT)']],
                body: group.records.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()).map((rec, idx) => [
                    idx + 1,
                    format(new Date(rec.date), 'dd MMMM yyyy', { locale: id }),
                    format(new Date(rec.clockIn), 'HH:mm'),
                    rec.scheduledClockIn ? format(new Date(rec.scheduledClockIn), 'HH:mm') : '08:00',
                    `${rec.lateMinutes} m`
                ]),
                styles: { fontSize: 8, cellPadding: 2.5 },
                headStyles: {
                    fillColor: [79, 70, 229],
                    textColor: 255,
                    fontStyle: 'bold',
                    halign: 'center'
                },
                columnStyles: {
                    0: { halign: 'center', cellWidth: 10 },
                    2: { halign: 'center' },
                    3: { halign: 'center' },
                    4: { halign: 'center' }
                },
                alternateRowStyles: { fillColor: [250, 250, 255] },
                margin: { left: 20, right: 20 }
            });

            // Summary Info
            let currentY = (doc as any).lastAutoTable.finalY + 8;
            doc.setFillColor(lightColor[0], lightColor[1], lightColor[2]);
            doc.roundedRect(20, currentY, 170, 8, 2, 2, 'F');
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text(`TOTAL FREKUENSI: ${group.frequency} KALI`, 25, currentY + 5.5);
            doc.text(`TOTAL DURASI: ${group.totalLateMinutes} MENIT`, 130, currentY + 5.5);

            // Section C: Employee Statement
            currentY += 18;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
            doc.text('C. ALASAN DAN SOLUSI (DIISI KARYAWAN)', 20, currentY);

            currentY += 6;
            doc.setFontSize(8.5);
            doc.setTextColor(textColor[0], textColor[1], textColor[2]);
            doc.setFont('helvetica', 'normal');
            doc.text('Tuliskan alasan keterlambatan dan komitmen perbaikan kehadiran kedepannya:', 20, currentY);

            currentY += 6;
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(0.1);
            doc.setLineDashPattern([0.5, 0.5], 0); // Smooth dotted lines
            for (let i = 0; i < 4; i++) {
                doc.line(20, currentY + (i * 7), 190, currentY + (i * 7));
            }
            doc.setLineDashPattern([], 0); // Reset dash

            // Section D: Signatures
            currentY += 35;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
            doc.text('D. PERSETUJUAN DAN VALIDASI', 20, currentY);

            currentY += 10;
            // Left: Employee
            doc.setFontSize(9);
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text('Yang Membuat Pernyataan,', 25, currentY);
            doc.setFontSize(7);
            doc.text('(Tanda Tangan & Nama Terang)', 25, currentY + 4);
            doc.line(25, currentY + 22, 75, currentY + 22);
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.text(group.name, 25, currentY + 26);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.text(`NIK: ${group.employeeId}`, 25, currentY + 29.5);

            // Right: HRD
            doc.setFontSize(9);
            doc.text('Disetujui oleh HRD / Atasan,', 130, currentY);
            doc.line(130, currentY + 22, 185, currentY + 22);
            doc.setFont('helvetica', 'bold');
            doc.text('( ______________________ )', 130, currentY + 26);
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7.5);
            doc.text('Stempel Departemen / Tanggal', 130, currentY + 29.5);

            // Footer
            const pageCount = doc.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setDrawColor(lightColor[0], lightColor[1], lightColor[2]);
                doc.setLineWidth(0.5);
                doc.line(20, 282, 190, 282);
                doc.setFontSize(7);
                doc.setTextColor(150, 150, 150);
                doc.text(`Halaman ${i} dari ${pageCount}`, 190, 286, { align: 'right' });
                doc.text('Dokumen ini dihasilkan secara otomatis oleh Sistem Manajemen Cluster Taman Marunda', 20, 286);
            }

            doc.save(`Laporan_Telat_${group.name.replace(/\s+/g, '_')}_${currentYear}${currentMonth.toString().padStart(2, '0')}.pdf`);
            toast.success('Laporan Profesional berhasil diunduh');
        } catch (error) {
            console.error('PDF Error:', error);
            toast.error('Gagal membuat PDF');
        } finally {
            setIsExporting(null);
        }
    };

    return (
        <div className="space-y-6">
            {/* Filter Bar */}
            <div className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-sm p-4 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Bulan</label>
                        <Select value={currentMonth.toString()} onValueChange={(v: string) => handleFilterChange(v, currentYear.toString())}>
                            <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100">
                                <Calendar size={14} className="mr-2 text-indigo-500" />
                                <SelectValue placeholder="Pilih Bulan" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                {months.map(m => (
                                    <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Tahun</label>
                        <Select value={currentYear.toString()} onValueChange={(v: string) => handleFilterChange(currentMonth.toString(), v)}>
                            <SelectTrigger className="rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-900 dark:text-slate-100">
                                <Calendar size={14} className="mr-2 text-indigo-500" />
                                <SelectValue placeholder="Pilih Tahun" />
                            </SelectTrigger>
                            <SelectContent className="rounded-xl">
                                {years.map(y => (
                                    <SelectItem key={y} value={y}>{y}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="md:col-span-2 space-y-1.5">
                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Cari Karyawan</label>
                        <div className="relative">
                            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                            <Input
                                placeholder="Masukkan nama atau ID karyawan..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* Content List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                {groupedData.length === 0 ? (
                    <div className="col-span-full py-12 text-center bg-white dark:bg-slate-900 rounded-[1.5rem] border border-dashed border-slate-200 dark:border-slate-800">
                        <FileText size={48} className="mx-auto mb-3 text-slate-200 dark:text-slate-800" />
                        <p className="text-slate-500 font-bold">Tidak ada data keterlambatan untuk periode ini</p>
                    </div>
                ) : (
                    groupedData.map((group) => (
                        <div
                            key={group.userId}
                            className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4 hover:shadow-md transition-shadow relative overflow-hidden group"
                        >
                            <div className="absolute top-0 right-0 p-3">
                                <FileText className="text-slate-100 dark:text-slate-800 w-12 h-12 -rotate-12 group-hover:scale-110 transition-transform" />
                            </div>

                            <div className="relative space-y-4">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <Home className="w-4 h-4 text-indigo-500" />
                                        <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight line-clamp-1">
                                            {group.name}
                                        </h3>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                        {group.employeeId} • {group.role}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-2">
                                    <div className="p-3 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl border border-indigo-100 dark:border-indigo-900/30">
                                        <p className="text-[8px] font-black text-indigo-400 uppercase tracking-widest mb-1">Total Telat</p>
                                        <p className="text-lg font-black text-indigo-600 dark:text-indigo-400 leading-none">
                                            {group.totalLateMinutes}<span className="text-[10px] ml-0.5">m</span>
                                        </p>
                                    </div>
                                    <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-xl border border-amber-100 dark:border-amber-900/30">
                                        <p className="text-[8px] font-black text-amber-400 uppercase tracking-widest mb-1">Frekuensi</p>
                                        <p className="text-lg font-black text-amber-600 dark:text-amber-400 leading-none">
                                            {group.frequency}<span className="text-[10px] ml-0.5">x</span>
                                        </p>
                                    </div>
                                </div>

                                <Button
                                    className="w-full rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px] tracking-widest py-6"
                                    onClick={() => generateLatenessPDF(group)}
                                    disabled={isExporting === group.userId}
                                >
                                    {isExporting === group.userId ? (
                                        <>
                                            <Clock size={14} className="mr-2 animate-spin" />
                                            Memproses...
                                        </>
                                    ) : (
                                        <>
                                            <Download size={14} className="mr-2" />
                                            Cetak Form HRD
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}