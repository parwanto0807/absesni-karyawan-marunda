import { Skeleton } from "@/components/ui/skeleton";

export default function HistorySkeleton() {
    return (
        <div className="w-full mx-auto space-y-4 md:space-y-8">
            {/* Header Area Skeleton */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
                <div className="space-y-1 md:space-y-2">
                    <Skeleton className="h-6 w-32 rounded-full" />
                    <Skeleton className="h-8 md:h-12 w-48 md:w-64" />
                    <Skeleton className="h-4 w-64 md:w-96" />
                </div>
                <div className="flex items-center space-x-2">
                    <Skeleton className="h-10 w-24 rounded-xl" />
                    <Skeleton className="h-10 w-24 rounded-xl" />
                </div>
            </div>

            {/* Filter Skeleton */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-4 md:p-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Skeleton className="h-10 w-full rounded-xl" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                    <Skeleton className="h-10 w-full rounded-xl" />
                </div>
            </div>

            {/* Mobile Card View Skeleton */}
            <div className="md:hidden space-y-3">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-lg p-4 space-y-3">
                        {/* Header */}
                        <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                                <Skeleton className="h-10 w-10 rounded-xl" />
                                <div className="space-y-2">
                                    <Skeleton className="h-3 w-24" />
                                    <Skeleton className="h-2 w-16" />
                                </div>
                            </div>
                            <Skeleton className="h-5 w-16 rounded-full" />
                        </div>

                        {/* Date & Time */}
                        <Skeleton className="h-20 w-full rounded-lg" />

                        {/* Footer */}
                        <div className="flex items-center justify-between gap-3 pt-2">
                            <Skeleton className="h-8 w-32 rounded-lg" />
                            <div className="flex items-center space-x-2">
                                <Skeleton className="h-10 w-10 rounded-lg" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Desktop Table View Skeleton */}
            <div className="hidden md:block bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b border-slate-100 dark:border-slate-800">
                                <th className="px-6 py-5">
                                    <Skeleton className="h-3 w-20" />
                                </th>
                                <th className="px-6 py-5">
                                    <Skeleton className="h-3 w-24" />
                                </th>
                                <th className="px-6 py-5">
                                    <Skeleton className="h-3 w-24" />
                                </th>
                                <th className="px-6 py-5">
                                    <Skeleton className="h-3 w-20" />
                                </th>
                                <th className="px-6 py-5">
                                    <Skeleton className="h-3 w-24" />
                                </th>
                                <th className="px-6 py-5">
                                    <Skeleton className="h-3 w-16" />
                                </th>
                                <th className="px-6 py-5">
                                    <Skeleton className="h-3 w-16" />
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {[...Array(8)].map((_, i) => (
                                <tr key={i} className="border-b border-slate-50 dark:border-slate-800">
                                    {/* Karyawan */}
                                    <td className="px-6 py-4">
                                        <div className="flex items-center space-x-3">
                                            <Skeleton className="h-10 w-10 rounded-xl" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-3 w-24" />
                                                <Skeleton className="h-2 w-16" />
                                            </div>
                                        </div>
                                    </td>
                                    {/* Jadwal Shift */}
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col items-center space-y-2">
                                            <Skeleton className="h-5 w-12 rounded-full" />
                                            <Skeleton className="h-3 w-32" />
                                        </div>
                                    </td>
                                    {/* Waktu Absen */}
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col items-center space-y-2">
                                            <Skeleton className="h-3 w-24" />
                                            <Skeleton className="h-4 w-40" />
                                        </div>
                                    </td>
                                    {/* Lokasi */}
                                    <td className="px-6 py-4">
                                        <Skeleton className="h-3 w-32" />
                                    </td>
                                    {/* Performance */}
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col items-center space-y-2">
                                            <Skeleton className="h-3 w-12" />
                                            <Skeleton className="h-1.5 w-24 rounded-full" />
                                        </div>
                                    </td>
                                    {/* Foto */}
                                    <td className="px-6 py-4">
                                        <Skeleton className="h-12 w-12 rounded-lg" />
                                    </td>
                                    {/* Status */}
                                    <td className="px-6 py-4 text-center">
                                        <Skeleton className="h-6 w-20 rounded-full mx-auto" />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
