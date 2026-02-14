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
    private static dbInstance: IDBPDatabase | null = null;
    private static initPromise: Promise<IDBPDatabase> | null = null;

    /**
     * CLEAN SLATE OPENER.
     * Version 40 resets everything for the new builder.
     */
    static async init(): Promise<IDBPDatabase> {
        if (this.dbInstance) return this.dbInstance;

        this.dbInstance = await openDB(this.DB_NAME, 42, {
            upgrade(db, oldVersion, newVersion, transaction) {
                // Only create stores if they don't exist. DO NOT DELETE EXISTING DATA.
                if (!db.objectStoreNames.contains('_meta')) db.createObjectStore('_meta', { keyPath: 'name' });
                if (!db.objectStoreNames.contains('_syncQueue')) db.createObjectStore('_syncQueue', { keyPath: 'id' });
                if (!db.objectStoreNames.contains('superadmin')) db.createObjectStore('superadmin', { keyPath: 'id' });
                if (!db.objectStoreNames.contains('menus')) db.createObjectStore('menus', { keyPath: 'id' });
                if (!db.objectStoreNames.contains('dashboards')) db.createObjectStore('dashboards', { keyPath: 'id' });
            }
        });

        await this.seedSystemData(this.dbInstance);
        await this.ensureDefaultMenus(this.dbInstance);
        return this.dbInstance;
    }

    static async seedSystemData(db: IDBPDatabase): Promise<void> {
        try {
            const tx = db.transaction(['superadmin'], 'readwrite');
            const store = tx.objectStore('superadmin');
            const existing = await store.get('default-admin');
            if (!existing) {
                await store.put({
                    id: 'default-admin',
                    fullName: 'Admin User',
                    email: 'admin@devcms.com',
                    role: 'admin',
                    joinedAt: new Date().toISOString()
                });
            }
            await tx.done;
        } catch (e) { /* silent */ }
    }

    static async ensureDefaultMenus(db: IDBPDatabase): Promise<void> {
        try {
            const tx = db.transaction(['menus'], 'readwrite');
            const count = await tx.objectStore('menus').count();
            if (count === 0) {
                // Seed defaults if totally empty
                const defaults = [
                    {
                        id: crypto.randomUUID(),
                        name: "Main Navigation",
                        items: [
                            { id: crypto.randomUUID(), label: "Dashboard", url: "/admin", children: [], isOpen: true },
                            { id: crypto.randomUUID(), label: "Blog", url: "/admin/blog", children: [], isOpen: true },
                            { id: crypto.randomUUID(), label: "Posts", url: "/admin/post", children: [], isOpen: true }
                        ]
                    }
                ];
                for (const menu of defaults) {
                    await tx.objectStore('menus').put(menu);
                }
            }
            await tx.done;
        } catch (e) { console.warn("Failed to seed default menus", e); }
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
