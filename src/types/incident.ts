export interface IncidentComment {
    id: string;
    incidentId: string;
    userId: string;
    content: string;
    createdAt: Date;
    user: {
        name: string;
        image: string | null;
        role: string;
    };
}

export interface IncidentReport {
    id: string;
    userId: string;
    category: string;
    description: string;
    latitude: number;
    longitude: number;
    address: string | null;
    evidenceImg: string | null;
    status: string;
    actionDetail: string | null;
    analysis: string | null;
    improvement: string | null;
    createdAt: Date;
    updatedAt: Date;
    user: {
        id: string;
        name: string;
        image: string | null;
        role: string;
        employeeId: string;
    };
    comments: IncidentComment[];
}
