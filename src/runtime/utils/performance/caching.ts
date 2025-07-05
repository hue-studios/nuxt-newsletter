// src/runtime/utils/performance/caching.ts
/**
 * Advanced caching utilities for newsletter system
 */

// In-memory cache with TTL support
export class MemoryCache<T = any> {
  private cache = new Map<string, { data: T; expires: number; hits: number }>();
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    deletes: 0,
  };

  constructor(
    private defaultTTL: number = 5 * 60 * 1000, // 5 minutes
    private maxSize: number = 1000
  ) {
    // Cleanup expired entries every minute
    setInterval(() => this.cleanup(), 60 * 1000);
  }

  get(key: string): T | null {
    const entry = this.cache.get(key);

    if (!entry) {
      this.stats.misses++;
      return null;
    }

    if (entry.expires < Date.now()) {
      this.cache.delete(key);
      this.stats.misses++;
      return null;
    }

    entry.hits++;
    this.stats.hits++;
    return entry.data;
  }

  set(key: string, data: T, ttl?: number): void {
    // Remove oldest entries if cache is full
    if (this.cache.size >= this.maxSize) {
      this.evictLRU();
    }

    const expires = Date.now() + (ttl || this.defaultTTL);
    this.cache.set(key, { data, expires, hits: 0 });
    this.stats.sets++;
  }

  has(key: string): boolean {
    const entry = this.cache.get(key);
    return entry ? entry.expires > Date.now() : false;
  }

  delete(key: string): boolean {
    const deleted = this.cache.delete(key);
    if (deleted) this.stats.deletes++;
    return deleted;
  }

  clear(): void {
    this.cache.clear();
    this.stats = { hits: 0, misses: 0, sets: 0, deletes: 0 };
  }

  getStats() {
    const hitRate =
      this.stats.hits / (this.stats.hits + this.stats.misses) || 0;
    return {
      ...this.stats,
      hitRate: Math.round(hitRate * 100) / 100,
      size: this.cache.size,
    };
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (entry.expires < now) {
        this.cache.delete(key);
      }
    }
  }

  private evictLRU(): void {
    // Find and remove least recently used (lowest hits)
    let lruKey = "";
    let lruHits = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.hits < lruHits) {
        lruHits = entry.hits;
        lruKey = key;
      }
    }

    if (lruKey) {
      this.cache.delete(lruKey);
    }
  }
}

// Newsletter-specific cache
export class NewsletterCache {
  private compiledCache = new MemoryCache<string>(15 * 60 * 1000); // 15 min for compiled HTML
  private analyticsCache = new MemoryCache<any>(5 * 60 * 1000); // 5 min for analytics
  private templateCache = new MemoryCache<any>(30 * 60 * 1000); // 30 min for templates
  private subscriberCache = new MemoryCache<any>(10 * 60 * 1000); // 10 min for subscriber data

  // Newsletter compilation cache
  getCachedHTML(newsletterId: number): string | null {
    return this.compiledCache.get(`newsletter-${newsletterId}`);
  }

  setCachedHTML(newsletterId: number, html: string): void {
    this.compiledCache.set(`newsletter-${newsletterId}`, html);
  }

  invalidateNewsletter(newsletterId: number): void {
    this.compiledCache.delete(`newsletter-${newsletterId}`);
    this.analyticsCache.delete(`analytics-${newsletterId}`);
  }

  // Analytics cache
  getCachedAnalytics(key: string): any | null {
    return this.analyticsCache.get(`analytics-${key}`);
  }

  setCachedAnalytics(key: string, data: any): void {
    this.analyticsCache.set(`analytics-${key}`, data);
  }

  // Template cache
  getCachedTemplate(templateId: number): any | null {
    return this.templateCache.get(`template-${templateId}`);
  }

  setCachedTemplate(templateId: number, template: any): void {
    this.templateCache.set(`template-${templateId}`, template);
  }

  // Subscriber cache
  getCachedSubscriber(subscriberId: number): any | null {
    return this.subscriberCache.get(`subscriber-${subscriberId}`);
  }

  setCachedSubscriber(subscriberId: number, subscriber: any): void {
    this.subscriberCache.set(`subscriber-${subscriberId}`, subscriber);
  }

  // Cache warming
  async warmCache(directus: any): Promise<void> {
    try {
      // Pre-load popular templates
      const templates = await directus.request(
        readItems("newsletter_templates", {
          filter: { status: { _eq: "published" } },
          sort: ["-usage_count"],
          limit: 10,
        })
      );

      templates.forEach((template: any) => {
        this.setCachedTemplate(template.id, template);
      });

      console.log(`Cache warmed with ${templates.length} templates`);
    } catch (error) {
      console.error("Failed to warm cache:", error);
    }
  }

  // Get all cache stats
  getStats() {
    return {
      compiled: this.compiledCache.getStats(),
      analytics: this.analyticsCache.getStats(),
      templates: this.templateCache.getStats(),
      subscribers: this.subscriberCache.getStats(),
    };
  }

  clearAll(): void {
    this.compiledCache.clear();
    this.analyticsCache.clear();
    this.templateCache.clear();
    this.subscriberCache.clear();
  }
}

// Request memoization decorator
export function memoize<T extends (...args: any[]) => any>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string,
  ttl?: number
): T {
  const cache = new MemoryCache(ttl);

  return ((...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

    let result = cache.get(key);
    if (result === null) {
      result = fn(...args);
      cache.set(key, result);
    }

    return result;
  }) as T;
}

// Async memoization for promises
export function memoizeAsync<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  keyGenerator?: (...args: Parameters<T>) => string,
  ttl?: number
): T {
  const cache = new MemoryCache(ttl);
  const pending = new Map<string, Promise<any>>();

  return (async (...args: Parameters<T>) => {
    const key = keyGenerator ? keyGenerator(...args) : JSON.stringify(args);

    // Check cache first
    let result = cache.get(key);
    if (result !== null) {
      return result;
    }

    // Check if request is already pending
    if (pending.has(key)) {
      return pending.get(key);
    }

    // Execute and cache the promise
    const promise = fn(...args)
      .then((result) => {
        cache.set(key, result);
        pending.delete(key);
        return result;
      })
      .catch((error) => {
        pending.delete(key);
        throw error;
      });

    pending.set(key, promise);
    return promise;
  }) as T;
}

// Cache invalidation patterns
export class CacheInvalidator {
  private patterns = new Map<string, Set<string>>();

  // Register cache keys that should be invalidated when pattern changes
  register(pattern: string, cacheKey: string): void {
    if (!this.patterns.has(pattern)) {
      this.patterns.set(pattern, new Set());
    }
    this.patterns.get(pattern)!.add(cacheKey);
  }

  // Invalidate all cache keys matching pattern
  invalidate(pattern: string, cache: MemoryCache): void {
    const keys = this.patterns.get(pattern);
    if (keys) {
      keys.forEach((key) => cache.delete(key));
    }
  }

  // Clear all registrations
  clear(): void {
    this.patterns.clear();
  }
}
