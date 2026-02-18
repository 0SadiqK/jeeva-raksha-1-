import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/pharmacy/stock
router.get('/stock', async (req, res) => {
    try {
        const { search, status } = req.query;
        let query = 'SELECT * FROM pharmacy_stock WHERE 1=1';
        const params = [];

        if (search) {
            params.push(`%${search}%`);
            query += ` AND (drug_name ILIKE $${params.length} OR generic_name ILIKE $${params.length})`;
        }
        if (status) {
            params.push(status);
            query += ` AND status = $${params.length}`;
        }

        query += ' ORDER BY drug_name ASC';
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET /api/pharmacy/prescriptions
router.get('/prescriptions', async (req, res) => {
    try {
        const { patient_id } = req.query;
        let query = `
      SELECT rx.*, p.name as patient_name, p.uhid, u.name as doctor_name,
        (SELECT json_agg(json_build_object(
          'id', ri.id, 'drug_name', ri.drug_name, 'dosage', ri.dosage,
          'frequency', ri.frequency, 'duration', ri.duration, 'is_dispensed', ri.is_dispensed
        )) FROM prescription_items ri WHERE ri.prescription_id = rx.id) as items
      FROM prescriptions rx
      JOIN patients p ON rx.patient_id = p.id
      JOIN users u ON rx.doctor_id = u.id
      WHERE 1=1
    `;
        const params = [];
        if (patient_id) { params.push(patient_id); query += ` AND rx.patient_id = $${params.length}`; }
        query += ' ORDER BY rx.created_at DESC LIMIT 50';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/pharmacy/prescriptions
router.post('/prescriptions', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { patient_id, doctor_id, visit_id, diagnosis, items } = req.body;

        const rx = await client.query(
            `INSERT INTO prescriptions (patient_id, doctor_id, visit_id, diagnosis)
       VALUES ($1,$2,$3,$4) RETURNING *`,
            [patient_id, doctor_id, visit_id || null, diagnosis || null]
        );

        const rxId = rx.rows[0].id;
        const insertedItems = [];

        for (const item of (items || [])) {
            const ri = await client.query(
                `INSERT INTO prescription_items (prescription_id, drug_name, dosage, frequency, route, duration, instructions)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
                [rxId, item.drug_name, item.dosage, item.frequency || null, item.route || 'Oral', item.duration || null, item.instructions || null]
            );
            insertedItems.push(ri.rows[0]);
        }

        await client.query('COMMIT');
        res.status(201).json({ ...rx.rows[0], items: insertedItems });
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

export default router;
