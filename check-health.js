import dotenv from 'dotenv';
dotenv.config();

const BASE = process.env.API_BASE || 'http://localhost:5000';

async function run() {
    const res = await fetch(`${BASE}/health`);

    if (!res.ok) {
        throw new Error(`Health check failed: ${res.status}`);
    }

    const data = await res.json();

    console.log('Health:', data);
}

run().catch(console.error);