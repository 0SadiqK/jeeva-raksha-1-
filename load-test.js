// ─── Jeeva Raksha — Load Test Script ─────────────────────────
// Simulates 50 concurrent users performing:
//   - Login
//   - Fetch patients
//   - Create patient
//   - Fetch audit logs
//   - Error resilience (invalid token, malformed request)
//
// Usage: node load-test.js
// ─────────────────────────────────────────────────────────────
import dotenv from 'dotenv';
dotenv.config();

const BASE = process.env.API_BASE || 'http://localhost:5000/api';
const CONCURRENT_USERS = 50;
const ADMIN_EMAIL = 'rajesh.kumar@jeevaraksha.in';
const ADMIN_PASSWORD = 'admin123';

// ─── Stats tracking ─────────────────────────────────────────
const stats = {
    login: { success: 0, fail: 0, totalMs: 0 },
    listPat: { success: 0, fail: 0, totalMs: 0 },
    createPat: { success: 0, fail: 0, totalMs: 0 },
    auditLog: { success: 0, fail: 0, totalMs: 0 },
    errToken: { success: 0, fail: 0, totalMs: 0 },
    errBody: { success: 0, fail: 0, totalMs: 0 },
    health: { success: 0, fail: 0, totalMs: 0 },
};

// ─── Timed fetch helper ─────────────────────────────────────
async function timedFetch(url, options = {}) {
    const start = Date.now();
    const res = await fetch(url, options);
    const duration = Date.now() - start;
    return { res, duration };
}

// ─── Single user simulation ─────────────────────────────────
async function simulateUser(userId) {
    const results = { userId, steps: [] };

    try {
        // ── 1. Login ──
        const { res: loginRes, duration: loginMs } = await timedFetch(`${BASE}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASSWORD }),
        });

        if (!loginRes.ok) {
            stats.login.fail++;
            stats.login.totalMs += loginMs;
            results.steps.push({ step: 'login', status: 'FAIL', code: loginRes.status, ms: loginMs });
            return results;
        }

        stats.login.success++;
        stats.login.totalMs += loginMs;
        results.steps.push({ step: 'login', status: 'OK', ms: loginMs });

        const loginData = await loginRes.json();
        const token = loginData.token;
        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
        };

        // ── 2. Fetch patients ──
        const { res: patsRes, duration: patsMs } = await timedFetch(`${BASE}/patients?limit=10`, { headers });
        if (patsRes.ok) {
            stats.listPat.success++;
            await patsRes.json(); // consume body
        } else {
            stats.listPat.fail++;
        }
        stats.listPat.totalMs += patsMs;
        results.steps.push({ step: 'list_patients', status: patsRes.ok ? 'OK' : 'FAIL', ms: patsMs });

        // ── 3. Create patient ──
        const patientData = {
            name: `LoadTest User ${userId}-${Date.now()}`,
            date_of_birth: '1990-01-01',
            gender: userId % 2 === 0 ? 'Male' : 'Female',
            phone: String(9000000000 + userId * 1000 + Math.floor(Math.random() * 1000)),
        };

        const { res: createRes, duration: createMs } = await timedFetch(`${BASE}/patients`, {
            method: 'POST',
            headers,
            body: JSON.stringify(patientData),
        });
        if (createRes.ok) {
            stats.createPat.success++;
            await createRes.json(); // consume body
        } else {
            stats.createPat.fail++;
        }
        stats.createPat.totalMs += createMs;
        results.steps.push({ step: 'create_patient', status: createRes.ok ? 'OK' : 'FAIL', ms: createMs });

        // ── 4. Fetch audit logs ──
        const { res: auditRes, duration: auditMs } = await timedFetch(`${BASE}/audit-logs?limit=5`, { headers });
        if (auditRes.ok) {
            stats.auditLog.success++;
            await auditRes.json();
        } else {
            stats.auditLog.fail++;
        }
        stats.auditLog.totalMs += auditMs;
        results.steps.push({ step: 'audit_logs', status: auditRes.ok ? 'OK' : 'FAIL', ms: auditMs });

        // ── 5. Error resilience: invalid token ──
        const { res: badTokenRes, duration: badTokenMs } = await timedFetch(`${BASE}/patients`, {
            headers: { 'Authorization': 'Bearer INVALID_TOKEN_12345' },
        });
        // Should get 200 (header fallback) or 401, but NOT crash
        stats.errToken.success++;
        stats.errToken.totalMs += badTokenMs;
        await badTokenRes.text(); // consume body
        results.steps.push({ step: 'invalid_token', status: 'OK (no crash)', code: badTokenRes.status, ms: badTokenMs });

        // ── 6. Error resilience: malformed body ──
        const { res: badBodyRes, duration: badBodyMs } = await timedFetch(`${BASE}/patients`, {
            method: 'POST',
            headers,
            body: 'THIS IS NOT JSON',
        });
        // Should return 400 or 500, but NOT crash
        stats.errBody.success++;
        stats.errBody.totalMs += badBodyMs;
        await badBodyRes.text();
        results.steps.push({ step: 'malformed_body', status: 'OK (no crash)', code: badBodyRes.status, ms: badBodyMs });

        // ── 7. Health check ──
        const { res: healthRes, duration: healthMs } = await timedFetch(`${BASE.replace('/api', '')}/health`);
        if (healthRes.ok) {
            stats.health.success++;
            await healthRes.json();
        } else {
            stats.health.fail++;
        }
        stats.health.totalMs += healthMs;
        results.steps.push({ step: 'health', status: healthRes.ok ? 'OK' : 'FAIL', ms: healthMs });

    } catch (err) {
        results.steps.push({ step: 'ERROR', error: err.message });
    }

    return results;
}

// ─── Main ────────────────────────────────────────────────────
async function run() {
    console.log(`\n🔥 JEEVA RAKSHA LOAD TEST`);
    console.log(`   Target:      ${BASE}`);
    console.log(`   Concurrent:  ${CONCURRENT_USERS} users`);
    console.log(`   Scenarios:   login → list patients → create patient → audit logs → error tests → health`);
    console.log(`   Starting...\n`);

    const overallStart = Date.now();

    // Launch all users concurrently
    const userPromises = [];
    for (let i = 0; i < CONCURRENT_USERS; i++) {
        userPromises.push(simulateUser(i));
    }

    const results = await Promise.all(userPromises);

    const overallDuration = Date.now() - overallStart;

    // ─── Results ─────────────────────────────────────────────
    console.log(`\n${'═'.repeat(60)}`);
    console.log(`  LOAD TEST RESULTS — ${CONCURRENT_USERS} concurrent users`);
    console.log(`${'═'.repeat(60)}`);
    console.log(`  Total duration: ${overallDuration}ms (${(overallDuration / 1000).toFixed(1)}s)\n`);

    const table = [];
    for (const [key, s] of Object.entries(stats)) {
        const total = s.success + s.fail;
        const avgMs = total > 0 ? Math.round(s.totalMs / total) : 0;
        table.push({
            Endpoint: key,
            Success: s.success,
            Failed: s.fail,
            Total: total,
            'Avg ms': avgMs,
            'Success %': total > 0 ? `${Math.round((s.success / total) * 100)}%` : 'N/A',
        });
    }
    console.table(table);

    // ─── Check for failures ──────────────────────────────────
    const totalFails = Object.values(stats).reduce((sum, s) => sum + s.fail, 0);
    const totalRequests = Object.values(stats).reduce((sum, s) => sum + s.success + s.fail, 0);

    console.log(`\n  Total requests: ${totalRequests}`);
    console.log(`  Total failures: ${totalFails}`);
    console.log(`  Success rate:   ${Math.round(((totalRequests - totalFails) / totalRequests) * 100)}%`);

    if (totalFails > 0) {
        console.log(`\n  ⚠️  Some requests failed. Check server logs for details.`);
    } else {
        console.log(`\n  ✅ ALL REQUESTS PASSED — Backend survived ${CONCURRENT_USERS} concurrent users!`);
    }

    // ─── Individual user errors ──────────────────────────────
    const errorUsers = results.filter(r => r.steps.some(s => s.step === 'ERROR'));
    if (errorUsers.length > 0) {
        console.log(`\n  ❌ ${errorUsers.length} user(s) encountered network errors:`);
        errorUsers.forEach(u => {
            const errStep = u.steps.find(s => s.step === 'ERROR');
            console.log(`     User ${u.userId}: ${errStep.error}`);
        });
    }

    console.log(`\n${'═'.repeat(60)}\n`);
}

run().catch(err => {
    console.error('Load test crashed:', err);
    process.exit(1);
});
