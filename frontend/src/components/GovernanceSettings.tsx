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

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

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

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 border border-slate-800">
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2">
          <ShieldCheck className="w-5 h-5 text-paytm-cyan" />
          Regulatory Compliance & Agent Governance Settings
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Strict deterministic policy boundaries enforced before every outbound action. Configured to comply with RBI Fair Practices Code, TRAI contact regulations, and merchant preferences.
        </p>
      </div>

      <div className="space-y-6">
        {/* Policy Section 1: Contact Hours */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-paytm-cyan" />
            Legal Contact Window (Asia/Kolkata IST)
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Contact Start Hour (IST):</label>
              <select
                value={formData.contact_start_hour ?? 9}
                onChange={(e) => setFormData({ ...formData, contact_start_hour: parseInt(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-paytm-cyan"
              >
                {[8, 9, 10, 11].map((h) => (
                  <option key={h} value={h}>{h}:00 AM IST {h === 9 ? '(Recommended - RBI Standard)' : ''}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Contact End Hour (IST):</label>
              <select
                value={formData.contact_end_hour ?? 19}
                onChange={(e) => setFormData({ ...formData, contact_end_hour: parseInt(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-paytm-cyan"
              >
                {[18, 19, 20].map((h) => (
                  <option key={h} value={h}>{h % 12}:00 PM IST {h === 19 ? '(Recommended - 19:00 Curfew)' : ''}</option>
                ))}
              </select>
            </div>
          </div>
          <p className="text-[11px] text-slate-500">
            Outbound calls or messages proposed outside this window are automatically deferred to the next morning window.
          </p>
        </div>

        {/* Policy Section 2: Frequency & Harassment Prevention */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-4 h-4 text-emerald-400" />
            Frequency Limits & Channel Cooldown
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-slate-400 block mb-1">Max Contact Attempts Per Day:</label>
              <input
                type="number"
                min={1}
                max={4}
                value={formData.max_contact_attempts ?? 2}
                onChange={(e) => setFormData({ ...formData, max_contact_attempts: parseInt(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-paytm-cyan"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Default: 2 touches/day across all channels.</span>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">Minimum Cooldown Between Touches (Hours):</label>
              <input
                type="number"
                min={2}
                max={12}
                value={formData.min_hours_between_contacts ?? 4}
                onChange={(e) => setFormData({ ...formData, min_hours_between_contacts: parseInt(e.target.value) })}
                className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:outline-none focus:border-paytm-cyan"
              />
              <span className="text-[10px] text-slate-500 mt-1 block">Default: 4 hours mandatory gap.</span>
            </div>
          </div>
        </div>

        {/* Policy Section 3: Channel Toggles */}
        <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-4">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-2">
            <Radio className="w-4 h-4 text-purple-400" />
            Channel Dispatch Controls
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
              <div className="flex items-center gap-2.5">
                <MessageSquare className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="text-xs font-semibold text-white">Automated WhatsApp Messaging</div>
                  <div className="text-[11px] text-slate-400">Payment links, reminders, receipts</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.auto_whatsapp_enabled ?? true}
                onChange={(e) => setFormData({ ...formData, auto_whatsapp_enabled: e.target.checked })}
                className="w-4 h-4 rounded text-paytm-cyan focus:ring-0 bg-slate-900 border-slate-700"
              />
            </label>

            <label className="flex items-center justify-between p-3.5 rounded-xl bg-slate-950/60 border border-slate-800 cursor-pointer">
              <div className="flex items-center gap-2.5">
                <PhoneCall className="w-4 h-4 text-sky-400" />
                <div>
                  <div className="text-xs font-semibold text-white">Automated Voice Telephony</div>
                  <div className="text-[11px] text-slate-400">Sarvam AI Indic speech calls</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={formData.auto_voice_enabled ?? true}
                onChange={(e) => setFormData({ ...formData, auto_voice_enabled: e.target.checked })}
                className="w-4 h-4 rounded text-paytm-cyan focus:ring-0 bg-slate-900 border-slate-700"
              />
            </label>
          </div>
        </div>

        {/* Free Tier Infrastructure Status */}
        <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800/80 space-y-3">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Server className="w-4 h-4 text-paytm-cyan" />
            Free Tier Architecture Status
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
              <span className="text-slate-500 block text-[10px]">Reasoning Engine</span>
              <span className="font-semibold text-slate-200">Google Gemini 2.0 Flash</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
              <span className="text-slate-500 block text-[10px]">Indic Speech (Hindi)</span>
              <span className="font-semibold text-slate-200">Sarvam AI TTS</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
              <span className="text-slate-500 block text-[10px]">Telephony & SMS</span>
              <span className="font-semibold text-slate-200">Twilio Free Trial / Sim</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
              <span className="text-slate-500 block text-[10px]">Durable Memory</span>
              <span className="font-semibold text-slate-200">Cognee Knowledge Graph</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
              <span className="text-slate-500 block text-[10px]">Orchestrator</span>
              <span className="font-semibold text-slate-200">n8n Free Community</span>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60">
              <span className="text-slate-500 block text-[10px]">Payment Verification</span>
              <span className="font-semibold text-amber-400">[MOCKED DETERMINISTIC]</span>
            </div>
          </div>
        </div>

        {/* Save Button */}
        <div className="flex items-center justify-between pt-2">
          <div>
            {savedSuccess && (
              <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Settings saved successfully!
              </span>
            )}
          </div>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold bg-paytm-cyan text-slate-950 hover:bg-sky-400 disabled:opacity-50 transition-all shadow-lg shadow-sky-500/10"
          >
            <Save className="w-4 h-4" />
            <span>{isSaving ? 'Saving...' : 'Save Policy Parameters'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
