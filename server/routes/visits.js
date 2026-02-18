import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/visits
router.get('/', async (req, res) => {
    try {
        const { patient_id, doctor_id, type } = req.query;
        let query = `
      SELECT v.*, p.name as patient_name, p.uhid, u.name as doctor_name
      FROM visits v
      JOIN patients p ON v.patient_id = p.id
      JOIN users u ON v.doctor_id = u.id
      WHERE 1=1
    `;
        const params = [];

        if (patient_id) { params.push(patient_id); query += ` AND v.patient_id = $${params.length}`; }
        if (doctor_id) { params.push(doctor_id); query += ` AND v.doctor_id = $${params.length}`; }
        if (type) { params.push(type); query += ` AND v.visit_type = $${params.length}`; }

        query += ' ORDER BY v.visit_date DESC LIMIT 100';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/visits
router.post('/', async (req, res) => {
    try {
        const {
            patient_id, doctor_id, visit_type, chief_complaint,
            vitals_hr, vitals_bp, vitals_spo2, vitals_temp, triage_level, notes
        } = req.body;

        const result = await pool.query(
            `INSERT INTO visits (patient_id, doctor_id, visit_type, chief_complaint,
        vitals_hr, vitals_bp, vitals_spo2, vitals_temp, triage_level, notes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
            [patient_id, doctor_id, visit_type, chief_complaint || null,
                vitals_hr || null, vitals_bp || null, vitals_spo2 || null,
                vitals_temp || null, triage_level || null, notes || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/visits/:id — update status/notes
router.patch('/:id', async (req, res) => {
    try {
        const { status, notes } = req.body;
        const result = await pool.query(
            `UPDATE visits SET status = COALESCE($1, status), notes = COALESCE($2, notes), updated_at = NOW()
       WHERE id = $3 RETURNING *`,
            [status || null, notes || null, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
