'use client';

import { useEffect } from 'react';
import { logLocation } from '@/actions/tracking';
import { UserRole } from '@/types/auth';

export default function LocationTracker({
    userId,
    role
}: {
    userId: string;
    role: UserRole;
}) {
    useEffect(() => {
        const track = async () => {
            // Re-check roles from settings might be needed, but for now we follow the hardcoded + Server Side check
            const rolesToTrack = ['SECURITY', 'LINGKUNGAN', 'KEBERSIHAN'];
            if (!rolesToTrack.includes(role)) {
                return;
            }

            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const { latitude, longitude } = position.coords;

                        try {
                            await logLocation(latitude, longitude);
                        } catch (err) {
                            // Silent fail
                        }
                    },
                    (error) => {
                        // Silent fail
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 15000,
                        maximumAge: 0
                    }
                );
            }
        };

        // Track immediately on mount
        track();

        // Track every 5 minutes (300,000 ms)
        const interval = setInterval(track, 300000);

        return () => clearInterval(interval);
    }, [userId, role]);

    return null;
}
