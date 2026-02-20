import { pool } from './db.js';  // use centralized pool

async function run() {
    try {
        console.log('Connecting to DB...');
        const client = await pool.connect();
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

        client.release();

    } catch (e) {
        console.error('Error:', e);
    }
}

run();