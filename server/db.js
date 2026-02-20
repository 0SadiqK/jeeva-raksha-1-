// ─── Jeeva Raksha — Database Service Layer (Observable) ──────
// Centralized PostgreSQL pool with monitoring, auto-recovery,
// transaction support, health checks, and structured logging.
// ─────────────────────────────────────────────────────────────
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

// ─── Environment validation ─────────────────────────────────
const isProduction = process.env.NODE_ENV === 'production';

if (isProduction && !process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is missing. Cannot start in production without it.');
}
if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
    console.warn('[DB] WARNING: Neither DATABASE_URL nor DB_HOST is set. Using default localhost connection.');
}

const connectionConfig = process.env.DATABASE_URL
    ? {
        connectionString: process.env.DATABASE_URL,
        ssl: isProduction ? { rejectUnauthorized: false } : false
    }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5432'),
        database: process.env.DB_NAME || 'jeeva_raksha',
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASS || 'postgres',
    };

const pool = new pg.Pool({
    ...connectionConfig,
    max: 20,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 5000,
    statement_timeout: 10000,
    query_timeout: 10000,
});

// ─── Pool event handlers (structured logging) ───────────────
pool.on('error', (err, client) => {
    console.error('[DB] Pool error (client will be removed):', err.message);
});

pool.on('connect', (client) => {
    console.log(`[DB] Client connected | pool: total=${pool.totalCount} idle=${pool.idleCount} waiting=${pool.waitingCount}`);
});

pool.on('remove', () => {
    console.log(`[DB] Client removed   | pool: total=${pool.totalCount} idle=${pool.idleCount} waiting=${pool.waitingCount}`);
});

// ─── Pool stats monitoring (every 60s) ──────────────────────
const POOL_MONITOR_INTERVAL = 60000;
const poolMonitor = setInterval(() => {
    const stats = {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount,
    };
    // Only log if pool is active or has waiting clients
    if (stats.total > 0 || stats.waiting > 0) {
        console.log(`[DB] Pool stats: total=${stats.total} idle=${stats.idle} waiting=${stats.waiting}`);
    }
    // Warn on abnormal conditions
    if (stats.waiting > 5) {
        console.warn(`[DB] WARNING: ${stats.waiting} clients waiting for connections — possible pool exhaustion`);
    }
    if (stats.total >= 20 && stats.idle === 0) {
        console.warn(`[DB] WARNING: Pool at max capacity (${stats.total}) with 0 idle — all connections in use`);
    }
}, POOL_MONITOR_INTERVAL);

// Don't block process exit
poolMonitor.unref();

// ─── Query wrapper with logging ──────────────────────────────
async function query(text, params) {
    const start = Date.now();
    try {
        const result = await pool.query(text, params);
        const duration = Date.now() - start;
        if (duration > 1000) {
            console.warn(`[DB] Slow query (${duration}ms):`, text.substring(0, 100));
        }
        return result;
    } catch (err) {
        const duration = Date.now() - start;
        console.error(`[DB] Query error (${duration}ms):`, err.message);
        console.error('[DB] Query text:', text.substring(0, 200));
        if (err.stack) console.error('[DB] Stack:', err.stack.split('\n').slice(0, 3).join('\n'));
        throw err;
    }
}

// ─── Transaction helper ──────────────────────────────────────
async function getClient() {
    const client = await pool.connect();
    return client;
}

/**
 * Run a function within a database transaction.
 * Automatically handles BEGIN, COMMIT, and ROLLBACK.
 */
async function withTransaction(fn) {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const result = await fn(client);
        await client.query('COMMIT');
        return result;
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}

// ─── Health check (enhanced with pool stats + uptime) ────────
const startedAt = new Date();

async function healthCheck() {
    try {
        const result = await pool.query('SELECT NOW() as time, current_database() as database');
        return {
            status: 'connected',
            database: result.rows[0].database,
            time: result.rows[0].time,
            pool: {
                total: pool.totalCount,
                idle: pool.idleCount,
                waiting: pool.waitingCount,
                max: 20,
            },
        };
    } catch (err) {
        return {
            status: 'disconnected',
            error: err.message,
            pool: {
                total: pool.totalCount,
                idle: pool.idleCount,
                waiting: pool.waitingCount,
                max: 20,
            },
        };
    }
}

// ─── Pool stats getter (for external monitoring) ─────────────
function getPoolStats() {
    return {
        total: pool.totalCount,
        idle: pool.idleCount,
        waiting: pool.waitingCount,
        max: 20,
    };
}

function getUptime() {
    return Math.floor((Date.now() - startedAt.getTime()) / 1000);
}

// ─── Exports ─────────────────────────────────────────────────
export default pool;
export { pool, query, getClient, withTransaction, healthCheck, getPoolStats, getUptime, startedAt };
