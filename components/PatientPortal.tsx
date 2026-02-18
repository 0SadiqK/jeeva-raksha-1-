
import React from 'react';
import { useLanguage } from '../context/LanguageContext.tsx';

const PatientPortal: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="max-w-[1200px] mx-auto animate-in space-y-10">
      <div className="bg-primary p-12 rounded-[4rem] text-white relative overflow-hidden shadow-2xl">
         <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />
         <div className="relative z-10 space-y-4">
            <h2 className="text-4xl font-black tracking-tight">Namaste, Patient</h2>
            <p className="text-white/80 font-medium max-w-xl">Welcome to your health dashboard. Access your records, book new visits, and communicate with your care team in one place.</p>
         </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
         <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="w-14 h-14 bg-primary/5 rounded-2xl flex items-center justify-center text-3xl mb-6">📅</div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Book Appointment</h3>
            <p className="text-xs text-slate-500 font-medium mb-6">Schedule your next visit with your preferred specialist.</p>
            <button className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Start Booking</button>
         </div>
         <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="w-14 h-14 bg-success/5 rounded-2xl flex items-center justify-center text-3xl mb-6">📄</div>
            <h3 className="text-xl font-black text-slate-900 mb-2">View Reports</h3>
            <p className="text-xs text-slate-500 font-medium mb-6">Download and view your latest lab results and imaging.</p>
            <button className="w-full py-3 bg-success text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Access Vault</button>
         </div>
         <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group">
            <div className="w-14 h-14 bg-warning/5 rounded-2xl flex items-center justify-center text-3xl mb-6">💊</div>
            <h3 className="text-xl font-black text-slate-900 mb-2">Prescriptions</h3>
            <p className="text-xs text-slate-500 font-medium mb-6">Renew or check dosage for your active medications.</p>
            <button className="w-full py-3 bg-warning text-slate-900 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all">Refill Meds</button>
         </div>
      </div>
    </div>
  );
};

export default PatientPortal;
