export type UserRole = 'ADMIN' | 'PIC' | 'RT' | 'SECURITY' | 'LINGKUNGAN' | 'STAFF' | 'KEBERSIHAN';

export interface User {
    id: string;
    username: string;
    name: string;
    role: UserRole;
    employeeId: string;
}

export interface SessionPayload {
    userId: string;
    role: UserRole;
    username: string;
    image?: string | null;
    iat: number; // Issued At (Timestamp)
}
