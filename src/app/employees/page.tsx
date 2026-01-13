import React from 'react';
import EmployeeTable from '@/components/EmployeeTable';
import { UserRole } from '@/types/attendance';
import { prisma } from '@/lib/db';
import EmployeeHeader from '@/components/EmployeeHeader';
import { UserPlus } from 'lucide-react';

export default async function EmployeesPage() {
    // Fetch real employees from PostgreSQL
    const employees = await prisma.user.findMany({
        orderBy: {
            name: 'asc'
        }
    });

    const formattedEmployees = employees.map(emp => ({
        id: emp.id,
        name: emp.name,
        username: emp.username,
        role: emp.role as UserRole,
        employeeId: emp.employeeId,
        image: emp.image || undefined,
        rotationOffset: emp.rotationOffset,
        lastLogin: emp.lastLogin || undefined,
        updatedAt: emp.updatedAt,
    }));

    return (
        <div className="space-y-6">
            <EmployeeHeader />

            <EmployeeTable employees={formattedEmployees} />

            {formattedEmployees.length === 0 && (
                <div className="text-center py-20 bg-white dark:bg-slate-900 rounded-[2.5rem] border-2 border-dashed border-slate-200 dark:border-slate-800 animate-in fade-in duration-500">
                    <div className="mx-auto w-16 h-16 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center text-slate-300 mb-4">
                        <UserPlus size={32} />
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">Belum Ada Karyawan</h3>
                    <p className="text-slate-400 font-medium max-w-xs mx-auto text-sm mt-1">
                        Mulai dengan menambahkan karyawan pertama Anda menggunakan tombol di atas.
                    </p>
                </div>
            )}
        </div>
    );
}
