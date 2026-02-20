// ─── Jeeva Raksha — Backend Entry (Enterprise + Observable) ──
// dotenv MUST load FIRST, before any module that reads env vars
// ─────────────────────────────────────────────────────────────
import dotenv from 'dotenv';
dotenv.config();

// ─── Environment validation ─────────────────────────────────
if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is missing. Cannot start in production without it.');
}
if (process.env.NODE_ENV === 'production' && !process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET must be set in production. Do NOT use a default secret.');
}
if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
    console.warn('[WARN] Neither DATABASE_URL nor DB_HOST is set. Using default localhost connection.');
}

// ─── Global crash handlers ──────────────────────────────────
process.on('unhandledRejection', (reason) => {
    console.error('[CRASH] Unhandled Rejection:', reason);
    if (reason instanceof Error) console.error('[CRASH] Stack:', reason.stack);
});

process.on('uncaughtException', (err) => {
    console.error('[CRASH] Uncaught Exception:', err.message);
    console.error('[CRASH] Stack:', err.stack);
    if (process.env.NODE_ENV === 'production') {
        process.exit(1);
    }
});

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const logPath = path.resolve(projectRoot, 'debug_root.log');

import { authenticate, demoGuard } from './middleware/authMiddleware.js';
import { healthCheck, pool, getPoolStats, getUptime, startedAt } from './db.js';
import { cache, cacheMiddleware, invalidateOn } from './cache.js';

import authRouter from './routes/auth.js';
import patientsRouter from './routes/patients.js';
import doctorsRouter from './routes/doctors.js';
import appointmentsRouter from './routes/appointments.js';
import visitsRouter from './routes/visits.js';
import labsRouter from './routes/labs.js';
import pharmacyRouter from './routes/pharmacy.js';
import billingRouter from './routes/billing.js';
import bedsRouter from './routes/beds.js';
import dashboardRouter from './routes/dashboard.js';
import auditRouter from './routes/audit.js';

const app = express();
const PORT = process.env.PORT || process.env.API_PORT || 5000;

// ─── Security: Trust proxy (Railway uses reverse proxy) ─────
app.set('trust proxy', 1);

// ─── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// ─── Rate limiting ──────────────────────────────────────────
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests. Please try again later.' },
});

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many login attempts. Please try again later.' },
});

app.use('/api', apiLimiter);

// Request logging (non-blocking)
app.use((req, _res, next) => {
    const user = req.user?.id || 'anon';
    const demo = req.user?.isDemo ? ' [DEMO]' : '';
    const msg = `[API] ${req.method} ${req.url}  (user: ${user}${demo})`;
    console.log(msg);
    fs.appendFile(logPath, `[${new Date().toISOString()}] ${msg}\n`, () => { });
    next();
});

// ─── Root health check (Railway / load balancer) ────────────
app.get('/health', async (_req, res) => {
    const dbHealth = await healthCheck();
    const redisHealth = await cache.getRedisHealth();
    const mem = process.memoryUsage();
    res.json({
        status: dbHealth.status === 'connected' ? 'ok' : 'degraded',
        version: '2.5.0',
        uptime: getUptime(),
        timestamp: new Date().toISOString(),
        database: dbHealth,
        redis: redisHealth,
        memory: {
            rss: Math.round(mem.rss / 1024 / 1024),
            heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
            heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
            unit: 'MB',
        },
    });
});

// Auth routes (with stricter rate limit)
app.use('/api/auth', authLimiter, authRouter);

// Attach user info from JWT or headers
app.use(authenticate);

// Block mutations for demo users
app.use(demoGuard);

// ─── Routes ─────────────────────────────────────────────────
// Cached read-heavy routes with auto-invalidation on mutations
app.use('/api/patients', cacheMiddleware(30000, 'patients'), invalidateOn('patients'), patientsRouter);
app.use('/api/doctors', cacheMiddleware(60000, 'doctors'), invalidateOn('doctors'), doctorsRouter);
app.use('/api/appointments', cacheMiddleware(30000, 'appointments'), invalidateOn('appointments'), appointmentsRouter);
app.use('/api/visits', cacheMiddleware(30000, 'visits'), invalidateOn('visits'), visitsRouter);
app.use('/api/labs', cacheMiddleware(30000, 'labs'), invalidateOn('labs'), labsRouter);
app.use('/api/pharmacy', cacheMiddleware(30000, 'pharmacy'), invalidateOn('pharmacy'), pharmacyRouter);
app.use('/api/billing', cacheMiddleware(30000, 'billing'), invalidateOn('billing'), billingRouter);
app.use('/api/dashboard', cacheMiddleware(60000, 'dashboard'), dashboardRouter);  // read-only, no invalidation needed
app.use('/api/audit-logs', cacheMiddleware(30000, 'audit'), invalidateOn('audit'), auditRouter);
app.use('/api', cacheMiddleware(60000, 'beds'), invalidateOn('beds'), bedsRouter);

// ─── Health check (enhanced, under /api) ────────────────────
app.get('/api/health', async (_req, res) => {
    const dbHealth = await healthCheck();
    const redisHealth = await cache.getRedisHealth();
    const mem = process.memoryUsage();

    let authSchemaOk = false;
    let authSchemaError = null;
    try {
        const result = await pool.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'users' 
            AND column_name IN ('password_hash', 'login_attempts', 'locked_until', 'last_login_at')
        `);
        const hasTable = await pool.query(`
            SELECT EXISTS (
                SELECT FROM information_schema.tables 
                WHERE table_name = 'login_logs'
            )
        `);
        authSchemaOk = result.rows.length === 4 && hasTable.rows[0].exists;
    } catch (err) {
        authSchemaError = err.message;
    }

    res.json({
        status: 'ok',
        version: '2.5.0',
        uptime: getUptime(),
        startedAt: startedAt.toISOString(),
        timestamp: new Date().toISOString(),
        database: dbHealth,
        auth_schema: {
            ready: authSchemaOk,
            error: authSchemaError,
            hint: authSchemaOk ? null : 'Run: psql -h localhost -U postgres -d jeeva_raksha -f server/migration_auth.sql'
        },
        memory: {
            rss: Math.round(mem.rss / 1024 / 1024),
            heapUsed: Math.round(mem.heapUsed / 1024 / 1024),
            heapTotal: Math.round(mem.heapTotal / 1024 / 1024),
            unit: 'MB',
        },
        pool: getPoolStats(),
        cache: cache.getStats(),
        redis: redisHealth,
    });
});

// ─── Readiness state ────────────────────────────────────────
let isReady = false;

// Readiness probe (Railway / k8s — separate from liveness /health)
app.get('/ready', (_req, res) => {
    if (isReady) {
        res.json({ status: 'ready', uptime: getUptime() });
    } else {
        res.status(503).json({ status: 'starting', message: 'Server is still initializing' });
    }
});

// ─── Serve Frontend (Production) ─────────────────────────────
const distPath = path.resolve(projectRoot, 'dist');
if (fs.existsSync(distPath)) {
    console.log(`[SERVER] Serving static files from: ${distPath}`);
    app.use(express.static(distPath));

    app.use((req, res, next) => {
        if (req.method === 'GET' && !req.path.startsWith('/api')) {
            res.sendFile(path.join(distPath, 'index.html'));
        } else {
            next();
        }
    });
}

// ─── 404 handler ────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// ─── Error handler ──────────────────────────────────────────
app.use((err, _req, res, _next) => {
    console.error('[ERROR]', err.message);
    if (err.stack) console.error('[ERROR] Stack:', err.stack.split('\n').slice(0, 5).join('\n'));
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message,
    });
});

// ─── Memory monitoring (every 5 min) ────────────────────────
const memMonitor = setInterval(() => {
    const mem = process.memoryUsage();
    const rss = Math.round(mem.rss / 1024 / 1024);
    const heapUsed = Math.round(mem.heapUsed / 1024 / 1024);
    const heapTotal = Math.round(mem.heapTotal / 1024 / 1024);
    console.log(`[MONITOR] Memory: RSS=${rss}MB heap=${heapUsed}/${heapTotal}MB | Uptime: ${getUptime()}s | Pool: ${JSON.stringify(getPoolStats())}`);

    if (rss > 512) {
        console.warn(`[MONITOR] WARNING: RSS memory ${rss}MB exceeds 512MB — possible memory leak`);
    }
}, 5 * 60 * 1000);
memMonitor.unref();

// ─── Graceful shutdown ──────────────────────────────────────
async function shutdown(signal) {
    console.log(`\n[SERVER] ${signal} received — shutting down gracefully...`);
    console.log(`[SERVER] Uptime was: ${getUptime()}s`);
    console.log(`[SERVER] Final pool stats: ${JSON.stringify(getPoolStats())}`);
    try {
        await pool.end();
        console.log('[DB] Connection pool closed.');
    } catch (err) {
        console.error('[DB] Error closing pool:', err.message);
    }
    process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ─── Startup readiness sequence ─────────────────────────────
async function startupChecks() {
    const checks = [];
    const env = process.env.NODE_ENV || 'development';

    // 1. Environment validation
    const hasJWT = !!process.env.JWT_SECRET;
    const hasDB = !!process.env.DATABASE_URL || !!process.env.DB_HOST;
    const hasRedis = !!process.env.REDIS_URL;

    checks.push({ name: 'JWT_SECRET', status: hasJWT ? 'PASS' : (env === 'production' ? 'FAIL' : 'WARN'), detail: hasJWT ? 'set' : 'using dev default' });
    checks.push({ name: 'DATABASE_URL', status: hasDB ? 'PASS' : (env === 'production' ? 'FAIL' : 'WARN'), detail: hasDB ? 'configured' : 'using localhost fallback' });
    checks.push({ name: 'REDIS_URL', status: hasRedis ? 'PASS' : 'INFO', detail: hasRedis ? 'configured' : 'not set (in-memory cache)' });

    // 2. Database connectivity
    try {
        const dbHealth = await healthCheck();
        checks.push({ name: 'PostgreSQL', status: dbHealth.status === 'connected' ? 'PASS' : 'WARN', detail: dbHealth.status === 'connected' ? `connected to ${dbHealth.database}` : dbHealth.error });
    } catch (err) {
        checks.push({ name: 'PostgreSQL', status: 'FAIL', detail: err.message });
    }

    // 3. Redis connectivity
    try {
        const redisHealth = await cache.getRedisHealth();
        checks.push({ name: 'Redis', status: redisHealth.status === 'connected' ? 'PASS' : 'INFO', detail: `${redisHealth.status} (${redisHealth.backend})` });
    } catch {
        checks.push({ name: 'Redis', status: 'INFO', detail: 'not configured' });
    }

    // 4. Auth schema
    try {
        const result = await pool.query(`
            SELECT column_name FROM information_schema.columns
            WHERE table_name = 'users'
            AND column_name IN ('password_hash', 'login_attempts', 'locked_until', 'last_login_at')
        `);
        const ready = result.rows.length === 4;
        checks.push({ name: 'Auth Schema', status: ready ? 'PASS' : 'WARN', detail: ready ? 'all columns present' : `${result.rows.length}/4 columns found` });
    } catch (err) {
        checks.push({ name: 'Auth Schema', status: 'WARN', detail: err.message });
    }

    return checks;
}

// ─── Start ──────────────────────────────────────────────────
const server = app.listen(PORT, async () => {
    console.log(`\n[SERVER] ═══════════════════════════════════════════`);
    console.log(`[SERVER] 🏥 Jeeva Raksha API v2.5 (Deployment-Ready)`);
    console.log(`[SERVER] ───────────────────────────────────────────`);
    console.log(`[SERVER]   URL:        http://localhost:${PORT}`);
    console.log(`[SERVER]   Health:     http://localhost:${PORT}/health`);
    console.log(`[SERVER]   Readiness:  http://localhost:${PORT}/ready`);
    console.log(`[SERVER]   Rate Limit: 100 req/15min (API), 20/15min (Auth)`);
    console.log(`[SERVER]   Pool:       max=20, timeout=5s, stmt_timeout=10s`);
    console.log(`[SERVER]   Cache:      Redis → in-memory fallback, TTL=30-60s`);
    console.log(`[SERVER]   Env:        ${process.env.NODE_ENV || 'development'}`);
    console.log(`[SERVER] ───────────────────────────────────────────`);

    // Run deployment readiness checks
    const checks = await startupChecks();
    const icon = { PASS: '✅', WARN: '⚠️', FAIL: '❌', INFO: 'ℹ️' };

    console.log(`[SERVER]   DEPLOYMENT READINESS:`);
    for (const c of checks) {
        console.log(`[SERVER]     ${icon[c.status] || '·'} ${c.name.padEnd(14)} ${c.detail}`);
    }

    const hasFail = checks.some(c => c.status === 'FAIL');
    if (hasFail && process.env.NODE_ENV === 'production') {
        console.error(`[SERVER] ❌ CRITICAL: Startup checks failed. Exiting.`);
        process.exit(1);
    }

    isReady = true;
    console.log(`[SERVER] ───────────────────────────────────────────`);
    console.log(`[SERVER]   ✅ SYSTEM READY — accepting traffic`);
    console.log(`[SERVER] ═══════════════════════════════════════════\n`);
});

// Keep-alive
setInterval(() => { }, 60000);
