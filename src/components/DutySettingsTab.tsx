'use client';

import React, { useState, useEffect } from 'react';
import { Shield, Trash, Flower2, Save, Loader2, Info, ClipboardList } from 'lucide-react';
import { toast } from 'sonner';
import { getSettings, updateSettings } from '@/actions/settings';

export default function DutySettingsTab() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [securityDuty, setSecurityDuty] = useState('');
    const [cleaningDuty, setCleaningDuty] = useState('');
    const [environmentDuty, setEnvironmentDuty] = useState('');

    useEffect(() => {
        const loadDuties = async () => {
            try {
                const settings = await getSettings();
                setSecurityDuty(settings.DUTY_SECURITY || '');
                setCleaningDuty(settings.DUTY_KEBERSIHAN || '');
                setEnvironmentDuty(settings.DUTY_LINGKUNGAN || '');
            } catch (error) {
                console.error('Failed to load duties:', error);
            } finally {
                setLoading(false);
            }
        };
        loadDuties();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        try {
            const result = await updateSettings({
                DUTY_SECURITY: securityDuty,
                DUTY_KEBERSIHAN: cleaningDuty,
                DUTY_LINGKUNGAN: environmentDuty
            });

            if (result.success) {
                toast.success('Tugas & Kewajiban Berhasil Diperbarui');
            } else {
                throw new Error(result.message);
            }
        } catch (error) {
            toast.error('Gagal Menyimpan', {
                description: 'Terjadi kesalahan saat menyimpan data.'
            });
        } finally {
            setSaving(false);
        }
    };

    const handleSeedTemplate = () => {
        if (!confirm('Gunakan draf standar untuk semua divisi? Teks yang ada saat ini akan ditimpa.')) return;

        setSecurityDuty(`1. Pengawasan Gerbang (Gate Keeping):
- Melakukan pemeriksaan terhadap tamu atau kurir yang masuk sesuai prosedur (tukar identitas/izin via intercom).
- Mencatat nomor kendaraan dan identitas tamu dalam buku mutasi.

2. Patroli Rutin:
- Melakukan patroli keliling cluster minimal 2-3 jam sekali (terutama pada jam rawan).
- Memastikan rumah yang ditinggal pergi (kosong) dalam keadaan terkunci dan aman.

3. Pengaturan Parkir:
- Memastikan kendaraan penghuni atau tamu parkir dengan rapi dan tidak mengganggu akses jalan/evakuasi.

4. Penanganan Darurat:
- Siap siaga jika terjadi kebakaran, pencurian, atau gangguan medis dengan segera menghubungi pihak terkait.

5. Laporan Harian:
- Membuat laporan riwayat absensi dan kejadian menonjol setiap pergantian shift.`);

        setCleaningDuty(`1. Jadwal Pengambilan:
- Melakukan pengambilan sampah dari depan rumah penghuni secara rutin (misal: Senin, Rabu, Jumat).

2. Pemilahan & Pembersihan:
- Memastikan tidak ada ceceran sampah saat proses pengangkutan ke bak sampah pusat (TPS).
- Membersihkan sisa air sampah (lindi) yang berceceran di jalan agar tidak menimbulkan bau.

3. Perawatan Bak Sampah:
- Menjaga kebersihan area bak sampah pusat agar tidak menjadi sarang lalat atau tikus.

4. Koordinasi Eksternal:
- Memastikan truk sampah dari Dinas Kebersihan melakukan pengangkutan tepat waktu dari TPS Cluster ke TPA.`);

        setEnvironmentDuty(`1. Perawatan Tanaman:
- Melakukan penyiraman tanaman di area taman umum dan jalur hijau secara rutin.
- Pemupukan dan penggantian tanaman yang mati secara berkala.

2. Perapihan (Pruning):
- Memangkas rumput dan tanaman yang sudah terlalu tinggi atau menutupi rambu jalan/lampu penerangan.
- Merapikan dahan pohon yang berisiko patah atau mengenai kabel listrik.

3. Pembersihan Drainase:
- Memastikan saluran air (selokan) bebas dari sumbatan sampah atau sedimen tanah untuk mencegah banjir.

4. Menjaga Fasilitas Umum:
- Memastikan area bermain anak (playground) dan jogging track bersih dari gulma atau kotoran.

5. Estetika Visual:
- Melaporkan jika ada lampu taman yang mati atau cat fasilitas umum yang sudah pudar untuk segera diperbaiki.`);

        toast.success('Template berhasil dimuat. Jangan lupa klik Simpan.');
    };

    if (loading) {
        return (
            <div className="flex h-[400px] items-center justify-center space-x-2 text-slate-400">
                <Loader2 className="animate-spin" />
                <span className="text-xs font-bold uppercase tracking-widest text-slate-400">Memuat Data...</span>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="grid gap-6 lg:grid-cols-1">
                {/* Security Duty */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600">
                                <Shield size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Divisi Security</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tugas & Tanggung Jawab Keamanan</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        <textarea
                            value={securityDuty}
                            onChange={(e) => setSecurityDuty(e.target.value)}
                            className="w-full h-48 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-medium leading-relaxed focus:ring-2 focus:ring-indigo-500/20 outline-none transition-all text-slate-700 dark:text-slate-300"
                            placeholder="Masukkan rincian tugas security (pisahkan dengan baris baru)..."
                        />
                    </div>
                </div>

                {/* Cleaning Duty */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600">
                                <Trash size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Divisi Kebersihan</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tugas & Tanggung Jawab Sanitasi</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        <textarea
                            value={cleaningDuty}
                            onChange={(e) => setCleaningDuty(e.target.value)}
                            className="w-full h-48 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-medium leading-relaxed focus:ring-2 focus:ring-emerald-500/20 outline-none transition-all text-slate-700 dark:text-slate-300"
                            placeholder="Masukkan rincian tugas kebersihan..."
                        />
                    </div>
                </div>

                {/* Environment Duty */}
                <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                    <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-xl bg-orange-50 dark:bg-orange-900/20 text-orange-600">
                                <Flower2 size={20} />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight">Divisi Lingkungan</h3>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Tugas & Tanggung Jawab Estetika</p>
                            </div>
                        </div>
                    </div>
                    <div className="p-6">
                        <textarea
                            value={environmentDuty}
                            onChange={(e) => setEnvironmentDuty(e.target.value)}
                            className="w-full h-48 p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-medium leading-relaxed focus:ring-2 focus:ring-orange-500/20 outline-none transition-all text-slate-700 dark:text-slate-300"
                            placeholder="Masukkan rincian tugas lingkungan..."
                        />
                    </div>
                </div>
            </div>

            {/* Save Button Sidebar Floating Style */}
            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                <button
                    onClick={handleSeedTemplate}
                    className="flex items-center justify-center gap-2 px-6 py-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95"
                >
                    <ClipboardList size={18} />
                    Gunakan Template Standar
                </button>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center justify-center gap-2 px-8 py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-indigo-200 dark:shadow-none transition-all active:scale-95 disabled:opacity-50"
                >
                    {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                    {saving ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
            </div>

            <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800 flex items-start gap-4">
                <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-800 text-blue-600 dark:text-blue-300">
                    <Info size={16} />
                </div>
                <div className="space-y-1">
                    <p className="text-xs font-black text-blue-700 dark:text-blue-300 uppercase tracking-tight">Tips Penulisan SOP</p>
                    <p className="text-[10px] font-medium text-blue-600/80 dark:text-blue-300/60 leading-relaxed">
                        Gunakan poin-poin atau baris baru untuk memudahkan staf membaca tugas mereka. Teks yang tertulis di sini akan ditampilkan di dashboard masing-masing personil sebagai panduan kerja resmi (SOP).
                    </p>
                </div>
            </div>
        </div>
    );
}
