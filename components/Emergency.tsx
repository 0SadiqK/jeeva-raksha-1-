
import React, { useState, useEffect } from 'react';
import { EmergencyCase } from '../types';
import api from '../api';

const Emergency: React.FC = () => {
  const [cases, setCases] = useState<EmergencyCase[]>([
    {
      id: 'ER-402',
      patientName: 'Rahul Khanna',
      age: 28,
      gender: 'M',
      triageLevel: 'Critical',
      arrivalTime: new Date(Date.now() - 15 * 60000).toISOString(),
      assignedDoctor: 'Dr. Aditi Sharma',
      assignedNurse: 'Staff Nurse Jancy',
      vitals: { hr: 132, bp: '84/52', spo2: 88, temp: 98.2 },
      lastUpdate: '2 mins ago',
      chiefComplaint: 'Poly-trauma: RTA (Road Traffic Accident)'
    },
    {
      id: 'ER-405',
      patientName: 'Sunita Devi',
      age: 52,
      gender: 'F',
      triageLevel: 'Serious',
      arrivalTime: new Date(Date.now() - 42 * 60000).toISOString(),
      assignedDoctor: 'Dr. Ravi Varma',
      assignedNurse: 'Staff Nurse Arjun',
      vitals: { hr: 104, bp: '158/96', spo2: 94, temp: 101.4 },
      lastUpdate: '8 mins ago',
      chiefComplaint: 'Acute Chest Pain / Dyspnea'
    },
    {
      id: 'ER-408',
      patientName: 'Amit Patel',
      age: 36,
      gender: 'M',
      triageLevel: 'Stable',
      arrivalTime: new Date(Date.now() - 5 * 60000).toISOString(),
      assignedDoctor: 'Dr. Priya Das',
      assignedNurse: 'Staff Nurse Mary',
      vitals: { hr: 78, bp: '122/82', spo2: 98, temp: 98.6 },
      lastUpdate: 'Just now',
      chiefComplaint: 'Laceration on right forearm'
    }
  ]);

  const [selectedCase, setSelectedCase] = useState<EmergencyCase | null>(cases[0]);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [erStats, setErStats] = useState({ active: '08', critical: '02', freeBays: '03', onCall: '05' });

  useEffect(() => {
    const fetchERData = async () => {
      try {
        const [visits, beds] = await Promise.all([
          api.getVisits({ type: 'Emergency' }).catch(() => null),
          api.getBeds().catch(() => null),
        ]);
        if (visits && visits.length > 0) {
          setErStats(prev => ({
            ...prev,
            active: String(visits.length).padStart(2, '0'),
            critical: String(visits.filter((v: any) => v.status === 'critical' || v.status === 'in_progress').length).padStart(2, '0'),
          }));
        }
        if (beds && beds.length > 0) {
          const available = beds.filter((b: any) => b.status === 'available' || b.status === 'Available').length;
          setErStats(prev => ({ ...prev, freeBays: String(available).padStart(2, '0') }));
        }
      } catch { /* fallback to defaults */ }
    };
    fetchERData();
  }, []);

  const getTriageColor = (level: EmergencyCase['triageLevel']) => {
    switch (level) {
      case 'Critical': return 'bg-danger text-white border-danger shadow-[0_0_15px_rgba(211,47,47,0.4)]';
      case 'Serious': return 'bg-warning text-slate-900 border-warning';
      case 'Stable': return 'bg-success text-white border-success';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  const getArrivalDuration = (arrival: string) => {
    const start = new Date(arrival).getTime();
    const diff = Math.floor((currentTime.getTime() - start) / 60000);
    return `${diff}m`;
  };

  return (
    <div className="max-w-[1600px] mx-auto animate-in fade-in duration-700 space-y-8 pb-20">
      {/* Header with Stats */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 bg-slate-900 p-10 rounded-[4rem] text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-danger/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2 animate-pulse"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-4 mb-3">
            <div className="w-12 h-12 bg-danger rounded-2xl flex items-center justify-center text-2xl animate-pulse shadow-[0_0_20px_rgba(211,47,47,0.6)]">🚨</div>
            <h2 className="text-3xl font-black tracking-tight">Trauma Command Center</h2>
          </div>
          <p className="text-sm font-medium text-slate-400 font-kannada">“ತುರ್ತು ಪರಿಸ್ಥಿತಿ — ತಕ್ಷಣದ ಸ್ಪಂದನೆ” — Life critical response system.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 relative z-10">
          <div className="text-center md:text-left">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Active Cases</p>
            <p className="text-3xl font-black text-white">{erStats.active}</p>
          </div>
          <div className="text-center md:text-left">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Critical Red</p>
            <p className="text-3xl font-black text-danger">{erStats.critical}</p>
          </div>
          <div className="text-center md:text-left">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Free Bays</p>
            <p className="text-3xl font-black text-success">{erStats.freeBays}</p>
          </div>
          <div className="text-center md:text-left">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">On Call</p>
            <p className="text-3xl font-black text-primary">{erStats.onCall}</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Live Case List */}
        <div className="col-span-12 lg:col-span-5 space-y-6">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-4">Live Trauma Workflow</h3>
          <div className="space-y-4">
            {cases.map(c => (
              <div
                key={c.id}
                onClick={() => setSelectedCase(c)}
                className={`bg-white p-6 rounded-[2.5rem] border transition-all cursor-pointer group relative overflow-hidden ${selectedCase?.id === c.id ? 'border-primary shadow-xl shadow-primary/5' : 'border-slate-100 shadow-sm hover:border-slate-200'
                  }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest border ${getTriageColor(c.triageLevel)}`}>
                      {c.triageLevel}
                    </span>
                    <span className="text-[10px] font-black text-slate-300 uppercase">Wait: {getArrivalDuration(c.arrivalTime)}</span>
                  </div>
                  <span className="text-[10px] font-black text-slate-400">{c.id}</span>
                </div>

                <div className="flex justify-between items-center">
                  <div>
                    <h4 className="text-xl font-black text-slate-900 leading-tight">{c.patientName}</h4>
                    <p className="text-xs font-bold text-slate-500 mt-1">{c.age}y • {c.gender} • {c.chiefComplaint}</p>
                  </div>
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 text-danger animate-pulse">
                      <span className="text-xs font-black tracking-tighter">{c.vitals.hr}</span>
                      <span className="text-[8px] font-bold uppercase">BPM</span>
                    </div>
                  </div>
                </div>

                {selectedCase?.id === c.id && (
                  <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-primary"></div>
                )}
              </div>
            ))}
          </div>

          <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Ambulance Hub (Live)</h4>
            <div className="space-y-4">
              {[
                { id: 'AMB-12', distance: '1.2km', eta: '3m', type: 'ALS' },
                { id: 'AMB-04', distance: '4.8km', eta: '12m', type: 'BLS' },
              ].map(amb => (
                <div key={amb.id} className="flex items-center justify-between p-4 bg-hospital-bg rounded-2xl border border-slate-50">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">🚑</span>
                    <div>
                      <p className="text-xs font-black text-slate-800">{amb.id}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{amb.type}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-black text-primary uppercase">{amb.eta}</p>
                    <p className="text-[8px] font-bold text-slate-400">{amb.distance}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Selected Case Command Display */}
        <div className="col-span-12 lg:col-span-7">
          {selectedCase ? (
            <div className="space-y-8 animate-in slide-in-from-right-8 duration-500">
              <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-xl relative overflow-hidden">
                <div className="flex justify-between items-start mb-12 border-b border-slate-50 pb-8">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <h3 className="text-3xl font-black text-slate-900 tracking-tight">{selectedCase.patientName}</h3>
                      <span className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase ${getTriageColor(selectedCase.triageLevel)}`}>
                        {selectedCase.triageLevel}
                      </span>
                    </div>
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Acuity Level Priority 1 • Trauma Bay 02</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Arrival Tracker</p>
                    <p className="text-3xl font-black text-slate-900 tabular-nums">{getArrivalDuration(selectedCase.arrivalTime)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
                  {[
                    { label: 'Heart Rate', value: selectedCase.vitals.hr, unit: 'BPM', status: 'critical', icon: '❤️' },
                    { label: 'BP Sys/Dia', value: selectedCase.vitals.bp, unit: 'mmHg', status: 'serious', icon: '🩺' },
                    { label: 'SpO2 Level', value: selectedCase.vitals.spo2, unit: '%', status: 'critical', icon: '💨' },
                    { label: 'Temperature', value: selectedCase.vitals.temp, unit: '°F', status: 'stable', icon: '🌡️' },
                  ].map(vital => (
                    <div key={vital.label} className="p-6 bg-hospital-bg rounded-3xl border border-slate-50 relative group">
                      <div className="absolute top-4 right-4 text-xs opacity-20 group-hover:opacity-100 transition-opacity">{vital.icon}</div>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1.5">{vital.label}</p>
                      <div className="flex items-baseline gap-1">
                        <span className={`text-2xl font-black ${vital.status === 'critical' ? 'text-danger animate-pulse' :
                          vital.status === 'serious' ? 'text-warning' : 'text-slate-900'
                          }`}>{vital.value}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase">{vital.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                  <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 space-y-6">
                    <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinical Care Team</h4>
                    <div className="space-y-4">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-100 text-sm">👩‍⚕️</div>
                        <div>
                          <p className="text-xs font-black text-slate-800">{selectedCase.assignedDoctor}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Primary Intensivist</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center border border-slate-100 text-sm">🧑‍⚕️</div>
                        <div>
                          <p className="text-xs font-black text-slate-800">{selectedCase.assignedNurse}</p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Trauma Nurse</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 flex flex-col justify-center">
                    <button className="w-full py-4 bg-danger text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-danger/20 hover:bg-red-700 transition-all flex items-center justify-center gap-3">
                      ICU Admission (Code Red)
                    </button>
                    <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all">
                      Shift to Emergency OT
                    </button>
                    <button className="w-full py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all">
                      Order STAT Imaging
                    </button>
                  </div>
                </div>

                <div className="p-6 bg-primary/5 rounded-[2rem] border border-primary/10 flex items-start gap-4">
                  <div className="text-2xl">✨</div>
                  <div className="flex-1">
                    <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">AI Triage Co-Pilot</p>
                    <p className="text-xs text-primary/70 font-medium font-kannada leading-relaxed">
                      “ತ್ವರಿತ ನಿರ್ಧಾರ — ಅಮೂಲ್ಯ ಜೀವ” — Patient shows signs of hypovolemic shock. Fluid resuscitation protocols initiated. Recommend immediate cross-matching for 4 units O-Negative blood.
                    </p>
                  </div>
                </div>
              </div>

              {/* Event Logs */}
              <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-sm">
                <h3 className="text-xl font-black text-slate-900 tracking-tight mb-8">STAT Event Logs</h3>
                <div className="space-y-4">
                  {[
                    { time: '10:42 AM', event: 'Primary survey completed: Unstable fracture suspected.', user: 'Dr. Sharma' },
                    { time: '10:40 AM', event: 'IV access secured (18G x 2). Initial bolus started.', user: 'Nurse Jancy' },
                    { time: '10:35 AM', event: 'Patient arrived via Ambulance JR-08. GCS: 9/15.', user: 'Triage' },
                  ].map((log, i) => (
                    <div key={i} className="flex gap-6 pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                      <span className="text-[10px] font-black text-slate-400 tabular-nums w-16">{log.time}</span>
                      <div className="flex-1">
                        <p className="text-xs font-bold text-slate-800 leading-relaxed">{log.event}</p>
                        <p className="text-[8px] font-black text-primary uppercase tracking-widest mt-1">{log.user}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-48 bg-white rounded-[4rem] border border-slate-100 shadow-sm border-dashed">
              <div className="w-24 h-24 bg-hospital-bg rounded-full flex items-center justify-center text-5xl mb-8 grayscale opacity-20">🚨</div>
              <h3 className="text-xl font-black text-slate-300 uppercase tracking-widest">Select Case for Monitoring</h3>
              <p className="text-xs text-slate-300 mt-2 font-bold uppercase tracking-widest text-center">Awaiting selection from active trauma queue</p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #e2e8f0; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default Emergency;
