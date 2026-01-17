'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
    Camera as CameraIcon,
    MapPin,
    Clock,
    CheckCircle2,
    AlertCircle,
    Loader2,
    RefreshCw,
    LogOut,
    MapPinCheck,
    CircleDashed
} from 'lucide-react';
import NextImage from 'next/image';
import { cn } from '@/lib/utils';
import { toZonedTime } from 'date-fns-tz';
import { TIMEZONE } from '@/lib/date-utils';
import { clockIn, clockOut, getTodayAttendance, getTodayUserShift } from '@/actions/attendance';
import { getSettings } from '@/actions/settings';
import { calculateDistance } from '@/lib/location-utils';
import { SHIFT_DETAILS, getShiftTimings } from '@/lib/schedule-utils';
import { toast } from 'sonner';

interface Attendance {
    id: string;
    userId: string;
    clockIn: Date;
    clockOut: Date | null;
    status: string;
    latitude?: number | null;
    longitude?: number | null;
    address?: string | null;
    image?: string | null;
    shiftType?: string | null;
    scheduledClockIn?: Date | null;
    scheduledClockOut?: Date | null;
    isLate?: boolean;
    lateMinutes?: number;
    isEarlyLeave?: boolean;
    earlyLeaveMinutes?: number;
}

export default function AttendanceClient({ user }: { user: { userId: string; role: string; name?: string } }) {
    const router = useRouter();
    const [time, setTime] = useState<Date | null>(null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const [message, setMessage] = useState('');
    const [location, setLocation] = useState<{ lat: number; lng: number; address: string } | null>(null);
    const [capturedImage, setCapturedImage] = useState<string | null>(null);
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [officeSettings, setOfficeSettings] = useState<{
        lat: number;
        lng: number;
        radius: number;
        name: string;
    } | null>(null);
    const [currentAttendance, setCurrentAttendance] = useState<Attendance | null>(null);
    const [checkingStatus, setCheckingStatus] = useState(true);
    const [settingsLoaded, setSettingsLoaded] = useState(false);
    const [todayShift, setTodayShift] = useState<string | null>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const startingCamera = useRef(false);

    useEffect(() => {
        setTime(new Date());
        const timer = setInterval(() => setTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    useEffect(() => {
        let isMounted = true;
        const init = async () => {
            // Load settings from database - REQUIRED
            const settings = await getSettings();
            if (!isMounted) return;

            if (settings.OFFICE_LAT && settings.OFFICE_LNG && settings.ALLOWED_RADIUS && settings.OFFICE_NAME) {
                setOfficeSettings({
                    lat: parseFloat(settings.OFFICE_LAT),
                    lng: parseFloat(settings.OFFICE_LNG),
                    radius: parseInt(settings.ALLOWED_RADIUS),
                    name: settings.OFFICE_NAME
                });
                setSettingsLoaded(true);
            } else {
                // Settings not configured in database
                setSettingsLoaded(false);
                toast.error("Pengaturan Lokasi Belum Dikonfigurasi", {
                    description: "Hubungi admin untuk mengatur lokasi absensi di halaman Settings."
                });
            }

            // Check today's attendance
            const today = await getTodayAttendance(user.userId);
            if (!isMounted) return;

            setCurrentAttendance(today);
            setCheckingStatus(false);

            // Only start camera if we need to clock in or clock out
            if (!today || !today.clockOut) {
                startCamera();
                getLocation();
            }

            // Fetch today's shift
            const shift = await getTodayUserShift(user.userId);
            if (isMounted) setTodayShift(shift);
        };
        init();

        return () => {
            isMounted = false;
            stopCamera();
        };
    }, [user.userId]);

    const startCamera = async () => {
        if (startingCamera.current) return;

        // Don't start if already active
        if (videoRef.current?.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            if (stream.active) {
                setIsCameraActive(true);
                return;
            }
        }

        startingCamera.current = true;
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: 'user' },
                audio: false
            });
            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                setIsCameraActive(true);
            }
        } catch (_err: unknown) {
            const err = _err as { name?: string };
            // Silently handle AbortError as it usually means a concurrent request was made
            if (err.name === 'AbortError') {
                console.warn("Camera initialization aborted - common in development React StrictMode");
                return;
            }

            console.error("Error accessing camera:", err);
            setStatus('error');
            setMessage('Gagal mengakses kamera. Pastikan izin kamera diberikan.');
            toast.error("Gagal Mengakses Kamera", { description: "Pastikan Anda memberikan izin akses kamera." });
        } finally {
            startingCamera.current = false;
        }
    };

    const stopCamera = () => {
        if (videoRef.current && videoRef.current.srcObject) {
            const stream = videoRef.current.srcObject as MediaStream;
            stream.getTracks().forEach(track => track.stop());
        }
    };

    const getLocation = () => {
        if (!navigator.geolocation) {
            setStatus('error');
            setMessage('Geolocation tidak didukung oleh browser Anda.');
            return;
        }

        const options = {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 0
        };

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                setLocation({
                    lat: latitude,
                    lng: longitude,
                    address: `Lokasi GPS: ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
                });
            },
            (error) => {
                console.error("Error getting location:", error);

                let errorMsg = 'Gagal mendapatkan lokasi.';
                switch (error.code) {
                    case error.PERMISSION_DENIED:
                        errorMsg = 'Izin lokasi ditolak. Mohon aktifkan izin lokasi di browser.';
                        break;
                    case error.POSITION_UNAVAILABLE:
                        errorMsg = 'Lokasi tidak tersedia.';
                        if (window.location.protocol === 'http:' && window.location.hostname !== 'localhost') {
                            errorMsg += ' (Hubungi Admin: HTTPS Required).';
                        }
                        break;
                    case error.TIMEOUT:
                        errorMsg = 'Waktu permintaan lokasi habis. Refresh halaman.';
                        break;
                }

                // Don't set hard error status yet, just show toast message, 
                // as GPS might perform better on retry or movement
                if (!location) {
                    setStatus('error');
                    setMessage(errorMsg);
                }
            },
            options
        );
    };

    const captureImage = () => {
        if (videoRef.current && canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            if (context) {
                canvasRef.current.width = videoRef.current.videoWidth;
                canvasRef.current.height = videoRef.current.videoHeight;
                context.drawImage(videoRef.current, 0, 0, canvasRef.current.width, canvasRef.current.height);
                const imageData = canvasRef.current.toDataURL('image/jpeg');
                setCapturedImage(imageData);
                return imageData;
            }
        }
        return null;
    };

    const uploadPhoto = async (imageData: string): Promise<string | null> => {
        try {
            const response = await fetch('/api/upload-attendance-photo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    image: imageData,
                    userId: user.userId
                })
            });

            if (!response.ok) {
                throw new Error('Failed to upload photo');
            }

            const data = await response.json();
            return data.path;
        } catch (error) {
            console.error('Error uploading photo:', error);
            toast.error("Gagal Upload Foto", { description: "Silakan coba lagi." });
            return null;
        }
    };

    const handleAction = async () => {
        if (user.role === 'ADMIN' || user.role === 'PIC' || user.role === 'RT') {
            toast.error("Emang situ Karyawan Mau Absen Juga ? 😀", {
                description: "Absen hanya untuk Security, Kebersihan, dan Lingkungan."
            });
            return;
        }

        if (!officeSettings) {
            toast.error("Gagal Memproses", { description: "Pengaturan lokasi tidak ditemukan." });
            return;
        }

        if (distance !== null && distance > officeSettings.radius) {
            toast.error("Di Luar Jangkauan", { description: `Anda berada ${Math.round(distance)}m dari lokasi absen.` });
            setStatus('error');
            setMessage(`Anda berada di luar radius ${officeSettings.name} (${Math.round(distance)}m).`);
            return;
        }

        if (!location) {
            toast.error("Lokasi Tidak Ditemukan", { description: "Sedang mencari koordinat GPS..." });
            getLocation();
            return;
        }

        setLoading(true);

        try {
            if (currentAttendance && !currentAttendance.clockOut) {
                // Handle Clock Out - Capture and upload photo
                let imageToSubmit = capturedImage;
                if (!imageToSubmit) {
                    imageToSubmit = captureImage();
                }

                if (!imageToSubmit) {
                    toast.error("Foto Diperlukan", { description: "Gagal mengambil foto dari kamera." });
                    setLoading(false);
                    return;
                }

                // Upload photo and get file path
                const photoPath = await uploadPhoto(imageToSubmit);
                if (!photoPath) {
                    toast.error("Gagal Upload Foto", { description: "Silakan coba lagi." });
                    setLoading(false);
                    return;
                }

                const result = await clockOut(currentAttendance.id, photoPath);
                if (result.success) {
                    toast.success('Hati-hati di Jalan!', { description: result.message });
                    setStatus('success');
                    setMessage('Absen Keluar Berhasil. Sampai jumpa besok!');
                    setCurrentAttendance(result.data as Attendance);
                    stopCamera();
                    // Redirect after 2 seconds
                    setTimeout(() => {
                        router.push('/');
                    }, 2000);
                } else {
                    toast.error('Gagal Absen Keluar', { description: result.message });
                }
            } else {
                // Handle Clock In
                let imageToSubmit = capturedImage;
                if (!imageToSubmit) {
                    imageToSubmit = captureImage();
                }

                if (!imageToSubmit) {
                    toast.error("Foto Diperlukan", { description: "Gagal mengambil foto dari kamera." });
                    setLoading(false);
                    return;
                }

                // Upload photo and get file path
                const photoPath = await uploadPhoto(imageToSubmit);
                if (!photoPath) {
                    toast.error("Gagal Upload Foto", { description: "Silakan coba lagi." });
                    setLoading(false);
                    return;
                }

                const result = await clockIn(user.userId, location, photoPath);
                if (result.success) {
                    toast.success('Selamat Bekerja!', { description: result.message });
                    setStatus('success');
                    setMessage(result.message);
                    setCurrentAttendance(result.data as Attendance); // Update state to reflect clock-in
                    stopCamera();
                    // Redirect after 2 seconds
                    setTimeout(() => {
                        router.push('/');
                    }, 2000);
                } else {
                    toast.error('Gagal Absen Masuk', { description: result.message });
                    setStatus('error');
                    setMessage(result.message);
                }
            }
        } catch (_err) {
            console.error(_err);
            toast.error("Terjadi Kesalahan", { description: "Silakan coba lagi." });
        } finally {
            setLoading(false);
        }
    };

    const distance = (location && officeSettings)
        ? calculateDistance(location.lat, location.lng, officeSettings.lat, officeSettings.lng)
        : null;

    const isOutside = distance !== null && officeSettings ? distance > officeSettings.radius : false;
    const isClockedIn = currentAttendance && !currentAttendance.clockOut;
    const isFinished = currentAttendance && currentAttendance.clockOut;

    if (checkingStatus) {
        return (
            <div className="flex h-screen items-center justify-center space-x-2 text-slate-400">
                <Loader2 className="animate-spin" />
                <span className="text-xs font-bold uppercase tracking-widest">Memuat Data Absensi...</span>
            </div>
        );
    }

    if (!settingsLoaded || !officeSettings) {
        return (
            <div className="flex flex-col h-screen items-center justify-center space-y-4 p-6 text-center">
                <div className="p-4 rounded-full bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400">
                    <AlertCircle size={40} />
                </div>
                <div className="space-y-2">
                    <h2 className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">Konfigurasi Dibutuhkan</h2>
                    <p className="text-sm text-slate-500 dark:text-slate-400 max-w-xs mx-auto">
                        Lokasi absensi belum diatur oleh Admin. Silakan hubungi Admin untuk melakukan pengaturan di menu Settings.
                    </p>
                </div>
                <button
                    onClick={() => router.push('/')}
                    className="px-6 py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs uppercase tracking-widest hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
                >
                    Kembali ke Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            <div className="text-center space-y-1">
                <h1 className="text-xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight">Presensi Kehadiran</h1>
                <p className="text-[10px] md:text-base text-slate-500 dark:text-slate-400">Silahkan lakukan absen masuk/keluar di bawah ini.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-8">
                {/* Left Side: Real-time Clock and Location */}
                <div className="space-y-4 md:space-y-6">
                    <div className="rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-200 bg-white p-5 md:p-8 text-center shadow-lg md:shadow-2xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none">
                        <div className="inline-flex h-14 w-14 md:h-20 md:w-20 items-center justify-center rounded-2xl md:rounded-3xl bg-indigo-50 text-indigo-600 dark:bg-indigo-900/20 dark:text-indigo-400 mb-4 md:mb-6">
                            <Clock size={24} className="md:w-10 md:h-10" />
                        </div>
                        <div className="space-y-0.5 md:space-y-1">
                            <span className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{isClockedIn ? "Waktu Pulang Menunggu" : "Waktu Sekarang"}</span>
                            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white tabular-nums tracking-tighter">
                                {time ? time.toLocaleTimeString('id-ID', { hour12: false, timeZone: TIMEZONE }) : "--:--:--"}
                            </h2>
                            <p className="text-[10px] md:text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                                {time ? time.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: TIMEZONE }) : "Loading..."}
                            </p>
                        </div>

                        <div className={cn(
                            "mt-6 md:mt-8 flex flex-col items-center space-y-1 md:space-y-2 py-3 md:py-4 px-4 md:px-6 rounded-xl md:rounded-2xl mx-auto w-full md:w-fit transition-all text-center",
                            location ? (isOutside ? "bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400") : "bg-slate-50 text-slate-400 dark:bg-slate-800"
                        )}>
                            <div className="flex flex-col md:flex-row items-center justify-center space-y-1 md:space-y-0 md:space-x-2 text-[9px] md:text-xs font-black uppercase tracking-widest">
                                <div className="flex items-center space-x-1">
                                    <MapPin size={12} className={location ? "animate-bounce md:w-4 md:h-4" : "md:w-4 md:h-4"} />
                                    <span>{location ? (isOutside ? `Di Luar Radius` : `Dalam Radius`) : "Mencari Lokasi..."}</span>
                                </div>
                                {location && (
                                    <span className="hidden md:inline">•</span>
                                )}
                                {location && officeSettings && (
                                    <span className="opacity-80">{officeSettings.name} {distance && isOutside && `(${Math.round(distance)}m)`}</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Status Info Card */}
                    {isFinished ? (
                        <div className="rounded-[1.5rem] md:rounded-[2rem] border p-4 md:p-6 flex items-start space-x-3 md:space-x-4 border-emerald-100 bg-emerald-50/50 dark:border-emerald-900/30 dark:bg-emerald-900/5">
                            <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 bg-emerald-100 dark:bg-emerald-900/30">
                                <CheckCircle2 className="text-emerald-600 md:w-5 md:h-5" size={16} />
                            </div>
                            <div className="space-y-0.5 md:space-y-1">
                                <p className="text-[10px] md:text-xs font-bold leading-relaxed uppercase tracking-tight text-emerald-800 dark:text-emerald-300">
                                    Presensi Hari Ini Selesai
                                </p>
                                <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Anda sudah Clock In dan Clock Out.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className={cn(
                            "rounded-[1.5rem] md:rounded-[2rem] border p-4 md:p-6 flex items-start space-x-3 md:space-x-4",
                            isOutside ? "border-rose-100 bg-rose-50/50 dark:border-rose-900/30 dark:bg-rose-900/5" : "border-amber-100 bg-amber-50/50 dark:border-amber-900/30 dark:bg-amber-900/5"
                        )}>
                            <div className={cn(
                                "h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl flex items-center justify-center shrink-0",
                                isOutside ? "bg-rose-100 dark:bg-rose-900/30" : "bg-amber-100 dark:bg-amber-900/30"
                            )}>
                                <AlertCircle className={`${isOutside ? "text-rose-600" : "text-amber-600"} md:w-5 md:h-5`} size={16} />
                            </div>
                            <div className="space-y-0.5 md:space-y-1">
                                <p className={cn("text-[10px] md:text-xs font-bold leading-relaxed uppercase tracking-tight", isOutside ? "text-rose-800 dark:text-rose-300" : "text-amber-800 dark:text-amber-300")}>
                                    {isOutside ? `Jarak terlalu jauh dari kantor.` : `Area Presensi: ${officeSettings?.name}`}
                                </p>
                                <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                    Maksimal Radius: {officeSettings?.radius} Meter
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Today's Shift Card */}
                    {todayShift && todayShift !== 'OFF' && user.role !== 'ADMIN' && user.role !== 'PIC' && (
                        <div className={cn(
                            "rounded-[1.5rem] md:rounded-[2rem] border p-4 md:p-6 flex flex-col space-y-3",
                            "border-indigo-100 bg-indigo-50/30 dark:border-indigo-900/20 dark:bg-indigo-900/5"
                        )}>
                            <div className="flex items-center space-x-3">
                                <div className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl flex items-center justify-center shrink-0 bg-indigo-100 dark:bg-indigo-900/30">
                                    <Clock className="text-indigo-600 md:w-5 md:h-5" size={16} />
                                </div>
                                <div className="space-y-0.5 md:space-y-1">
                                    <p className="text-[10px] md:text-xs font-bold leading-relaxed uppercase tracking-tight text-indigo-800 dark:text-indigo-300">
                                        Jadwal Shift Hari Ini
                                    </p>
                                    <p className="text-[8px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest">
                                        Pastikan Absen Tepat Waktu
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center justify-between p-3 md:p-4 rounded-xl md:rounded-2xl bg-white dark:bg-slate-900 border border-indigo-100/50 dark:border-indigo-900/30">
                                <div className="space-y-0.5">
                                    <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">Shift</span>
                                    <p className="text-sm md:text-lg font-black text-slate-900 dark:text-white uppercase tracking-tight leading-none">
                                        {(SHIFT_DETAILS as Record<string, { label: string; time: string }>)[todayShift]?.label || todayShift}
                                    </p>
                                </div>
                                <div className="text-right space-y-0.5">
                                    <span className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest">Jam Kerja</span>
                                    <p className="text-sm md:text-lg font-black text-indigo-600 dark:text-indigo-400 tabular-nums tracking-tight leading-none">
                                        {(SHIFT_DETAILS as Record<string, { label: string; time: string }>)[todayShift]?.time || '-'}
                                    </p>
                                </div>
                            </div>

                            {/* Progress Bar Berdasarkan Waktu Sekarang */}
                            {(() => {
                                const now = time || new Date();
                                const hour = toZonedTime(now, TIMEZONE).getHours();
                                const targetDate = new Date(now);

                                // Logika penyesuaian tanggal untuk shift yang melintasi tengah malam
                                // Jika jam 00-08 pagi dan shift adalah M atau PM, berarti itu shift dari 'kemarin'
                                if (hour < 8 && (todayShift === 'M' || todayShift === 'PM')) {
                                    targetDate.setDate(targetDate.getDate() - 1);
                                }

                                const timings = getShiftTimings(todayShift, targetDate);
                                if (!timings) return null;

                                const totalMs = timings.end.getTime() - timings.start.getTime();
                                const elapsedMs = now.getTime() - timings.start.getTime();
                                const progress = Math.max(0, Math.min(100, (elapsedMs / totalMs) * 100));

                                return (
                                    <div className="space-y-1.5 px-1">
                                        <div className="flex items-center justify-between text-[8px] font-black uppercase tracking-widest">
                                            <span className="text-slate-400">Progress Shift</span>
                                            <span className={cn("text-indigo-600", progress >= 100 ? "text-emerald-600" : "")}>
                                                {progress >= 100 ? "Selesai" : `${Math.floor(progress)}%`}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {/* Start Icon: In Attendance Status */}
                                            {currentAttendance ? (
                                                <div className="flex items-center justify-center shrink-0 h-8 w-8 rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-200 animate-in zoom-in duration-300">
                                                    <MapPinCheck size={18} className="stroke-[3]" />
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center shrink-0 h-8 w-8 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-300 border-2 border-dashed border-slate-200 dark:border-slate-700">
                                                    <CircleDashed size={14} className="animate-spin-slow opacity-50" />
                                                </div>
                                            )}

                                            <div className="flex-1 h-3 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden border border-indigo-100/30 dark:border-indigo-900/30 shadow-inner">
                                                <div
                                                    className={cn(
                                                        "h-full rounded-full transition-all duration-1000",
                                                        progress >= 100 ? "bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]" : "bg-indigo-600 shadow-[0_0_12px_rgba(79,70,229,0.5)]"
                                                    )}
                                                    style={{ width: `${progress}%` }}
                                                />
                                            </div>

                                            {/* End Icon: Out Attendance Status */}
                                            {currentAttendance?.clockOut ? (
                                                <div className="flex items-center justify-center shrink-0 h-8 w-8 rounded-xl bg-emerald-500 text-white shadow-lg shadow-emerald-200 animate-in zoom-in duration-300">
                                                    <MapPinCheck size={18} className="stroke-[3]" />
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center shrink-0 h-8 w-8 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-300 border-2 border-dashed border-slate-200 dark:border-slate-700">
                                                    <div className="w-2 h-2 rounded-full bg-slate-200" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                );
                            })()}

                            {/* Attendance Window Info */}
                            {(() => {
                                const now = time || new Date();
                                const hour = toZonedTime(now, TIMEZONE).getHours();
                                const targetDate = new Date(now);
                                if (hour < 8 && (todayShift === 'M' || todayShift === 'PM')) {
                                    targetDate.setDate(targetDate.getDate() - 1);
                                }

                                const timings = getShiftTimings(todayShift, targetDate);
                                if (!timings) return null;

                                const targetTime = isClockedIn ? timings.end : timings.start;
                                const windowStart = new Date(targetTime.getTime() - 2 * 60 * 60 * 1000);
                                const windowEnd = new Date(targetTime.getTime() + 2 * 60 * 60 * 1000);

                                return (
                                    <div className="mt- 2 pt-2 border-t border-indigo-100/50 dark:border-indigo-900/30 flex items-center justify-between text-[8px] md:text-[10px] font-bold uppercase tracking-widest text-indigo-400">
                                        <span>Jendela {isClockedIn ? 'Pulang' : 'Masuk'} :</span>
                                        <span>
                                            {windowStart.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE })}
                                            <span className="mx-1">-</span>
                                            {windowEnd.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', timeZone: TIMEZONE })} WIB
                                        </span>
                                    </div>
                                );
                            })()}
                        </div>
                    )}
                </div>

                {/* Right Side: Action Card */}
                <div className="flex flex-col space-y-4 md:space-y-6">
                    <div className="flex-1 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-200 bg-white p-5 md:p-8 shadow-lg md:shadow-2xl shadow-slate-200/50 dark:border-slate-800 dark:bg-slate-900 dark:shadow-none flex flex-col items-center justify-center text-center space-y-4 md:space-y-6 relative overflow-hidden">

                        {!isFinished && (
                            <div className="w-full aspect-[3/4] max-w-[220px] md:max-w-[280px] rounded-[1.5rem] md:rounded-[2rem] bg-slate-100 dark:bg-slate-800 border-2 border-dashed border-slate-300 dark:border-slate-700 flex flex-col items-center justify-center text-slate-400 relative group overflow-hidden shadow-inner">
                                {capturedImage ? (
                                    <NextImage src={capturedImage} fill unoptimized className="object-cover rounded-[1.5rem] md:rounded-[2rem]" alt="Captured" />
                                ) : (
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        className="w-full h-full object-cover rounded-[1.5rem] md:rounded-[2rem] mirror"
                                    />
                                )}

                                {!capturedImage && !isCameraActive && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-100 dark:bg-slate-800">
                                        <CameraIcon size={32} className="mb-2 opacity-20 md:w-12 md:h-12" />
                                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest opacity-50 px-4">Kamera...</span>
                                    </div>
                                )}

                                {capturedImage && (
                                    <button
                                        onClick={() => { setCapturedImage(null); startCamera(); }}
                                        className="absolute bottom-3 right-3 md:bottom-4 md:right-4 h-10 w-10 md:h-12 md:w-12 bg-white/90 dark:bg-slate-900/90 backdrop-blur rounded-xl md:rounded-2xl flex items-center justify-center text-slate-600 dark:text-white shadow-xl hover:scale-110 active:scale-90 transition-all"
                                    >
                                        <RefreshCw size={16} className="md:w-5 md:h-5" />
                                    </button>
                                )}
                            </div>
                        )}
                        <canvas ref={canvasRef} className="hidden" />

                        <div className="w-full space-y-4">
                            {status === 'success' ? (
                                <div className="animate-in zoom-in duration-500 text-emerald-600 flex flex-col items-center space-y-3 py-4">
                                    <div className="h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                                        <CheckCircle2 size={32} />
                                    </div>
                                    <div className="space-y-1">
                                        <span className="text-xl font-black uppercase tracking-tighter">{message || "Berhasil!"}</span>
                                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Terima kasih atas dedikasi Anda.</p>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {status === 'error' && (
                                        <div className="p-4 rounded-2xl bg-rose-50 text-rose-600 text-[10px] font-black uppercase tracking-widest border border-rose-100 animate-in shake-2 mb-4">
                                            ⚠️ {message}
                                        </div>
                                    )}

                                    {!isFinished && (
                                        <button
                                            onClick={handleAction}
                                            disabled={loading || !location}
                                            className={cn(
                                                "w-full py-4 md:py-5 rounded-[1.25rem] md:rounded-[1.5rem] text-[10px] md:text-sm font-black uppercase tracking-[0.2em] text-white shadow-xl transition-all active:scale-95 disabled:opacity-30 flex items-center justify-center space-x-2 md:space-x-3",
                                                isClockedIn
                                                    ? "bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-700 hover:to-rose-800 shadow-rose-200"
                                                    : "bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-indigo-200 dark:shadow-none"
                                            )}
                                        >
                                            {loading ? (
                                                <>
                                                    <Loader2 size={16} className="animate-spin md:w-5 md:h-5" />
                                                    <span>Memproses...</span>
                                                </>
                                            ) : (
                                                isClockedIn ? (
                                                    <>
                                                        <LogOut size={16} className="md:w-5 md:h-5" />
                                                        <span>Absen Keluar</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <CameraIcon size={16} className="md:w-5 md:h-5" />
                                                        <span>Absen Masuk</span>
                                                    </>
                                                )
                                            )}
                                        </button>
                                    )}
                                </>
                            )}
                        </div>

                        <button className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors">
                            Punya Kendala? Hubungi Admin
                        </button>
                    </div>
                </div>
            </div>

            <style jsx>{`
                .mirror {
                    transform: scaleX(-1);
                }
                .animate-spin-slow {
                    animation: spin 3s linear infinite;
                }
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `}</style>
        </div>
    );
}
