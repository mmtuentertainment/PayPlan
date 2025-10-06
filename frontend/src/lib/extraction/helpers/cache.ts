/**
 * LRU Cache for extraction results
 */

import type { ExtractionResult } from '../../email-extractor';

interface CacheEntry {
  result: ExtractionResult;
  timestamp: number;
}

export class ExtractionCache {
  private cache: Map<string, CacheEntry> = new Map();
  private maxSize: number;
  private ttlMs: number;
  private hits: number = 0;
  private misses: number = 0;

  constructor(maxSize: number = 10, ttlMs: number = 5 * 60 * 1000) {
    this.maxSize = maxSize;
    this.ttlMs = ttlMs;
  }

  /**
   * Generate hash for email text + timezone + options
   */
  private hash(emailText: string, timezone: string, options?: any): string {
    // Simple hash using length + first/last chars + timezone + options
    const optionsStr = options ? JSON.stringify(options) : '';
    const sample = emailText.length > 100
      ? emailText.substring(0, 50) + emailText.substring(emailText.length - 50)
      : emailText;

    // Create a simple hash
    let hash = 0;
    const str = sample + timezone + optionsStr;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return hash.toString(36) + '-' + emailText.length;
  }

  /**
   * Get cached result if available and not expired
   */
  get(emailText: string, timezone: string, options?: any): ExtractionResult | null {
    const key = this.hash(emailText, timezone, options);
    const entry = this.cache.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // Check if expired
    const now = Date.now();
    if (now - entry.timestamp > this.ttlMs) {
      this.cache.delete(key);
      this.misses++;
      return null;
    }

    // Move to end (most recently used)
    this.cache.delete(key);
    this.cache.set(key, entry);
    this.hits++;

    return entry.result;
  }

  /**
   * Store result in cache
   */
  set(emailText: string, timezone: string, result: ExtractionResult, options?: any): void {
    const key = this.hash(emailText, timezone, options);

    // Evict oldest if at capacity
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      result,
      timestamp: Date.now()
    });
  }

  /**
   * Clear all cache entries
   */
  clear(): void {
    this.cache.clear();
    this.hits = 0;
    this.misses = 0;
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.hits + this.misses;
    const hitRate = total > 0 ? (this.hits / total) * 100 : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hits: this.hits,
      misses: this.misses,
      total,
      hitRate: hitRate.toFixed(2) + '%',
      hitRateRaw: hitRate
    };
  }

  /**
   * Get current cache size
   */
  size(): number {
    return this.cache.size;
  }
}

// Global cache instance
export const extractionCache = new ExtractionCache();
