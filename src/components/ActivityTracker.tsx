'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { logActivity } from '@/actions/activity';

export default function ActivityTracker({ userId }: { userId: string }) {
    const pathname = usePathname();

    useEffect(() => {
        if (userId && pathname) {
            // We use a small delay or ensure this doesn't block the UI
            const log = async () => {
                await logActivity(userId, 'Buka Menu', pathname);
            };
            log();
        }
    }, [pathname, userId]);

    return null;
}
