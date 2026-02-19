import pool from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function applyMigration() {
    console.log('🚀 Starting Auth Migration...');

    try {
        const migrationPath = path.join(__dirname, 'migration_auth.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('📜 Executing SQL migration...');
        // Execute the entire script as one query
        await pool.query(sql);
        console.log('✅ Auth migration applied successfully!');

    } catch (err) {
        console.error('❌ Migration failed!');
        console.error('Error Message:', err.message);
        if (err.detail) console.error('Detail:', err.detail);
        if (err.where) console.error('Where:', err.where);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

applyMigration();
