import React from 'react';
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
  Clock
} from 'lucide-react';
import { WorkforceOverview as OverviewType } from '../types';

interface OverviewProps {
  overview: OverviewType | null;
  onNavigateTab: (tab: string) => void;
}

export const WorkforceOverview: React.FC<OverviewProps> = ({ overview, onNavigateTab }) => {
  if (!overview) {
    return (
      <div className="flex items-center justify-center p-16 text-slate-500">
        Loading workforce metrics...
      </div>
    );
  }

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
              Operating continuously within RBI and Paytm fair recovery practice guardrails. Actively evaluates customer payment intents, verifies receipts against payment gateways, and escalates disputes autonomously.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigateTab('simulator')}
              className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold bg-[#002970] text-white hover:bg-[#001f54] transition-all shadow-xs"
            >
              <span>Test Simulator (8 Scenarios)</span>
              <ArrowRight className="w-3.5 h-3.5" />
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
    </div>
  );
};
