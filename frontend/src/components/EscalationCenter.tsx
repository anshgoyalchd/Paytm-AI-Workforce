import React, { useState } from 'react';
import { 
  AlertTriangle, 
  CheckCircle2, 
  UserCheck, 
  Clock, 
  ShieldAlert, 
  ArrowRight,
  Send,
  X,
  Shield,
  Check,
  Filter
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

  const setQuickResolution = (text: string) => {
    setResolutionText(text);
  };

  const openEscalations = escalations.filter((e) => e.status === 'OPEN');
  const resolvedEscalations = escalations.filter((e) => e.status === 'RESOLVED');

  return (
    <div className="space-y-6">
      {/* Paytm Escalation Center Header */}
      <div className="rounded-xl bg-white border border-slate-200/90 shadow-paytm-card overflow-hidden">
        <div className="bg-gradient-to-r from-[#002970] via-[#001f54] to-[#002970] p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-extrabold text-lg tracking-tight">Pay<span className="text-[#00BAF2]">tm</span></span>
              <span className="text-white/60 font-light text-sm">|</span>
              <span className="text-sm font-semibold text-[#00BAF2] tracking-wide uppercase">
                Merchant Risk & Escalations Queue
              </span>
            </div>
            <p className="text-xs text-white/80 mt-1 max-w-xl">
              Cases routed from autonomous AI agent requiring operator authorization, customer dispute handling, hardship relief, or settlement concessions.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="px-3.5 py-1.5 rounded-full bg-rose-500/20 text-rose-200 border border-rose-500/40 text-xs font-bold flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-rose-300" />
              <span>{openEscalations.length} Pending Human Reviews</span>
            </div>
          </div>
        </div>

        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
          <span className="font-medium">
            Human-in-the-Loop Safeguard: Autonomous agent halts aggressive outreach upon customer dispute or hardship.
          </span>
          <span className="text-[11px] font-mono text-slate-500">RBI Compliance: Mandatory Escalation Path</span>
        </div>
      </div>

      {/* Escalations Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-[#002970]" />
            Active Escalation Queue ({openEscalations.length})
          </h3>
          <span className="text-[11px] text-slate-500">Sorted by Severity</span>
        </div>

        {isLoading ? (
          <div className="p-12 text-center text-slate-500 text-xs">Loading escalation queue...</div>
        ) : openEscalations.length === 0 ? (
          <div className="p-12 rounded-xl bg-white border border-slate-200 text-center text-slate-500 text-xs flex flex-col items-center justify-center gap-2 shadow-2xs">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <span className="font-bold text-slate-900 text-sm">Zero Pending Escalations</span>
            <span className="text-slate-500 max-w-sm">
              All active customer conversations are operating within deterministic policy thresholds without exceptions.
            </span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {openEscalations.map((esc) => (
              <div 
                key={esc.id}
                className="p-5 rounded-xl bg-white border border-slate-200/90 hover:border-slate-300 shadow-paytm-card transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs px-2.5 py-1 rounded-md bg-slate-100 text-slate-800 border border-slate-200 font-semibold">
                      Case: {esc.case_id.substring(0, 8)}...
                    </span>
                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                      esc.priority === 'HIGH' 
                        ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {esc.priority} PRIORITY
                    </span>
                  </div>

                  <div className="mt-3">
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Escalation Trigger:</div>
                    <div className="text-sm font-bold text-slate-900 mt-0.5">
                      {esc.reason.replace(/_/g, ' ')}
                    </div>
                  </div>

                  <div className="mt-2 text-xs text-slate-500 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>Logged {new Date(esc.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>

                <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-end gap-2">
                  <button
                    onClick={() => setSelectedEscalation(esc)}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-bold bg-[#002970] text-white hover:bg-[#001f54] shadow-xs transition-all cursor-pointer"
                  >
                    <UserCheck className="w-3.5 h-3.5 text-[#00BAF2]" />
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
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Audit Log — Resolved Escalations ({resolvedEscalations.length})
          </h3>
          <div className="space-y-2">
            {resolvedEscalations.map((esc) => (
              <div 
                key={esc.id}
                className="p-3.5 rounded-xl bg-white border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900">{esc.reason.replace(/_/g, ' ')}</span>
                    <span className="text-slate-500 font-mono text-[11px]">Case {esc.case_id.substring(0, 8)}...</span>
                  </div>
                  {esc.resolution && (
                    <div className="text-slate-600 text-[11px] mt-1 italic">
                      Resolution: "{esc.resolution}"
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full shrink-0 self-start sm:self-auto">
                  <Check className="w-3.5 h-3.5" />
                  <span>Resolved {esc.resolved_at ? new Date(esc.resolved_at).toLocaleDateString('en-IN') : ''}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Paytm Branded Resolution Modal */}
      {selectedEscalation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden space-y-4 animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="bg-[#002970] p-5 text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-[#00BAF2]" />
                <h3 className="text-sm font-bold tracking-tight">
                  Resolve: {selectedEscalation.reason.replace(/_/g, ' ')}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedEscalation(null)} 
                className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-5 space-y-4 pt-0">
              <div className="text-xs text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200 font-medium">
                Provide human operator instructions. The autonomous AI agent will record this resolution in Cognee knowledge memory and update the case workflow.
              </div>

              {/* Quick resolution chips */}
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1.5">
                  1-Click Standard Resolutions:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Granted 7-day payment extension",
                    "Waived late penalty fee (5%)",
                    "Payment dispute verified & adjusted",
                    "Assigned senior field manager",
                  ].map((text, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setQuickResolution(text)}
                      className="px-2.5 py-1 rounded-full text-[11px] bg-slate-100 hover:bg-[#00BAF2]/15 hover:text-[#002970] text-slate-700 border border-slate-200 transition-colors cursor-pointer font-medium"
                    >
                      {text}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Operator Resolution Note:
                </label>
                <textarea
                  rows={3}
                  placeholder="Enter resolution notes..."
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  className="w-full p-3 rounded-xl text-xs bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#00BAF2] focus:ring-1 focus:ring-[#00BAF2] shadow-2xs font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  onClick={() => setSelectedEscalation(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleResolve}
                  disabled={isSubmitting || !resolutionText.trim()}
                  className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#00B970] text-white hover:bg-[#00a362] disabled:opacity-50 transition-all shadow-xs cursor-pointer"
                >
                  {isSubmitting ? 'Saving...' : 'Confirm Resolution'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
