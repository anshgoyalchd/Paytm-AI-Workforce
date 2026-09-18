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
  FileText
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

  if (!overview) {
    return (
      <div className="flex items-center justify-center p-16 text-slate-500">
        Loading workforce metrics...
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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Top Summary Card */}
      <div className="rounded-xl bg-white border border-slate-200 p-6 shadow-xs">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                Autonomous Collections Employee #01
              </h2>
            </div>
            <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
              Operating continuously within RBI and Paytm fair recovery practice guardrails. Automatically evaluates customer payment intents, overdue days, past commitments, and Cognee memory to contact debtors via WhatsApp or Voice.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              onClick={handleAutoReachAll}
              disabled={isReachingAll || overview.active_cases === 0}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold bg-[#002970] text-white hover:bg-[#001f54] disabled:opacity-50 transition-all shadow-xs cursor-pointer"
            >
              {isReachingAll ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Analyzing & Contacting...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 text-amber-300" />
                  <span>⚡ Run Autonomous Outreach</span>
                </>
              )}
            </button>
            <button
              onClick={() => onNavigateTab('simulator')}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 transition-all shadow-xs cursor-pointer"
            >
              <span>Simulator</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Primary KPI Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Outstanding */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total Outstanding</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
              <IndianRupee className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(overview.total_outstanding)}
            </div>
            <div className="mt-1 flex items-center text-xs text-slate-500">
              <span className="text-amber-700 font-medium">{overview.active_cases} Active Cases</span>
              <span className="mx-1.5 text-slate-300">•</span>
              <span>Portfolio balance</span>
            </div>
          </div>
        </div>

        {/* Card 2: Recovered */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Recovered to Date</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {formatCurrency(overview.total_recovered)}
            </div>
            <div className="mt-1 flex items-center text-xs text-slate-500">
              <span className="text-emerald-700 font-medium">{overview.settled_cases} Cases Settled</span>
              <span className="mx-1.5 text-slate-300">•</span>
              <span>100% verified</span>
            </div>
          </div>
        </div>

        {/* Card 3: Recovery Rate */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Recovery Rate</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {overview.recovery_rate_pct}%
            </div>
            <div className="mt-1 flex items-center text-xs text-slate-500">
              <span>Settled / Total Cases</span>
            </div>
          </div>
        </div>

        {/* Card 4: Policy Adherence */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Policy Compliance</span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-slate-900 tracking-tight">
              {overview.governance.compliance_adherence_pct}%
            </div>
            <div className="mt-1 flex items-center text-xs text-emerald-700 font-medium">
              <span>0 Unauthorized Outbound Actions</span>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Operations Breakdown */}
        <div className="lg:col-span-2 p-6 rounded-xl bg-white border border-slate-200 shadow-xs">
          <h3 className="text-sm font-semibold text-slate-900 tracking-tight mb-4 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-600" />
            <span>Autonomous Decision & Touchpoint Volume</span>
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
                <span>WhatsApp Touches</span>
              </div>
              <div className="mt-2 text-xl font-bold text-slate-900">
                {overview.actions_taken.whatsapp_sent}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <PhoneCall className="w-3.5 h-3.5 text-blue-600" />
                <span>Voice Telephony Calls</span>
              </div>
              <div className="mt-2 text-xl font-bold text-slate-900">
                {overview.actions_taken.calls_completed}
              </div>
            </div>

            <div className="p-4 rounded-lg bg-slate-50 border border-slate-200">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <AlertCircle className="w-3.5 h-3.5 text-rose-600" />
                <span>Escalated to Human</span>
              </div>
              <div className="mt-2 text-xl font-bold text-slate-900">
                {overview.escalated_cases}
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-blue-50/60 border border-blue-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center">
                <Clock className="w-4 h-4" />
              </div>
              <div className="text-xs">
                <div className="font-semibold text-slate-800">Legal Contact Operating Window</div>
                <div className="text-slate-600">09:00 - 19:00 IST (Strictly enforced by deterministic policy rules)</div>
              </div>
            </div>
            <button
              onClick={() => onNavigateTab('governance')}
              className="text-xs font-medium text-blue-700 hover:text-blue-900 hover:underline"
            >
              Configure Policy
            </button>
          </div>
        </div>

        {/* Quick Launch Test Bench */}
        <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-slate-900 tracking-tight mb-2">
              Interactive Test Simulator
            </h3>
            <p className="text-xs text-slate-500 mb-4 leading-relaxed">
              Evaluate how the collections employee responds to all 8 standard customer scenarios (disputes, promise to pay, hardship, already paid).
            </p>
            <div className="space-y-2">
              {[
                { name: '1. Immediate Payment Link', tag: 'Autonomous' },
                { name: '2. Promise to Pay Commitment', tag: 'Schedule' },
                { name: '3. Customer Dispute Escalation', tag: 'Freeze' },
                { name: '7. Payment Verified & Settled', tag: 'Mock PG' },
              ].map((item, idx) => (
                <div 
                  key={idx}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs"
                >
                  <span className="text-slate-700 font-medium">{item.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-white border border-slate-200 text-slate-600">
                    {item.tag}
                  </span>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => onNavigateTab('simulator')}
            className="w-full mt-4 py-2 px-4 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 transition-all text-center"
          >
            Launch Scenario Runner
          </button>
        </div>
      </div>

      {/* Auto Reach Results Modal */}
      {autoReachResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
          <div className="w-full max-w-2xl rounded-xl bg-white border border-slate-200 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col animate-in fade-in zoom-in duration-150">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-amber-500" />
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Autonomous Portfolio Outreach Completed
                  </h3>
                  <p className="text-xs text-slate-500">
                    Processed {autoReachResult.total_processed} accounts • {autoReachResult.successful_touches} outbound contacts executed
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAutoReachResult(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {autoReachResult.results?.map((res: any, idx: number) => (
                <div key={idx} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 space-y-2.5 text-xs">
                  <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                    <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <span>{res.customer_name}</span>
                      <span className="font-mono text-[11px] text-slate-500">({res.phone})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                        {res.channel === 'VOICE' ? 'VOICE CALL' : 'WHATSAPP'}
                      </span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {res.delivery_status || 'DELIVERED'}
                      </span>
                    </div>
                  </div>

                  {res.analysis && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] bg-white p-2.5 rounded-lg border border-slate-200">
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
                        <span className="font-semibold text-emerald-700">Cognee Synced</span>
                      </div>
                    </div>
                  )}

                  <div className="p-3 rounded-lg bg-blue-50/70 border border-blue-200 text-slate-900 leading-relaxed font-medium text-xs">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-blue-700 mb-1">
                      Dispatched Contextual Message:
                    </span>
                    "{res.agent_message}"
                  </div>

                  {res.provider_reference && (
                    <div className="text-[10px] font-mono text-slate-400 flex items-center justify-between pt-1">
                      <span>Provider: {res.provider}</span>
                      <span>Ref: {res.provider_reference}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                onClick={() => setAutoReachResult(null)}
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-[#002970] text-white hover:bg-[#001f54] transition-all cursor-pointer"
              >
                Close & Refresh
              </button>
            </div>
          </div>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center justify-between">
          <span>{errorMsg}</span>
          <button onClick={() => setErrorMsg(null)} className="text-rose-400 hover:text-rose-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
