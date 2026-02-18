
import React, { useState, useEffect } from 'react';
import { ViewType } from '../types.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import LanguageToggle from './LanguageToggle.tsx';
import api from '../api';

interface HomeProps {
  onNavigate: (view: ViewType) => void;
}

const Home: React.FC<HomeProps> = ({ onNavigate }) => {
  const { t, language } = useLanguage();
  const { user, currentPermissions } = useAuth();

  // ─── State ──────────────────────────────────────────────────
  const [currentTime, setCurrentTime] = useState(new Date());
  const [stats, setStats] = useState<any>(null);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [systemHealth, setSystemHealth] = useState<'ok' | 'degraded' | 'offline'>('ok');
  const [alertIndex, setAlertIndex] = useState(0);

  // ─── Clock ──────────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // ─── Alert ticker rotation ─────────────────────────────────
  useEffect(() => {
    if (alerts.length <= 1) return;
    const ticker = setInterval(() => setAlertIndex(i => (i + 1) % alerts.length), 4000);
    return () => clearInterval(ticker);
  }, [alerts.length]);

  // ─── Fetch all data ────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const [dashData, apptData, auditData, healthData] = await Promise.all([
          api.getDashboardStats().catch(() => null),
          api.getAppointments().catch(() => []),
          api.getAuditLogs().catch(() => ({ logs: [] })),
          api.healthCheck().catch(() => ({ status: 'offline' })),
        ]);

        if (dashData) setStats(dashData);
        else setStats({
          patientsToday: 1482, totalPatients: 8421, opdWaiting: 42,
          bedOccupancy: 84, totalBeds: 150, occupiedBeds: 126, availableBeds: 24,
          emergencyCases: 8, revenue: 428500,
        });

        setAppointments(Array.isArray(apptData) ? apptData.slice(0, 5) : []);

        const logAlerts = (auditData?.logs || []).slice(0, 5).map((a: any, i: number) => ({
          id: a.id || i,
          title: `${a.action || 'System Event'}: ${a.entity_type || 'System'}`,
          time: a.created_at ? new Date(a.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '',
          level: a.action?.includes('CRITICAL') ? 'Critical' : 'Info',
        }));
        setAlerts(logAlerts.length > 0 ? logAlerts : [
          { id: 1, title: 'Code Blue: Block C, Ward 4', time: '2 mins ago', level: 'Critical' },
          { id: 2, title: 'Critical Lab: Potassium — PAT-902', time: '14 mins ago', level: 'High' },
          { id: 3, title: 'OT-2 Delay: Anesthesia Prep', time: '22 mins ago', level: 'Warning' },
        ]);

        setSystemHealth(healthData?.status === 'ok' ? 'ok' : 'degraded');
      } catch {
        setSystemHealth('offline');
      }
    };
    load();
    const interval = setInterval(load, 30000);
    return () => clearInterval(interval);
  }, []);

  // ─── Helpers ────────────────────────────────────────────────
  const greet = () => {
    const h = currentTime.getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  const roleBadge = (level: string) => {
    switch (level) {
      case 'ADMIN': return { bg: 'bg-primary/10 text-primary border-primary/20', label: 'Admin' };
      case 'EDIT': return { bg: 'bg-success/10 text-success border-success/20', label: 'Clinical Staff' };
      default: return { bg: 'bg-slate-100 text-slate-500 border-slate-200', label: 'View Only' };
    }
  };
  const badge = roleBadge(currentPermissions);

  const departments = [
    { name: 'OPD', icon: '🏥', view: 'OPD' as ViewType, status: 'online' },
    { name: 'Emergency', icon: '🚨', view: 'EMERGENCY' as ViewType, status: 'online' },
    { name: 'Laboratory', icon: '🧪', view: 'LABORATORY' as ViewType, status: 'online' },
    { name: 'Radiology', icon: '🩻', view: 'RADIOLOGY' as ViewType, status: 'online' },
    { name: 'Pharmacy', icon: '💊', view: 'PHARMACY' as ViewType, status: 'online' },
    { name: 'Operation Theatre', icon: '🔬', view: 'OT' as ViewType, status: 'online' },
  ];

  const quickActions = [
    { label: 'Register Patient', icon: '👤', view: 'PATIENTS' as ViewType, minLevel: 'EDIT' },
    { label: 'OPD Check-in', icon: '🏥', view: 'OPD' as ViewType, minLevel: 'VIEW' },
    { label: 'Emergency Admit', icon: '🚑', view: 'EMERGENCY' as ViewType, minLevel: 'VIEW' },
    { label: 'Order Lab', icon: '🧪', view: 'LABORATORY' as ViewType, minLevel: 'EDIT' },
    { label: 'Admit Patient', icon: '🛌', view: 'BEDS' as ViewType, minLevel: 'EDIT' },
    { label: 'Billing & Payments', icon: '💰', view: 'BILLING' as ViewType, minLevel: 'ADMIN' },
    { label: 'Doctor Rounds', icon: '🖋️', view: 'ROUNDS' as ViewType, minLevel: 'EDIT' },
    { label: 'View Reports', icon: '📊', view: 'ANALYTICS' as ViewType, minLevel: 'VIEW' },
  ];

  const levelRank = (l: string) => l === 'ADMIN' ? 3 : l === 'EDIT' ? 2 : 1;
  const filteredActions = quickActions.filter(a => levelRank(currentPermissions) >= levelRank(a.minLevel));

  // ─── AI Insights (mock enriched) ───────────────────────────
  const aiInsights = [
    { patient: 'Vikram M.', risk: 'High', detail: 'Sepsis probability 84% — immediate review', icon: '🧬', pct: 84, color: 'danger' },
    { patient: 'Anjali S.', risk: 'Moderate', detail: 'Readmission risk 42% — flagged by AI', icon: '📈', pct: 42, color: 'warning' },
    { patient: 'Rajesh K.', risk: 'Low', detail: 'Discharge readiness 91% — clear for release', icon: '✅', pct: 91, color: 'success' },
  ];

  // ═══════════════════════════════════════════════════════════
  //  R E N D E R
  // ═══════════════════════════════════════════════════════════
  return (
    <div className="min-h-screen bg-hospital-bg font-sans selection:bg-primary/20">

      {/* ── HEADER ────────────────────────────────────────── */}
      <header className="px-6 lg:px-10 py-4 flex items-center justify-between bg-white border-b border-slate-100 sticky top-0 z-50 shadow-sm backdrop-blur-xl bg-white/95">
        <div className="flex items-center gap-4">
          <div className="h-11 w-11 bg-white rounded-xl flex items-center justify-center shadow-md border border-slate-50">
            <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="#1E88E5" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M7 12H9L10.5 8L13.5 16L15 12H17" stroke="#2E7D32" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tighter leading-none">{t('brand')}</h1>
            <p className="text-[8px] font-black text-success uppercase tracking-[0.25em] mt-0.5 font-kannada">ಜೀವರಕ್ಷ</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Live Clock */}
          <div className="hidden md:block text-right mr-2">
            <p className="text-lg font-black text-slate-900 tabular-nums tracking-tight leading-none">
              {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </p>
            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
              {currentTime.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
            </p>
          </div>

          {/* Role Badge */}
          <div className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest ${badge.bg}`}>
            <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
            {badge.label}
          </div>

          {/* System Health */}
          <div className={`hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-xl border text-[9px] font-black uppercase tracking-widest ${systemHealth === 'ok' ? 'bg-success/5 text-success border-success/10' :
              systemHealth === 'degraded' ? 'bg-warning/5 text-warning border-warning/10' :
                'bg-danger/5 text-danger border-danger/10'
            }`}>
            <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${systemHealth === 'ok' ? 'bg-success' : systemHealth === 'degraded' ? 'bg-warning' : 'bg-danger'
              }`} />
            {systemHealth === 'ok' ? 'All Systems Live' : systemHealth === 'degraded' ? 'Demo Mode' : 'Offline'}
          </div>

          <LanguageToggle />

          <button
            onClick={() => onNavigate('DASHBOARD')}
            className="px-5 py-2.5 bg-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-primary/20 active:scale-95"
          >
            Command Center →
          </button>
        </div>
      </header>

      <main className="max-w-[1600px] mx-auto px-6 lg:px-10 py-8 space-y-8 animate-in fade-in slide-in-from-bottom-6 duration-700">

        {/* ── CRITICAL ALERTS TICKER ─────────────────────── */}
        {alerts.length > 0 && (
          <div className={`relative overflow-hidden rounded-2xl p-4 px-6 flex items-center gap-4 border transition-all duration-500 ${alerts[alertIndex]?.level === 'Critical'
              ? 'bg-danger/5 border-danger/20'
              : alerts[alertIndex]?.level === 'High'
                ? 'bg-amber-50 border-amber-200'
                : 'bg-primary/5 border-primary/10'
            }`}>
            <div className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm ${alerts[alertIndex]?.level === 'Critical' ? 'bg-danger text-white animate-pulse' : 'bg-white text-slate-500 border border-slate-100'
              }`}>
              {alerts[alertIndex]?.level === 'Critical' ? '🚨' : '🔔'}
            </div>
            <div className="flex-1 flex items-center justify-between gap-4">
              <div className="transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
                <p className="text-sm font-black text-slate-800 leading-tight">{alerts[alertIndex]?.title}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{alerts[alertIndex]?.time}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[8px] font-black text-slate-300 uppercase tracking-widest">
                  {alertIndex + 1}/{alerts.length}
                </span>
                <button
                  onClick={() => setAlertIndex(i => (i + 1) % alerts.length)}
                  className="w-7 h-7 rounded-lg bg-white border border-slate-100 flex items-center justify-center text-xs text-slate-400 hover:text-primary transition-colors"
                >→</button>
              </div>
            </div>
          </div>
        )}

        {/* ── GREETING + QUICK SUMMARY ───────────────────── */}
        <div className="flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">
              {greet()}, <span className="text-primary">{user?.name?.split(' ')[0] || 'Doctor'}</span>
            </h2>
            <p className="text-sm font-medium text-slate-500 mt-1 font-kannada">
              "ಜೀವ ರಕ್ಷಣೆ — ಪ್ರತಿ ಕ್ಷಣ ಮುಖ್ಯ" — Every moment counts in saving lives.
            </p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => onNavigate('PATIENTS')} className="px-5 py-2.5 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-primary hover:border-primary/20 transition-all shadow-sm">
              + Register Patient
            </button>
            <button onClick={() => onNavigate('EMERGENCY')} className="px-5 py-2.5 bg-danger text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-danger/20 hover:bg-red-700 transition-all active:scale-95">
              🚑 Emergency
            </button>
          </div>
        </div>

        {/* ── KPI CARDS ──────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { label: 'Patients Today', value: stats?.patientsToday?.toLocaleString() || '—', icon: '👥', trend: '+12%', trendUp: true },
            { label: 'OPD Queue', value: stats?.opdWaiting || '—', icon: '⏳', trend: '-8%', trendUp: false },
            { label: 'Bed Occupancy', value: `${stats?.bedOccupancy || 0}%`, icon: '🛌', trend: `${stats?.occupiedBeds || 0} beds`, trendUp: true },
            { label: 'ER Active', value: String(stats?.emergencyCases || 0).padStart(2, '0'), icon: '🚨', trend: 'Live', trendUp: true },
            { label: 'Active OTs', value: '03', icon: '🔬', trend: '2 scheduled', trendUp: true },
            { label: 'Revenue Today', value: `₹${((stats?.revenue || 428500) / 1000).toFixed(0)}K`, icon: '💰', trend: '+15%', trendUp: true },
          ].map(kpi => (
            <div key={kpi.label} className="bg-white p-5 rounded-[1.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
              <div className="flex justify-between items-start mb-4">
                <div className="w-10 h-10 rounded-xl bg-hospital-bg flex items-center justify-center text-xl group-hover:scale-110 transition-transform shadow-inner">
                  {kpi.icon}
                </div>
                {kpi.trend && (
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${kpi.trendUp ? 'bg-success/5 text-success border-success/10' : 'bg-danger/5 text-danger border-danger/10'
                    }`}>{kpi.trend}</span>
                )}
              </div>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.15em] mb-1">{kpi.label}</p>
              <p className="text-2xl font-black text-slate-900 tracking-tighter">{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* ── MAIN GRID: Schedule + AI Insights ──────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Today's Schedule */}
          <div className="lg:col-span-5 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-8 pb-6 border-b border-slate-50 flex justify-between items-center">
              <div>
                <h3 className="text-lg font-black text-slate-900 tracking-tight">Today's Schedule</h3>
                <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Upcoming appointments & rounds</p>
              </div>
              <button onClick={() => onNavigate('OPD')} className="text-[9px] font-black text-primary uppercase tracking-widest hover:underline">View All →</button>
            </div>
            <div className="divide-y divide-slate-50/80">
              {(appointments.length > 0 ? appointments : [
                { id: 1, patient_name: 'Vikram Mehta', doctor_name: 'Dr. Sharma', appointment_time: '09:30 AM', status: 'confirmed', type: 'Follow-up' },
                { id: 2, patient_name: 'Lakshmi Devi', doctor_name: 'Dr. Das', appointment_time: '10:00 AM', status: 'confirmed', type: 'New' },
                { id: 3, patient_name: 'Mohammed F.', doctor_name: 'Dr. Verma', appointment_time: '10:30 AM', status: 'waiting', type: 'Walk-in' },
                { id: 4, patient_name: 'Kavitha Rao', doctor_name: 'Dr. Rao', appointment_time: '11:00 AM', status: 'confirmed', type: 'Follow-up' },
                { id: 5, patient_name: 'Subramaniam P.', doctor_name: 'Dr. Kapoor', appointment_time: '11:30 AM', status: 'confirmed', type: 'Regular' },
              ]).map((appt: any, idx: number) => (
                <div key={appt.id || idx} className="px-8 py-5 flex items-center gap-5 hover:bg-hospital-bg/50 transition-colors cursor-pointer group">
                  <div className="w-10 h-10 rounded-xl bg-hospital-bg flex items-center justify-center text-sm font-black text-primary border border-slate-100 shrink-0">
                    {(appt.appointment_time || appt.time || '').replace(/ (AM|PM)/, '').slice(0, 5) || `${9 + idx}:00`}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-slate-800 truncate">{appt.patient_name || appt.patientName || 'Patient'}</p>
                    <p className="text-[10px] font-bold text-slate-400 truncate">{appt.doctor_name || appt.doctorName || ''} • {appt.type || 'General'}</p>
                  </div>
                  <div className={`shrink-0 px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border ${appt.status === 'waiting' ? 'bg-warning/10 text-warning border-warning/20' :
                      appt.status === 'confirmed' ? 'bg-success/10 text-success border-success/20' :
                        'bg-slate-50 text-slate-400 border-slate-100'
                    }`}>
                    {appt.status || 'scheduled'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* AI Insights + Department Status */}
          <div className="lg:col-span-7 space-y-8">

            {/* AI Risk Engine */}
            <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
              <div className="absolute top-0 right-0 w-48 h-48 bg-accent/15 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-primary/10 rounded-full blur-[60px] translate-y-1/3 -translate-x-1/4" />
              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center text-xl">✨</div>
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">AI Insight Engine</p>
                      <h3 className="text-base font-black text-white mt-1">Clinical Risk Monitor</h3>
                    </div>
                  </div>
                  <span className="text-[8px] font-black text-accent uppercase tracking-widest bg-accent/10 border border-accent/20 px-3 py-1 rounded-lg">Live Analysis</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {aiInsights.map((insight, idx) => (
                    <div key={idx} className="p-4 bg-white/5 border border-white/5 rounded-2xl hover:bg-white/10 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-lg">{insight.icon}</span>
                        <span className={`text-[8px] font-black px-2 py-0.5 rounded-full border ${insight.risk === 'High' ? 'bg-danger/20 text-danger border-danger/30' :
                            insight.risk === 'Moderate' ? 'bg-amber-400/20 text-amber-400 border-amber-400/30' :
                              'bg-success/20 text-success border-success/30'
                          }`}>{insight.risk}</span>
                      </div>
                      <p className="text-sm font-black text-white mb-1">{insight.patient}</p>
                      <p className="text-[10px] text-slate-400 font-medium leading-relaxed mb-3">{insight.detail}</p>
                      <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div className={`h-full rounded-full transition-all duration-1000 ${insight.color === 'danger' ? 'bg-danger' : insight.color === 'warning' ? 'bg-amber-400' : 'bg-success'
                          }`} style={{ width: `${insight.pct}%` }} />
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-3 bg-accent/10 border border-accent/20 rounded-xl">
                  <p className="text-[10px] italic text-accent font-kannada leading-relaxed text-center">
                    "ಡೇಟಾದಿಂದ ನಿರ್ಣಯಕ್ಕೆ — ಪ್ರತಿ ಜೀವ ಅಮೂಲ್ಯ" — Data-driven decisions. Every life is precious.
                  </p>
                </div>
              </div>
            </div>

            {/* Department Status Grid */}
            <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">Department Status</h3>
                  <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">Real-time operational overview</p>
                </div>
                <div className="flex items-center gap-2 text-[8px] font-black text-success uppercase tracking-widest">
                  <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" /> All Online
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {departments.map(dept => (
                  <button
                    key={dept.name}
                    onClick={() => onNavigate(dept.view)}
                    className="p-5 rounded-2xl border border-slate-100 bg-hospital-bg hover:bg-white hover:shadow-lg hover:border-primary/10 transition-all group text-left active:scale-95"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-2xl group-hover:scale-110 transition-transform">{dept.icon}</span>
                      <span className="w-2 h-2 rounded-full bg-success" />
                    </div>
                    <p className="text-sm font-black text-slate-800 leading-tight">{dept.name}</p>
                    <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1 group-hover:text-primary transition-colors">Active →</p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ── QUICK ACTIONS ──────────────────────────────── */}
        <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Quick Actions</h3>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">
                Showing actions for <span className="text-primary">{badge.label}</span> role
              </p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filteredActions.map(action => (
              <button
                key={action.label}
                onClick={() => onNavigate(action.view)}
                className="p-5 rounded-2xl border border-slate-100 bg-hospital-bg hover:bg-primary/5 hover:border-primary/10 transition-all group text-left active:scale-95 flex items-center gap-4"
              >
                <div className="w-11 h-11 rounded-xl bg-white shadow-sm border border-slate-50 flex items-center justify-center text-xl group-hover:scale-110 transition-transform shrink-0">
                  {action.icon}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800 group-hover:text-primary transition-colors">{action.label}</p>
                  <p className="text-[8px] font-black text-slate-300 uppercase tracking-widest mt-0.5">Navigate →</p>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* ── FOOTER ─────────────────────────────────────── */}
        <div className="text-center py-6 space-y-2">
          <p className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em]">
            Jeeva Raksha — Unified Hospital Information System
          </p>
          <p className="text-[10px] italic text-slate-400 font-kannada">
            "ಆರೋಗ್ಯ ಸೇವೆಯಲ್ಲಿ ತಂತ್ರಜ್ಞಾನ — ಜೀವ ರಕ್ಷಣೆ" — Technology in healthcare, saving lives.
          </p>
        </div>
      </main>
    </div>
  );
};

export default Home;
