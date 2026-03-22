/**
 * Cache Manager for Zeus Analysis Tool
 * Provides caching functionality with TTL support and corruption recovery
 */

export interface CacheEntry<T> {
    data: T;
    timestamp: number;
    ttl: number;
}

export class CacheManager {
    private static readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes in milliseconds
    private static readonly STORAGE_PREFIX = 'zeus_cache_';

    /**
     * Get cached data by key
     * @param key Cache key
     * @returns Cached data or null if not found/expired/corrupted
     */
    static get<T>(key: string): T | null {
        try {
            const storageKey = this.STORAGE_PREFIX + key;
            const cached = sessionStorage.getItem(storageKey);
            
            if (!cached) {
                return null;
            }

            const entry: CacheEntry<T> = JSON.parse(cached);
            
            // Validate cache entry structure
            if (!this.isValidCacheEntry(entry)) {
                console.warn('Cache corrupted, clearing:', key);
                this.clear(key);
                return null;
            }

            // Check if cache has expired
            const now = Date.now();
            const age = now - entry.timestamp;
            
            if (age > entry.ttl) {
                // Cache expired, remove it
                this.clear(key);
                return null;
            }

            return entry.data;
        } catch (error) {
            // Cache corruption - clear and return null
            console.error('Error reading cache, clearing:', error);
            this.clear(key);
            return null;
        }
    }

    /**
     * Set cached data with optional TTL
     * @param key Cache key
     * @param data Data to cache
     * @param ttl Time to live in milliseconds (default: 5 minutes)
     */
    static set<T>(key: string, data: T, ttl: number = this.DEFAULT_TTL): void {
        try {
            const storageKey = this.STORAGE_PREFIX + key;
            const entry: CacheEntry<T> = {
                data,
                timestamp: Date.now(),
                ttl
            };

            sessionStorage.setItem(storageKey, JSON.stringify(entry));
        } catch (error) {
            console.error('Error writing to cache:', error);
            // Fail silently - caching is not critical
        }
    }

    /**
     * Clear cache entry or all cache entries
     * @param key Optional cache key. If not provided, clears all cache entries
     */
    static clear(key?: string): void {
        try {
            if (key) {
                const storageKey = this.STORAGE_PREFIX + key;
                sessionStorage.removeItem(storageKey);
            } else {
                // Clear all cache entries with our prefix
                const keysToRemove: string[] = [];
                for (let i = 0; i < sessionStorage.length; i++) {
                    const storageKey = sessionStorage.key(i);
                    if (storageKey && storageKey.startsWith(this.STORAGE_PREFIX)) {
                        keysToRemove.push(storageKey);
                    }
                }
                keysToRemove.forEach(storageKey => sessionStorage.removeItem(storageKey));
            }
        } catch (error) {
            console.error('Error clearing cache:', error);
        }
    }

    /**
     * Check if cache entry is valid
     * @param key Cache key
     * @returns true if cache entry exists and is not expired
     */
    static isValid(key: string): boolean {
        try {
            const storageKey = this.STORAGE_PREFIX + key;
            const cached = sessionStorage.getItem(storageKey);
            
            if (!cached) {
                return false;
            }

            const entry: CacheEntry<any> = JSON.parse(cached);
            
            // Validate structure
            if (!this.isValidCacheEntry(entry)) {
                return false;
            }

            // Check expiration
            const now = Date.now();
            const age = now - entry.timestamp;
            
            return age <= entry.ttl;
        } catch (error) {
            return false;
        }
    }

    /**
     * Validate cache entry structure
     * @param entry Cache entry to validate
     * @returns true if entry has valid structure
     */
    private static isValidCacheEntry<T>(entry: any): entry is CacheEntry<T> {
        return (
            entry !== null &&
            typeof entry === 'object' &&
            'data' in entry &&
            'timestamp' in entry &&
            'ttl' in entry &&
            typeof entry.timestamp === 'number' &&
            typeof entry.ttl === 'number' &&
            entry.timestamp > 0 &&
            entry.ttl > 0
        );
    }
}
