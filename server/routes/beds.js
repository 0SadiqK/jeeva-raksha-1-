import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/wards
router.get('/wards', async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT w.*,
        (SELECT COUNT(*) FROM beds b WHERE b.ward_id = w.id) as total_beds,
        (SELECT COUNT(*) FROM beds b WHERE b.ward_id = w.id AND b.status = 'Available') as available_beds,
        (SELECT COUNT(*) FROM beds b WHERE b.ward_id = w.id AND b.status = 'Occupied') as occupied_beds
      FROM wards w
      WHERE w.status = 'active'
      ORDER BY w.name ASC
    `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/beds
router.get('/beds', async (req, res) => {
    try {
        const { ward_id, status } = req.query;
        let query = `
      SELECT b.*, w.name as ward_name, w.ward_type,
        (SELECT json_build_object('patient_name', p.name, 'uhid', p.uhid)
         FROM admissions a JOIN patients p ON a.patient_id = p.id
         WHERE a.bed_id = b.id AND a.status = 'admitted'
         LIMIT 1) as current_patient
      FROM beds b
      JOIN wards w ON b.ward_id = w.id
      WHERE 1=1
    `;
        const params = [];
        if (ward_id) { params.push(ward_id); query += ` AND b.ward_id = $${params.length}`; }
        if (status) { params.push(status); query += ` AND b.status = $${params.length}`; }
        query += ' ORDER BY w.name, b.bed_number ASC';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/beds/:id — update status
router.patch('/beds/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const result = await pool.query(
            'UPDATE beds SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
            [status, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
