-- =============================================================================
-- JEEVA RAKSHA — Seed Data
-- Run AFTER schema.sql
-- =============================================================================

-- ===================== ROLES =====================

INSERT INTO roles (id, role_name, access_level, description, is_system_role) VALUES
    ('a1000000-0000-0000-0000-000000000001', 'Receptionist',     'VIEW',  'Front-desk staff — view patient records, schedule appointments',   TRUE),
    ('a1000000-0000-0000-0000-000000000002', 'Nurse',            'VIEW',  'Nursing staff — view records, update vitals',                      TRUE),
    ('a1000000-0000-0000-0000-000000000003', 'Lab Technician',   'EDIT',  'Lab staff — manage lab orders and results',                        TRUE),
    ('a1000000-0000-0000-0000-000000000004', 'Radiologist',      'EDIT',  'Radiology staff — manage scans and reports',                       TRUE),
    ('a1000000-0000-0000-0000-000000000005', 'Pharmacist',       'EDIT',  'Pharmacy staff — dispense medications, manage stock',              TRUE),
    ('a1000000-0000-0000-0000-000000000006', 'Doctor',           'EDIT',  'Physicians — manage patients, prescribe, order diagnostics',       TRUE),
    ('a1000000-0000-0000-0000-000000000007', 'Surgeon',          'EDIT',  'Surgeons — full clinical access including OT',                     TRUE),
    ('a1000000-0000-0000-0000-000000000008', 'HOD',              'ADMIN', 'Head of Department — administrative access to department',          TRUE),
    ('a1000000-0000-0000-0000-000000000009', 'Administrator',    'ADMIN', 'Hospital admin — full system and financial access',                 TRUE),
    ('a1000000-0000-0000-0000-00000000000a', 'Super Admin',      'ADMIN', 'System super administrator — unrestricted access',                 TRUE);

-- ===================== PERMISSIONS =====================

-- Receptionist (VIEW)
INSERT INTO permissions (role_id, module, can_view, can_edit, can_admin) VALUES
    ('a1000000-0000-0000-0000-000000000001', 'DASHBOARD',    TRUE, FALSE, FALSE),
    ('a1000000-0000-0000-0000-000000000001', 'OPD',          TRUE, FALSE, FALSE),
    ('a1000000-0000-0000-0000-000000000001', 'PATIENTS',     TRUE, TRUE,  FALSE),
    ('a1000000-0000-0000-0000-000000000001', 'APPOINTMENTS', TRUE, TRUE,  FALSE),
    ('a1000000-0000-0000-0000-000000000001', 'BILLING',      TRUE, FALSE, FALSE);

-- Doctor (EDIT)
INSERT INTO permissions (role_id, module, can_view, can_edit, can_admin) VALUES
    ('a1000000-0000-0000-0000-000000000006', 'DASHBOARD',    TRUE, TRUE,  FALSE),
    ('a1000000-0000-0000-0000-000000000006', 'OPD',          TRUE, TRUE,  FALSE),
    ('a1000000-0000-0000-0000-000000000006', 'IPD',          TRUE, TRUE,  FALSE),
    ('a1000000-0000-0000-0000-000000000006', 'EMERGENCY',    TRUE, TRUE,  FALSE),
    ('a1000000-0000-0000-0000-000000000006', 'EMR',          TRUE, TRUE,  FALSE),
    ('a1000000-0000-0000-0000-000000000006', 'ROUNDS',       TRUE, TRUE,  FALSE),
    ('a1000000-0000-0000-0000-000000000006', 'PATIENTS',     TRUE, TRUE,  FALSE),
    ('a1000000-0000-0000-0000-000000000006', 'LABORATORY',   TRUE, TRUE,  FALSE),
    ('a1000000-0000-0000-0000-000000000006', 'RADIOLOGY',    TRUE, TRUE,  FALSE),
    ('a1000000-0000-0000-0000-000000000006', 'PHARMACY',     TRUE, FALSE, FALSE),
    ('a1000000-0000-0000-0000-000000000006', 'BEDS',         TRUE, FALSE, FALSE);

-- Administrator (ADMIN)
INSERT INTO permissions (role_id, module, can_view, can_edit, can_admin) VALUES
    ('a1000000-0000-0000-0000-000000000009', 'DASHBOARD',           TRUE, TRUE, TRUE),
    ('a1000000-0000-0000-0000-000000000009', 'OPD',                 TRUE, TRUE, TRUE),
    ('a1000000-0000-0000-0000-000000000009', 'IPD',                 TRUE, TRUE, TRUE),
    ('a1000000-0000-0000-0000-000000000009', 'EMERGENCY',           TRUE, TRUE, TRUE),
    ('a1000000-0000-0000-0000-000000000009', 'OT',                  TRUE, TRUE, TRUE),
    ('a1000000-0000-0000-0000-000000000009', 'EMR',                 TRUE, TRUE, TRUE),
    ('a1000000-0000-0000-0000-000000000009', 'ROUNDS',              TRUE, TRUE, TRUE),
    ('a1000000-0000-0000-0000-000000000009', 'PORTAL',              TRUE, TRUE, TRUE),
    ('a1000000-0000-0000-0000-000000000009', 'PATIENTS',            TRUE, TRUE, TRUE),
    ('a1000000-0000-0000-0000-000000000009', 'LABORATORY',          TRUE, TRUE, TRUE),
    ('a1000000-0000-0000-0000-000000000009', 'RADIOLOGY',           TRUE, TRUE, TRUE),
    ('a1000000-0000-0000-0000-000000000009', 'PHARMACY',            TRUE, TRUE, TRUE),
    ('a1000000-0000-0000-0000-000000000009', 'INVENTORY',           TRUE, TRUE, TRUE),
    ('a1000000-0000-0000-0000-000000000009', 'BILLING',             TRUE, TRUE, TRUE),
    ('a1000000-0000-0000-0000-000000000009', 'INSURANCE',           TRUE, TRUE, TRUE),
    ('a1000000-0000-0000-0000-000000000009', 'HR',                  TRUE, TRUE, TRUE),
    ('a1000000-0000-0000-0000-000000000009', 'BEDS',                TRUE, TRUE, TRUE),
    ('a1000000-0000-0000-0000-000000000009', 'ANALYTICS',           TRUE, TRUE, TRUE),
    ('a1000000-0000-0000-0000-000000000009', 'QUALITY',             TRUE, TRUE, TRUE),
    ('a1000000-0000-0000-0000-000000000009', 'INTEGRATIONS_DEVICES',TRUE, TRUE, TRUE),
    ('a1000000-0000-0000-0000-000000000009', 'INTEGRATIONS_GOVT',   TRUE, TRUE, TRUE);

-- ===================== USERS =====================
-- Passwords are bcrypt hashes of 'JeevaRaksha@2026' (placeholder)

INSERT INTO users (id, employee_id, name, email, password_hash, role_id, department, designation, phone, status) VALUES
    ('b1000000-0000-0000-0000-000000000001', 'ADM-001',     'Rajesh Kumar',       'rajesh.kumar@jeevaraksha.in',    '$2a$12$placeholder.hash.value.here', 'a1000000-0000-0000-0000-000000000009', 'Administration', 'Hospital Director',       '+91-9876543210', 'active'),
    ('b1000000-0000-0000-0000-000000000002', 'DOC-SH-402',  'Dr. Aditi Sharma',   'aditi.sharma@jeevaraksha.in',    '$2a$12$placeholder.hash.value.here', 'a1000000-0000-0000-0000-000000000006', 'General Medicine','Senior Consultant',      '+91-9876543211', 'active'),
    ('b1000000-0000-0000-0000-000000000003', 'DOC-PT-201',  'Dr. Vikram Patel',   'vikram.patel@jeevaraksha.in',    '$2a$12$placeholder.hash.value.here', 'a1000000-0000-0000-0000-000000000007', 'Surgery',         'Chief Surgeon',          '+91-9876543212', 'active'),
    ('b1000000-0000-0000-0000-000000000004', 'NRS-101',     'Meera Nair',         'meera.nair@jeevaraksha.in',      '$2a$12$placeholder.hash.value.here', 'a1000000-0000-0000-0000-000000000002', 'Nursing',         'Head Nurse',             '+91-9876543213', 'active'),
    ('b1000000-0000-0000-0000-000000000005', 'RCP-301',     'Ananya Deshmukh',    'ananya.d@jeevaraksha.in',        '$2a$12$placeholder.hash.value.here', 'a1000000-0000-0000-0000-000000000001', 'Front Desk',      'Senior Receptionist',    '+91-9876543214', 'active'),
    ('b1000000-0000-0000-0000-000000000006', 'LAB-401',     'Suresh Reddy',       'suresh.reddy@jeevaraksha.in',    '$2a$12$placeholder.hash.value.here', 'a1000000-0000-0000-0000-000000000003', 'Laboratory',      'Senior Lab Technician',  '+91-9876543215', 'active'),
    ('b1000000-0000-0000-0000-000000000007', 'RAD-501',     'Dr. Priya Menon',    'priya.menon@jeevaraksha.in',     '$2a$12$placeholder.hash.value.here', 'a1000000-0000-0000-0000-000000000004', 'Radiology',       'Consulting Radiologist', '+91-9876543216', 'active'),
    ('b1000000-0000-0000-0000-000000000008', 'PHR-601',     'Karthik Iyer',       'karthik.iyer@jeevaraksha.in',    '$2a$12$placeholder.hash.value.here', 'a1000000-0000-0000-0000-000000000005', 'Pharmacy',        'Chief Pharmacist',       '+91-9876543217', 'active');

-- ===================== WARDS & BEDS =====================

INSERT INTO wards (id, name, ward_type, floor, capacity, status) VALUES
    ('c1000000-0000-0000-0000-000000000001', 'ICU-A',          'ICU',       2, 12, 'active'),
    ('c1000000-0000-0000-0000-000000000002', 'General Ward-1', 'General',   1, 30, 'active'),
    ('c1000000-0000-0000-0000-000000000003', 'Private Wing',   'Private',   3, 10, 'active'),
    ('c1000000-0000-0000-0000-000000000004', 'Isolation Ward', 'Isolation', 2,  6, 'active'),
    ('c1000000-0000-0000-0000-000000000005', 'Emergency Bay',  'Emergency', 0, 15, 'active'),
    ('c1000000-0000-0000-0000-000000000006', 'Pediatric Ward', 'Pediatric', 1, 20, 'active');

INSERT INTO beds (id, ward_id, bed_number, bed_type, status) VALUES
    ('d1000000-0000-0000-0000-000000000001', 'c1000000-0000-0000-0000-000000000001', 'ICU-A-01',  'ICU',       'Occupied'),
    ('d1000000-0000-0000-0000-000000000002', 'c1000000-0000-0000-0000-000000000001', 'ICU-A-02',  'Ventilator','Available'),
    ('d1000000-0000-0000-0000-000000000003', 'c1000000-0000-0000-0000-000000000001', 'ICU-A-03',  'ICU',       'Available'),
    ('d1000000-0000-0000-0000-000000000004', 'c1000000-0000-0000-0000-000000000002', 'GEN-1-01',  'Standard',  'Occupied'),
    ('d1000000-0000-0000-0000-000000000005', 'c1000000-0000-0000-0000-000000000002', 'GEN-1-02',  'Standard',  'Available'),
    ('d1000000-0000-0000-0000-000000000006', 'c1000000-0000-0000-0000-000000000002', 'GEN-1-03',  'Standard',  'Cleaning'),
    ('d1000000-0000-0000-0000-000000000007', 'c1000000-0000-0000-0000-000000000003', 'PVT-01',    'Standard',  'Available'),
    ('d1000000-0000-0000-0000-000000000008', 'c1000000-0000-0000-0000-000000000004', 'ISO-01',    'Isolation', 'Available');

-- ===================== SAMPLE PATIENTS =====================

INSERT INTO patients (id, uhid, name, date_of_birth, gender, blood_group, phone, address, city, state, pincode, allergies, chronic_conditions, status, registered_by) VALUES
    ('e1000000-0000-0000-0000-000000000001', 'UHID-2026-0001', 'Ramesh Gowda',      '1965-03-15', 'Male',   'O+', '+91-9988776601', '42 MG Road',           'Bengaluru', 'Karnataka', '560001', ARRAY['Penicillin'],         ARRAY['Hypertension', 'Type-2 Diabetes'], 'active', 'b1000000-0000-0000-0000-000000000005'),
    ('e1000000-0000-0000-0000-000000000002', 'UHID-2026-0002', 'Lakshmi Devi',       '1978-11-22', 'Female', 'A+', '+91-9988776602', '15 Jayanagar 4th Blk', 'Bengaluru', 'Karnataka', '560041', ARRAY[]::TEXT[],              ARRAY['Asthma'],                           'active', 'b1000000-0000-0000-0000-000000000005'),
    ('e1000000-0000-0000-0000-000000000003', 'UHID-2026-0003', 'Mohammed Faisal',    '1990-07-08', 'Male',   'B+', '+91-9988776603', '8 Commercial Street',  'Bengaluru', 'Karnataka', '560001', ARRAY['Sulfa drugs'],        ARRAY[]::TEXT[],                           'active', 'b1000000-0000-0000-0000-000000000005'),
    ('e1000000-0000-0000-0000-000000000004', 'UHID-2026-0004', 'Kavitha Rao',        '2001-01-30', 'Female', 'AB-','+91-9988776604', '22 Indiranagar',       'Bengaluru', 'Karnataka', '560038', ARRAY[]::TEXT[],              ARRAY[]::TEXT[],                           'active', 'b1000000-0000-0000-0000-000000000005'),
    ('e1000000-0000-0000-0000-000000000005', 'UHID-2026-0005', 'Subramaniam Pillai', '1955-09-12', 'Male',   'O-', '+91-9988776605', '3 Koramangala Layout', 'Bengaluru', 'Karnataka', '560034', ARRAY['Aspirin', 'Iodine'],  ARRAY['CAD', 'CKD Stage-3'],               'active', 'b1000000-0000-0000-0000-000000000005');

-- ===================== SAMPLE PHARMACY STOCK =====================

INSERT INTO pharmacy_stock (drug_name, generic_name, batch_no, manufacturer, quantity, unit_price, expiry_date, reorder_level, storage_location) VALUES
    ('Paracetamol 500mg',   'Acetaminophen',   'BT-2026-001', 'Cipla Ltd',        5000, 2.50,  '2027-06-30', 500, 'Shelf-A1'),
    ('Amoxicillin 500mg',   'Amoxicillin',     'BT-2026-002', 'Sun Pharma',       3000, 8.00,  '2027-03-15', 300, 'Shelf-A2'),
    ('Metformin 500mg',     'Metformin HCl',   'BT-2026-003', 'USV Private Ltd',  4000, 3.50,  '2027-09-30', 400, 'Shelf-B1'),
    ('Atorvastatin 10mg',   'Atorvastatin',    'BT-2026-004', 'Ranbaxy Labs',     2500, 6.00,  '2027-12-31', 250, 'Shelf-B2'),
    ('Omeprazole 20mg',     'Omeprazole',      'BT-2026-005', 'Dr. Reddys',       3500, 4.00,  '2027-08-31', 350, 'Shelf-C1'),
    ('Ceftriaxone 1g Inj',  'Ceftriaxone',     'BT-2026-006', 'Lupin Ltd',         800, 85.00, '2027-04-30', 100, 'Cold-A1'),
    ('Normal Saline 500ml', 'Sodium Chloride', 'BT-2026-007', 'B. Braun',         2000, 35.00, '2028-01-31', 200, 'Store-Room-1');
