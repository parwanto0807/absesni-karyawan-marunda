import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { toast } from 'sonner';

interface User {
    name: string;
    role: string;
    department?: string;
}

interface Comment {
    createdAt: string;
    user: User;
    content: string;
}

interface IncidentReport {
    id: string;
    category: string;
    status: string;
    createdAt: string;
    user: User;
    address: string | null;
    latitude: number;
    longitude: number;
    description: string;
    evidenceImg?: string | null;
    comments?: Comment[];
    priority?: string;
    severity?: string;
    incidentDate?: string;
    assignedTo?: string;
    area?: string;
    unit?: string;
    actionDetail: string | null;
    analysis: string | null;
    improvement: string | null;
}

interface JsPDFCustom {
    internal: {
        pageSize: {
            getWidth: () => number;
            getHeight: () => number;
        };
    };
    lastAutoTable: {
        finalY: number;
    };
    getNumberOfPages: () => number;
    setPage: (page: number) => void;
    setFont: (font: string, style: string) => void;
    setFontSize: (size: number) => void;
    setTextColor: (r: number, g: number, b: number, a?: number) => void;
    setFillColor: (r: number, g: number, b: number) => void;
    setDrawColor: (r: number, g: number, b: number, a?: number) => void;
    setLineWidth: (width: number) => void;
    rect: (x: number, y: number, w: number, h: number, style?: string) => void;
    roundedRect: (x: number, y: number, w: number, h: number, rx: number, ry: number, style?: string) => void;
    line: (x1: number, y1: number, x2: number, y2: number) => void;
    text: (text: string | string[], x: number, y: number, options?: { align?: string, angle?: number }) => void;
    addImage: (img: string, format: string, x: number, y: number, w: number, h: number) => void;
    addPage: () => void;
    splitTextToSize: (text: string, width: number) => string[];
    getTextWidth: (text: string) => number;
    getImageProperties: (img: string) => { width: number, height: number };
    output: (type: string) => unknown;
}

export const generateIncidentPDF = async (
    report: IncidentReport,
    options?: {
        includeAnalytics?: boolean;
        confidential?: boolean;
        recipient?: string;
        compact?: boolean;
    }
) => {
    try {
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4',
            compress: true
        }) as unknown as JsPDFCustom;

        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        const margin = 15; // Reduced margin
        const compact = options?.compact ?? true;

        // Maritime/Beach Theme Color Scheme
        const colors: Record<string, [number, number, number]> = {
            primary: [2, 48, 71],      // Navy Blue (Deep Sea)
            secondary: [33, 158, 188],  // Cyan (Ocean Surface)
            accent: [255, 183, 3],     // Gold/Sand (Beach)
            success: [2, 128, 144],     // Teal (Deep Ocean)
            warning: [251, 133, 0],     // Orange (Sunset)
            danger: [208, 0, 0],        // Deep Red (Warning Buoy)
            light: [241, 250, 238],     // Seafoam (Very Light Blue/Green)
            dark: [2, 48, 71],          // Navy
            gray: [100, 116, 139],
            border: [168, 218, 220],    // Pale Blue (Waves)
            white: [255, 255, 255]
        };

        const contentWidth = pageWidth - (margin * 2);
        const gutter = 4;
        const col3Width = (contentWidth - (gutter * 2)) / 3;
        const col2Width = (contentWidth - gutter) / 2;

        // Helper functions
        const drawDivider = (y: number) => {
            doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
            doc.setLineWidth(0.2);
            doc.line(margin, y, pageWidth - margin, y);
        };

        const getStatusColor = (status: string) => {
            const statusLower = status.toLowerCase();
            if (statusLower.includes('selesai') || statusLower.includes('closed')) {
                return colors.success;
            }
            if (statusLower.includes('progress') || statusLower.includes('dalam')) {
                return colors.accent;
            }
            if (statusLower.includes('baru') || statusLower.includes('new')) {
                return colors.danger;
            }
            return colors.gray;
        };

        const getPriorityColor = (priority: string = '') => {
            const priorityLower = priority.toLowerCase();
            if (priorityLower.includes('tinggi') || priorityLower.includes('high')) {
                return colors.danger;
            }
            if (priorityLower.includes('sedang') || priorityLower.includes('medium')) {
                return colors.warning;
            }
            if (priorityLower.includes('rendah') || priorityLower.includes('low')) {
                return colors.success;
            }
            return colors.gray;
        };

        // 1. COMPACT HEADER
        const headerHeight = 30;

        // Simple header background
        doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.rect(0, 0, pageWidth, headerHeight, 'F');

        // Logo/Title
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(12);
        doc.setFont('helvetica', 'bold');
        doc.text('LAPORAN INSIDEN', margin, 15);

        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');
        doc.text('BPL Marunda Security System', margin, 21);

        // Report ID - Compact
        doc.setFontSize(9);
        doc.text(`ID: ${report.id}`, pageWidth - margin, 21, { align: 'right' });

        // 2. INCIDENT SUMMARY - Compact Grid
        let currentY = headerHeight + 10;

        // Title
        doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
        doc.setFontSize(10);
        doc.setFont('helvetica', 'bold');
        doc.text('RINGKASAN INSIDEN', margin, currentY);
        currentY += 5;

        // Compact grid (2 columns)
        const gridData = [
            {
                label: 'Kategori',
                value: report.category
            },
            {
                label: 'Status',
                value: report.status,
                color: getStatusColor(report.status)
            },
            {
                label: 'Prioritas',
                value: report.priority || 'Medium',
                color: getPriorityColor(report.priority)
            },
            {
                label: 'Tanggal',
                value: format(new Date(report.incidentDate || report.createdAt), 'dd/MM/yy HH:mm', { locale: id }) + ' WIB'
            },
            {
                label: 'Pelapor',
                value: `${report.user.name} (${report.user.role})`
            },
            {
                label: 'Penanggung Jawab',
                value: report.assignedTo || 'Belum Ditentukan'
            }
        ];


        gridData.forEach((item, index) => {
            const row = Math.floor(index / 2);
            const col = index % 2;
            const x = margin + col * (col3Width + gutter);
            const y = currentY + row * 11;

            // Background
            doc.setFillColor(250, 252, 248);
            doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
            doc.setLineWidth(0.1);
            doc.roundedRect(x, y, col3Width, 10, 0.5, 0.5, 'FD');

            // Label
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(6);
            doc.setTextColor(colors.gray[0], colors.gray[1], colors.gray[2]);
            doc.text(item.label, x + 2.5, y + 3.5);

            // Value
            if (item.color) {
                doc.setTextColor(item.color[0], item.color[1], item.color[2]);
            } else {
                doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
            }
            doc.setFont('helvetica', 'normal');
            doc.setFontSize(7);

            const valueLines = doc.splitTextToSize(item.value, col3Width - 5);
            doc.text(valueLines, x + 2.5, y + 7.5);
        });

        // 5. EVIDENCE (3rd Col)
        if (report.evidenceImg) {
            try {
                const imgX = margin + 2 * (col3Width + gutter);
                const imgY = currentY;
                const imgMaxW = col3Width;
                const imgMaxH = 32;

                const imgProps = doc.getImageProperties(report.evidenceImg);
                const ratio = imgProps.height / imgProps.width;

                let finalWidth = imgMaxW;
                let finalHeight = finalWidth * ratio;

                if (finalHeight > imgMaxH) {
                    finalHeight = imgMaxH;
                    finalWidth = finalHeight / ratio;
                }

                // Center photo in its column
                const centeringOffset = (col3Width - finalWidth) / 2;

                doc.setDrawColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
                doc.setLineWidth(0.3);
                doc.rect(imgX + centeringOffset - 0.2, imgY - 0.2, finalWidth + 0.4, finalHeight + 0.4, 'D');

                doc.addImage(report.evidenceImg, 'JPEG', imgX + centeringOffset, imgY, finalWidth, finalHeight);

                doc.setFontSize(6);
                doc.setTextColor(colors.gray[0], colors.gray[1], colors.gray[2]);
                doc.text('Bukti Visual', imgX + col3Width / 2, imgY + finalHeight + 3, { align: 'center' });
            } catch (e) {
                console.warn('PDF Image Error:', e);
            }
        }

        currentY += 38;
        drawDivider(currentY);
        currentY += 4;
        drawDivider(currentY);
        currentY += 4;

        // 3. LOCATION & DETAILS - Compact Table
        doc.setFontSize(9);
        doc.setFont('helvetica', 'bold');
        doc.text('LOKASI & DETAIL', margin, currentY);
        currentY += 6;

        const details = [
            ['Lokasi', report.address || `${report.latitude.toFixed(4)}, ${report.longitude.toFixed(4)}`],
            ['Koordinat', `${report.latitude.toFixed(6)}, ${report.longitude.toFixed(6)}`],
            ['Departemen', report.user.department || report.area || 'Semua Departemen'],
            ['Unit', report.unit || 'N/A']
        ];

        autoTable(doc, {
            startY: currentY,
            margin: { left: margin, right: margin },
            body: details,
            theme: 'grid',
            styles: {
                fontSize: 7.5,
                cellPadding: 2,
                lineColor: colors.border,
                lineWidth: 0.15,
                textColor: colors.dark
            },
            columnStyles: {
                0: { fontStyle: 'bold', cellWidth: 35, textColor: colors.gray },
                1: { cellWidth: 'auto' }
            },
            tableLineWidth: 0.2
        });

        currentY = doc.lastAutoTable.finalY + 8;

        // 4. INCIDENT DESCRIPTION
        doc.setFontSize(8.5);
        doc.setFont('helvetica', 'bold');
        doc.text('KETERANGAN & DETAIL KEJADIAN', margin, currentY);
        currentY += 5;

        // Space-saving description
        doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
        doc.setFontSize(8);
        doc.setFont('helvetica', 'normal');

        const description = report.description || 'Tidak ada deskripsi tersedia';
        const descLines = doc.splitTextToSize(description, pageWidth - 2 * margin - 6);
        doc.text(descLines, margin + 2, currentY + 3);

        currentY += Math.max(10, descLines.length * 3.5) + 6;

        // 5. ADMIN NOTES - NEW SECTION
        if (report.actionDetail || report.analysis || report.improvement) {
            doc.setFontSize(8.5);
            doc.setFont('helvetica', 'bold');
            doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
            doc.text('CATATAN & ANALISA ADMIN', margin, currentY);
            currentY += 5;

            const notes = [
                { label: 'TINDAKAN (ACTION)', value: report.actionDetail || '-' },
                { label: 'ANALISA (ANALYSIS)', value: report.analysis || '-' },
                { label: 'PERBAIKAN (IMPROVEMENT)', value: report.improvement || '-' }
            ];

            let maxNoteHeight = 0;
            const processedNotes = notes.map(note => {
                const lines = doc.splitTextToSize(note.value, col3Width - 4); // Balanced padding for readability
                const h = lines.length * 3.2 + 7;
                if (h > maxNoteHeight) maxNoteHeight = h;
                return { ...note, lines, height: h };
            });

            processedNotes.forEach((note, index) => {
                const x = margin + index * (col3Width + gutter);

                // Background & Clean Border
                doc.setFillColor(250, 252, 248);
                doc.setDrawColor(colors.border[0], colors.border[1], colors.border[2]);
                doc.setLineWidth(0.1);
                doc.rect(x, currentY + 4.5, col3Width, maxNoteHeight, 'FD');

                // Header box
                doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
                doc.rect(x, currentY, col3Width, 4.5, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(5.5);
                doc.text(note.label, x + (col3Width / 2), currentY + 3.2, { align: 'center' });

                // Content text - Clean left-aligned with proper padding
                doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(7);
                doc.text(note.lines, x + 2, currentY + 8.5);
            });

            currentY += maxNoteHeight + 8;
            drawDivider(currentY);
            currentY += 4;
        }



        // 6. COMMUNICATION LOG - ULTRA COMPACT
        if (report.comments && report.comments.length > 0) {
            drawDivider(currentY);
            currentY += 4;

            doc.setFontSize(8);
            doc.setFont('helvetica', 'bold');
            doc.text('DOKUMENTASI LOG (KRONOLOGI)', margin, currentY);
            currentY += 5;

            // Define displayComments for documentation log
            const displayComments = compact
                ? report.comments.slice(-10) // Show more in 2-column mode
                : report.comments;

            const logColWidth = (pageWidth - 2 * margin - 6) / 2;
            let maxRowY = currentY;
            let currentRowY = currentY;

            displayComments.forEach((comment: Comment, index: number) => {
                const col = index % 2;
                const x = margin + col * (logColWidth + 6);

                if (currentRowY > pageHeight - 20) {
                    if (col === 0) {
                        doc.addPage();
                        currentY = margin + 10;
                        currentRowY = currentY;
                    }
                }

                const yStart = currentRowY;

                // Full Date-Time Stamp
                const timeText = format(new Date(comment.createdAt), 'dd/MM, HH:mm', { locale: id });
                const timeWidth = doc.getTextWidth(timeText) + 3;

                doc.setFillColor(colors.secondary[0], colors.secondary[1], colors.secondary[2]);
                doc.rect(x, yStart, timeWidth, 4, 'F');

                doc.setTextColor(255, 255, 255);
                doc.setFontSize(5.5);
                doc.text(timeText, x + 1.5, yStart + 2.8);

                // Role & Name
                const roleX = x + timeWidth + 2;
                doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
                doc.setFont('helvetica', 'bold');
                doc.setFontSize(5.5);

                const roleName = `${(comment.user.role || 'PIC').toUpperCase()}: ${comment.user.name}`;
                doc.text(roleName.length > 28 ? roleName.substring(0, 25) + "..." : roleName, roleX, yStart + 2.8);

                // Message
                const messageY = yStart + 6;
                doc.setTextColor(colors.dark[0], colors.dark[1], colors.dark[2]);
                doc.setFont('helvetica', 'normal');
                doc.setFontSize(6.5);

                const messageLines = doc.splitTextToSize(comment.content, logColWidth - 6);
                doc.text(messageLines, x + 4, messageY);

                // Vertical timeline line
                doc.setDrawColor(colors.secondary[0], colors.secondary[1], colors.secondary[2], 0.2);
                doc.setLineWidth(0.15);
                doc.line(x + 2, yStart + 4, x + 2, messageY + (messageLines.length * 2.8));

                const itemBottom = messageY + (messageLines.length * 3);
                if (itemBottom > maxRowY) maxRowY = itemBottom;

                // End of row (after 2 columns)
                if (col === 1 || index === displayComments.length - 1) {
                    currentRowY = maxRowY + 1.5; // Very tight gap between pairs
                    maxRowY = currentRowY;
                }
            });

            currentY += 5;
        }

        // 7. MINIMAL FOOTER
        doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
        doc.rect(0, pageHeight - 15, pageWidth, 15, 'F');

        // Left - Print info
        doc.setTextColor(200, 200, 200);
        doc.setFontSize(7);
        doc.setFont('helvetica', 'normal');
        doc.text(
            `Dic: ${format(new Date(), 'dd/MM/yy HH:mm', { locale: id })}`,
            margin,
            pageHeight - 8
        );

        // Center - Document info
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(8);
        doc.text(
            'BPL Marunda - Dokumen Resmi',
            pageWidth / 2,
            pageHeight - 8,
            { align: 'center' }
        );

        // Right - Page info
        const pageCount = doc.getNumberOfPages();
        for (let i = 1; i <= pageCount; i++) {
            doc.setPage(i);
            doc.setTextColor(150, 150, 150);
            doc.setFontSize(7);
            doc.text(
                `${i}/${pageCount}`,
                pageWidth - margin,
                pageHeight - 8,
                { align: 'right' }
            );

            // Confidential watermark
            if (options?.confidential) {
                doc.setTextColor(255, 0, 0, 0.05);
                doc.setFontSize(40);
                doc.setFont('helvetica', 'bold');
                doc.text(
                    'RAHASIA',
                    pageWidth / 2,
                    pageHeight / 2,
                    { align: 'center', angle: 45 }
                );
            }
        }

        // Generate PDF
        const fileName = `LAP_${report.id}_${format(new Date(), 'yyMMdd')}.pdf`;
        const pdfBlob = doc.output('blob') as Blob;
        const pdfUrl = URL.createObjectURL(pdfBlob);

        // Open in new tab
        const newWindow = window.open(pdfUrl, '_blank');
        if (!newWindow) {
            toast.warning('Izinkan popup untuk melihat PDF', {
                description: 'Dokumen sudah dibuat, izinkan popup browser'
            });
        }

        // Download option
        const downloadLink = document.createElement('a');
        downloadLink.href = pdfUrl;
        downloadLink.download = fileName;
        document.body.appendChild(downloadLink);
        downloadLink.click();
        document.body.removeChild(downloadLink);

        // Cleanup
        setTimeout(() => URL.revokeObjectURL(pdfUrl), 1000);

        toast.success('Laporan PDF telah dibuat', {
            description: `File: ${fileName}`
        });

        return pdfBlob;

    } catch (error) {
        console.error('PDF Generation Error:', error);
        toast.error('Gagal membuat laporan PDF');
        throw error;
    }
};

// Additional utility for batch reports
export const generateSummaryPDF = async (reports: IncidentReport[]) => {
    const doc = new jsPDF() as unknown as JsPDFCustom;
    const pageWidth = doc.internal.pageSize.getWidth();


    // Ultra compact summary table
    const tableData = reports.map(report => [
        report.id,
        report.category,
        report.status,
        format(new Date(report.createdAt), 'dd/MM/yy', { locale: id }),
        report.user.name,
        report.priority || 'Medium'
    ]);

    autoTable(doc, {
        startY: 20,
        head: [['ID', 'Kategori', 'Status', 'Tanggal', 'Pelapor', 'Prioritas']],
        body: tableData,
        styles: { fontSize: 8, cellPadding: 2 },
        headStyles: {
            fillColor: [15, 23, 42],
            textColor: [255, 255, 255],
            fontSize: 7
        },
        theme: 'grid'
    });

    doc.setFontSize(9);
    doc.text(`Ringkasan ${reports.length} Insiden`, pageWidth / 2, 15, { align: 'center' });

    const pdfUrl = doc.output('bloburl') as string;
    window.open(pdfUrl, '_blank');
    toast.success('Ringkasan PDF dibuat');
};