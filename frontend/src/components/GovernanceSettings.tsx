import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  Clock, 
  Sliders, 
  Radio, 
  MessageSquare, 
  PhoneCall, 
  Cpu, 
  Save, 
  CheckCircle2, 
  Server,
  Zap,
  Shield,
  Layers,
  Database
} from 'lucide-react';
import { AgentSettings } from '../types';
import { api } from '../services/api';

interface SettingsProps {
  settings: AgentSettings | null;
  onSettingsSaved: () => void;
}

export const GovernanceSettings: React.FC<SettingsProps> = ({ settings, onSettingsSaved }) => {
  const [formData, setFormData] = useState<Partial<AgentSettings>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [cogneeHealth, setCogneeHealth] = useState<any>(null);

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
    loadCogneeHealth();
  }, [settings]);

  const loadCogneeHealth = async () => {
    try {
      const res = await api.getCogneeHealth();
      setCogneeHealth(res);
    } catch (err) {
      console.error('Failed to load Cognee health:', err);
    }
  };

  const handleSave = async () => {
    try {
      setIsSaving(true);
      await api.updateSettings(formData);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3500);
      onSettingsSaved();
    } catch (err) {
      console.error('Failed to update settings:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const enableTrialMode = () => {
    setFormData({
      ...formData,
      contact_start_hour: 0,
      contact_end_hour: 24,
      max_contact_attempts: 10,
      min_hours_between_contacts: 0,
    });
  };

  const enableRbiStandardMode = () => {
    setFormData({
      ...formData,
      contact_start_hour: 9,
      contact_end_hour: 19,
      max_contact_attempts: 2,
      min_hours_between_contacts: 4,
    });
  };

  const is24x7Active = formData.contact_start_hour === 0 && (formData.contact_end_hour === 24 || formData.contact_end_hour === 0);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header Banner */}
      <div className="rounded-xl bg-white border border-slate-200/90 shadow-paytm-card overflow-hidden">
        <div className="bg-gradient-to-r from-[#002970] via-[#001f54] to-[#002970] p-5 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-white font-extrabold text-lg tracking-tight">Pay<span className="text-[#00BAF2]">tm</span></span>
              <span className="text-white/60 font-light text-sm">|</span>
              <span className="text-sm font-semibold text-[#00BAF2] tracking-wide uppercase">
                Governance & Policy Engine
              </span>
            </div>
            <p className="text-xs text-white/80 mt-1 max-w-xl">
              Strict deterministic boundaries enforced on the autonomous AI teammate before any outbound communication. Configurable for RBI Fair Practices compliance or unrestricted 24/7 testing.
            </p>
          </div>

          <div className="flex items-center gap-2">
            {is24x7Active ? (
              <button
                type="button"
                onClick={enableRbiStandardMode}
                className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-white text-[#002970] hover:bg-slate-100 transition-all cursor-pointer shadow-xs"
              >
                Reset to RBI Standard
              </button>
            ) : (
              <button
                type="button"
                onClick={enableTrialMode}
                className="px-3.5 py-1.5 rounded-full text-xs font-bold bg-[#00BAF2] text-[#002970] hover:bg-[#00a8dc] transition-all cursor-pointer shadow-xs flex items-center gap-1.5"
              >
                <Zap className="w-3.5 h-3.5 fill-[#002970]" />
                <span>Enable 24/7 Trial Mode</span>
              </button>
            )}
          </div>
        </div>

        <div className="px-5 py-2.5 bg-slate-50 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-600">
          <span className="font-medium flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Active Policy: {is24x7Active ? 'Unrestricted 24/7 Evaluation Sandbox' : 'RBI Fair Practices Standard (09:00 - 19:00 IST Curfew)'}
          </span>
          <span className="text-[11px] font-mono text-slate-500">Zero Harassment Guarantee</span>
        </div>
      </div>

      <div className="space-y-5">
        {/* Policy Section 1: Contact Hours */}
        <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-paytm-card space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-[#002970]" />
              Permitted Contact Window (Asia/Kolkata IST)
            </h3>
            {is24x7Active && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                24/7 TRIAL MODE ACTIVE
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-700 font-bold block mb-1">Outbound Start Hour (IST):</label>
              <select
                value={formData.contact_start_hour ?? 9}
                onChange={(e) => setFormData({ ...formData, contact_start_hour: parseInt(e.target.value) })}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-[#00BAF2] focus:ring-1 focus:ring-[#00BAF2] shadow-2xs font-semibold"
              >
                <option value={0}>00:00 (12:00 AM - 24/7 Trial Mode)</option>
                {[8, 9, 10, 11].map((h) => (
                  <option key={h} value={h}>{h}:00 AM IST {h === 9 ? '(RBI Standard Standard)' : ''}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-700 font-bold block mb-1">Outbound End Hour (IST):</label>
              <select
                value={formData.contact_end_hour ?? 19}
                onChange={(e) => setFormData({ ...formData, contact_end_hour: parseInt(e.target.value) })}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-[#00BAF2] focus:ring-1 focus:ring-[#00BAF2] shadow-2xs font-semibold"
              >
                {[18, 19, 20].map((h) => (
                  <option key={h} value={h}>{h % 12}:00 PM IST {h === 19 ? '(RBI Curfew Standard)' : ''}</option>
                ))}
                <option value={24}>24:00 (11:59 PM - 24/7 Trial Mode)</option>
              </select>
            </div>
          </div>

          <p className="text-[11px] text-slate-500 font-medium">
            {is24x7Active 
              ? "⚡ 24/7 Trial Mode: Calls, WhatsApp, and SMS will be sent immediately at any hour without nocturnal block."
              : "🛡️ Standard Curfew: Outbound touches generated between 19:00 and 09:00 IST are queued until next morning."}
          </p>
        </div>

        {/* Policy Section 2: Frequency & Anti-Harassment */}
        <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-paytm-card space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-[#00B970]" />
            Frequency Limits & Cooldown Cadence
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-700 font-bold block mb-1">Max Touches Per Day:</label>
              <input
                type="number"
                min={1}
                max={10}
                value={formData.max_contact_attempts ?? 2}
                onChange={(e) => setFormData({ ...formData, max_contact_attempts: parseInt(e.target.value) })}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-[#00BAF2] focus:ring-1 focus:ring-[#00BAF2] shadow-2xs font-semibold"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Standard RBI guideline: Maximum 2 touches/day across all channels.</span>
            </div>

            <div>
              <label className="text-xs text-slate-700 font-bold block mb-1">Minimum Cooldown Gap (Hours):</label>
              <input
                type="number"
                min={0}
                max={12}
                value={formData.min_hours_between_contacts ?? 4}
                onChange={(e) => setFormData({ ...formData, min_hours_between_contacts: parseInt(e.target.value) })}
                className="w-full px-3 py-2.5 rounded-xl bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-[#00BAF2] focus:ring-1 focus:ring-[#00BAF2] shadow-2xs font-semibold"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Mandatory gap between consecutive customer contacts.</span>
            </div>
          </div>
        </div>

        {/* Policy Section 3: Channel Dispatch Toggles */}
        <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-paytm-card space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Radio className="w-4 h-4 text-[#00BAF2]" />
            Outbound Channel Dispatches
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <MessageSquare className="w-4 h-4 text-emerald-700" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">WhatsApp Collections</div>
                  <div className="text-[11px] text-slate-500">Payment links, reminders & receipts</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.auto_whatsapp_enabled ?? true}
                onChange={(e) => setFormData({ ...formData, auto_whatsapp_enabled: e.target.checked })}
                className="w-5 h-5 rounded text-[#002970] focus:ring-0 border-slate-300 cursor-pointer accent-[#002970]"
              />
            </label>

            <label className="flex items-center justify-between p-4 rounded-xl bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
                  <PhoneCall className="w-4 h-4 text-[#002970]" />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900">Indic Voice Telephony</div>
                  <div className="text-[11px] text-slate-500">Sarvam AI natural Hindi conversations</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.auto_voice_enabled ?? true}
                onChange={(e) => setFormData({ ...formData, auto_voice_enabled: e.target.checked })}
                className="w-5 h-5 rounded text-[#002970] focus:ring-0 border-slate-300 cursor-pointer accent-[#002970]"
              />
            </label>
          </div>
        </div>

        {/* Free Tier / Enterprise Infrastructure Health */}
        <div className="p-5 rounded-xl bg-white border border-slate-200/90 shadow-paytm-card space-y-3">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
            <Server className="w-4 h-4 text-[#002970]" />
            Paytm AI Infrastructure Stack Status
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Reasoning LLM</span>
              <span className="font-bold text-slate-900 mt-0.5 block">Google Gemini 2.0 Flash</span>
              <span className="text-[10px] text-emerald-700 font-semibold">Active • 4.0s Cap</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Indic Speech TTS</span>
              <span className="font-bold text-slate-900 mt-0.5 block">Sarvam AI (Hindi)</span>
              <span className="text-[10px] text-emerald-700 font-semibold">Bulbul v1 Model</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Telephony & SMS</span>
              <span className="font-bold text-slate-900 mt-0.5 block">Twilio Production</span>
              <span className="text-[10px] text-emerald-700 font-semibold">+18573924378</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Durable Memory</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span className="font-bold text-slate-900">
                  {cogneeHealth?.connected ? `Cognee Cloud v${cogneeHealth.version}` : 'Cognee Knowledge Graph'}
                </span>
              </div>
              <span className="text-[10px] text-slate-500">Graph Memory Engine</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Orchestrator</span>
              <span className="font-bold text-slate-900 mt-0.5 block">n8n Workflow Engine</span>
              <span className="text-[10px] text-slate-500">Autonomous Webhooks</span>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-bold">Payment Reconciliation</span>
              <span className="font-bold text-amber-800 mt-0.5 block">[PG SYNCHRONIZED]</span>
              <span className="text-[10px] text-emerald-700 font-semibold">Paytm UPI Gateway</span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-2">
          <div>
            {savedSuccess && (
              <span className="text-xs text-emerald-700 font-bold flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Governance parameters saved and active in policy loop!
              </span>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-bold bg-[#002970] text-white hover:bg-[#001f54] disabled:opacity-50 transition-all shadow-paytm-card cursor-pointer"
          >
            <Save className="w-4 h-4 text-[#00BAF2]" />
            <span>{isSaving ? 'Saving Parameters...' : 'Save Policy Parameters'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
