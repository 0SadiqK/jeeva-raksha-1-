import dotenv from 'dotenv';
dotenv.config();

import { pool } from './server/db.js';

async function run() {
    let client;
    try {
        console.log('Connecting to DB...');
        client = await pool.connect();
        console.log('Connected to:', client.database);

        const res = await client.query(
            'SELECT id, name, status, created_at FROM patients ORDER BY created_at DESC LIMIT 5'
        );

        console.log('Recent patients in DB:');
        res.rows.forEach(r => {
            console.log(`- ${r.name} (${r.status}) ${r.created_at}`);
        });

        const audit = await client.query(
            'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 5'
        );

        console.log('Recent audit logs in DB:');
        audit.rows.forEach(r => {
            console.log(`- ${r.action} ${r.entity_type} ${r.created_at}`);
        });

    } catch (e) {
        console.error('Error:', e);
    } finally {
        if (client) client.release();
        process.exit(0);
    }
}

run();