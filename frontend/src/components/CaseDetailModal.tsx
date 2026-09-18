import React, { useState, useEffect } from 'react';
import { 
  X, 
  Bot, 
  Send, 
  CheckCircle2, 
  ShieldCheck, 
  AlertTriangle, 
  Clock, 
  User, 
  FileText, 
  RefreshCw,
  PhoneCall,
  MessageSquare
} from 'lucide-react';
import { CaseDetail, Message, Decision } from '../types';
import { api } from '../services/api';

interface CaseDetailModalProps {
  caseId: string | null;
  onClose: () => void;
  onCaseUpdated: () => void;
}

export const CaseDetailModal: React.FC<CaseDetailModalProps> = ({
  caseId,
  onClose,
  onCaseUpdated,
}) => {
  const [detail, setDetail] = useState<CaseDetail | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [customerInput, setCustomerInput] = useState<string>('');
  const [isTriggering, setIsTriggering] = useState<boolean>(false);
  const [turnResult, setTurnResult] = useState<any | null>(null);

  useEffect(() => {
    if (caseId) {
      loadDetail(caseId);
    }
  }, [caseId]);

  const loadDetail = async (id: string) => {
    try {
      setIsLoading(true);
      const data = await api.getCaseDetail(id);
      setDetail(data);
    } catch (err) {
      console.error('Failed to load case detail:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerTurn = async (customMessage?: string) => {
    if (!caseId) return;
    const msgToSend = customMessage || customerInput;
    try {
      setIsTriggering(true);
      const res = await api.triggerCaseTurn(caseId, msgToSend);
      setTurnResult(res);
      setCustomerInput('');
      // Reload updated case details
      await loadDetail(caseId);
      onCaseUpdated();
    } catch (err) {
      console.error('Failed to trigger turn:', err);
    } finally {
      setIsTriggering(false);
    }
  };

  if (!caseId) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/80 backdrop-blur-md">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-paytm-blue to-paytm-cyan flex items-center justify-center text-white font-bold">
              {detail?.customer?.name ? detail.customer.name.substring(0, 2).toUpperCase() : 'CC'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white tracking-tight">
                  {detail?.customer?.name || 'Case Detail'}
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                  {detail?.invoice?.invoice_number}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  {detail?.status}
                </span>
              </div>
              <div className="text-xs text-slate-400">
                {detail?.customer?.phone} • Language: {detail?.customer?.preferred_language} • Due: {formatCurrency(detail?.outstanding_amount || 0)}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {isLoading ? (
          <div className="flex items-center justify-center p-20 text-slate-500">
            Loading case timeline and intelligence...
          </div>
        ) : detail ? (
          <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-800">
            {/* Left Column: Dossier & History (5 cols) */}
            <div className="lg:col-span-5 p-5 space-y-5 bg-slate-950/20">
              {/* Account Card */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-3">
                <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-paytm-cyan" />
                  Account & Invoice Details
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Outstanding:</span>
                    <div className="font-bold text-white text-sm">{formatCurrency(detail.outstanding_amount)}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Invoice Status:</span>
                    <div className="font-semibold text-slate-300">{detail.invoice?.status}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Preferred Channel:</span>
                    <div className="font-semibold text-slate-300">{detail.customer?.preferred_channel}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Contact Status:</span>
                    <div className="font-semibold text-emerald-400">{detail.customer?.contact_status}</div>
                  </div>
                </div>
              </div>

              {/* Payment Verifications Card */}
              <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Gateway Verifications
                  </h4>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-800 text-amber-400 border border-amber-500/20">
                    [MOCKED]
                  </span>
                </div>
                {detail.verifications.length === 0 ? (
                  <div className="text-xs text-slate-500 py-1">No payment verifications requested yet.</div>
                ) : (
                  <div className="space-y-2">
                    {detail.verifications.map((v) => (
                      <div key={v.id} className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-200">{v.provider}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            v.status === 'PAID' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-800 text-slate-400'
                          }`}>
                            {v.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 mt-1">
                          Verified at {new Date(v.verified_at).toLocaleTimeString('en-IN')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Escalations Card */}
              {detail.escalations.length > 0 && (
                <div className="p-4 rounded-xl bg-rose-500/5 border border-rose-500/20 space-y-2">
                  <h4 className="text-xs font-semibold text-rose-400 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                    Active Escalations
                  </h4>
                  {detail.escalations.map((esc) => (
                    <div key={esc.id} className="p-2.5 rounded-lg bg-slate-950/80 border border-rose-500/20 text-xs">
                      <div className="flex items-center justify-between font-medium text-slate-200">
                        <span>Reason: {esc.reason}</span>
                        <span className="text-[10px] font-bold text-rose-400">{esc.status}</span>
                      </div>
                      {esc.resolution && (
                        <div className="text-[11px] text-slate-400 mt-1">
                          Resolution: {esc.resolution}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Live Conversation & AI Loop (7 cols) */}
            <div className="lg:col-span-7 p-5 flex flex-col justify-between space-y-4">
              {/* Latest AI Decision Card */}
              {detail.decisions.length > 0 && (
                <div className="p-4 rounded-xl bg-gradient-to-r from-paytm-dark to-slate-900 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-paytm-cyan" />
                      <span className="text-xs font-bold text-white tracking-tight">AI Reasoning & Decision</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-paytm-cyan">
                      {detail.decisions[0].model_provider} ({detail.decisions[0].model_name || 'Gemini Flash'})
                    </span>
                  </div>
                  <div className="text-xs text-slate-300">
                    <span className="text-slate-400 font-medium">Intent Detected: </span>
                    <span className="font-semibold text-white">{detail.decisions[0].customer_intent || 'None'}</span>
                    {detail.decisions[0].confidence && (
                      <span className="text-slate-400"> ({Math.round(detail.decisions[0].confidence * 100)}% conf)</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-300">
                    <span className="text-slate-400 font-medium">Proposed Action: </span>
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-slate-800 text-paytm-cyan">
                      {detail.decisions[0].proposed_action}
                    </span>
                    <span className="ml-2 text-emerald-400 font-medium text-[11px]">
                      Policy: {detail.decisions[0].policy_status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 italic">
                    "{detail.decisions[0].reason}"
                  </p>
                </div>
              )}

              {/* Conversation Timeline Stream */}
              <div className="flex-1 overflow-y-auto max-h-[300px] p-3 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-500 text-center">
                  Communication History
                </div>
                {detail.conversations.length === 0 || detail.conversations[0].messages.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-500">
                    No conversation records logged yet. Use the prompt box below to trigger a touch.
                  </div>
                ) : (
                  detail.conversations[0].messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        msg.sender_type === 'AGENT' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div className="text-[10px] text-slate-500 mb-0.5 px-1">
                        {msg.sender_type} • {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div
                        className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed ${
                          msg.sender_type === 'AGENT'
                            ? 'bg-paytm-blue text-white rounded-tr-none'
                            : 'bg-slate-800 text-slate-200 rounded-tl-none border border-slate-700'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Turn Execution Response Box (if triggered) */}
              {turnResult && (
                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Turn Executed: Next Action: {turnResult.proposed_action} (Status: {turnResult.case_status})
                  </div>
                  <div className="mt-1 text-slate-300 text-[11px]">
                    Response: {turnResult.agent_response}
                  </div>
                </div>
              )}

              {/* Interactive Simulator Input Box */}
              <div className="space-y-2 pt-2 border-t border-slate-800">
                <div className="flex flex-wrap gap-1.5">
                  <span className="text-[11px] text-slate-500 py-0.5">Quick Prompts:</span>
                  {[
                    "Maine kal hi pay kar diya tha",
                    "Payment link ya QR code bhejo",
                    "Ye bill galat hai, discount do",
                    "Somwar ko pakka de dunga",
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleTriggerTurn(p)}
                      disabled={isTriggering}
                      className="px-2 py-0.5 rounded text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                    >
                      {p}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Type customer message to test autonomous reasoning..."
                    value={customerInput}
                    onChange={(e) => setCustomerInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleTriggerTurn()}
                    className="flex-1 px-4 py-2 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 focus:outline-none focus:border-paytm-cyan"
                  />
                  <button
                    onClick={() => handleTriggerTurn()}
                    disabled={isTriggering}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold bg-paytm-cyan text-slate-950 hover:bg-sky-400 disabled:opacity-50 transition-all"
                  >
                    {isTriggering ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Send className="w-3.5 h-3.5" />
                    )}
                    <span>Execute Turn</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
};
