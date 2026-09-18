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
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-rose-600" />
            Human-in-the-Loop Escalation Center
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-xl">
            Cases routed from the autonomous employee requiring operator authorization, dispute resolution, hardship review, or legal settlement approvals.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
            {openEscalations.length} Pending Review
          </div>
        </div>
      </div>

      {/* Escalations Grid */}
      <div className="space-y-4">
        <h3 className="text-sm font-bold text-slate-900">Open Escalation Queue</h3>
        {isLoading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading escalation queue...</div>
        ) : openEscalations.length === 0 ? (
          <div className="p-12 rounded-xl bg-white border border-slate-200 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2 shadow-xs">
            <CheckCircle2 className="w-8 h-8 text-emerald-600" />
            <span className="font-medium">Zero pending escalations! All autonomous collections running smoothly.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {openEscalations.map((esc) => (
              <div 
                key={esc.id}
                className="p-5 rounded-xl bg-white border border-slate-200 hover:border-slate-300 shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                      Case: {esc.case_id}
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                      esc.priority === 'HIGH' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {esc.priority} PRIORITY
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="text-xs font-medium text-slate-500">Escalation Trigger:</div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">
                      {esc.reason.replace(/_/g, ' ')}
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-slate-500">
                    Logged {new Date(esc.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>

                <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setSelectedEscalation(esc)}
                    className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-[#002970] text-white hover:bg-[#001f54] shadow-xs transition-all cursor-pointer"
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
        <div className="space-y-3 pt-6 border-t border-slate-200">
          <h3 className="text-sm font-bold text-slate-900">Resolved History</h3>
          <div className="space-y-2">
            {resolvedEscalations.map((esc) => (
              <div 
                key={esc.id}
                className="p-3.5 rounded-xl bg-white border border-slate-200 shadow-xs flex items-center justify-between text-xs"
              >
                <div>
                  <span className="font-semibold text-slate-900">{esc.reason.replace(/_/g, ' ')}</span>
                  <span className="text-slate-500 ml-2 font-mono">• Case {esc.case_id}</span>
                  {esc.resolution && (
                    <div className="text-slate-600 text-[11px] mt-0.5">Resolution: "{esc.resolution}"</div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full">
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-md p-6 rounded-xl bg-white border border-slate-200 shadow-2xl space-y-4 animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <h3 className="text-sm font-bold text-slate-900">Resolve Escalation: {selectedEscalation.reason.replace(/_/g, ' ')}</h3>
              <button onClick={() => setSelectedEscalation(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs text-slate-600 leading-relaxed">
              Provide human operator resolution instructions for this case. Once resolved, the case state will be updated and automated collection behavior adjusted accordingly.
            </div>

            <textarea
              rows={3}
              placeholder="Enter resolution notes (e.g., 'Granted 10% waiver and scheduled callback for Monday' or 'Approved return refund')..."
              value={resolutionText}
              onChange={(e) => setResolutionText(e.target.value)}
              className="w-full p-3 rounded-lg text-xs bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
            />

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setSelectedEscalation(null)}
                className="px-3.5 py-2 rounded-lg text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleResolve}
                disabled={isSubmitting || !resolutionText.trim()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 transition-all shadow-xs"
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
