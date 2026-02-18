
import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { OVERRIDE_DURATION_SECONDS } from '../types.ts';

interface EmergencyOverrideProps {
  onClose: () => void;
}

const EmergencyOverride: React.FC<EmergencyOverrideProps> = ({ onClose }) => {
  const { triggerEmergencyOverride } = useAuth();
  const [reason, setReason] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);

  const durationMinutes = Math.floor(OVERRIDE_DURATION_SECONDS / 60);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (reason.trim().length < 10 || !acknowledged) return;
    triggerEmergencyOverride(reason);
    onClose();
  };

  const canSubmit = reason.trim().length >= 10 && acknowledged;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in">
      <div className="bg-white w-full max-w-md rounded-[3rem] p-12 shadow-2xl space-y-8">
        <div className="w-20 h-20 bg-danger/10 rounded-3xl flex items-center justify-center text-4xl mx-auto shadow-inner animate-pulse">🚨</div>
        <div className="text-center space-y-3">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Emergency Access Request</h2>
          <p className="text-sm text-slate-500 font-medium leading-relaxed">
            Activating this override will grant full <span className="text-danger font-bold">Administrative privileges</span> for <span className="font-bold text-slate-800">{durationMinutes} minutes</span>.
          </p>
        </div>

        {/* Warning Banner */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2">
          <div className="flex items-center gap-2">
            <span className="text-amber-600 text-lg">⚠️</span>
            <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">Audit Notice</span>
          </div>
          <p className="text-[11px] text-amber-700 leading-relaxed font-medium">
            This action is <span className="font-bold">permanently logged</span> with your identity, timestamp, and reason. The override will <span className="font-bold">auto-expire after {durationMinutes} minutes</span>.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">Reason for Override (Min 10 chars)</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describe the clinical emergency requiring elevated access..."
              className="w-full bg-hospital-bg border border-slate-100 rounded-2xl p-4 text-sm font-medium h-28 focus:ring-2 focus:ring-danger/20 outline-none resize-none"
              required
            />
          </div>

          {/* Dual Confirmation Checkbox */}
          <label className="flex items-start gap-3 cursor-pointer group">
            <input
              type="checkbox"
              checked={acknowledged}
              onChange={(e) => setAcknowledged(e.target.checked)}
              className="mt-0.5 w-5 h-5 rounded-md border-2 border-slate-300 text-danger focus:ring-danger/30 accent-red-600 shrink-0 cursor-pointer"
            />
            <span className="text-[11px] text-slate-600 font-semibold leading-relaxed group-hover:text-slate-800 transition-colors">
              I confirm this is a <span className="text-danger font-bold">medical emergency</span> and I accept full accountability for actions taken during this elevated access session.
            </span>
          </label>

          <div className="flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 bg-slate-100 text-slate-500 rounded-2xl font-black text-xs uppercase transition-all hover:bg-slate-200">Cancel</button>
            <button
              type="submit"
              disabled={!canSubmit}
              className="flex-1 py-4 bg-danger text-white rounded-2xl font-black text-xs uppercase shadow-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed hover:bg-red-700 active:scale-95"
            >
              Activate STAT
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EmergencyOverride;
