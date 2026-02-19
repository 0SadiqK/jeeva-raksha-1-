import React from 'react';
import { ViewType } from '../types.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth } from '../context/AuthContext.tsx';
import {
  LayoutDashboard, Stethoscope, Bed, Activity, Scissors,
  FileText, ClipboardList, Globe, Users, TestTube,
  ScanLine, Pill, Package, CreditCard, Shield,
  UserCog, BedDouble, BarChart3, CheckCircle2,
  Cpu, Landmark, Home, Lock
} from 'lucide-react';

interface SidebarProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

interface NavCategory {
  titleKey: string;
  items: { id: ViewType; icon: React.ReactNode }[];
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  const { t } = useLanguage();
  const { hasModuleAccess, getModuleRequiredLevel, logModuleAccess } = useAuth();

  const categories: NavCategory[] = [
    {
      titleKey: 'categories.CLINICAL_OPS',
      items: [
        { id: 'DASHBOARD', icon: <LayoutDashboard size={18} /> },
        { id: 'OPD', icon: <Stethoscope size={18} /> },
        { id: 'IPD', icon: <Bed size={18} /> },
        { id: 'EMERGENCY', icon: <Activity size={18} /> },
        { id: 'OT', icon: <Scissors size={18} /> },
      ]
    },
    {
      titleKey: 'categories.PATIENT_CARE',
      items: [
        { id: 'EMR', icon: <FileText size={18} /> },
        { id: 'ROUNDS', icon: <ClipboardList size={18} /> },
        { id: 'PORTAL', icon: <Globe size={18} /> },
        { id: 'PATIENTS', icon: <Users size={18} /> },
      ]
    },
    {
      titleKey: 'categories.DIAGNOSTICS',
      items: [
        { id: 'LABORATORY', icon: <TestTube size={18} /> },
        { id: 'RADIOLOGY', icon: <ScanLine size={18} /> },
      ]
    },
    {
      titleKey: 'categories.PHARMACY_SUPPLIES',
      items: [
        { id: 'PHARMACY', icon: <Pill size={18} /> },
        { id: 'INVENTORY', icon: <Package size={18} /> },
      ]
    },
    {
      titleKey: 'categories.FINANCIAL_OPS',
      items: [
        { id: 'BILLING', icon: <CreditCard size={18} /> },
        { id: 'INSURANCE', icon: <Shield size={18} /> },
      ]
    },
    {
      titleKey: 'categories.WORKFORCE_ADMIN',
      items: [
        { id: 'HR', icon: <UserCog size={18} /> },
        { id: 'BEDS', icon: <BedDouble size={18} /> },
      ]
    },
    {
      titleKey: 'categories.INSIGHTS_GOV',
      items: [
        { id: 'ANALYTICS', icon: <BarChart3 size={18} /> },
        { id: 'QUALITY', icon: <CheckCircle2 size={18} /> },
      ]
    },
    {
      titleKey: 'categories.INTEGRATIONS',
      items: [
        { id: 'INTEGRATIONS_DEVICES', icon: <Cpu size={18} /> },
        { id: 'INTEGRATIONS_GOVT', icon: <Landmark size={18} /> },
      ]
    }
  ];

  const handleNavClick = (id: ViewType) => {
    if (hasModuleAccess(id)) {
      logModuleAccess(id);
      setActiveView(id);
    }
  };

  return (
    <aside className="w-64 bg-hospital-card text-slate-600 flex flex-col border-r border-hospital-border h-screen transition-all duration-300 z-50 shadow-sm">
      <div
        onClick={() => setActiveView('HOME')}
        className="h-20 flex items-center gap-4 px-6 border-b border-hospital-border cursor-pointer hover:bg-hospital-bg/50 transition-all bg-medical-gradient"
      >
        <div className="h-10 w-10 bg-white shadow-xl rounded-xl flex items-center justify-center shrink-0 text-primary">
          <Activity size={24} />
        </div>
        <div className="overflow-hidden">
          <h2 className="text-white font-black text-sm tracking-tight leading-none truncate">{t('brand')}</h2>
          <p className="text-[10px] font-bold text-white/70 mt-1 font-kannada whitespace-nowrap tracking-wide uppercase">Unified Health System</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pt-4 pb-10">
        {categories.map((cat, idx) => (
          <div key={idx} className="mb-6">
            <h3 className="px-6 mb-2 text-[10px] font-bold text-text-muted uppercase tracking-wider">
              {t(cat.titleKey)}
            </h3>
            <div className="px-3 space-y-0.5">
              {cat.items.map((item) => {
                const label = t('', item.id);
                const accessible = hasModuleAccess(item.id);
                const requiredLevel = getModuleRequiredLevel(item.id);

                return (
                  <button
                    key={item.id}
                    onClick={() => handleNavClick(item.id)}
                    disabled={!accessible}
                    title={!accessible ? `Requires ${requiredLevel} access` : undefined}
                    className={`w-full group relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${!accessible
                      ? 'opacity-30 cursor-not-allowed'
                      : activeView === item.id
                        ? 'bg-medical-gradient text-white font-black shadow-lg shadow-primary/30 scale-[1.02]'
                        : 'hover:bg-primary/5 text-text-body hover:text-primary'
                      }`}
                  >
                    <span className={`${accessible ? (activeView === item.id ? 'text-white' : 'text-primary group-hover:scale-110 transition-transform') : 'grayscale'}`}>{item.icon}</span>
                    <span className="text-[11px] font-black uppercase tracking-wider whitespace-nowrap overflow-hidden flex-1 text-left">
                      {label}
                    </span>
                    {!accessible && (
                      <Lock size={12} className="opacity-40" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </aside>
  );
};

export default Sidebar;
