
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
    description?: string;
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

export type InterfaceType = 'input' | 'textarea' | 'select' | 'boolean' | 'richtext' | 'relation' | 'file' | 'date';

export interface FieldSchema {
    field: string;
    label: string;
    type: InterfaceType;
    placeholder?: string;
    options?: { label: string; value: any }[];
    group?: string;
    meta?: Record<string, any>;
    relation?: {
        table: string;
        displayField: string;
    };
}

export interface MenuItem {
    id: string;
    label: string;
    url: string;
    children?: MenuItem[];
    isOpen?: boolean;
}

export interface Menu {
    id: string;
    name: string;
    items: MenuItem[];
}
