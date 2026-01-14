'use client';

import { Download, FileText } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface AttendanceExportData {
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

    const formatDateTime = (date: Date) => {
        return new Date(date).toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            timeZone: 'Asia/Jakarta'
        });
    };

    const formatDate = (date: Date) => {
        return new Date(date).toLocaleDateString('id-ID', {
            day: '2-digit',
            month: 'short',
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

    const exportToCSV = () => {
        try {
            setIsExporting(true);

            // CSV Headers
            const headers = [
                'No',
                'Nama Karyawan',
                'ID Karyawan',
                'Role',
                'Tanggal',
                'Clock In',
                'Clock Out',
                'Shift',
                'Status',
                'Terlambat',
                'Pulang Cepat',
                'Lokasi'
            ];

            // CSV Rows
            const rows = attendances.map((att, index) => [
                index + 1,
                att.user.name,
                att.user.employeeId,
                att.user.role,
                formatDate(att.clockIn),
                formatTime(att.clockIn),
                att.clockOut ? formatTime(att.clockOut) : 'Belum Absen',
                att.shiftType || '-',
                att.status === 'PRESENT' ? 'HADIR' : att.status,
                att.isLate ? formatDuration(att.lateMinutes) : '-',
                att.isEarlyLeave ? formatDuration(att.earlyLeaveMinutes) : '-',
                att.address || '-'
            ]);

            // Combine headers and rows
            const csvContent = [
                headers.join(','),
                ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
            ].join('\n');

            // Create blob and download
            const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);

            link.setAttribute('href', url);
            link.setAttribute('download', `Riwayat_Absensi_${new Date().toISOString().split('T')[0]}.csv`);
            link.style.visibility = 'hidden';

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success('Export CSV Berhasil', {
                description: `${attendances.length} data berhasil di-export`
            });
        } catch (error) {
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
                orientation: 'landscape',
            }) as any; // Cast to any to use autoTable

            // Title
            doc.setFontSize(18);
            doc.setFont('helvetica', 'bold');
            doc.text('LAPORAN RIWAYAT ABSENSI', doc.internal.pageSize.getWidth() / 2, 15, { align: 'center' });

            doc.setFontSize(10);
            doc.setFont('helvetica', 'normal');
            doc.text('Cluster Taman Marunda', doc.internal.pageSize.getWidth() / 2, 22, { align: 'center' });

            // Filter Info
            let yPos = 30;
            if (filterInfo?.userName || filterInfo?.startDate || filterInfo?.endDate) {
                doc.setFontSize(9);
                if (filterInfo.userName) {
                    doc.text(`Karyawan: ${filterInfo.userName}`, 14, yPos);
                    yPos += 5;
                }
                if (filterInfo.startDate || filterInfo.endDate) {
                    const dateRange = `Periode: ${filterInfo.startDate || 'Awal'} - ${filterInfo.endDate || 'Sekarang'}`;
                    doc.text(dateRange, 14, yPos);
                    yPos += 5;
                }
            }

            // Calculate date range for expected work days
            const getDateRange = () => {
                if (filterInfo?.startDate && filterInfo?.endDate) {
                    return {
                        start: new Date(filterInfo.startDate),
                        end: new Date(filterInfo.endDate)
                    };
                }

                // If no filter, use the range from actual attendance data
                if (attendances.length > 0) {
                    const dates = attendances.map(a => new Date(a.clockIn));
                    return {
                        start: new Date(Math.min(...dates.map(d => d.getTime()))),
                        end: new Date(Math.max(...dates.map(d => d.getTime())))
                    };
                }

                // Default to current month
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

                // LINGKUNGAN & KEBERSIHAN: Work Monday-Saturday (6 days/week)
                if (role === 'LINGKUNGAN' || role === 'KEBERSIHAN') {
                    const current = new Date(start);
                    while (current <= end) {
                        const dayOfWeek = current.getDay();
                        // 0 = Sunday, 1-6 = Monday-Saturday
                        if (dayOfWeek !== 0) { // Not Sunday
                            workDays++;
                        }
                        current.setDate(current.getDate() + 1);
                    }
                    return workDays;
                }

                // SECURITY: 5-day rotation (P, PM, M, OFF, OFF)
                // Approximately 3 work days out of 5 = 60% of total days
                if (role === 'SECURITY') {
                    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
                    return Math.ceil(totalDays * 0.6); // 3/5 = 60%
                }

                // ADMIN & PIC: Typically don't have attendance (return 0)
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

                // Calculate & Record Performance ONLY for Present/Late
                if (att.status === 'PRESENT' || att.status === 'LATE') {
                    let performance = 100; // Start perfect
                    if (att.isLate) performance -= att.lateMinutes; // Deduct 1% per minute
                    if (att.isEarlyLeave) performance -= att.earlyLeaveMinutes; // Deduct 1% per minute
                    stats.performances.push(Math.max(0, performance));
                } else {
                    // For ABSENT/SICK/etc, do we count performance?
                    // Currently: Don't count them in "Average Performance of Attendance"
                    // If we want to penalize Absentism in performance score, we'd push 0 here.
                    // But usually performance score is "Quality of Attendance".
                    // The dashboard shows 0% if no attendance.
                    // If we don't push, stats.performances might be empty -> returns '0.0' in summary.
                    // This seems correct for Trio (0 Present).
                }
            });

            // Performance Summary Section
            if (userStats.size > 0) {
                yPos += 5;
                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.text('RESUME PERFORMANCE KARYAWAN', 14, yPos);

                // Add period info
                doc.setFontSize(8);
                doc.setFont('helvetica', 'normal');
                const periodText = `Periode: ${dateRange.start.toLocaleDateString('id-ID')} - ${dateRange.end.toLocaleDateString('id-ID')}`;
                doc.text(periodText, 14, yPos + 4);
                yPos += 6;

                const summaryData = Array.from(userStats.values()).map((stats, index) => {
                    const avgPerformance = stats.performances.length > 0
                        ? (stats.performances.reduce((a, b) => a + b, 0) / stats.performances.length).toFixed(1)
                        : '0.0';

                    // Calculate attendance rate based on expected work days
                    const attendanceRate = stats.expectedWorkDays > 0
                        ? ((stats.presentCount / stats.expectedWorkDays) * 100).toFixed(1)
                        : '0.0';

                    const absentDays = stats.expectedWorkDays - stats.presentCount;

                    const avgLateMinutes = stats.lateCount > 0
                        ? Math.round(stats.totalLateMinutes / stats.lateCount)
                        : 0;

                    return [
                        index + 1,
                        stats.name,
                        stats.employeeId,
                        stats.role,
                        stats.expectedWorkDays, // Expected work days
                        stats.presentCount, // Actual attendance
                        absentDays > 0 ? absentDays : '-', // Absent days
                        `${attendanceRate}%`, // Attendance rate
                        `${avgPerformance}%`,
                        stats.lateCount,
                        avgLateMinutes > 0 ? `${avgLateMinutes} mnt` : '-'
                    ];
                });

                autoTable(doc, {
                    startY: yPos + 3,
                    head: [['No', 'Nama', 'ID', 'Role', 'Hari Kerja', 'Hadir', 'Absen', 'Tingkat', 'Avg Perf', 'Telat', 'Avg Telat']],
                    body: summaryData,
                    styles: {
                        fontSize: 7,
                        cellPadding: 1.5,
                    },
                    headStyles: {
                        fillColor: [16, 185, 129], // Green
                        textColor: 255,
                        fontStyle: 'bold',
                        fontSize: 7,
                    },
                    alternateRowStyles: {
                        fillColor: [240, 253, 244],
                    },
                    margin: { top: 10, left: 14, right: 14 },
                    columnStyles: {
                        0: { cellWidth: 10 }, // No
                        1: { cellWidth: 35 }, // Nama
                        2: { cellWidth: 20 }, // ID
                        3: { cellWidth: 22 }, // Role
                        4: { cellWidth: 18 }, // Hari Kerja
                        5: { cellWidth: 15 }, // Hadir
                        6: { cellWidth: 15 }, // Absen
                        7: { cellWidth: 18 }, // Tingkat
                        8: { cellWidth: 20 }, // Avg Perf
                        9: { cellWidth: 15 }, // Telat
                        10: { cellWidth: 20 }, // Avg Telat
                    },
                });

                yPos = (doc as any).lastAutoTable.finalY + 10;
            }

            // Detail Attendance Section
            doc.setFontSize(12);
            doc.setFont('helvetica', 'bold');
            doc.text('DETAIL ABSENSI', 14, yPos);
            yPos += 2;

            // Table data
            const tableData = attendances.map((att, index) => [
                index + 1,
                att.user.name,
                att.user.employeeId,
                att.user.role,
                formatDate(att.clockIn),
                formatTime(att.clockIn),
                att.clockOut ? formatTime(att.clockOut) : 'Belum',
                att.shiftType || '-',
                att.status === 'PRESENT' ? 'HADIR' : att.status,
                att.isLate ? formatDuration(att.lateMinutes) : '-',
                att.isEarlyLeave ? formatDuration(att.earlyLeaveMinutes) : '-'
            ]);

            // Use autoTable - call it directly
            autoTable(doc, {
                startY: yPos + 3,
                head: [['No', 'Nama', 'ID', 'Role', 'Tanggal', 'In', 'Out', 'Shift', 'Status', 'Telat', 'Cepat']],
                body: tableData,
                styles: {
                    fontSize: 8,
                    cellPadding: 2,
                },
                headStyles: {
                    fillColor: [79, 70, 229],
                    textColor: 255,
                    fontStyle: 'bold',
                },
                alternateRowStyles: {
                    fillColor: [245, 247, 250],
                },
                margin: { top: 10, left: 14, right: 14 },
            });

            // Footer
            const pageCount = doc.internal.pages.length - 1;
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(8);
                doc.text(
                    `Halaman ${i} dari ${pageCount} | Dicetak: ${new Date().toLocaleString('id-ID')}`,
                    doc.internal.pageSize.getWidth() / 2,
                    doc.internal.pageSize.getHeight() - 10,
                    { align: 'center' }
                );
            }

            // Open PDF in new tab instead of downloading
            const pdfBlob = doc.output('blob');
            const pdfUrl = URL.createObjectURL(pdfBlob);
            window.open(pdfUrl, '_blank');

            // Clean up the URL after a delay
            setTimeout(() => URL.revokeObjectURL(pdfUrl), 100);

            toast.success('PDF Berhasil Dibuat', {
                description: 'PDF dibuka di tab baru'
            });
        } catch (error) {
            console.error('PDF Export Error:', error);
            toast.error('Export PDF Gagal', {
                description: 'Terjadi kesalahan saat export PDF'
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
