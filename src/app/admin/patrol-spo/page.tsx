'use client';

import React from 'react';
import { 
    Shield, 
    CheckCircle2, 
    Camera, 
    MapPin, 
    Clock, 
    UserCheck, 
    Printer,
    FileText,
    Award,
    Navigation
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function PatrolSPOPage() {
    const [isExporting, setIsExporting] = React.useState(false);
    const [mounted, setMounted] = React.useState(false);

    React.useEffect(() => {
        setMounted(true);
    }, []);

    const generateSPOPdf = async () => {
        setIsExporting(true);
        try {
            const { jsPDF } = await import('jspdf');
            
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
                console.error('Logo rounding failed:', e);
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

            // Document Info Box
            doc.setFillColor(lightColor[0], lightColor[1], lightColor[2]);
            doc.roundedRect(140, 8, 55, 20, 4, 4, 'F');
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text('DOKUMEN INTERNAL', 145, 14);
            doc.setFont('helvetica', 'normal');
            doc.text('KODE: SPO-SEC-MRD-2026', 145, 19);
            doc.text('TGL: 01 Jan 2026', 145, 24);

            // Main Title
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text('STANDAR PROSEDUR OPERASIONAL (SPO)', 105, 48, { align: 'center' });
            doc.setFontSize(11);
            doc.text('PATROLI DIGITAL KAWASAN MARUNDA', 105, 54, { align: 'center' });

            doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.setLineWidth(0.1);
            doc.line(50, 58, 160, 58);

            let currentY = 68;

            // Section I
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
            doc.text('I. ALUR PROSES PATROLI PETUGAS', 20, currentY);

            currentY += 6;
            const steps = [
                { step: '01', title: 'Mulai Putaran', desc: 'Buka menu Patroli dan klik "MULAI PUTARAN". Sistem mencatat waktu mulai jaga secara otomatis.' },
                { step: '02', title: 'Menuju Checkpoint', desc: 'Pergilah ke titik terdekat. Tombol scan aktif jika Anda berada dalam radius 50 meter dari lokasi.' },
                { step: '03', title: 'Ambil Foto Bukti', desc: 'Foto area dengan jelas. Gunakan fitur ZOOM jika objek jauh. Foto harus terang untuk verifikasi.' },
                { step: '04', title: 'Kirim Laporan', desc: 'Pilih status Aman/Temuan dan gunakan template catatan cepat. Klik Kirim Laporan untuk sinkronisasi.' }
            ];

            steps.forEach((s) => {
                doc.setFillColor(250, 250, 255);
                doc.roundedRect(20, currentY, 170, 14, 2, 2, 'F');
                doc.setDrawColor(accentColor[0], accentColor[1], accentColor[2]);
                doc.setLineWidth(0.5);
                doc.line(20, currentY, 20, currentY + 14);
                
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                doc.text(`Langkah ${s.step}: ${s.title}`, 25, currentY + 5.5);
                
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(textColor[0], textColor[1], textColor[2]);
                doc.text(s.desc, 25, currentY + 10.5);
                
                currentY += 17;
            });

            // Section II
            currentY += 4;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
            doc.text('II. ADMINISTRASI HRD & MONITORING KINERJA', 20, currentY);

            currentY += 6;
            const hrdPoints = [
                { title: 'Pencatatan Otomatis', desc: 'Seluruh sesi patroli (waktu, lokasi, durasi) terekam secara otomatis ke dalam sistem HRD.' },
                { title: 'Verifikasi Berjenjang', desc: 'Admin HRD melakukan pengecekan bukti foto harian untuk memastikan kehadiran di lokasi kerja.' },
                { title: 'Reward Sempurna', desc: 'Reward 100% di akhir bulan hanya diberikan kepada petugas dengan absensi sempurna & patroli lengkap.' }
            ];

            hrdPoints.forEach((p) => {
                doc.setFillColor(255, 251, 235); // Amber-50
                doc.roundedRect(20, currentY, 170, 12, 2, 2, 'F');
                doc.setDrawColor(245, 158, 11); // Amber-500
                doc.setLineWidth(0.5);
                doc.line(20, currentY, 20, currentY + 12);
                
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
                doc.text(p.title, 25, currentY + 5);
                
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(textColor[0], textColor[1], textColor[2]);
                doc.text(p.desc, 25, currentY + 9.5);
                
                currentY += 15;
            });

            // Section III
            currentY += 4;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
            doc.text('III. KETENTUAN REWARD PERFORMA 100%', 20, currentY);

            currentY += 6;
            const rewardCriteria = [
                'Tidak pernah terlambat (Late 0 menit)',
                'Tidak pernah pulang cepat (Early Out 0 menit)',
                'Kehadiran penuh sesuai jadwal (Alpha 0 hari)',
                'Seluruh titik patroli tercek setiap putaran'
            ];

            doc.setFillColor(248, 250, 252);
            doc.roundedRect(20, currentY, 80, 28, 2, 2, 'F');
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.text('Kriteria Penerima:', 25, currentY + 6);

            doc.setFont('helvetica', 'normal');
            doc.setFontSize(8);
            rewardCriteria.forEach((c, i) => {
                doc.text(`• ${c}`, 25, currentY + 11.5 + (i * 4.5));
            });

            // Peringatan Keras
            doc.setFillColor(255, 241, 242); // Rose-50
            doc.roundedRect(105, currentY, 85, 13, 2, 2, 'F');
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(225, 29, 72); // Rose-600
            doc.text('Peringatan Keras', 110, currentY + 5);
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(textColor[0], textColor[1], textColor[2]);
            doc.text('Laporan palsu atau Fake GPS akan mengakibatkan', 110, currentY + 9);
            doc.text('pemblokiran akun dan sanksi disipliner berat.', 110, currentY + 12);

            // Masa Berlaku
            doc.setFillColor(238, 242, 255); // Indigo-50
            doc.roundedRect(105, currentY + 15, 85, 13, 2, 2, 'F');
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(accentColor[0], accentColor[1], accentColor[2]);
            doc.text('Masa Berlaku', 110, currentY + 20);
            doc.setFontSize(7.5);
            doc.setFont('helvetica', 'normal');
            doc.setTextColor(textColor[0], textColor[1], textColor[2]);
            doc.text('SPO ini berlaku efektif mulai 1 Januari 2026 dan wajib', 110, currentY + 24);
            doc.text('dipatuhi seluruh personel keamanan.', 110, currentY + 27);

            currentY += 45;

            // Footer Signatures
            doc.setFontSize(9);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);

            doc.text('Disusun Oleh,', 45, currentY, { align: 'center' });
            doc.text('Disetujui Oleh,', 165, currentY, { align: 'center' });

            doc.setDrawColor(primaryColor[0], primaryColor[1], primaryColor[2]);
            doc.setLineWidth(0.5);

            doc.line(20, currentY + 22, 70, currentY + 22);
            doc.line(140, currentY + 22, 190, currentY + 22);

            doc.text('Koordinator Keamanan', 45, currentY + 27, { align: 'center' });
            doc.text('Manajer HRD Marunda', 165, currentY + 27, { align: 'center' });

            // Document Footer
            const pageCount = doc.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setDrawColor(lightColor[0], lightColor[1], lightColor[2]);
                doc.setLineWidth(0.5);
                doc.line(20, 282, 190, 282);
                doc.setFontSize(7);
                doc.setTextColor(150, 150, 150);
                doc.text(`Halaman ${i} dari ${pageCount}`, 190, 286, { align: 'right' });
                doc.text(`Dokumen ini dihasilkan secara otomatis oleh Sistem Manajemen Cluster Taman Marunda`, 20, 286);
            }

            doc.save(`SPO_Patroli_Marunda.pdf`);
            toast.success('SPO berhasil diunduh sebagai PDF');
        } catch (error) {
            console.error('PDF Error:', error);
            toast.error('Gagal membuat PDF');
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-4 md:p-8">
            {/* Force Background Colors on Print */}
            <style jsx global>{`
                @media print {
                    @page {
                        margin: 0;
                        size: auto;
                    }
                    body {
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                }
            `}</style>

            <div className="max-w-4xl mx-auto space-y-6">
                {/* Actions Toolbar - Hidden on Print */}
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm print:hidden">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white">
                            <FileText size={20} />
                        </div>
                        <div>
                            <h1 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">Dokumen SPO Patroli</h1>
                            <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Siap Cetak / Export ke PDF</p>
                        </div>
                    </div>
                    <Button 
                        onClick={generateSPOPdf}
                        disabled={isExporting}
                        className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px] tracking-widest px-6"
                    >
                        {isExporting ? (
                            <>
                                <Clock size={16} className="mr-2 animate-spin" /> Memproses...
                            </>
                        ) : (
                            <>
                                <Printer size={16} className="mr-2" /> Cetak SPO (PDF)
                            </>
                        )}
                    </Button>
                </div>

                {/* --- PRINTABLE DOCUMENT START --- */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl rounded-[2.5rem] overflow-hidden print:shadow-none print:border-none print:rounded-none">
                    {/* Document Header */}
                    <div className="bg-indigo-600 p-10 text-white relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
                        <div className="relative flex items-center justify-between">
                            <div className="flex items-center gap-6">
                                <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center text-indigo-600 shadow-xl">
                                    <Shield size={48} />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black uppercase tracking-tighter leading-none">Standar Prosedur Operasional</h2>
                                    <h3 className="text-xl font-bold opacity-80 mt-1 uppercase tracking-widest">Patroli Digital Kawasan Marunda</h3>
                                </div>
                            </div>
                            <div className="text-right hidden md:block">
                                <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-60">Kode Dokumen</p>
                                <p className="text-lg font-black tracking-widest">SPO-SEC-MRD-2026</p>
                            </div>
                        </div>
                    </div>

                    <div className="p-10 space-y-10">
                        {/* Section 1: Alur Lapangan */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 border-b-2 border-indigo-600 pb-2">
                                <MapPin className="text-indigo-600" size={24} />
                                <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">I. Alur Proses Patroli Petugas (Langkah demi Langkah)</h4>
                            </div>
                            
                            <div className="grid md:grid-cols-2 gap-6">
                                {[
                                    { 
                                        step: '01', 
                                        title: 'Mulai Putaran', 
                                        desc: 'Buka menu Patroli dan klik "MULAI PUTARAN". Sistem akan mencatat waktu mulai jaga Anda secara otomatis.',
                                        icon: Clock,
                                        color: 'bg-blue-50 text-blue-600 border-blue-100'
                                    },
                                    { 
                                        step: '02', 
                                        title: 'Menuju Checkpoint', 
                                        desc: 'Pergilah ke titik terdekat. Tombol scan hanya aktif jika Anda berada dalam radius 50 meter dari lokasi.',
                                        icon: Navigation,
                                        color: 'bg-indigo-50 text-indigo-600 border-indigo-100'
                                    },
                                    { 
                                        step: '03', 
                                        title: 'Ambil Foto Bukti', 
                                        desc: 'Foto area dengan jelas. Gunakan fitur ZOOM jika objek jauh. Foto harus terang sebagai bukti verifikasi.',
                                        icon: Camera,
                                        color: 'bg-purple-50 text-purple-600 border-purple-100'
                                    },
                                    { 
                                        step: '04', 
                                        title: 'Kirim Laporan', 
                                        desc: 'Pilih status Aman/Temuan dan gunakan template catatan cepat. Klik Kirim Laporan untuk sinkronisasi data.',
                                        icon: CheckCircle2,
                                        color: 'bg-emerald-50 text-emerald-600 border-emerald-100'
                                    }
                                ].map((item, i) => (
                                    <div key={i} className="flex gap-4 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50">
                                        <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0 border", item.color)}>
                                            <item.icon size={24} />
                                        </div>
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-black text-indigo-600 opacity-50 uppercase tracking-widest">Langkah {item.step}</span>
                                                <h5 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">{item.title}</h5>
                                            </div>
                                            <p className="text-[11px] leading-relaxed text-slate-500 font-medium">{item.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>

                        {/* Section 2: HRD Admin */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 border-b-2 border-amber-500 pb-2">
                                <UserCheck className="text-amber-500" size={24} />
                                <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">II. Administrasi HRD & Monitoring Kinerja</h4>
                            </div>
                            
                            <div className="p-8 rounded-[2rem] bg-amber-50/50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 space-y-4">
                                <div className="grid md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <h6 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">Pencatatan Otomatis</h6>
                                        <p className="text-[11px] font-medium text-amber-900/70 dark:text-amber-200/70 leading-relaxed">Seluruh sesi patroli (waktu, lokasi, durasi) terekam secara otomatis ke dalam sistem HRD tanpa bisa dimanipulasi.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <h6 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">Verifikasi Berjenjang</h6>
                                        <p className="text-[11px] font-medium text-amber-900/70 dark:text-amber-200/70 leading-relaxed">Admin HRD melakukan pengecekan bukti foto harian untuk memastikan petugas benar-benar berada di lokasi kerja.</p>
                                    </div>
                                    <div className="space-y-2">
                                        <h6 className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em]">Reward Sempurna</h6>
                                        <p className="text-[11px] font-medium text-amber-900/70 dark:text-amber-200/70 leading-relaxed">Reward 100% di akhir bulan hanya diberikan kepada petugas dengan absensi sempurna & patroli lengkap.</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Section 3: Reward Rules */}
                        <section className="space-y-6">
                            <div className="flex items-center gap-3 border-b-2 border-indigo-600 pb-2">
                                <Award className="text-indigo-600" size={24} />
                                <h4 className="text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight">III. Ketentuan Reward Performa 100%</h4>
                            </div>
                            
                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="flex-1 bg-indigo-600 text-white p-8 rounded-[2rem] shadow-xl shadow-indigo-200 dark:shadow-none relative overflow-hidden group">
                                    <Award className="absolute -right-8 -bottom-8 w-40 h-40 opacity-10 rotate-12 group-hover:rotate-0 transition-transform duration-700" />
                                    <h5 className="text-xl font-black uppercase tracking-tight mb-2">Kriteria Penerima</h5>
                                    <ul className="space-y-3">
                                        {[
                                            'Tidak pernah terlambat (Late 0 menit)',
                                            'Tidak pernah pulang cepat (Early Out 0 menit)',
                                            'Kehadiran penuh sesuai jadwal (Alpha 0 hari)',
                                            'Seluruh titik patroli tercek setiap putaran'
                                        ].map((text, i) => (
                                            <li key={i} className="flex items-center gap-3 text-[11px] font-bold uppercase tracking-widest">
                                                <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center shrink-0">
                                                    <CheckCircle2 size={12} />
                                                </div>
                                                {text}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                                <div className="flex-1 space-y-4">
                                    <div className="p-6 rounded-2xl border border-rose-100 bg-rose-50/50">
                                        <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Peringatan Keras</p>
                                        <p className="text-[11px] font-medium text-rose-800 leading-relaxed">Laporan palsu atau penggunaan aplikasi Fake GPS akan mengakibatkan pemblokiran akun dan sanksi disipliner berat.</p>
                                    </div>
                                    <div className="p-6 rounded-2xl border border-indigo-100 bg-indigo-50/50">
                                        <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1">Masa Berlaku</p>
                                        <p className="text-[11px] font-medium text-indigo-800 leading-relaxed">SPO ini berlaku efektif mulai tanggal 1 Januari 2026 dan wajib dipatuhi seluruh personel keamanan Kawasan Marunda.</p>
                                    </div>
                                </div>
                            </div>
                        </section>

                        {/* Document Footer */}
                        <div className="pt-12 border-t border-slate-200 flex items-center justify-between">
                            <div className="text-center w-48">
                                <p className="text-[10px] font-black uppercase text-slate-400 mb-16 tracking-widest">Disusun Oleh,</p>
                                <div className="border-b border-slate-900 mx-auto w-32" />
                                <p className="text-[10px] font-black uppercase text-slate-900 dark:text-white mt-2">Koordinator Keamanan</p>
                            </div>
                            <div className="text-center w-48">
                                <p className="text-[10px] font-black uppercase text-slate-400 mb-16 tracking-widest">Disetujui Oleh,</p>
                                <div className="border-b border-slate-900 mx-auto w-32" />
                                <p className="text-[10px] font-black uppercase text-slate-900 dark:text-white mt-2">Manajer HRD Marunda</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Print Footer - Hidden on web, shows on print */}
                <div className="hidden print:block text-center text-[10px] font-medium text-slate-400 pt-8 uppercase tracking-widest">
                    Dokumen ini dihasilkan secara otomatis oleh Sistem Absensi Marunda {mounted ? `pada ${new Date().toLocaleString()}` : ''}
                </div>
            </div>
        </div>
    );
}
