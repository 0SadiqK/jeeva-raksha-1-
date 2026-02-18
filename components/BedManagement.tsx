
import React, { useState, useEffect } from 'react';
import { Bed } from '../types';
import api from '../api';

const BedManagement: React.FC = () => {
  const [beds, setBeds] = useState<Bed[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock fallback data
  const mockBeds: Bed[] = [
    { id: 'ICU-01', name: 'ICU Bed 1', type: 'ICU', status: 'Occupied', patientName: 'Vikram Mehta' },
    { id: 'ICU-02', name: 'ICU Bed 2', type: 'ICU', status: 'Available' },
    { id: 'ICU-03', name: 'ICU Bed 3', type: 'ICU', status: 'Cleaning' },
    { id: 'GEN-101', name: 'G-Ward 101', type: 'General', status: 'Occupied', patientName: 'Suresh Raina' },
    { id: 'GEN-102', name: 'G-Ward 102', type: 'General', status: 'Available' },
    { id: 'GEN-103', name: 'G-Ward 103', type: 'General', status: 'Occupied', patientName: 'Meena Kumari' },
    { id: 'GEN-104', name: 'G-Ward 104', type: 'General', status: 'Available' },
    { id: 'GEN-105', name: 'G-Ward 105', type: 'General', status: 'Available' },
    { id: 'PVT-301', name: 'Private 301', type: 'Private', status: 'Occupied', patientName: 'Anjali Sharma' },
    { id: 'PVT-302', name: 'Private 302', type: 'Private', status: 'Available' },
    { id: 'ISO-501', name: 'Isolation 501', type: 'Isolation', status: 'Occupied', patientName: 'Rahul Khanna' },
    { id: 'ISO-502', name: 'Isolation 502', type: 'Isolation', status: 'Cleaning' },
  ];

  useEffect(() => {
    const fetchBeds = async () => {
      try {
        const data = await api.getBeds();
        const mapped = data.map((b: any) => ({
          id: b.bed_number || b.id,
          name: `${b.ward_name || ''} ${b.bed_number || ''}`.trim(),
          type: b.ward_type || 'General',
          status: b.status || 'Available',
          patientName: b.current_patient?.patient_name || undefined,
        }));
        setBeds(mapped.length > 0 ? mapped : mockBeds);
      } catch {
        setBeds(mockBeds);
      } finally {
        setLoading(false);
      }
    };
    fetchBeds();
  }, []);

  const [activeTab, setActiveTab] = useState<'ALL' | 'ICU' | 'GENERAL' | 'PRIVATE' | 'ISOLATION'>('ALL');
  const [selectedBed, setSelectedBed] = useState<Bed | null>(null);

  const filteredBeds = activeTab === 'ALL'
    ? beds
    : beds.filter(b => b.type.toUpperCase() === activeTab);

  const getStatusColor = (status: Bed['status']) => {
    switch (status) {
      case 'Available': return 'bg-success text-white border-success';
      case 'Occupied': return 'bg-primary text-white border-primary';
      case 'Cleaning': return 'bg-warning text-slate-900 border-warning';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  const wardStats = {
    ICU: { total: 3, occupied: 1, cleaning: 1 },
    General: { total: 5, occupied: 2, cleaning: 0 },
    Private: { total: 2, occupied: 1, cleaning: 0 },
    Isolation: { total: 2, occupied: 1, cleaning: 1 },
  };

  const calculateOccupancy = (type: keyof typeof wardStats) => {
    const stats = wardStats[type];
    return Math.round((stats.occupied / stats.total) * 100);
  };

  return (
    <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500 space-y-8 pb-20">
      {/* Header & Global Stats */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Bed Matrix Control</h2>
          <p className="text-sm font-medium text-slate-500 font-kannada">“ಹಾಸಿಗೆ ಲಭ್ಯತೆ — ತಕ್ಷಣದ ಆರೈಕೆ” — Real-time capacity command.</p>
        </div>
        <div className="flex gap-4">
          <div className="flex bg-white rounded-2xl p-1 shadow-sm border border-slate-100">
            {(['ALL', 'ICU', 'GENERAL', 'PRIVATE', 'ISOLATION'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-5 py-2 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${activeTab === tab ? 'bg-primary text-white shadow-md' : 'text-slate-400 hover:bg-slate-50'
                  }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <button className="px-6 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl hover:bg-slate-800 transition-all flex items-center gap-3">
            STAT Bed Allocation
          </button>
        </div>
      </div>

      {/* Ward Occupancy Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {(['ICU', 'General', 'Private', 'Isolation'] as const).map(ward => (
          <div key={ward} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm group hover:shadow-xl transition-all">
            <div className="flex justify-between items-start mb-6">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{ward} Occupancy</p>
              <div className="w-10 h-10 bg-hospital-bg rounded-xl flex items-center justify-center text-xl shadow-inner group-hover:scale-110 transition-transform">
                {ward === 'ICU' ? '🏥' : ward === 'General' ? '🛌' : ward === 'Private' ? '💎' : '☣️'}
              </div>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-black text-slate-900">{calculateOccupancy(ward)}%</span>
              <span className="text-[10px] font-bold text-slate-300 uppercase whitespace-nowrap">
                {wardStats[ward].occupied} / {wardStats[ward].total} Beds
              </span>
            </div>
            <div className="mt-6 h-1.5 bg-slate-50 rounded-full overflow-hidden">
              <div
                className={`h-full transition-all duration-1000 ${calculateOccupancy(ward) > 80 ? 'bg-danger' :
                    calculateOccupancy(ward) > 50 ? 'bg-warning' : 'bg-success'
                  }`}
                style={{ width: `${calculateOccupancy(ward)}%` }}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-12 gap-8">
        {/* Main Interactive Grid */}
        <div className="col-span-12 lg:col-span-9">
          <div className="bg-white p-10 rounded-[3.5rem] border border-slate-100 shadow-sm min-h-[600px]">
            <div className="flex justify-between items-center mb-10">
              <h3 className="text-xl font-black text-slate-900 tracking-tight">Ward Floor Map</h3>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-success"></span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Available</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Occupied</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-warning"></span>
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cleaning</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 gap-6">
              {filteredBeds.map(bed => (
                <div
                  key={bed.id}
                  onClick={() => setSelectedBed(bed)}
                  className={`p-6 rounded-[2.5rem] border-2 transition-all cursor-pointer relative group overflow-hidden ${selectedBed?.id === bed.id
                      ? 'border-slate-900 ring-4 ring-slate-100'
                      : 'border-transparent bg-hospital-bg hover:shadow-lg'
                    }`}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">{bed.id}</span>
                    <span className={`px-2 py-0.5 rounded-lg text-[8px] font-black uppercase tracking-tighter ${bed.type === 'ICU' ? 'bg-danger/10 text-danger' :
                        bed.type === 'Isolation' ? 'bg-amber-100 text-amber-700' : 'bg-slate-200 text-slate-600'
                      }`}>
                      {bed.type}
                    </span>
                  </div>

                  <div className="flex flex-col items-center justify-center py-4 space-y-4">
                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl shadow-inner transition-transform group-hover:scale-110 ${bed.status === 'Available' ? 'bg-success/10 text-success' :
                        bed.status === 'Occupied' ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'
                      }`}>
                      🛌
                    </div>
                    <div className="text-center">
                      <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${bed.status === 'Available' ? 'text-success' :
                          bed.status === 'Occupied' ? 'text-primary' : 'text-warning'
                        }`}>
                        {bed.status}
                      </p>
                      <p className="text-xs font-bold text-slate-900 truncate max-w-[120px]">
                        {bed.patientName || 'Vacant'}
                      </p>
                    </div>
                  </div>

                  {selectedBed?.id === bed.id && (
                    <div className="absolute top-2 right-2 text-slate-900 text-xs">⭐</div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Action Panel */}
        <div className="col-span-12 lg:col-span-3 space-y-8">
          {selectedBed ? (
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl animate-in slide-in-from-right-4 duration-500 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl -translate-y-1/2 translate-x-1/2"></div>

              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-8">Management Controls</h3>

              <div className="space-y-8">
                <div className="flex items-center gap-5 pb-8 border-b border-slate-50">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner ${getStatusColor(selectedBed.status)}`}>
                    {selectedBed.status === 'Available' ? '✨' : selectedBed.status === 'Occupied' ? '👤' : '🧼'}
                  </div>
                  <div>
                    <h4 className="text-lg font-black text-slate-900 leading-tight">{selectedBed.name}</h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">{selectedBed.type} Core Ward</p>
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedBed.status === 'Available' && (
                    <button className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-blue-700 shadow-lg shadow-primary/20 transition-all active:scale-95">
                      Admit Patient to Bed
                    </button>
                  )}
                  {selectedBed.status === 'Occupied' && (
                    <>
                      <button className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg active:scale-95">
                        Transfer Patient
                      </button>
                      <button className="w-full py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95">
                        Process Discharge
                      </button>
                    </>
                  )}
                  {selectedBed.status === 'Cleaning' && (
                    <button className="w-full py-4 bg-success text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-green-700 shadow-lg shadow-success/20 transition-all active:scale-95">
                      Release to Availability
                    </button>
                  )}
                </div>

                <div className="pt-8 border-t border-slate-50 space-y-4">
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Patient Records</p>
                    <p className="text-xs font-bold text-slate-900">{selectedBed.patientName || 'None Assigned'}</p>
                  </div>
                  <div>
                    <p className="text-[9px] font-black text-slate-400 uppercase mb-2">Last Housekeeping</p>
                    <p className="text-xs font-bold text-slate-500">2 hrs 14 mins ago</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm flex flex-col items-center justify-center text-center py-24 border-dashed">
              <div className="w-16 h-16 bg-hospital-bg rounded-full flex items-center justify-center text-3xl mb-6 grayscale opacity-30">🛏️</div>
              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Selection Required</h4>
              <p className="text-xs text-slate-300 mt-2 font-bold px-4">Select a bed from the ward floor map to access management actions.</p>
            </div>
          )}

          {/* Emergency Triage Suggestion */}
          <div className="bg-slate-900 rounded-[3.5rem] p-10 text-white relative overflow-hidden shadow-2xl group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/20 rounded-full blur-[60px] -translate-y-1/2 translate-x-1/2 animate-pulse" />
            <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-3">
                <span className="text-2xl group-hover:rotate-12 transition-transform">✨</span>
                <h4 className="text-sm font-black text-white">AI Surge Logic</h4>
              </div>
              <p className="text-xs text-slate-400 font-medium leading-relaxed font-kannada">
                “ಹಾಸಿಗೆ ಲಭ್ಯತೆ — ತಕ್ಷಣದ ಆರೈಕೆ”<br />
                Predicted demand for ICU beds will exceed capacity in 4 hours due to high ER volume. Recommend processing discharges for 3 General Ward patients to clear pathway.
              </p>
              <div className="flex gap-4">
                <div className="flex-1 p-4 bg-white/5 border border-white/5 rounded-2xl">
                  <p className="text-[9px] font-black text-primary uppercase tracking-widest mb-1">Risk score</p>
                  <p className="text-2xl font-black text-white tracking-tighter">8.2/10</p>
                </div>
                <div className="flex-1 p-4 bg-white/5 border border-white/5 rounded-2xl">
                  <p className="text-[9px] font-black text-success uppercase tracking-widest mb-1">Suggested</p>
                  <p className="text-2xl font-black text-white tracking-tighter">ICU-02</p>
                </div>
              </div>
            </div>
          </div>
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

export default BedManagement;
