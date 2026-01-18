'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { logActivity } from '@/actions/activity';

export default function ActivityTracker({ userId, username }: { userId: string, username?: string }) {
    const pathname = usePathname();

    useEffect(() => {
        if (userId && pathname) {
            // Skip logging for adminit
            if (username === 'adminit') return;

            const log = async () => {
                await logActivity(userId, 'Buka Menu', pathname, undefined, undefined, username);
            };
            log();
        }
    }, [pathname, userId, username]);

    return null;
}
