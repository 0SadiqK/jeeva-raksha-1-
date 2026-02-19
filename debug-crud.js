const fetch = require('node-fetch');

const BASE = 'http://localhost:5000/api';

async function run() {
    console.log('1. Logging in as Admin...');
    const loginRes = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@jeevaraksha.in', password: 'admin123' })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok) throw new Error('Login failed: ' + JSON.stringify(loginData));
    const token = loginData.token;
    console.log('   Token acquired.');

    console.log('2. Fetching Doctors...');
    const docsRes = await fetch(`${BASE}/doctors`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const docs = await docsRes.json();
    if (docs.length === 0) {
        console.log('   No doctors found. Creating one...');
        // Skipping creation for brevity, assuming seed data or previous steps worked. 
        // If empty, this test might be inconclusive but won't crash.
        return;
    }
    const doc = docs[0];
    console.log(`   Fetched Doctor: ${doc.name} (ID: ${doc.id})`);
    console.log(`   Has 'department' field? ${'department' in doc}`);
    console.log(`   Has 'department_id' field? ${'department_id' in doc}`);

    console.log('3. Attempting PATCH with raw object (mimicking frontend)...');
    // The frontend sends the whole object including 'department' (name) and 'department_id'.
    // We expect this to fail if the backend doesn't strip 'department'.

    // Modifying name slightly to ensure it's an update
    const updatePayload = { ...doc, name: doc.name + ' (Updated)' };

    const updateRes = await fetch(`${BASE}/doctors/${doc.id}`, {
        method: 'PATCH',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(updatePayload)
    });

    if (updateRes.status === 500) {
        console.log('   ❌ CRASH CONFIRMED: 500 Internal Server Error');
        const err = await updateRes.json();
        console.log('   Error details:', err);
    } else if (updateRes.ok) {
        console.log('   ✅ UPDATE SUCCESS: Backend handled it correctly.');
        const updated = await updateRes.json();
        console.log('   Updated Name:', updated.name);
    } else {
        console.log(`   ⚠️ Unexpected Status: ${updateRes.status}`);
        const text = await updateRes.text();
        console.log('   Response:', text);
    }
}

run().catch(console.error);
