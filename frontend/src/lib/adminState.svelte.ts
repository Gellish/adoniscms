import { ClientDB, dbStart } from './db.js';
import { PostService } from './postService.js';
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
let isOffline = $state(false);
let lastFetched = $state<number>(0);
let isSyncing = $state(false);

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
        // 1. Silent Secondary Hydration from IndexedDB
        try {
            const dbStats = await ClientDB.getStats();
            if (dbStats && !stats) {
                stats = dbStats;
            }
        } catch (e) {
            // ignore IDB errors, we have localStorage or will get API data
        }

        const allPosts = await PostService.getLocalPostsMerged();
        posts = allPosts;

        // 1.5 Hydrate users from IDB
        try {
            const dbRef = await dbStart();
            const allUsers = await dbRef.getAll('auth');
            if (users.length === 0 && allUsers.length > 0) {
                users = allUsers;
            }
        } catch (e) { }

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
                    await ClientDB.setStats(stats);
                } catch (e) {
                    // ignore
                }
            }
        }

        // Initial Users
        if (users.length === 0) {
            users = [{ fullName: 'Admin User', email: 'admin@devcms.com', role: 'admin', joinedAt: new Date().toISOString() }];
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
                    await ClientDB.setStats(newStats); // Also save to IDB
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
