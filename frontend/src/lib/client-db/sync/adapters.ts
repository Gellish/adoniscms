/**
 * ClientDB Sync - Adapter Layer
 * Defines the interface for remote synchronization providers.
 */

export interface SyncOperation {
    id: string;
    table: string;
    action: 'create' | 'update' | 'delete';
    payload: any;
    version: number;
    createdAt: number;
}

export interface SyncAdapter {
    name: string;
    authenticate(): Promise<boolean>;
    sendBatch(operations: SyncOperation[]): Promise<{ success: string[]; failed: string[] }>;
}

/**
 * Generic REST API Adapter
 */
export class RestSyncAdapter implements SyncAdapter {
    name = 'REST API';
    constructor(private endpoint: string) { }

    async authenticate() { return true; }

    async sendBatch(operations: SyncOperation[]) {
        const res = await fetch(`${this.endpoint}/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ operations })
        });

        if (!res.ok) throw new Error('Sync failed');
        return await res.json();
    }
}

/**
 * AdonisJS Specialized Adapter
 */
export class AdonisSyncAdapter implements SyncAdapter {
    name = 'AdonisJS';
    constructor(private baseUrl: string) { }

    async authenticate() {
        // Implementation for Adonis Auth
        return true;
    }

    async sendBatch(operations: SyncOperation[]) {
        const res = await fetch(`${this.baseUrl}/api/v1/sync`, {
            method: 'POST',
            body: JSON.stringify({ ops: operations }),
            credentials: 'include'
        });
        return await res.json();
    }
}
