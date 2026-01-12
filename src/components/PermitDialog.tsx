'use client';

import React, { useState } from 'react';
import { Plus, Calendar, FileText, FileImage, Loader2, X } from 'lucide-react';
import { createPermit } from '@/actions/permits';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export default function PermitDialog({ userId }: { userId: string }) {
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);

    const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        } else {
            setImagePreview(null);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);

        const formData = new FormData(e.currentTarget);
        formData.append('userId', userId);

        const result = await createPermit(formData);
        setLoading(false);

        if (result.success) {
            toast.success('Berhasil!', {
                description: result.message
            });
            setIsOpen(false);
            setImagePreview(null);
        } else {
            toast.error('Gagal!', {
                description: result.message.includes('Foreign key')
                    ? 'ID User tidak valid. Silakan Logout dan Login kembali untuk menyegarkan data.'
                    : result.message
            });
        }
    };

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-200 dark:shadow-none flex items-center space-x-2 px-6 h-12 transition-all active:scale-95"
            >
                <Plus size={18} />
                <span className="font-bold">Ajukan Izin</span>
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-[2rem] md:rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 relative flex flex-col max-h-[95vh] md:max-h-[90vh]">
                        {/* Close button */}
                        <button
                            onClick={() => setIsOpen(false)}
                            className="absolute right-4 md:right-6 top-4 md:top-6 p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 z-10 transition-colors"
                        >
                            <X size={20} className="md:w-6 md:h-6" />
                        </button>

                        <div className="flex-1 overflow-y-auto p-5 md:p-8 scrollbar-hide">
                            <div className="space-y-3 md:space-y-4 mb-6 md:mb-8">
                                <div className="h-10 w-10 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 flex items-center justify-center">
                                    <FileText size={20} className="md:w-7 md:h-7" />
                                </div>
                                <div>
                                    <h3 className="text-lg md:text-2xl font-black text-slate-900 dark:text-white tracking-tight uppercase">Form Pengajuan</h3>
                                    <p className="text-[9px] md:text-[10px] font-black text-slate-400 uppercase tracking-widest mt-1">Isi data ijin atau pergantian shift Anda dengan benar.</p>
                                </div>
                            </div>

                            <form onSubmit={handleSubmit} id="permit-form" className="space-y-6 font-sans">
                                <div className="space-y-4">
                                    {/* Tipe Izin */}
                                    <div className="space-y-1.5 md:space-y-2">
                                        <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1 font-sans">Jenis Pengajuan</label>
                                        <select
                                            name="type"
                                            required
                                            className="w-full px-4 py-3 md:py-4 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-900 dark:text-white appearance-none h-12 md:h-14 text-xs"
                                        >
                                            <option value="IZIN">IZIN (TIDAK MASUK KERJA)</option>
                                            <option value="PERUBAHAN_SHIFT">PERUBAHAN SHIFT</option>
                                            <option value="SAKIT">SAKIT (BEROBAT/ISTIRAHAT)</option>
                                        </select>
                                    </div>

                                    {/* Tanggal */}
                                    {(() => {
                                        const today = new Date().toISOString().split('T')[0];
                                        return (
                                            <div className="grid grid-cols-2 gap-3 md:gap-4">
                                                <div className="space-y-1.5 md:space-y-2">
                                                    <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Dari Tanggal</label>
                                                    <div className="relative">
                                                        <Calendar className="absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} className="md:w-4 md:h-4" />
                                                        <input
                                                            type="date"
                                                            name="startDate"
                                                            required
                                                            min={today}
                                                            className="w-full pl-10 md:pl-11 pr-3 md:pr-4 py-3 md:py-4 h-12 md:h-14 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-900 dark:text-white text-xs"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="space-y-1.5 md:space-y-2">
                                                    <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Sampai Tanggal</label>
                                                    <div className="relative">
                                                        <Calendar className="absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2 text-slate-400" size={14} className="md:w-4 md:h-4" />
                                                        <input
                                                            type="date"
                                                            name="endDate"
                                                            required
                                                            min={today}
                                                            className="w-full pl-10 md:pl-11 pr-3 md:pr-4 py-3 md:py-4 h-12 md:h-14 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-900 dark:text-white text-xs"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })()}

                                    {/* Alasana */}
                                    <div className="space-y-1.5 md:space-y-2">
                                        <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Alasan Pengajuan</label>
                                        <textarea
                                            name="reason"
                                            required
                                            rows={2}
                                            className="w-full px-4 py-3 md:py-4 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-900 dark:text-white text-[11px] md:text-xs font-sans"
                                            placeholder="Tuliskan alasan lengkap Anda..."
                                        />
                                    </div>

                                    {/* Lampiran */}
                                    <div className="space-y-1.5 md:space-y-2 border-b border-transparent pb-2">
                                        <label className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Lampiran Dokumen/Foto</label>
                                        <div className="relative">
                                            <FileImage className="absolute left-3.5 md:left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} className="md:w-5 md:h-5" />
                                            <input
                                                type="file"
                                                name="image"
                                                accept="image/*"
                                                onChange={handleImageChange}
                                                className="w-full pl-10 md:pl-12 pr-3 md:pr-4 py-3 md:py-4 h-12 md:h-14 rounded-xl md:rounded-2xl bg-slate-50 dark:bg-slate-800 border-none ring-1 ring-slate-200 dark:ring-slate-700 focus:ring-2 focus:ring-indigo-500 transition-all font-bold text-slate-900 dark:text-white text-[9px] md:text-[10px]"
                                            />
                                        </div>

                                        {imagePreview && (
                                            <div className="mt-3 relative group animate-in slide-in-from-top-2 duration-300">
                                                <div className="rounded-2xl overflow-hidden border-2 border-slate-200 dark:border-slate-700 shadow-lg">
                                                    <img
                                                        src={imagePreview}
                                                        alt="Preview"
                                                        className="w-full h-auto max-h-48 md:max-h-64 object-contain bg-slate-50 dark:bg-slate-800"
                                                    />
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setImagePreview(null);
                                                        const fileInput = document.querySelector('input[name="image"]') as HTMLInputElement;
                                                        if (fileInput) fileInput.value = '';
                                                    }}
                                                    className="absolute top-2 right-2 p-2 rounded-full bg-rose-500 hover:bg-rose-600 text-white shadow-lg transition-all active:scale-95"
                                                >
                                                    <X size={16} />
                                                </button>
                                                <div className="mt-2 text-center">
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Preview Lampiran</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </form>
                        </div>

                        <div className="p-5 md:p-8 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                            <button
                                type="submit"
                                form="permit-form"
                                disabled={loading}
                                className="w-full h-14 md:h-16 rounded-xl md:rounded-[1.5rem] bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase tracking-[0.2em] shadow-xl shadow-indigo-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center space-x-2 text-xs md:text-sm"
                            >
                                {loading ? <Loader2 className="animate-spin" size={18} /> : <span>Kirim Pengajuan</span>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
