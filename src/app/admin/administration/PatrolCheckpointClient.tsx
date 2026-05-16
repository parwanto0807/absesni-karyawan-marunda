'use client';

import React, { useState, useEffect } from 'react';
import { 
    MapPin, 
    Plus, 
    Trash2, 
    Save, 
    Edit2, 
    X, 
    Navigation,
    Shield,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { getAllCheckpoints, upsertCheckpoint, deleteCheckpoint } from '@/actions/patrol';

interface Checkpoint {
    id: string;
    name: string;
    location: string | null;
    latitude: number;
    longitude: number;
    isActive: boolean;
}

export default function PatrolCheckpointClient() {
    const [checkpoints, setCheckpoints] = useState<Checkpoint[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);

    // Form states
    const [name, setName] = useState('');
    const [location, setLocation] = useState('');
    const [latitude, setLatitude] = useState('');
    const [longitude, setLongitude] = useState('');

    useEffect(() => {
        fetchCheckpoints();
    }, []);

    const fetchCheckpoints = async () => {
        setIsLoading(true);
        const result = await getAllCheckpoints();
        if (result.success && result.data) {
            setCheckpoints(result.data as Checkpoint[]);
        } else {
            toast.error(result.message || 'Gagal mengambil data');
        }
        setIsLoading(false);
    };

    const handleGetLocation = () => {
        if (!navigator.geolocation) {
            toast.error('Geolokasi tidak didukung oleh browser Anda');
            return;
        }

        toast.info('Sedang mengambil koordinat GPS...');
        navigator.geolocation.getCurrentPosition(
            (position) => {
                setLatitude(position.coords.latitude.toString());
                setLongitude(position.coords.longitude.toString());
                toast.success('Koordinat berhasil diambil');
            },
            (error) => {
                toast.error('Gagal mengambil lokasi: ' + error.message);
            },
            { enableHighAccuracy: true }
        );
    };

    const handleSave = async () => {
        if (!name || !latitude || !longitude) {
            toast.error('Nama, Latitude, dan Longitude wajib diisi');
            return;
        }

        setIsSaving(true);
        const result = await upsertCheckpoint({
            id: editingId || undefined,
            name,
            location,
            latitude: parseFloat(latitude),
            longitude: parseFloat(longitude),
            isActive: true
        });

        if (result.success) {
            toast.success(editingId ? 'Titik berhasil diperbarui' : 'Titik berhasil ditambahkan');
            resetForm();
            fetchCheckpoints();
        } else {
            toast.error(result.message || 'Gagal menyimpan data');
        }
        setIsSaving(false);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Apakah Anda yakin ingin menghapus titik patroli ini?')) return;

        const result = await deleteCheckpoint(id);
        if (result.success) {
            toast.success('Titik berhasil dihapus');
            fetchCheckpoints();
        } else {
            toast.error(result.message || 'Gagal menghapus data');
        }
    };

    const startEdit = (cp: Checkpoint) => {
        setEditingId(cp.id);
        setName(cp.name);
        setLocation(cp.location || '');
        setLatitude(cp.latitude.toString());
        setLongitude(cp.longitude.toString());
        setShowAddForm(true);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const resetForm = () => {
        setEditingId(null);
        setName('');
        setLocation('');
        setLatitude('');
        setLongitude('');
        setShowAddForm(false);
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-600" />
                    Manajemen Titik Patroli
                </h2>
                {!showAddForm && (
                    <Button 
                        onClick={() => setShowAddForm(true)}
                        className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-[10px] font-black uppercase tracking-widest px-6"
                    >
                        <Plus className="w-4 h-4 mr-2" />
                        Tambah Titik Baru
                    </Button>
                )}
            </div>

            {showAddForm && (
                <div className="bg-white dark:bg-slate-900 rounded-[2rem] border-2 border-indigo-100 dark:border-indigo-900/30 p-6 shadow-xl shadow-indigo-500/5 animate-in slide-in-from-top duration-300">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-widest">
                            {editingId ? 'Edit Titik Patroli' : 'Tambah Titik Patroli Baru'}
                        </h3>
                        <Button variant="ghost" size="icon" onClick={resetForm} className="rounded-full">
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-4">
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Nama Titik / Pos</label>
                                <Input 
                                    placeholder="Misal: Pos Utama, Gerbang Belakang, dll"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50"
                                />
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Deskripsi Lokasi (Opsional)</label>
                                <Input 
                                    placeholder="Keterangan tambahan lokasi"
                                    value={location}
                                    onChange={(e) => setLocation(e.target.value)}
                                    className="rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50"
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Latitude</label>
                                    <Input 
                                        placeholder="-6.123456"
                                        value={latitude}
                                        onChange={(e) => setLatitude(e.target.value)}
                                        className="rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50"
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 px-1">Longitude</label>
                                    <Input 
                                        placeholder="106.123456"
                                        value={longitude}
                                        onChange={(e) => setLongitude(e.target.value)}
                                        className="rounded-xl border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50"
                                    />
                                </div>
                            </div>
                            <Button 
                                type="button"
                                variant="outline" 
                                onClick={handleGetLocation}
                                className="w-full rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50 text-[10px] font-black uppercase tracking-widest"
                            >
                                <Navigation className="w-4 h-4 mr-2" />
                                Ambil Koordinat Saya Sekarang
                            </Button>
                        </div>
                    </div>

                    <div className="flex gap-3 mt-8">
                        <Button 
                            onClick={handleSave}
                            disabled={isSaving}
                            className="flex-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-black uppercase text-[10px] tracking-widest py-6"
                        >
                            {isSaving ? 'Menyimpan...' : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Simpan Titik Patroli
                                </>
                            )}
                        </Button>
                        <Button 
                            variant="outline" 
                            onClick={resetForm}
                            className="rounded-xl border-slate-200 text-slate-400 font-black uppercase text-[10px] tracking-widest py-6"
                        >
                            Batal
                        </Button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {isLoading ? (
                    Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="h-40 bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 animate-pulse" />
                    ))
                ) : checkpoints.length === 0 ? (
                    <div className="col-span-full py-16 text-center bg-white dark:bg-slate-900 rounded-[2rem] border border-dashed border-slate-200 dark:border-slate-800">
                        <MapPin size={48} className="mx-auto mb-4 text-slate-200" />
                        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Belum ada titik patroli yang terdaftar</p>
                    </div>
                ) : (
                    checkpoints.map((cp) => (
                        <div key={cp.id} className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 p-5 group hover:border-indigo-200 transition-all">
                            <div className="flex items-start justify-between mb-4">
                                <div className="p-2.5 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl text-indigo-600">
                                    <MapPin size={20} />
                                </div>
                                <div className="flex gap-1">
                                    <Button variant="ghost" size="icon" onClick={() => startEdit(cp)} className="rounded-lg h-8 w-8 text-slate-400 hover:text-indigo-600">
                                        <Edit2 size={14} />
                                    </Button>
                                    <Button variant="ghost" size="icon" onClick={() => handleDelete(cp.id)} className="rounded-lg h-8 w-8 text-slate-400 hover:text-rose-600">
                                        <Trash2 size={14} />
                                    </Button>
                                </div>
                            </div>
                            <h4 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-tight mb-1">{cp.name}</h4>
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest line-clamp-1 mb-4">
                                {cp.location || 'Tidak ada deskripsi'}
                            </p>
                            <div className="grid grid-cols-2 gap-2 pt-4 border-t border-slate-100 dark:border-slate-800">
                                <div className="text-[8px] font-black text-slate-400 uppercase">LAT: <span className="text-slate-700 dark:text-slate-300">{cp.latitude.toFixed(6)}</span></div>
                                <div className="text-[8px] font-black text-slate-400 uppercase">LON: <span className="text-slate-700 dark:text-slate-300">{cp.longitude.toFixed(6)}</span></div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
