import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { prisma } from '@/lib/db';
import { getOvertimes } from '@/actions/overtime';
import OvertimeWrapperClient from '@/components/OvertimeWrapperClient';

export default async function OvertimesPage() {
    const session = await getSession();
    if (!session || session.role !== 'ADMIN') {
        redirect('/dashboard');
    }

    // Fetch initial data
    const overtimes = await getOvertimes();
    const users = await prisma.user.findMany({
        where: {
            role: { in: ['SECURITY', 'LINGKUNGAN', 'KEBERSIHAN'] }
        },
        select: {
            id: true,
            name: true,
            role: true,
            employeeId: true
        },
        orderBy: { name: 'asc' }
    });

    return (
        <div className="p-4 md:p-8 space-y-8 animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white">
                        Manajemen <span className="text-indigo-600 font-black">Lembur</span>
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 font-medium mt-1">
                        Kelola data lembur karyawan dan sinkronisasi dengan jadwal kerja.
                    </p>
                </div>
            </div>

            <OvertimeWrapperClient 
                initialData={JSON.parse(JSON.stringify(overtimes))} 
                users={JSON.parse(JSON.stringify(users))} 
            />
        </div>
    );
}
