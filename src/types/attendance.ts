export type UserRole = 'ADMIN' | 'SECURITY' | 'STAFF' | 'PIC' | 'LINGKUNGAN' | 'KEBERSIHAN' | 'OTHER';

export interface User {
    id: string;
    name: string;
    username: string;
    email?: string;
    role: UserRole;
    image?: string;
    employeeId: string;
    rotationOffset: number;
}

export type AttendanceStatus = 'PRESENT' | 'LATE' | 'ABSENT' | 'PERMIT' | 'SICK';

export interface Attendance {
    id: string;
    userId: string;
    date: string;
    clockIn: string;
    clockOut?: string;
    status: AttendanceStatus;
    location?: {
        lat: number;
        lng: number;
        address: string;
    };
    notes?: string;
}
