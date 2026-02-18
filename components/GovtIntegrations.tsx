
import React, { useState } from 'react';
import { useToast } from '../context/ToastContext';

const GovtIntegrations: React.FC = () => {
    const { showToast } = useToast();
    const [submitting, setSubmitting] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<'ABDM' | 'REPORTS' | 'CERTIFICATES'>('ABDM');

    const abdmStatus = [
        { feature: 'ABHA ID Registration', status: 'Active', lastSync: '2026-02-18 09:00', records: 8421 },
        { feature: 'Health Information Exchange', status: 'Active', lastSync: '2026-02-18 08:45', records: 6240 },
        { feature: 'Consent Management', status: 'Active', lastSync: '2026-02-18 09:15', records: 5103 },
        { feature: 'Digital Health Locker', status: 'Active', lastSync: '2026-02-18 08:30', records: 4890 },
        { feature: 'Vaccination Records', status: 'Pending Setup', lastSync: '-', records: 0 },
    ];

    const govtReports = [
        { id: 'RPT001', name: 'HMIS Monthly Return', authority: 'MoHFW', dueDate: '2026-02-28', status: 'Not Submitted', period: 'Feb 2026' },
        { id: 'RPT002', name: 'IDSP (Disease Surveillance)', authority: 'NCDC', dueDate: '2026-02-20', status: 'Submitted', period: 'Week 7' },
        { id: 'RPT003', name: 'Birth & Death Returns', authority: 'RBD', dueDate: '2026-03-05', status: 'Not Submitted', period: 'Jan 2026' },
        { id: 'RPT004', name: 'PCPNDT Form F', authority: 'State PCPNDT', dueDate: '2026-02-25', status: 'Submitted', period: 'Feb 2026' },
        { id: 'RPT005', name: 'Bio-Medical Waste Report', authority: 'CPCB', dueDate: '2026-02-28', status: 'Draft', period: 'Feb 2026' },
    ];

    const certificates = [
        { type: 'Birth Certificate', issued: 42, pending: 3, icon: '👶' },
        { type: 'Death Certificate', issued: 8, pending: 1, icon: '📜' },
        { type: 'Medical Fitness', issued: 156, pending: 12, icon: '💪' },
        { type: 'Disability Certificate', issued: 14, pending: 2, icon: '♿' },
    ];

    const handleSubmitReport = async (id: string) => {
        setSubmitting(id);
        await new Promise(r => setTimeout(r, 1500));
        showToast('success', `Report ${id} submitted to government portal`);
        setSubmitting(null);
    };

    const handleGenerateCert = (type: string) => {
        showToast('info', `Generating ${type} form...`);
    };

    return (
        <div className="max-w-[1600px] mx-auto animate-in fade-in duration-500 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
                <div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Government Integrations</h2>
                    <p className="text-sm font-medium text-slate-500 font-kannada">"ಸರ್ಕಾರಿ ಅನುಸರಣೆ — ಪಾರದರ್ಶಕ ಆರೋಗ್ಯ" — Government compliance, transparent healthcare.</p>
                </div>
                <button onClick={() => showToast('info', 'Refreshing government portal connections...')} className="px-6 py-3 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl shadow-primary/20 hover:bg-blue-700 transition-all">🔄 Sync All Portals</button>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                    { label: 'ABHA IDs Linked', value: '8,421', color: 'text-primary', icon: '🏛️' },
                    { label: 'Reports Due', value: govtReports.filter(r => r.status !== 'Submitted').length.toString().padStart(2, '0'), color: 'text-warning', icon: '📋' },
                    { label: 'Certs Issued (Month)', value: certificates.reduce((s, c) => s + c.issued, 0).toString(), color: 'text-success', icon: '📜' },
                    { label: 'Compliance Score', value: '96%', color: 'text-success', icon: '✅' },
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
                {([['ABDM', 'ABDM / NDHM'], ['REPORTS', 'Govt Reports'], ['CERTIFICATES', 'Certificates']] as const).map(([key, label]) => (
                    <button key={key} onClick={() => setActiveTab(key as any)} className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === key ? 'bg-white text-primary shadow-sm border border-slate-100' : 'text-slate-400 hover:text-slate-600'}`}>{label}</button>
                ))}
            </div>

            {activeTab === 'ABDM' && (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Ayushman Bharat Digital Mission — Integration Status</h3>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {abdmStatus.map(item => (
                            <div key={item.feature} className="px-8 py-5 flex items-center gap-6 hover:bg-hospital-bg/50 transition-colors">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${item.status === 'Active' ? 'bg-success/10' : 'bg-warning/10'}`}>
                                    {item.status === 'Active' ? '✅' : '⏳'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-slate-800">{item.feature}</p>
                                    <p className="text-[10px] font-bold text-slate-400">Last sync: {item.lastSync}</p>
                                </div>
                                {item.records > 0 && (
                                    <div className="text-right shrink-0">
                                        <p className="text-sm font-black text-slate-900">{item.records.toLocaleString()}</p>
                                        <p className="text-[9px] font-bold text-slate-400">records</p>
                                    </div>
                                )}
                                <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest shrink-0 ${item.status === 'Active' ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'}`}>{item.status}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'REPORTS' && (
                <div className="bg-white rounded-[2.5rem] border border-slate-100 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Government Mandatory Reports</h3>
                    </div>
                    <div className="divide-y divide-slate-50">
                        {govtReports.map(rpt => (
                            <div key={rpt.id} className="px-8 py-5 flex items-center gap-6 hover:bg-hospital-bg/50 transition-colors">
                                <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0 ${rpt.status === 'Submitted' ? 'bg-success/10' : rpt.status === 'Draft' ? 'bg-primary/10' : 'bg-warning/10'}`}>
                                    {rpt.status === 'Submitted' ? '✅' : '📄'}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-black text-slate-800">{rpt.name}</p>
                                    <p className="text-[10px] font-bold text-slate-400">{rpt.authority} • {rpt.period} • Due: {rpt.dueDate}</p>
                                </div>
                                <span className={`px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest shrink-0 ${rpt.status === 'Submitted' ? 'bg-success/10 text-success' : rpt.status === 'Draft' ? 'bg-primary/10 text-primary' : 'bg-warning/10 text-warning'}`}>{rpt.status}</span>
                                {rpt.status !== 'Submitted' && (
                                    <button onClick={() => handleSubmitReport(rpt.id)} disabled={submitting === rpt.id} className="px-5 py-2 bg-primary text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-700 transition-all disabled:opacity-50 shrink-0">
                                        {submitting === rpt.id ? 'Submitting...' : 'Submit'}
                                    </button>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {activeTab === 'CERTIFICATES' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {certificates.map(cert => (
                        <div key={cert.type} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-3">
                                    <span className="text-3xl">{cert.icon}</span>
                                    <h4 className="text-lg font-black text-slate-900">{cert.type}</h4>
                                </div>
                                {cert.pending > 0 && <span className="px-2 py-1 bg-warning/10 text-warning rounded-lg text-[8px] font-black uppercase tracking-widest">{cert.pending} Pending</span>}
                            </div>
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Issued This Month</p>
                                    <p className="text-2xl font-black text-success">{cert.issued}</p>
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Pending</p>
                                    <p className="text-2xl font-black text-warning">{cert.pending}</p>
                                </div>
                            </div>
                            <button onClick={() => handleGenerateCert(cert.type)} className="w-full py-3 bg-slate-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-800 transition-all">Generate New ↗</button>
                        </div>
                    ))}
                </div>
            )}

            <div className="bg-slate-900 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl">
                <div className="relative z-10 flex flex-col md:flex-row items-center gap-10">
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center text-3xl">🏛️</div>
                    <div className="flex-1 space-y-2">
                        <h4 className="text-lg font-black text-white">National Digital Health Ecosystem</h4>
                        <p className="text-xs text-slate-400 leading-relaxed font-kannada">"ಡಿಜಿಟಲ್ ಭಾರತ — ಆರೋಗ್ಯ ಭಾರತ" — Fully integrated with ABDM, enabling seamless health data exchange across India.</p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default GovtIntegrations;
