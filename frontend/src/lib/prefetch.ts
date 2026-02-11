import { CacheService } from './cacheService';

// Function to prefetch data for a URL
export async function prefetch(url: string) {
    if (!url || url.startsWith('#')) return;

    // Check if it's an API call or a page route that needs API data
    // For this simple app, we can map routes to API endpoints
    // e.g. /blog/my-post -> /api/posts/my-post (hypothetically)
    // Or just cache the API calls directly if we know them.

    // Using the same logic as spa-frame, we might prefetch the HTML?
    // But in Svelte SPA, we don't fetch HTML. We fetch JSON.

    // So "prefetching" means pre-loading data for the view.
    if (url.startsWith('/blog/')) {
        // We can optimistically fetch the post list or detail?
        // For now, let's just log it, as accurate data prefetching depends on knowing the data dependencies.
        // But we CAN prefetch the JS modules using Vite's native module preloading which happens automatically.
    }
}

// Action for Svelte elements
export function linkPrefetch(node: HTMLElement) {
    const handleMouseOver = () => {
        const href = node.getAttribute('href');
        if (href) {
            console.log(`[Prefetch] Hovered ${href}`);
            // Logic to prefetch data for this route would go here.
            // Example: if (href === '/blog') PostService.getApiPosts();
        }
    };

    node.addEventListener('mouseover', handleMouseOver, { passive: true });

    return {
        destroy() {
            node.removeEventListener('mouseover', handleMouseOver);
        }
    };
}
