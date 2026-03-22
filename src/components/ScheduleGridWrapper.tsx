'use client';

import dynamic from 'next/dynamic';
import React from 'react';

import type { ScheduleGridProps } from './ScheduleGrid';

const ScheduleGrid = dynamic(() => import('./ScheduleGrid'), {
    ssr: false,
    loading: () => <div className="p-8 text-center animate-pulse bg-white rounded-3xl border border-dashed border-slate-200">Memuat tabel jadwal...</div>
});

export default function ScheduleGridWrapper(props: ScheduleGridProps) {
    return <ScheduleGrid {...props} />;
}
