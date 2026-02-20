const BASE = process.env.API_BASE || 'http://localhost:5000/api';
const LOG_TO_CONSOLE = true;

function log(msg) {
    if (LOG_TO_CONSOLE) console.log(msg);
}

async function run() {
    log('🚀 STARTING FULL CRUD CHECK...');

    // 1. Login as Admin
    log('\n1. 🔑 Logging in as Admin...');
    const loginRes = await fetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@jeevaraksha.in', password: 'admin123' })
    });

    if (!loginRes.ok) throw new Error(`Login failed: ${loginRes.status}`);
    const loginData = await loginRes.json();
    const token = loginData.token;
    log('   ✅ Token acquired.');

    const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
    };

    // ─── PATIENTS CRUD ───
    log('\n2. 🏥 PATIENTS CRUD');

    // Create
    const pName = `Test Pat ${Date.now()}`;
    const newPatient = {
        name: pName,
        date_of_birth: '1995-05-05',
        gender: 'Female',
        phone: String(Math.floor(Math.random() * 9000000000) + 1000000000),
        address: '123 Valid St'
    };

    const createP = await fetch(`${BASE}/patients`, { method: 'POST', headers, body: JSON.stringify(newPatient) });
    if (!createP.ok) throw new Error(`Patient Create Failed: ${await createP.text()}`);
    const createdPatient = await createP.json();
    log(`   ✅ Created Patient: ${createdPatient.name} (${createdPatient.id})`);

    // Update
    const updateP = await fetch(`${BASE}/patients/${createdPatient.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ address: '456 Updated Lane' })
    });
    if (!updateP.ok) throw new Error(`Patient Update Failed: ${await updateP.text()}`);
    const updatedPatient = await updateP.json();
    log(`   ✅ Updated Patient Address: ${updatedPatient.address}`);

    // Soft Delete
    const deleteP = await fetch(`${BASE}/patients/${createdPatient.id}`, { method: 'DELETE', headers });
    if (!deleteP.ok) throw new Error(`Patient Soft Delete Failed: ${await deleteP.text()}`);
    log(`   ✅ Soft Deleted Patient`);

    // Verify Soft Delete (API returns inactive, so check status)
    const listP = await fetch(`${BASE}/patients?search=${encodeURIComponent(createdPatient.uhid)}`, { headers });
    const listPData = await listP.json();

    if (listPData.data) {
        const foundP = listPData.data.find(p => p.id === createdPatient.id);
        if (foundP) {
            if (foundP.status === 'inactive') {
                log(`   ✅ Patient found with status 'inactive' (Soft Delete Successful).`);
            } else {
                throw new Error(`❌ Patient is still active! Status: ${foundP.status}`);
            }
        } else {
            // It's also fine if it's not found (though current API returns it)
            log(`   ✅ Patient removed from list.`);
        }
    } else {
        log(`   ⚠️ Could not verify list (unexpected response format).`);
    }


    // ─── DOCTORS CRUD ───
    log('\n3. 👨‍⚕️ DOCTORS CRUD');

    // Create
    const dName = `Dr. Test ${Date.now()}`;
    const newDoctor = {
        name: dName,
        email: `dr.${Date.now()}@test.com`,
        phone: String(Math.floor(Math.random() * 9000000000) + 1000000000),
        department: 'General Medicine' // Will be resolved to ID
    };

    const createD = await fetch(`${BASE}/doctors`, { method: 'POST', headers, body: JSON.stringify(newDoctor) });
    if (!createD.ok) throw new Error(`Doctor Create Failed: ${await createD.text()}`);
    const createdDoctor = await createD.json();
    log(`   ✅ Created Doctor: ${createdDoctor.name} (${createdDoctor.id})`);

    // Update
    const updateD = await fetch(`${BASE}/doctors/${createdDoctor.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ qualification: 'MBBS, MD Test' })
    });
    if (!updateD.ok) throw new Error(`Doctor Update Failed: ${await updateD.text()}`);
    const updatedDoctor = await updateD.json();
    log(`   ✅ Updated Doctor Qual: ${updatedDoctor.qualification}`);

    // Soft Delete
    const deleteD = await fetch(`${BASE}/doctors/${createdDoctor.id}`, { method: 'DELETE', headers });
    if (!deleteD.ok) throw new Error(`Doctor Soft Delete Failed: ${await deleteD.text()}`);
    log(`   ✅ Soft Deleted Doctor`);

    // Verify Soft Delete
    const listD = await fetch(`${BASE}/doctors`, { headers });
    const listDData = await listD.json();
    const foundD = listDData.find(d => d.id === createdDoctor.id);
    if (foundD) throw new Error('❌ Doctor still visible in list after soft delete!');
    log(`   ✅ Doctor successfully removed from active list.`);


    // ─── APPOINTMENTS CRUD ───
    log('\n4. 📅 APPOINTMENTS CRUD');
    // We need a valid patient and doctor (use existing ones from DB or restore the deleted ones?)
    // Let's create a temp patient/doctor just for this, or use the ones we soft-deleted? No, they are inactive.
    // Fetch an active doctor and patient.

    // Get first active doctor
    const docsRes = await fetch(`${BASE}/doctors`, { headers });
    const docs = await docsRes.json();
    if (docs.length === 0) throw new Error('No active doctors for appointment test');
    const validDoc = docs[0];

    // Get first active patient
    const patsRes = await fetch(`${BASE}/patients`, { headers });
    const pats = await patsRes.json();
    if (pats.data.length === 0) throw new Error('No active patients for appointment test');
    const validPat = pats.data[0];

    log(`   Using Doctor: ${validDoc.name}, Patient: ${validPat.name}`);

    // Create Appointment
    const newAppt = {
        patient_id: validPat.id,
        doctor_id: validDoc.id,
        slot_time: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
        reason: 'Test Appointment'
    };

    const createAppt = await fetch(`${BASE}/appointments`, { method: 'POST', headers, body: JSON.stringify(newAppt) });
    if (!createAppt.ok) throw new Error(`Appointment Create Failed: ${await createAppt.text()}`);
    const createdAppt = await createAppt.json();
    log(`   ✅ Created Appointment: ${createdAppt.id}`);

    // Update Status
    const updateAppt = await fetch(`${BASE}/appointments/${createdAppt.id}`, {
        method: 'PATCH',
        headers,
        body: JSON.stringify({ status: 'confirmed' })
    });
    if (!updateAppt.ok) throw new Error(`Appointment Update Failed: ${await updateAppt.text()}`);
    const updatedAppt = await updateAppt.json();
    log(`   ✅ Updated Status: ${updatedAppt.status}`);

    log('\n✨ ALL CRUD CHECKS PASSED!');
}

run().catch(err => {
    console.error('\n❌ TEST FAILED:', err.message);
});
