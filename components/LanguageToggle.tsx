
import React from 'react';
import { useLanguage } from '../context/LanguageContext.tsx';

const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  return (
    <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200 shrink-0">
      <button 
        onClick={() => setLanguage('EN')}
        className={`px-3 py-1 text-[10px] font-black rounded-md transition-all ${
          language === 'EN' ? 'bg-white text-primary shadow-sm' : 'text-slate-400 hover:text-slate-600'
        }`}
      >
        EN
      </button>
      <button 
        onClick={() => setLanguage('KN')}
        className={`px-3 py-1 text-[10px] font-black rounded-md transition-all ${
          language === 'KN' ? 'bg-white text-primary shadow-sm font-kannada' : 'text-slate-400 hover:text-slate-600 font-kannada'
        }`}
      >
        ಕನ್ನಡ
      </button>
    </div>
  );
};

export default LanguageToggle;
