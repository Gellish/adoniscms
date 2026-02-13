export class CacheService {
    private static CACHE_PREFIX = 'api_cache_';
    private static TTL = 5 * 60 * 1000; // 5 minutes

    static async get<T>(key: string): Promise<T | null> {
        const item = localStorage.getItem(this.CACHE_PREFIX + key);
        if (!item) return null;

        const { value, expiry } = JSON.parse(item);
        if (Date.now() > expiry) {
            localStorage.removeItem(this.CACHE_PREFIX + key);
            return null;
        }

        return value as T;
    }

    static set(key: string, value: any, ttl: number = this.TTL): void {
        const item = {
            value,
            expiry: Date.now() + ttl
        };
        localStorage.setItem(this.CACHE_PREFIX + key, JSON.stringify(item));
    }

    static clear(): void {
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith(this.CACHE_PREFIX)) {
                localStorage.removeItem(key);
            }
        });
    }
}
