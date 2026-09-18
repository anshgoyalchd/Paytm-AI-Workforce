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
  MessageSquare,
  Zap
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
  const [isAutoReaching, setIsAutoReaching] = useState<boolean>(false);
  const [autoReachResult, setAutoReachResult] = useState<any | null>(null);
  const [selectedOutreachChannel, setSelectedOutreachChannel] = useState<'AUTO' | 'VOICE' | 'WHATSAPP'>('AUTO');

  useEffect(() => {
    if (caseId) {
      loadDetail(caseId);
    }
  }, [caseId]);

  const handleAutonomousOutreach = async () => {
    if (!caseId) return;
    try {
      setIsAutoReaching(true);
      setAutoReachResult(null);
      const channelParam = selectedOutreachChannel === 'AUTO' ? undefined : selectedOutreachChannel;
      const res = await api.triggerAutoReach(caseId, channelParam);
      setAutoReachResult(res);
      await loadDetail(caseId);
      onCaseUpdated();
    } catch (err: any) {
      console.error('Failed autonomous outreach:', err);
      setAutoReachResult({
        success: false,
        action_summary: err.response?.data?.detail || err.message || 'Outreach failed'
      });
    } finally {
      setIsAutoReaching(false);
    }
  };

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-900/40 backdrop-blur-xs">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-white border border-slate-200 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#002970] flex items-center justify-center text-white font-bold shadow-xs">
              {detail?.customer?.name ? detail.customer.name.substring(0, 2).toUpperCase() : 'CC'}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-slate-900 tracking-tight">
                  {detail?.customer?.name || 'Case Detail'}
                </h2>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  {detail?.invoice?.invoice_number}
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  {detail?.status}
                </span>
              </div>
              <div className="text-xs text-slate-500">
                {detail?.customer?.phone} • Language: {detail?.customer?.preferred_language} • Due: {formatCurrency(detail?.outstanding_amount || 0)}
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        {isLoading ? (
          <div className="flex items-center justify-center p-20 text-slate-400">
            Loading case timeline and intelligence...
          </div>
        ) : detail ? (
          <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            {/* Left Column: Dossier & History (5 cols) */}
            <div className="lg:col-span-5 p-5 space-y-4 bg-slate-50/40">
              {/* Account Card */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
                <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  <span>Account & Invoice Details</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <span className="text-slate-500">Outstanding:</span>
                    <div className="font-bold text-slate-900 text-sm">{formatCurrency(detail.outstanding_amount)}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Invoice Status:</span>
                    <div className="font-semibold text-slate-800">{detail.invoice?.status}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Preferred Channel:</span>
                    <div className="font-semibold text-slate-800">{detail.customer?.preferred_channel}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Contact Status:</span>
                    <div className="font-semibold text-emerald-700">{detail.customer?.contact_status}</div>
                  </div>
                </div>
              </div>

              {/* Payment Verifications Card */}
              <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-semibold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Gateway Verifications</span>
                  </h4>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-slate-100 text-amber-700 border border-amber-200">
                    [MOCKED]
                  </span>
                </div>
                {detail.verifications.length === 0 ? (
                  <div className="text-xs text-slate-400 py-1">No payment verifications requested yet.</div>
                ) : (
                  <div className="space-y-2">
                    {detail.verifications.map((v) => (
                      <div key={v.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-800">{v.provider}</span>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            v.status === 'PAID' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-600'
                          }`}>
                            {v.status}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Verified at {new Date(v.verified_at).toLocaleTimeString('en-IN')}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Escalations Card */}
              {detail.escalations.length > 0 && (
                <div className="p-4 rounded-xl bg-rose-50/60 border border-rose-200 space-y-2">
                  <h4 className="text-xs font-semibold text-rose-700 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Active Escalations</span>
                  </h4>
                  {detail.escalations.map((esc) => (
                    <div key={esc.id} className="p-2.5 rounded-lg bg-white border border-rose-200 text-xs">
                      <div className="flex items-center justify-between font-medium text-slate-800">
                        <span>Reason: {esc.reason}</span>
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">{esc.status}</span>
                      </div>
                      {esc.resolution && (
                        <div className="text-[11px] text-slate-500 mt-1">
                          Resolution: {esc.resolution}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: Live Conversation & AI Loop (7 cols) */}
            <div className="lg:col-span-7 p-5 flex flex-col justify-between space-y-4 bg-white">
              {/* Autonomous AI Outreach Action Panel */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-lg bg-[#002970] text-white flex items-center justify-center">
                      <Zap className="w-4 h-4 text-amber-300 fill-amber-300" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Autonomous Outreach Engine</h4>
                      <p className="text-[11px] text-slate-500">Analyzes overdue days, past promises, Cognee memory & dispatches touch</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={selectedOutreachChannel}
                      onChange={(e) => setSelectedOutreachChannel(e.target.value as any)}
                      className="px-2 py-1 text-xs rounded-md bg-white border border-slate-300 text-slate-800 shadow-xs focus:outline-none"
                    >
                      <option value="AUTO">Auto (AI Decides)</option>
                      <option value="VOICE">Voice Call (Twilio)</option>
                      <option value="WHATSAPP">WhatsApp / SMS</option>
                    </select>

                    <button
                      onClick={handleAutonomousOutreach}
                      disabled={isAutoReaching}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#002970] hover:bg-[#001f54] text-white font-semibold text-xs shadow-xs transition-all disabled:opacity-50 shrink-0"
                    >
                      {isAutoReaching ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Contacting...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                          <span>Trigger Touch</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Auto Reach Result Banner */}
                {autoReachResult && (
                  <div className={`p-3 rounded-lg text-xs border ${
                    autoReachResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}>
                    <div className="font-semibold flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        {autoReachResult.action_summary}
                      </span>
                      {autoReachResult.channel && (
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white border border-emerald-200 text-emerald-800">
                          Channel: {autoReachResult.channel}
                        </span>
                      )}
                    </div>
                    {autoReachResult.analysis && (
                      <div className="text-[11px] text-slate-700 mt-1.5 grid grid-cols-2 gap-1 bg-white p-2 rounded border border-emerald-100">
                        <div><span className="text-slate-500">Days Overdue:</span> {autoReachResult.analysis.days_overdue} days</div>
                        <div><span className="text-slate-500">Broken Commitments:</span> {autoReachResult.analysis.broken_promises_count}</div>
                        {autoReachResult.dispatch_result?.sid && (
                          <div className="col-span-2 font-mono text-[10px] text-slate-600">
                            Twilio Dispatch SID: {autoReachResult.dispatch_result.sid} ({autoReachResult.dispatch_result.status})
                          </div>
                        )}
                        {autoReachResult.analysis.cognee_context && (
                          <div className="col-span-2 text-[10px] text-slate-600 italic">
                            Cognee Memory: {autoReachResult.analysis.cognee_context}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Latest AI Decision Card */}
              {detail.decisions.length > 0 && (
                <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bot className="w-4 h-4 text-blue-700" />
                      <span className="text-xs font-bold text-slate-900 tracking-tight">AI Reasoning & Decision</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-blue-200 text-blue-800">
                      {detail.decisions[0].model_provider} ({detail.decisions[0].model_name || 'Gemini Flash'})
                    </span>
                  </div>
                  <div className="text-xs text-slate-700">
                    <span className="text-slate-500 font-medium">Intent Detected: </span>
                    <span className="font-semibold text-slate-900">{detail.decisions[0].customer_intent || 'None'}</span>
                    {detail.decisions[0].confidence && (
                      <span className="text-slate-500"> ({Math.round(detail.decisions[0].confidence * 100)}% conf)</span>
                    )}
                  </div>
                  <div className="text-xs text-slate-700">
                    <span className="text-slate-500 font-medium">Proposed Action: </span>
                    <span className="px-2 py-0.5 rounded font-mono font-bold text-xs bg-white border border-blue-200 text-blue-900">
                      {detail.decisions[0].proposed_action}
                    </span>
                    <span className="ml-2 text-emerald-700 font-medium text-[11px]">
                      Policy: {detail.decisions[0].policy_status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-600 italic">
                    "{detail.decisions[0].reason}"
                  </p>
                </div>
              )}

              {/* Conversation Timeline Stream */}
              <div className="flex-1 overflow-y-auto max-h-[300px] p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 text-center">
                  Communication History
                </div>
                {detail.conversations.length === 0 || detail.conversations[0].messages.length === 0 ? (
                  <div className="text-center py-6 text-xs text-slate-400">
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
                      <div className="text-[10px] text-slate-400 mb-0.5 px-1">
                        {msg.sender_type} • {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div
                        className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed shadow-xs ${
                          msg.sender_type === 'AGENT'
                            ? 'bg-[#002970] text-white rounded-tr-none'
                            : 'bg-white text-slate-900 rounded-tl-none border border-slate-200'
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
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Turn Executed: Next Action: {turnResult.proposed_action} (Status: {turnResult.case_status})</span>
                  </div>
                  <div className="mt-1 text-slate-700 text-[11px]">
                    Response: {turnResult.agent_response}
                  </div>
                </div>
              )}

              {/* Interactive Simulator Input Box */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
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
                      className="px-2 py-0.5 rounded text-[11px] bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-colors"
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
                    className="flex-1 px-4 py-2 rounded-lg text-xs bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                  />
                  <button
                    onClick={() => handleTriggerTurn()}
                    disabled={isTriggering}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#002970] text-white hover:bg-[#001f54] disabled:opacity-50 transition-all shadow-xs"
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
