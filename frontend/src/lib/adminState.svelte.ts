import { dbStart, ClientDB as PolyglotActions } from '$lib/db.js';
import { ClientDB } from '$lib/client-db/core';
import { PostService } from '$lib/postService.js';
import { browser } from '$app/environment';

interface AdminStats {
    posts: number;
    users: number;
    recentPosts: any[];
    systemState: string;
}

// Global shared state for the Admin section
let stats = $state<AdminStats | null>(null);
let posts = $state<any[]>([]);
let users = $state<any[]>([]);
let tables = $state<any[]>([]);
let menus = $state<any[]>([]);
let sidebarMenu = $state<any>(null);
let isOffline = $state(false);
let lastFetched = $state<number>(0);
let isSyncing = $state(false);
let isHydrating = false;

interface Toast {
    message: string;
    type: 'success' | 'error' | 'info';
    visible: boolean;
}
let toast = $state<Toast>({ message: '', type: 'success', visible: false });

// Immediate Hydration from localStorage (Zero Flicker)
if (browser) {
    const cachedStats = localStorage.getItem('admin_stats_cache');
    if (cachedStats) {
        stats = JSON.parse(cachedStats);
    }
    const cachedUsers = localStorage.getItem('admin_users_cache');
    if (cachedUsers) {
        users = JSON.parse(cachedUsers);
    }
}

export const adminState = {
    get stats() { return stats },
    get posts() { return posts },
    get users() { return users },
    get tables() { return tables },
    get menus() { return menus; },
    get sidebarMenu() { return sidebarMenu },
    get toast() { return toast },
    showToast(message: string, type: 'success' | 'error' | 'info' = 'success', duration: number = 3000) {
        toast.message = message;
        toast.type = type;
        toast.visible = true;

        setTimeout(() => {
            if (toast.message === message) {
                toast.visible = false;
            }
        }, duration);
    },
    async createMenu(name: string, firstItemRoute: string = "") {
        const db = await ClientDB.init();
        const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
        const finalRoute = firstItemRoute || `/admin/${slug}`;

        // Get max order
        const all = await db.getAll('menus');
        const maxOrder = all.reduce((max: number, m: any) => Math.max(max, m.order || 0), 0);

        const newMenu = {
            id: crypto.randomUUID(),
            name,
            order: maxOrder + 1,
            items: [
                {
                    id: crypto.randomUUID(),
                    label: name,
                    url: finalRoute.startsWith('/') ? finalRoute : `/admin/${finalRoute}`,
                    children: [],
                    isOpen: true
                }
            ]
        };
        await db.put('menus', newMenu);
        // Refresh local state
        const updatedAll = await db.getAll('menus');
        menus = updatedAll.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));
        return newMenu;
    },
    async deleteMenu(id: string) {
        const db = await ClientDB.init();
        await db.delete('menus', id);
        // Refresh local state
        const all = await db.getAll('menus');
        menus = all || [];
    },
    async updateMenu(id: string, name: string, items: any[]) {
        const db = await ClientDB.init();
        const menu = await db.get('menus', id);
        if (menu) {
            menu.name = name;
            menu.items = items;
            await db.put('menus', menu);
            // Refresh local state
            const all = await db.getAll('menus');
            menus = all ? all.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)) : [];
        }
    },
    async reorderMenu(newOrder: any[]) {
        // Update local state immediately (Optimistic UI)
        menus = newOrder.map((m, i) => ({ ...m, order: i }));

        try {
            const db = await ClientDB.init();
            const tx = db.transaction('menus', 'readwrite');

            for (let i = 0; i < newOrder.length; i++) {
                // Use snapshot to avoid proxy issues during persistence
                const menu = $state.snapshot(newOrder[i]);
                await tx.store.put({ ...menu, order: i });
            }

            await tx.done;
        } catch (e) {
            console.error("[AdminState] Failed to persist menu order", e);
        }
    },
    getPostBySlugLocal(slug: string) {
        return posts.find(p => p.slug === slug);
    },
    get isOffline() { return isOffline },
    get lastFetched() { return lastFetched },
    get isSyncing() { return isSyncing },

    /**
     * Initial fast load for Admin section
     */
    async loadAllLocal() {
        if (isHydrating) return;
        isHydrating = true;
        try {
            // Use a Promise.race to ensure IDB doesn't block the app indefinitely
            const idbRefPromise = dbStart();
            const clientDBInitPromise = ClientDB.init();

            // 1. Silent Secondary Hydration from PolyglotDB (stats/auth)
            try {
                // Timeout after 1s if IDB is stuck
                const db = await Promise.race([
                    idbRefPromise,
                    new Promise((_, reject) => setTimeout(() => reject('timeout'), 1000))
                ]) as any;

                if (db !== 'timeout') {
                    const dbStats = await db.get('stats', 'admin_stats');
                    if (dbStats && !stats) {
                        stats = dbStats;
                    }
                }
            } catch (e) {
                console.warn("[AdminState] Polyglot Stats load skipped", e);
            }

            const allPosts = await PostService.getLocalPostsMerged();
            posts = allPosts;

            // 1.5 Hydrate users from PolyglotDB
            try {
                const dbRef = await Promise.race([
                    idbRefPromise,
                    new Promise((_, reject) => setTimeout(() => reject('timeout'), 1000))
                ]) as any;

                if (dbRef !== 'timeout') {
                    const allUsers = await dbRef.getAll('auth');
                    if (users.length === 0 && allUsers.length > 0) {
                        users = allUsers;
                    }
                }
            } catch (e) {
                console.warn("[AdminState] Polyglot Users load skipped", e);
            }

            // 1.8 Hydrate custom tables from ClientDB
            try {
                const clientDB = await Promise.race([
                    clientDBInitPromise,
                    new Promise<null>((_, reject) => setTimeout(() => reject('timeout'), 1500))
                ]) as any;

                if (clientDB) {
                    const meta = await clientDB.getAll('_meta');
                    tables = meta || [];

                    let allMenus = await clientDB.getAll('menus');
                    if (allMenus && allMenus.length > 0) {
                        let changed = false;

                        // 1. Migration: Ensure order exists and fix empty items
                        allMenus.forEach((m: any, i: number) => {
                            let menuUpdated = false;
                            if (typeof m.order !== 'number') {
                                m.order = i;
                                menuUpdated = true;
                            }
                            if (!m.items || m.items.length === 0) {
                                const slug = m.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
                                m.items = [{
                                    id: crypto.randomUUID(),
                                    label: m.name,
                                    url: `/admin/${slug}`,
                                    children: [],
                                    isOpen: true
                                }];
                                menuUpdated = true;
                            }
                            if (menuUpdated) {
                                changed = true;
                                clientDB.put('menus', $state.snapshot(m)).catch(() => { });
                            }
                        });

                        // 2. Explode multipart menus (one-time migration)
                        const explodedItems: any[] = [];
                        let needsExplosion = false;
                        for (const m of allMenus) {
                            if (m.items && m.items.length > 1) {
                                needsExplosion = true;
                                break;
                            }
                        }

                        if (needsExplosion) {
                            const tx = clientDB.transaction('menus', 'readwrite');
                            const finalMenus: any[] = [];
                            for (const m of allMenus) {
                                if (m.items && m.items.length > 1) {
                                    await tx.store.delete(m.id);
                                    for (let i = 0; i < m.items.length; i++) {
                                        const item = m.items[i];
                                        const splitMenu = {
                                            id: crypto.randomUUID(),
                                            name: item.label,
                                            order: (m.order || 0) + (i * 0.1),
                                            items: [item]
                                        };
                                        await tx.store.put(splitMenu);
                                        finalMenus.push(splitMenu);
                                    }
                                } else {
                                    finalMenus.push(m);
                                }
                            }
                            await tx.done;
                            allMenus = finalMenus;
                        }

                        // 3. Final deduplication and sorting
                        const uniqueMap = new Map();
                        allMenus.sort((a: any, b: any) => (a.order || 0) - (b.order || 0));

                        const deduped: any[] = [];
                        for (const m of allMenus) {
                            const key = m.name + '|' + (m.items?.[0]?.url || '');
                            if (!uniqueMap.has(key)) {
                                uniqueMap.set(key, true);
                                deduped.push(m);
                            } else {
                                // Background cleanup of duplicates
                                clientDB.delete('menus', m.id).catch(() => { });
                            }
                        }

                        menus = deduped;
                    } else {
                        menus = [];
                    }
                }
            } catch (e) {
                // ignore
            }

            // 2. Initial Stats from local if none exists in cache
            if (!stats) {
                stats = {
                    posts: allPosts.length,
                    users: 1,
                    recentPosts: allPosts.slice(0, 5),
                    systemState: "Unsync Mode (Local)"
                };
                // Cache these local-only stats too
                if (browser) {
                    localStorage.setItem('admin_stats_cache', JSON.stringify(stats));
                    try {
                        await PolyglotActions.setStats(stats);
                    } catch (e) {
                        // ignore
                    }
                }
            }

            // Initial Users
            if (users.length === 0) {
                users = [{ fullName: 'Admin User', email: 'admin@devcms.com', role: 'admin', joinedAt: new Date().toISOString() }];
            }
        } catch (globalErr) {
            console.error("[AdminState] Critical load error:", globalErr);
            // Fallback to minimal state so UI doesn't crash
            if (!stats) stats = { posts: 0, users: 1, recentPosts: [], systemState: "Error Recovery Mode" };
            if (users.length === 0) users = [{ fullName: 'Admin User', email: 'admin@devcms.com', role: 'admin', joinedAt: new Date().toISOString() }];
        } finally {
            isHydrating = false;
        }
    },

    /**
     * Background refresh from API
     */
    async refreshFromAPI() {
        if (!browser || !navigator.onLine) {
            isOffline = true;
            return;
        }

        isSyncing = true;
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 2000);

            const [statsRes, postsRes, usersRes] = await Promise.allSettled([
                fetch("http://localhost:3333/api/admin/stats", { credentials: 'include', signal: controller.signal }),
                PostService.getApiPosts(),
                fetch("http://localhost:3333/api/admin/users", { credentials: 'include', signal: controller.signal })
            ]);
            clearTimeout(id);

            // Update Stats
            if (statsRes.status === 'fulfilled' && statsRes.value.ok) {
                const newStats = await statsRes.value.json();
                if (JSON.stringify(newStats) !== JSON.stringify(stats)) {
                    stats = newStats;
                    localStorage.setItem('admin_stats_cache', JSON.stringify(newStats));
                    await PolyglotActions.setStats(newStats);
                }
                isOffline = false;
            }

            // Update Posts
            if (postsRes.status === 'fulfilled' && postsRes.value.length > 0) {
                const merged = PostService.mergeAndSort(posts, postsRes.value);
                if (merged.length !== posts.length) {
                    posts = merged;
                }
            }

            // Update Users
            if (usersRes.status === 'fulfilled' && usersRes.value.ok) {
                const newUsers = await usersRes.value.json();
                if (JSON.stringify(newUsers) !== JSON.stringify(users)) {
                    users = newUsers;
                    localStorage.setItem('admin_users_cache', JSON.stringify(newUsers));
                    // Optional: persist to IDB here too if needed
                }
            }

            lastFetched = Date.now();
        } catch (e) {
            isOffline = true;
            console.log("[AdminState] Sync attempted but staying offline");
        } finally {
            isSyncing = false;
        }
    },

    /**
     * Start background polling for real-time feel
     */
    startPolling() {
        if (!browser) return;
        // Refresh every 60s
        setInterval(() => {
            this.refreshFromAPI();
        }, 60000);
    }
};
