// ─── Jeeva Raksha — Server-side Response Cache ───────────────
// TTL-based in-memory cache with automatic invalidation.
// Designed for read-heavy API endpoints.
// ─────────────────────────────────────────────────────────────

class ResponseCache {
    constructor() {
        /** @type {Map<string, { data: any, expiresAt: number, hitCount: number }>} */
        this.store = new Map();
        this.stats = { hits: 0, misses: 0, invalidations: 0 };

        // Cleanup expired entries every 60s
        this._cleanup = setInterval(() => {
            const now = Date.now();
            let cleaned = 0;
            for (const [key, entry] of this.store) {
                if (now > entry.expiresAt) {
                    this.store.delete(key);
                    cleaned++;
                }
            }
            if (cleaned > 0) {
                console.log(`[CACHE] Cleaned ${cleaned} expired entries. Active: ${this.store.size}`);
            }
        }, 60000);
        this._cleanup.unref();
    }

    /**
     * Get cached value. Returns null if expired or missing.
     */
    get(key) {
        const entry = this.store.get(key);
        if (!entry) {
            this.stats.misses++;
            return null;
        }
        if (Date.now() > entry.expiresAt) {
            this.store.delete(key);
            this.stats.misses++;
            return null;
        }
        this.stats.hits++;
        entry.hitCount++;
        return entry.data;
    }

    /**
     * Set cached value with TTL in milliseconds.
     */
    set(key, data, ttlMs = 30000) {
        this.store.set(key, {
            data,
            expiresAt: Date.now() + ttlMs,
            hitCount: 0,
        });
    }

    /**
     * Invalidate all entries matching a prefix.
     * e.g. invalidatePrefix('/api/patients') clears all patient cache entries.
     */
    invalidatePrefix(prefix) {
        let count = 0;
        for (const key of this.store.keys()) {
            if (key.startsWith(prefix)) {
                this.store.delete(key);
                count++;
            }
        }
        if (count > 0) {
            this.stats.invalidations += count;
            console.log(`[CACHE] Invalidated ${count} entries matching '${prefix}'`);
        }
    }

    /**
     * Clear entire cache.
     */
    clear() {
        const size = this.store.size;
        this.store.clear();
        console.log(`[CACHE] Cleared all ${size} entries`);
    }

    /**
     * Get cache statistics.
     */
    getStats() {
        const total = this.stats.hits + this.stats.misses;
        return {
            entries: this.store.size,
            hits: this.stats.hits,
            misses: this.stats.misses,
            hitRate: total > 0 ? `${Math.round((this.stats.hits / total) * 100)}%` : 'N/A',
            invalidations: this.stats.invalidations,
        };
    }
}

// Singleton instance
const cache = new ResponseCache();

/**
 * Express middleware: cache GET responses.
 * @param {number} ttlMs - Time-to-live in milliseconds (default: 30 seconds)
 * @param {string} [prefix] - Cache key prefix for invalidation grouping
 */
function cacheMiddleware(ttlMs = 30000, prefix) {
    return (req, res, next) => {
        // Only cache GET requests
        if (req.method !== 'GET') {
            return next();
        }

        const cacheKey = prefix
            ? `${prefix}:${req.originalUrl}`
            : req.originalUrl;

        const cached = cache.get(cacheKey);
        if (cached) {
            res.set('X-Cache', 'HIT');
            return res.json(cached);
        }

        // Intercept res.json to cache the response
        const originalJson = res.json.bind(res);
        res.json = (data) => {
            // Only cache successful responses
            if (res.statusCode >= 200 && res.statusCode < 300) {
                cache.set(cacheKey, data, ttlMs);
            }
            res.set('X-Cache', 'MISS');
            return originalJson(data);
        };

        next();
    };
}

/**
 * Express middleware: invalidate cache on mutations.
 * Place AFTER route handlers that modify data.
 * @param {...string} prefixes - Cache key prefixes to invalidate
 */
function invalidateOn(...prefixes) {
    return (req, res, next) => {
        if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
            // Invalidate after response is sent
            const originalJson = res.json.bind(res);
            res.json = (data) => {
                prefixes.forEach(p => cache.invalidatePrefix(p));
                return originalJson(data);
            };
        }
        next();
    };
}

export { cache, cacheMiddleware, invalidateOn };
export default cache;
