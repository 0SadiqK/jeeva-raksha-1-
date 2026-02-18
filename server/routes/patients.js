import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/patients — list + search
router.get('/', async (req, res) => {
    try {
        const { search, status } = req.query;
        let query = `
      SELECT p.*,
        (SELECT json_agg(json_build_object(
          'date', v.visit_date, 'reason', v.chief_complaint,
          'doctor', u.name, 'type', v.visit_type
        ) ORDER BY v.visit_date DESC)
        FROM visits v JOIN users u ON v.doctor_id = u.id
        WHERE v.patient_id = p.id
        ) as history
      FROM patients p WHERE 1=1
    `;
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (p.name ILIKE $${params.length} OR p.uhid ILIKE $${params.length})`;
        }
        if (status) {
            params.push(status);
            query += ` AND p.status = $${params.length}`;
        }

        query += ' ORDER BY p.created_at DESC LIMIT 100';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('[patients] list error:', err);
        res.status(500).json({ error: err.message });
    }
});

// GET /api/patients/:id — single patient with full history
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const patient = await pool.query('SELECT * FROM patients WHERE id = $1', [id]);
        if (patient.rows.length === 0) return res.status(404).json({ error: 'Patient not found' });

        const visits = await pool.query(
            `SELECT v.*, u.name as doctor_name FROM visits v
       JOIN users u ON v.doctor_id = u.id
       WHERE v.patient_id = $1 ORDER BY v.visit_date DESC`, [id]
        );

        const admissions = await pool.query(
            `SELECT a.*, w.name as ward_name, b.bed_number
       FROM admissions a
       JOIN wards w ON a.ward_id = w.id
       JOIN beds b ON a.bed_id = b.id
       WHERE a.patient_id = $1 ORDER BY a.admit_date DESC`, [id]
        );

        res.json({
            ...patient.rows[0],
            visits: visits.rows,
            admissions: admissions.rows
        });
    } catch (err) {
        console.error('[patients] detail error:', err);
        res.status(500).json({ error: err.message });
    }
});

// POST /api/patients — register new patient
router.post('/', async (req, res) => {
    try {
        const {
            name, date_of_birth, gender, blood_group, phone, email,
            address, city, state, pincode,
            emergency_contact_name, emergency_contact_phone,
            allergies, chronic_conditions
        } = req.body;

        // Auto-generate UHID
        const countResult = await pool.query('SELECT COUNT(*) FROM patients');
        const nextId = parseInt(countResult.rows[0].count) + 1;
        const uhid = `UHID-${new Date().getFullYear()}-${String(nextId).padStart(4, '0')}`;

        const result = await pool.query(
            `INSERT INTO patients (uhid, name, date_of_birth, gender, blood_group, phone, email,
        address, city, state, pincode, emergency_contact_name, emergency_contact_phone,
        allergies, chronic_conditions)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
       RETURNING *`,
            [uhid, name, date_of_birth, gender, blood_group || null, phone || null, email || null,
                address || null, city || null, state || null, pincode || null,
                emergency_contact_name || null, emergency_contact_phone || null,
                allergies || '{}', chronic_conditions || '{}']
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('[patients] create error:', err);
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/patients/:id — update patient
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const fields = req.body;
        const keys = Object.keys(fields);
        if (keys.length === 0) return res.status(400).json({ error: 'No fields to update' });

        const sets = keys.map((k, i) => `${k} = $${i + 2}`);
        const values = keys.map(k => fields[k]);

        const result = await pool.query(
            `UPDATE patients SET ${sets.join(', ')}, updated_at = NOW() WHERE id = $1 RETURNING *`,
            [id, ...values]
        );

        if (result.rows.length === 0) return res.status(404).json({ error: 'Patient not found' });
        res.json(result.rows[0]);
    } catch (err) {
        console.error('[patients] update error:', err);
        res.status(500).json({ error: err.message });
    }
});

export default router;
