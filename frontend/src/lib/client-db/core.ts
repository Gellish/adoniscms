/**
 * ClientDB Core - Browser-Only IndexedDB Wrapper
 * Supports dynamic table (object store) management and schema versioning.
 */

import { openDB, type IDBPDatabase, type DBSchema } from 'idb';

export interface TableMeta {
    name: string;
    keyPath: string;
    indices: string[];
    isEncrypted: boolean;
    createdAt: number;
}

export class ClientDB {
    private static readonly DB_NAME = 'ClientDB';
    private static initPromise: Promise<IDBPDatabase> | null = null;

    /**
     * Initializes the database.
     * Checks meta store for existing table definitions and upgrades if necessary.
     */
    static async init(): Promise<IDBPDatabase> {
        if (this.initPromise) return this.initPromise;

        this.initPromise = (async () => {
            try {
                console.log('[ClientDB] Starting initialization...');

                // 1. Open WITHOUT a version to detect the current state
                const probe = await openDB(this.DB_NAME);
                const currentVersion = probe.version;
                const currentStores = Array.from(probe.objectStoreNames);
                console.log(`[ClientDB] Detected version: ${currentVersion}, stores: ${currentStores}`);

                // Read user-defined tables if _meta exists
                let tables: TableMeta[] = [];
                if (currentStores.includes('_meta')) {
                    tables = await probe.getAll('_meta');
                }
                probe.close();

                // 2. Determine if we need to upgrade
                const SYSTEM_STORES = ['_meta', '_syncQueue', 'superadmin', 'menus'];
                const allNeededStores = [...SYSTEM_STORES, ...tables.map(t => t.name)];
                const missingStores = allNeededStores.filter(s => !currentStores.includes(s));
                const needsUpgrade = missingStores.length > 0;

                const targetVersion = needsUpgrade ? currentVersion + 1 : currentVersion;
                console.log(`[ClientDB] Missing stores: [${missingStores}], target version: ${targetVersion}`);

                // 3. Open at the correct version
                const db = await openDB(this.DB_NAME, targetVersion, {
                    upgrade(db) {
                        if (!db.objectStoreNames.contains('_meta')) db.createObjectStore('_meta', { keyPath: 'name' });
                        if (!db.objectStoreNames.contains('_syncQueue')) {
                            const s = db.createObjectStore('_syncQueue', { keyPath: 'id' });
                            s.createIndex('by-synced', 'synced');
                        }
                        if (!db.objectStoreNames.contains('superadmin')) db.createObjectStore('superadmin', { keyPath: 'id' });
                        if (!db.objectStoreNames.contains('menus')) db.createObjectStore('menus', { keyPath: 'id' });

                        tables.forEach(table => {
                            if (!db.objectStoreNames.contains(table.name)) {
                                console.log(`[ClientDB] Creating user table: ${table.name}`);
                                const store = db.createObjectStore(table.name, { keyPath: table.keyPath || 'id' });
                                if (table.indices) {
                                    table.indices.forEach(idx => store.createIndex(idx, idx));
                                }
                            }
                        });
                    },
                    blocked() {
                        console.warn('[ClientDB] Upgrade blocked by another tab.');
                    }
                });

                // 4. Seed system data
                await this.seedSystemData(db);

                console.log('[ClientDB] Initialized successfully.');
                return db;
            } catch (error) {
                console.error('[ClientDB] Initialization failed:', error);
                this.initPromise = null;
                throw error;
            }
        })();

        return this.initPromise;
    }

    /**
     * Seeds default system data. Public so it can be called manually.
     */
    static async seedSystemData(db: IDBPDatabase): Promise<void> {
        try {
            console.log('[ClientDB] Checking system data...');
            const tx = db.transaction('superadmin', 'readwrite');
            const store = tx.objectStore('superadmin');
            const count = await store.count();

            if (count === 0) {
                console.log('[ClientDB] Seeding default admin...');
                await store.put({
                    id: 'default-admin',
                    email: 'admin@devcms.com',
                    password: 'hash',
                    role: 'superadmin',
                    createdAt: Date.now()
                });
                console.log('[ClientDB] Seed complete.');
            } else {
                console.log('[ClientDB] System data already present.');
            }
            await tx.done;
        } catch (e) {
            console.error('[ClientDB] Seeding failed:', e);
        }
    }

    /**
     * Creates a new Table (Object Store) dynamically.
     */
    static async createTable(meta: TableMeta): Promise<void> {
        const db = await this.init();
        const tx = db.transaction('_meta', 'readwrite');
        await tx.store.put(meta);
        await tx.done;

        // Invalidate and re-init to trigger upgrade
        this.initPromise = null;
        db.close();
        await this.init();
    }

    /**
     * Deletes a Table (Object Store) dynamically.
     */
    static async deleteTable(name: string): Promise<void> {
        const db = await this.init();
        const tx = db.transaction('_meta', 'readwrite');
        await tx.store.delete(name);
        await tx.done;

        this.initPromise = null;
        db.close();
        await this.init();
    }

    private static async getCurrentVersion(): Promise<number> {
        const db = await openDB(this.DB_NAME);
        const version = db.version;
        db.close();
        return version;
    }
}
