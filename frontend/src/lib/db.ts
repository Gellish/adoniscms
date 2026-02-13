import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { Event } from '$lib/cqrs/types';

interface PolyglotDB extends DBSchema {
    events: {
        key: string; // eventId
        value: Event;
        indexes: { 'by-aggregate': [string, string] }; // [aggregateType, aggregateId]
    };
    outbox: {
        key: string; // eventId
        value: Event;
    };
    auth: {
        key: string; // 'session'
        value: any;
    };
    stats: {
        key: string; // 'admin_stats'
        value: any;
    };
}

const DB_NAME = 'polyglot_client_db';
const DB_VERSION = 4;

let dbPromise: Promise<IDBPDatabase<PolyglotDB>>;

export const dbStart = () => {
    if (!dbPromise) {
        dbPromise = openDB<PolyglotDB>(DB_NAME, DB_VERSION, {
            upgrade(db, oldVersion) {
                // Version 1: Initial setup
                if (oldVersion < 1) {
                    const eventStore = db.createObjectStore('events', { keyPath: 'eventId' });
                    eventStore.createIndex('by-aggregate', ['aggregateType', 'aggregateId']);
                    db.createObjectStore('outbox', { keyPath: 'eventId' });
                    db.createObjectStore('auth');
                }

                // Version 2: Added stats store
                if (oldVersion < 2) {
                    if (!db.objectStoreNames.contains('stats')) {
                        db.createObjectStore('stats');
                    }
                }

                // Version 4: Cleanup (Moving menus to ClientDB)
                if (oldVersion < 4) {
                    if (db.objectStoreNames.contains('menus')) {
                        db.deleteObjectStore('menus');
                    }
                }
            },
        });
    }
    return dbPromise;
};

export const ClientDB = {
    async addEvent(event: Event) {
        const db = await dbStart();
        const tx = db.transaction(['events', 'outbox'], 'readwrite');
        await Promise.all([
            tx.objectStore('events').put(event),
            tx.objectStore('outbox').put(event)
        ]);
        await tx.done;
    },

    async getEventsForAggregate(type: string, id: string) {
        const db = await dbStart();
        return db.getAllFromIndex('events', 'by-aggregate', [type, id]);
    },

    async getOutbox() {
        const db = await dbStart();
        return db.getAll('outbox');
    },

    async removeFromOutbox(eventIds: string[]) {
        const db = await dbStart();
        const tx = db.transaction('outbox', 'readwrite');
        const store = tx.objectStore('outbox');
        for (const id of eventIds) {
            await store.delete(id);
        }
        await tx.done;
    },

    async getAllEventsByType(type: string) {
        const db = await dbStart();
        // Use IDBKeyRange to query the composite index [type, id]
        // From [type, ''] to [type, '\uffff'] covers all IDs for that type
        const range = IDBKeyRange.bound([type, ''], [type, '\uffff']);
        const events = await db.getAllFromIndex('events', 'by-aggregate', range);

        // Group by Aggregate ID to return streams (Event[][])
        const streams: Record<string, Event[]> = {};
        for (const event of events) {
            if (!streams[event.aggregateId]) streams[event.aggregateId] = [];
            streams[event.aggregateId].push(event);
        }
        return Object.values(streams);
    },

    async setSession(user: any) {
        const db = await dbStart();
        await db.put('auth', user, 'session');
    },

    async getSession() {
        const db = await dbStart();
        return db.get('auth', 'session');
    },

    async clearSession() {
        const db = await dbStart();
        await db.delete('auth', 'session');
    },

    async exportData() {
        const db = await dbStart();
        const events = await db.getAll('events');
        const auth = await db.get('auth', 'session');
        const stats = await db.get('stats', 'admin_stats');
        return {
            version: '1.1',
            exportedAt: new Date().toISOString(),
            auth,
            events,
            stats
        };
    },

    async setStats(stats: any) {
        const db = await dbStart();
        await db.put('stats', stats, 'admin_stats');
    },

    async getStats() {
        const db = await dbStart();
        return db.get('stats', 'admin_stats');
    }
};
