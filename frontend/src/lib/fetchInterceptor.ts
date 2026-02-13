import { browser } from '$app/environment';
import { CacheService } from '$lib/cacheService';

export function setupCacheInterceptor() {
    if (!browser) return;

    const originalFetch = window.fetch;

    window.fetch = async function (input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
        // Only cache GET requests
        if (init && init.method && init.method !== 'GET') {
            return originalFetch(input, init);
        }

        const url = typeof input === 'string' ? input : input instanceof URL ? input.toString() : input.url;

        // Use normalized URL as cache key
        // Filter out non-API calls if necessary or just cache everything safely
        if (!url.includes('/api/')) {
            return originalFetch(input, init);
        }

        const cachedResponse = await CacheService.get(url);
        if (cachedResponse) {
            console.log(`[Cache] Hit: ${url}`);
            return new Response(JSON.stringify(cachedResponse), {
                status: 200,
                headers: { 'Content-Type': 'application/json', 'X-Cache': 'HIT' }
            });
        }

        console.log(`[Cache] Miss: ${url}`);
        try {
            const response = await originalFetch(input, init);
            if (response.ok) {
                const clone = response.clone();
                try {
                    const data = await clone.json();
                    CacheService.set(url, data);
                } catch (e) {
                    // Not JSON, ignore
                }
            }
            return response;
        } catch (error) {
            throw error;
        }
    };
    console.log('[Cache] Interceptor enabled');
}
