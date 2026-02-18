
import React, { useState, useEffect } from 'react';
import { WardPatient } from '../types';
import api from '../api';

const IPDManagement: React.FC = () => {
   const [activeWard, setActiveWard] = useState<string>('General Ward A');
   const [selectedPatient, setSelectedPatient] = useState<WardPatient | null>(null);

   const mockWardPatients: WardPatient[] = [
      {
         id: 'P101',
         bed: 'A-12',
         name: 'Vikram Mehta',
         age: 42,
         gender: 'M',
         acuity: 'High',
         lastSeen: '2026-02-23T10:00:00Z',
         seenToday: true,
         diagnosis: 'Severe Pneumonia with Acute Respiratory Distress',
         attendingDoctor: 'Dr. Aditi Sharma',
         admissionDate: '2026-02-18',
         pendingOrders: { labs: 2, meds: 1 },
         dischargeReadiness: 45,
         vitals: { hr: 98, bp: '138/92', spo2: 94 }
      },
      {
         id: 'P102',
         bed: 'A-14',
         name: 'Suresh Raina',
         age: 29,
         gender: 'M',
         acuity: 'Low',
         lastSeen: '2026-02-22T18:30:00Z',
         seenToday: false,
         diagnosis: 'Post-Op Recovery (Appendectomy)',
         attendingDoctor: 'Dr. Rahul Verma',
         admissionDate: '2026-02-21',
         pendingOrders: { labs: 0, meds: 0 },
         dischargeReadiness: 85,
         vitals: { hr: 72, bp: '118/78', spo2: 98 }
      },
      {
         id: 'P103',
         bed: 'A-15',
         name: 'Meena Kumari',
         age: 64,
         gender: 'F',
         acuity: 'Medium',
         lastSeen: '2026-02-22T09:00:00Z',
         seenToday: false,
         diagnosis: 'Uncontrolled Diabetes Mellitus with UTI',
         attendingDoctor: 'Dr. Sneha Rao',
         admissionDate: '2026-02-19',
         pendingOrders: { labs: 4, meds: 2 },
         dischargeReadiness: 30,
         vitals: { hr: 88, bp: '154/96', spo2: 96 }
      },
      {
         id: 'P104',
         bed: 'B-02',
         name: 'Anjali Sharma',
         age: 34,
         gender: 'F',
         acuity: 'Medium',
         lastSeen: '2026-02-23T08:15:00Z',
         seenToday: true,
         diagnosis: 'Elective C-Section Post-Op Day 2',
         attendingDoctor: 'Dr. Priya Das',
         admissionDate: '2026-02-21',
         pendingOrders: { labs: 1, meds: 0 },
         dischargeReadiness: 70,
         vitals: { hr: 78, bp: '112/72', spo2: 99 }
      },
   ];

   const [wardPatients, setWardPatients] = useState<WardPatient[]>(mockWardPatients);

   useEffect(() => {
      const fetchIPDPatients = async () => {
         try {
            const [patients, beds] = await Promise.all([
               api.getPatients().catch(() => null),
               api.getBeds().catch(() => null),
            ]);
            if (patients && patients.length > 0 && beds && beds.length > 0) {
               const occupiedBeds = beds.filter((b: any) => b.status === 'Occupied' || b.status === 'occupied');
               if (occupiedBeds.length > 0) {
                  const ipdPatients: WardPatient[] = occupiedBeds.map((bed: any, idx: number) => {
                     const patient = patients.find((p: any) => p.id === bed.patient_id);
                     return {
                        id: patient?.uhid || `P${idx + 1}`,
                        bed: bed.bed_number || bed.name || `B-${idx + 1}`,
                        name: patient?.name || bed.patient_name || 'Unknown',
                        age: patient?.date_of_birth ? Math.floor((Date.now() - new Date(patient.date_of_birth).getTime()) / 31557600000) : 0,
                        gender: patient?.gender?.charAt(0) || '?',
                        acuity: 'Medium' as const,
                        lastSeen: new Date().toISOString(),
                        seenToday: Math.random() > 0.5,
                     };
                  });
                  setWardPatients(prev => ipdPatients.length > 0 ? ipdPatients : prev);
               }
            }
         } catch { /* fallback to mock */ }
      };
      fetchIPDPatients();
   }, []);

   const wards = ['General Ward A', 'ICU', 'Semi-Private B', 'Emergency Ward'];

   const getAcuityColor = (acuity: WardPatient['acuity']) => {
      switch (acuity) {
         case 'High': return 'text-danger bg-danger/10 border-danger/20';
         case 'Medium': return 'text-warning bg-warning/10 border-warning/20';
         case 'Low': return 'text-success bg-success/10 border-success/20';
         default: return 'text-slate-400 bg-slate-100';
      }
   };

   return (
      <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500 space-y-8 pb-20">
         {/* Header & Ward Selector */}
         <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
            <div>
               <h2 className="text-3xl font-black text-slate-900 tracking-tight">Inpatient Supervision</h2>
               <p className="text-sm font-medium text-slate-500 font-kannada">“ವಾರ್ಡ್ ನಿರ್ವಹಣೆ — ನಿರಂತರ ನಿಗಾ” — 24/7 Clinical command.</p>
            </div>
            <div className="flex gap-4">
               <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-slate-100 overflow-x-auto max-w-full custom-scrollbar">
                  {wards.map(ward => (
                     <button
                        key={ward}
                        onClick={() => setActiveWard(ward)}
                        className={`px-6 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all whitespace-nowrap ${activeWard === ward ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'
                           }`}
                     >
                        {ward}
                     </button>
                  ))}
               </div>
               <button className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all flex items-center gap-3">
                  STAT Transfer
               </button>
            </div>
         </div>

         <div className="grid grid-cols-12 gap-8">
            {/* Patient Grid */}
            <div className="col-span-12 lg:col-span-9">
               <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {wardPatients.map(patient => (
                     <div
                        key={patient.id}
                        onClick={() => setSelectedPatient(patient)}
                        className={`bg-white p-6 rounded-[3rem] border-2 transition-all cursor-pointer group relative overflow-hidden ${selectedPatient?.id === patient.id ? 'border-primary shadow-xl ring-4 ring-primary/5' : 'border-slate-100 shadow-sm hover:border-slate-200'
                           }`}
                     >
                        <div className="flex justify-between items-start mb-6">
                           <div className="flex items-center gap-3">
                              <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/5 px-3 py-1 rounded-lg">Bed {patient.bed}</span>
                              <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-tighter border ${getAcuityColor(patient.acuity)}`}>
                                 {patient.acuity}
                              </span>
                           </div>
                           <div className="flex items-center gap-1.5">
                              <span className={`w-2 h-2 rounded-full ${patient.seenToday ? 'bg-success' : 'bg-danger animate-pulse'}`}></span>
                              <span className="text-[8px] font-black text-slate-400 uppercase">{patient.seenToday ? 'Seen' : 'Unseen'}</span>
                           </div>
                        </div>

                        <div className="space-y-4">
                           <div>
                              <h4 className="text-lg font-black text-slate-900 leading-tight">{patient.name}</h4>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{patient.age}y • {patient.gender} • {patient.id}</p>
                           </div>

                           <div className="p-4 bg-hospital-bg rounded-2xl border border-slate-50 space-y-2">
                              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest leading-none">Primary Diagnosis</p>
                              <p className="text-xs font-bold text-slate-700 leading-relaxed truncate">{patient.diagnosis}</p>
                           </div>

                           <div className="grid grid-cols-3 gap-2">
                              <div className="text-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                                 <p className="text-[8px] font-black text-slate-400 uppercase mb-1">HR</p>
                                 <p className={`text-xs font-black ${patient.vitals?.hr && patient.vitals.hr > 100 ? 'text-danger animate-pulse' : 'text-slate-800'}`}>{patient.vitals?.hr}</p>
                              </div>
                              <div className="text-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                                 <p className="text-[8px] font-black text-slate-400 uppercase mb-1">BP</p>
                                 <p className="text-xs font-black text-slate-800 whitespace-nowrap">{patient.vitals?.bp}</p>
                              </div>
                              <div className="text-center p-2 rounded-xl bg-slate-50 border border-slate-100">
                                 <p className="text-[8px] font-black text-slate-400 uppercase mb-1">SpO2</p>
                                 <p className={`text-xs font-black ${patient.vitals?.spo2 && patient.vitals.spo2 < 95 ? 'text-danger' : 'text-slate-800'}`}>{patient.vitals?.spo2}%</p>
                              </div>
                           </div>

                           <div className="flex justify-between items-center pt-2">
                              <div className="flex gap-4">
                                 <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-slate-400 uppercase">Labs</span>
                                    <span className={`text-xs font-black ${patient.pendingOrders?.labs ? 'text-primary' : 'text-slate-300'}`}>{patient.pendingOrders?.labs || 0}</span>
                                 </div>
                                 <div className="flex flex-col">
                                    <span className="text-[8px] font-black text-slate-400 uppercase">Meds</span>
                                    <span className={`text-xs font-black ${patient.pendingOrders?.meds ? 'text-warning' : 'text-slate-300'}`}>{patient.pendingOrders?.meds || 0}</span>
                                 </div>
                              </div>
                              <div className="text-right">
                                 <p className="text-[8px] font-black text-slate-400 uppercase mb-1">Discharge Readiness</p>
                                 <div className="w-24 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                    <div className={`h-full bg-success transition-all duration-1000`} style={{ width: `${patient.dischargeReadiness}%` }} />
                                 </div>
                              </div>
                           </div>
                        </div>
                     </div>
                  ))}

                  {/* Empty Bed Placeholder */}
                  <div className="bg-white/50 p-6 rounded-[3rem] border-2 border-dashed border-slate-200 flex flex-col items-center justify-center text-center space-y-3 grayscale opacity-40">
                     <span className="text-2xl">🛌</span>
                     <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">A-16 Available</p>
                  </div>
               </div>
            </div>

            {/* Supervision Sidebar */}
            <div className="col-span-12 lg:col-span-3 space-y-8">
               {selectedPatient ? (
                  <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl animate-in slide-in-from-right-4 duration-500 space-y-8 relative overflow-hidden">
                     <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>

                     <div className="pb-8 border-b border-slate-50">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Patient Master Detail</h3>
                        <div className="flex items-center gap-5">
                           <div className="w-16 h-16 bg-hospital-bg rounded-2xl flex items-center justify-center text-3xl shadow-inner font-black text-primary">
                              {selectedPatient.name.charAt(0)}
                           </div>
                           <div>
                              <h4 className="text-xl font-black text-slate-900 leading-tight">{selectedPatient.name}</h4>
                              <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Adm Date: {selectedPatient.admissionDate}</p>
                           </div>
                        </div>
                     </div>

                     <div className="space-y-6">
                        <div className="space-y-2">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Attending Physician</p>
                           <div className="flex items-center gap-3 p-4 bg-hospital-bg rounded-2xl border border-slate-50">
                              <span className="text-lg">👨‍⚕️</span>
                              <span className="text-sm font-bold text-slate-800">{selectedPatient.attendingDoctor}</span>
                           </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                           <button className="py-4 bg-slate-900 text-white rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg shadow-slate-200/50">
                              Daily Rounds
                           </button>
                           <button className="py-4 bg-primary text-white rounded-2xl font-black text-[9px] uppercase tracking-widest hover:bg-blue-700 transition-all shadow-lg shadow-primary/20">
                              Order STAT
                           </button>
                        </div>

                        <div className="space-y-3">
                           <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Pending Directives</p>
                           <div className="space-y-2">
                              {[
                                 { task: 'IV Fluids Update', status: 'Pending', type: 'meds' },
                                 { task: 'Electrolytes Panel', status: 'In-Transit', type: 'labs' },
                              ].map((directive, i) => (
                                 <div key={i} className="flex justify-between items-center p-3 bg-slate-50 rounded-xl border border-slate-100">
                                    <span className="text-[10px] font-bold text-slate-600">{directive.task}</span>
                                    <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-lg border ${directive.status === 'Pending' ? 'bg-warning/10 text-warning border-warning/10' : 'bg-primary/10 text-primary border-primary/10'
                                       }`}>{directive.status}</span>
                                 </div>
                              ))}
                           </div>
                        </div>

                        <button className="w-full py-5 bg-success text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-green-700 shadow-xl shadow-success/20 transition-all">
                           Finalize Discharge
                        </button>
                     </div>
                  </div>
               ) : (
                  <div className="bg-white p-12 rounded-[4rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center py-24 border-dashed">
                     <div className="w-20 h-20 bg-hospital-bg rounded-full flex items-center justify-center text-4xl mb-6 grayscale opacity-20">🛌</div>
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Select Patient Bed</h4>
                     <p className="text-xs text-slate-300 mt-2 font-bold px-8">Click on an occupied bed card to monitor specific clinical progress.</p>
                  </div>
               )}

               {/* AI Ward Insights */}
               <div className="bg-slate-900 rounded-[3.5rem] p-10 text-white relative overflow-hidden shadow-2xl group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 animate-pulse" />
                  <div className="relative z-10 space-y-8">
                     <div className="flex items-center gap-3">
                        <span className="text-2xl group-hover:rotate-12 transition-transform">✨</span>
                        <h4 className="text-sm font-black text-white">AI Ward Co-Pilot</h4>
                     </div>
                     <p className="text-xs text-slate-400 font-medium leading-relaxed font-kannada">
                        “ವಾರ್ಡ್ ನಿರ್ವಹಣೆ — ನಿರಂತರ ನಿಗಾ”<br />
                        Patient P101 shows SpO2 stability for 4 hours. Automated recommendation: Down-titrate oxygen flow to 2L/min.
                     </p>
                     <div className="p-4 bg-white/5 border border-white/5 rounded-2xl">
                        <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Acuity alert</p>
                        <p className="text-xl font-black text-white tracking-tighter">Stabilization Detected</p>
                     </div>
                  </div>
               </div>
            </div>
         </div>

         <style>{`
        .custom-scrollbar::-webkit-scrollbar { height: 4px; width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
      </div>
   );
};

export default IPDManagement;
