
import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';

const HRManagement: React.FC = () => {
    const { showToast } = useToast();
    const [activeTab, setActiveTab] = useState<'ROSTER' | 'LEAVES' | 'ATTENDANCE'>('ROSTER');
    const [approving, setApproving] = useState<string | null>(null);

    const staff = [
        { id: 'DOC001', name: 'Dr. Ramesh Sharma', role: 'Senior Surgeon', dept: 'Surgery', shift: 'Day', status: 'On Duty', phone: '+91 98765 00001' },
        { id: 'DOC002', name: 'Dr. Priya Das', role: 'Physician', dept: 'Internal Medicine', shift: 'Day', status: 'On Duty', phone: '+91 98765 00002' },
        { id: 'NUR001', name: 'Nurse Kavitha R.', role: 'Head Nurse', dept: 'ICU', shift: 'Night', status: 'Off Duty', phone: '+91 98765 00003' },
        { id: 'NUR002', name: 'Nurse Deepa M.', role: 'Staff Nurse', dept: 'General Ward', shift: 'Day', status: 'On Duty', phone: '+91 98765 00004' },
        { id: 'DOC003', name: 'Dr. Anand Verma', role: 'Anesthetist', dept: 'OT', shift: 'Day', status: 'In Surgery', phone: '+91 98765 00005' },
        { id: 'TEC001', name: 'Ravi Kumar', role: 'Lab Technician', dept: 'Pathology', shift: 'Day', status: 'On Duty', phone: '+91 98765 00006' },
        { id: 'DOC004', name: 'Dr. Sunita Rao', role: 'Radiologist', dept: 'Radiology', shift: 'Day', status: 'On Leave', phone: '+91 98765 00007' },
        { id: 'ADM001', name: 'Ganesh P.', role: 'Admin Officer', dept: 'Admin', shift: 'Day', status: 'On Duty', phone: '+91 98765 00008' },
    ];

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

    const onDuty = staff.filter(s => s.status === 'On Duty' || s.status === 'In Surgery').length;
    const onLeave = staff.filter(s => s.status === 'On Leave').length;
    const pendingLeaves = leaves.filter(l => l.status === 'Pending').length;

    return (
        <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">HR & Workforce</h2>
                    <p className="text-sm font-medium text-slate-500 font-kannada">"ತಂಡದ ಬಲ — ಸೇವೆಯ ಬಲ" — Team strength is service strength.</p>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => showToast('info', 'Shift planner opening...')} className="px-5 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-50 shadow-sm transition-all">📅 Shift Planner</button>
                    <button onClick={() => showToast('info', 'New staff registration form opening...')} className="px-6 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-700 transition-all">+ Add Staff</button>
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
                        {staff.map(s => (
                            <div key={s.id} className="px-8 py-5 flex items-center gap-6 hover:bg-hospital-bg/50 transition-colors">
                                <div className="w-10 h-10 bg-primary/5 rounded-xl flex items-center justify-center text-lg shrink-0">
                                    {s.role.includes('Dr') || s.id.startsWith('DOC') ? '🩺' : s.id.startsWith('NUR') ? '👩‍⚕️' : '🧑‍💼'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-slate-800">{s.name}</p>
                                    <p className="text-[10px] font-bold text-slate-400">{s.role} • {s.dept} • {s.shift} Shift</p>
                                </div>
                                <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest shrink-0 ${s.status === 'On Duty' ? 'bg-success/10 text-success' : s.status === 'In Surgery' ? 'bg-primary/10 text-primary' : s.status === 'On Leave' ? 'bg-warning/10 text-warning' : 'bg-slate-100 text-slate-400'}`}>{s.status}</span>
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
                                {l.status === 'Pending' && (
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
