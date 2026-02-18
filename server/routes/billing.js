import { Router } from 'express';
import pool from '../db.js';

const router = Router();

// GET /api/billing/invoices
router.get('/invoices', async (req, res) => {
    try {
        const { patient_id, status } = req.query;
        let query = `
      SELECT i.*, p.name as patient_name, p.uhid,
        (SELECT json_agg(json_build_object(
          'id', li.id, 'description', li.description, 'category', li.category,
          'quantity', li.quantity, 'unit_price', li.unit_price, 'total_price', li.total_price
        )) FROM invoice_line_items li WHERE li.invoice_id = i.id) as line_items,
        (SELECT json_agg(json_build_object(
          'id', pay.id, 'amount', pay.amount, 'payment_mode', pay.payment_mode, 'paid_at', pay.paid_at
        )) FROM payments pay WHERE pay.invoice_id = i.id) as payments
      FROM invoices i
      JOIN patients p ON i.patient_id = p.id
      WHERE 1=1
    `;
        const params = [];
        if (patient_id) { params.push(patient_id); query += ` AND i.patient_id = $${params.length}`; }
        if (status) { params.push(status); query += ` AND i.status = $${params.length}`; }
        query += ' ORDER BY i.created_at DESC LIMIT 50';

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// POST /api/billing/invoices
router.post('/invoices', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { patient_id, visit_id, admission_id, line_items, due_date } = req.body;

        // Calculate totals
        const subtotal = (line_items || []).reduce((sum, li) => sum + (li.quantity * li.unit_price), 0);
        const tax = subtotal * 0.05; // 5% GST
        const total = subtotal + tax;

        // Auto-generate invoice number
        const countRes = await client.query('SELECT COUNT(*) FROM invoices');
        const invoiceNumber = `INV-${new Date().getFullYear()}-${String(parseInt(countRes.rows[0].count) + 1).padStart(5, '0')}`;

        const inv = await client.query(
            `INSERT INTO invoices (invoice_number, patient_id, visit_id, admission_id, subtotal, tax_amount, total_amount, due_date, status, issued_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,'issued',NOW()) RETURNING *`,
            [invoiceNumber, patient_id, visit_id || null, admission_id || null, subtotal, tax, total, due_date || null]
        );

        const invId = inv.rows[0].id;
        for (const li of (line_items || [])) {
            await client.query(
                `INSERT INTO invoice_line_items (invoice_id, description, category, quantity, unit_price)
         VALUES ($1,$2,$3,$4,$5)`,
                [invId, li.description, li.category, li.quantity, li.unit_price]
            );
        }

        await client.query('COMMIT');
        res.status(201).json(inv.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// POST /api/billing/payments
router.post('/payments', async (req, res) => {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const { invoice_id, amount, payment_mode, transaction_ref, received_by } = req.body;

        const pay = await client.query(
            `INSERT INTO payments (invoice_id, amount, payment_mode, transaction_ref, received_by)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
            [invoice_id, amount, payment_mode, transaction_ref || null, received_by || null]
        );

        // Update invoice amount_paid and status
        await client.query(
            `UPDATE invoices SET
        amount_paid = amount_paid + $1,
        status = CASE
          WHEN amount_paid + $1 >= total_amount THEN 'paid'
          ELSE 'partial'
        END,
        updated_at = NOW()
       WHERE id = $2`,
            [amount, invoice_id]
        );

        await client.query('COMMIT');
        res.status(201).json(pay.rows[0]);
    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: err.message });
    } finally {
        client.release();
    }
});

// GET /api/billing/insurance-claims
router.get('/insurance-claims', async (req, res) => {
    try {
        const result = await pool.query(`
      SELECT ic.*, p.name as patient_name, p.uhid, i.invoice_number, i.total_amount
      FROM insurance_claims ic
      JOIN patients p ON ic.patient_id = p.id
      JOIN invoices i ON ic.invoice_id = i.id
      ORDER BY ic.created_at DESC LIMIT 50
    `);
        res.json(result.rows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

export default router;
