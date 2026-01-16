import { Skeleton } from "@/components/ui/skeleton";

export default function ScheduleSkeleton() {
    return (
        <div className="space-y-8 pb-20">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <Skeleton className="h-6 md:h-8 w-48 md:w-64" />
                    <Skeleton className="h-3 w-64 md:w-96" />
                </div>
                <div className="flex items-center justify-between bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-1 w-full md:w-auto">
                    <Skeleton className="h-6 w-6 rounded-lg" />
                    <Skeleton className="h-4 w-32 mx-3" />
                    <Skeleton className="h-6 w-6 rounded-lg" />
                </div>
            </div>

            {/* Division Sections Skeleton (3 divisions) */}
            {[...Array(3)].map((_, divisionIndex) => (
                <div key={divisionIndex} className="space-y-4">
                    {/* Division Header */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <Skeleton className="w-2 h-6 rounded-full mr-3" />
                            <Skeleton className="h-6 w-32" />
                        </div>
                        {divisionIndex === 0 && (
                            <Skeleton className="h-8 w-24 rounded-xl" />
                        )}
                    </div>

                    {/* Mobile View Skeleton */}
                    <div className="block lg:hidden space-y-4">
                        {[...Array(3)].map((_, userIndex) => (
                            <div key={userIndex} className="bg-white dark:bg-slate-900 rounded-[1.5rem] p-4 shadow-sm border border-slate-200 dark:border-slate-800">
                                {/* User Info */}
                                <div className="flex items-center space-x-3 mb-4">
                                    <Skeleton className="h-10 w-10 rounded-xl" />
                                    <div className="space-y-2">
                                        <Skeleton className="h-3 w-24" />
                                        <Skeleton className="h-2 w-16" />
                                    </div>
                                </div>

                                {/* Horizontal Scroll Days */}
                                <div className="flex overflow-x-auto pb-4 -mx-4 px-4 space-x-2 scrollbar-hide">
                                    {[...Array(15)].map((_, dayIndex) => (
                                        <div key={dayIndex} className="flex-shrink-0 flex flex-col items-center space-y-1.5 p-1.5 rounded-xl min-w-[44px] border bg-slate-50 border-slate-100 dark:bg-slate-800/50 dark:border-slate-800">
                                            <div className="text-center space-y-0.5">
                                                <Skeleton className="h-2 w-3 mx-auto" />
                                                <Skeleton className="h-2.5 w-4 mx-auto" />
                                            </div>
                                            <Skeleton className="h-7 w-7 rounded-md" />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Desktop Table View Skeleton */}
                    <div className="hidden lg:block bg-white dark:bg-slate-900 rounded-l-[2rem] border border-slate-200 dark:border-slate-800 shadow-xl overflow-hidden">
                        <div className="overflow-x-auto pb-4">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800">
                                        <th className="sticky left-0 z-20 bg-slate-50 dark:bg-slate-800/90 px-6 py-4 text-left border-r border-slate-200 dark:border-slate-800 min-w-[200px]">
                                            <Skeleton className="h-3 w-24" />
                                        </th>
                                        {[...Array(31)].map((_, dayIndex) => (
                                            <th key={dayIndex} className="px-1 py-4 text-center border-l border-slate-100 dark:border-slate-800/50 min-w-[44px]">
                                                <div className="flex flex-col items-center space-y-1.5">
                                                    <Skeleton className="h-2 w-3" />
                                                    <Skeleton className="h-8 w-8 rounded-xl" />
                                                </div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {[...Array(4)].map((_, userIndex) => (
                                        <tr key={userIndex}>
                                            <td className="sticky left-0 z-10 bg-white dark:bg-slate-900 px-6 py-4 border-r border-slate-200 dark:border-slate-800">
                                                <div className="flex items-center space-x-3">
                                                    <Skeleton className="h-9 w-9 rounded-xl" />
                                                    <Skeleton className="h-3 w-24" />
                                                </div>
                                            </td>
                                            {[...Array(31)].map((_, dayIndex) => (
                                                <td key={dayIndex} className="p-1 border-r border-slate-100 dark:border-slate-800 text-center">
                                                    <Skeleton className="h-10 w-full rounded-lg" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            ))}

            {/* Legend Skeleton */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-6 border-t border-slate-200 dark:border-slate-800">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-slate-900 p-3 rounded-2xl border border-slate-200 dark:border-slate-800 flex items-center space-x-3 shadow-sm">
                        <Skeleton className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-xl" />
                        <div className="space-y-2">
                            <Skeleton className="h-2 w-16" />
                            <Skeleton className="h-2 w-20" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
