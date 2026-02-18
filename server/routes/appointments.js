import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/appointments
router.get('/', async (req, res) => {
    try {
        const { doctor_id, status, date } = req.query;
        let query = `
      SELECT a.*, p.name as patient_name, p.uhid, u.name as doctor_name
      FROM appointments a
      JOIN patients p ON a.patient_id = p.id
      JOIN users u ON a.doctor_id = u.id
      WHERE 1=1
    `;
        const params = [];

        if (doctor_id) {
            params.push(doctor_id);
            query += ` AND a.doctor_id = $${params.length}`;
        }
        if (status) {
            params.push(status);
            query += ` AND a.status = $${params.length}`;
        }
        if (date) {
            params.push(date);
            query += ` AND DATE(a.slot_time) = $${params.length}`;
        }

        query += ' ORDER BY a.slot_time ASC LIMIT 100';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/appointments
router.post('/', async (req, res) => {
    try {
        const { patient_id, doctor_id, slot_time, duration_mins, appointment_type, reason } = req.body;
        const result = await pool.query(
            `INSERT INTO appointments (patient_id, doctor_id, slot_time, duration_mins, appointment_type, reason)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
            [patient_id, doctor_id, slot_time, duration_mins || 15, appointment_type || 'Regular', reason || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/appointments/:id — update status
router.patch('/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const result = await pool.query(
            `UPDATE appointments SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
            [status, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
