
import pool from './db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function applyFullSchema() {
    console.log('🚀 Starting Full Schema Migration...');


    try {
        // 0. Drop existing tables to ensure clean slate
        console.log('🗑️ Dropping existing tables...');
        await pool.query(`
            DROP TABLE IF EXISTS audit_logs CASCADE;
            DROP TABLE IF EXISTS payments CASCADE;
            DROP TABLE IF EXISTS insurance_claims CASCADE;
            DROP TABLE IF EXISTS invoices CASCADE;
            DROP TABLE IF EXISTS prescriptions CASCADE;
            DROP TABLE IF EXISTS pharmacy_stock CASCADE;
            DROP TABLE IF EXISTS lab_results CASCADE;
            DROP TABLE IF EXISTS lab_orders CASCADE;
            DROP TABLE IF EXISTS admissions CASCADE;
            DROP TABLE IF EXISTS beds CASCADE;
            DROP TABLE IF EXISTS wards CASCADE;
            DROP TABLE IF EXISTS visits CASCADE;
            DROP TABLE IF EXISTS appointments CASCADE;
            DROP TABLE IF EXISTS patients CASCADE;
            DROP TABLE IF EXISTS users CASCADE;
            DROP TABLE IF EXISTS departments CASCADE;
            DROP TABLE IF EXISTS login_logs CASCADE;
        `);
        console.log('✅ Tables dropped.');

        // 1. Run main schema
        console.log('📜 Executing schema.sql...');
        const schemaPath = path.join(__dirname, 'schema.sql');
        const schemaSql = fs.readFileSync(schemaPath, 'utf8');
        await pool.query(schemaSql);
        console.log('✅ schema.sql applied successfully!');

        // 2. Run auth migration
        console.log('📜 Executing migration_auth.sql...');
        const authPath = path.join(__dirname, 'migration_auth.sql');
        const authSql = fs.readFileSync(authPath, 'utf8');
        await pool.query(authSql);
        console.log('✅ migration_auth.sql applied successfully!');

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

applyFullSchema();
