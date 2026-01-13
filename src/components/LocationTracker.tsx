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
        const rolesToTrack = ['SECURITY', 'LINGKUNGAN', 'KEBERSIHAN'];
        if (!rolesToTrack.includes(role)) return;

        const track = () => {
            if ("geolocation" in navigator) {
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const { latitude, longitude } = position.coords;
                        console.log(`[Tracking] Logging location: ${latitude}, ${longitude}`);
                        await logLocation(latitude, longitude);
                    },
                    (error) => {
                        console.error("[Tracking] Error getting location:", error);
                    },
                    {
                        enableHighAccuracy: true,
                        timeout: 10000,
                        maximumAge: 0
                    }
                );
            } else {
                console.warn("[Tracking] Geolocation is not supported by this browser.");
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
