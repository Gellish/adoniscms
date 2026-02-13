import { browser } from '$app/environment';
import { EventStore } from '$lib/cqrs/eventStore.js';
import { PostProjection } from '$lib/cqrs/projections.js';
import type { Post } from '$lib/types.js';
import { getLocalPosts } from '$lib/content.js';

export const PostService = {

    /**
     * Get local merged posts (Markdown + Events) - FAST
     */
    async getLocalPostsMerged(): Promise<Post[]> {
        const posts: Post[] = [];

        // 1. Fetch from Local Markdown
        const markdownPosts = await getLocalPosts();
        // Convert to shared Post type if needed (ensure slug is string)
        posts.push(...markdownPosts.map(p => ({
            ...p,
            id: p.id || p.slug || 'unknown',
            slug: p.slug || '',
            source: 'local' as const
        })));

        // 2. Apply Local Events (Optimistic UI)
        // In a real app, you'd iterate all aggregate IDs known effectively
        // For this demo, we can just scan localStorage key patterns or maintain a list
        const localEvents = await getAllLocalPostEvents();

        for (const eventStream of localEvents) {
            const projection = new PostProjection();
            const state = projection.project(eventStream);

            if (state) {
                // Convert PostState to Post
                posts.push({
                    id: state.id,
                    title: state.title,
                    content: state.content,
                    slug: state.id, // simplified
                    created_at: state.createdAt || new Date().toISOString(),
                    tags: [], // TODO: Tag support in events
                    source: 'offline-created'
                });
            }
        }

        return this.dedupAndSort(posts);
    },

    /**
     * Get API posts only - SLOW
     */
    async getApiPosts(): Promise<Post[]> {
        try {
            const controller = new AbortController();
            const id = setTimeout(() => controller.abort(), 2000); // 2s timeout

            const res = await fetch('http://localhost:3333/api/posts', {
                signal: controller.signal
            });
            clearTimeout(id);

            if (res.ok) {
                const apiPosts = await res.json();
                return apiPosts.map((p: any) => ({ ...p, source: 'api' }));
            }
        } catch (e) {
            console.log('[PostService] Status: Unsync Mode (Using Local Data)');
        }
        return [];
    },

    /**
     * Helper to merge new posts with existing posts
     */
    mergeAndSort(existing: Post[], newPosts: Post[]): Post[] {
        const merged = [...existing, ...newPosts];
        return this.dedupAndSort(merged);
    },

    /**
     * Helper to dedup by ID and sort by date desc
     */
    dedupAndSort(posts: Post[]): Post[] {
        const uniquePosts = Array.from(new Map(posts.map(p => [p.id, p])).values());
        return uniquePosts.sort((a, b) => {
            const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
            const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
            return dateB - dateA;
        });
    },

    /**
     * Legacy wrapper (Slow)
     */
    async getAllPosts(): Promise<Post[]> {
        const local = await this.getLocalPostsMerged();

        // Offline-First: Only try API if online
        let remote: Post[] = [];
        if (browser && navigator.onLine) {
            remote = await this.getApiPosts();
        }

        return this.mergeAndSort(local, remote);
    },

    /**
     * Create a new post via Event Sourcing
     */
    async createPost(title: string, content: string, author: string): Promise<void> {
        const id = crypto.randomUUID();

        await EventStore.writeEvent({
            aggregateId: id,
            aggregateType: 'post',
            eventType: 'POST_CREATED',
            version: 1,
            payload: {
                id,
                title,
                content,
                author,
                timestamp: new Date().toISOString()
            }
        });
    },

    async getPostBySlug(slug: string): Promise<Post | null> {
        // 1. Try Local
        const localPosts = await this.getLocalPostsMerged();
        const localMatch = localPosts.find(p => p.slug === slug || String(p.id) === slug);
        if (localMatch) return localMatch;

        // 2. Try Remote
        if (browser && !navigator.onLine) return null;

        try {
            const res = await fetch(`http://localhost:3333/api/posts/${slug}`);
            if (res.ok) {
                const post = await res.json();
                return { ...post, source: 'api' };
            }
        } catch (e) {
            console.warn('API lookup failed for slug:', slug);
        }

        return null;
    }
};

// Helper: Scan IndexedDB for post events (via ClientDB)
import { ClientDB } from '$lib/db.js';

async function getAllLocalPostEvents() {
    if (!browser) return [];
    // Get all events that are of type 'post'
    // Since we don't have a perfect cursor setup in the simple db wrapper, 
    // we can get all events and filter, or add a method to ClientDB.
    // For now, let's assuming we add a method to ClientDB or use raw openDB here if handy.
    // Better: Add getAllEvents() to ClientDB and filter here.
    return ClientDB.getAllEventsByType('post');
}
