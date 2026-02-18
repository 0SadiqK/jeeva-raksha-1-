
import React, { useState, useEffect } from 'react';
import { Incident } from '../types';
import api from '../api';

const IncidentReport: React.FC = () => {
  const [showForm, setShowForm] = useState(false);
  const [incidents, setIncidents] = useState<Incident[]>([
    {
      id: 'INC-2026-001',
      type: 'Medication Error',
      description: 'Patient administered incorrect dosage of Insulin Glargine due to label misreading.',
      severity: 'Moderate',
      date: '2026-02-22',
      status: 'Under Review',
      isAnonymous: false
    },
    {
      id: 'INC-2026-002',
      type: 'Fall',
      description: 'Elderly patient slipped in Ward B bathroom; no injuries reported.',
      severity: 'Low',
      date: '2026-02-23',
      status: 'Resolved',
      isAnonymous: true
    }
  ]);

  useEffect(() => {
    const fetchIncidents = async () => {
      try {
        const data = await api.getAuditLogs();
        if (data?.logs && data.logs.length > 0) {
          const incidentLogs = data.logs
            .filter((log: any) => log.entity_type === 'Incident' || log.action?.includes('Incident'))
            .map((log: any) => ({
              id: `INC-${log.id}`,
              type: log.action || 'Other',
              description: log.details || log.action || '',
              severity: 'Low' as const,
              date: log.created_at ? new Date(log.created_at).toISOString().split('T')[0] : '',
              status: 'Reported' as const,
              isAnonymous: false,
            }));
          if (incidentLogs.length > 0) {
            setIncidents(prev => [...incidentLogs, ...prev]);
          }
        }
      } catch { /* keep mock data */ }
    };
    fetchIncidents();
  }, []);

  const [formData, setFormData] = useState<Partial<Incident>>({
    type: 'Other',
    severity: 'Low',
    description: '',
    isAnonymous: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const newIncident: Incident = {
      id: `INC-2026-${String(incidents.length + 1).padStart(3, '0')}`,
      type: formData.type as any,
      description: formData.description || '',
      severity: formData.severity as any,
      date: new Date().toISOString().split('T')[0],
      status: 'Reported',
      isAnonymous: formData.isAnonymous || false
    };
    setIncidents([newIncident, ...incidents]);
    setShowForm(false);
    setFormData({ type: 'Other', severity: 'Low', description: '', isAnonymous: false });

    // Persist to audit log
    try {
      await api.createAuditLog({
        action: `Incident: ${newIncident.type}`,
        entity_type: 'Incident',
        entity_id: newIncident.id,
        details: newIncident.description,
      });
    } catch { /* non-blocking */ }
  };

  const getSeverityColor = (severity: Incident['severity']) => {
    switch (severity) {
      case 'Low': return 'bg-success/10 text-success border-success/20';
      case 'Moderate': return 'bg-warning/10 text-warning border-warning/20';
      case 'High': return 'bg-orange-100 text-orange-600 border-orange-200';
      case 'Critical': return 'bg-danger/10 text-danger border-danger/20 animate-pulse font-black';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  const getStatusColor = (status: Incident['status']) => {
    switch (status) {
      case 'Reported': return 'bg-primary/5 text-primary border-primary/10';
      case 'Under Review': return 'bg-accent/5 text-accent border-accent/10';
      case 'Resolved': return 'bg-success/10 text-success border-success/20';
      default: return 'bg-slate-100 text-slate-500';
    }
  };

  return (
    <div className="max-w-[1200px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Safety & Incident Logging</h2>
          <p className="text-sm font-medium text-slate-500 font-kannada">“ರೋಗಿಯ ಸುರಕ್ಷತೆ ನಮ್ಮ ಆದ್ಯತೆ” — Patient safety is our priority.</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl transition-all active:scale-95 flex items-center gap-3 ${showForm ? 'bg-slate-100 text-slate-500 hover:bg-slate-200' : 'bg-danger text-white hover:bg-red-700 shadow-danger/20'
            }`}
        >
          {showForm ? 'Cancel Report' : '🚨 New Incident Report'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl animate-in zoom-in duration-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Incident Classification</label>
              <select
                value={formData.type}
                onChange={e => setFormData({ ...formData, type: e.target.value as any })}
                className="w-full bg-hospital-bg border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                required
              >
                <option value="Medication Error">Medication Error</option>
                <option value="Fall">Fall</option>
                <option value="Equipment Failure">Equipment Failure</option>
                <option value="Clinical Complication">Clinical Complication</option>
                <option value="Other">Other</option>
              </select>
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Initial Severity Level</label>
              <select
                value={formData.severity}
                onChange={e => setFormData({ ...formData, severity: e.target.value as any })}
                className="w-full bg-hospital-bg border border-slate-100 rounded-2xl px-6 py-4 text-sm font-bold outline-none focus:ring-2 focus:ring-primary/20"
                required
              >
                <option value="Low">Low (No harm)</option>
                <option value="Moderate">Moderate (Minor harm)</option>
                <option value="High">High (Significant harm)</option>
                <option value="Critical">Critical (Severe harm/Death)</option>
              </select>
            </div>
          </div>

          <div className="space-y-3 mb-10">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Detailed Description of Events</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Provide a clear, factual account of the incident..."
              className="w-full bg-hospital-bg border border-slate-100 rounded-[2rem] px-6 py-4 text-sm font-medium h-40 outline-none focus:ring-2 focus:ring-primary/20 resize-none"
              required
            />
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-slate-50 pt-8">
            <div className="flex items-center gap-4">
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.isAnonymous}
                  onChange={e => setFormData({ ...formData, isAnonymous: e.target.checked })}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
              <span className="text-xs font-bold text-slate-500 uppercase tracking-widest">Report Anonymously</span>
            </div>
            <button
              type="submit"
              className="w-full sm:w-auto px-12 py-5 bg-slate-900 text-white rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-slate-800 shadow-xl transition-all"
            >
              Submit Official Record
            </button>
          </div>
        </form>
      )}

      <div className="space-y-6">
        <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] px-4">Historical Safety Logs</h3>
        <div className="grid grid-cols-1 gap-6">
          {incidents.map(inc => (
            <div key={inc.id} className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
              <div className="flex flex-col md:flex-row justify-between gap-6 items-start">
                <div className="space-y-4 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl group-hover:scale-125 transition-transform duration-500">
                      {inc.type === 'Medication Error' ? '💊' : inc.type === 'Fall' ? '🩹' : inc.type === 'Equipment Failure' ? '⚙️' : '⚠️'}
                    </span>
                    <div>
                      <h4 className="text-xl font-black text-slate-900 tracking-tight">{inc.type}</h4>
                      <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-1">{inc.id} • Recorded {inc.date}</p>
                    </div>
                  </div>
                  <p className="text-sm text-hospital-slate font-medium leading-relaxed italic">"{inc.description}"</p>
                  {inc.isAnonymous && (
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 rounded-lg text-[10px] font-black text-slate-500 uppercase tracking-widest">
                      👤 Anonymous Source
                    </div>
                  )}
                </div>

                <div className="flex flex-row md:flex-col gap-3 items-end w-full md:w-auto">
                  <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border text-center min-w-[120px] ${getSeverityColor(inc.severity)}`}>
                    {inc.severity} Risk
                  </span>
                  <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border text-center min-w-[120px] ${getStatusColor(inc.status)}`}>
                    {inc.status}
                  </span>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-50 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity">
                <button className="text-[10px] font-black text-primary uppercase tracking-widest hover:underline">Full Investigation Log →</button>
                <p className="text-[9px] font-bold text-slate-400 uppercase">Last updated: 2 hrs ago</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-primary/5 p-12 rounded-[4rem] border border-primary/10 text-center space-y-4">
        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center text-3xl mx-auto shadow-sm">🛡️</div>
        <h3 className="text-xl font-black text-slate-900">Zero Harm Philosophy</h3>
        <p className="text-sm text-hospital-slate font-medium max-w-xl mx-auto font-kannada">
          “ದೋಷಮುಕ್ತ ಸೇವೆ — ಸುರಕ್ಷಿತ ಚಿಕಿತ್ಸೆ”<br />
          Every report is a step towards a safer hospital environment. Our system ensures non-punitive, data-driven improvement.
        </p>
      </div>
    </div>
  );
};

export default IncidentReport;
