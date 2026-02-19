
import React, { useState, useEffect } from 'react';
import { Patient } from '../types';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const Patients: React.FC = () => {
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [patients, setPatients] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [newPatient, setNewPatient] = useState({
    name: '', date_of_birth: '', gender: '', blood_group: '',
    phone: '', email: '', address: '', city: '', state: '', pincode: ''
  });
  const [saving, setSaving] = useState(false);
  const { user, canPerformAction } = useAuth();
  const isAdmin = canPerformAction('PATIENTS', 'ADMIN');

  // Fetch patients from DB
  const fetchPatients = async (search?: string) => {
    try {
      setLoading(true);
      const data = await api.getPatients(search);
      setPatients(data);
      setError('');
    } catch (err: any) {
      console.error('Failed to fetch patients:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, []);

  // Debounced search
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchPatients(searchQuery || undefined);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPatient.name || !newPatient.date_of_birth || !newPatient.gender) return;
    setSaving(true);
    try {
      await api.createPatient(newPatient);
      setShowRegisterForm(false);
      setNewPatient({ name: '', date_of_birth: '', gender: '', blood_group: '', phone: '', email: '', address: '', city: '', state: '', pincode: '' });
      fetchPatients(); // Refresh list
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSaving(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-success/10 text-success border-success/20';
      case 'inactive': return 'bg-slate-100 text-slate-500 border-slate-200';
      case 'deceased': return 'bg-danger/10 text-danger border-danger/20';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  const calcAge = (dob: string) => {
    const diff = Date.now() - new Date(dob).getTime();
    return Math.floor(diff / 31557600000);
  };

  // Patient detail view
  if (selectedPatient) {
    return (
      <div className="animate-in slide-in-from-right duration-500 space-y-8">
        <button
          onClick={() => setSelectedPatient(null)}
          className="flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-bold text-xs uppercase tracking-widest"
        >
          <span>←</span> Back to Patient List
        </button>

        <div className="grid grid-cols-12 gap-8">
          <div className="col-span-12 lg:col-span-4 space-y-8">
            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm text-center">
              <div className="w-24 h-24 bg-primary/5 rounded-[2.5rem] flex items-center justify-center text-primary text-4xl font-black mx-auto mb-6 border border-primary/10">
                {selectedPatient.name?.charAt(0)}
              </div>
              <h2 className="text-2xl font-black text-slate-900">{selectedPatient.name}</h2>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">{selectedPatient.uhid}</p>

              <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="bg-hospital-bg p-4 rounded-2xl border border-slate-50 text-left">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Age / Gender</p>
                  <p className="text-sm font-bold text-slate-900">{calcAge(selectedPatient.date_of_birth)}y • {selectedPatient.gender}</p>
                </div>
                <div className="bg-hospital-bg p-4 rounded-2xl border border-slate-50 text-left">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-1">Blood Group</p>
                  <p className="text-sm font-bold text-danger">{selectedPatient.blood_group || '—'}</p>
                </div>
              </div>

              <div className="mt-6 p-4 bg-primary/5 border border-primary/10 rounded-2xl flex justify-between items-center">
                <span className="text-[10px] font-black text-primary uppercase">Status</span>
                <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${getStatusColor(selectedPatient.status)}`}>
                  {selectedPatient.status}
                </span>
              </div>
            </div>

            <div className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Clinical Snapshot</h3>
              <div className="space-y-4">
                <div className="p-4 bg-danger/5 border border-danger/10 rounded-2xl">
                  <p className="text-[9px] font-black text-danger uppercase mb-2">Allergies</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedPatient.allergies?.length ? selectedPatient.allergies.map((a: string) => (
                      <span key={a} className="bg-white px-2 py-1 rounded-lg text-[10px] font-bold text-danger border border-danger/20">{a}</span>
                    )) : <span className="text-[10px] text-slate-400 italic">No known allergies</span>}
                  </div>
                </div>
                <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl">
                  <p className="text-[9px] font-black text-amber-600 uppercase mb-2">Chronic Conditions</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedPatient.chronic_conditions?.length ? selectedPatient.chronic_conditions.map((c: string) => (
                      <span key={c} className="bg-white px-2 py-1 rounded-lg text-[10px] font-bold text-amber-600 border border-amber-200">{c}</span>
                    )) : <span className="text-[10px] text-slate-400 italic">No recorded conditions</span>}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-12 lg:col-span-8 space-y-8">
            <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm">
              <div className="flex justify-between items-center mb-10">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">EMR Timeline</h3>
              </div>

              <div className="relative space-y-8 before:absolute before:inset-0 before:left-5 before:w-0.5 before:bg-slate-50 before:h-full">
                {selectedPatient.history?.length ? selectedPatient.history.map((h: any, i: number) => (
                  <div key={i} className="relative pl-12 flex gap-6">
                    <div className="absolute left-3 w-4 h-4 rounded-full bg-white border-4 border-primary mt-1 shadow-sm"></div>
                    <div className="flex-1 p-6 bg-hospital-bg rounded-3xl border border-slate-100 group hover:bg-white hover:shadow-xl transition-all">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="text-[9px] font-black text-primary uppercase tracking-widest">{h.type} Visit</p>
                          <h4 className="text-base font-black text-slate-900 mt-1">{h.reason || 'Visit'}</h4>
                        </div>
                        <span className="text-[10px] font-bold text-slate-400">{new Date(h.date).toLocaleDateString()}</span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">Attending: <span className="text-slate-900 font-bold">{h.doctor}</span></p>
                    </div>
                  </div>
                )) : (
                  <div className="text-center py-12 text-slate-400 text-sm">No visit history yet</div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <button className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary text-2xl mx-auto mb-4 group-hover:bg-primary group-hover:text-white transition-all">🖋️</div>
                <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Order Lab/Rad</p>
              </button>
              <button className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                <div className="w-12 h-12 bg-success/5 rounded-2xl flex items-center justify-center text-success text-2xl mx-auto mb-4 group-hover:bg-success group-hover:text-white transition-all">🏥</div>
                <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Admit / Transfer</p>
              </button>
              <button className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all group">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 text-2xl mx-auto mb-4 group-hover:bg-slate-900 group-hover:text-white transition-all">📁</div>
                <p className="text-[10px] font-black text-slate-900 uppercase tracking-widest">Upload Docs</p>
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Registration Form
  if (showRegisterForm) {
    return (
      <div className="space-y-10 animate-in fade-in duration-500 max-w-3xl mx-auto">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Register New Patient</h2>
            <p className="text-sm font-medium text-slate-500">Enter patient details to create a new record.</p>
          </div>
          <button onClick={() => setShowRegisterForm(false)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest">
            Cancel
          </button>
        </div>

        <form onSubmit={handleRegister} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Full Name *</label>
              <input value={newPatient.name} onChange={e => setNewPatient({ ...newPatient, name: e.target.value })}
                className="w-full bg-hospital-bg border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-1 focus:ring-primary/20 outline-none" required />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Date of Birth *</label>
              <input type="date" value={newPatient.date_of_birth} onChange={e => setNewPatient({ ...newPatient, date_of_birth: e.target.value })}
                className="w-full bg-hospital-bg border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-1 focus:ring-primary/20 outline-none" required />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Gender *</label>
              <select value={newPatient.gender} onChange={e => setNewPatient({ ...newPatient, gender: e.target.value })}
                className="w-full bg-hospital-bg border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-1 focus:ring-primary/20 outline-none" required>
                <option value="">Select</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Blood Group</label>
              <input value={newPatient.blood_group} onChange={e => setNewPatient({ ...newPatient, blood_group: e.target.value })}
                className="w-full bg-hospital-bg border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-1 focus:ring-primary/20 outline-none" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Phone</label>
              <input value={newPatient.phone} onChange={e => setNewPatient({ ...newPatient, phone: e.target.value })}
                className="w-full bg-hospital-bg border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-1 focus:ring-primary/20 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email</label>
              <input type="email" value={newPatient.email} onChange={e => setNewPatient({ ...newPatient, email: e.target.value })}
                className="w-full bg-hospital-bg border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-1 focus:ring-primary/20 outline-none" />
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Address</label>
            <input value={newPatient.address} onChange={e => setNewPatient({ ...newPatient, address: e.target.value })}
              className="w-full bg-hospital-bg border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-1 focus:ring-primary/20 outline-none" />
          </div>
          <div className="grid grid-cols-3 gap-5">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">City</label>
              <input value={newPatient.city} onChange={e => setNewPatient({ ...newPatient, city: e.target.value })}
                className="w-full bg-hospital-bg border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-1 focus:ring-primary/20 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">State</label>
              <input value={newPatient.state} onChange={e => setNewPatient({ ...newPatient, state: e.target.value })}
                className="w-full bg-hospital-bg border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-1 focus:ring-primary/20 outline-none" />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Pincode</label>
              <input value={newPatient.pincode} onChange={e => setNewPatient({ ...newPatient, pincode: e.target.value })}
                className="w-full bg-hospital-bg border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-1 focus:ring-primary/20 outline-none" />
            </div>
          </div>
          <button type="submit" disabled={saving}
            className="w-full bg-primary text-white font-black py-4 rounded-2xl mt-4 hover:bg-blue-700 shadow-xl shadow-primary/20 transition-all active:scale-[0.98] disabled:opacity-50">
            {saving ? '⏳ Registering...' : '✓ Register Patient'}
          </button>
        </form>
      </div>
    );
  }

  // Main patient list
  return (
    <div className="space-y-10 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Master Patient Index</h2>
          <p className="text-sm font-medium text-slate-500">Search and manage clinical identities across Jeeva Raksha.</p>
        </div>
        <div className="flex w-full md:w-auto gap-4">
          <div className="relative flex-1 md:w-80">
            <input
              type="text"
              placeholder="Search by Name or UHID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-12 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-primary/20 shadow-sm"
            />
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
          </div>
          {isAdmin && (
            <button onClick={() => setShowRegisterForm(true)}
              className="px-6 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-700 transition-all">
              + Register
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="bg-danger/10 border border-danger/20 text-danger p-4 rounded-2xl text-sm font-bold">
          ⚠️ {error} — Make sure the backend server is running (npm run server)
        </div>
      )}

      <div className="bg-white rounded-[3rem] border border-slate-100 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] bg-slate-50/50">
                <th className="px-10 py-6">Patient Identity</th>
                <th className="px-10 py-6">Demographics</th>
                <th className="px-10 py-6">Contact</th>
                <th className="px-10 py-6">Status</th>
                <th className="px-10 py-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="text-4xl mb-4 animate-spin opacity-30">⏳</div>
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">Loading patients...</p>
                  </td>
                </tr>
              ) : patients.length > 0 ? patients.map(p => (
                <tr key={p.id} className="group hover:bg-hospital-bg transition-colors cursor-pointer" onClick={() => setSelectedPatient(p)}>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary font-black shadow-inner border border-primary/10">
                        {p.name?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-900 leading-none">{p.name}</p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1.5">{p.uhid}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-10 py-8">
                    <p className="text-xs font-bold text-slate-600">{calcAge(p.date_of_birth)}y • {p.gender}</p>
                    <p className="text-[9px] font-black text-danger uppercase mt-1">{p.blood_group || '—'}</p>
                  </td>
                  <td className="px-10 py-8">
                    <p className="text-xs font-bold text-slate-600">{p.phone || '—'}</p>
                    <p className="text-[9px] text-slate-400 mt-1">{p.city || ''}</p>
                  </td>
                  <td className="px-10 py-8">
                    <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase border ${getStatusColor(p.status)}`}>
                      {p.status}
                    </span>
                  </td>
                  <td className="px-10 py-8 text-right">
                    <div className="flex justify-end gap-2">
                      {isAdmin && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm(`Are you sure you want to delete ${p.name}? This will be logged.`)) {
                              api.deletePatient(p.id).then(() => fetchPatients());
                            }
                          }}
                          className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-danger hover:border-danger/20 hover:shadow-lg transition-all"
                        >
                          <span className="text-xl">🗑️</span>
                        </button>
                      )}
                      <button className="p-3 bg-white border border-slate-100 rounded-xl text-slate-400 hover:text-primary hover:border-primary/20 hover:shadow-lg transition-all">
                        <span className="text-xl">➔</span>
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="py-24 text-center">
                    <div className="text-4xl mb-4 grayscale opacity-20">🔎</div>
                    <p className="text-sm font-black text-slate-400 uppercase tracking-widest">No matching patients found</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Patients;
