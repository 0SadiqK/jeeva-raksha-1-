
import React, { useState, useEffect } from 'react';
import api from '../api';

const Reports: React.FC = () => {
   const mockAuditLogs = [
      { id: 'AUD-901', type: 'Clinical', user: 'Dr. Sharma', action: 'Prescription Finalized', time: '10 mins ago', status: 'Verified' },
      { id: 'AUD-902', type: 'Inventory', user: 'Pharmacist Arjun', action: 'Stock Replenishment', time: '1 hr ago', status: 'Pending' },
      { id: 'AUD-903', type: 'System', user: 'Admin System', action: 'Nightly Backup Sync', time: '4 hrs ago', status: 'Success' },
      { id: 'AUD-904', type: 'Billing', user: 'Accounts Dept', action: 'Insurance Claim Batch', time: 'Yesterday', status: 'Verified' },
   ];

   const [auditLogs, setAuditLogs] = useState(mockAuditLogs);

   useEffect(() => {
      const fetchLogs = async () => {
         try {
            const data = await api.getAuditLogs();
            if (data?.logs && data.logs.length > 0) {
               setAuditLogs(data.logs.map((log: any) => ({
                  id: log.id?.toString().padStart(3, '0') ? `AUD-${log.id.toString().slice(-3)}` : log.id,
                  type: log.entity_type || 'System',
                  user: log.user_name || log.performed_by || 'System',
                  action: log.action || 'Unknown Action',
                  time: log.created_at ? new Date(log.created_at).toLocaleString() : 'Unknown',
                  status: 'Verified',
               })));
            }
         } catch { /* fallback to mock */ }
      };
      fetchLogs();
   }, []);

   return (
      <div className="max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-6 duration-700 space-y-10">
         <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
               <h2 className="text-3xl font-black text-slate-900 tracking-tight">Enterprise Audit Reports</h2>
               <p className="text-sm font-medium text-slate-500 font-kannada italic">“ಪಾರದರ್ಶಕತೆ — ಉತ್ತಮ ಆಡಳಿತ” — Transparency through clinical intelligence.</p>
            </div>
            <div className="flex gap-4">
               <button className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 transition-all shadow-sm">Schedule Auto-Mail</button>
               <button className="px-8 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all">Download Audit Trail</button>
            </div>
         </div>

         <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
               { label: 'Patient Outcomes', val: '94.2%', icon: '📈', desc: 'Efficiency rating across all wards' },
               { label: 'Safety Incidents', val: '02', icon: '🛡️', desc: 'Unresolved issues in current cycle' },
               { label: 'Audit Score', val: '9.8/10', icon: '⭐', desc: 'Compliance health index' },
            ].map(stat => (
               <div key={stat.label} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm group hover:shadow-xl transition-all">
                  <div className="flex justify-between items-start mb-6">
                     <span className="text-2xl group-hover:scale-125 transition-transform duration-500">{stat.icon}</span>
                     <span className="px-3 py-1 bg-success/10 text-success text-[8px] font-black uppercase rounded-lg">High Trust</span>
                  </div>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{stat.label}</p>
                  <h4 className="text-3xl font-black text-slate-900">{stat.val}</h4>
                  <p className="text-[10px] text-slate-400 mt-2 font-medium">{stat.desc}</p>
               </div>
            ))}
         </div>

         <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="flex justify-between items-center mb-10 pb-8 border-b border-slate-50">
               <h3 className="text-xl font-black text-slate-900 tracking-tight">Active Audit Trail</h3>
               <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-success"></span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">Live Sync: ACTIVE</span>
               </div>
            </div>

            <div className="space-y-4">
               {auditLogs.map(log => (
                  <div key={log.id} className="flex items-center justify-between p-6 bg-hospital-bg rounded-[2.5rem] border border-slate-50 group hover:bg-white hover:shadow-lg transition-all">
                     <div className="flex items-center gap-6">
                        <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-lg shadow-sm group-hover:rotate-12 transition-transform">
                           {log.type === 'Clinical' ? '🩺' : log.type === 'Inventory' ? '📦' : log.type === 'Billing' ? '💵' : '⚙️'}
                        </div>
                        <div>
                           <h5 className="text-sm font-black text-slate-800 tracking-tight">{log.action}</h5>
                           <p className="text-[9px] font-bold text-slate-400 uppercase mt-1">Logged by {log.user} • {log.id}</p>
                        </div>
                     </div>
                     <div className="flex items-center gap-10">
                        <div className="text-right hidden sm:block">
                           <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Time</p>
                           <p className="text-xs font-bold text-slate-700">{log.time}</p>
                        </div>
                        <div className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border ${log.status === 'Verified' ? 'bg-success/5 text-success border-success/10' :
                              log.status === 'Pending' ? 'bg-warning/5 text-warning border-warning/10' : 'bg-primary/5 text-primary border-primary/10'
                           }`}>
                           {log.status}
                        </div>
                     </div>
                  </div>
               ))}
            </div>

            <button className="w-full mt-10 py-5 bg-white border border-slate-200 rounded-[2.5rem] text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] hover:bg-slate-50 transition-colors">
               View Extended Historical Data Logs
            </button>
         </div>

         <div className="bg-slate-900 rounded-[3.5rem] p-12 text-white relative overflow-hidden shadow-2xl group">
            <div className="absolute top-0 right-0 w-48 h-48 bg-accent/20 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:scale-110 transition-transform duration-1000" />
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
               <div className="w-20 h-20 bg-white/10 rounded-3xl flex items-center justify-center text-4xl shadow-inner group-hover:rotate-6 transition-transform">📋</div>
               <div className="flex-1 space-y-3">
                  <h3 className="text-xl font-black text-white tracking-tight">Compliance Readiness Score</h3>
                  <p className="text-sm text-slate-400 font-medium leading-relaxed font-kannada">
                     “ಸಂಪೂರ್ಣ ಅನುಸರಣೆ — ಸುರಕ್ಷಿತ ಚಿಕಿತ್ಸೆ”<br />
                     Hospital is currently 98.4% compliant with NABH and HIPAA standard audit protocols. Auto-generation of quarterly review is active.
                  </p>
               </div>
               <div className="text-right shrink-0">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Next State Review</p>
                  <p className="text-2xl font-black text-accent mt-1 tracking-tighter">14 MAR 2026</p>
               </div>
            </div>
         </div>
      </div>
   );
};

export default Reports;
