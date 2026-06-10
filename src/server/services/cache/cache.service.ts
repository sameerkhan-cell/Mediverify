/**
 * Enterprise Cache Service
 * Provides abstraction for Redis-based high-speed caching of pharmaceutical data.
 */
export class CacheService {
    private static mockCache: Map<string, { value: any; expiry: number }> = new Map();

    /**
     * Get cached value
     */
    static async get<T>(key: string): Promise<T | null> {
        const entry = this.mockCache.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiry) {
            this.mockCache.delete(key);
            return null;
        }
        return entry.value as T;
    }

    /**
     * Set cached value with TTL (seconds)
     */
    static async set(key: string, value: any, ttlSeconds: number = 3600): Promise<void> {
        this.mockCache.set(key, {
            value,
            expiry: Date.now() + ttlSeconds * 1000
        });
    }

    static async delete(key: string): Promise<void> {
        this.mockCache.delete(key);
    }

    /**
     * Medicine verification cache key helper
     */
    static getVerificationKey(qrCode: string): string {
        return `verify:${qrCode}`;
    }
}
