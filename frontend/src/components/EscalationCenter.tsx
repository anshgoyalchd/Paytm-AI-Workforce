import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  UserCheck, 
  Clock, 
  ShieldAlert, 
  ArrowRight,
  Send,
  X
} from 'lucide-react';
import { Escalation } from '../types';
import { api } from '../services/api';

interface EscalationCenterProps {
  escalations: Escalation[];
  onEscalationResolved: () => void;
  isLoading: boolean;
}

export const EscalationCenter: React.FC<EscalationCenterProps> = ({
  escalations,
  onEscalationResolved,
  isLoading,
}) => {
  const [selectedEscalation, setSelectedEscalation] = useState<Escalation | null>(null);
  const [resolutionText, setResolutionText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleResolve = async () => {
    if (!selectedEscalation || !resolutionText.trim()) return;
    try {
      setIsSubmitting(true);
      await api.resolveEscalation(selectedEscalation.id, resolutionText);
      setSelectedEscalation(null);
      setResolutionText('');
      onEscalationResolved();
    } catch (err) {
      console.error('Failed to resolve escalation:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const openEscalations = escalations.filter((e) => e.status === 'OPEN');
  const resolvedEscalations = escalations.filter((e) => e.status === 'RESOLVED');

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800 flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-400" />
            Human-in-the-Loop Escalation Center
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Cases routed from the autonomous employee requiring operator authorization, dispute resolution, hardship review, or legal settlement approvals.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold">
            {openEscalations.length} Pending Review
          </div>
        </div>
      </div>

      {/* Escalations Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-300">Open Escalation Queue</h3>
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading escalation queue...</div>
        ) : openEscalations.length === 0 ? (
          <div className="p-12 rounded-2xl bg-slate-900/40 border border-slate-800 text-center text-slate-400 text-xs flex flex-col items-center justify-center gap-2">
            <CheckCircle2 className="w-8 h-8 text-emerald-400" />
            <span>Zero pending escalations! All autonomous collections running smoothly.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {openEscalations.map((esc) => (
              <div 
                key={esc.id}
                className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      Case: {esc.case_id}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      esc.priority === 'HIGH' ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                    }`}>
                      {esc.priority} PRIORITY
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="text-xs text-slate-400">Escalation Trigger:</div>
                    <div className="text-sm font-bold text-white mt-0.5">
                      {esc.reason.replace(/_/g, ' ')}
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-slate-400">
                    Logged {new Date(esc.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setSelectedEscalation(esc)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-paytm-cyan text-slate-950 hover:bg-sky-400 transition-all"
                  >
                    <UserCheck className="w-3.5 h-3.5" />
                    <span>Review & Resolve</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resolved History */}
      {resolvedEscalations.length > 0 && (
        <div className="space-y-3 pt-6 border-t border-slate-800">
          <h3 className="text-sm font-semibold text-slate-400">Resolved History</h3>
          <div className="space-y-2">
            {resolvedEscalations.map((esc) => (
              <div 
                key={esc.id}
                className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-300">{esc.reason}</span>
                  <span className="text-slate-500 ml-2">• Case {esc.case_id}</span>
                  {esc.resolution && (
                    <div className="text-slate-400 text-[11px] mt-0.5">Resolution: "{esc.resolution}"</div>
                  )}
                </div>
                <div className="flex items-center gap-2 text-[11px] text-emerald-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Resolved {esc.resolved_at ? new Date(esc.resolved_at).toLocaleDateString('en-IN') : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Resolution Modal */}
      {selectedEscalation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div className="w-full max-w-md p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-sm font-bold text-white">Resolve Escalation: {selectedEscalation.reason}</h3>
              <button onClick={() => setSelectedEscalation(null)} className="text-slate-400 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-400">
              Provide human resolution instructions for this case. Once resolved, the case state will be updated and automated collection behavior adjusted accordingly.
            </div>

            <textarea
              rows={3}
              placeholder="Enter resolution notes (e.g., 'Granted 10% waiver and scheduled callback for Monday' or 'Approved return refund')..."
              value={resolutionText}
              onChange={(e) => setResolutionText(e.target.value)}
              className="w-full p-3 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-paytm-cyan"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedEscalation(null)}
                className="px-3.5 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={isSubmitting || !resolutionText.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-emerald-500 text-slate-950 hover:bg-emerald-400 disabled:opacity-50 transition-all"
              >
                {isSubmitting ? 'Saving...' : 'Confirm Resolution'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
