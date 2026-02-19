const BASE = 'http://localhost:5000/api';

async function run() {
    console.log('1. Logging in as Admin...');
    const loginRes = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@jeevaraksha.in', password: 'admin123' })
    });

    // Check if login failed
    if (!loginRes.ok) {
        const errText = await loginRes.text();
        throw new Error(`Login failed: ${loginRes.status} ${errText}`);
    }

    const loginData = await loginRes.json();
    const token = loginData.token;
    console.log('   Token acquired.');

    console.log('2. Fetching Doctors...');
    const docsRes = await fetch(`${BASE}/doctors`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const docs = await docsRes.json();
    if (docs.length === 0) {
        console.log('   No doctors found. Cannot test update.');
        return;
    }
    const doc = docs[0];
    console.log(`   Fetched Doctor: ${doc.name} (ID: ${doc.id})`);

    // Check for 'department' field
    if ('department' in doc) {
        console.log(`   Has 'department' field: "${doc.department}"`);
    } else {
        console.log('   Does NOT have 'department' field.');
    }

    if ('department_id' in doc) {
        console.log(`   Has 'department_id' field: "${doc.department_id}"`);
    }

    console.log('3. Attempting PATCH with raw object (mimicking frontend)...');

    // We send payload with BOTH department and department_id if they exist
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
