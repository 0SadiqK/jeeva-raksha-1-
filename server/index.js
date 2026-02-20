// ─── Jeeva Raksha — Backend Entry ────────────────────────────
// dotenv MUST load FIRST, before any module that reads env vars
// ─────────────────────────────────────────────────────────────
import dotenv from 'dotenv';
dotenv.config();

// ─── Environment validation ─────────────────────────────────
if (process.env.NODE_ENV === 'production' && !process.env.DATABASE_URL) {
    throw new Error('DATABASE_URL environment variable is missing. Cannot start in production without it.');
}
if (!process.env.DATABASE_URL && !process.env.DB_HOST) {
    console.warn('[WARN] Neither DATABASE_URL nor DB_HOST is set. Using default localhost connection.');
}

import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const logPath = path.resolve(projectRoot, 'debug_root.log');

import { authenticate, demoGuard } from './middleware/authMiddleware.js';
import { healthCheck, pool } from './db.js';

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

// ─── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Request logging middleware
app.use((req, _res, next) => {
    const user = req.user?.id || 'anon';
    const demo = req.user?.isDemo ? ' [DEMO]' : '';
    const msg = `[API] ${req.method} ${req.url}  (user: ${user}${demo})`;
    console.log(msg);
    try {
        fs.appendFileSync(logPath, `[${new Date().toISOString()}] ${msg}\n`);
    } catch (e) { }
    next();
});

// ─── Root health check (Railway / load balancer) ────────────
app.get('/health', async (_req, res) => {
    const dbHealth = await healthCheck();
    res.json({
        status: dbHealth.status === 'connected' ? 'ok' : 'degraded',
        timestamp: new Date().toISOString(),
        database: dbHealth,
    });
});

// Auth routes BEFORE authentication middleware (login doesn't need auth)
app.use('/api/auth', authRouter);

// Attach user info from JWT or headers on every request
app.use(authenticate);

// Block mutations for demo users
app.use(demoGuard);

// ─── Routes ─────────────────────────────────────────────────
app.use('/api/patients', patientsRouter);
app.use('/api/doctors', doctorsRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/visits', visitsRouter);
app.use('/api/labs', labsRouter);
app.use('/api/pharmacy', pharmacyRouter);
app.use('/api/billing', billingRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/audit-logs', auditRouter);
app.use('/api', bedsRouter);

// ─── Health check (enhanced, under /api) ────────────────────
app.get('/api/health', async (_req, res) => {
    const dbHealth = await healthCheck();

    // Check if auth columns exist
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
        timestamp: new Date().toISOString(),
        version: '2.2.0',
        database: dbHealth,
        auth_schema: {
            ready: authSchemaOk,
            error: authSchemaError,
            hint: authSchemaOk ? null : 'Run: psql -h localhost -U postgres -d jeeva_raksha -f server/migration_auth.sql'
        },
    });
});

// ─── Serve Frontend (Production) ─────────────────────────────
const distPath = path.resolve(projectRoot, 'dist');
if (fs.existsSync(distPath)) {
    console.log(`Serving static files from: ${distPath}`);
    app.use(express.static(distPath));

    // SPA Fallback (safer implementation)
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
    console.error('[API ERROR]', err);
    res.status(500).json({
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'production' ? 'An error occurred' : err.message,
    });
});

// ─── Graceful shutdown ──────────────────────────────────────
async function shutdown(signal) {
    console.log(`\n[${signal}] Shutting down gracefully...`);
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

// ─── Start ──────────────────────────────────────────────────
const server = app.listen(PORT, () => {
    console.log(`\n🏥 Jeeva Raksha API Server v2.2 (Production-Grade)`);
    console.log(`   Running on:  http://localhost:${PORT}`);
    console.log(`   Auth:        http://localhost:${PORT}/api/auth/login`);
    console.log(`   Health:      http://localhost:${PORT}/api/health`);
    console.log(`   Root Health: http://localhost:${PORT}/health`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
});

// Keep-alive interval to prevent premature exit in certain environments
setInterval(() => { }, 60000);
