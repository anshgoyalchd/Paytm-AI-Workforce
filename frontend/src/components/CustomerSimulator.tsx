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
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-blue-600" />
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Autonomous Collections Scenario Simulator
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Simulate end-to-end customer interactions across all 8 canonical collection scenarios. Trace the entire autonomous employee loop in real time with explicit deterministic guardrails.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-xs font-mono bg-amber-50 text-amber-800 border border-amber-200 font-medium">
              [MOCKED PAYMENT GATEWAY ACTIVE]
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Scenarios Catalog (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
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
                      ? 'bg-blue-50/70 border-blue-600 shadow-xs'
                      : 'bg-white border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold ${isSelected ? 'text-blue-800' : 'text-slate-900'}`}>
                      {sc.title}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-600 border border-slate-200 font-medium">
                      {sc.expected_action}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">
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
          <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              2. Target Portfolio Account & Prompt
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-600 block mb-1 font-medium">Target Case:</label>
                <select
                  value={selectedCaseId}
                  onChange={(e) => setSelectedCaseId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
                >
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.customer?.name} ({c.invoice?.invoice_number} - ₹{c.outstanding_amount.toLocaleString('en-IN')})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-600 block mb-1 font-medium">Channel:</label>
                <div className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-700 font-mono text-xs">
                  WHATSAPP / SMS (Simulated)
                </div>
              </div>
            </div>

            <div>
              <label className="text-slate-600 block mb-1 text-xs font-medium">Simulated Customer Input:</label>
              <textarea
                rows={2}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full p-3 rounded-lg text-xs bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
              />
            </div>

            <button
              onClick={handleRunSimulation}
              disabled={isLoading || !selectedCaseId}
              className="w-full py-2.5 rounded-lg text-xs font-semibold bg-[#002970] text-white hover:bg-[#001f54] disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer"
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
            <div className="p-5 rounded-xl bg-white border border-slate-200 space-y-4 shadow-xs">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Autonomous Employee Execution Trace
                  </span>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Status After: {result.case_status_after}
                </span>
              </div>

              {/* 7 Loop Steps Visualization */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                {/* Step 1: Understand */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Step 1: Understand</div>
                  <div className="mt-1 font-bold text-slate-900">
                    Intent: <span className="text-blue-700">{result.detected_intent}</span>
                  </div>
                </div>

                {/* Step 2: Decide */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Step 2: Decide</div>
                  <div className="mt-1 font-bold text-slate-900">
                    Next Action: <span className="text-emerald-700">{result.agent_decision}</span>
                  </div>
                </div>

                {/* Step 3: Verify (Mock Payment Gateway) */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Step 3: Gateway Verification</div>
                  <div className="mt-1 font-bold text-slate-900 flex items-center justify-between">
                    <span>Result: {result.verification_status || 'NOT_TRIGGERED'}</span>
                    <span className="text-[10px] font-mono text-amber-800 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">[MOCKED PG]</span>
                  </div>
                </div>

                {/* Step 4: Authorize (Policy Engine) */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-slate-500 font-semibold text-[10px] uppercase tracking-wider">Step 4: Policy Engine</div>
                  <div className="mt-1 font-bold text-slate-900">
                    Compliance: <span className={result.policy_check.is_allowed ? 'text-emerald-700' : 'text-rose-700'}>
                      {result.policy_check.is_allowed ? 'AUTHORIZED' : 'BLOCKED'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Step 5: Generated Agent Outbound Message */}
              <div className="p-3.5 rounded-lg bg-blue-50/70 border border-blue-200 text-xs">
                <div className="text-[10px] font-semibold text-blue-800 uppercase tracking-wider mb-1">
                  Step 5: Generated Outbound Customer Response
                </div>
                <div className="text-slate-900 text-xs leading-relaxed font-medium">
                  {result.agent_response}
                </div>
              </div>

              {/* Step 6: Escalation & Memory */}
              <div className="flex items-center justify-between text-xs pt-1 text-slate-600">
                <div className="flex items-center gap-1.5">
                  <span className="font-semibold text-slate-700">Escalated to Human:</span>
                  <span className={result.escalated ? 'text-rose-700 font-bold' : 'text-emerald-700 font-bold'}>
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
