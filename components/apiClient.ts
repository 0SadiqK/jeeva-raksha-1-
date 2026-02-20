// Jeeva Raksha — Frontend API Client v2.3 (with Client Cache)

const BASE = (import.meta as any).env?.VITE_API_URL || '/api';

// ─── Client-side GET cache ───────────────────────────────────
const clientCache = new Map();
const CACHE_TTL = 15000; // 15 seconds

function getCached(url) {
    const entry = clientCache.get(url);
    if (!entry) return null;
    if (Date.now() > entry.expiresAt) {
        clientCache.delete(url);
        return null;
    }
    return entry.data;
}

function setCache(url, data) {
    clientCache.set(url, { data, expiresAt: Date.now() + CACHE_TTL });
}

function invalidateCache(prefix) {
    if (!prefix) { clientCache.clear(); return; }
    for (const key of clientCache.keys()) {
        if (key.startsWith(prefix)) clientCache.delete(key);
    }
}

// ─── Token management ────────────────────────────────────────
function getToken() {
    return localStorage.getItem('jrk_token') || sessionStorage.getItem('jrk_token');
}

function getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    return headers;
}

// ─── Base request ────────────────────────────────────────────
async function request(url, options) {
    const method = options?.method || 'GET';

    if (method === 'GET') {
        const cached = getCached(url);
        if (cached) return cached;
    }

    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 30000);

    try {
        const res = await fetch(`${BASE}${url}`, {
            headers: getHeaders(),
            signal: controller.signal,
            ...options,
        });
        clearTimeout(id);

        if (!res.ok) {
            const err = await res.json().catch(() => ({ error: res.statusText }));
            if (res.status === 401 && err.expired) {
                localStorage.removeItem('jrk_token');
                sessionStorage.removeItem('jrk_token');
                window.location.reload();
            }
            throw new Error(err.error || err.message || `API Error: ${res.status}`);
        }

        const data = await res.json();

        if (method === 'GET') setCache(url, data);

        if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)) {
            const parts = url.split('/').filter(Boolean);
            if (parts.length > 0) invalidateCache(`/${parts[0]}`);
            invalidateCache('/dashboard');
        }

        return data;
    } catch (err) {
        clearTimeout(id);
        if (err.name === 'AbortError') {
            throw new Error('Request timed out. Please check your connection or server status.');
        }
        throw err;
    }
}

// ─── API ─────────────────────────────────────────────────────
export const api = {
    auth: {
        login: (email, password) => request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
        demo: (role) => request('/auth/demo', { method: 'POST', body: JSON.stringify({ role }) }),
        me: () => request('/auth/me'),
        logout: () => request('/auth/logout', { method: 'POST' }),
    },
    getPatients: (search, status) => request(`/patients${search ? `?search=${encodeURIComponent(search)}` : ''}${status ? `${search ? '&' : '?'}status=${status}` : ''}`),
    getPatient: (id) => request(`/patients/${id}`),
    getPatientByUHID: (uhid) => request(`/patients/uhid/${encodeURIComponent(uhid)}`),
    createPatient: (data) => request('/patients', { method: 'POST', body: JSON.stringify(data) }),
    updatePatient: (id, data) => request(`/patients/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deletePatient: (id, hard = false) => request(`/patients/${id}${hard ? '?hard=true' : ''}`, { method: 'DELETE' }),
    getDoctors: (search, department) => {
        const params = new URLSearchParams();
        if (search) params.set('search', search);
        if (department) params.set('department', department);
        const qs = params.toString();
        return request(`/doctors${qs ? `?${qs}` : ''}`);
    },
    getDoctor: (id) => request(`/doctors/${id}`),
    createDoctor: (data) => request('/doctors', { method: 'POST', body: JSON.stringify(data) }),
    updateDoctor: (id, data) => request(`/doctors/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteDoctor: (id, hard = false) => request(`/doctors/${id}${hard ? '?hard=true' : ''}`, { method: 'DELETE' }),
    getAppointments: (filters) => {
        const params = new URLSearchParams(filters).toString();
        return request(`/appointments${params ? `?${params}` : ''}`);
    },
    createAppointment: (data) => request('/appointments', { method: 'POST', body: JSON.stringify(data) }),
    updateAppointmentStatus: (id, status) => request(`/appointments/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    getVisits: (filters) => {
        const params = new URLSearchParams(filters).toString();
        return request(`/visits${params ? `?${params}` : ''}`);
    },
    createVisit: (data) => request('/visits', { method: 'POST', body: JSON.stringify(data) }),
    getLabOrders: (filters) => {
        const params = new URLSearchParams(filters).toString();
        return request(`/labs/orders${params ? `?${params}` : ''}`);
    },
    createLabOrder: (data) => request('/labs/orders', { method: 'POST', body: JSON.stringify(data) }),
    createLabResult: (data) => request('/labs/results', { method: 'POST', body: JSON.stringify(data) }),
    getPharmacyStock: (search) => request(`/pharmacy/stock${search ? `?search=${encodeURIComponent(search)}` : ''}`),
    getPrescriptions: (patient_id) => request(`/pharmacy/prescriptions${patient_id ? `?patient_id=${patient_id}` : ''}`),
    createPrescription: (data) => request('/pharmacy/prescriptions', { method: 'POST', body: JSON.stringify(data) }),
    getInvoices: (filters) => {
        const params = new URLSearchParams(filters).toString();
        return request(`/billing/invoices${params ? `?${params}` : ''}`);
    },
    createInvoice: (data) => request('/billing/invoices', { method: 'POST', body: JSON.stringify(data) }),
    createPayment: (data) => request('/billing/payments', { method: 'POST', body: JSON.stringify(data) }),
    getInsuranceClaims: () => request('/billing/insurance-claims'),
    getWards: () => request('/wards'),
    createWard: (data) => request('/wards', { method: 'POST', body: JSON.stringify(data) }),
    updateWard: (id, data) => request(`/wards/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteWard: (id) => request(`/wards/${id}`, { method: 'DELETE' }),
    getBeds: (ward_id) => request(`/beds${ward_id ? `?ward_id=${ward_id}` : ''}`),
    createBed: (data) => request('/beds', { method: 'POST', body: JSON.stringify(data) }),
    updateBed: (id, data) => request(`/beds/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
    deleteBed: (id) => request(`/beds/${id}`, { method: 'DELETE' }),
    updateBedStatus: (id, status) => request(`/beds/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),
    getDashboardStats: () => request('/dashboard/stats'),
    getAuditLogs: (page) => request(`/audit-logs?page=${page || 1}`),
    createAuditLog: (data) => request('/audit-logs', { method: 'POST', body: JSON.stringify(data) }),
    healthCheck: () => request('/health'),
    clearCache: () => invalidateCache(),
};

export default api;
