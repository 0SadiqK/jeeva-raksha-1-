// ─── Jeeva Raksha — Distributed Cache Layer ─────────────────
// Redis-backed caching with automatic in-memory fallback.
// When Redis is available: distributed cache across instances.
// When Redis is down: seamless fallback to local Map cache.
// ─────────────────────────────────────────────────────────────
import Redis from 'ioredis';

const REDIS_URL = process.env.REDIS_URL || null;
const CACHE_PREFIX = 'jrk:';

// ─── Redis client (lazy connect, never blocks startup) ──────
let redis = null;
let redisReady = false;

if (REDIS_URL) {
    redis = new Redis(REDIS_URL, {
        maxRetriesPerRequest: 1,
        retryStrategy: (times) => {
            if (times > 5) {
                console.warn('[CACHE] Redis reconnect failed 5 times — giving up, using in-memory fallback');
                return null; // stop retrying
            }
            return Math.min(times * 500, 3000);
        },
        lazyConnect: false,
        connectTimeout: 5000,
        enableReadyCheck: true,
    });

    redis.on('ready', () => {
        redisReady = true;
        console.log('[CACHE] Redis connected ✓');
    });

    redis.on('error', (err) => {
        if (redisReady) {
            console.error('[CACHE] Redis error:', err.message);
        }
        redisReady = false;
    });

    redis.on('close', () => {
        redisReady = false;
        console.log('[CACHE] Redis disconnected');
    });

    redis.on('reconnecting', () => {
        console.log('[CACHE] Redis reconnecting...');
    });
} else {
    console.log('[CACHE] No REDIS_URL set — using in-memory cache (single-instance mode)');
}

// ─── In-memory fallback store ────────────────────────────────
const memStore = new Map();

// ─── Stats ───────────────────────────────────────────────────
const stats = { hits: 0, misses: 0, invalidations: 0, errors: 0 };

// Cleanup expired in-memory entries every 60s
const cleanupTimer = setInterval(() => {
    const now = Date.now();
    let cleaned = 0;
    for (const [key, entry] of memStore) {
        if (now > entry.expiresAt) {
            memStore.delete(key);
            cleaned++;
        }
    }
    if (cleaned > 0) {
        console.log(`[CACHE] Cleaned ${cleaned} expired in-memory entries. Active: ${memStore.size}`);
    }
}, 60000);
cleanupTimer.unref();

// ─── Cache API ───────────────────────────────────────────────

/**
 * Get cached value. Redis first, fallback to in-memory.
 */
async function get(key) {
    const fullKey = CACHE_PREFIX + key;

    // Try Redis
    if (redisReady && redis) {
        try {
            const raw = await redis.get(fullKey);
            if (raw) {
                stats.hits++;
                return JSON.parse(raw);
            }
            stats.misses++;
            return null;
        } catch (err) {
            stats.errors++;
            // Fall through to in-memory
        }
    }

    // Fallback: in-memory
    const entry = memStore.get(fullKey);
    if (!entry) {
        stats.misses++;
        return null;
    }
    if (Date.now() > entry.expiresAt) {
        memStore.delete(fullKey);
        stats.misses++;
        return null;
    }
    stats.hits++;
    return entry.data;
}

/**
 * Set cached value with TTL (milliseconds).
 */
async function set(key, data, ttlMs = 30000) {
    const fullKey = CACHE_PREFIX + key;
    const ttlSec = Math.ceil(ttlMs / 1000);

    // Write to Redis
    if (redisReady && redis) {
        try {
            await redis.set(fullKey, JSON.stringify(data), 'EX', ttlSec);
            return;
        } catch (err) {
            stats.errors++;
            // Fall through to in-memory
        }
    }

    // Fallback: in-memory
    memStore.set(fullKey, {
        data,
        expiresAt: Date.now() + ttlMs,
    });
}

/**
 * Invalidate all entries matching a prefix.
 */
async function invalidatePrefix(prefix) {
    const fullPrefix = CACHE_PREFIX + prefix;
    let count = 0;

    // Invalidate in Redis
    if (redisReady && redis) {
        try {
            const keys = await redis.keys(`${fullPrefix}*`);
            if (keys.length > 0) {
                await redis.del(...keys);
                count = keys.length;
            }
        } catch (err) {
            stats.errors++;
        }
    }

    // Also invalidate in-memory (might have fallback entries)
    for (const key of memStore.keys()) {
        if (key.startsWith(fullPrefix)) {
            memStore.delete(key);
            count++;
        }
    }

    if (count > 0) {
        stats.invalidations += count;
        console.log(`[CACHE] Invalidated ${count} entries matching '${prefix}'`);
    }
}

/**
 * Clear entire cache.
 */
async function clear() {
    if (redisReady && redis) {
        try {
            const keys = await redis.keys(`${CACHE_PREFIX}*`);
            if (keys.length > 0) await redis.del(...keys);
            console.log(`[CACHE] Cleared ${keys.length} Redis entries`);
        } catch (err) {
            stats.errors++;
        }
    }
    const memSize = memStore.size;
    memStore.clear();
    console.log(`[CACHE] Cleared ${memSize} in-memory entries`);
}

/**
 * Get cache statistics + backend info.
 */
function getStats() {
    const total = stats.hits + stats.misses;
    return {
        backend: redisReady ? 'redis' : 'memory',
        entries: memStore.size,
        hits: stats.hits,
        misses: stats.misses,
        hitRate: total > 0 ? `${Math.round((stats.hits / total) * 100)}%` : 'N/A',
        invalidations: stats.invalidations,
        errors: stats.errors,
    };
}

/**
 * Get Redis health status.
 */
async function getRedisHealth() {
    if (!REDIS_URL) {
        return { status: 'not_configured', backend: 'memory' };
    }
    if (!redisReady || !redis) {
        return { status: 'disconnected', backend: 'memory_fallback', url: '***' };
    }
    try {
        const pong = await redis.ping();
        const info = await redis.info('memory');
        const memMatch = info.match(/used_memory_human:(\S+)/);
        return {
            status: 'connected',
            backend: 'redis',
            ping: pong,
            memory: memMatch ? memMatch[1] : 'unknown',
        };
    } catch (err) {
        return { status: 'error', backend: 'memory_fallback', error: err.message };
    }
}

// ─── Export cache object (same API as before) ────────────────
const cache = { get, set, invalidatePrefix, clear, getStats, getRedisHealth };

// ─── Express middleware (unchanged interface) ────────────────

/**
 * Cache GET responses with TTL.
 */
function cacheMiddleware(ttlMs = 30000, prefix) {
    return async (req, res, next) => {
        if (req.method !== 'GET') return next();

        const cacheKey = prefix
            ? `${prefix}:${req.originalUrl}`
            : req.originalUrl;

        try {
            const cached = await cache.get(cacheKey);
            if (cached) {
                res.set('X-Cache', 'HIT');
                res.set('X-Cache-Backend', redisReady ? 'redis' : 'memory');
                return res.json(cached);
            }
        } catch {
            // Cache miss, continue to handler
        }

        const originalJson = res.json.bind(res);
        res.json = (data) => {
            if (res.statusCode >= 200 && res.statusCode < 300) {
                cache.set(cacheKey, data, ttlMs).catch(() => { });
            }
            res.set('X-Cache', 'MISS');
            res.set('X-Cache-Backend', redisReady ? 'redis' : 'memory');
            return originalJson(data);
        };

        next();
    };
}

/**
 * Invalidate cache on mutations.
 */
function invalidateOn(...prefixes) {
    return (req, res, next) => {
        if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
            const originalJson = res.json.bind(res);
            res.json = (data) => {
                prefixes.forEach(p => cache.invalidatePrefix(p).catch(() => { }));
                return originalJson(data);
            };
        }
        next();
    };
}

export { cache, cacheMiddleware, invalidateOn };
export default cache;
