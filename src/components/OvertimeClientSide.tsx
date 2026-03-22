'use client';

import React, { useState } from 'react';
import OvertimeTable from './OvertimeTable';
import OvertimeDialog from './OvertimeDialog';
import { Button } from './ui/button';
import { Plus, Search } from 'lucide-react';
import { Input } from './ui/input';
import { deleteOvertime } from '@/actions/overtime';
import { toast } from 'sonner';
import { OvertimeRecord } from './OvertimeTable';

export interface OvertimeUser {
    id: string;
    name: string;
    employeeId: string;
    role: string;
}

export interface OvertimeClientProps {
    initialData: OvertimeRecord[];
    users: OvertimeUser[];
}

export default function OvertimeClient({ initialData, users }: OvertimeClientProps) {
    const [data, setData] = useState(initialData);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [selectedRecord, setSelectedRecord] = useState<OvertimeRecord | undefined>(undefined);
    const [searchQuery, setSearchQuery] = useState('');

    const handleEdit = (record: OvertimeRecord) => {
        setSelectedRecord(record);
        setIsDialogOpen(true);
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Yakin ingin menghapus data lembur ini?')) return;
        
        try {
            const result = await deleteOvertime(id);
            if (result.success) {
                setData(prev => prev.filter(item => item.id !== id));
                toast.success('Data lembur berhasil dihapus.');
            } else {
                toast.error(result.error || 'Gagal menghapus data.');
            }
        } catch (_error) {
            toast.error('Terjadi kesalahan koneksi.');
        }
    };

    const filteredData = data.filter(item => 
        item.user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.reason?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row gap-4 justify-between bg-white dark:bg-slate-900 p-4 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 font-black" />
                    <Input 
                        placeholder="Cari nama karyawan atau alasan..." 
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 rounded-2xl border-slate-200 focus:ring-indigo-500"
                    />
                </div>
                <div className="flex gap-2">
                    <Button 
                        onClick={() => {
                            setSelectedRecord(undefined);
                            setIsDialogOpen(true);
                        }}
                        className="rounded-2xl bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 dark:shadow-none font-bold"
                    >
                        <Plus className="mr-2 h-4 w-4" />
                        Tambah Lembur
                    </Button>
                </div>
            </div>

            <OvertimeTable 
                data={filteredData} 
                onEdit={handleEdit} 
                onDelete={handleDelete} 
            />

            <OvertimeDialog 
                isOpen={isDialogOpen} 
                onClose={() => setIsDialogOpen(false)} 
                users={users}
                editRecord={selectedRecord}
            />
        </div>
    );
}
