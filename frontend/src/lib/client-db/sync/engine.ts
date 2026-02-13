/**
 * ClientDB Sync - Engine
 * Manages the offline sync queue and conflict resolution.
 */

import { ClientDB } from '$lib/client-db/core';
import type { SyncOperation, SyncAdapter } from '$lib/client-db/sync/adapters';

export class SyncEngine {
    private static isSyncing = false;
    private static adapter: SyncAdapter | null = null;

    static setAdapter(adapter: SyncAdapter) {
        this.adapter = adapter;
    }

    /**
     * Logs an operation to the sync queue.
     */
    static async logOperation(op: Omit<SyncOperation, 'id' | 'createdAt' | 'version'>): Promise<void> {
        const db = await ClientDB.init();
        const operation: SyncOperation = {
            ...op,
            id: crypto.randomUUID(),
            createdAt: Date.now(),
            version: 1 // Baseline versioning
        };

        const tx = db.transaction('_syncQueue', 'readwrite');
        await tx.store.add({ ...operation, synced: 0 });
        await tx.done;

        // Trigger background sync attempt
        this.triggerSync();
    }

    /**
     * Attempts to process the sync queue if online.
     */
    static async triggerSync() {
        if (this.isSyncing || !this.adapter || !navigator.onLine) return;

        this.isSyncing = true;
        try {
            const db = await ClientDB.init();
            const pending: any[] = await db.getAllFromIndex('_syncQueue', 'by-synced', 0);

            if (pending.length === 0) return;

            console.log(`[Sync] Attempting to sync ${pending.length} operations...`);

            const result = await this.adapter.sendBatch(pending);

            // Mark successful ops as synced
            const tx = db.transaction('_syncQueue', 'readwrite');
            for (const id of result.success) {
                const op = await tx.store.get(id);
                if (op) {
                    op.synced = 1;
                    await tx.store.put(op);
                }
            }
            await tx.done;

            console.log(`[Sync] Successfully synced ${result.success.length} items.`);
        } catch (e) {
            console.error('[Sync] Engine error:', e);
        } finally {
            this.isSyncing = false;
        }
    }
}
