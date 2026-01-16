'use client';

import React, { useState } from 'react';
import { Settings } from 'lucide-react';
import ScheduleOffsetDialog from './ScheduleOffsetDialog';

interface RotationUser {
    id: string;
    name: string;
    rotationOffset: number;
    employeeId: string;
}

interface ScheduleClientHelperProps {
    securityUsers: RotationUser[];
}

export default function ScheduleClientHelper({ securityUsers }: ScheduleClientHelperProps) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => setIsDialogOpen(true)}
                className="flex items-center space-x-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 transition-all active:scale-95"
            >
                <Settings size={18} />
                <span>Atur Offset</span>
            </button>

            <ScheduleOffsetDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                users={securityUsers}
            />
        </>
    );
}
