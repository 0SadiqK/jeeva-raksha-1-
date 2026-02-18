import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import { authenticate, demoGuard } from './middleware/authMiddleware.js';
import { healthCheck } from './db.js';

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

dotenv.config();

const app = express();
const PORT = process.env.API_PORT || 5000;

// ─── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Auth routes BEFORE authentication middleware (login doesn't need auth)
app.use('/api/auth', authRouter);

// Attach user info from JWT or headers on every request
app.use(authenticate);

// Block mutations for demo users
app.use(demoGuard);

// Request logging
app.use((req, _res, next) => {
    const user = req.user?.id || 'anon';
    const demo = req.user?.isDemo ? ' [DEMO]' : '';
    console.log(`[API] ${req.method} ${req.url}  (user: ${user}${demo})`);
    next();
});

// ─── Routes ─────────────────────────────────────────────────
app.use('/api/patients', patientsRouter);
app.use('/api/doctors', doctorsRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/visits', visitsRouter);
app.use('/api/labs', labsRouter);
app.use('/api/pharmacy', pharmacyRouter);
app.use('/api/billing', billingRouter);
app.use('/api', bedsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/audit-logs', auditRouter);

// ─── Health check (enhanced) ────────────────────────────────
app.get('/api/health', async (_req, res) => {
    const dbHealth = await healthCheck();
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        version: '2.1.0',
        database: dbHealth,
    });
});

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

// ─── Start ──────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n🏥 Jeeva Raksha API Server v2.1 (with Auth)`);
    console.log(`   Running on:  http://localhost:${PORT}`);
    console.log(`   Auth:        http://localhost:${PORT}/api/auth/login`);
    console.log(`   Health:      http://localhost:${PORT}/api/health`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}\n`);
});
