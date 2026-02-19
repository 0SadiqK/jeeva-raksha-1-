// ─── Jeeva Raksha — Auth & RBAC Middleware ───────────────────
// JWT-based authentication with backward-compatible header fallback.
// ─────────────────────────────────────────────────────────────
import jwt from 'jsonwebtoken';
import fs from 'fs';

const JWT_SECRET = process.env.JWT_SECRET || 'jeevaraksha-secret-key-change-in-production';
const VALID_ROLES = ['admin', 'doctor', 'nurse', 'pharmacist', 'lab_tech', 'receptionist', 'staff', 'patient', 'demo'];

/**
 * Maps database role names to system roles for consistent authorization.
 */
function normalizeRole(dbRole) {
    if (!dbRole) return 'staff';
    const role = dbRole.toLowerCase();
    if (role.includes('admin')) return 'admin';
    if (role.includes('doctor') || role.includes('surgeon') || role.includes('hod')) return 'doctor';
    if (role.includes('nurse')) return 'nurse';
    if (role.includes('pharmacist')) return 'pharmacist';
    if (role.includes('lab')) return 'lab_tech';
    if (role.includes('radio')) return 'radiologist';
    if (role.includes('receptionist')) return 'receptionist';
    return 'staff';
}

/**
 * Authenticate requests.
 * Priority: JWT Bearer token > x-user-* headers > anonymous
 */
export function authenticate(req, _res, next) {
    // 1. Try JWT token
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
        try {
            const token = authHeader.split(' ')[1];
            const decoded = jwt.verify(token, JWT_SECRET);
            req.user = {
                id: decoded.id,
                role: normalizeRole(decoded.role),
                name: decoded.name,
                email: decoded.email,
                employee_id: decoded.employee_id,
                isDemo: decoded.role === 'demo',
            };
            return next();
        } catch (err) {
            // Token invalid/expired — fall through to header-based auth
        }
    }

    // 2. Fallback: header-based auth (for backward compatibility / testing)
    const userId = req.headers['x-user-id'] || 'anonymous';
    const userRole = req.headers['x-user-role'] || 'staff';
    const userName = req.headers['x-user-name'] || '';

    req.user = {
        id: userId,
        role: normalizeRole(userRole),
        name: userName,
        isDemo: userRole === 'demo',
    };

    next();
}

/**
 * Restrict route to specific roles.
 */
export function authorize(...allowedRoles) {
    return async (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ error: 'Authentication required' });
        }

        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                error: 'Forbidden',
                message: `Role '${req.user.role}' is not authorized. Required: ${allowedRoles.join(', ')}`,
            });
        }
        next();
    };
}

/**
 * Block mutations for demo users.
 * Only allows GET and OPTIONS requests.
 */
export function demoGuard(req, res, next) {
    if (req.user?.isDemo && !['GET', 'OPTIONS', 'HEAD'].includes(req.method)) {
        return res.status(403).json({
            error: 'Demo mode',
            message: 'Demo mode — modifications are not allowed. Login with a real account to make changes.',
        });
    }
    next();
}

/** Shorthand for admin-only routes. */
export const adminOnly = authorize('admin');

/** Allow clinical staff (admins + doctors + nurses). */
export const clinicalOnly = authorize('admin', 'doctor', 'nurse');

/** Block anonymous users. */
export function requireAuth(req, res, next) {
    if (!req.user || req.user.id === 'anonymous') {
        return res.status(401).json({ error: 'Authentication required' });
    }
    next();
}
