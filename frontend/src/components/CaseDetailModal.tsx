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
  Zap,
  Mail,
  QrCode,
  Copy,
  Check,
  ExternalLink,
  Smartphone
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
  const [selectedOutreachChannel, setSelectedOutreachChannel] = useState<'AUTO' | 'VOICE' | 'WHATSAPP' | 'EMAIL'>('EMAIL');
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

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
    if (!msgToSend.trim()) return;
    try {
      setIsTriggering(true);
      const res = await api.triggerCaseTurn(caseId, msgToSend);
      setTurnResult(res);
      setCustomerInput('');
      await loadDetail(caseId);
      onCaseUpdated();
    } catch (err) {
      console.error('Failed to trigger turn:', err);
    } finally {
      setIsTriggering(false);
    }
  };

  const copyUpiLink = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  if (!caseId) return null;

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  const paymentLink = `https://pay.paytm.com/pay?pa=paytm.anshgoyal@paytm&am=${detail?.outstanding_amount || 0}&pn=Ansh%20Pharmsy&tr=${detail?.invoice?.invoice_number || 'INV'}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-xs">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-2xl bg-white border border-slate-200/90 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        
        {/* Paytm Enterprise Modal Header */}
        <div className="bg-gradient-to-r from-[#002970] via-[#001f54] to-[#002970] p-5 text-white flex items-center justify-between">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-white font-black text-base shadow-sm">
              {detail?.customer?.name ? detail.customer.name.substring(0, 2).toUpperCase() : 'CC'}
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-white font-extrabold text-lg tracking-tight">
                  {detail?.customer?.name || 'Case Dossier'}
                </span>
                <span className="font-mono text-xs px-2 py-0.5 rounded bg-white/15 text-white/90 border border-white/20 font-medium">
                  {detail?.invoice?.invoice_number}
                </span>
                <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase ${
                  detail?.status === 'SETTLED' || detail?.status === 'CLOSED'
                    ? 'bg-emerald-500 text-white'
                    : 'bg-[#00BAF2] text-[#002970]'
                }`}>
                  {detail?.status}
                </span>
              </div>
              <div className="text-xs text-white/80 flex items-center gap-2 flex-wrap mt-0.5">
                <span>Phone: {detail?.customer?.phone}</span>
                {detail?.customer?.email && (
                  <>
                    <span>•</span>
                    <span className="text-[#00BAF2] font-medium flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {detail.customer.email}
                    </span>
                  </>
                )}
                <span>•</span>
                <span>Language: {detail?.customer?.preferred_language}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-[10px] uppercase font-bold text-white/70">Overdue Balance</div>
              <div className="text-xl font-black text-[#00BAF2] tracking-tight">
                {formatCurrency(detail?.outstanding_amount || 0)}
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content Body */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center p-24 text-slate-400 gap-3">
            <RefreshCw className="w-6 h-6 animate-spin text-[#00BAF2]" />
            <span className="text-xs font-medium">Loading Paytm case ledger & neural intelligence...</span>
          </div>
        ) : detail ? (
          <div className="flex-1 overflow-y-auto grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-slate-200">
            
            {/* Left Column: Dossier & UPI Payment Hub (5 cols) */}
            <div className="lg:col-span-5 p-5 space-y-4 bg-slate-50/50">
              
              {/* Account Summary Card */}
              <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <FileText className="w-3.5 h-3.5 text-[#002970]" />
                    <span>Account & Invoicing</span>
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-50 text-[#002970] border border-blue-200 font-semibold">
                    {detail.priority || 'MEDIUM'}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-slate-600 font-medium">Outstanding Amount:</span>
                    <div className="font-extrabold text-[#002970] text-base mt-0.5">
                      {formatCurrency(detail.outstanding_amount)}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-600 font-medium">Invoice Status:</span>
                    <div className="font-semibold text-slate-800 mt-0.5">{detail.invoice?.status}</div>
                  </div>
                  <div>
                    <span className="text-slate-600 font-medium">Preferred Channel:</span>
                    <div className="font-semibold text-slate-800 mt-0.5">{detail.customer?.preferred_channel}</div>
                  </div>
                  <div>
                    <span className="text-slate-600 font-medium">Contact Status:</span>
                    <div className="font-semibold text-emerald-700 mt-0.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                      {detail.customer?.contact_status}
                    </div>
                  </div>
                </div>
              </div>

              {/* Paytm UPI 1-Click Collection Card */}
              <div className="p-4 rounded-xl bg-white border border-[#00BAF2]/40 shadow-paytm-card space-y-3 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#00BAF2]/10 to-transparent pointer-events-none rounded-bl-full" />
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#002970] font-black text-sm">Pay<span className="text-[#00BAF2]">tm</span></span>
                    <span className="text-xs font-bold text-slate-900">UPI Payment Hub</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Instant Settlement
                  </span>
                </div>

                {/* Simulated QR Code Box */}
                <div className="flex items-center gap-3.5 p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="w-20 h-20 bg-white p-1.5 rounded-lg border border-slate-300 shadow-2xs flex flex-col items-center justify-center shrink-0">
                    {/* SVG representation of Paytm QR */}
                    <svg viewBox="0 0 64 64" className="w-full h-full text-[#002970]">
                      <rect width="64" height="64" fill="none" />
                      {/* Outer corners */}
                      <rect x="4" y="4" width="20" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="4" />
                      <rect x="10" y="10" width="8" height="8" fill="currentColor" />
                      <rect x="40" y="4" width="20" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="4" />
                      <rect x="46" y="10" width="8" height="8" fill="currentColor" />
                      <rect x="4" y="40" width="20" height="20" rx="2" fill="none" stroke="currentColor" strokeWidth="4" />
                      <rect x="10" y="46" width="8" height="8" fill="currentColor" />
                      {/* Inner data blocks */}
                      <rect x="28" y="8" width="6" height="6" fill="#00BAF2" />
                      <rect x="28" y="20" width="6" height="6" fill="currentColor" />
                      <rect x="28" y="32" width="6" height="6" fill="currentColor" />
                      <rect x="40" y="28" width="6" height="6" fill="currentColor" />
                      <rect x="52" y="32" width="6" height="6" fill="#00BAF2" />
                      <rect x="40" y="44" width="6" height="6" fill="currentColor" />
                      <rect x="48" y="52" width="8" height="6" fill="currentColor" />
                      <rect x="28" y="50" width="6" height="8" fill="currentColor" />
                    </svg>
                    <span className="text-[8px] font-bold text-[#002970] mt-0.5">Paytm UPI</span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="font-bold text-slate-900">Scan & Pay ₹{detail.outstanding_amount.toLocaleString('en-IN')}</div>
                    <p className="text-[11px] text-slate-500">
                      Supports all UPI apps: Paytm, BHIM, PhonePe, GPay, and CRED.
                    </p>
                    <div className="text-[10px] font-mono text-slate-600 bg-white px-2 py-0.5 rounded border border-slate-200 truncate max-w-[190px]">
                      paytm.merchant@paytm
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => copyUpiLink(paymentLink)}
                    className="flex-1 py-1.5 px-3 rounded-lg border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {copiedLink ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="text-emerald-700">Link Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5 text-slate-500" />
                        <span>Copy UPI Link</span>
                      </>
                    )}
                  </button>
                  <a
                    href={paymentLink}
                    target="_blank"
                    rel="noreferrer"
                    className="py-1.5 px-3 rounded-lg bg-[#00BAF2]/15 hover:bg-[#00BAF2]/25 text-[#002970] text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <span>Open</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              {/* Gateway Verifications Card */}
              <div className="p-4 rounded-xl bg-white border border-slate-200/90 shadow-2xs space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Gateway Verification Audit</span>
                  </h4>
                  <span className="text-[10px] px-1.5 py-0.5 rounded font-mono bg-amber-50 text-amber-800 border border-amber-200 font-semibold">
                    [PG SYNCHRONIZED]
                  </span>
                </div>
                {detail.verifications.length === 0 ? (
                  <div className="text-xs text-slate-400 py-2 text-center">
                    No payment checks queried yet. Verification runs automatically on payment claim.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {detail.verifications.map((v) => (
                      <div key={v.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-900">{v.provider} Gateway</span>
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

              {/* Escalations Card (if any) */}
              {detail.escalations.length > 0 && (
                <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200 space-y-2">
                  <h4 className="text-xs font-bold text-rose-800 uppercase tracking-wider flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                    <span>Human Escalations</span>
                  </h4>
                  {detail.escalations.map((esc) => (
                    <div key={esc.id} className="p-2.5 rounded-lg bg-white border border-rose-200 text-xs space-y-1">
                      <div className="flex items-center justify-between font-semibold text-slate-900">
                        <span>Reason: {esc.reason}</span>
                        <span className="text-[10px] font-bold text-rose-700 bg-rose-50 px-1.5 py-0.5 rounded">
                          {esc.status}
                        </span>
                      </div>
                      {esc.resolution && (
                        <div className="text-[11px] text-slate-600">
                          Operator Resolution: "{esc.resolution}"
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right Column: AI Outreach & Live Communication Stream (7 cols) */}
            <div className="lg:col-span-7 p-5 flex flex-col justify-between space-y-4 bg-white">
              
              {/* Autonomous AI Outreach Action Panel */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/70 to-slate-50 border border-blue-100 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#002970] text-white flex items-center justify-center shadow-xs">
                      <Zap className="w-4 h-4 text-[#00BAF2] fill-[#00BAF2]" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Autonomous Collections Engine</h4>
                      <p className="text-[11px] text-slate-500">
                        Synthesizes overdue days, past promises, and Cognee memory for instant outreach
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={selectedOutreachChannel}
                      onChange={(e) => setSelectedOutreachChannel(e.target.value as any)}
                      className="px-2.5 py-1.5 text-xs rounded-lg bg-white border border-slate-300 text-slate-800 shadow-xs focus:outline-none focus:border-[#00BAF2] font-semibold"
                    >
                      <option value="EMAIL">Email (Verified & Instant)</option>
                      <option value="VOICE">Hindi Voice Call (Sarvam AI)</option>
                      <option value="WHATSAPP">WhatsApp (Trial Sandbox)</option>
                    </select>

                    <button
                      onClick={handleAutonomousOutreach}
                      disabled={isAutoReaching}
                      className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[#002970] hover:bg-[#001f54] text-white font-bold text-xs shadow-xs transition-all disabled:opacity-50 shrink-0 cursor-pointer"
                    >
                      {isAutoReaching ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#00BAF2]" />
                          <span>Contacting...</span>
                        </>
                      ) : (
                        <>
                          <Zap className="w-3.5 h-3.5 text-[#00BAF2] fill-[#00BAF2]" />
                          <span>Trigger Touch</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Auto Reach Result Banner */}
                {autoReachResult && (
                  <div className={`p-3 rounded-lg text-xs border animate-in fade-in duration-150 ${
                    autoReachResult.success ? 'bg-emerald-50 border-emerald-200 text-emerald-900' : 'bg-rose-50 border-rose-200 text-rose-900'
                  }`}>
                    <div className="font-bold flex items-center justify-between mb-1">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        {autoReachResult.action_summary}
                      </span>
                      {autoReachResult.channel && (
                        <span className="font-mono text-[10px] px-2 py-0.5 rounded bg-white border border-emerald-200 text-emerald-800 font-semibold">
                          Channel: {autoReachResult.channel}
                        </span>
                      )}
                    </div>
                    {autoReachResult.analysis && (
                      <div className="text-[11px] text-slate-700 mt-1.5 grid grid-cols-2 gap-1.5 bg-white p-2.5 rounded border border-emerald-100 font-medium">
                        <div><span className="text-slate-500 font-normal">Days Overdue:</span> {autoReachResult.analysis.days_overdue} days</div>
                        <div><span className="text-slate-500 font-normal">Broken Commitments:</span> {autoReachResult.analysis.broken_promises_count}</div>
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

              {/* Latest AI Reasoning & Decision Card */}
              {detail.decisions.length > 0 && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <Bot className="w-4 h-4 text-[#002970]" />
                      <span className="text-xs font-bold text-slate-900">AI Reasoning & Intent</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-[#002970] font-semibold">
                      {detail.decisions[0].model_provider} ({detail.decisions[0].model_name || 'Gemini 2.0 Flash'})
                    </span>
                  </div>
                  <div className="text-xs text-slate-700 flex items-center justify-between">
                    <div>
                      <span className="text-slate-500">Detected: </span>
                      <strong className="text-slate-900">{detail.decisions[0].customer_intent || 'None'}</strong>
                      {detail.decisions[0].confidence && (
                        <span className="text-slate-500"> ({Math.round(detail.decisions[0].confidence * 100)}% conf)</span>
                      )}
                    </div>
                    <div className="text-[11px] text-emerald-700 font-bold">
                      Policy: {detail.decisions[0].policy_status}
                    </div>
                  </div>
                  <p className="text-xs text-slate-600 italic bg-white p-2 rounded border border-slate-200">
                    "{detail.decisions[0].reason}"
                  </p>
                </div>
              )}

              {/* Communication Timeline Stream */}
              <div className="flex-1 overflow-y-auto max-h-[290px] p-3 rounded-xl bg-[#F5F7FA] border border-slate-200 space-y-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 text-center">
                  Communication History & Transcript
                </div>
                {detail.conversations.length === 0 || detail.conversations[0].messages.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400">
                    No conversation records logged yet. Use the prompt box below or trigger an autonomous touch.
                  </div>
                ) : (
                  detail.conversations[0].messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${
                        msg.sender_type === 'AGENT' ? 'items-end' : 'items-start'
                      }`}
                    >
                      <div className="text-[10px] text-slate-400 mb-0.5 px-1 font-medium">
                        {msg.sender_type === 'AGENT' ? 'Paytm AI Assistant' : 'Customer'} • {new Date(msg.timestamp).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <div
                        className={`max-w-[85%] p-3 rounded-2xl text-xs leading-relaxed shadow-2xs ${
                          msg.sender_type === 'AGENT'
                            ? 'bg-[#002970] text-white rounded-tr-none'
                            : 'bg-white text-slate-900 rounded-tl-none border border-slate-200/90'
                        }`}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Turn Execution Banner */}
              {turnResult && (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                  <div className="font-bold flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    <span>Turn Completed: Action {turnResult.proposed_action} (Status: {turnResult.case_status})</span>
                  </div>
                  <div className="mt-1 text-slate-700 text-[11px] bg-white p-2 rounded border border-emerald-100 font-medium">
                    Response: {turnResult.agent_response}
                  </div>
                </div>
              )}

              {/* Quick Prompts & Interactive Input Box */}
              <div className="space-y-2 pt-2 border-t border-slate-200">
                <div className="flex flex-wrap gap-1.5 items-center">
                  <span className="text-[10px] uppercase font-bold text-slate-400">Quick Test:</span>
                  {[
                    "Maine kal hi pay kar diya tha",
                    "Payment link ya QR code bhejo",
                    "Somwar ko pakka de dunga",
                    "Salary late ho gayi hai, 5 din do",
                  ].map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleTriggerTurn(p)}
                      disabled={isTriggering}
                      className="px-2.5 py-0.5 rounded-full text-[11px] bg-slate-100 hover:bg-[#00BAF2]/10 hover:text-[#002970] text-slate-700 border border-slate-200 transition-colors cursor-pointer"
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
                    className="flex-1 px-3.5 py-2.5 rounded-xl text-xs bg-white border border-slate-300 text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#00BAF2] focus:ring-1 focus:ring-[#00BAF2] shadow-2xs font-medium"
                  />
                  <button
                    onClick={() => handleTriggerTurn()}
                    disabled={isTriggering || !customerInput.trim()}
                    className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-[#002970] text-white hover:bg-[#001f54] disabled:opacity-50 transition-all shadow-xs cursor-pointer"
                  >
                    {isTriggering ? (
                      <RefreshCw className="w-3.5 h-3.5 animate-spin text-[#00BAF2]" />
                    ) : (
                      <Send className="w-3.5 h-3.5 text-[#00BAF2]" />
                    )}
                    <span>Execute</span>
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
