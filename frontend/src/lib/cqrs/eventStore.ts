import type { Event, EventInput } from '$lib/cqrs/types.js';
import { uuidv4 } from '$lib/cqrs/uuid.js';

export class EventStore {

    static async writeEvent(eventData: EventInput): Promise<Event> {
        const event: Event = {
            ...eventData,
            eventId: uuidv4(),
            timestamp: new Date().toISOString()
        };
        // PolyglotDB removed. Silently skip local event persistence.
        return event;
    }

    static async readEvents(aggregateType: string, aggregateId: string): Promise<Event[]> {
        return [];
    }

    static async getOutbox(): Promise<Event[]> {
        return [];
    }

    static async removeFromOutbox(eventIds: string[]) {
        // No-op
    }
}
