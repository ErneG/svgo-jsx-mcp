/**
 * SVG Optimization Cache
 *
 * LRU cache for storing optimized SVG results keyed by content hash.
 * Uses SHA-256 to generate consistent cache keys from content + options.
 */

import { createHash } from "crypto";

export interface CacheOptions {
  camelCase?: boolean;
  [key: string]: unknown;
}

export interface CacheEntry {
  result: string;
  originalSize: number;
  optimizedSize: number;
  timestamp: number;
}

export interface CacheStats {
  hits: number;
  misses: number;
  size: number;
  maxSize: number;
  hitRate: string;
}

/**
 * Generate a consistent hash key from SVG content and options
 */
export function generateCacheKey(content: string, options: CacheOptions = {}): string {
  const normalizedContent = content.trim();
  const normalizedOptions = JSON.stringify(options, Object.keys(options).sort());
  const data = `${normalizedContent}|${normalizedOptions}`;

  return createHash("sha256").update(data).digest("hex");
}

/**
 * LRU Cache implementation for SVG optimization results
 */
class LRUCache<T> {
  private cache: Map<string, T> = new Map();
  private readonly maxSize: number;

  constructor(maxSize: number = 1000) {
    this.maxSize = maxSize;
  }

  get(key: string): T | undefined {
    const value = this.cache.get(key);
    if (value !== undefined) {
      // Move to end (most recently used)
      this.cache.delete(key);
      this.cache.set(key, value);
    }
    return value;
  }

  set(key: string, value: T): void {
    // Remove if exists to update position
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evict oldest entries if at capacity
    while (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value;
      if (oldestKey) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, value);
  }

  has(key: string): boolean {
    return this.cache.has(key);
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }

  getMaxSize(): number {
    return this.maxSize;
  }
}

/**
 * Global SVG optimization cache instance
 */
class SvgOptimizationCache {
  private cache: LRUCache<CacheEntry>;
  private hits: number = 0;
  private misses: number = 0;

  constructor(maxSize: number = 1000) {
    this.cache = new LRUCache<CacheEntry>(maxSize);
  }

  /**
   * Get cached optimization result
   */
  get(content: string, options: CacheOptions = {}): CacheEntry | undefined {
    const key = generateCacheKey(content, options);
    const entry = this.cache.get(key);

    if (entry) {
      this.hits++;
      return entry;
    }

    this.misses++;
    return undefined;
  }

  /**
   * Store optimization result in cache
   */
  set(content: string, options: CacheOptions, entry: Omit<CacheEntry, "timestamp">): void {
    const key = generateCacheKey(content, options);
    this.cache.set(key, {
      ...entry,
      timestamp: Date.now(),
    });
  }

  /**
   * Check if content is cached
   */
  has(content: string, options: CacheOptions = {}): boolean {
    const key = generateCacheKey(content, options);
    return this.cache.has(key);
  }

  /**
   * Clear the cache
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics
   */
  getStats(): CacheStats {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? ((this.hits / total) * 100).toFixed(1) : "0.0";

    return {
      hits: this.hits,
      misses: this.misses,
      size: this.cache.size,
      maxSize: this.cache.getMaxSize(),
      hitRate: `${hitRate}%`,
    };
  }

  /**
   * Reset statistics (but keep cache entries)
   */
  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
  }
}

// Global singleton instance
export const svgCache = new SvgOptimizationCache(1000);

// Export class for testing
export { SvgOptimizationCache, LRUCache };
