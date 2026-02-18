
import React, { createContext, useContext, useState } from 'react';
import { Language, translations } from '../translations.ts';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, moduleKey?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('jeeva_raksha_lang');
    return (saved as Language) || 'EN';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('jeeva_raksha_lang', lang);
  };

  const t = (key: string, moduleKey?: string): string => {
    if (moduleKey && (translations.modules as any)[moduleKey]) {
      return (translations.modules as any)[moduleKey][language];
    }
    const path = key.split('.');
    let current: any = translations;
    for (const segment of path) {
      if (current && current[segment]) {
        current = current[segment];
      } else {
        return key;
      }
    }
    return current[language] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
