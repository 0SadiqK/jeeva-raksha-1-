import dotenv from 'dotenv';
dotenv.config();

const BASE = process.env.API_BASE || 'http://localhost:5000/api';

async function run() {
    console.log('Logging in...');

    const loginRes = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'rajesh.kumar@jeevaraksha.in',
            password: 'admin123'
        })
    });

    if (!loginRes.ok) {
        throw new Error(`Login failed: ${loginRes.status}`);
    }

    const loginData = await loginRes.json();

    if (!loginData.token) {
        throw new Error('Token missing');
    }

    const token = loginData.token;

    const listRes = await fetch(`${BASE}/audit-logs?limit=5`, {
        headers: { Authorization: `Bearer ${token}` }
    });

    const data = await listRes.json();

    console.log('Audit logs:', data);
}

run().catch(console.error);