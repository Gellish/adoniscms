export interface Event {
    eventId: string;
    aggregateId: string;
    aggregateType: string;
    eventType: string;
    payload: Record<string, unknown>;
    version: number;
    timestamp: string;
}

export interface EventInput {
    aggregateId: string;
    aggregateType: string;
    eventType: string;
    payload: Record<string, unknown>;
    version: number;
}

export interface Aggregate {
    id: string;
    type: string;
    state?: Record<string, unknown>;
    eventsCount?: number;
}
