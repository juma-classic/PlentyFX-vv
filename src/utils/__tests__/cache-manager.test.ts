/**
 * Property-Based Tests for Cache Manager
 * Feature: zeus-analysis-enhancement
 */

import * as fc from 'fast-check';
import { CacheEntry,CacheManager } from '../cache-manager';

// Mock sessionStorage for testing
const mockStorage: { [key: string]: string } = {};

beforeAll(() => {
    // Mock sessionStorage
    global.sessionStorage = {
        getItem: (key: string) => mockStorage[key] || null,
        setItem: (key: string, value: string) => {
            mockStorage[key] = value;
        },
        removeItem: (key: string) => {
            delete mockStorage[key];
        },
        clear: () => {
            Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
        },
        key: (index: number) => Object.keys(mockStorage)[index] || null,
        length: Object.keys(mockStorage).length
    } as Storage;
});

beforeEach(() => {
    // Clear mock storage before each test
    Object.keys(mockStorage).forEach(key => delete mockStorage[key]);
});

describe('Cache Manager - Property-Based Tests', () => {
    /**
     * Feature: zeus-analysis-enhancement, Property 14: Cache TTL enforcement
     * Validates: Requirements 4.2
     */
    test('Property 14: cached data within TTL should be retrievable, expired data should return null', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 20 }), // cache key
                fc.jsonValue(), // data to cache (only JSON-serializable values)
                fc.integer({ min: 100, max: 10000 }), // TTL in ms
                (key, data, ttl) => {
                    // Clear any existing cache
                    CacheManager.clear(key);
                    
                    // Set cache with specific TTL
                    CacheManager.set(key, data, ttl);
                    
                    // Immediately retrieve - should be available
                    const retrieved = CacheManager.get(key);
                    expect(retrieved).toEqual(data);
                    
                    // Check isValid - should be true
                    expect(CacheManager.isValid(key)).toBe(true);
                    
                    // Simulate time passing beyond TTL by manipulating the cached entry
                    const storageKey = 'zeus_cache_' + key;
                    const cached = sessionStorage.getItem(storageKey);
                    if (cached) {
                        const entry = JSON.parse(cached);
                        // Set timestamp to past (beyond TTL)
                        entry.timestamp = Date.now() - ttl - 1000;
                        sessionStorage.setItem(storageKey, JSON.stringify(entry));
                    }
                    
                    // Now retrieve - should return null (expired)
                    const expiredRetrieve = CacheManager.get(key);
                    expect(expiredRetrieve).toBeNull();
                    
                    // isValid should now be false
                    expect(CacheManager.isValid(key)).toBe(false);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    /**
     * Feature: zeus-analysis-enhancement, Property 27: Cache corruption recovery
     * Validates: Requirements 7.5
     */
    test('Property 27: corrupted cache data should be cleared and return null', () => {
        fc.assert(
            fc.property(
                fc.string({ minLength: 1, maxLength: 20 }), // cache key
                fc.oneof(
                    fc.constant('invalid json {{{'),
                    fc.constant('{"incomplete": '),
                    fc.constant('null'),
                    fc.constant('undefined'),
                    fc.constant('{"data": "test"}'), // missing timestamp and ttl
                    fc.constant('{"timestamp": 123}'), // missing data and ttl
                    fc.constant('{"data": "test", "timestamp": "not a number", "ttl": 5000}'),
                    fc.constant('{"data": "test", "timestamp": -1, "ttl": 5000}'), // invalid timestamp
                    fc.constant('{"data": "test", "timestamp": 123, "ttl": -1}') // invalid ttl
                ),
                (key, corruptedData) => {
                    // Clear any existing cache
                    CacheManager.clear(key);
                    
                    // Manually insert corrupted data into storage
                    const storageKey = 'zeus_cache_' + key;
                    sessionStorage.setItem(storageKey, corruptedData);
                    
                    // Verify corrupted data exists in storage
                    expect(sessionStorage.getItem(storageKey)).toBe(corruptedData);
                    
                    // Try to retrieve - should return null
                    const retrieved = CacheManager.get(key);
                    expect(retrieved).toBeNull();
                    
                    // Verify cache was cleared (corruption recovery)
                    const afterClear = sessionStorage.getItem(storageKey);
                    expect(afterClear).toBeNull();
                    
                    // isValid should return false for corrupted data
                    // Re-insert corrupted data to test isValid
                    sessionStorage.setItem(storageKey, corruptedData);
                    expect(CacheManager.isValid(key)).toBe(false);
                    
                    return true;
                }
            ),
            { numRuns: 100 }
        );
    });

    // Additional unit tests for edge cases
    describe('Edge Cases', () => {
        test('should handle non-existent cache keys', () => {
            const result = CacheManager.get('non_existent_key');
            expect(result).toBeNull();
            expect(CacheManager.isValid('non_existent_key')).toBe(false);
        });

        test('should use default TTL when not specified', () => {
            const key = 'test_default_ttl';
            const data = { test: 'data' };
            
            CacheManager.set(key, data);
            
            const storageKey = 'zeus_cache_' + key;
            const cached = sessionStorage.getItem(storageKey);
            expect(cached).not.toBeNull();
            
            if (cached) {
                const entry: CacheEntry<any> = JSON.parse(cached);
                expect(entry.ttl).toBe(5 * 60 * 1000); // 5 minutes
            }
        });

        test('should clear specific cache entry', () => {
            CacheManager.set('key1', 'data1');
            CacheManager.set('key2', 'data2');
            
            expect(CacheManager.get('key1')).toBe('data1');
            expect(CacheManager.get('key2')).toBe('data2');
            
            CacheManager.clear('key1');
            
            expect(CacheManager.get('key1')).toBeNull();
            expect(CacheManager.get('key2')).toBe('data2');
        });

        test('should clear all cache entries when no key provided', () => {
            CacheManager.set('key1', 'data1');
            CacheManager.set('key2', 'data2');
            CacheManager.set('key3', 'data3');
            
            expect(CacheManager.get('key1')).toBe('data1');
            expect(CacheManager.get('key2')).toBe('data2');
            expect(CacheManager.get('key3')).toBe('data3');
            
            CacheManager.clear();
            
            expect(CacheManager.get('key1')).toBeNull();
            expect(CacheManager.get('key2')).toBeNull();
            expect(CacheManager.get('key3')).toBeNull();
        });

        test('should handle various data types', () => {
            const testCases = [
                { key: 'string', data: 'test string' },
                { key: 'number', data: 42 },
                { key: 'boolean', data: true },
                { key: 'object', data: { nested: { value: 'test' } } },
                { key: 'array', data: [1, 2, 3, 'four'] },
                { key: 'null', data: null }
            ];

            testCases.forEach(({ key, data }) => {
                CacheManager.set(key, data);
                const retrieved = CacheManager.get(key);
                expect(retrieved).toEqual(data);
            });
        });

        test('should handle cache entry with zero or negative timestamp gracefully', () => {
            const key = 'invalid_timestamp';
            const storageKey = 'zeus_cache_' + key;
            
            // Create entry with zero timestamp
            const invalidEntry = {
                data: 'test',
                timestamp: 0,
                ttl: 5000
            };
            
            sessionStorage.setItem(storageKey, JSON.stringify(invalidEntry));
            
            // Should detect as invalid and clear
            const result = CacheManager.get(key);
            expect(result).toBeNull();
            expect(sessionStorage.getItem(storageKey)).toBeNull();
        });

        test('should handle cache entry with zero or negative TTL gracefully', () => {
            const key = 'invalid_ttl';
            const storageKey = 'zeus_cache_' + key;
            
            // Create entry with zero TTL
            const invalidEntry = {
                data: 'test',
                timestamp: Date.now(),
                ttl: 0
            };
            
            sessionStorage.setItem(storageKey, JSON.stringify(invalidEntry));
            
            // Should detect as invalid and clear
            const result = CacheManager.get(key);
            expect(result).toBeNull();
            expect(sessionStorage.getItem(storageKey)).toBeNull();
        });

        test('should not interfere with non-cache sessionStorage items', () => {
            // Add non-cache item
            sessionStorage.setItem('other_key', 'other_value');
            
            // Add cache items
            CacheManager.set('cache_key1', 'cache_value1');
            CacheManager.set('cache_key2', 'cache_value2');
            
            // Clear all cache
            CacheManager.clear();
            
            // Non-cache item should still exist
            expect(sessionStorage.getItem('other_key')).toBe('other_value');
            
            // Cache items should be cleared
            expect(CacheManager.get('cache_key1')).toBeNull();
            expect(CacheManager.get('cache_key2')).toBeNull();
        });
    });
});
