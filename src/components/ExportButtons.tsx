'use client';

import { Download, FileText } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';

interface JsPDFCustom extends jsPDF {
    lastAutoTable: {
        finalY: number;
    };
}

export interface AttendanceExportData {
    id: string;
    user: {
        name: string;
        employeeId: string;
        role: string;
    };
    clockIn: Date;
    clockOut: Date | null;
    status: string;
    shiftType: string | null;
    isLate: boolean;
    lateMinutes: number;
    isEarlyLeave: boolean;
    earlyLeaveMinutes: number;
    address: string | null;
}

interface ExportButtonsProps {
    attendances: AttendanceExportData[];
    filterInfo?: {
        userName?: string;
        startDate?: string;
        endDate?: string;
    };
}

export default function ExportButtons({ attendances, filterInfo }: ExportButtonsProps) {
    const [isExporting, setIsExporting] = useState(false);

    const formatDuration = (minutes: number) => {
        if (minutes < 60) return `${minutes} Menit`;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return mins > 0 ? `${hours} Jam ${mins} Menit` : `${hours} Jam`;
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            timeZone: 'Asia/Jakarta'
        });
    };

    const formatDateFull = (date: Date) => {
        return new Date(date).toLocaleDateString('id-ID', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            timeZone: 'Asia/Jakarta'
        });
    };

    const formatTime = (date: Date) => {
        return new Date(date).toLocaleTimeString('id-ID', {
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Jakarta'
        });
    };

    const groupAttendancesByDate = () => {
        const grouped: { [date: string]: AttendanceExportData[] } = {};

        attendances.forEach(att => {
            const dateKey = new Date(att.clockIn).toDateString();
            if (!grouped[dateKey]) {
                grouped[dateKey] = [];
            }
            grouped[dateKey].push(att);
        });

        // Sort dates in descending order (newest first)
        return Object.entries(grouped)
            .sort(([dateA], [dateB]) => new Date(dateB).getTime() - new Date(dateA).getTime())
            .reduce((acc, [date, atts]) => {
                // Sort attendance entries per date by clock-in time
                atts.sort((a, b) => new Date(b.clockIn).getTime() - new Date(a.clockIn).getTime());
                acc[date] = atts;
                return acc;
            }, {} as { [date: string]: AttendanceExportData[] });
    };

    const exportToCSV = () => {
        try {
            setIsExporting(true);

            // Group attendances by date
            const groupedAttendances = groupAttendancesByDate();

            let csvContent = '\uFEFF'; // BOM for UTF-8
            let rowNumber = 1;

            // Generate CSV content with grouping
            Object.entries(groupedAttendances).forEach(([dateKey, dateAttendances]) => {
                const date = new Date(dateKey);
                const dateHeader = formatDateFull(date);

                // Add date header
                csvContent += `TANGGAL: ${dateHeader}\n`;
                csvContent += 'No,Nama Karyawan,ID Karyawan,Role,Jam Masuk,Jam Keluar,Shift,Status,Terlambat,Pulang Cepat,Lokasi\n';

                // Add attendance rows for this date
                dateAttendances.forEach(att => {
                    const row = [
                        rowNumber++,
                        att.user.name,
                        att.user.employeeId,
                        att.user.role,
                        formatTime(att.clockIn),
                        att.clockOut ? formatTime(att.clockOut) : 'Belum Absen',
                        att.shiftType || '-',
                        att.status === 'PRESENT' ? 'HADIR' : att.status,
                        att.isLate ? formatDuration(att.lateMinutes) : '-',
                        att.isEarlyLeave ? formatDuration(att.earlyLeaveMinutes) : '-',
                        att.address || '-'
                    ].map(cell => `"${cell}"`).join(',');

                    csvContent += row + '\n';
                });

                // Add empty line between date groups
                csvContent += '\n';
            });

            // Create blob and download
            const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);

            link.setAttribute('href', url);
            const fileName = filterInfo?.userName
                ? `Riwayat_Absensi_${filterInfo.userName}_${new Date().toISOString().split('T')[0]}.csv`
                : `Riwayat_Absensi_${new Date().toISOString().split('T')[0]}.csv`;
            link.setAttribute('download', fileName);
            link.style.visibility = 'hidden';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success('Export CSV Berhasil', {
                description: `${attendances.length} data berhasil di-export`
            });
        } catch (_error) {
            toast.error('Export CSV Gagal', {
                description: 'Terjadi kesalahan saat export data'
            });
        } finally {
            setIsExporting(false);
        }
    };

    const exportToPDF = async () => {
        try {
            setIsExporting(true);

            // Dynamically import jsPDF and autotable
            const jsPDFModule = await import('jspdf');
            const jsPDF = jsPDFModule.default;
            const autoTable = (await import('jspdf-autotable')).default;

            const doc = new jsPDF({
                orientation: 'portrait',
                unit: 'mm',
                format: 'a4'
            }) as JsPDFCustom;

            // Set margins for A4 portrait (210mm x 297mm)
            const pageWidth = 210;
            const marginLeft = 15;
            const marginRight = 15;
            const contentWidth = pageWidth - marginLeft - marginRight;

            doc.setFontSize(14);
            doc.text('LAPORAN REKAPITULASI PRESENSI KARYAWAN', pageWidth / 2, 20, { align: 'center' });

            doc.setFontSize(11);
            doc.setFont('helvetica', 'normal');
            doc.text('Cluster Taman Marunda, Metland Cibitung', pageWidth / 2, 26, { align: 'center' });

            // Horizontal line
            doc.setLineWidth(0.5);
            doc.line(marginLeft, 30, pageWidth - marginRight, 30);

            // Filter Info Section
            let yPos = 36;
            doc.setFontSize(10);
            doc.setFont('helvetica', 'bold');
            doc.text('FILTER LAPORAN:', marginLeft, yPos);

            yPos += 6;
            doc.setFont('helvetica', 'normal');

            const formatDateCompact = (date: Date | string) => {
                return new Date(date).toLocaleDateString('id-ID', {
                    day: '2-digit',
                    month: 'short',
                    year: '2-digit'
                }).replace(/ /g, '-');
            };

            const infoLines = [];
            if (filterInfo?.userName) {
                infoLines.push(`Nama Karyawan: ${filterInfo.userName}`);
            }
            if (filterInfo?.startDate && filterInfo?.endDate) {
                infoLines.push(`Periode: ${formatDateCompact(filterInfo.startDate)} s/d ${formatDateCompact(filterInfo.endDate)}`);
            } else if (filterInfo?.startDate) {
                infoLines.push(`Mulai Tanggal: ${formatDateCompact(filterInfo.startDate)}`);
            } else if (filterInfo?.endDate) {
                infoLines.push(`Sampai Tanggal: ${formatDateCompact(filterInfo.endDate)}`);
            }

            infoLines.push(`Total Data: ${attendances.length} catatan kehadiran`);
            infoLines.push(`Tanggal Generate: ${formatDateCompact(new Date())} ${new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}`);

            infoLines.forEach(line => {
                doc.text(line, marginLeft, yPos);
                yPos += 5;
            });

            yPos += 3;

            // Calculate date range for expected work days
            const getDateRange = () => {
                if (filterInfo?.startDate && filterInfo?.endDate) {
                    return {
                        start: new Date(filterInfo.startDate),
                        end: new Date(filterInfo.endDate)
                    };
                }

                if (attendances.length > 0) {
                    const dates = attendances.map(a => new Date(a.clockIn));
                    return {
                        start: new Date(Math.min(...dates.map(d => d.getTime()))),
                        end: new Date(Math.max(...dates.map(d => d.getTime())))
                    };
                }

                const now = new Date();
                return {
                    start: new Date(now.getFullYear(), now.getMonth(), 1),
                    end: new Date(now.getFullYear(), now.getMonth() + 1, 0)
                };
            };

            const dateRange = getDateRange();

            // Calculate expected work days based on role
            const calculateExpectedWorkDays = (role: string, startDate: Date, endDate: Date): number => {
                const start = new Date(startDate);
                const end = new Date(endDate);
                let workDays = 0;

                if (role === 'LINGKUNGAN' || role === 'KEBERSIHAN') {
                    const current = new Date(start);
                    while (current <= end) {
                        const dayOfWeek = current.getDay();
                        if (dayOfWeek !== 0) {
                            workDays++;
                        }
                        current.setDate(current.getDate() + 1);
                    }
                    return workDays;
                }

                if (role === 'SECURITY') {
                    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                    return Math.ceil(totalDays * 0.6);
                }

                return 0;
            };

            // Calculate performance summary per user
            const userStats = new Map<string, {
                name: string;
                employeeId: string;
                role: string;
                expectedWorkDays: number;
                totalAttendance: number;
                presentCount: number;
                lateCount: number;
                earlyLeaveCount: number;
                totalLateMinutes: number;
                totalEarlyMinutes: number;
                performances: number[];
            }>();

            attendances.forEach(att => {
                const userId = att.user.employeeId;
                if (!userStats.has(userId)) {
                    const expectedDays = calculateExpectedWorkDays(att.user.role, dateRange.start, dateRange.end);
                    userStats.set(userId, {
                        name: att.user.name,
                        employeeId: att.user.employeeId,
                        role: att.user.role,
                        expectedWorkDays: expectedDays,
                        totalAttendance: 0,
                        presentCount: 0,
                        lateCount: 0,
                        earlyLeaveCount: 0,
                        totalLateMinutes: 0,
                        totalEarlyMinutes: 0,
                        performances: []
                    });
                }

                const stats = userStats.get(userId)!;
                stats.totalAttendance++;

                if (att.status === 'PRESENT' || att.status === 'LATE') {
                    stats.presentCount++;
                }

                if (att.isLate) {
                    stats.lateCount++;
                    stats.totalLateMinutes += att.lateMinutes;
                }

                if (att.isEarlyLeave) {
                    stats.earlyLeaveCount++;
                    stats.totalEarlyMinutes += att.earlyLeaveMinutes;
                }

                if (att.status === 'PRESENT' || att.status === 'LATE') {
                    let performance = 100;
                    if (att.isLate) performance -= att.lateMinutes;
                    if (att.isEarlyLeave) performance -= att.earlyLeaveMinutes;
                    stats.performances.push(Math.max(0, performance));
                }
            });

            // Performance Summary Section
            if (userStats.size > 0) {
                // Check if we need new page
                if (yPos > 200) {
                    doc.addPage();
                    yPos = 20;
                }

                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.text('RESUME PERFORMANCE KARYAWAN', marginLeft, yPos);

                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                const periodText = `Periode Analisis: ${formatDateCompact(dateRange.start)} - ${formatDateCompact(dateRange.end)}`;
                doc.text(periodText, marginLeft, yPos + 4);
                yPos += 10;

                const sortedStats = Array.from(userStats.values()).sort((a, b) => {
                    const avgA = a.performances.length > 0 ? (a.performances.reduce((sum, val) => sum + val, 0) / a.performances.length) : 0;
                    const avgB = b.performances.length > 0 ? (b.performances.reduce((sum, val) => sum + val, 0) / b.performances.length) : 0;
                    return avgB - avgA;
                });

                const summaryData = sortedStats.map((stats, index) => {
                    const avgPerformance = stats.performances.length > 0
                        ? (stats.performances.reduce((a, b) => a + b, 0) / stats.performances.length).toFixed(1)
                        : '0.0';

                    const attendanceRate = stats.expectedWorkDays > 0
                        ? ((stats.presentCount / stats.expectedWorkDays) * 100).toFixed(1)
                        : '0.0';

                    const absentDays = stats.expectedWorkDays - stats.presentCount;
                    // const avgLateMinutes = stats.lateCount > 0
                    //     ? Math.round(stats.totalLateMinutes / stats.lateCount)
                    //     : 0;

                    return [
                        (index + 1).toString(),
                        stats.name,
                        stats.employeeId,
                        stats.role,
                        stats.expectedWorkDays.toString(),
                        stats.presentCount.toString(),
                        absentDays > 0 ? absentDays.toString() : '0',
                        `${attendanceRate}%`,
                        `${avgPerformance}%`,
                        stats.lateCount.toString(),
                        stats.totalLateMinutes > 0 ? `${stats.totalLateMinutes} mnt` : '-'
                        // avgLateMinutes > 0 ? `${avgLateMinutes} mnt` : '-'
                    ];
                });

                autoTable(doc, {
                    startY: yPos,
                    head: [['No', 'Nama', 'ID', 'Jabatan', 'Hari Kerja', 'Hadir', 'Absen', 'Tingkat Kehadiran', 'Rata² Performa', 'Jml Telat', 'Total Terlambat']],
                    body: summaryData,
                    theme: 'grid',
                    styles: {
                        fontSize: 7,
                        cellPadding: 1.5,
                        lineColor: [200, 200, 200],
                        lineWidth: 0.1,
                    },
                    headStyles: {
                        fillColor: [59, 130, 246], // Blue color
                        textColor: 255,
                        fontStyle: 'bold',
                        fontSize: 7.5,
                        cellPadding: 1.8,
                    },
                    alternateRowStyles: {
                        fillColor: [248, 250, 252],
                    },
                    margin: { left: marginLeft, right: marginRight },
                    tableWidth: contentWidth,
                    columnStyles: {
                        0: { cellWidth: 10, halign: 'center' },
                        1: { cellWidth: 25 },
                        2: { cellWidth: 18, halign: 'center' },
                        3: { cellWidth: 25 },
                        4: { cellWidth: 15, halign: 'center' },
                        5: { cellWidth: 12, halign: 'center' },
                        6: { cellWidth: 12, halign: 'center' },
                        7: { cellWidth: 18, halign: 'center' },
                        8: { cellWidth: 18, halign: 'center' },
                        9: { cellWidth: 12, halign: 'center' },
                        10: { cellWidth: 15, halign: 'center' },
                    },
                });

                yPos = doc.lastAutoTable.finalY + 15;
            }

            // Group attendances by date for detailed section
            const groupedAttendances = groupAttendancesByDate();
            const dates = Object.keys(groupedAttendances);

            // Detail Attendance Section
            if (dates.length > 0) {
                // Check if we need new page
                if (yPos > 210) {
                    doc.addPage();
                    yPos = 20;
                }

                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.text('DETAIL PRESENSI PER TANGGAL', marginLeft, yPos);
                yPos += 8;

                // Generate detailed tables for each date
                dates.forEach((dateKey, dateIndex) => {
                    const dateAttendances = groupedAttendances[dateKey];
                    const currentDate = new Date(dateKey);

                    // Check if we need a new page
                    if (yPos > 230) {
                        doc.addPage();
                        yPos = 20;

                        // Re-add section title on new page
                        doc.setFontSize(11);
                        doc.setFont('helvetica', 'bold');
                        doc.text('DETAIL PRESENSI PER TANGGAL (Lanjutan)', marginLeft, yPos);
                        yPos += 8;
                    }

                    // Date header
                    doc.setFontSize(10);
                    doc.setFont('helvetica', 'bold');
                    doc.text(`Hari & Tanggal: ${formatDateFull(currentDate)}`, marginLeft, yPos);
                    yPos += 6;

                    // Generate table for this date's attendances
                    const tableData = dateAttendances.map((att, index) => [
                        (index + 1).toString(),
                        att.user.name,
                        att.user.employeeId,
                        att.user.role,
                        formatTime(att.clockIn),
                        att.clockOut ? formatTime(att.clockOut) : '-',
                        att.shiftType || '-',
                        att.status === 'PRESENT' ? 'HADIR' :
                            att.status === 'LATE' ? 'TERLAMBAT' :
                                att.status === 'SICK' ? 'SAKIT' :
                                    att.status === 'LEAVE' ? 'CUTI' :
                                        att.status === 'ABSENT' ? 'ABSEN' : att.status,
                        att.isLate ? formatDuration(att.lateMinutes) : '-',
                        att.isEarlyLeave ? formatDuration(att.earlyLeaveMinutes) : '-'
                    ]);

                    autoTable(doc, {
                        startY: yPos,
                        head: [['No', 'Nama', 'ID', 'Jabatan', 'Jam Masuk', 'Jam Keluar', 'Shift', 'Status', 'Terlambat', 'Pulang Cepat']],
                        body: tableData,
                        theme: 'striped',
                        styles: {
                            fontSize: 7,
                            cellPadding: 0.5,
                            lineColor: [220, 220, 220],
                            lineWidth: 0.1,
                        },
                        headStyles: {
                            fillColor: [75, 85, 99], // Gray color
                            textColor: 255,
                            fontStyle: 'bold',
                            fontSize: 7.2,
                            cellPadding: 1.0,
                        },
                        margin: { left: marginLeft, right: marginRight },
                        tableWidth: contentWidth,
                        columnStyles: {
                            0: { cellWidth: 8, halign: 'center' },
                            1: { cellWidth: 35 },
                            2: { cellWidth: 18, halign: 'center' },
                            3: { cellWidth: 25 },
                            4: { cellWidth: 15, halign: 'center' },
                            5: { cellWidth: 15, halign: 'center' },
                            6: { cellWidth: 12, halign: 'center' },
                            7: { cellWidth: 18, halign: 'center' },
                            8: { cellWidth: 15, halign: 'center' },
                            9: { cellWidth: 18, halign: 'center' },
                        },
                        didDrawPage: function (data) {
                            if (data.cursor) {
                                yPos = data.cursor.y + 5;
                            }
                        }
                    });

                    yPos = doc.lastAutoTable.finalY + 8;

                    // Add spacing between date groups
                    if (dateIndex < dates.length - 1 && yPos < 260) {
                        doc.setDrawColor(220, 220, 220);
                        doc.setLineWidth(0.2);
                        doc.line(marginLeft, yPos, pageWidth - marginRight, yPos);
                        yPos += 8;
                    }
                });
            }

            // Footer on each page
            const pageCount = doc.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);

                // Footer line
                doc.setDrawColor(200, 200, 200);
                doc.setLineWidth(0.3);
                doc.line(marginLeft, 280, pageWidth - marginRight, 280);

                // Footer text
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                doc.text(
                    `Dokumen ini dibuat secara otomatis oleh Sistem Presensi IMA | Halaman ${i} dari ${pageCount}`,
                    pageWidth / 2,
                    285,
                    { align: 'center' }
                );

                doc.text(
                    new Date().toLocaleString('id-ID', {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                    }),
                    pageWidth / 2,
                    290,
                    { align: 'center' }
                );
            }

            // Open PDF in new tab
            const pdfBlob = doc.output('blob');
            const pdfUrl = URL.createObjectURL(pdfBlob);

            window.open(pdfUrl, '_blank');

            // Clean up
            setTimeout(() => URL.revokeObjectURL(pdfUrl), 60000);

            toast.success('Laporan PDF Berhasil Dibuat', {
                description: 'Laporan dibuka di tab baru'
            });
        } catch (error) {
            console.error('PDF Export Error:', error);
            toast.error('Export PDF Gagal', {
                description: 'Terjadi kesalahan saat membuat laporan'
            });
        } finally {
            setIsExporting(false);
        }
    };

    return (
        <div className="flex items-center gap-3">
            <button
                onClick={exportToCSV}
                disabled={isExporting || attendances.length === 0}
                className="h-10 md:h-12 px-4 md:px-6 rounded-xl md:rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs md:text-sm shadow-sm flex items-center gap-2 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
                <Download size={16} className="md:w-[18px] md:h-[18px]" />
                <span className="hidden md:inline">Export CSV</span>
                <span className="md:hidden">CSV</span>
            </button>

            <button
                onClick={exportToPDF}
                disabled={isExporting || attendances.length === 0}
                className="h-10 md:h-12 px-4 md:px-6 rounded-xl md:rounded-2xl bg-indigo-600 text-white font-bold text-xs md:text-sm shadow-lg shadow-indigo-200 dark:shadow-none flex items-center gap-2 hover:bg-indigo-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
                <FileText size={16} className="md:w-[18px] md:h-[18px]" />
                <span className="hidden md:inline">Export PDF</span>
                <span className="md:hidden">PDF</span>
            </button>
        </div>
    );
}