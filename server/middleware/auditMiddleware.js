// ─── Jeeva Raksha — Audit Trail Middleware ────────────────────
// Reusable functions to log every mutation to audit_logs table.
// ──────────────────────────────────────────────────────────────
import pool from '../db.js';

/**
 * Log an audit event to the database.
 *
 * @param {object} params
 * @param {string} params.userId     - Who performed the action
 * @param {string} params.userName   - Display name
 * @param {string} params.action     - e.g. 'CREATE', 'UPDATE', 'SOFT_DELETE', 'HARD_DELETE'
 * @param {string} params.entityType - e.g. 'patient', 'doctor', 'appointment'
 * @param {string} params.entityId   - PK of the affected record
 * @param {string} params.module     - e.g. 'patients', 'doctors'
 * @param {string} params.details    - Human-readable description
 * @param {object} params.oldValues  - Previous state (JSONB)
 * @param {object} params.newValues  - New state (JSONB)
 * @param {string} params.ipAddress  - Client IP
 * @param {object} [client]          - Optional pg client for transactions
 */
export async function logAudit({
    userId, userName, action, entityType, entityId,
    module, details, oldValues, newValues, ipAddress
}, client) {
    const query = `
        INSERT INTO audit_logs
            (user_id, user_name, action, entity_type, entity_id, module, details, old_values, new_values, ip_address)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        RETURNING id
    `;
    const params = [
        userId || null,
        userName || null,
        action,
        entityType || null,
        entityId || null,
        module || null,
        details || null,
        oldValues ? JSON.stringify(oldValues) : null,
        newValues ? JSON.stringify(newValues) : null,
        ipAddress || null,
    ];

    try {
        const executor = client || pool;
        await executor.query(query, params);
    } catch (err) {
        // Audit logging should never crash the request
        console.error('[AUDIT] Failed to log:', err.message);
    }
}

/**
 * Extract the client IP from req, handling proxies.
 */
export function getClientIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
        || req.socket?.remoteAddress
        || 'unknown';
}
