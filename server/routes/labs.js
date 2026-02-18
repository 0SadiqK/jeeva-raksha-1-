import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/labs/orders
router.get('/orders', async (req, res) => {
    try {
        const { patient_id, status } = req.query;
        let query = `
      SELECT lo.*, p.name as patient_name, p.uhid, u.name as doctor_name,
        (SELECT json_agg(json_build_object(
          'id', lr.id, 'test_name', lr.test_name, 'result_value', lr.result_value,
          'result_unit', lr.result_unit, 'normal_range', lr.normal_range,
          'is_flagged', lr.is_flagged, 'flag_severity', lr.flag_severity,
          'reported_at', lr.reported_at
        )) FROM lab_results lr WHERE lr.lab_order_id = lo.id) as results
      FROM lab_orders lo
      JOIN patients p ON lo.patient_id = p.id
      JOIN users u ON lo.doctor_id = u.id
      WHERE 1=1
    `;
        const params = [];
        if (patient_id) { params.push(patient_id); query += ` AND lo.patient_id = $${params.length}`; }
        if (status) { params.push(status); query += ` AND lo.status = $${params.length}`; }
        query += ' ORDER BY lo.ordered_at DESC LIMIT 100';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/labs/orders
router.post('/orders', async (req, res) => {
    try {
        const { patient_id, doctor_id, visit_id, priority, clinical_notes } = req.body;
        const result = await pool.query(
            `INSERT INTO lab_orders (patient_id, doctor_id, visit_id, priority, clinical_notes)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
            [patient_id, doctor_id, visit_id || null, priority || 'routine', clinical_notes || null]
        );
        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/labs/results
router.post('/results', async (req, res) => {
    try {
        const { lab_order_id, test_name, test_category, result_value, result_unit, normal_range, is_flagged, flag_severity, reported_by } = req.body;
        const result = await pool.query(
            `INSERT INTO lab_results (lab_order_id, test_name, test_category, result_value, result_unit, normal_range, is_flagged, flag_severity, reported_by, reported_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9, NOW()) RETURNING *`,
            [lab_order_id, test_name, test_category || null, result_value, result_unit || null,
                normal_range || null, is_flagged || false, flag_severity || 'Normal', reported_by || null]
        );

        // Update order status to completed if all results are in
        await pool.query(
            `UPDATE lab_orders SET status = 'completed', completed_at = NOW(), updated_at = NOW() WHERE id = $1`,
            [lab_order_id]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// PATCH /api/labs/orders/:id — update order status
router.patch('/orders/:id', async (req, res) => {
    try {
        const { status } = req.body;
        const result = await pool.query(
            `UPDATE lab_orders SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *`,
            [status, req.params.id]
        );
        if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
        res.json(result.rows[0]);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
