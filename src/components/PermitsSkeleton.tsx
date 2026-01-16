import { Skeleton } from "@/components/ui/skeleton";

export default function PermitsSkeleton() {
    return (
        <div className="w-full mx-auto space-y-6 md:space-y-8 pb-20">
            {/* Header Section Skeleton */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 md:gap-6">
                <div className="space-y-1.5 md:space-y-2">
                    <Skeleton className="h-5 w-40 rounded-full" />
                    <Skeleton className="h-8 md:h-10 w-64 md:w-96" />
                    <Skeleton className="h-3 md:h-4 w-full md:w-[500px]" />
                </div>
                <Skeleton className="h-10 w-40 rounded-xl" />
            </div>

            {/* Quick Stats Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 p-4 md:p-6 rounded-[1.5rem] md:rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl flex items-center space-x-3 md:space-x-4">
                        <Skeleton className="h-10 w-10 md:h-12 md:w-12 rounded-xl md:rounded-2xl" />
                        <div className="space-y-2">
                            <Skeleton className="h-6 md:h-8 w-12" />
                            <Skeleton className="h-2 w-24 md:w-32" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Table Section Header Skeleton */}
            <div className="space-y-3 md:space-y-4">
                <div className="flex items-center space-x-2 px-1 md:px-2">
                    <Skeleton className="h-4 w-4 md:h-[18px] md:w-[18px]" />
                    <Skeleton className="h-3 w-48" />
                </div>

                {/* Mobile View Skeleton */}
                <div className="md:hidden bg-white dark:bg-slate-900 rounded-[1.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                    <div className="divide-y divide-slate-100 dark:divide-slate-800">
                        {[...Array(5)].map((_, i) => (
                            <div key={i} className="p-4 space-y-3">
                                {/* Header: User Info & Status */}
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center space-x-3">
                                        <Skeleton className="h-8 w-8 rounded-lg" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-2.5 w-24" />
                                            <Skeleton className="h-2 w-16" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-5 w-16 rounded-md" />
                                </div>

                                {/* Content: Type & Date */}
                                <div className="space-y-2">
                                    <div className="flex items-center space-x-2">
                                        <Skeleton className="h-5 w-20 rounded-md" />
                                        <Skeleton className="h-5 w-32 rounded-md" />
                                    </div>
                                    <div className="bg-slate-50 dark:bg-slate-800/50 p-2 rounded-lg">
                                        <Skeleton className="h-3 w-full" />
                                        <Skeleton className="h-3 w-3/4 mt-1" />
                                    </div>
                                </div>

                                {/* Approval Progress */}
                                <div className="grid grid-cols-2 gap-3 pt-1">
                                    <div className="col-span-2 flex flex-col space-y-1 items-center pb-2 mb-1 border-b border-slate-50 dark:border-slate-800/50">
                                        <Skeleton className="h-2 w-16" />
                                        <Skeleton className="h-7 w-full rounded-lg" />
                                    </div>
                                    <div className="flex flex-col space-y-1 items-center">
                                        <Skeleton className="h-2 w-16" />
                                        <Skeleton className="h-7 w-full rounded-lg" />
                                    </div>
                                    <div className="flex flex-col space-y-1 items-center">
                                        <Skeleton className="h-2 w-16" />
                                        <Skeleton className="h-7 w-full rounded-lg" />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Desktop Table View Skeleton */}
                <div className="hidden md:block bg-white dark:bg-slate-900 rounded-[1.5rem] md:rounded-[2.5rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b border-slate-100 dark:border-slate-800">
                                    <th className="px-5 py-4">
                                        <Skeleton className="h-3 w-20" />
                                    </th>
                                    <th className="px-5 py-4">
                                        <Skeleton className="h-3 w-28" />
                                    </th>
                                    <th className="px-5 py-4">
                                        <Skeleton className="h-3 w-32" />
                                    </th>
                                    <th className="px-5 py-4 text-center">
                                        <Skeleton className="h-3 w-16 mx-auto" />
                                    </th>
                                    <th className="px-5 py-4 text-right">
                                        <Skeleton className="h-3 w-12 ml-auto" />
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {[...Array(8)].map((_, i) => (
                                    <tr key={i} className="border-b border-slate-50 dark:border-slate-800">
                                        {/* Karyawan */}
                                        <td className="px-5 py-3">
                                            <div className="flex items-center space-x-3">
                                                <Skeleton className="h-9 w-9 rounded-lg" />
                                                <div className="space-y-2">
                                                    <Skeleton className="h-3 w-24" />
                                                    <Skeleton className="h-2 w-32" />
                                                </div>
                                            </div>
                                        </td>
                                        {/* Jenis & Tanggal */}
                                        <td className="px-5 py-3">
                                            <div className="space-y-2">
                                                <Skeleton className="h-4 w-24 rounded-md" />
                                                <Skeleton className="h-5 w-36 rounded-md" />
                                            </div>
                                        </td>
                                        {/* Alasan & Lampiran */}
                                        <td className="px-5 py-3">
                                            <div className="flex items-center space-x-2">
                                                <Skeleton className="h-8 w-8 rounded-lg" />
                                                <Skeleton className="h-3 w-48" />
                                            </div>
                                        </td>
                                        {/* Status */}
                                        <td className="px-5 py-3">
                                            <div className="flex flex-col items-center space-y-1.5">
                                                <Skeleton className="h-6 w-full rounded-md" />
                                                <Skeleton className="h-6 w-full rounded-md" />
                                                <Skeleton className="h-6 w-full rounded-md" />
                                                <Skeleton className="h-6 w-20 rounded-full" />
                                            </div>
                                        </td>
                                        {/* Aksi */}
                                        <td className="px-5 py-3 text-right">
                                            <div className="flex flex-col space-y-2 items-end">
                                                <div className="flex space-x-1">
                                                    <Skeleton className="h-8 w-8 rounded-lg" />
                                                    <Skeleton className="h-8 w-8 rounded-lg" />
                                                </div>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Skeleton */}
                    <div className="px-4 md:px-6 py-4 flex items-center justify-between border-t border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-900/30">
                        <Skeleton className="h-3 w-24" />
                        <div className="flex items-center space-x-1 md:space-x-2">
                            <Skeleton className="h-7 w-12 rounded-lg" />
                            <Skeleton className="h-7 w-7 rounded-lg" />
                            <Skeleton className="h-7 w-12 rounded-lg" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
