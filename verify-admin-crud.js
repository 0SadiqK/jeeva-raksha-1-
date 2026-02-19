
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

async function testAdminCRUD() {
    const BASE_URL = 'http://localhost:5000/api';

    console.log('--- Starting Admin CRUD Verification ---');

    // Test 1: Create patient as a doctor (should fail with 403)
    try {
        console.log('Test 1: Patient creation as "doctor" role with valid data...');
        const res = await fetch(`${BASE_URL}/patients`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-role': 'doctor',
                'x-user-id': 'test-doc'
            },
            body: JSON.stringify({
                name: 'Valid Test Patient',
                gender: 'Male',
                date_of_birth: '1990-01-01'
            })
        });
        const data = await res.json();
        if (res.status === 403) {
            console.log('✅ PASS: Doctor forbidden from creating patient (403).');
        } else if (res.status === 201) {
            console.log('❌ FAIL: Doctor successfully created patient (Status: 201)');
            console.log(data);
        } else {
            console.log('❓ UNEXPECTED: Status ' + res.status);
            console.log(data);
        }
    } catch (err) {
        console.log('❌ ERROR:', err.message);
    }

    // Test 2: Create ward as a demo user (should fail with demoGuard)
    try {
        console.log('\nTest 2: Ward creation as "demo" user...');
        const res = await fetch(`${BASE_URL}/wards`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-role': 'demo',
                'x-user-id': 'test-demo'
            },
            body: JSON.stringify({ name: 'Demo Ward', code: 'DW-1' })
        });
        const data = await res.json();
        if (res.status === 403 && data.error === 'Demo mode') {
            console.log('✅ PASS: Demo user blocked by demoGuard.');
        } else {
            console.log('❌ FAIL: Demo user not blocked correctly (Status: ' + res.status + ')');
            console.log(data);
        }
    } catch (err) {
        console.log('❌ ERROR:', err.message);
    }

    // Test 3: Create ward as an admin (should succeed or fail with validation but not 403)
    try {
        console.log('\nTest 3: Ward creation as "admin"...');
        const res = await fetch(`${BASE_URL}/wards`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-user-role': 'admin',
                'x-user-id': 'test-admin'
            },
            body: JSON.stringify({ name: 'Verification Ward', code: 'VWARD', ward_type: 'General' })
        });
        const data = await res.json();
        if (res.status === 201) {
            console.log('✅ PASS: Admin successfully created ward.');
        } else if (res.status === 409) {
            console.log('✅ PASS: Admin attempt reached DB (Conflict detected).');
        } else {
            console.log('❌ FAIL: Admin blocked with status ' + res.status);
            console.log(data);
        }
    } catch (err) {
        console.log('❌ ERROR:', err.message);
    }
}

testAdminCRUD();
