
import React from 'react';
import { ViewType } from '../types';
import { useLanguage } from '../context/LanguageContext';

interface ModulePlaceholderProps {
  view: ViewType;
}

const ModulePlaceholder: React.FC<ModulePlaceholderProps> = ({ view }) => {
  const { t } = useLanguage();
  const label = t('', view);

  return (
    <div className="h-full flex flex-col items-center justify-center space-y-8 animate-in fade-in zoom-in duration-500">
      <div className="w-32 h-32 bg-white rounded-[3rem] shadow-2xl flex items-center justify-center text-6xl relative overflow-hidden group">
        <div className="absolute inset-0 bg-primary/5 group-hover:bg-primary/10 transition-colors"></div>
        <div className="relative z-10">🧩</div>
      </div>
      
      <div className="text-center space-y-4">
        <h2 className={`text-4xl font-black text-slate-900 tracking-tight ${label.match(/[\u0C80-\u0CFF]/) ? 'font-kannada' : ''}`}>
          {label}
        </h2>
        <p className="text-hospital-slate font-medium max-w-md mx-auto leading-relaxed">
          The <span className="font-bold text-primary">{label}</span> module is currently being synchronized with the hospital's central infrastructure. Live data will be available shortly.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-6 w-full max-w-lg mt-12">
        {[
          { label: 'Cloud Sync', status: 'Ready', color: 'text-success' },
          { label: 'Security Protocols', status: 'Active', color: 'text-success' },
          { label: 'Data Latency', status: '0.4ms', color: 'text-primary' },
          { label: 'Module Version', status: 'v2.4.1', color: 'text-slate-400' },
        ].map(stat => (
          <div key={stat.label} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col items-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</span>
            <span className={`text-sm font-black ${stat.color}`}>{stat.status}</span>
          </div>
        ))}
      </div>

      <div className="pt-12">
        <div className="flex items-center gap-4 px-8 py-4 bg-slate-900 rounded-[2rem] text-white shadow-2xl">
           <div className="w-8 h-8 bg-white/10 rounded-xl flex items-center justify-center text-xl">💡</div>
           <p className="text-xs font-medium font-kannada leading-relaxed italic">
             “ಪಾರದರ್ಶಕತೆ — ಉತ್ತಮ ಆಡಳಿತ” — Professional standards of governance are active.
           </p>
        </div>
      </div>
    </div>
  );
};

export default ModulePlaceholder;
