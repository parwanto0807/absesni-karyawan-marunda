import { Skeleton } from "@/components/ui/skeleton";

export default function EmployeeSkeleton() {
    return (
        <div className="space-y-6">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div className="space-y-2">
                    <Skeleton className="h-6 w-32 rounded-full" />
                    <Skeleton className="h-8 md:h-12 w-48 md:w-64" />
                    <Skeleton className="h-4 w-64 md:w-96" />
                </div>
                <Skeleton className="h-10 w-40 rounded-xl" />
            </div>

            {/* Desktop Table View Skeleton */}
            <div className="hidden md:block overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 dark:bg-slate-800/50">
                        <tr>
                            <th className="px-6 py-4">
                                <Skeleton className="h-3 w-24" />
                            </th>
                            <th className="px-6 py-4">
                                <Skeleton className="h-3 w-28" />
                            </th>
                            <th className="px-6 py-4">
                                <Skeleton className="h-3 w-24" />
                            </th>
                            <th className="px-6 py-4">
                                <Skeleton className="h-3 w-32" />
                            </th>
                            <th className="px-6 py-4 text-right">
                                <Skeleton className="h-3 w-16 ml-auto" />
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                        {[...Array(8)].map((_, i) => (
                            <tr key={i}>
                                {/* Karyawan */}
                                <td className="px-6 py-4">
                                    <div className="flex items-center space-x-3">
                                        <Skeleton className="h-10 w-10 rounded-xl" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-3 w-32" />
                                            <Skeleton className="h-2 w-20" />
                                        </div>
                                    </div>
                                </td>
                                {/* ID Karyawan */}
                                <td className="px-6 py-4">
                                    <Skeleton className="h-3 w-24" />
                                </td>
                                {/* Tugas/Role */}
                                <td className="px-6 py-4">
                                    <Skeleton className="h-6 w-24 rounded-lg" />
                                </td>
                                {/* Akses Terakhir */}
                                <td className="px-6 py-4">
                                    <div className="space-y-2">
                                        <Skeleton className="h-3 w-28" />
                                        <Skeleton className="h-2 w-20" />
                                    </div>
                                </td>
                                {/* Aksi */}
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end space-x-1">
                                        <Skeleton className="h-8 w-8 rounded-xl" />
                                        <Skeleton className="h-8 w-8 rounded-xl" />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Mobile/Tablet Card View Skeleton */}
            <div className="md:hidden space-y-3">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-800 shadow-sm">
                        <div className="flex items-start space-x-3">
                            <Skeleton className="h-12 w-12 rounded-xl shrink-0" />
                            <div className="flex-1 min-w-0 space-y-3">
                                {/* Name and Actions */}
                                <div className="flex items-center justify-between">
                                    <Skeleton className="h-4 w-32" />
                                    <div className="flex items-center space-x-1">
                                        <Skeleton className="h-7 w-7 rounded-lg" />
                                        <Skeleton className="h-7 w-7 rounded-lg" />
                                    </div>
                                </div>
                                {/* Employee ID and Username */}
                                <div className="flex items-center gap-2">
                                    <Skeleton className="h-4 w-20 rounded-md" />
                                    <Skeleton className="h-3 w-16" />
                                </div>
                                {/* Role Badge */}
                                <Skeleton className="h-6 w-24 rounded-md" />
                                {/* Last Access */}
                                <Skeleton className="h-3 w-40" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
