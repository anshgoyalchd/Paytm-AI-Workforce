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
  Check,
  Smartphone,
  Volume2,
  VolumeX,
  MessageSquare,
  Shield,
  Zap,
  Info
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
  const [selectedChannel, setSelectedChannel] = useState<'WHATSAPP' | 'VOICE' | 'SMS'>('WHATSAPP');
  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);

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
    if (sc.id.includes('voice') || sc.id.includes('hardship') || sc.id.includes('dispute')) {
      // Keep selected channel or smart switch
    }
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

  const playVoiceResponse = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    if (isPlayingAudio) {
      window.speechSynthesis.cancel();
      setIsPlayingAudio(false);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    // Try to find an Indian or Hindi voice
    const indianVoice = voices.find(v => v.lang.includes('hi') || v.lang.includes('IN'));
    if (indianVoice) utterance.voice = indianVoice;
    utterance.rate = 0.95;
    utterance.onend = () => setIsPlayingAudio(false);
    utterance.onerror = () => setIsPlayingAudio(false);

    setIsPlayingAudio(true);
    window.speechSynthesis.speak(utterance);
  };

  const selectedCase = cases.find((c) => c.id === selectedCaseId);
  const currentScenario = scenarios.find((s) => s.id === selectedScenarioId);

  return (
    <div className="space-y-6">
      {/* Paytm AI Studio Header */}
      <div className="rounded-xl bg-white border border-slate-200/90 shadow-paytm-card overflow-hidden">
        <div className="bg-gradient-to-r from-[#002970] via-[#001f54] to-[#002970] p-5 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-white font-extrabold tracking-tight text-lg">Pay<span className="text-[#00BAF2]">tm</span></span>
              <span className="text-white/60 font-light text-sm">|</span>
              <span className="text-sm font-semibold text-[#00BAF2] tracking-wide uppercase">AI Testing Studio</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#00BAF2]/20 text-[#00BAF2] border border-[#00BAF2]/30">
                Sandbox v2.4
              </span>
            </div>
            <p className="text-xs text-white/80 max-w-2xl">
              Simulate end-to-end customer interactions across all 8 canonical collection scenarios. Trace the entire autonomous employee loop in real time with explicit deterministic guardrails.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="px-3 py-1 rounded-full text-xs font-mono bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Payment Gateway Active
            </span>
          </div>
        </div>

        {/* Quick info bar */}
        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200/80 flex flex-wrap items-center justify-between gap-2 text-xs text-slate-600">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-[#00BAF2]" />
              <strong>Reasoning:</strong> Gemini 2.0 Flash
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-[#00B970]" />
              <strong>Policy:</strong> RBI Fair Practices Curfew
            </span>
          </div>
          <div className="text-[11px] text-slate-500">
            Select a scenario below to run the autonomous employee loop
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Scenarios Catalog (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-[#002970]" />
              1. Select Customer Scenario ({scenarios.length || 8})
            </h3>
            <span className="text-[10px] text-slate-600 font-medium">Canonical Debt Cases</span>
          </div>

          <div className="space-y-2 max-h-[640px] overflow-y-auto pr-1">
            {scenarios.map((sc, idx) => {
              const isSelected = sc.id === selectedScenarioId;
              return (
                <div
                  key={sc.id}
                  onClick={() => handleSelectScenario(sc)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer relative ${
                    isSelected
                      ? 'bg-gradient-to-r from-blue-50/90 to-white border-[#00BAF2] shadow-sm ring-1 ring-[#00BAF2]/30'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 hover:shadow-xs'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center ${
                        isSelected ? 'bg-[#002970] text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {idx + 1}
                      </span>
                      <span className={`text-xs font-bold ${isSelected ? 'text-[#002970]' : 'text-slate-900'}`}>
                        {sc.title}
                      </span>
                    </div>
                    <span className={`text-[10px] font-mono px-2 py-0.5 rounded border font-semibold shrink-0 ${
                      isSelected 
                        ? 'bg-[#002970] text-white border-[#002970]' 
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}>
                      {sc.expected_action}
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500 mt-1.5 line-clamp-2 pl-7">
                    {sc.description}
                  </p>

                  <div className="mt-2 pl-7 flex items-center gap-1.5 text-[10px] text-slate-600">
                    <span className="font-semibold text-slate-600">Sample:</span>
                    <span className="truncate italic">"{sc.sample_input}"</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Execution & Mobile Simulator (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Target Account & Parameters */}
          <div className="p-5 rounded-xl bg-white border border-slate-200/80 shadow-paytm-card space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-[#FF9900]" />
              2. Target Portfolio Account & Channel
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Target Overdue Account:</label>
                <select
                  value={selectedCaseId}
                  onChange={(e) => setSelectedCaseId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-slate-900 focus:outline-none focus:border-[#00BAF2] focus:ring-1 focus:ring-[#00BAF2] font-medium text-xs shadow-xs"
                >
                  {cases.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.customer?.name} • ₹{c.outstanding_amount.toLocaleString('en-IN')} ({c.invoice?.invoice_number})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-slate-700 block mb-1 font-semibold">Interaction Channel:</label>
                <div className="grid grid-cols-3 gap-1 p-0.5 bg-slate-100 rounded-lg border border-slate-200">
                  <button
                    type="button"
                    onClick={() => setSelectedChannel('WHATSAPP')}
                    className={`py-1.5 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                      selectedChannel === 'WHATSAPP'
                        ? 'bg-white text-emerald-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedChannel('VOICE')}
                    className={`py-1.5 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                      selectedChannel === 'VOICE'
                        ? 'bg-white text-[#002970] shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Hindi Voice
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedChannel('SMS')}
                    className={`py-1.5 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                      selectedChannel === 'SMS'
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    SMS
                  </button>
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-slate-700 text-xs font-semibold">
                  Simulated Customer Message / Speech Transcript:
                </label>
                <span className="text-[10px] text-slate-600 font-medium">Editable Input</span>
              </div>
              <textarea
                rows={2}
                value={customMessage}
                onChange={(e) => setCustomMessage(e.target.value)}
                className="w-full p-3 rounded-lg text-xs bg-slate-50/60 border border-slate-300 text-slate-900 focus:outline-none focus:border-[#00BAF2] focus:ring-1 focus:ring-[#00BAF2] shadow-xs font-medium"
                placeholder="Type customer message..."
              />
            </div>

            <button
              onClick={handleRunSimulation}
              disabled={isLoading || !selectedCaseId}
              className="w-full py-3 rounded-xl text-xs font-bold bg-[#002970] hover:bg-[#001f54] text-white disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow cursor-pointer tracking-wide"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin text-[#00BAF2]" />
                  <span>Processing Autonomous Reasoning Loop...</span>
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 text-[#00BAF2] fill-[#00BAF2]" />
                  <span>Execute Scenario in Live Autonomous Loop</span>
                </>
              )}
            </button>
          </div>

          {/* Trace Results & Simulated Phone Preview */}
          {result && (
            <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-paytm-card space-y-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                      Autonomous Execution Trace & Verification
                    </h4>
                    <span className="text-[10px] text-slate-500">
                      Case: {selectedCase?.customer?.name} ({selectedCase?.invoice?.invoice_number})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Status: {result.case_status_after}
                  </span>
                </div>
              </div>

              {/* Simulated Mobile Device Preview Window */}
              <div className="rounded-xl border border-slate-300 bg-slate-100/70 p-3 shadow-inner">
                <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden max-w-lg mx-auto">
                  {/* Phone Header Bar */}
                  <div className="bg-[#002970] px-4 py-2.5 flex items-center justify-between text-white text-xs">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded-full bg-[#00BAF2] flex items-center justify-center text-[#002970] font-black text-xs">
                        P
                      </div>
                      <div>
                        <div className="font-bold leading-tight">Paytm Collections Teammate</div>
                        <div className="text-[10px] text-white/70">Verified Business Assistant</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-[#00BAF2]">
                      <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
                      <span>LIVE</span>
                    </div>
                  </div>

                  {/* Chat Conversation Body */}
                  <div className="p-3.5 space-y-3 bg-[#F5F7FA] min-h-[140px] text-xs">
                    {/* Customer Message (Left) */}
                    <div className="flex flex-col items-start max-w-[85%]">
                      <div className="text-[10px] text-slate-600 mb-0.5 font-medium">Customer:</div>
                      <div className="p-3 rounded-2xl rounded-tl-none bg-white text-slate-900 border border-slate-200/90 shadow-2xs leading-relaxed font-medium">
                        {customMessage}
                      </div>
                    </div>

                    {/* Agent Response (Right - Paytm Branded) */}
                    <div className="flex flex-col items-end ml-auto max-w-[85%]">
                      <div className="text-[10px] text-slate-600 mb-0.5 font-medium flex items-center gap-1">
                        <span>Paytm AI Assistant</span>
                        {result.verification_status && (
                          <span className="text-emerald-700 font-semibold">• [PG Verified]</span>
                        )}
                      </div>
                      <div className="p-3 rounded-2xl rounded-tr-none bg-[#002970] text-white shadow-xs leading-relaxed">
                        {result.agent_response}
                      </div>

                      {/* Interactive Audio Voice Preview */}
                      <button
                        type="button"
                        onClick={() => playVoiceResponse(result.agent_response)}
                        className={`mt-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                          isPlayingAudio
                            ? 'bg-rose-50 text-rose-700 border border-rose-200 animate-pulse'
                            : 'bg-white text-[#002970] border border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {isPlayingAudio ? (
                          <>
                            <VolumeX className="w-3 h-3 text-rose-600" />
                            <span>Stop Voice</span>
                          </>
                        ) : (
                          <>
                            <Volume2 className="w-3 h-3 text-[#00BAF2]" />
                            <span>Listen to Sarvam AI Hindi Voice</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4 Pipeline Step Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 text-xs pt-1">
                {/* Step 1: Understand */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-slate-600 font-bold text-[10px] uppercase tracking-wider">
                    Step 1: Understand
                  </div>
                  <div className="mt-1 font-bold text-[#002970] truncate" title={result.detected_intent}>
                    {result.detected_intent}
                  </div>
                  <div className="text-[10px] text-slate-600 mt-0.5">Gemini 2.0 Flash NLU</div>
                </div>

                {/* Step 2: Decide */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-slate-600 font-bold text-[10px] uppercase tracking-wider">
                    Step 2: Decide
                  </div>
                  <div className="mt-1 font-bold text-[#00B970] truncate" title={result.agent_decision}>
                    {result.agent_decision}
                  </div>
                  <div className="text-[10px] text-slate-600 mt-0.5">Collections Action Engine</div>
                </div>

                {/* Step 3: Gateway Verification */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-slate-600 font-bold text-[10px] uppercase tracking-wider">
                    Step 3: Verification
                  </div>
                  <div className="mt-1 font-bold text-slate-900 flex items-center justify-between">
                    <span>{result.verification_status || 'NOT_TRIGGERED'}</span>
                  </div>
                  <div className="text-[10px] text-slate-600 mt-0.5">Paytm Gateway Mock</div>
                </div>

                {/* Step 4: Policy & Curfew */}
                <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                  <div className="text-slate-600 font-bold text-[10px] uppercase tracking-wider">
                    Step 4: Policy Engine
                  </div>
                  <div className={`mt-1 font-bold ${result.policy_check.is_allowed ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {result.policy_check.is_allowed ? 'AUTHORIZED' : 'BLOCKED'}
                  </div>
                  <div className="text-[10px] text-slate-600 mt-0.5">RBI Fair Practice Standard</div>
                </div>
              </div>

              {/* Step 6: Escalation & Durable Memory Audit */}
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <Shield className="w-4 h-4 text-[#002970]" />
                  <span className="font-semibold text-slate-700">Human Escalation:</span>
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    result.escalated ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'
                  }`}>
                    {result.escalated ? 'YES (Queued in Escalations)' : 'NO (100% Autonomous)'}
                  </span>
                </div>
                <div className="text-[11px] text-slate-600 font-medium">
                  Memory synced with Cognee Knowledge Graph & Ledger
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
