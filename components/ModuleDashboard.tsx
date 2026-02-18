
import React from 'react';
import { ViewType } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ModuleDashboardProps {
  view: ViewType;
}

const ModuleDashboard: React.FC<ModuleDashboardProps> = ({ view }) => {
  const { t } = useLanguage();
  const label = t('', view);

  const getStats = (v: ViewType) => {
    switch (v) {
      case 'PHARMACY': return [
        { label: 'Orders Pending', value: '42', color: 'text-primary' },
        { label: 'Critical Stock', value: '08', color: 'text-danger' },
        { label: 'Expiry Alerts', value: '12', color: 'text-warning' },
        { label: 'Dispensed Today', value: '312', color: 'text-success' },
      ];
      case 'EMR': return [
        { label: 'Total Records', value: '12,482', color: 'text-slate-900' },
        { label: 'Active Files', value: '1,204', color: 'text-primary' },
        { label: 'Digitization', value: '98%', color: 'text-success' },
        { label: 'Storage Used', value: '4.2 TB', color: 'text-slate-400' },
      ];
      case 'INSURANCE': return [
        { label: 'Pre-Auth Reqd', value: '14', color: 'text-warning' },
        { label: 'Claims Paid', value: '₹4.2L', color: 'text-success' },
        { label: 'Denied Rate', value: '1.2%', color: 'text-danger' },
        { label: 'Active TPAs', value: '18', color: 'text-primary' },
      ];
      case 'HR': return [
        { label: 'On Shift', value: '84', color: 'text-success' },
        { label: 'Leaves Pending', value: '05', color: 'text-warning' },
        { label: 'Overtime Hrs', value: '112', color: 'text-primary' },
        { label: 'Active Docs', value: '12', color: 'text-slate-900' },
      ];
      default: return [
        { label: 'Module Health', value: 'Optimal', color: 'text-success' },
        { label: 'Active Sync', value: 'Live', color: 'text-primary' },
        { label: 'Uptime', value: '99.9%', color: 'text-success' },
        { label: 'Data Latency', value: '0.4ms', color: 'text-slate-400' },
      ];
    }
  };

  const stats = getStats(view);

  return (
    <div className="space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="flex justify-between items-end">
        <div>
          <h2 className={`text-3xl font-black text-slate-900 tracking-tight ${label.match(/[\u0C80-\u0CFF]/) ? 'font-kannada' : ''}`}>
            {label}
          </h2>
          <p className="text-sm text-slate-500 font-medium">Professional operational control for {label}.</p>
        </div>
        <div className="flex gap-4">
          <button className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 shadow-sm transition-all">Configure</button>
          <button className="px-6 py-3 bg-primary text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-700 transition-all">Action Center</button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map(stat => (
          <div key={stat.label} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">{stat.label}</p>
            <h3 className={`text-3xl font-black ${stat.color} tracking-tighter`}>{stat.value}</h3>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-[4rem] border border-slate-100 shadow-sm overflow-hidden p-12 flex flex-col items-center justify-center text-center space-y-6">
        <div className="w-20 h-20 bg-hospital-bg rounded-[2rem] flex items-center justify-center text-4xl shadow-inner">⚙️</div>
        <div className="max-w-md">
           <h4 className="text-xl font-black text-slate-900 mb-2">Module Integration Pending</h4>
           <p className="text-sm text-slate-500 font-medium leading-relaxed italic">
             This specific component is being synchronized with the JEEVA RAKSHA central database. Your hospital's custom workflows will appear here once the background indexing completes.
           </p>
        </div>
      </div>

      <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
           <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl">🛡️</div>
           <div className="flex-1 space-y-2">
              <h4 className="text-lg font-black text-white">Digital Compliance Active</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-kannada">
                “ಪಾರದರ್ಶಕತೆ — ಉತ್ತಮ ಆಡಳಿತ” — All actions in this module are cryptographically signed and stored in the secure hospital ledger.
              </p>
           </div>
           <div className="text-right">
             <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Protocol Version</p>
             <p className="text-lg font-black text-primary">v4.2.10-Live</p>
           </div>
        </div>
      </div>
    </div>
  );
};

export default ModuleDashboard;
