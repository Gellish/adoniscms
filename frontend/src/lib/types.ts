export interface User {
    id: number;
    email: string;
    fullName: string;
    password?: string;
    role?: string;
    created_at?: string;
    updated_at?: string;
}

export interface Post {
    id: number | string;
    title: string;
    content: string;
    slug: string;
    tags?: string[];
    author?: string; // Added for frontend compatibility
    created_at?: string;
    updated_at?: string;
    source?: 'api' | 'local' | 'offline-created';
}

export interface Event {
    eventId: string;
    aggregateId: string;
    aggregateType: string;
    eventType: string;
    payload: Record<string, unknown>;
    version: number;
    timestamp: string;
}
