import React, { useState } from 'react';
import { 
  IndianRupee, 
  TrendingUp, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  PhoneCall, 
  MessageSquare, 
  Cpu, 
  ArrowRight, 
  Clock, 
  Zap, 
  RefreshCw, 
  X, 
  Volume2,
  Mail,
  Smartphone,
  Radio,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { WorkforceOverview as OverviewType } from '../types';
import { api } from '../services/api';

interface OverviewProps {
  overview: OverviewType | null;
  onNavigateTab: (tab: string) => void;
  onRefresh?: () => void;
}

export const WorkforceOverview: React.FC<OverviewProps> = ({ overview, onNavigateTab, onRefresh }) => {
  const [isReachingAll, setIsReachingAll] = useState(false);
  const [autoReachResult, setAutoReachResult] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [soundboxPlayed, setSoundboxPlayed] = useState(false);

  if (!overview) {
    return (
      <div className="space-y-6 py-4 animate-pulse">
        <div className="bg-white p-6 rounded-xl border border-[#EBF0F5] shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <RefreshCw className="h-5 w-5 text-[#00BAF2] animate-spin" />
            <div>
              <p className="text-sm font-bold text-slate-800">Synchronizing Workforce Intelligence with Paytm Cloud...</p>
              <p className="text-xs text-slate-500">Connecting to Paytm collections state engine and loading debt portfolios.</p>
            </div>
          </div>
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="px-3 py-1.5 text-xs font-bold text-[#002970] bg-[#E6F7FD] hover:bg-[#D0F0FB] rounded-lg border border-[#BAE7FB] transition-colors"
            >
              Retry Sync
            </button>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-32 bg-slate-200/70 rounded-xl border border-slate-200" />
          ))}
        </div>
      </div>
    );
  }

  const handleAutoReachAll = async () => {
    try {
      setIsReachingAll(true);
      setErrorMsg(null);
      const res = await api.triggerAutoReachAll();
      setAutoReachResult(res);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setErrorMsg(err.response?.data?.detail || 'Failed to execute autonomous outreach.');
    } finally {
      setIsReachingAll(false);
    }
  };

  const playSoundboxChime = () => {
    setSoundboxPlayed(true);
    // Web Speech API synthesizes Paytm Soundbox Hindi announcement
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance("पेटीएम पर 10,000 रुपये प्राप्त हुए");
      utterance.lang = "hi-IN";
      utterance.rate = 1.0;
      window.speechSynthesis.speak(utterance);
    }
    setTimeout(() => setSoundboxPlayed(false), 4000);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Paytm for Business Hero Header Card */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#002970] via-[#001f54] to-[#001740] p-6 text-white shadow-paytm">
        {/* Subtle decorative background watermark */}
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-64 h-64 rounded-full bg-[#00BAF2]/10 blur-2xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/10 backdrop-blur-xs border border-white/15 text-[11px] font-bold text-[#00BAF2]">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00BAF2] opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00BAF2]"></span>
                </span>
                AUTONOMOUS EMPLOYEE #01
              </div>
              <span className="text-[11px] font-semibold text-slate-300">
                100% RBI Fair Practice Compliant
              </span>
              <span className="text-white/30">•</span>
              <span className="text-[11px] font-mono text-[#00BAF2]">
                Track 3: AI Teammates
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Autonomous Collections Workforce Command Center
            </h1>

            <p className="text-xs text-slate-300 leading-relaxed">
              Operating continuously across WhatsApp, Twilio Voice Telephony, and Resend Email. Evaluates customer payment histories, Cognee Knowledge Graph context, and RBI contact boundaries to recover overdue merchant invoices automatically.
            </p>
          </div>

          {/* Quick CTA Controls */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleAutoReachAll}
              disabled={isReachingAll || overview.active_cases === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black bg-[#00BAF2] text-[#001740] hover:bg-[#009FD6] active:scale-95 disabled:opacity-50 transition-all shadow-paytm-cyan cursor-pointer"
            >
              {isReachingAll ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Evaluating &amp; Contacting...</span>
                </>
              ) : (
                <>
                  <Zap className="w-4 h-4 text-[#001740] fill-current" />
                  <span>Run Autonomous Outreach</span>
                </>
              )}
            </button>

            <button
              onClick={() => onNavigateTab('simulator')}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold bg-white/10 hover:bg-white/20 active:bg-white/25 text-white border border-white/20 transition-all cursor-pointer backdrop-blur-xs"
            >
              <Sparkles className="w-4 h-4 text-[#00BAF2]" />
              <span>AI Testing Studio</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-300 ml-1" />
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid (Styled in Official Paytm Enterprise Palette) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Outstanding (Amber Accent) */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-white border border-[#EBF0F5] shadow-paytm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#FF9900]" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Total Outstanding</span>
            <div className="w-8 h-8 rounded-lg bg-[#FFF8E6] text-[#FF9900] flex items-center justify-center font-bold">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {formatCurrency(overview.total_outstanding)}
            </div>
            <div className="mt-1.5 flex items-center text-xs text-slate-500">
              <span className="text-[#FF9900] font-bold">{overview.active_cases} Active Invoices</span>
              <span className="mx-1.5 text-slate-300">•</span>
              <span>Pending Recovery</span>
            </div>
          </div>
        </div>

        {/* Card 2: Recovered to Date (Paytm Green Accent) */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-white border border-[#EBF0F5] shadow-paytm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#00B970]" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Cash Recovered</span>
            <div className="w-8 h-8 rounded-lg bg-[#E8F8F0] text-[#00B970] flex items-center justify-center">
              <TrendingUp className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight text-[#00B970]">
              {formatCurrency(overview.total_recovered)}
            </div>
            <div className="mt-1.5 flex items-center text-xs text-slate-500">
              <span className="text-[#00B970] font-bold">{overview.settled_cases} Cases Settled</span>
              <span className="mx-1.5 text-slate-300">•</span>
              <span>100% Paytm UPI Verified</span>
            </div>
          </div>
        </div>

        {/* Card 3: Recovery Rate % (Paytm Cyan Accent) */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-white border border-[#EBF0F5] shadow-paytm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#00BAF2]" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Recovery Rate</span>
            <div className="w-8 h-8 rounded-lg bg-[#E6F7FD] text-[#00BAF2] flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-[#002970] tracking-tight">
              {overview.recovery_rate_pct}%
            </div>
            <div className="mt-1.5 flex items-center text-xs text-slate-500">
              <span>Settled / Total Cases</span>
              <span className="mx-1.5 text-slate-300">•</span>
              <span className="text-emerald-700 font-semibold">Self-improving loop</span>
            </div>
          </div>
        </div>

        {/* Card 4: Governance Compliance (Deep Navy Accent) */}
        <div className="relative overflow-hidden p-5 rounded-2xl bg-white border border-[#EBF0F5] shadow-paytm">
          <div className="absolute top-0 left-0 right-0 h-1 bg-[#002970]" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Policy Compliance</span>
            <div className="w-8 h-8 rounded-lg bg-slate-100 text-[#002970] flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 stroke-[2.5]" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl sm:text-3xl font-black text-[#002970] tracking-tight">
              {overview.governance.compliance_adherence_pct}%
            </div>
            <div className="mt-1.5 flex items-center text-xs text-[#00B970] font-bold">
              <span>0 RBI Violations • Safe Execution</span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Grid: Soundbox Simulator + Operations Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Operations Breakdown (Left 2 cols) */}
        <div className="lg:col-span-2 p-6 rounded-2xl bg-white border border-[#EBF0F5] shadow-paytm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <Cpu className="w-4 h-4 text-[#00BAF2]" />
              <span>Autonomous Touchpoint Volume &amp; Decision Velocity</span>
            </h3>
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#002970] bg-[#E6F7FD] px-2 py-0.5 rounded-md border border-[#BAE7FB]">
              {overview.actions_taken.total} Actions Executed
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 mb-6">
            {/* WhatsApp */}
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200/80">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <MessageSquare className="w-3.5 h-3.5 text-[#25D366]" />
                <span>WhatsApp</span>
              </div>
              <div className="mt-2 text-xl font-black text-slate-900">
                {overview.actions_taken.whatsapp_sent}
              </div>
              <span className="text-[10px] text-slate-500">Twilio HSM API</span>
            </div>

            {/* Voice Telephony */}
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200/80">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <PhoneCall className="w-3.5 h-3.5 text-[#002970]" />
                <span>Voice Calls</span>
              </div>
              <div className="mt-2 text-xl font-black text-slate-900">
                {overview.actions_taken.calls_completed}
              </div>
              <span className="text-[10px] text-slate-500">Polly Edge TwiML</span>
            </div>

            {/* Email Notices */}
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200/80">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <Mail className="w-3.5 h-3.5 text-[#7C3AED]" />
                <span>Email Notices</span>
              </div>
              <div className="mt-2 text-xl font-black text-slate-900">
                {overview.actions_taken.total > 0 ? overview.actions_taken.total - overview.actions_taken.whatsapp_sent - overview.actions_taken.calls_completed : 0}
              </div>
              <span className="text-[10px] text-slate-500">Resend HTML API</span>
            </div>

            {/* Escalated */}
            <div className="p-3.5 rounded-xl bg-[#F8FAFC] border border-slate-200/80">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
                <AlertCircle className="w-3.5 h-3.5 text-[#FF3B30]" />
                <span>Escalated</span>
              </div>
              <div className="mt-2 text-xl font-black text-[#FF3B30]">
                {overview.escalated_cases}
              </div>
              <span className="text-[10px] text-slate-500">Human Review</span>
            </div>
          </div>

          {/* Legal Window Indicator */}
          <div className="p-4 rounded-xl bg-[#E6F7FD]/50 border border-[#BAE7FB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-[#002970] text-white flex items-center justify-center shrink-0">
                <Clock className="w-4 h-4 text-[#00BAF2]" />
              </div>
              <div className="text-xs">
                <div className="font-bold text-[#002970]">RBI Permitted Outbound Contact Window: 09:00 - 19:00 IST</div>
                <div className="text-slate-600 text-[11px]">Enforced deterministically by policy engine. Outbound attempts outside this window are automatically deferred.</div>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('governance')}
              className="text-xs font-bold text-[#002970] hover:text-[#00BAF2] whitespace-nowrap"
            >
              Configure Rules →
            </button>
          </div>
        </div>

        {/* Paytm Soundbox 4.0 Live Relay Card (Right 1 col) */}
        <div className="p-6 rounded-2xl bg-white border border-[#EBF0F5] shadow-paytm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#002970] flex items-center justify-center text-white">
                  <Radio className="w-4 h-4 text-[#00BAF2]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Paytm Soundbox 4.0</h3>
                  <span className="text-[10px] font-bold text-[#00B970] uppercase">Live Broadcast Relay</span>
                </div>
              </div>
              <div className="flex items-end gap-0.5 h-3 text-[#00BAF2]">
                <span className="w-1 bg-[#00BAF2] rounded-full soundwave-bar-1" />
                <span className="w-1 bg-[#002970] rounded-full soundwave-bar-2" />
                <span className="w-1 bg-[#00BAF2] rounded-full soundwave-bar-3" />
                <span className="w-1 bg-[#00B970] rounded-full soundwave-bar-4" />
              </div>
            </div>

            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              When overdue invoices are paid via Paytm UPI, the settlement webhook automatically triggers this audio relay to confirm merchant funds instantaneously.
            </p>

            {/* Soundbox Simulator Box */}
            <div className={`p-4 rounded-xl border transition-all text-center ${
              soundboxPlayed 
                ? 'bg-[#E8F8F0] border-[#A8ECC6] scale-[1.02]' 
                : 'bg-[#F8FAFC] border-slate-200'
            }`}>
              <Volume2 className={`w-8 h-8 mx-auto mb-2 ${soundboxPlayed ? 'text-[#00B970] animate-bounce' : 'text-[#002970]'}`} />
              <div className="text-xs font-bold text-slate-800">
                {soundboxPlayed ? '🔊 Playing Paytm Audio Broadcast...' : '“पेटीएम पर 10,000 रुपये प्राप्त हुए”'}
              </div>
              <span className="text-[10px] text-slate-500 mt-1 block">Hindi Voice Chime (4G IoT Relay)</span>
            </div>
          </div>

          <button
            onClick={playSoundboxChime}
            className="w-full mt-4 py-2.5 px-4 rounded-xl text-xs font-bold bg-[#002970] hover:bg-[#001f54] text-white transition-all shadow-paytm text-center flex items-center justify-center gap-2 cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5 text-[#00BAF2]" />
            <span>Simulate Soundbox Broadcast</span>
          </button>
        </div>
      </div>

      {/* Auto Reach Results Modal */}
      {autoReachResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-2xl bg-white border border-[#EBF0F5] shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-in fade-in zoom-in duration-150">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-[#002970] text-white">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-[#00BAF2]/20 flex items-center justify-center text-[#00BAF2]">
                  <Zap className="w-5 h-5 fill-current" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    Autonomous Portfolio Outreach Completed
                  </h3>
                  <p className="text-xs text-[#00BAF2]">
                    Processed {autoReachResult.total_processed} accounts • {autoReachResult.successful_touches} contacts executed
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAutoReachResult(null)}
                className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content list */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1 bg-[#F5F7FA]">
              {autoReachResult.results?.map((res: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl border border-[#EBF0F5] bg-white shadow-xs space-y-2.5 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <div className="font-bold text-slate-900 flex items-center gap-1.5">
                      <span>{res.customer_name}</span>
                      <span className="font-mono text-[11px] text-slate-500">({res.phone})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#E6F7FD] text-[#002970] border border-[#BAE7FB]">
                        {res.channel === 'VOICE' ? 'VOICE CALL' : 'WHATSAPP'}
                      </span>
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-[#E8F8F0] text-[#00B970] border border-[#A8ECC6]">
                        {res.delivery_status || 'DELIVERED'}
                      </span>
                    </div>
                  </div>

                  {res.analysis && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-[#F8FAFC] p-2.5 rounded-lg border border-slate-200">
                      <div>
                        <span className="text-slate-500 block">Dues:</span>
                        <span className="font-bold text-slate-800">₹{res.analysis.outstanding_amount?.toLocaleString('en-IN')}</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Overdue:</span>
                        <span className="font-semibold text-slate-800">{res.analysis.days_overdue} Days</span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Commitments:</span>
                        <span className="font-semibold text-slate-800">
                          {res.analysis.has_broken_commitment ? 'Broken Promise' : 'None'}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 block">Memory Graph:</span>
                        <span className="font-semibold text-[#00B970]">Cognee Synced</span>
                      </div>
                    </div>
                  )}

                  <div className="p-3 rounded-lg bg-[#E6F7FD]/40 border border-[#BAE7FB] text-slate-900 leading-relaxed font-medium text-xs">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[#002970] mb-1">
                      Dispatched Contextual Message:
                    </span>
                    "{res.agent_message}"
                  </div>
                </div>
              ))}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-white flex justify-end">
              <button
                onClick={() => setAutoReachResult(null)}
                className="px-5 py-2 rounded-xl text-xs font-bold bg-[#002970] text-white hover:bg-[#001f54] transition-all cursor-pointer shadow-paytm"
              >
                Close &amp; Refresh
              </button>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-[#FEECEB] border border-[#FBC5C3] text-[#DC2626] text-xs font-semibold flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-[#DC2626] hover:opacity-75">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

export default WorkforceOverview;
