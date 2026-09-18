import React, { useState, useEffect } from 'react';
import { 
  Play, 
  Bot, 
  ShieldCheck, 
  CheckCircle2, 
  AlertTriangle, 
  ArrowRight, 
  RefreshCw, 
  Layers,
  Sparkles,
  Check
} from 'lucide-react';
import { CollectionCase, SimulatorScenario, SimulationResult } from '../types';
import { api } from '../services/api';

interface SimulatorProps {
  cases: CollectionCase[];
}

export const CustomerSimulator: React.FC<SimulatorProps> = ({ cases }) => {
  const [scenarios, setScenarios] = useState<SimulatorScenario[]>([]);
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('immediate_pay');
  const [selectedCaseId, setSelectedCaseId] = useState<string>('');
  const [customMessage, setCustomMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [result, setResult] = useState<SimulationResult | null>(null);

  useEffect(() => {
    loadScenarios();
    if (cases.length > 0 && !selectedCaseId) {
      setSelectedCaseId(cases[0].id);
    }
  }, [cases]);

  const loadScenarios = async () => {
    try {
      const data = await api.getScenarios();
      setScenarios(data);
      if (data.length > 0) {
        setCustomMessage(data[0].sample_input);
      }
    } catch (err) {
      console.error('Failed to load scenarios:', err);
    }
  };

  const handleSelectScenario = (sc: SimulatorScenario) => {
    setSelectedScenarioId(sc.id);
    setCustomMessage(sc.sample_input);
    setResult(null);
  };

  const handleRunSimulation = async () => {
    if (!selectedCaseId || !selectedScenarioId) return;
    try {
      setIsLoading(true);
      const res = await api.runScenario(selectedCaseId, selectedScenarioId, customMessage);
      setResult(res);
    } catch (err) {
      console.error('Failed to run simulation:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const currentScenario = scenarios.find((s) => s.id === selectedScenarioId);

  return (
    <div className="space-y-6">
      {/* Simulator Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-paytm-dark via-slate-900 to-slate-950 border border-slate-800">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-paytm-cyan" />
              <h2 className="text-lg font-bold text-white tracking-tight">
                Autonomous Collections Scenario Simulator
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Simulate end-to-end customer interactions across all 8 canonical collection scenarios. Trace the entire autonomous employee loop in real time with explicit deterministic guardrails.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-xs font-mono bg-amber-500/10 text-amber-400 border border-amber-500/20">
              [MOCKED PAYMENT GATEWAY ACTIVE]
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Scenarios Catalog (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            1. Select Customer Scenario (8 Scenarios)
          </h3>
          <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
            {scenarios.map((sc) => {
              const isSelected = sc.id === selectedScenarioId;
              return (
                <div
                  key={sc.id}
                  onClick={() => handleSelectScenario(sc)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-paytm-blue/20 border-paytm-cyan shadow-md shadow-sky-500/5'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isSelected ? 'text-paytm-cyan' : 'text-slate-200'}`}>
                      {sc.title}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-950 text-slate-400 border border-slate-800">
                      {sc.expected_action}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">
                    {sc.description}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Runner & Trace (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Target Account Selector */}
          <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              2. Target Portfolio Account & Prompt
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Target Case:</label>
                <select
                  value={selectedCaseId}
                  onChange={(e) => setSelectedCaseId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-paytm-cyan"
                >
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.customer?.name} ({c.invoice?.invoice_number} - ₹{c.outstanding_amount.toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">Channel:</label>
                <div className="px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-300 font-mono text-xs">
                  WHATSAPP / SMS (Simulated)
                </div>
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1 text-xs">Simulated Customer Input:</label>
              <textarea
                rows={2}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full p-3 rounded-xl text-xs bg-slate-950 border border-slate-800 text-slate-200 focus:outline-none focus:border-paytm-cyan"
              />
            </div>

            <button
              onClick={handleRunSimulation}
              disabled={isLoading || !selectedCaseId}
              className="w-full py-2.5 rounded-xl text-xs font-semibold bg-paytm-cyan text-slate-950 hover:bg-sky-400 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-sky-500/10"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Processing Autonomous Loop...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  <span>Execute Scenario in Live Workforce Loop</span>
                </>
              )}
            </button>
          </div>

          {/* Trace Results */}
          {result && (
            <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4 shadow-xl">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-bold text-white uppercase tracking-wider">
                    Autonomous Employee Execution Trace
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Status After: {result.case_status_after}
                </span>
              </div>

              {/* 7 Loop Steps Visualization */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Step 1: Understand */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Step 1: Understand</div>
                  <div className="mt-1 font-bold text-slate-200">
                    Intent: <span className="text-paytm-cyan">{result.detected_intent}</span>
                  </div>
                </div>

                {/* Step 2: Decide */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Step 2: Decide</div>
                  <div className="mt-1 font-bold text-slate-200">
                    Next Action: <span className="text-emerald-400">{result.agent_decision}</span>
                  </div>
                </div>

                {/* Step 3: Verify (Mock Payment Gateway) */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Step 3: Gateway Verification</div>
                  <div className="mt-1 font-bold text-slate-200 flex items-center justify-between">
                    <span>Result: {result.verification_status || 'NOT_TRIGGERED'}</span>
                    <span className="text-[10px] font-mono text-amber-400">[MOCKED PG]</span>
                  </div>
                </div>

                {/* Step 4: Authorize (Policy Engine) */}
                <div className="p-3 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Step 4: Policy Engine</div>
                  <div className="mt-1 font-bold text-slate-200">
                    Compliance: <span className={result.policy_check.is_allowed ? 'text-emerald-400' : 'text-rose-400'}>
                      {result.policy_check.is_allowed ? 'AUTHORIZED' : 'BLOCKED'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 5: Generated Agent Outbound Message */}
              <div className="p-3.5 rounded-xl bg-paytm-blue/15 border border-paytm-cyan/30 text-xs">
                <div className="text-[10px] font-semibold text-paytm-cyan uppercase tracking-wider mb-1">
                  Step 5: Generated Outbound Customer Response
                </div>
                <div className="text-white text-xs leading-relaxed">
                  {result.agent_response}
                </div>
              </div>

              {/* Step 6: Escalation & Memory */}
              <div className="flex items-center justify-between text-xs pt-1 text-slate-400">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-300">Escalated to Human:</span>
                  <span className={result.escalated ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
                    {result.escalated ? 'YES (Queue Alerted)' : 'NO (Fully Autonomous)'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-500">
                  Audit trail & Cognee memory facts synced.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
