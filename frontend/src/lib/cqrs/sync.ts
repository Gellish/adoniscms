import { EventStore } from './eventStore.js';
import type { Event } from './types.js';

const SYNC_INTERVAL = 5000; // 5 seconds

export class SyncEngine {
    private static intervalId: any;
    private static isSyncing = false;

    static start() {
        if (this.intervalId) return;

        console.log('[SyncEngine] Started');
        this.intervalId = setInterval(() => this.sync(), SYNC_INTERVAL);

        // Also sync immediately on online event
        window.addEventListener('online', () => this.sync());
    }

    static stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    static async sync() {
        if (this.isSyncing || !navigator.onLine) return;

        const outbox = await EventStore.getOutbox();
        if (outbox.length === 0) return;

        this.isSyncing = true;
        console.log(`[SyncEngine] Syncing ${outbox.length} events...`);

        try {
            // In a real app, you might batch these or send one by one
            // We'll send them to a hypothetical /api/events/sync endpoint
            // For now, we'll simulate a successful sync if the backend is reachable

            const response = await fetch('http://localhost:3333/api/events/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ events: outbox })
            });

            if (response.ok) {
                // Remove synced events from outbox
                const syncedIds = outbox.map(e => e.eventId);
                EventStore.removeFromOutbox(syncedIds);
                console.log('[SyncEngine] Sync successful');
            } else {
                // If 404 (endpoint doesn't exist yet), we warn but maybe don't retry locally for now to avoid spam
                if (response.status === 404) {
                    console.warn('[SyncEngine] Sync endpoint not found (404). Backend needs update.');
                } else {
                    console.error('[SyncEngine] Sync failed', response.statusText);
                }
            }
        } catch (e) {
            console.error('[SyncEngine] Network error during sync', e);
        } finally {
            this.isSyncing = false;
        }
    }
}
