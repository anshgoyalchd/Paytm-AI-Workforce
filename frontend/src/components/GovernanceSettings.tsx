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
  Server
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
      setTimeout(() => setSavedSuccess(false), 3000);
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

  const is24x7Active = formData.contact_start_hour === 0 && (formData.contact_end_hour === 24 || formData.contact_end_hour === 0);

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="p-6 rounded-xl bg-white border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-600" />
            Regulatory Compliance & Agent Governance Settings
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Strict deterministic policy boundaries enforced before every outbound action. Configured to comply with RBI Fair Practices Code or 24/7 verified trial mode.
          </p>
        </div>
        <div>
          <button
            onClick={enableTrialMode}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
              is24x7Active
                ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'
            }`}
          >
            {is24x7Active ? '✓ 24/7 Trial Mode Active' : '⚡ Enable 24/7 Trial Mode'}
          </button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Policy Section 1: Contact Hours */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
              <Clock className="w-4 h-4 text-blue-600" />
              Contact Window (Asia/Kolkata IST)
            </h3>
            {is24x7Active && (
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                24/7 TRIAL MODE (NO NIGHT CURFEW)
              </span>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-600 font-medium block mb-1">Contact Start Hour (IST):</label>
              <select
                value={formData.contact_start_hour ?? 9}
                onChange={(e) => setFormData({ ...formData, contact_start_hour: parseInt(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
              >
                <option value={0}>00:00 (12:00 AM - 24/7 Trial Mode)</option>
                {[8, 9, 10, 11].map((h) => (
                  <option key={h} value={h}>{h}:00 AM IST {h === 9 ? '(Recommended - RBI Standard)' : ''}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-600 font-medium block mb-1">Contact End Hour (IST):</label>
              <select
                value={formData.contact_end_hour ?? 19}
                onChange={(e) => setFormData({ ...formData, contact_end_hour: parseInt(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
              >
                {[18, 19, 20].map((h) => (
                  <option key={h} value={h}>{h % 12}:00 PM IST {h === 19 ? '(Recommended - 19:00 Curfew)' : ''}</option>
                ))}
                <option value={24}>24:00 (11:59 PM - 24/7 Trial Mode)</option>
              </select>
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            {is24x7Active 
              ? "24/7 Testing Mode Active: Outbound calls and messages will be dispatched anytime directly to your Twilio verified numbers."
              : "Standard RBI curfew: Outbound touches outside 09:00-19:00 IST are held until the morning window."}
          </p>
        </div>

        {/* Policy Section 2: Frequency & Harassment Prevention */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-600" />
            Frequency Limits & Channel Cooldown
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-600 font-medium block mb-1">Max Contact Attempts Per Day:</label>
              <input
                type="number"
                min={1}
                max={4}
                value={formData.max_contact_attempts ?? 2}
                onChange={(e) => setFormData({ ...formData, max_contact_attempts: parseInt(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Default: 2 touches/day across all channels.</span>
            </div>

            <div>
              <label className="text-xs text-slate-600 font-medium block mb-1">Minimum Cooldown Between Touches (Hours):</label>
              <input
                type="number"
                min={2}
                max={12}
                value={formData.min_hours_between_contacts ?? 4}
                onChange={(e) => setFormData({ ...formData, min_hours_between_contacts: parseInt(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600 shadow-xs"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Default: 4 hours mandatory gap.</span>
            </div>
          </div>
        </div>

        {/* Policy Section 3: Channel Toggles */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-4">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Radio className="w-4 h-4 text-purple-600" />
            Channel Dispatch Controls
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer">
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4 text-emerald-600" />
                <div>
                  <div className="text-xs font-semibold text-slate-900">Automated WhatsApp Messaging</div>
                  <div className="text-[11px] text-slate-500">Payment links, reminders, receipts</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.auto_whatsapp_enabled ?? true}
                onChange={(e) => setFormData({ ...formData, auto_whatsapp_enabled: e.target.checked })}
                className="w-4 h-4 rounded text-[#002970] focus:ring-0 border-slate-300"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-lg bg-slate-50 border border-slate-200 hover:border-slate-300 transition-colors cursor-pointer">
              <div className="flex items-center gap-2.5">
                <PhoneCall className="w-4 h-4 text-blue-600" />
                <div>
                  <div className="text-xs font-semibold text-slate-900">Automated Voice Telephony</div>
                  <div className="text-[11px] text-slate-500">Sarvam AI Indic speech calls</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.auto_voice_enabled ?? true}
                onChange={(e) => setFormData({ ...formData, auto_voice_enabled: e.target.checked })}
                className="w-4 h-4 rounded text-[#002970] focus:ring-0 border-slate-300"
              />
            </label>
          </div>
        </div>

        {/* Free Tier Infrastructure Status */}
        <div className="p-5 rounded-xl bg-white border border-slate-200 shadow-xs space-y-3">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <Server className="w-4 h-4 text-blue-600" />
            Infrastructure Status & Services
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Reasoning Engine</span>
              <span className="font-semibold text-slate-900 mt-0.5 block">Google Gemini 2.0 Flash</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Indic Speech (Hindi)</span>
              <span className="font-semibold text-slate-900 mt-0.5 block">Sarvam AI TTS</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Telephony & SMS</span>
              <span className="font-semibold text-slate-900 mt-0.5 block">Twilio Production / Sim</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Durable Memory</span>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className={`w-2 h-2 rounded-full ${cogneeHealth?.connected ? 'bg-emerald-500' : 'bg-emerald-500'}`}></span>
                <span className="font-semibold text-slate-900">
                  {cogneeHealth?.connected ? `Cognee Cloud v${cogneeHealth.version}` : 'Cognee Knowledge Graph'}
                </span>
              </div>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Orchestrator</span>
              <span className="font-semibold text-slate-900 mt-0.5 block">n8n Workflow Engine</span>
            </div>
            <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
              <span className="text-slate-500 block text-[10px] uppercase font-semibold">Payment Verification</span>
              <span className="font-semibold text-amber-800 mt-0.5 block">[MOCKED DETERMINISTIC]</span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-2">
          <div>
            {savedSuccess && (
              <span className="text-xs text-emerald-700 font-semibold flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Settings saved successfully!
              </span>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-lg text-xs font-semibold bg-[#002970] text-white hover:bg-[#001f54] disabled:opacity-50 transition-all shadow-xs cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Policy Parameters'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
