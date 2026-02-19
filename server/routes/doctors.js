// ─── Jeeva Raksha — Doctor CRUD Routes (Production-Grade) ────
// Full CRUD for doctors (users with role='doctor').
// Includes: department assignment, active-patient deletion guard,
// soft-delete with admin hard-delete, and audit logging.
// ─────────────────────────────────────────────────────────────
import { Router } from 'express';
import { pool, withTransaction } from '../db.js';
import { authorize } from '../middleware/authMiddleware.js';
import { validateRequired } from '../middleware/validate.js';
import { logAudit, getClientIP } from '../middleware/auditMiddleware.js';

const router = Router();

// ─── GET /api/doctors — list all active doctors ──────────────
router.get('/', async (req, res) => {
    try {
        const { search, department, status = 'active' } = req.query;
        let query = `
            SELECT u.*,
                d.name as department_name,
                d.code as department_code,
                (SELECT COUNT(*) FROM visits v WHERE v.doctor_id = u.id AND v.status = 'in-progress') as active_patients,
                (SELECT COUNT(*) FROM appointments a WHERE a.doctor_id = u.id AND a.status IN ('scheduled','confirmed')) as upcoming_appointments
            FROM users u
            LEFT JOIN departments d ON u.department_id = d.id
            WHERE u.role = 'doctor'
        `;
        const params = [];

        if (status !== 'all') {
            params.push(status);
            query += ` AND u.status = $${params.length}`;
        } else {
            query += ` AND u.status != 'deleted'`;
        }

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (u.name ILIKE $${params.length} OR u.employee_id ILIKE $${params.length} OR u.specialization ILIKE $${params.length})`;
        }
        if (department) {
            params.push(department);
            query += ` AND d.code = $${params.length}`;
        }

        query += ' ORDER BY u.name ASC';
        const result = await pool.query(query, params);

        res.json(result.rows);
    } catch (err) {
        console.error('[doctors] list error:', err);
        res.status(500).json({ error: 'Failed to fetch doctors', message: err.message });
    }
});

// ─── GET /api/doctors/:id — single doctor with stats ─────────
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const doctor = await pool.query(
            `SELECT u.*, d.name as department_name, d.code as department_code
             FROM users u
             LEFT JOIN departments d ON u.department_id = d.id
             WHERE u.id = $1 AND u.role = 'doctor' AND u.status != 'deleted'`,
            [id]
        );

        if (doctor.rows.length === 0) {
            return res.status(404).json({ error: 'Doctor not found' });
        }

        // Fetch stats
        const [activePatients, completedVisits, todayAppointments] = await Promise.all([
            pool.query(
                `SELECT COUNT(*) as count FROM visits
                 WHERE doctor_id = $1 AND status = 'in-progress'`, [id]
            ),
            pool.query(
                `SELECT COUNT(*) as count FROM visits
                 WHERE doctor_id = $1 AND status = 'completed'`, [id]
            ),
            pool.query(
                `SELECT a.*, p.name as patient_name, p.uhid
                 FROM appointments a
                 JOIN patients p ON a.patient_id = p.id
                 WHERE a.doctor_id = $1 AND DATE(a.slot_time) = CURRENT_DATE
                 ORDER BY a.slot_time ASC`, [id]
            ),
        ]);

        res.json({
            ...doctor.rows[0],
            stats: {
                active_patients: parseInt(activePatients.rows[0].count),
                completed_visits: parseInt(completedVisits.rows[0].count),
                today_appointments: todayAppointments.rows,
            },
        });
    } catch (err) {
        console.error('[doctors] detail error:', err);
        res.status(500).json({ error: err.message });
    }
});

// ─── POST /api/doctors — register new doctor ─────────────────
router.post('/',
    authorize('admin'),
    validateRequired(['name', 'email']),
    async (req, res) => {
        try {
            const result = await withTransaction(async (client) => {
                const {
                    name, email, phone, specialization, qualification,
                    experience_years, license_number, department, department_id
                } = req.body;

                // ── Check duplicate email ──
                const dupEmail = await client.query(
                    'SELECT id, name FROM users WHERE email = $1',
                    [email]
                );
                if (dupEmail.rows.length > 0) {
                    return { duplicate: true, field: 'email', existing: dupEmail.rows[0] };
                }

                // ── Resolve department ──
                let deptId = department_id || null;
                if (!deptId && department) {
                    const dept = await client.query(
                        'SELECT id FROM departments WHERE name ILIKE $1 OR code ILIKE $1',
                        [department]
                    );
                    if (dept.rows.length > 0) deptId = dept.rows[0].id;
                }

                // ── Generate employee ID ──
                const count = await client.query("SELECT COUNT(*) FROM users WHERE role = 'doctor'");
                const nextNum = parseInt(count.rows[0].count) + 1;
                const employeeId = `DOC-${String(nextNum).padStart(3, '0')}`;

                // ── Insert ──
                const insertResult = await client.query(
                    `INSERT INTO users (
                        employee_id, name, email, phone, role, specialization,
                        qualification, experience_years, license_number, department_id
                    ) VALUES ($1,$2,$3,$4,'doctor',$5,$6,$7,$8,$9)
                    RETURNING *`,
                    [
                        employeeId, name, email, phone || null,
                        specialization || null, qualification || null,
                        experience_years || null, license_number || null, deptId,
                    ]
                );

                // ── Audit ──
                await logAudit({
                    userId: req.user.id,
                    userName: req.user.name,
                    action: 'CREATE',
                    entityType: 'doctor',
                    entityId: insertResult.rows[0].id,
                    module: 'doctors',
                    details: `Registered doctor: ${name} (${employeeId})`,
                    newValues: insertResult.rows[0],
                    ipAddress: getClientIP(req),
                }, client);

                return { doctor: insertResult.rows[0] };
            });

            if (result.duplicate) {
                return res.status(409).json({
                    error: 'Duplicate detected',
                    message: `A user with this ${result.field} already exists: ${result.existing.name}`,
                });
            }

            res.status(201).json(result.doctor);
        } catch (err) {
            console.error('[doctors] create error:', err);
            res.status(500).json({ error: 'Failed to register doctor', message: err.message });
        }
    }
);

// ─── PATCH /api/doctors/:id — update doctor / assign dept ────
router.patch('/:id',
    authorize('admin'),
    async (req, res) => {
        try {
            const { id } = req.params;
            const fields = { ...req.body };

            // Handle department assignment by name
            if (fields.department) {
                if (!fields.department_id) {
                    const dept = await pool.query(
                        'SELECT id FROM departments WHERE name ILIKE $1 OR code ILIKE $1',
                        [fields.department]
                    );
                    if (dept.rows.length > 0) {
                        fields.department_id = dept.rows[0].id;
                    }
                }
                delete fields.department;
            }

            const keys = Object.keys(fields).filter(k => !['id', 'employee_id', 'created_at', 'role'].includes(k));
            if (keys.length === 0) return res.status(400).json({ error: 'No valid fields to update' });

            // Fetch old values
            const old = await pool.query('SELECT * FROM users WHERE id = $1 AND role = $2', [id, 'doctor']);
            if (old.rows.length === 0) return res.status(404).json({ error: 'Doctor not found' });

            const sets = keys.map((k, i) => `${k} = $${i + 2}`);
            const values = keys.map(k => fields[k]);

            const result = await pool.query(
                `UPDATE users SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $1 AND role = 'doctor' RETURNING *`,
                [id, ...values]
            );

            // Audit
            await logAudit({
                userId: req.user.id,
                userName: req.user.name,
                action: 'UPDATE',
                entityType: 'doctor',
                entityId: id,
                module: 'doctors',
                details: `Updated: ${keys.join(', ')}`,
                oldValues: old.rows[0],
                newValues: result.rows[0],
                ipAddress: getClientIP(req),
            });

            res.json(result.rows[0]);
        } catch (err) {
            console.error('[doctors] update error:', err);
            res.status(500).json({ error: err.message });
        }
    }
);

// ─── DELETE /api/doctors/:id — soft delete with guard ────────
router.delete('/:id',
    authorize('admin'),
    async (req, res) => {
        try {
            const { id } = req.params;
            const hardDelete = req.query.hard === 'true';

            // Fetch doctor
            const doctor = await pool.query(
                "SELECT * FROM users WHERE id = $1 AND role = 'doctor'",
                [id]
            );
            if (doctor.rows.length === 0) {
                return res.status(404).json({ error: 'Doctor not found' });
            }

            const doctorData = doctor.rows[0];
            if (doctorData.status === 'deleted') {
                return res.status(410).json({ error: 'Doctor is already deleted' });
            }

            // ── Active patient check ──
            const activeVisits = await pool.query(
                "SELECT COUNT(*) as count FROM visits WHERE doctor_id = $1 AND status = 'in-progress'",
                [id]
            );
            const activeAdmissions = await pool.query(
                "SELECT COUNT(*) as count FROM admissions WHERE doctor_id = $1 AND status = 'admitted'",
                [id]
            );

            const activeCount = parseInt(activeVisits.rows[0].count) + parseInt(activeAdmissions.rows[0].count);

            if (activeCount > 0) {
                return res.status(409).json({
                    error: 'Cannot delete doctor with active patients',
                    message: `Dr. ${doctorData.name} has ${activeCount} active patient(s). Please reassign or discharge them first.`,
                    active_visits: parseInt(activeVisits.rows[0].count),
                    active_admissions: parseInt(activeAdmissions.rows[0].count),
                });
            }

            if (hardDelete) {
                // ── Hard delete ──
                await pool.query('DELETE FROM users WHERE id = $1', [id]);

                await logAudit({
                    userId: req.user.id,
                    userName: req.user.name,
                    action: 'HARD_DELETE',
                    entityType: 'doctor',
                    entityId: id,
                    module: 'doctors',
                    details: `Permanently deleted: Dr. ${doctorData.name} (${doctorData.employee_id})`,
                    oldValues: doctorData,
                    ipAddress: getClientIP(req),
                });

                res.json({ message: 'Doctor permanently deleted', employee_id: doctorData.employee_id });
            } else {
                // ── Soft delete ──
                await pool.query(
                    "UPDATE users SET status = 'inactive', updated_at = NOW() WHERE id = $1",
                    [id]
                );

                await logAudit({
                    userId: req.user.id,
                    userName: req.user.name,
                    action: 'SOFT_DELETE',
                    entityType: 'doctor',
                    entityId: id,
                    module: 'doctors',
                    details: `Deactivated: Dr. ${doctorData.name} (${doctorData.employee_id})`,
                    oldValues: { status: doctorData.status },
                    newValues: { status: 'inactive' },
                    ipAddress: getClientIP(req),
                });

                res.json({
                    message: 'Doctor deactivated (soft delete)',
                    employee_id: doctorData.employee_id,
                    status: 'inactive',
                });
            }
        } catch (err) {
            console.error('[doctors] delete error:', err);
            res.status(500).json({ error: err.message });
        }
    }
);

export default router;
