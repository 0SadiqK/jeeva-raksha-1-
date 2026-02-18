import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

import patientsRouter from './routes/patients.js';
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

// Middleware
app.use(cors());
app.use(express.json());

// Request logging
app.use((req, _res, next) => {
    console.log(`[API] ${req.method} ${req.url}`);
    next();
});

// Routes
app.use('/api/patients', patientsRouter);
app.use('/api/appointments', appointmentsRouter);
app.use('/api/visits', visitsRouter);
app.use('/api/labs', labsRouter);
app.use('/api/pharmacy', pharmacyRouter);
app.use('/api/billing', billingRouter);
app.use('/api', bedsRouter);
app.use('/api/dashboard', dashboardRouter);
app.use('/api/audit-logs', auditRouter);

// Health check
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Error handler
app.use((err, _req, res, _next) => {
    console.error('[API ERROR]', err);
    res.status(500).json({ error: 'Internal server error', message: err.message });
});

app.listen(PORT, () => {
    console.log(`\n🏥 Jeeva Raksha API Server running on http://localhost:${PORT}`);
    console.log(`   Health: http://localhost:${PORT}/api/health\n`);
});
