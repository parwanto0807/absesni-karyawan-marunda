'use client';

import React, { useState } from 'react';
import { Gift, Download, Loader2, PartyPopper, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { jsPDF } from 'jspdf';
import { claimVoucherAction } from '@/actions/performance';
import { toast } from 'sonner';

interface VoucherClaimProps {
    userId: string;
    userName: string;
    employeeId: string;
    role: string;
    month: string;
    isAlreadyClaimed: boolean;
    claimedAt: Date | null;
}

const VoucherClaim: React.FC<VoucherClaimProps> = ({ userId, userName, employeeId, role, month, isAlreadyClaimed, claimedAt }) => {
    const [isGenerating, setIsGenerating] = useState(false);
    const [claimed, setClaimed] = useState(isAlreadyClaimed);
    const [timeLeft, setTimeLeft] = useState<number>(0);

    // Calculate initial time left
    React.useEffect(() => {
        if (claimedAt) {
            const expiryTime = new Date(claimedAt).getTime() + 30 * 60 * 1000;
            const now = Date.now();
            setTimeLeft(Math.max(0, Math.floor((expiryTime - now) / 1000)));
        }
    }, [claimedAt]);

    // Timer effect
    React.useEffect(() => {
        if (!timeLeft || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => Math.max(0, prev - 1));
        }, 1000);

        return () => clearInterval(timer);
    }, [timeLeft]);

    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = seconds % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const isExpired = claimed && timeLeft === 0 && !!claimedAt;

    const generatePDF = async () => {
        setIsGenerating(true);
        try {
            // Only record claim if not already claimed
            if (!claimed) {
                const result = await claimVoucherAction();
                if (!result.success) {
                    toast.error(result.error || 'Gagal merekam klaim voucher.');
                    setIsGenerating(false);
                    return;
                }
                setClaimed(true);
                // Set timer immediately after claim (approx 30 mins)
                setTimeLeft(30 * 60);
            }

            const doc = new jsPDF({
                orientation: 'landscape',
                unit: 'mm',
                format: [150, 100], // Custom voucher size
            });

            // 1. Load Logo & User Photo
            const [logoBase64, userPhotoBase64] = await Promise.all([
                new Promise<string>((resolve) => {
                    const img = new Image();
                    img.src = '/logo_marunda.png';
                    img.crossOrigin = 'Anonymous';
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext('2d');
                        ctx?.drawImage(img, 0, 0);
                        resolve(canvas.toDataURL('image/png'));
                    };
                    img.onerror = () => resolve('');
                }),
                new Promise<string>((resolve) => {
                    const img = new Image();
                    img.src = `/api/images/users/${userId}?t=${Date.now()}`;
                    img.crossOrigin = 'Anonymous';
                    img.onload = () => {
                        const canvas = document.createElement('canvas');
                        canvas.width = img.width;
                        canvas.height = img.height;
                        const ctx = canvas.getContext('2d');

                        // Square crop for user photo
                        const size = Math.min(img.width, img.height);
                        const x = (img.width - size) / 2;
                        const y = (img.height - size) / 2;

                        canvas.width = size;
                        canvas.height = size;
                        ctx?.drawImage(img, x, y, size, size, 0, 0, size, size);

                        resolve(canvas.toDataURL('image/jpeg'));
                    };
                    img.onerror = () => resolve('');
                })
            ]);

            // 2. Background styling
            doc.setFillColor(249, 250, 251); // gray-50
            doc.rect(0, 0, 150, 100, 'F');

            // 3. Border / Frame
            doc.setDrawColor(79, 70, 229); // indigo-600
            doc.setLineWidth(2);
            doc.rect(5, 5, 140, 90);

            doc.setDrawColor(79, 70, 229, 0.2);
            doc.setLineWidth(0.5);
            doc.rect(7, 7, 136, 86);

            // 4. Logo inclusion
            if (logoBase64) {
                doc.addImage(logoBase64, 'PNG', 15, 12, 25, 25);
            }

            // 5. Title Header
            doc.setTextColor(15, 23, 42); // slate-900
            doc.setFont('helvetica', 'bold');
            doc.setFontSize(22);
            doc.text('EXCELLENCE VOUCHER', 45, 25);

            doc.setFontSize(10);
            doc.setTextColor(71, 85, 105); // slate-600
            doc.setFont('helvetica', 'normal');
            doc.text('REWARD FOR 100% PERFORMANCE', 45, 32);

            // Role-based message
            doc.setFontSize(9);
            doc.setTextColor(79, 70, 229); // indigo-600
            doc.setFont('helvetica', 'italic');
            let appreciationMsg = 'Terima kasih atas kontribusi luar biasa Anda.';
            if (role.toUpperCase().includes('SECURITY')) {
                appreciationMsg = 'Pertahankan dedikasi Anda sebagai penjaga keamanan terbaik.';
            } else if (role.toUpperCase().includes('LINGKUNGAN')) {
                appreciationMsg = 'Terima kasih atas dedikasi Anda menjaga lingkungan Marunda.';
            } else if (role.toUpperCase().includes('KEBERSIHAN')) {
                appreciationMsg = 'Terima kasih atas dedikasi Anda menjaga kebersihan area Marunda.';
            }
            doc.text(appreciationMsg, 45, 38);

            // 6. Dividing Line
            doc.setDrawColor(226, 232, 240); // slate-200
            doc.line(15, 42, 135, 42);

            // 7. Recipient Details
            doc.setFontSize(12);
            doc.setTextColor(15, 23, 42); // slate-900
            doc.setFont('helvetica', 'bold');
            doc.text('Nama Karyawan:', 15, 52);
            doc.setFont('helvetica', 'normal');
            doc.text(userName.toUpperCase(), 55, 52);

            doc.setFont('helvetica', 'bold');
            doc.text('EmployeeID:', 15, 60);
            doc.setFont('helvetica', 'normal');
            doc.text(employeeId || '-', 55, 60);

            doc.setFont('helvetica', 'bold');
            doc.text('Jabatan:', 15, 68);
            doc.setFont('helvetica', 'normal');
            doc.text(role, 55, 68);

            doc.setFont('helvetica', 'bold');
            doc.text('Periode:', 15, 76);
            doc.setFont('helvetica', 'normal');
            doc.text(month, 55, 76);

            // 8. Footer / Photo Area
            if (userPhotoBase64) {
                // Background for photo
                doc.setDrawColor(79, 70, 229);
                doc.setLineWidth(0.5);
                doc.rect(105, 48, 32, 32);
                doc.addImage(userPhotoBase64, 'JPEG', 106, 49, 30, 30);

                doc.setTextColor(79, 70, 229);
                doc.setFontSize(7);
                doc.setFont('helvetica', 'bold');
                doc.text('AUTHORIZED RECIPIENT', 106, 84);
            } else {
                doc.setFillColor(79, 70, 229);
                doc.rect(100, 50, 35, 35, 'F');
                doc.setTextColor(255, 255, 255);
                doc.setFontSize(8);
                doc.setFont('helvetica', 'bold');
                doc.text('AUTHORIZED', 105, 65);
                doc.text('MARUNDA', 108, 70);
            }

            // 9. Serial Number
            const serial = `VO-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
            doc.setTextColor(148, 163, 184); // slate-400
            doc.setFontSize(8);
            doc.text(`Serial: ${serial}`, 15, 88);
            doc.text(`Generated: ${new Date().toLocaleString()}`, 110, 88);

            const blobUrl = doc.output('bloburl');
            window.open(blobUrl, '_blank');
            toast.success(claimed ? 'Voucher berhasil dibuka kembali!' : 'Voucher berhasil dicetak & dibuka!');
        } catch (error) {
            console.error('Error generating PDF:', error);
            toast.error('Gagal mencetak voucher.');
        } finally {
            setIsGenerating(false);
        }
    };

    if (isExpired) {
        return (
            <div className="mt-6 p-6 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 text-center opacity-70 grayscale">
                <p className="text-slate-500 font-medium">Voucher Kadaluarsa. Kesempatan 30 menit sudah habis.</p>
            </div>
        );
    }

    return (
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="relative mt-6 group"
            >
                {/* Glow Effect */}
                <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200 animate-pulse"></div>

                <div className="relative bg-white dark:bg-slate-900 rounded-[2rem] p-6 border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                    {/* Background Pattern */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl font-sans" />

                    <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                        <div className="flex items-center space-x-6">
                            <div className="relative">
                                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200 dark:shadow-none animate-bounce">
                                    <Gift size={32} />
                                </div>
                                <div className="absolute -top-2 -right-2">
                                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-pink-500 text-[10px] font-black text-white shadow-lg shadow-pink-200">
                                        100%
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-1">
                                <h4 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                                    Reward Sempurna! <PartyPopper className="text-pink-500" size={20} />
                                </h4>
                                <p className="text-sm text-slate-500 font-medium leading-tight">
                                    Luar biasa, {userName}! Performa Anda 100% bulan ini. <br />
                                    Ambil voucher spesial Marunda sebagai bentuk apresiasi kami.
                                </p>
                                {claimed && timeLeft > 0 && (
                                    <p className="text-xs font-bold text-rose-500 animate-pulse mt-1">
                                        ⚠️ Mohon segera simpan/cetak! Waktu tersisa: {formatTime(timeLeft)}
                                    </p>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={generatePDF}
                            disabled={isGenerating}
                            className={`
                                relative group/btn flex items-center space-x-3 px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs transition-all active:scale-95 disabled:opacity-70 disabled:active:scale-100
                                ${claimed
                                    ? 'bg-emerald-500 text-white shadow-emerald-200 hover:bg-emerald-600'
                                    : 'bg-indigo-600 text-white shadow-indigo-200 hover:bg-black hover:shadow-indigo-300'
                                }
                                shadow-xl dark:shadow-none
                            `}
                        >
                            {isGenerating ? (
                                <>
                                    <Loader2 className="animate-spin" size={18} />
                                    <span>Mencetak...</span>
                                </>
                            ) : (
                                <>
                                    {claimed ? <CheckCircle2 size={18} /> : <Download size={18} className="group-hover/btn:translate-y-0.5 transition-transform" />}
                                    <span className="relative z-10">{claimed ? 'Lihat Voucher' : 'Ambil Voucher'}</span>
                                    {!claimed && <div className="absolute -inset-1 rounded-2xl border-2 border-indigo-400 opacity-0 group-hover/btn:opacity-100 animate-ping" />}
                                </>
                            )}
                        </button>
                    </div>

                    {/* Confetti-like small elements */}
                    <AnimatePresence>
                        {!claimed && (
                            <div className="absolute top-2 left-1/2 -translate-x-1/2 flex space-x-8 opacity-20 pointer-events-none">
                                {[...Array(3)].map((_, i) => (
                                    <motion.div
                                        key={i}
                                        animate={{ y: [0, -10, 0], opacity: [0.2, 0.5, 0.2] }}
                                        transition={{ duration: 2, repeat: Infinity, delay: i * 0.4 }}
                                        className="w-1 h-1 rounded-full bg-indigo-500"
                                    />
                                ))}
                            </div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>
        </AnimatePresence>
    );
};

export default VoucherClaim;
