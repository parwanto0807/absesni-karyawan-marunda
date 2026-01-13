'use server';

import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function logLocation(latitude: number, longitude: number) {
    const session = await getSession();
    if (!session) return { error: 'Not authenticated' };

    try {
        // Fetch tracking configuration from settings
        const settings = await prisma.setting.findMany({
            where: {
                key: {
                    in: ['TRACKING_ROLES', 'TRACKING_REQUIRE_ACTIVE']
                }
            }
        });

        const settingsMap: Record<string, string> = {};
        settings.forEach(s => settingsMap[s.key] = s.value);

        const rolesToTrack = (settingsMap['TRACKING_ROLES'] || 'SECURITY,LINGKUNGAN,KEBERSIHAN').split(',').map(r => r.trim());
        const requireActive = settingsMap['TRACKING_REQUIRE_ACTIVE'] !== 'false';

        // Enforce role check on server side for security/privacy
        if (!rolesToTrack.includes(session.role)) {
            return { error: 'Role not authorized for tracking' };
        }

        if (requireActive) {
            // Check if user has an active attendance record (clocked in but not clocked out)
            const now = new Date();
            const activeAttendance = await prisma.attendance.findFirst({
                where: {
                    userId: session.userId,
                    clockOut: null,
                    status: {
                        in: ['PRESENT', 'LATE']
                    },
                    // We consider "active" if clocked in within the last 24 hours
                    clockIn: {
                        gte: new Date(now.getTime() - 24 * 60 * 60 * 1000)
                    }
                }
            });

            if (!activeAttendance) {
                return { error: 'Not in working hours or on leave (Privacy Protected)' };
            }
        }

        await prisma.locationLog.create({
            data: {
                userId: session.userId,
                latitude,
                longitude,
            },
        });
        return { success: true };
    } catch (error) {
        console.error('Error logging location:', error);
        return { error: 'Failed to log location' };
    }
}

export async function getLocationLogs(userId?: string, date?: Date) {
    const session = await getSession();
    if (!session) return { error: 'Not authenticated' };

    // Check if user is authorized (adminit has full access, others based on settings)
    const isAuthorized = await isUserAuthorizedForTracking(session.username);
    if (!isAuthorized) return { error: 'Not authorized' };

    const where: any = {};
    if (userId) where.userId = userId;
    if (date) {
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);
        where.createdAt = {
            gte: startOfDay,
            lte: endOfDay,
        };
    }

    try {
        const logs = await prisma.locationLog.findMany({
            where,
            include: {
                user: {
                    select: {
                        name: true,
                        role: true,
                    }
                }
            },
            orderBy: {
                createdAt: 'asc',
            },
        });
        return { success: true, data: logs };
    } catch (error) {
        console.error('Error getting location logs:', error);
        return { error: 'Failed to get location logs' };
    }
}

export async function getTrackableUsers() {
    const session = await getSession();
    if (!session) return { error: 'Not authenticated' };

    const isAuthorized = await isUserAuthorizedForTracking(session.username);
    if (!isAuthorized) return { error: 'Not authorized' };

    try {
        // Get roles to track from settings
        const rolesSetting = await prisma.setting.findUnique({
            where: { key: 'TRACKING_ROLES' }
        });
        const rolesToTrack = (rolesSetting?.value || 'SECURITY,LINGKUNGAN,KEBERSIHAN').split(',').map(r => r.trim());

        const users = await prisma.user.findMany({
            where: {
                role: {
                    in: rolesToTrack as any
                }
            },
            select: {
                id: true,
                name: true,
                role: true,
                employeeId: true,
            },
            orderBy: {
                name: 'asc'
            }
        });
        return { success: true, data: users };
    } catch (error) {
        console.error('Error getting trackable users:', error);
        return { error: 'Failed to get users' };
    }
}

export async function isUserAuthorizedForTracking(username: string) {
    if (username === 'adminit') return true;

    try {
        const setting = await prisma.setting.findUnique({
            where: { key: 'TRACKING_AUTHORIZED_USERS' }
        });

        if (!setting) return false;

        const authorizedUsers = setting.value.split(',').map(s => s.trim());
        return authorizedUsers.includes(username);
    } catch (error) {
        console.error('Error checking authorization:', error);
        return false;
    }
}

export async function getAllPICSAndAdmins() {
    const session = await getSession();
    if (!session || session.username !== 'adminit') return { error: 'Unauthorized' };

    try {
        const users = await prisma.user.findMany({
            where: {
                role: { in: ['ADMIN', 'PIC'] },
                username: { not: 'adminit' }
            },
            select: {
                username: true,
                name: true,
                role: true
            },
            orderBy: { name: 'asc' }
        });
        return { success: true, data: users };
    } catch (error) {
        return { error: 'Failed to fetch users' };
    }
}
