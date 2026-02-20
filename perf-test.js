// ─── Jeeva Raksha — Performance Validation Script ────────────
// Measures response times for cached vs uncached requests.
// Verifies server-side cache (X-Cache header) and pool behavior.
//
// Usage: node perf-test.js
// ─────────────────────────────────────────────────────────────
import dotenv from 'dotenv';
dotenv.config();

const BASE = process.env.API_BASE || 'http://localhost:5000/api';
const REPEAT = 10;

async function timedFetch(url, options = {}) {
    const start = Date.now();
    const res = await fetch(url, options);
    const duration = Date.now() - start;
    const cacheStatus = res.headers.get('x-cache') || 'N/A';
    const data = await res.json().catch(() => ({}));
    return { status: res.status, duration, cacheStatus, data };
}

async function run() {
    console.log(`\n⚡ PERFORMANCE VALIDATION`);
    console.log(`   Target: ${BASE}`);
    console.log(`   Repeats: ${REPEAT} per endpoint\n`);

    // Step 1: Login to get a token
    console.log('─── Step 1: Login ───');
    const loginRes = await timedFetch(`${BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'rajesh.kumar@jeevaraksha.in',
            password: 'admin123'
        }),
    });

    if (loginRes.status !== 200) {
        console.log(`   Login failed (${loginRes.status}). Continuing without auth...`);
    }

    const token = loginRes.data?.token;
    const headers = token
        ? { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }
        : { 'Content-Type': 'application/json' };

    console.log(`   Login: ${loginRes.duration}ms (${loginRes.status})\n`);

    // Step 2: Test cached endpoints
    const endpoints = [
        { name: 'GET /patients', url: `${BASE}/patients` },
        { name: 'GET /doctors', url: `${BASE}/doctors` },
        { name: 'GET /appointments', url: `${BASE}/appointments` },
        { name: 'GET /audit-logs', url: `${BASE}/audit-logs` },
        { name: 'GET /dashboard/stats', url: `${BASE}/dashboard/stats` },
        { name: 'GET /health (root)', url: `${BASE.replace('/api', '')}/health` },
    ];

    const results = [];

    for (const ep of endpoints) {
        console.log(`─── ${ep.name} (${REPEAT}x) ───`);
        const times = [];
        const cacheStatuses = [];

        for (let i = 0; i < REPEAT; i++) {
            const r = await timedFetch(ep.url, { headers });
            times.push(r.duration);
            cacheStatuses.push(r.cacheStatus);
        }

        const first = times[0];
        const cached = times.slice(1);
        const avgCached = cached.length > 0
            ? Math.round(cached.reduce((a, b) => a + b, 0) / cached.length)
            : 0;
        const hits = cacheStatuses.filter(s => s === 'HIT').length;
        const speedup = avgCached > 0 ? `${Math.round((first / avgCached) * 100) / 100}x` : 'N/A';

        console.log(`   1st request:   ${first}ms (${cacheStatuses[0]})`);
        console.log(`   Avg cached:    ${avgCached}ms (${REPEAT - 1} requests)`);
        console.log(`   Cache hits:    ${hits}/${REPEAT}`);
        console.log(`   Speedup:       ${speedup}\n`);

        results.push({
            Endpoint: ep.name,
            '1st (ms)': first,
            'Avg Cached (ms)': avgCached,
            'Cache Hits': `${hits}/${REPEAT}`,
            Speedup: speedup,
        });
    }

    // Step 3: Check health for cache stats
    console.log('─── Cache Statistics ───');
    const health = await timedFetch(`${BASE}/health`, { headers });
    if (health.data?.cache) {
        console.log(`   Entries:       ${health.data.cache.entries}`);
        console.log(`   Hits:          ${health.data.cache.hits}`);
        console.log(`   Misses:        ${health.data.cache.misses}`);
        console.log(`   Hit Rate:      ${health.data.cache.hitRate}`);
        console.log(`   Invalidations: ${health.data.cache.invalidations}`);
    }
    if (health.data?.pool) {
        console.log(`   Pool Total:    ${health.data.pool.total}`);
        console.log(`   Pool Idle:     ${health.data.pool.idle}`);
        console.log(`   Pool Waiting:  ${health.data.pool.waiting}`);
    }

    // Summary table
    console.log(`\n${'═'.repeat(70)}`);
    console.log(`  PERFORMANCE RESULTS`);
    console.log(`${'═'.repeat(70)}`);
    console.table(results);

    // DB load reduction estimate
    const totalRequests = endpoints.length * REPEAT;
    const totalHits = results.reduce((sum, r) => {
        const [hits] = r['Cache Hits'].split('/').map(Number);
        return sum + hits;
    }, 0);
    const dbReduction = Math.round((totalHits / totalRequests) * 100);

    console.log(`\n  Total requests:     ${totalRequests}`);
    console.log(`  Server cache hits:  ${totalHits}`);
    console.log(`  DB load reduction:  ~${dbReduction}%`);
    console.log(`\n${'═'.repeat(70)}\n`);
}

run().catch(err => {
    console.error('Perf test failed:', err);
    process.exit(1);
});
