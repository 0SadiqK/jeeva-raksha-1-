
export interface Patient {
  id: string;
  uhid: string;
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  bloodGroup: string;
  contact: string;
  status: 'In-Patient' | 'Out-Patient' | 'Discharged' | 'Emergency';
  healthScore: number;
  lastVisit: string;
  allergies?: string[];
  conditions?: string[];
  history?: Array<{
    date: string;
    reason: string;
    doctor: string;
    type: 'OPD' | 'IPD' | 'Emergency';
  }>;
}

export type ViewType =
  | 'HOME'
  | 'DASHBOARD'
  | 'OPD'
  | 'IPD'
  | 'EMERGENCY'
  | 'OT'
  | 'EMR'
  | 'ROUNDS'
  | 'PORTAL'
  | 'PATIENTS'
  | 'LABORATORY'
  | 'RADIOLOGY'
  | 'PHARMACY'
  | 'INVENTORY'
  | 'BILLING'
  | 'INSURANCE'
  | 'HR'
  | 'BEDS'
  | 'ANALYTICS'
  | 'QUALITY'
  | 'INTEGRATIONS_DEVICES'
  | 'INTEGRATIONS_GOVT';

export interface Bed {
  id: string;
  name: string;
  type: 'ICU' | 'General' | 'Private' | 'Isolation';
  status: 'Available' | 'Occupied' | 'Cleaning';
  patientId?: string;
  patientName?: string;
}

export interface EmergencyCase {
  id: string;
  patientName: string;
  age: number;
  gender: string;
  triageLevel: 'Critical' | 'Serious' | 'Stable';
  arrivalTime: string;
  chiefComplaint: string;
  assignedDoctor?: string;
  assignedNurse?: string;
  vitals: {
    hr: number;
    bp: string;
    spo2: number;
    temp: number;
  };
  lastUpdate?: string;
}

export interface WardPatient {
  id: string;
  bed: string;
  name: string;
  age: number;
  gender: string;
  acuity: 'Low' | 'Medium' | 'High';
  seenToday: boolean;
  diagnosis?: string;
  lastSeen?: string;
  attendingDoctor?: string;
  admissionDate?: string;
  pendingOrders?: {
    labs: number;
    meds: number;
  };
  dischargeReadiness?: number;
  vitals?: {
    hr: number;
    bp: string;
    spo2: number;
  };
}

export interface RadiologyStudy {
  id: string;
  patientName: string;
  modality: 'CT' | 'MRI' | 'X-Ray' | 'USG';
  status: 'Scanning' | 'Scheduled' | 'Awaiting-Report' | 'Finalized' | 'Delayed';
  radiologist: string;
  requestedBy: string;
  isCritical: boolean;
  timeRequested: string;
  reportAvailable: boolean;
}

export interface AppointmentSlot {
  id: string;
  time: string;
  status: 'Available' | 'Booked' | 'Cancelled' | 'Blocked';
  patientName?: string;
  type?: 'Regular' | 'Follow-up' | 'Walk-in';
}

export interface Doctor {
  id: string;
  name: string;
  specialty: string;
  load: number;
  avgWaitTime: string;
  slots: AppointmentSlot[];
}

export interface Incident {
  id: string;
  type: 'Medication Error' | 'Fall' | 'Equipment Failure' | 'Clinical Complication' | 'Other';
  description: string;
  severity: 'Low' | 'Moderate' | 'High' | 'Critical';
  date: string;
  status: 'Reported' | 'Under Review' | 'Resolved';
  isAnonymous: boolean;
}

export interface RadiologyResult {
  id: string;
  patientId: string;
  patientName: string;
  modality: string;
  studyDescription: string;
  date: string;
  radiologist: string;
  report: string;
  keyFindings: string[];
  aiSummary?: string;
  imageUrls: string[];
  status: 'Finalized' | 'Draft';
}

export interface LabTestResult {
  id: string;
  patientId: string;
  patientName: string;
  testType: string;
  date: string;
  status: 'Normal' | 'Abnormal' | 'Critical';
  criticalAlert?: string;
  metrics: Array<{
    parameter: string;
    value: number | string;
    unit: string;
    range: string;
    status: 'Normal' | 'Abnormal' | 'Critical';
  }>;
  aiSummary: string;
}

export interface OTRoom {
  id: string;
  name: string;
  status: 'Available' | 'In-Use' | 'Cleaning' | 'Maintenance';
  currentSurgery?: string;
}

export interface Surgery {
  id: string;
  otId: string;
  patientName: string;
  procedure: string;
  surgeon: string;
  anesthetist: string;
  startTime: string;
  duration: string;
  status: 'In-Progress' | 'Scheduled' | 'Delayed' | 'Completed' | 'Post-Op';
  checklist: {
    consentObtained: boolean;
    siteMarked: boolean;
    anesthesiaSafetyCheck: boolean;
    pulseOxOn: boolean;
  };
}

// ==================== RBAC Types ====================

export type AccessLevel = 'VIEW' | 'EDIT' | 'ADMIN';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  action:
  | 'ROLE_CHANGED'
  | 'OVERRIDE_ACTIVATED'
  | 'OVERRIDE_DEACTIVATED'
  | 'OVERRIDE_EXPIRED'
  | 'PERMISSION_DENIED'
  | 'MODULE_ACCESSED';
  reason?: string;
  module?: ViewType;
  previousLevel?: AccessLevel;
  newLevel?: AccessLevel;
  sessionId: string;
  durationSeconds?: number;
}

export type ModulePermissionMap = Record<ViewType, AccessLevel>;

export interface OverrideState {
  active: boolean;
  reason: string;
  activatedAt: string | null;
  expiresAt: string | null;
  activatedBy: string | null;
}

export const OVERRIDE_DURATION_SECONDS = 15 * 60; // 15 minutes
