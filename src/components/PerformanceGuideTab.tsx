import React from 'react';
import { Calculator, Users, TrendingUp, Info, BookOpen, Clock, LogIn, LogOut, Repeat } from 'lucide-react';

export default function PerformanceGuideTab() {
    return (
        <div className="space-y-6">
            {/* Quick Summary */}
            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-2xl border border-indigo-200 dark:border-indigo-800 p-6">
                <div className="flex items-start gap-4">
                    <div className="shrink-0 p-3 rounded-xl bg-indigo-600 text-white">
                        <Info className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Panduan Perhitungan Performance</h3>
                        <p className="text-sm text-slate-700 dark:text-slate-300 mb-4">
                            Sistem ini menghitung hari kerja, tingkat kehadiran, dan performance karyawan berdasarkan role dan shift pattern masing-masing.
                        </p>
                        <div className="grid md:grid-cols-3 gap-3">
                            <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900">
                                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">LINGKUNGAN & KEBERSIHAN</p>
                                <p className="text-[11px] text-slate-600 dark:text-slate-400">Senin-Sabtu (6 hari/minggu)</p>
                            </div>
                            <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900">
                                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">SECURITY</p>
                                <p className="text-[11px] text-slate-600 dark:text-slate-400">Pattern 5 hari (60% hari kerja)</p>
                            </div>
                            <div className="p-3 rounded-lg bg-white dark:bg-slate-800 border border-indigo-100 dark:border-indigo-900">
                                <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mb-1">ADMIN & PIC</p>
                                <p className="text-[11px] text-slate-600 dark:text-slate-400">Tidak ada kewajiban absensi</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Card 1: Perhitungan Hari Kerja */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20">
                            <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Perhitungan Hari Kerja</h2>
                            <p className="text-xs text-slate-500">Berdasarkan Role & Shift Pattern</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* LINGKUNGAN & KEBERSIHAN */}
                        <div className="p-4 rounded-xl bg-teal-50 dark:bg-teal-900/10 border border-teal-200 dark:border-teal-800">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold text-sm text-teal-900 dark:text-teal-100">LINGKUNGAN & KEBERSIHAN</h3>
                                <span className="px-2 py-1 rounded-md bg-teal-600 text-white text-[10px] font-bold">6 Hari/Minggu</span>
                            </div>
                            <p className="text-xs text-teal-700 dark:text-teal-300 mb-2">
                                <strong>Jadwal:</strong> Senin - Sabtu | <strong>Libur:</strong> Minggu
                            </p>
                            <div className="p-2 rounded bg-white dark:bg-slate-800 text-xs font-mono">
                                Hari Kerja = Total Hari - Jumlah Minggu
                            </div>
                            <div className="mt-2 p-2 rounded bg-teal-100 dark:bg-teal-900/20 text-xs">
                                <strong>Contoh:</strong> Januari (31 hari - 4 Minggu) = <strong className="text-teal-600">27 hari kerja</strong>
                            </div>
                        </div>

                        {/* SECURITY */}
                        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold text-sm text-blue-900 dark:text-blue-100">SECURITY</h3>
                                <span className="px-2 py-1 rounded-md bg-blue-600 text-white text-[10px] font-bold">60% Hari</span>
                            </div>
                            <p className="text-xs text-blue-700 dark:text-blue-300 mb-2">
                                <strong>Pattern:</strong> P, PM, M, OFF, OFF (3 dari 5 hari)
                            </p>
                            <div className="p-2 rounded bg-white dark:bg-slate-800 text-xs font-mono">
                                Hari Kerja = Total Hari × 0.6
                            </div>
                            <div className="mt-2 p-2 rounded bg-blue-100 dark:bg-blue-900/20 text-xs">
                                <strong>Contoh:</strong> Januari (31 hari × 0.6) = <strong className="text-blue-600">19 hari kerja</strong>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 2: Performance Harian */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg p-6 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-indigo-50 dark:bg-indigo-900/20">
                            <Calculator className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Perhitungan Performance</h2>
                            <p className="text-xs text-slate-500">Formula & Contoh Kasus</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {/* Formula */}
                        <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-200 dark:border-indigo-800">
                            <h3 className="font-bold text-sm text-indigo-900 dark:text-indigo-100 mb-3">Formula Dasar</h3>
                            <div className="space-y-2 text-xs">
                                <div className="p-3 rounded bg-white dark:bg-slate-800 font-mono">
                                    Performance = 100%<br />
                                    - (Menit Telat × 0.5%, max -30%)<br />
                                    - (Menit Cepat × 0.5%, max -30%)
                                </div>
                            </div>
                        </div>

                        {/* Contoh Kasus */}
                        <div className="space-y-2">
                            <h3 className="font-bold text-sm text-slate-900 dark:text-white">Contoh Kasus:</h3>

                            <div className="p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-100">✅ Tepat Waktu</span>
                                    <span className="px-2 py-0.5 rounded bg-emerald-600 text-white text-[10px] font-bold">100%</span>
                                </div>
                                <p className="text-[11px] text-emerald-700 dark:text-emerald-300">
                                    Telat: 0 menit | Pulang Cepat: 0 menit
                                </p>
                            </div>

                            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold text-amber-900 dark:text-amber-100">⚠️ Telat 20 Menit</span>
                                    <span className="px-2 py-0.5 rounded bg-amber-600 text-white text-[10px] font-bold">90%</span>
                                </div>
                                <p className="text-[11px] text-amber-700 dark:text-amber-300">
                                    100% - (20 × 0.5%) = 90%
                                </p>
                            </div>

                            <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800">
                                <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs font-bold text-rose-900 dark:text-rose-100">❌ Telat 80 Menit</span>
                                    <span className="px-2 py-0.5 rounded bg-rose-600 text-white text-[10px] font-bold">70%</span>
                                </div>
                                <p className="text-[11px] text-rose-700 dark:text-rose-300">
                                    100% - (80 × 0.5% = 40%, max 30%) = 70%
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Card 3: Standar Penilaian */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg p-6 space-y-4 lg:col-span-2">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-orange-50 dark:bg-orange-900/20">
                            <TrendingUp className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Standar Penilaian Performance</h2>
                            <p className="text-xs text-slate-500">Kategori & Kriteria Penilaian</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6">
                        {/* Tingkat Kehadiran */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Tingkat Kehadiran</h3>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800">
                                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-100">Excellent</span>
                                    <span className="text-xs text-emerald-700 dark:text-emerald-300">≥ 95%</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800">
                                    <span className="text-xs font-bold text-blue-900 dark:text-blue-100">Baik</span>
                                    <span className="text-xs text-blue-700 dark:text-blue-300">90% - 94.9%</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                                    <span className="text-xs font-bold text-amber-900 dark:text-amber-100">Cukup</span>
                                    <span className="text-xs text-amber-700 dark:text-amber-300">80% - 89.9%</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800">
                                    <span className="text-xs font-bold text-rose-900 dark:text-rose-100">Kurang</span>
                                    <span className="text-xs text-rose-700 dark:text-rose-300">&lt; 80%</span>
                                </div>
                            </div>
                        </div>

                        {/* Keterlambatan */}
                        <div>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-3">Rata-rata Keterlambatan</h3>
                            <div className="space-y-2">
                                <div className="flex items-center justify-between p-3 rounded-lg bg-emerald-50 dark:bg-emerald-900/10 border border-emerald-200 dark:border-emerald-800">
                                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-100">Baik</span>
                                    <span className="text-xs text-emerald-700 dark:text-emerald-300">&lt; 0 menit</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                                    <span className="text-xs font-bold text-amber-900 dark:text-amber-100">Cukup</span>
                                    <span className="text-xs text-amber-700 dark:text-amber-300">5 - 10 menit</span>
                                </div>
                                <div className="flex items-center justify-between p-3 rounded-lg bg-rose-50 dark:bg-rose-900/10 border border-rose-200 dark:border-rose-800">
                                    <span className="text-xs font-bold text-rose-900 dark:text-rose-100">Kurang</span>
                                    <span className="text-xs text-rose-700 dark:text-rose-300">&gt; 15 menit</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Aturan & Jendela Waktu Absensi */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-lg p-6 space-y-6">
                <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20">
                        <Clock className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Aturan & Jendela Waktu Absensi</h2>
                        <p className="text-xs text-slate-500">Batasan Waktu Masuk & Pulang</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                    {/* Aturan Masuk */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                            <LogIn className="w-4 h-4 text-emerald-500" />
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">Absen Masuk (IN)</h3>
                        </div>

                        <div className="space-y-3">
                            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Toleransi Terlambat</p>
                                <p className="text-sm font-bold text-rose-600 dark:text-rose-400">0 Menit (Strict)</p>
                                <p className="text-[12px] text-slate-500 mt-1 italic">Absen melewati menit jadwal (misal 08:01) langsung dicatat "TERLAMBAT".</p>
                            </div>

                            <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">Jendela Waktu</p>
                                <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300">± 2 Jam dari Jadwal</p>
                                <p className="text-[12px] text-indigo-600/70 dark:text-indigo-400/70 mt-1 leading-relaxed">
                                    Tombol absen hanya aktif **2 jam sebelum** sampai **2 jam sesudah** waktu masuk.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Aturan Pulang */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 pb-2 border-b border-slate-100 dark:border-slate-800">
                            <LogOut className="w-4 h-4 text-rose-500" />
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">Absen Pulang (OUT)</h3>
                        </div>

                        <div className="space-y-3">
                            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5">Toleransi Pulang Cepat</p>
                                <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400">5 Menit</p>
                                <p className="text-[12px] text-slate-500 mt-1 italic leading-relaxed">
                                    Diizinkan pulang 5 menit sebelum jadwal tanpa dianggap "PULANG CEPAT".
                                    Hal ini untuk mengantisipasi transisi personil yang melakukan **Shift Terusan** (menggantikan rekan yang berhalangan), di mana karyawan bisa mendapatkan kelonggaran untuk melakukan **Absensi OUT** kemudian langsung **Absensi IN**.
                                </p>
                            </div>

                            <div className="p-4 rounded-xl bg-indigo-50 dark:bg-indigo-900/10 border border-indigo-100 dark:border-indigo-800">
                                <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1.5">Jendela Waktu</p>
                                <p className="text-sm font-bold text-indigo-700 dark:text-indigo-300">± 2 Jam dari Jadwal</p>
                                <p className="text-[12px] text-indigo-600/70 dark:text-indigo-400/70 mt-1 leading-relaxed">
                                    Tombol pulang hanya aktif **2 jam sebelum** sampai **2 jam sesudah** waktu pulang.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Prosedur Khusus: Shift Terusan */}
            <div className="bg-gradient-to-br from-indigo-600 to-blue-700 rounded-2xl shadow-xl shadow-indigo-200 dark:shadow-none p-6 text-white mb-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 rounded-xl bg-white/20 backdrop-blur-md">
                        <Repeat className="w-6 h-6 text-white" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold tracking-tight">Prosedur Khusus: Shift Terusan</h2>
                        <p className="text-xs text-indigo-100 uppercase tracking-widest font-bold">Panduan Operasional Admin</p>
                    </div>
                </div>

                <div className="grid md:grid-cols-3 gap-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-indigo-600 text-[10px] font-black">1</span>
                            <h3 className="text-xs font-black uppercase tracking-wider">Update Jadwal</h3>
                        </div>
                        <p className="text-[12px] text-indigo-100 leading-relaxed">
                            Admin merubah jadwal karyawan di menu **Schedules** (Manual Override) menjadi shift yang diteruskan (misal: dari **P** dirubah ke **M**). Ini bisa dilakukan ketika Karyawan sudah melakukan Absen **IN** schedule normal, setelah itu admin bisa kapan saja merubah schedule terusan sebelum tiba waktu **IN Terusan** tanpa merusak absen pagi.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-indigo-600 text-[10px] font-black">2</span>
                            <h3 className="text-xs font-black uppercase tracking-wider">Proses Absensi</h3>
                        </div>
                        <p className="text-[12px] text-indigo-100 leading-relaxed">
                            Karyawan wajib melakukan **Absensi OUT** untuk menutup shift pertama (Pagi), kemudian langsung melakukan **Absensi IN** untuk membuka shift kedua (Malam).
                        </p>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <span className="flex items-center justify-center w-5 h-5 rounded-full bg-white text-indigo-600 text-[10px] font-black">3</span>
                            <h3 className="text-xs font-black uppercase tracking-wider">Snapshot Sistem</h3>
                        </div>
                        <p className="text-[12px] text-indigo-100 leading-relaxed">
                            Sistem mengunci jadwal saat tombol ditekan. Perubahan jadwal di tengah hari tidak akan merubah data **Clock IN** yang sudah masuk sebelumnya.
                        </p>
                    </div>
                </div>

                <div className="mt-6 p-4 rounded-xl bg-white/10 backdrop-blur-sm border border-white/20 flex items-start gap-3">
                    <Info size={16} className="shrink-0 mt-0.5 text-indigo-200" />
                    <p className="text-[12px] text-indigo-50 leading-relaxed">
                        <strong>Kesimpulan untuk Admin</strong>: Admin tidak perlu standby jam 20:00. Cukup perbarui jadwal segera setelah mendapat laporan. Karyawan tetap bisa absen ganda asalkan proses **OUT** shift pertama sudah dilakukan.
                    </p>
                </div>
            </div>

            {/* How to Use */}
            <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl border border-purple-200 dark:border-purple-800 p-6">
                <div className="flex items-start gap-4">
                    <div className="shrink-0 p-3 rounded-xl bg-purple-600 text-white">
                        <BookOpen className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-3">Cara Menggunakan Laporan PDF</h3>
                        <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                            <li className="flex items-start gap-2">
                                <span className="shrink-0 w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold mt-0.5">1</span>
                                <span>Buka halaman <strong>Riwayat Absensi</strong></span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="shrink-0 w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold mt-0.5">2</span>
                                <span>Pilih <strong>Filter</strong> (karyawan & periode tanggal) sesuai kebutuhan</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="shrink-0 w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold mt-0.5">3</span>
                                <span>Klik tombol <strong>Export PDF</strong> untuk membuat laporan</span>
                            </li>
                            <li className="flex items-start gap-2">
                                <span className="shrink-0 w-5 h-5 rounded-full bg-purple-600 text-white flex items-center justify-center text-[10px] font-bold mt-0.5">4</span>
                                <span>PDF akan terbuka di tab baru dengan <strong>Resume Performance</strong> dan <strong>Detail Absensi</strong></span>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </div>
    );
}
