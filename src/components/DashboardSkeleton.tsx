import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardSkeleton() {
    return (
        <div className="space-y-6 md:space-y-8 pb-24 md:pb-8 font-sans">
            {/* --- TOP BAR SKELETON --- */}
            <div className="flex items-center justify-between gap-4">
                <div className="flex flex-row items-center justify-between w-full md:w-auto md:justify-start gap-4 md:gap-8">
                    <div className="space-y-2">
                        <Skeleton className="h-8 w-48 md:w-64" />
                        <Skeleton className="h-3 w-32 md:w-48" />
                    </div>
                    <Skeleton className="h-12 w-32" />
                </div>
            </div>

            {/* --- MOBILE SHORTCUTS SKELETON --- */}
            <div className="grid grid-cols-5 gap-4 md:hidden">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex flex-col items-center space-y-3">
                        <Skeleton className="w-12 h-12 rounded-2xl" />
                        <Skeleton className="h-2 w-12" />
                    </div>
                ))}
            </div>

            {/* --- DASHBOARD LAYOUT SKELETON --- */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Left Side: Stats Skeleton */}
                <div className="lg:col-span-3">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                                <div className="space-y-3">
                                    <Skeleton className="h-4 w-20" />
                                    <Skeleton className="h-8 w-16" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right Side: Sidebar Skeleton */}
                <div className="lg:col-span-1 lg:row-span-2 space-y-6">
                    {/* Personil Hadir Skeleton */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                        <Skeleton className="h-4 w-32 mb-6" />
                        <div className="space-y-4">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <Skeleton className="w-10 h-10 rounded-full" />
                                        <div className="space-y-2">
                                            <Skeleton className="h-3 w-24" />
                                            <Skeleton className="h-2 w-16" />
                                        </div>
                                    </div>
                                    <Skeleton className="h-2 w-2 rounded-full" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Performance Dashboard Skeleton */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                        <Skeleton className="h-4 w-32 mb-4" />
                        <div className="space-y-3">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <Skeleton className="h-3 w-full" />
                                    <Skeleton className="h-2 w-full" />
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Patroli Skeleton */}
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm p-6">
                        <Skeleton className="h-4 w-24 mb-2" />
                        <Skeleton className="h-3 w-full mb-4" />
                        <Skeleton className="h-10 w-full rounded-xl" />
                    </div>
                </div>

                {/* Left Side Bottom: Attendance History Skeleton */}
                <div className="lg:col-span-3 w-full overflow-hidden">
                    <div className="bg-white dark:bg-slate-900 rounded-[2rem] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
                        <div className="px-6 md:px-8 py-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <Skeleton className="w-1 h-6 rounded-full" />
                                <Skeleton className="h-4 w-48" />
                            </div>
                            <Skeleton className="h-3 w-16" />
                        </div>

                        {/* Desktop Table Skeleton */}
                        <div className="hidden lg:block p-8 space-y-4">
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="flex items-center gap-6">
                                    <Skeleton className="w-12 h-12 rounded-full" />
                                    <Skeleton className="h-4 w-32" />
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-4 w-40" />
                                    <Skeleton className="h-4 w-48" />
                                    <Skeleton className="h-4 w-24" />
                                    <Skeleton className="h-6 w-20 rounded-full" />
                                </div>
                            ))}
                        </div>

                        {/* Mobile Card Skeleton */}
                        <div className="lg:hidden divide-y divide-slate-100 dark:divide-slate-800">
                            {[...Array(3)].map((_, i) => (
                                <div key={i} className="p-5 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center space-x-3">
                                            <Skeleton className="w-10 h-10 rounded-full" />
                                            <div className="space-y-2">
                                                <Skeleton className="h-3 w-24" />
                                                <Skeleton className="h-2 w-16" />
                                            </div>
                                        </div>
                                        <Skeleton className="h-6 w-16 rounded-full" />
                                    </div>
                                    <Skeleton className="h-24 w-full rounded-2xl" />
                                    <div className="flex items-center justify-between">
                                        <Skeleton className="h-8 w-24 rounded-lg" />
                                        <Skeleton className="h-8 w-24 rounded-lg" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
