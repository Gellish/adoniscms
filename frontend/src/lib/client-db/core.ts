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
    static init(): Promise<IDBPDatabase> {
        if (this.initPromise) return this.initPromise;

        this.initPromise = (async () => {
            try {
                // 1. Probe version using native API (which is non-blocking to the app thread)
                const probeVersion = await new Promise<number>((resolve) => {
                    const req = indexedDB.open(this.DB_NAME);
                    req.onsuccess = (e: any) => {
                        const db = e.target.result;
                        const v = db.version;
                        db.close();
                        resolve(v);
                    };
                    req.onupgradeneeded = (e: any) => {
                        e.target.transaction.abort();
                        resolve(0);
                    };
                    req.onerror = () => resolve(0);
                });

                // 2. Determine target version (v10+ safety)
                let targetVersion = Math.max(probeVersion, 9);
                targetVersion++;

                const db = await openDB(this.DB_NAME, targetVersion, {
                    upgrade(db) {
                        if (!db.objectStoreNames.contains('_meta')) db.createObjectStore('_meta', { keyPath: 'name' });
                        if (!db.objectStoreNames.contains('_syncQueue')) {
                            const s = db.createObjectStore('_syncQueue', { keyPath: 'id' });
                            s.createIndex('by-synced', 'synced');
                        }
                        if (!db.objectStoreNames.contains('superadmin')) db.createObjectStore('superadmin', { keyPath: 'id' });
                        if (!db.objectStoreNames.contains('menus')) db.createObjectStore('menus', { keyPath: 'id' });
                    },
                    blocked() {
                        console.warn('[ClientDB] Upgrade blocked. Close other tabs!');
                    }
                });

                db.onversionchange = () => {
                    db.close();
                    this.initPromise = null;
                };

                await this.seedSystemData(db);
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
            // Seed menus
            console.log('[ClientDB] Checking menus data...');
            const txMenus = db.transaction('menus', 'readwrite');
            const countMenus = await txMenus.store.count();
            if (countMenus === 0) {
                console.log('[ClientDB] Seeding default menus...');
                await txMenus.store.put({
                    id: "1",
                    name: "Main Navigation",
                    items: [
                        { id: "1a", label: "Home", url: "/", children: [], isOpen: true },
                        { id: "1b", label: "Blog", url: "/blog", isOpen: true, children: [] }
                    ]
                });
                console.log('[ClientDB] Default menus seeded.');
            } else {
                console.log('[ClientDB] Menus already present.');
            }
            await txMenus.done;

            // Seed superadmin
            console.log('[ClientDB] Checking superadmin data...');
            const txSuperadmin = db.transaction('superadmin', 'readwrite');
            const storeSuperadmin = txSuperadmin.objectStore('superadmin');
            const countSuperadmin = await storeSuperadmin.count();

            if (countSuperadmin === 0) {
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
