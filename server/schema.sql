-- ============================================================
--  Jeeva Raksha — Unified Hospital Information System
--  PostgreSQL Schema v2.0
--  Run: psql -U postgres -d jeeva_raksha -f server/schema.sql
-- ============================================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- UTILITY: auto-update trigger for updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 1. DEPARTMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS departments (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    code        VARCHAR(20)  NOT NULL UNIQUE,
    description TEXT,
    head_id     UUID,           -- FK to users, added after users table
    status      VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive')),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_departments_updated
    BEFORE UPDATE ON departments
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================
-- 2. USERS (doctors, admins, staff, nurses)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    employee_id     VARCHAR(30) UNIQUE,
    name            VARCHAR(150) NOT NULL,
    email           VARCHAR(200) UNIQUE,
    phone           VARCHAR(20),
    role            VARCHAR(30) NOT NULL DEFAULT 'staff'
                        CHECK (role IN ('admin','doctor','nurse','pharmacist','lab_tech','receptionist','staff')),
    department_id   UUID REFERENCES departments(id) ON DELETE SET NULL,
    specialization  VARCHAR(150),
    qualification   VARCHAR(200),
    experience_years INTEGER,
    license_number  VARCHAR(50),
    status          VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive','deleted')),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_department ON users(department_id);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_email ON users(email);

CREATE TRIGGER trg_users_updated
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- Add FK for department head
ALTER TABLE departments
    ADD CONSTRAINT fk_departments_head
    FOREIGN KEY (head_id) REFERENCES users(id) ON DELETE SET NULL;

-- ============================================================
-- 3. PATIENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS patients (
    id                      UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    uhid                    VARCHAR(30) NOT NULL UNIQUE,
    name                    VARCHAR(150) NOT NULL,
    date_of_birth           DATE NOT NULL,
    gender                  VARCHAR(20) NOT NULL CHECK (gender IN ('Male','Female','Other')),
    blood_group             VARCHAR(10),
    phone                   VARCHAR(20),
    email                   VARCHAR(200),
    address                 TEXT,
    city                    VARCHAR(100),
    state                   VARCHAR(100),
    pincode                 VARCHAR(10),
    emergency_contact_name  VARCHAR(150),
    emergency_contact_phone VARCHAR(20),
    allergies               TEXT[] DEFAULT '{}',
    chronic_conditions      TEXT[] DEFAULT '{}',
    insurance_provider      VARCHAR(150),
    insurance_policy_no     VARCHAR(50),
    status                  VARCHAR(20) DEFAULT 'active'
                                CHECK (status IN ('active','inactive','deleted')),
    created_at              TIMESTAMPTZ DEFAULT NOW(),
    updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_patients_uhid ON patients(uhid);
CREATE INDEX idx_patients_phone ON patients(phone);
CREATE INDEX idx_patients_name ON patients(name);
CREATE INDEX idx_patients_status ON patients(status);
CREATE INDEX idx_patients_dob ON patients(date_of_birth);

CREATE TRIGGER trg_patients_updated
    BEFORE UPDATE ON patients
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================
-- 4. APPOINTMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS appointments (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id       UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    slot_time        TIMESTAMPTZ NOT NULL,
    duration_mins    INTEGER DEFAULT 15,
    appointment_type VARCHAR(30) DEFAULT 'Regular'
                        CHECK (appointment_type IN ('Regular','Follow-up','Emergency','Telemedicine')),
    reason           TEXT,
    status           VARCHAR(20) DEFAULT 'scheduled'
                        CHECK (status IN ('scheduled','confirmed','in-progress','completed','cancelled','no-show')),
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id);
CREATE INDEX idx_appointments_slot ON appointments(slot_time);
CREATE INDEX idx_appointments_status ON appointments(status);

CREATE TRIGGER trg_appointments_updated
    BEFORE UPDATE ON appointments
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================
-- 5. VISITS
-- ============================================================
CREATE TABLE IF NOT EXISTS visits (
    id               UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id       UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    visit_type       VARCHAR(20) NOT NULL CHECK (visit_type IN ('OPD','IPD','Emergency','Telemedicine')),
    visit_date       TIMESTAMPTZ DEFAULT NOW(),
    chief_complaint  TEXT,
    diagnosis        TEXT,
    prescription     JSONB,
    vitals_hr        INTEGER,
    vitals_bp        VARCHAR(20),
    vitals_spo2      INTEGER,
    vitals_temp      NUMERIC(4,1),
    triage_level     VARCHAR(20) CHECK (triage_level IN ('Critical','Urgent','Semi-Urgent','Non-Urgent','Stable')),
    notes            TEXT,
    status           VARCHAR(20) DEFAULT 'in-progress'
                        CHECK (status IN ('in-progress','completed','discharged','referred')),
    created_at       TIMESTAMPTZ DEFAULT NOW(),
    updated_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_visits_patient ON visits(patient_id);
CREATE INDEX idx_visits_doctor ON visits(doctor_id);
CREATE INDEX idx_visits_date ON visits(visit_date);
CREATE INDEX idx_visits_status ON visits(status);

CREATE TRIGGER trg_visits_updated
    BEFORE UPDATE ON visits
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================
-- 6. WARDS
-- ============================================================
CREATE TABLE IF NOT EXISTS wards (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name        VARCHAR(100) NOT NULL UNIQUE,
    ward_type   VARCHAR(30) CHECK (ward_type IN ('General','ICU','NICU','PICU','Maternity','Surgical','Isolation','Emergency')),
    floor       INTEGER,
    capacity    INTEGER DEFAULT 0,
    status      VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','inactive','maintenance')),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE TRIGGER trg_wards_updated
    BEFORE UPDATE ON wards
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================
-- 7. BEDS
-- ============================================================
CREATE TABLE IF NOT EXISTS beds (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    ward_id     UUID NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
    bed_number  VARCHAR(20) NOT NULL,
    bed_type    VARCHAR(30) DEFAULT 'Standard' CHECK (bed_type IN ('Standard','ICU','Ventilator','Isolation','Pediatric')),
    status      VARCHAR(20) DEFAULT 'Available' CHECK (status IN ('Available','Occupied','Maintenance','Reserved')),
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(ward_id, bed_number)
);

CREATE INDEX idx_beds_ward ON beds(ward_id);
CREATE INDEX idx_beds_status ON beds(status);

CREATE TRIGGER trg_beds_updated
    BEFORE UPDATE ON beds
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================
-- 8. ADMISSIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS admissions (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id    UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    ward_id       UUID NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
    bed_id        UUID NOT NULL REFERENCES beds(id) ON DELETE CASCADE,
    doctor_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    admit_date    TIMESTAMPTZ DEFAULT NOW(),
    discharge_date TIMESTAMPTZ,
    reason        TEXT,
    status        VARCHAR(20) DEFAULT 'admitted'
                    CHECK (status IN ('admitted','discharged','transferred','deceased')),
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_admissions_patient ON admissions(patient_id);
CREATE INDEX idx_admissions_bed ON admissions(bed_id);
CREATE INDEX idx_admissions_status ON admissions(status);

CREATE TRIGGER trg_admissions_updated
    BEFORE UPDATE ON admissions
    FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- ============================================================
-- 9. LAB ORDERS & RESULTS
-- ============================================================
CREATE TABLE IF NOT EXISTS lab_orders (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id   UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    test_name    VARCHAR(200) NOT NULL,
    test_code    VARCHAR(30),
    urgency      VARCHAR(20) DEFAULT 'Routine' CHECK (urgency IN ('Routine','Urgent','STAT')),
    status       VARCHAR(20) DEFAULT 'ordered'
                    CHECK (status IN ('ordered','sample-collected','processing','completed','cancelled')),
    notes        TEXT,
    created_at   TIMESTAMPTZ DEFAULT NOW(),
    updated_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lab_results (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id     UUID NOT NULL REFERENCES lab_orders(id) ON DELETE CASCADE,
    parameter    VARCHAR(200) NOT NULL,
    value        VARCHAR(100),
    unit         VARCHAR(50),
    reference_range VARCHAR(100),
    flag         VARCHAR(20) CHECK (flag IN ('Normal','Low','High','Critical')),
    verified_by  UUID REFERENCES users(id),
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_lab_orders_patient ON lab_orders(patient_id);
CREATE INDEX idx_lab_orders_status ON lab_orders(status);

-- ============================================================
-- 10. PHARMACY
-- ============================================================
CREATE TABLE IF NOT EXISTS pharmacy_stock (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    drug_name       VARCHAR(200) NOT NULL,
    generic_name    VARCHAR(200),
    batch_no        VARCHAR(50),
    manufacturer    VARCHAR(200),
    category        VARCHAR(50),
    quantity         INTEGER DEFAULT 0,
    unit            VARCHAR(20) DEFAULT 'units',
    unit_price      NUMERIC(10,2) DEFAULT 0,
    expiry_date     DATE,
    reorder_level   INTEGER DEFAULT 10,
    status          VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active','expired','recalled','discontinued')),
    created_at      TIMESTAMPTZ DEFAULT NOW(),
    updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS prescriptions (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id    UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    doctor_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    visit_id      UUID REFERENCES visits(id) ON DELETE SET NULL,
    drugs         JSONB NOT NULL DEFAULT '[]',
    notes         TEXT,
    status        VARCHAR(20) DEFAULT 'active'
                    CHECK (status IN ('active','dispensed','cancelled','expired')),
    created_at    TIMESTAMPTZ DEFAULT NOW(),
    updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_prescriptions_patient ON prescriptions(patient_id);
CREATE INDEX idx_pharmacy_stock_name ON pharmacy_stock(drug_name);

-- ============================================================
-- 11. BILLING
-- ============================================================
CREATE TABLE IF NOT EXISTS invoices (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id     UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    visit_id       UUID REFERENCES visits(id) ON DELETE SET NULL,
    invoice_number VARCHAR(30) NOT NULL UNIQUE,
    items          JSONB DEFAULT '[]',
    subtotal       NUMERIC(12,2) DEFAULT 0,
    tax            NUMERIC(12,2) DEFAULT 0,
    discount       NUMERIC(12,2) DEFAULT 0,
    total          NUMERIC(12,2) DEFAULT 0,
    status         VARCHAR(20) DEFAULT 'pending'
                    CHECK (status IN ('pending','paid','partial','cancelled','refunded')),
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS payments (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    invoice_id   UUID NOT NULL REFERENCES invoices(id) ON DELETE CASCADE,
    amount       NUMERIC(12,2) NOT NULL,
    method       VARCHAR(30) CHECK (method IN ('Cash','Card','UPI','Insurance','NEFT','Cheque')),
    reference_no VARCHAR(50),
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS insurance_claims (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    patient_id     UUID NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    invoice_id     UUID REFERENCES invoices(id) ON DELETE SET NULL,
    provider       VARCHAR(150) NOT NULL,
    policy_number  VARCHAR(50),
    claim_amount   NUMERIC(12,2),
    approved_amount NUMERIC(12,2),
    status         VARCHAR(20) DEFAULT 'submitted'
                    CHECK (status IN ('submitted','under-review','approved','rejected','settled')),
    created_at     TIMESTAMPTZ DEFAULT NOW(),
    updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- 12. AUDIT LOGS
-- ============================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id      VARCHAR(50),
    user_name    VARCHAR(150),
    session_id   VARCHAR(100),
    action       VARCHAR(50) NOT NULL,
    entity_type  VARCHAR(50),
    entity_id    VARCHAR(50),
    module       VARCHAR(50),
    details      TEXT,
    old_values   JSONB,
    new_values   JSONB,
    ip_address   VARCHAR(45),
    created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_audit_user ON audit_logs(user_id);
CREATE INDEX idx_audit_action ON audit_logs(action);
CREATE INDEX idx_audit_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_logs(created_at DESC);

-- ============================================================
-- SEED DATA
-- ============================================================

-- Departments
INSERT INTO departments (name, code, description) VALUES
    ('General Medicine',   'GEN',  'General medicine and internal medicine'),
    ('Cardiology',         'CARD', 'Heart and cardiovascular care'),
    ('Orthopedics',        'ORTH', 'Bones, joints, and musculoskeletal care'),
    ('Pediatrics',         'PED',  'Child healthcare'),
    ('Gynecology',         'GYN',  'Women''s health and obstetrics'),
    ('Neurology',          'NEUR', 'Brain and nervous system'),
    ('Dermatology',        'DERM', 'Skin care'),
    ('ENT',                'ENT',  'Ear, nose, and throat'),
    ('Ophthalmology',      'OPH',  'Eye care'),
    ('Radiology',          'RAD',  'Diagnostic imaging'),
    ('Pathology',          'PATH', 'Lab diagnostics'),
    ('Emergency Medicine', 'EM',   'Emergency and trauma care'),
    ('Anesthesiology',     'ANES', 'Anesthesia and pain management'),
    ('Surgery',            'SURG', 'General surgery'),
    ('Psychiatry',         'PSYC', 'Mental health')
ON CONFLICT (code) DO NOTHING;

-- Admin user
INSERT INTO users (employee_id, name, email, phone, role, status) VALUES
    ('ADMIN-001', 'System Administrator', 'admin@jeevaraksha.in', '9000000001', 'admin', 'active')
ON CONFLICT (employee_id) DO NOTHING;

-- Sample doctors
INSERT INTO users (employee_id, name, email, phone, role, specialization, qualification, experience_years, license_number, department_id, status) VALUES
    ('DOC-001', 'Dr. Aditi Sharma',    'aditi.sharma@jeevaraksha.in',    '9876543201', 'doctor', 'Cardiologist',      'MD, DM Cardiology',    12, 'KMC-45201', (SELECT id FROM departments WHERE code='CARD'), 'active'),
    ('DOC-002', 'Dr. Rajesh Kumar',    'rajesh.kumar@jeevaraksha.in',    '9876543202', 'doctor', 'General Physician', 'MBBS, MD Medicine',     8,  'KMC-45202', (SELECT id FROM departments WHERE code='GEN'),  'active'),
    ('DOC-003', 'Dr. Priya Nair',      'priya.nair@jeevaraksha.in',      '9876543203', 'doctor', 'Orthopedic Surgeon','MS Orthopedics',       15, 'KMC-45203', (SELECT id FROM departments WHERE code='ORTH'), 'active'),
    ('DOC-004', 'Dr. Suresh Patil',    'suresh.patil@jeevaraksha.in',    '9876543204', 'doctor', 'Pediatrician',      'MD Pediatrics',        10, 'KMC-45204', (SELECT id FROM departments WHERE code='PED'),  'active'),
    ('DOC-005', 'Dr. Meera Krishnan',  'meera.krishnan@jeevaraksha.in',  '9876543205', 'doctor', 'Neurologist',       'DM Neurology',         14, 'KMC-45205', (SELECT id FROM departments WHERE code='NEUR'), 'active')
ON CONFLICT (employee_id) DO NOTHING;

-- Sample wards
INSERT INTO wards (name, ward_type, floor, capacity) VALUES
    ('General Ward A',   'General',   1, 30),
    ('General Ward B',   'General',   1, 30),
    ('ICU',              'ICU',       2, 10),
    ('NICU',             'NICU',      2, 8),
    ('Maternity Ward',   'Maternity', 3, 20),
    ('Surgical Ward',    'Surgical',  3, 15),
    ('Emergency Ward',   'Emergency', 0, 12),
    ('Isolation Ward',   'Isolation', 4, 6)
ON CONFLICT (name) DO NOTHING;

-- Generate beds for each ward
DO $$
DECLARE
    w RECORD;
    i INTEGER;
BEGIN
    FOR w IN SELECT id, name, capacity FROM wards LOOP
        FOR i IN 1..w.capacity LOOP
            INSERT INTO beds (ward_id, bed_number, bed_type, status)
            VALUES (
                w.id,
                w.name || '-' || LPAD(i::TEXT, 3, '0'),
                CASE
                    WHEN w.name LIKE '%ICU%' THEN 'ICU'
                    WHEN w.name LIKE '%Isolation%' THEN 'Isolation'
                    WHEN w.name LIKE '%NICU%' THEN 'Pediatric'
                    ELSE 'Standard'
                END,
                CASE WHEN random() < 0.3 THEN 'Occupied' ELSE 'Available' END
            )
            ON CONFLICT (ward_id, bed_number) DO NOTHING;
        END LOOP;
    END LOOP;
END $$;

-- Sample patients
INSERT INTO patients (uhid, name, date_of_birth, gender, blood_group, phone, email, city, state, status) VALUES
    ('UHID-2026-0001', 'Ramesh Gowda',     '1985-03-15', 'Male',   'A+',  '9845123456', 'ramesh@email.com',  'Bengaluru', 'Karnataka', 'active'),
    ('UHID-2026-0002', 'Lakshmi Devi',      '1990-07-22', 'Female', 'B+',  '9845123457', 'lakshmi@email.com', 'Mysuru',    'Karnataka', 'active'),
    ('UHID-2026-0003', 'Sunil Hegde',       '1978-11-08', 'Male',   'O+',  '9845123458', 'sunil@email.com',   'Hubli',     'Karnataka', 'active'),
    ('UHID-2026-0004', 'Anitha Rao',        '1995-01-30', 'Female', 'AB+', '9845123459', 'anitha@email.com',  'Mangaluru', 'Karnataka', 'active'),
    ('UHID-2026-0005', 'Prakash Joshi',     '1960-06-12', 'Male',   'A-',  '9845123460', 'prakash@email.com', 'Dharwad',   'Karnataka', 'active'),
    ('UHID-2026-0006', 'Kavitha Murthy',    '2000-09-05', 'Female', 'O-',  '9845123461', 'kavitha@email.com', 'Bengaluru', 'Karnataka', 'active'),
    ('UHID-2026-0007', 'Mahesh Reddy',      '1972-04-18', 'Male',   'B-',  '9845123462', 'mahesh@email.com',  'Bellary',   'Karnataka', 'active'),
    ('UHID-2026-0008', 'Savitri Bhat',      '1988-12-25', 'Female', 'A+',  '9845123463', 'savitri@email.com', 'Shimoga',   'Karnataka', 'active')
ON CONFLICT (uhid) DO NOTHING;

-- Sample visits (today's data for dashboard)
INSERT INTO visits (patient_id, doctor_id, visit_type, chief_complaint, vitals_hr, vitals_bp, vitals_spo2, vitals_temp, triage_level, status) VALUES
    ((SELECT id FROM patients WHERE uhid='UHID-2026-0001'), (SELECT id FROM users WHERE employee_id='DOC-001'), 'OPD', 'Chest pain and breathlessness', 88, '140/90', 96, 37.2, 'Urgent', 'in-progress'),
    ((SELECT id FROM patients WHERE uhid='UHID-2026-0002'), (SELECT id FROM users WHERE employee_id='DOC-002'), 'OPD', 'Fever and headache', 76, '120/80', 98, 38.5, 'Non-Urgent', 'in-progress'),
    ((SELECT id FROM patients WHERE uhid='UHID-2026-0003'), (SELECT id FROM users WHERE employee_id='DOC-003'), 'Emergency', 'Fracture right arm', 92, '130/85', 97, 36.8, 'Semi-Urgent', 'in-progress'),
    ((SELECT id FROM patients WHERE uhid='UHID-2026-0004'), (SELECT id FROM users WHERE employee_id='DOC-004'), 'OPD', 'Routine checkup', 72, '110/70', 99, 36.6, 'Stable', 'completed'),
    ((SELECT id FROM patients WHERE uhid='UHID-2026-0005'), (SELECT id FROM users WHERE employee_id='DOC-005'), 'IPD', 'Severe migraine, observation needed', 80, '150/95', 95, 37.0, 'Urgent', 'in-progress'),
    ((SELECT id FROM patients WHERE uhid='UHID-2026-0006'), (SELECT id FROM users WHERE employee_id='DOC-001'), 'OPD', 'Follow-up echocardiogram', 70, '118/78', 99, 36.5, 'Stable', 'in-progress')
ON CONFLICT DO NOTHING;

-- Sample appointments
INSERT INTO appointments (patient_id, doctor_id, slot_time, duration_mins, appointment_type, reason, status) VALUES
    ((SELECT id FROM patients WHERE uhid='UHID-2026-0001'), (SELECT id FROM users WHERE employee_id='DOC-001'), NOW() + INTERVAL '1 hour',  30, 'Regular',   'Follow-up for cardiac assessment', 'scheduled'),
    ((SELECT id FROM patients WHERE uhid='UHID-2026-0002'), (SELECT id FROM users WHERE employee_id='DOC-002'), NOW() + INTERVAL '2 hours', 15, 'Regular',   'General check-up',                 'scheduled'),
    ((SELECT id FROM patients WHERE uhid='UHID-2026-0007'), (SELECT id FROM users WHERE employee_id='DOC-003'), NOW() + INTERVAL '3 hours', 30, 'Follow-up', 'Post-surgery review',              'confirmed'),
    ((SELECT id FROM patients WHERE uhid='UHID-2026-0008'), (SELECT id FROM users WHERE employee_id='DOC-004'), NOW() + INTERVAL '4 hours', 15, 'Regular',   'Vaccination',                       'scheduled')
ON CONFLICT DO NOTHING;

-- Seed audit log
INSERT INTO audit_logs (user_id, user_name, action, entity_type, details, module) VALUES
    ('ADMIN-001', 'System Administrator', 'SYSTEM_INIT', 'system', 'Database schema initialized with seed data', 'system')
ON CONFLICT DO NOTHING;

-- ============================================================
-- DONE
-- ============================================================
SELECT 'Schema created successfully. Tables: ' ||
       (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = 'public')::TEXT ||
       ' | Seed data loaded.' AS result;
