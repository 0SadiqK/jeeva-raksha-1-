// Jeeva Raksha — Frontend API Client
// Centralized interface to the Express backend

const BASE = '/api';

async function request<T>(url: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${BASE}${url}`, {
        headers: { 'Content-Type': 'application/json' },
        ...options,
    });
    if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }));
        throw new Error(err.error || `API Error: ${res.status}`);
    }
    return res.json();
}

// ─── Patients ───────────────────────────────────────────────
export const api = {
    // Patients
    getPatients: (search?: string) =>
        request<any[]>(`/patients${search ? `?search=${encodeURIComponent(search)}` : ''}`),

    getPatient: (id: string) =>
        request<any>(`/patients/${id}`),

    createPatient: (data: any) =>
        request<any>('/patients', { method: 'POST', body: JSON.stringify(data) }),

    updatePatient: (id: string, data: any) =>
        request<any>(`/patients/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

    // Appointments
    getAppointments: (filters?: { doctor_id?: string; status?: string; date?: string }) => {
        const params = new URLSearchParams(filters as any).toString();
        return request<any[]>(`/appointments${params ? `?${params}` : ''}`);
    },

    createAppointment: (data: any) =>
        request<any>('/appointments', { method: 'POST', body: JSON.stringify(data) }),

    updateAppointmentStatus: (id: string, status: string) =>
        request<any>(`/appointments/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),

    // Visits
    getVisits: (filters?: { patient_id?: string; type?: string }) => {
        const params = new URLSearchParams(filters as any).toString();
        return request<any[]>(`/visits${params ? `?${params}` : ''}`);
    },

    createVisit: (data: any) =>
        request<any>('/visits', { method: 'POST', body: JSON.stringify(data) }),

    // Labs
    getLabOrders: (filters?: { patient_id?: string; status?: string }) => {
        const params = new URLSearchParams(filters as any).toString();
        return request<any[]>(`/labs/orders${params ? `?${params}` : ''}`);
    },

    createLabOrder: (data: any) =>
        request<any>('/labs/orders', { method: 'POST', body: JSON.stringify(data) }),

    createLabResult: (data: any) =>
        request<any>('/labs/results', { method: 'POST', body: JSON.stringify(data) }),

    // Pharmacy
    getPharmacyStock: (search?: string) =>
        request<any[]>(`/pharmacy/stock${search ? `?search=${encodeURIComponent(search)}` : ''}`),

    getPrescriptions: (patient_id?: string) =>
        request<any[]>(`/pharmacy/prescriptions${patient_id ? `?patient_id=${patient_id}` : ''}`),

    createPrescription: (data: any) =>
        request<any>('/pharmacy/prescriptions', { method: 'POST', body: JSON.stringify(data) }),

    // Billing
    getInvoices: (filters?: { patient_id?: string; status?: string }) => {
        const params = new URLSearchParams(filters as any).toString();
        return request<any[]>(`/billing/invoices${params ? `?${params}` : ''}`);
    },

    createInvoice: (data: any) =>
        request<any>('/billing/invoices', { method: 'POST', body: JSON.stringify(data) }),

    createPayment: (data: any) =>
        request<any>('/billing/payments', { method: 'POST', body: JSON.stringify(data) }),

    getInsuranceClaims: () =>
        request<any[]>('/billing/insurance-claims'),

    // Wards & Beds
    getWards: () => request<any[]>('/wards'),

    getBeds: (ward_id?: string) =>
        request<any[]>(`/beds${ward_id ? `?ward_id=${ward_id}` : ''}`),

    updateBedStatus: (id: string, status: string) =>
        request<any>(`/beds/${id}`, { method: 'PATCH', body: JSON.stringify({ status }) }),

    // Dashboard
    getDashboardStats: () => request<any>('/dashboard/stats'),

    // Audit
    getAuditLogs: (page?: number) =>
        request<any>(`/audit-logs?page=${page || 1}`),

    createAuditLog: (data: { action: string; entity_type?: string; entity_id?: string; details?: string }) =>
        request<any>('/audit-logs', { method: 'POST', body: JSON.stringify(data) }),

    // Health check
    healthCheck: () => request<any>('/health'),
};

export default api;
