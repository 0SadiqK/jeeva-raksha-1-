-- =============================================================================
-- JEEVA RAKSHA — Unified Hospital Information System
-- PostgreSQL Database Schema (Normalized, HIPAA-Auditable)
-- =============================================================================
-- Generated: 2026-02-18
-- Engine: PostgreSQL 15+
-- Features: UUID PKs, foreign keys, indexes, audit timestamps, HIPAA compliance
-- =============================================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================================================
-- CORE: ROLES, PERMISSIONS, USERS
-- =============================================================================

CREATE TABLE roles (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_name       VARCHAR(50) NOT NULL UNIQUE,
    access_level    VARCHAR(10) NOT NULL CHECK (access_level IN ('VIEW', 'EDIT', 'ADMIN')),
    description     TEXT,
    is_system_role  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE permissions (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role_id     UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
    module      VARCHAR(50) NOT NULL,
    can_view    BOOLEAN NOT NULL DEFAULT FALSE,
    can_edit    BOOLEAN NOT NULL DEFAULT FALSE,
    can_admin   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (role_id, module)
);

CREATE INDEX idx_permissions_role ON permissions(role_id);
CREATE INDEX idx_permissions_module ON permissions(module);

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id     VARCHAR(20) NOT NULL UNIQUE,
    name            VARCHAR(150) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   TEXT NOT NULL,
    role_id         UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
    department      VARCHAR(100),
    designation     VARCHAR(100),
    phone           VARCHAR(20),
    status          VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended', 'on_leave')),
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_role ON users(role_id);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_email ON users(email);

-- =============================================================================
-- PATIENT MANAGEMENT
-- =============================================================================

CREATE TABLE patients (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uhid            VARCHAR(20) NOT NULL UNIQUE,   -- Universal Health ID
    name            VARCHAR(200) NOT NULL,
    date_of_birth   DATE NOT NULL,
    gender          VARCHAR(10) NOT NULL CHECK (gender IN ('Male', 'Female', 'Other')),
    blood_group     VARCHAR(5),
    phone           VARCHAR(20),
    email           VARCHAR(255),
    address         TEXT,
    city            VARCHAR(100),
    state           VARCHAR(100),
    pincode         VARCHAR(10),
    emergency_contact_name  VARCHAR(150),
    emergency_contact_phone VARCHAR(20),
    allergies       TEXT[],
    chronic_conditions TEXT[],
    status          VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'deceased', 'inactive')),
    registered_by   UUID REFERENCES users(id),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_patients_uhid ON patients(uhid);
CREATE INDEX idx_patients_name ON patients(name);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_status ON patients(status);

CREATE TABLE patient_family_links (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id          UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    related_patient_id  UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    relation            VARCHAR(30) NOT NULL CHECK (relation IN (
        'Spouse', 'Parent', 'Child', 'Sibling', 'Guardian', 'Other'
    )),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (patient_id, related_patient_id),
    CHECK (patient_id <> related_patient_id)
);

CREATE INDEX idx_family_patient ON patient_family_links(patient_id);

-- =============================================================================
-- CLINICAL RECORDS: VISITS, ADMISSIONS, MEDICAL RECORDS
-- =============================================================================

CREATE TABLE visits (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    doctor_id       UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    visit_type      VARCHAR(15) NOT NULL CHECK (visit_type IN ('OPD', 'IPD', 'Emergency')),
    visit_date      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    chief_complaint TEXT,
    vitals_hr       INTEGER,
    vitals_bp       VARCHAR(10),
    vitals_spo2     INTEGER,
    vitals_temp     NUMERIC(4,1),
    triage_level    VARCHAR(15) CHECK (triage_level IN ('Critical', 'Serious', 'Stable')),
    status          VARCHAR(20) NOT NULL DEFAULT 'in-progress' CHECK (status IN (
        'scheduled', 'in-progress', 'completed', 'cancelled', 'no-show'
    )),
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_visits_patient ON visits(patient_id);
CREATE INDEX idx_visits_doctor ON visits(doctor_id);
CREATE INDEX idx_visits_date ON visits(visit_date);
CREATE INDEX idx_visits_type ON visits(visit_type);
CREATE INDEX idx_visits_status ON visits(status);

-- Wards & Beds (placed here because admissions reference them)

CREATE TABLE wards (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    ward_type   VARCHAR(30) NOT NULL CHECK (ward_type IN ('ICU', 'General', 'Private', 'Isolation', 'Pediatric', 'Maternity', 'Emergency')),
    floor       INTEGER,
    capacity    INTEGER NOT NULL DEFAULT 0,
    status      VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'maintenance', 'closed')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE beds (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ward_id     UUID NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
    bed_number  VARCHAR(20) NOT NULL,
    bed_type    VARCHAR(20) NOT NULL DEFAULT 'Standard' CHECK (bed_type IN ('Standard', 'ICU', 'Ventilator', 'Isolation', 'Cradle')),
    status      VARCHAR(20) NOT NULL DEFAULT 'Available' CHECK (status IN ('Available', 'Occupied', 'Cleaning', 'Maintenance')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (ward_id, bed_number)
);

CREATE INDEX idx_beds_ward ON beds(ward_id);
CREATE INDEX idx_beds_status ON beds(status);

CREATE TABLE admissions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    visit_id        UUID REFERENCES visits(id),
    ward_id         UUID NOT NULL REFERENCES wards(id) ON DELETE RESTRICT,
    bed_id          UUID NOT NULL REFERENCES beds(id) ON DELETE RESTRICT,
    admitting_doctor UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    admit_date      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    discharge_date  TIMESTAMPTZ,
    discharge_reason VARCHAR(50),
    status          VARCHAR(20) NOT NULL DEFAULT 'admitted' CHECK (status IN (
        'admitted', 'discharged', 'transferred', 'deceased', 'absconded'
    )),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_admissions_patient ON admissions(patient_id);
CREATE INDEX idx_admissions_ward ON admissions(ward_id);
CREATE INDEX idx_admissions_bed ON admissions(bed_id);
CREATE INDEX idx_admissions_status ON admissions(status);
CREATE INDEX idx_admissions_dates ON admissions(admit_date, discharge_date);

CREATE TABLE medical_records (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    visit_id        UUID REFERENCES visits(id),
    recorded_by     UUID NOT NULL REFERENCES users(id),
    diagnosis       TEXT,
    notes           TEXT,
    allergies       TEXT[],
    medical_history TEXT,
    icd_codes       TEXT[],                         -- ICD-10 diagnosis codes
    is_confidential BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_medrec_patient ON medical_records(patient_id);
CREATE INDEX idx_medrec_visit ON medical_records(visit_id);

-- =============================================================================
-- DIAGNOSTICS: LABORATORY & RADIOLOGY
-- =============================================================================

CREATE TABLE lab_orders (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    doctor_id       UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    visit_id        UUID REFERENCES visits(id),
    priority        VARCHAR(10) NOT NULL DEFAULT 'routine' CHECK (priority IN ('stat', 'urgent', 'routine')),
    status          VARCHAR(20) NOT NULL DEFAULT 'ordered' CHECK (status IN (
        'ordered', 'sample-collected', 'processing', 'completed', 'cancelled'
    )),
    clinical_notes  TEXT,
    ordered_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_laborders_patient ON lab_orders(patient_id);
CREATE INDEX idx_laborders_doctor ON lab_orders(doctor_id);
CREATE INDEX idx_laborders_status ON lab_orders(status);

CREATE TABLE lab_results (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    lab_order_id    UUID NOT NULL REFERENCES lab_orders(id) ON DELETE CASCADE,
    test_name       VARCHAR(150) NOT NULL,
    test_category   VARCHAR(50),
    result_value    VARCHAR(100),
    result_unit     VARCHAR(30),
    normal_range    VARCHAR(50),
    is_flagged      BOOLEAN NOT NULL DEFAULT FALSE,
    flag_severity   VARCHAR(10) CHECK (flag_severity IN ('Normal', 'Abnormal', 'Critical')),
    reported_by     UUID REFERENCES users(id),
    reported_at     TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_labresults_order ON lab_results(lab_order_id);
CREATE INDEX idx_labresults_flagged ON lab_results(is_flagged) WHERE is_flagged = TRUE;

CREATE TABLE radiology_orders (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    doctor_id       UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    visit_id        UUID REFERENCES visits(id),
    scan_type       VARCHAR(20) NOT NULL CHECK (scan_type IN ('CT', 'MRI', 'X-Ray', 'USG', 'PET', 'Mammography')),
    body_part       VARCHAR(100),
    clinical_indication TEXT,
    priority        VARCHAR(10) NOT NULL DEFAULT 'routine' CHECK (priority IN ('stat', 'urgent', 'routine')),
    is_critical     BOOLEAN NOT NULL DEFAULT FALSE,
    status          VARCHAR(20) NOT NULL DEFAULT 'ordered' CHECK (status IN (
        'ordered', 'scheduled', 'scanning', 'awaiting-report', 'finalized', 'cancelled'
    )),
    ordered_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_radorders_patient ON radiology_orders(patient_id);
CREATE INDEX idx_radorders_status ON radiology_orders(status);
CREATE INDEX idx_radorders_critical ON radiology_orders(is_critical) WHERE is_critical = TRUE;

CREATE TABLE radiology_reports (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    radiology_order_id  UUID NOT NULL REFERENCES radiology_orders(id) ON DELETE CASCADE,
    radiologist_id      UUID NOT NULL REFERENCES users(id),
    findings            TEXT NOT NULL,
    impression          TEXT NOT NULL,
    key_observations    TEXT[],
    urgency_level       VARCHAR(10) CHECK (urgency_level IN ('Normal', 'Priority', 'Urgent')),
    image_urls          TEXT[],
    reported_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_radreports_order ON radiology_reports(radiology_order_id);

-- =============================================================================
-- PHARMACY & INVENTORY
-- =============================================================================

CREATE TABLE prescriptions (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    doctor_id       UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    visit_id        UUID REFERENCES visits(id),
    diagnosis       TEXT,
    pharmacy_notes  TEXT,
    status          VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'dispensed', 'cancelled', 'expired')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rx_patient ON prescriptions(patient_id);
CREATE INDEX idx_rx_doctor ON prescriptions(doctor_id);
CREATE INDEX idx_rx_visit ON prescriptions(visit_id);

CREATE TABLE prescription_items (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    prescription_id     UUID NOT NULL REFERENCES prescriptions(id) ON DELETE CASCADE,
    drug_name           VARCHAR(200) NOT NULL,
    dosage              VARCHAR(100) NOT NULL,
    frequency           VARCHAR(100),
    route               VARCHAR(30) DEFAULT 'Oral' CHECK (route IN ('Oral', 'IV', 'IM', 'SC', 'Topical', 'Inhaled', 'Other')),
    duration            VARCHAR(50),
    instructions        TEXT,
    is_dispensed        BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rxitems_prescription ON prescription_items(prescription_id);

CREATE TABLE pharmacy_stock (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    drug_name       VARCHAR(200) NOT NULL,
    generic_name    VARCHAR(200),
    batch_no        VARCHAR(50) NOT NULL,
    manufacturer    VARCHAR(150),
    quantity         INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    unit_price      NUMERIC(10,2),
    expiry_date     DATE NOT NULL,
    reorder_level   INTEGER NOT NULL DEFAULT 10,
    storage_location VARCHAR(50),
    status          VARCHAR(20) NOT NULL DEFAULT 'in-stock' CHECK (status IN ('in-stock', 'low-stock', 'expired', 'recalled')),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (drug_name, batch_no)
);

CREATE INDEX idx_stock_drug ON pharmacy_stock(drug_name);
CREATE INDEX idx_stock_expiry ON pharmacy_stock(expiry_date);
CREATE INDEX idx_stock_status ON pharmacy_stock(status);

-- =============================================================================
-- OPERATIONS: APPOINTMENTS, DOCTOR ROUNDS
-- =============================================================================

CREATE TABLE appointments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    doctor_id       UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    slot_time       TIMESTAMPTZ NOT NULL,
    duration_mins   INTEGER NOT NULL DEFAULT 15,
    appointment_type VARCHAR(20) NOT NULL DEFAULT 'Regular' CHECK (appointment_type IN ('Regular', 'Follow-up', 'Walk-in', 'Teleconsult')),
    status          VARCHAR(20) NOT NULL DEFAULT 'Scheduled' CHECK (status IN (
        'Scheduled', 'Confirmed', 'Checked-In', 'In-Progress', 'Completed', 'Cancelled', 'No-Show'
    )),
    reason          TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_appt_patient ON appointments(patient_id);
CREATE INDEX idx_appt_doctor ON appointments(doctor_id);
CREATE INDEX idx_appt_slot ON appointments(slot_time);
CREATE INDEX idx_appt_status ON appointments(status);

CREATE TABLE doctor_rounds (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    doctor_id       UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    admission_id    UUID REFERENCES admissions(id),
    round_time      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    notes           TEXT,
    plan            TEXT,
    vitals_hr       INTEGER,
    vitals_bp       VARCHAR(10),
    vitals_spo2     INTEGER,
    vitals_temp     NUMERIC(4,1),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rounds_doctor ON doctor_rounds(doctor_id);
CREATE INDEX idx_rounds_patient ON doctor_rounds(patient_id);
CREATE INDEX idx_rounds_time ON doctor_rounds(round_time);

-- =============================================================================
-- FINANCIALS: INVOICES, PAYMENTS, INSURANCE
-- =============================================================================

CREATE TABLE invoices (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_number  VARCHAR(30) NOT NULL UNIQUE,
    patient_id      UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    visit_id        UUID REFERENCES visits(id),
    admission_id    UUID REFERENCES admissions(id),
    subtotal        NUMERIC(12,2) NOT NULL DEFAULT 0,
    tax_amount      NUMERIC(12,2) NOT NULL DEFAULT 0,
    discount        NUMERIC(12,2) NOT NULL DEFAULT 0,
    total_amount    NUMERIC(12,2) NOT NULL DEFAULT 0,
    amount_paid     NUMERIC(12,2) NOT NULL DEFAULT 0,
    balance_due     NUMERIC(12,2) GENERATED ALWAYS AS (total_amount - amount_paid) STORED,
    status          VARCHAR(20) NOT NULL DEFAULT 'draft' CHECK (status IN (
        'draft', 'issued', 'partial', 'paid', 'overdue', 'cancelled', 'refunded'
    )),
    due_date        DATE,
    issued_at       TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_invoices_patient ON invoices(patient_id);
CREATE INDEX idx_invoices_status ON invoices(status);
CREATE INDEX idx_invoices_number ON invoices(invoice_number);

CREATE TABLE invoice_line_items (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    description     VARCHAR(300) NOT NULL,
    category        VARCHAR(50) NOT NULL CHECK (category IN (
        'Consultation', 'Lab', 'Radiology', 'Pharmacy', 'Procedure', 'Room', 'Other'
    )),
    quantity        INTEGER NOT NULL DEFAULT 1,
    unit_price      NUMERIC(10,2) NOT NULL,
    total_price     NUMERIC(12,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lineitems_invoice ON invoice_line_items(invoice_id);

CREATE TABLE payments (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id      UUID NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
    amount          NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    payment_mode    VARCHAR(20) NOT NULL CHECK (payment_mode IN (
        'Cash', 'Card', 'UPI', 'NEFT', 'Insurance', 'Cheque'
    )),
    transaction_ref VARCHAR(100),
    received_by     UUID REFERENCES users(id),
    paid_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_payments_invoice ON payments(invoice_id);
CREATE INDEX idx_payments_date ON payments(paid_at);

CREATE TABLE insurance_claims (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id          UUID NOT NULL REFERENCES patients(id) ON DELETE RESTRICT,
    invoice_id          UUID NOT NULL REFERENCES invoices(id) ON DELETE RESTRICT,
    insurance_provider  VARCHAR(200) NOT NULL,
    policy_number       VARCHAR(100) NOT NULL,
    claim_amount        NUMERIC(12,2) NOT NULL,
    approved_amount     NUMERIC(12,2),
    status              VARCHAR(20) NOT NULL DEFAULT 'submitted' CHECK (status IN (
        'draft', 'submitted', 'under-review', 'approved', 'partially-approved', 'rejected', 'settled'
    )),
    submitted_at        TIMESTAMPTZ,
    settled_at          TIMESTAMPTZ,
    rejection_reason    TEXT,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_claims_patient ON insurance_claims(patient_id);
CREATE INDEX idx_claims_invoice ON insurance_claims(invoice_id);
CREATE INDEX idx_claims_status ON insurance_claims(status);

-- =============================================================================
-- AI & AUDIT LOGS
-- =============================================================================

CREATE TABLE ai_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id      UUID REFERENCES patients(id),
    user_id         UUID REFERENCES users(id),
    module          VARCHAR(50) NOT NULL,
    action_type     VARCHAR(50) NOT NULL,
    input_summary   TEXT,
    suggestion      TEXT NOT NULL,
    confidence      NUMERIC(5,2) CHECK (confidence >= 0 AND confidence <= 100),
    model_used      VARCHAR(100),
    accepted        BOOLEAN,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ailogs_patient ON ai_logs(patient_id);
CREATE INDEX idx_ailogs_module ON ai_logs(module);
CREATE INDEX idx_ailogs_date ON ai_logs(created_at);

CREATE TABLE audit_logs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID REFERENCES users(id),
    user_name       VARCHAR(150),
    session_id      VARCHAR(100),
    action          VARCHAR(50) NOT NULL,
    entity_type     VARCHAR(50) NOT NULL,
    entity_id       UUID,
    module          VARCHAR(50),
    details         JSONB,
    ip_address      INET,
    user_agent      TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_date ON audit_logs(created_at);
CREATE INDEX idx_audit_details ON audit_logs USING GIN (details);

-- Immutable audit: prevent updates and deletes
CREATE OR REPLACE FUNCTION prevent_audit_mutation()
RETURNS TRIGGER AS $$
BEGIN
    RAISE EXCEPTION 'Audit logs are immutable. UPDATE and DELETE operations are not permitted.';
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_audit_immutable
    BEFORE UPDATE OR DELETE ON audit_logs
    FOR EACH ROW EXECUTE FUNCTION prevent_audit_mutation();

-- =============================================================================
-- EMERGENCY OVERRIDE LOG (links to RBAC system)
-- =============================================================================

CREATE TABLE emergency_overrides (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id),
    reason          TEXT NOT NULL,
    previous_role   VARCHAR(10) NOT NULL,
    elevated_role   VARCHAR(10) NOT NULL DEFAULT 'ADMIN',
    activated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at      TIMESTAMPTZ NOT NULL,
    deactivated_at  TIMESTAMPTZ,
    deactivation_type VARCHAR(20) CHECK (deactivation_type IN ('manual', 'auto-expired', 'admin-revoked')),
    duration_seconds INTEGER,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_override_user ON emergency_overrides(user_id);
CREATE INDEX idx_override_active ON emergency_overrides(activated_at, deactivated_at);

-- =============================================================================
-- AUTO-UPDATE TIMESTAMPS TRIGGER
-- =============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
DO $$
DECLARE
    tbl TEXT;
BEGIN
    FOR tbl IN
        SELECT table_name FROM information_schema.columns
        WHERE column_name = 'updated_at'
        AND table_schema = 'public'
        AND table_name <> 'audit_logs'
    LOOP
        EXECUTE format(
            'CREATE TRIGGER trg_%I_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();',
            tbl, tbl
        );
    END LOOP;
END;
$$;
