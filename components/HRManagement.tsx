
import React, { useState, useEffect } from 'react';
import { useToast } from '../context/ToastContext';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const HRManagement: React.FC = () => {
    const { showToast } = useToast();
    const { user, canPerformAction } = useAuth();
    const isAdmin = canPerformAction('HR', 'ADMIN');
    const [activeTab, setActiveTab] = useState<'ROSTER' | 'LEAVES' | 'ATTENDANCE'>('ROSTER');
    const [approving, setApproving] = useState<string | null>(null);
    const [staff, setStaff] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newDoc, setNewDoc] = useState({
        name: '', role: 'Doctor', department: '', email: '', phone: '', specialization: '', employee_id: ''
    });

    const fetchStaff = async () => {
        try {
            setLoading(true);
            const doctors = await api.getDoctors();
            setStaff(doctors);
        } catch (err: any) {
            showToast('error', `Failed to load staff: ${err.message}`);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, []);

    const handleAddDoctor = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            if (newDoc.id) {
                await api.updateDoctor(newDoc.id, newDoc);
                showToast('success', 'Staff member updated successfully');
            } else {
                await api.createDoctor(newDoc);
                showToast('success', 'Staff member added successfully');
            }
            setShowAddForm(false);
            setNewDoc({ name: '', role: 'Doctor', department: '', email: '', phone: '', specialization: '', employee_id: '' });
            fetchStaff();
        } catch (err: any) {
            showToast('error', err.message);
        }
    };

    const handleEditDoctor = (doc: any) => {
        setNewDoc({ ...doc });
        setShowAddForm(true);
    };

    const handleDeleteDoctor = async (id: string, name: string) => {
        if (!confirm(`Are you sure you want to remove ${name}?`)) return;
        try {
            await api.deleteDoctor(id);
            showToast('success', 'Staff member removed');
            fetchStaff();
        } catch (err: any) {
            showToast('error', err.message);
        }
    };

    const leaves = [
        { id: 'LV001', staff: 'Dr. Sunita Rao', type: 'Casual Leave', from: '2026-02-18', to: '2026-02-20', days: 3, status: 'Approved', reason: 'Personal' },
        { id: 'LV002', staff: 'Nurse Kavitha R.', type: 'Sick Leave', from: '2026-02-19', to: '2026-02-19', days: 1, status: 'Pending', reason: 'Fever' },
        { id: 'LV003', staff: 'Ravi Kumar', type: 'Earned Leave', from: '2026-02-25', to: '2026-03-01', days: 5, status: 'Pending', reason: 'Family function' },
        { id: 'LV004', staff: 'Ganesh P.', type: 'Casual Leave', from: '2026-02-14', to: '2026-02-14', days: 1, status: 'Approved', reason: 'Personal' },
    ];

    const attendance = [
        { dept: 'Surgery', total: 12, present: 10, leaves: 1, absent: 1 },
        { dept: 'Internal Medicine', total: 8, present: 7, leaves: 1, absent: 0 },
        { dept: 'ICU', total: 15, present: 12, leaves: 2, absent: 1 },
        { dept: 'General Ward', total: 20, present: 18, leaves: 1, absent: 1 },
        { dept: 'OT', total: 6, present: 6, leaves: 0, absent: 0 },
        { dept: 'Pathology', total: 5, present: 4, leaves: 1, absent: 0 },
        { dept: 'Radiology', total: 4, present: 3, leaves: 1, absent: 0 },
        { dept: 'Admin', total: 10, present: 9, leaves: 0, absent: 1 },
    ];

    const handleApproveLeave = async (id: string) => {
        setApproving(id);
        await new Promise(r => setTimeout(r, 1000));
        showToast('success', `Leave ${id} approved successfully`);
        setApproving(null);
    };

    const onDuty = staff.filter(s => s.status === 'active' || !s.status).length;
    const onLeave = 0; // staff.filter(s => s.status === 'On Leave').length;
    const pendingLeaves = leaves.filter(l => l.status === 'Pending').length;

    if (showAddForm) {
        return (
            <div className="space-y-10 animate-in fade-in duration-500 max-w-2xl mx-auto py-10">
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                            {newDoc.id ? 'Edit Staff Member' : 'Add Staff Member'}
                        </h2>
                        <p className="text-sm font-medium text-slate-500">
                            {newDoc.id ? 'Update staff details.' : 'Register a new doctor or specialist.'}
                        </p>
                    </div>
                    <button onClick={() => setShowAddForm(false)} className="px-6 py-3 bg-slate-100 text-slate-600 rounded-2xl font-black text-xs uppercase tracking-widest">
                        Cancel
                    </button>
                </div>

                <form onSubmit={handleAddDoctor} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-sm space-y-6">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Full Name *</label>
                        <input value={newDoc.name} onChange={e => setNewDoc({ ...newDoc, name: e.target.value })}
                            className="w-full bg-hospital-bg border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-1 focus:ring-primary/20 outline-none" required />
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Department *</label>
                            <input value={newDoc.department} onChange={e => setNewDoc({ ...newDoc, department: e.target.value })}
                                className="w-full bg-hospital-bg border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-1 focus:ring-primary/20 outline-none" required />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Specialization</label>
                            <input value={newDoc.specialization} onChange={e => setNewDoc({ ...newDoc, specialization: e.target.value })}
                                className="w-full bg-hospital-bg border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-1 focus:ring-primary/20 outline-none" />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-5">
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Email</label>
                            <input type="email" value={newDoc.email} onChange={e => setNewDoc({ ...newDoc, email: e.target.value })}
                                className="w-full bg-hospital-bg border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-1 focus:ring-primary/20 outline-none" />
                        </div>
                        <div className="space-y-2">
                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Phone</label>
                            <input value={newDoc.phone} onChange={e => setNewDoc({ ...newDoc, phone: e.target.value })}
                                className="w-full bg-hospital-bg border-none rounded-2xl px-4 py-3 text-sm font-bold focus:ring-1 focus:ring-primary/20 outline-none" />
                        </div>
                    </div>
                    <button type="submit"
                        className="w-full bg-primary text-white font-black py-4 rounded-2xl mt-4 hover:bg-blue-700 shadow-xl shadow-primary/20 transition-all active:scale-[0.98]">
                        {newDoc.id ? '✓ Update Member' : '✓ Register Member'}
                    </button>
                </form>
            </div>
        );
    }

    return (
        <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">HR & Workforce</h2>
                    <p className="text-sm font-medium text-slate-500 font-kannada">"ತಂಡದ ಬಲ — ಸೇವೆಯ ಬಲ" — Team strength is service strength.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => showToast('info', 'Shift planner opening...')} className="px-5 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 shadow-sm transition-all">📅 Shift Planner</button>
                    {isAdmin && (
                        <button onClick={() => setShowAddForm(true)} className="px-6 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-700 transition-all">+ Add Staff</button>
                    )}
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                    { label: 'Total Staff', value: staff.length.toString(), color: 'text-slate-900', icon: '👥' },
                    { label: 'On Duty', value: onDuty.toString().padStart(2, '0'), color: 'text-success', icon: '✅' },
                    { label: 'On Leave', value: onLeave.toString().padStart(2, '0'), color: 'text-warning', icon: '🏖️' },
                    { label: 'Pending Leaves', value: pendingLeaves.toString().padStart(2, '0'), color: 'text-primary', icon: '📋' },
                ].map(s => (
                    <div key={s.label} className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-3">
                            <span className="text-xl">{s.icon}</span>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.label}</p>
                        </div>
                        <p className={`text-3xl font-black ${s.color} tracking-tighter`}>{s.value}</p>
                    </div>
                ))}
            </div>

            {/* Tabs */}
            <div className="flex bg-hospital-bg p-1.5 rounded-2xl border border-slate-100 w-fit">
                {([['ROSTER', 'Staff Roster'], ['LEAVES', 'Leave Requests'], ['ATTENDANCE', 'Attendance']] as const).map(([key, label]) => (
                    <button key={key} onClick={() => setActiveTab(key as any)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === key ? 'bg-white text-primary shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>{label}</button>
                ))}
            </div>

            {activeTab === 'ROSTER' && (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Staff Roster — {staff.length} Members</h3>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {loading ? (
                            <div className="p-20 text-center text-slate-400 font-bold uppercase tracking-widest text-xs">Loading rosters...</div>
                        ) : staff.map(s => (
                            <div key={s.id} className="px-8 py-5 flex items-center gap-6 hover:bg-hospital-bg/50 transition-colors">
                                <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-lg shrink-0">
                                    {(s.role || '').includes('Dr') || (s.employee_id || '').startsWith('DOC') || s.specialization ? '🩺' : '🧑‍💼'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-slate-800">{s.name}</p>
                                    <p className="text-[10px] font-bold text-slate-400">{s.role || 'Specialist'} • {s.department || s.dept} {s.specialization ? `• ${s.specialization}` : ''}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest shrink-0 ${s.status === 'active' || !s.status ? 'bg-success/10 text-success' : 'bg-slate-100 text-slate-400'}`}>{s.status || 'active'}</span>
                                {isAdmin && (
                                    <div className="flex gap-2">
                                        <button onClick={() => handleEditDoctor(s)} className="p-2 text-slate-300 hover:text-primary hover:bg-primary/5 rounded-lg transition-all text-xs">✎</button>
                                        <button onClick={() => handleDeleteDoctor(s.id, s.name)} className="p-2 text-slate-300 hover:text-danger hover:bg-danger/5 rounded-lg transition-all text-xs">🗑️</button>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'LEAVES' && (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Leave Requests</h3>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {leaves.map(l => (
                            <div key={l.id} className="px-8 py-5 flex items-center gap-6 hover:bg-hospital-bg/50 transition-colors">
                                <div className="w-10 h-10 bg-warning/5 rounded-xl flex items-center justify-center text-lg shrink-0">📋</div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-slate-800">{l.staff}</p>
                                    <p className="text-[10px] font-bold text-slate-400">{l.type} • {l.from} to {l.to} ({l.days} day{l.days > 1 ? 's' : ''}) • {l.reason}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest shrink-0 ${l.status === 'Approved' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>{l.status}</span>
                                {l.status === 'Pending' && isAdmin && (
                                    <button onClick={() => handleApproveLeave(l.id)} disabled={approving === l.id} className="px-5 py-2 bg-success text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-green-700 transition-all disabled:opacity-50 shrink-0">
                                        {approving === l.id ? 'Approving...' : 'Approve'}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'ATTENDANCE' && (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Department-wise Attendance — Today</h3>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {attendance.map(a => (
                            <div key={a.dept} className="px-8 py-5 flex items-center gap-6 hover:bg-hospital-bg/50 transition-colors">
                                <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-lg shrink-0">🏥</div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-slate-800">{a.dept}</p>
                                    <p className="text-[10px] font-bold text-slate-400">Total: {a.total} staff members</p>
                                </div>
                                <div className="flex gap-4 shrink-0">
                                    <div className="text-center">
                                        <p className="text-sm font-black text-success">{a.present}</p>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Present</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-black text-warning">{a.leaves}</p>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Leave</p>
                                    </div>
                                    <div className="text-center">
                                        <p className="text-sm font-black text-danger">{a.absent}</p>
                                        <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Absent</p>
                                    </div>
                                </div>
                                <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden shrink-0">
                                    <div className="h-full bg-success rounded-full" style={{ width: `${(a.present / a.total) * 100}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default HRManagement;
