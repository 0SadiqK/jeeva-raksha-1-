
import React from 'react';
import { ViewType } from '../types.ts';
import { useLanguage } from '../context/LanguageContext.tsx';
import { useAuth, ROLES, Role } from '../context/AuthContext.tsx';

interface SidebarProps {
  activeView: ViewType;
  setActiveView: (view: ViewType) => void;
}

interface NavCategory {
  titleKey: string;
  items: { id: ViewType; icon: string }[];
}

const Sidebar: React.FC<SidebarProps> = ({ activeView, setActiveView }) => {
  const { t } = useLanguage();
  const { hasModuleAccess, getModuleRequiredLevel, logModuleAccess } = useAuth();

  const categories: NavCategory[] = [
    {
      titleKey: 'categories.CLINICAL_OPS',
      items: [
        { id: 'DASHBOARD', icon: '📊' },
        { id: 'OPD', icon: '🏥' },
        { id: 'IPD', icon: '🛌' },
        { id: 'EMERGENCY', icon: '🚨' },
        { id: 'OT', icon: '🔪' },
      ]
    },
    {
      titleKey: 'categories.PATIENT_CARE',
      items: [
        { id: 'EMR', icon: '📁' },
        { id: 'ROUNDS', icon: '🖋️' },
        { id: 'PORTAL', icon: '🌐' },
        { id: 'PATIENTS', icon: '👥' },
      ]
    },
    {
      titleKey: 'categories.DIAGNOSTICS',
      items: [
        { id: 'LABORATORY', icon: '🔬' },
        { id: 'RADIOLOGY', icon: '🩻' },
      ]
    },
    {
      titleKey: 'categories.PHARMACY_SUPPLIES',
      items: [
        { id: 'PHARMACY', icon: '💊' },
        { id: 'INVENTORY', icon: '📦' },
      ]
    },
    {
      titleKey: 'categories.FINANCIAL_OPS',
      items: [
        { id: 'BILLING', icon: '💰' },
        { id: 'INSURANCE', icon: '📑' },
      ]
    },
    {
      titleKey: 'categories.WORKFORCE_ADMIN',
      items: [
        { id: 'HR', icon: '👥' },
        { id: 'BEDS', icon: '🛏️' },
      ]
    },
    {
      titleKey: 'categories.INSIGHTS_GOV',
      items: [
        { id: 'ANALYTICS', icon: '📉' },
        { id: 'QUALITY', icon: '✅' },
      ]
    },
    {
      titleKey: 'categories.INTEGRATIONS',
      items: [
        { id: 'INTEGRATIONS_DEVICES', icon: '🔌' },
        { id: 'INTEGRATIONS_GOVT', icon: '🏛️' },
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
    <aside className="w-64 bg-white text-slate-600 flex flex-col border-r border-slate-200 h-screen transition-all duration-300 z-50">
      <div
        onClick={() => setActiveView('HOME')}
        className="p-6 flex items-center gap-3 border-b border-slate-100 cursor-pointer hover:bg-slate-50 transition-colors"
      >
        <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center shrink-0">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M12 22C12 22 20 18 20 12V5L12 2L4 5V12C4 18 12 22 12 22Z" stroke="#1E88E5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="overflow-hidden">
          <h2 className="text-slate-900 font-black text-sm tracking-tight leading-none truncate">{t('brand')}</h2>
          <p className="text-[8px] font-bold text-success mt-1 font-kannada whitespace-nowrap uppercase tracking-widest">ಜೀವರಕ್ಷ</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pt-4 pb-10">
        {categories.map((cat, idx) => (
          <div key={idx} className="mb-6">
            <h3 className="px-6 mb-2 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
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
                    className={`w-full group relative flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all ${!accessible
                        ? 'opacity-40 cursor-not-allowed'
                        : activeView === item.id
                          ? 'bg-primary/10 text-primary font-bold shadow-inner'
                          : 'hover:bg-slate-50 text-slate-500'
                      }`}
                  >
                    <span className={`text-lg ${accessible ? 'opacity-70 group-hover:opacity-100' : 'grayscale'}`}>{item.icon}</span>
                    <span className="text-[10px] font-black uppercase tracking-widest whitespace-nowrap overflow-hidden flex-1 text-left">
                      {label}
                    </span>
                    {!accessible && (
                      <span className="text-[10px] opacity-60">🔒</span>
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
