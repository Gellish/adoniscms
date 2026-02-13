import type { Event, EventInput } from './types.js';
import { uuidv4 } from './uuid.js';
import { ClientDB } from '../db.js';

export class EventStore {

    static async writeEvent(eventData: EventInput): Promise<Event> {
        const event: Event = {
            ...eventData,
            eventId: uuidv4(),
            timestamp: new Date().toISOString()
        };

        // Save to IndexedDB (Aggregate Stream + Outbox handled in one transaction)
        await ClientDB.addEvent(event);

        return event;
    }

    static async readEvents(aggregateType: string, aggregateId: string): Promise<Event[]> {
        return ClientDB.getEventsForAggregate(aggregateType, aggregateId);
    }

    static async getOutbox(): Promise<Event[]> {
        return ClientDB.getOutbox();
    }

    static async removeFromOutbox(eventIds: string[]) {
        return ClientDB.removeFromOutbox(eventIds);
    }
}
