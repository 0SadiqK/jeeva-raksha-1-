
import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';
import {
  AccessLevel,
  AuditLogEntry,
  ModulePermissionMap,
  OverrideState,
  ViewType,
  OVERRIDE_DURATION_SECONDS
} from '../types.ts';

// ==================== Constants ====================

export const ROLES = {
  VIEW: 'VIEW' as AccessLevel,
  EDIT: 'EDIT' as AccessLevel,
  ADMIN: 'ADMIN' as AccessLevel,
} as const;

export type Role = AccessLevel;

const ROLE_HIERARCHY: AccessLevel[] = ['VIEW', 'EDIT', 'ADMIN'];

/** Per-module minimum access level required */
const MODULE_PERMISSIONS: ModulePermissionMap = {
  HOME: 'VIEW',
  DASHBOARD: 'VIEW',
  OPD: 'VIEW',
  IPD: 'VIEW',
  EMERGENCY: 'VIEW',
  OT: 'EDIT',
  EMR: 'VIEW',
  ROUNDS: 'EDIT',
  PORTAL: 'VIEW',
  PATIENTS: 'VIEW',
  LABORATORY: 'VIEW',
  RADIOLOGY: 'VIEW',
  PHARMACY: 'EDIT',
  INVENTORY: 'EDIT',
  BILLING: 'ADMIN',
  INSURANCE: 'ADMIN',
  HR: 'ADMIN',
  BEDS: 'EDIT',
  ANALYTICS: 'ADMIN',
  QUALITY: 'ADMIN',
  INTEGRATIONS_DEVICES: 'ADMIN',
  INTEGRATIONS_GOVT: 'ADMIN',
};

// ==================== Types ====================

interface User {
  name: string;
  role: AccessLevel;
  id: string;
}

interface AuthContextType {
  user: User;
  currentPermissions: AccessLevel;
  overrideState: OverrideState;
  remainingOverrideTime: number;
  auditLog: AuditLogEntry[];
  triggerEmergencyOverride: (reason: string) => void;
  deactivateOverride: () => void;
  hasPermission: (requiredRole: AccessLevel) => boolean;
  hasModuleAccess: (module: ViewType) => boolean;
  canPerformAction: (module: ViewType, requiredLevel: AccessLevel) => boolean;
  getModuleRequiredLevel: (module: ViewType) => AccessLevel;
  changeRole: (newRole: AccessLevel) => void;
  logModuleAccess: (module: ViewType) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// ==================== Helpers ====================

const generateId = () => `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
const SESSION_ID = generateId();

function getRoleIndex(role: AccessLevel): number {
  return ROLE_HIERARCHY.indexOf(role);
}

// ==================== Provider ====================

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User>({
    name: 'Dr. Aditi Sharma',
    role: ROLES.EDIT,
    id: 'DOC-SH-402',
  });

  const [overrideState, setOverrideState] = useState<OverrideState>({
    active: false,
    reason: '',
    activatedAt: null,
    expiresAt: null,
    activatedBy: null,
  });

  const [remainingOverrideTime, setRemainingOverrideTime] = useState(0);
  const [auditLog, setAuditLog] = useState<AuditLogEntry[]>([]);
  const overrideTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentPermissions: AccessLevel = overrideState.active ? ROLES.ADMIN : user.role;

  // --- Audit Logger ---
  const addAuditEntry = useCallback((
    entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'userId' | 'userName' | 'sessionId'>
  ) => {
    const fullEntry: AuditLogEntry = {
      id: generateId(),
      timestamp: new Date().toISOString(),
      userId: user.id,
      userName: user.name,
      sessionId: SESSION_ID,
      ...entry,
    };
    setAuditLog(prev => [fullEntry, ...prev]);
    console.log(`[RBAC AUDIT] ${fullEntry.action}`, fullEntry);
  }, [user.id, user.name]);

  // --- Override Auto-Expiry Timer ---
  useEffect(() => {
    if (overrideState.active && overrideState.expiresAt) {
      const expiresAt = new Date(overrideState.expiresAt).getTime();

      const tick = () => {
        const now = Date.now();
        const remaining = Math.max(0, Math.ceil((expiresAt - now) / 1000));
        setRemainingOverrideTime(remaining);

        if (remaining <= 0) {
          // Auto-expire
          const activatedAt = overrideState.activatedAt ? new Date(overrideState.activatedAt).getTime() : now;
          const durationSeconds = Math.round((now - activatedAt) / 1000);

          setOverrideState({
            active: false,
            reason: '',
            activatedAt: null,
            expiresAt: null,
            activatedBy: null,
          });
          setRemainingOverrideTime(0);

          addAuditEntry({
            action: 'OVERRIDE_EXPIRED',
            reason: 'Auto-expired after 15 minutes',
            durationSeconds,
          });
        }
      };

      tick(); // run immediately
      overrideTimerRef.current = setInterval(tick, 1000);

      return () => {
        if (overrideTimerRef.current) clearInterval(overrideTimerRef.current);
      };
    } else {
      setRemainingOverrideTime(0);
    }
  }, [overrideState.active, overrideState.expiresAt, overrideState.activatedAt, addAuditEntry]);

  // --- Emergency Override ---
  const triggerEmergencyOverride = useCallback((reason: string) => {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + OVERRIDE_DURATION_SECONDS * 1000);

    setOverrideState({
      active: true,
      reason,
      activatedAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      activatedBy: user.id,
    });

    addAuditEntry({
      action: 'OVERRIDE_ACTIVATED',
      reason,
      previousLevel: user.role,
      newLevel: 'ADMIN',
    });
  }, [user.id, user.role, addAuditEntry]);

  const deactivateOverride = useCallback(() => {
    const activatedAt = overrideState.activatedAt ? new Date(overrideState.activatedAt).getTime() : Date.now();
    const durationSeconds = Math.round((Date.now() - activatedAt) / 1000);

    setOverrideState({
      active: false,
      reason: '',
      activatedAt: null,
      expiresAt: null,
      activatedBy: null,
    });

    addAuditEntry({
      action: 'OVERRIDE_DEACTIVATED',
      reason: 'Manual deactivation',
      newLevel: user.role,
      durationSeconds,
    });
  }, [overrideState.activatedAt, user.role, addAuditEntry]);

  // --- Permission Checks ---
  const hasPermission = useCallback((requiredRole: AccessLevel): boolean => {
    return getRoleIndex(currentPermissions) >= getRoleIndex(requiredRole);
  }, [currentPermissions]);

  const hasModuleAccess = useCallback((module: ViewType): boolean => {
    const required = MODULE_PERMISSIONS[module] || 'VIEW';
    return getRoleIndex(currentPermissions) >= getRoleIndex(required);
  }, [currentPermissions]);

  const canPerformAction = useCallback((module: ViewType, requiredLevel: AccessLevel): boolean => {
    const moduleRequired = MODULE_PERMISSIONS[module] || 'VIEW';
    const effectiveRequired = getRoleIndex(requiredLevel) > getRoleIndex(moduleRequired) ? requiredLevel : moduleRequired;
    return getRoleIndex(currentPermissions) >= getRoleIndex(effectiveRequired);
  }, [currentPermissions]);

  const getModuleRequiredLevel = useCallback((module: ViewType): AccessLevel => {
    return MODULE_PERMISSIONS[module] || 'VIEW';
  }, []);

  const logModuleAccess = useCallback((module: ViewType) => {
    addAuditEntry({
      action: 'MODULE_ACCESSED',
      module,
    });
  }, [addAuditEntry]);

  // --- Role Change ---
  const changeRole = useCallback((newRole: AccessLevel) => {
    const prevRole = user.role;
    setUser(prev => ({ ...prev, role: newRole }));
    addAuditEntry({
      action: 'ROLE_CHANGED',
      previousLevel: prevRole,
      newLevel: newRole,
    });
  }, [user.role, addAuditEntry]);

  return (
    <AuthContext.Provider value={{
      user,
      currentPermissions,
      overrideState,
      remainingOverrideTime,
      auditLog,
      triggerEmergencyOverride,
      deactivateOverride,
      hasPermission,
      hasModuleAccess,
      canPerformAction,
      getModuleRequiredLevel,
      changeRole,
      logModuleAccess,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

// ==================== ProtectedAction Component ====================

interface ProtectedActionProps {
  requiredLevel: AccessLevel;
  module?: ViewType;
  children: ReactNode;
  fallback?: ReactNode;
}

export const ProtectedAction: React.FC<ProtectedActionProps> = ({
  requiredLevel,
  module,
  children,
  fallback,
}) => {
  const { hasPermission, canPerformAction } = useAuth();

  const allowed = module
    ? canPerformAction(module, requiredLevel)
    : hasPermission(requiredLevel);

  if (allowed) return <>{children}</>;

  if (fallback) return <>{fallback}</>;

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 bg-slate-100 text-slate-400 rounded-lg text-[9px] font-black uppercase tracking-widest">
      🔒 Insufficient Permissions
    </span>
  );
};

// ==================== Hook ====================

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
