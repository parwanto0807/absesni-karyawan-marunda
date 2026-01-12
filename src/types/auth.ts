export type UserRole = 'ADMIN' | 'PIC' | 'SECURITY' | 'LINGKUNGAN' | 'STAFF';

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
    image: string | null;
}
