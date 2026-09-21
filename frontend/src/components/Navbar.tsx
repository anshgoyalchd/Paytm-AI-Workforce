import React from 'react';
import { 
  Bot, 
  ShieldCheck, 
  PauseCircle, 
  PlayCircle, 
  Eye, 
  Store, 
  Plus, 
  LogOut,
  Volume2,
  CheckCircle2,
  SlidersHorizontal,
  FolderKanban,
  AlertOctagon,
  Sparkles,
  BarChart3
} from 'lucide-react';
import { AgentMode, AuthUser } from '../types';

interface NavbarProps {
  currentTab: string;
  onTabChange: (tab: string) => void;
  agentMode: AgentMode;
  onModeChange: (mode: AgentMode) => void;
  pendingEscalationsCount: number;
  user?: AuthUser | null;
  onAddCaseClick?: () => void;
  onLogout?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  onTabChange,
  agentMode,
  onModeChange,
  pendingEscalationsCount,
  user,
  onAddCaseClick,
  onLogout,
}) => {
  const getStatusBadge = () => {
    switch (agentMode) {
      case 'AUTONOMOUS':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#E8F8F0] text-[#00B970] border border-[#A8ECC6] shadow-2xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00B970] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00B970]"></span>
            </span>
            AUTONOMOUS
          </div>
        );
      case 'SUPERVISED':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FFF8E6] text-[#D97706] border border-[#FDE68A] shadow-2xs">
            <Eye className="w-3 h-3 text-[#D97706]" />
            SUPERVISED
          </div>
        );
      case 'PAUSED':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-[#FEECEB] text-[#DC2626] border border-[#FBC5C3] shadow-2xs">
            <PauseCircle className="w-3 h-3 text-[#DC2626]" />
            AGENT PAUSED
          </div>
        );
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'AG';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-[#EBF0F5] shadow-xs">
      {/* Signature Paytm Top Accent Stripe */}
      <div className="paytm-header-stripe" />

      {/* Main Top Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Official Paytm Dual-Tone Wordmark & Sub-brand */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              {/* Paytm Monogram Shield */}
              <div className="w-10 h-10 rounded-xl bg-[#002970] flex items-center justify-center text-white shadow-paytm">
                <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none">
                  <path d="M4 6h7a4 4 0 014 4 4 4 0 01-4 4H8v4H4V6z" fill="#FFFFFF" />
                  <path d="M16 6h4v12h-4z" fill="#00BAF2" />
                  <path d="M14 6h8v3h-8z" fill="#00BAF2" />
                </svg>
              </div>

              {/* Brand Typography */}
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl font-black tracking-tight flex items-baseline">
                    <span className="text-[#002970]">Pay</span>
                    <span className="text-[#00BAF2]">tm</span>
                    <span className="ml-1.5 text-xs font-bold uppercase tracking-wider text-slate-500">for Business</span>
                  </span>
                  <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-widest px-2 py-0.5 rounded-md bg-[#002970] text-white">
                    AI WORKFORCE #01
                  </span>
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Store className="w-3.5 h-3.5 text-[#00BAF2]" />
                  <span className="font-semibold text-slate-800">{user?.business_name || 'Ansh Pharmsy'}</span>
                  <span className="inline-flex items-center gap-1 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-2.5 h-2.5 text-[#00B970]" />
                    Verified Merchant
                  </span>
                </div>
              </div>
            </div>

            {/* Soundbox Live Relay Status */}
            <div className="hidden lg:flex items-center gap-2 ml-4 px-3 py-1 rounded-full bg-slate-50 border border-slate-200 text-xs text-slate-600">
              <div className="flex items-end gap-0.5 h-3 text-[#00BAF2]">
                <span className="w-1 bg-[#00BAF2] rounded-full soundwave-bar-1" />
                <span className="w-1 bg-[#002970] rounded-full soundwave-bar-2" />
                <span className="w-1 bg-[#00BAF2] rounded-full soundwave-bar-3" />
                <span className="w-1 bg-[#00B970] rounded-full soundwave-bar-4" />
              </div>
              <span className="text-[11px] font-medium text-slate-700">Soundbox 4.0: <strong className="text-[#00B970]">Active</strong></span>
            </div>
          </div>

          {/* Right Action Controls: Mode Switcher, CTA & Profile */}
          <div className="flex items-center gap-3">
            {/* Status Badge */}
            <div className="hidden md:block">
              {getStatusBadge()}
            </div>

            {/* Quick Add Case Button */}
            {onAddCaseClick && (
              <button
                onClick={onAddCaseClick}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#00BAF2] hover:bg-[#009FD6] active:bg-[#0089BA] text-[#001740] font-bold text-xs shadow-paytm-cyan transition-all transform active:scale-95"
                title="Add a new customer overdue invoice"
              >
                <Plus className="w-4 h-4 text-[#001740] stroke-[2.5]" />
                <span>Add Overdue Case</span>
              </button>
            )}

            {/* Agent Mode Toggles */}
            <div className="hidden sm:flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200">
              <button
                onClick={() => onModeChange('AUTONOMOUS')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  agentMode === 'AUTONOMOUS'
                    ? 'bg-[#002970] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Autonomous: Agent decides and acts within policy rules"
              >
                <PlayCircle className="w-3.5 h-3.5 text-[#00BAF2]" />
                Auto
              </button>
              <button
                onClick={() => onModeChange('SUPERVISED')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  agentMode === 'SUPERVISED'
                    ? 'bg-[#FF9900] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Supervised: Actions require human approval"
              >
                <Eye className="w-3.5 h-3.5" />
                Supervised
              </button>
              <button
                onClick={() => onModeChange('PAUSED')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all ${
                  agentMode === 'PAUSED'
                    ? 'bg-[#FF3B30] text-white shadow-xs'
                    : 'text-slate-600 hover:text-rose-600'
                }`}
                title="Emergency Pause: Halts all outbound collection contacts"
              >
                <PauseCircle className="w-3.5 h-3.5" />
                Pause
              </button>
            </div>

            {/* Merchant User Pill */}
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200 text-xs">
              <div className="w-8 h-8 rounded-full bg-[#002970] text-white font-bold text-[11px] flex items-center justify-center border-2 border-[#00BAF2]/40 shadow-xs">
                {getInitials(user?.name)}
              </div>
              <div className="hidden md:block text-left">
                <div className="font-bold text-slate-800 text-xs truncate max-w-[120px]">{user?.name || 'Ansh Goyal'}</div>
                <div className="text-[10px] uppercase font-bold text-[#00BAF2] tracking-wider">{user?.role || 'OWNER'}</div>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                  title="Sign out of merchant console"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Official Paytm Enterprise Horizontal Navigation Tab Bar */}
      <nav className="bg-white border-t border-slate-100 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => onTabChange('overview')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold transition-colors whitespace-nowrap ${
              currentTab === 'overview'
                ? 'border-[#00BAF2] text-[#002970] bg-[#E6F7FD]/30'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <BarChart3 className={`w-4 h-4 ${currentTab === 'overview' ? 'text-[#00BAF2]' : 'text-slate-400'}`} />
            <span>Workforce Overview</span>
          </button>

          <button
            onClick={() => onTabChange('cases')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold transition-colors whitespace-nowrap ${
              currentTab === 'cases'
                ? 'border-[#00BAF2] text-[#002970] bg-[#E6F7FD]/30'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <FolderKanban className={`w-4 h-4 ${currentTab === 'cases' ? 'text-[#00BAF2]' : 'text-slate-400'}`} />
            <span>Collections Portfolio</span>
          </button>

          <button
            onClick={() => onTabChange('escalations')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold transition-colors whitespace-nowrap relative ${
              currentTab === 'escalations'
                ? 'border-[#00BAF2] text-[#002970] bg-[#E6F7FD]/30'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <AlertOctagon className={`w-4 h-4 ${currentTab === 'escalations' ? 'text-[#FF3B30]' : 'text-slate-400'}`} />
            <span>Escalation Center</span>
            {pendingEscalationsCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#FF3B30] text-white">
                {pendingEscalationsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => onTabChange('simulator')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold transition-colors whitespace-nowrap ${
              currentTab === 'simulator'
                ? 'border-[#00BAF2] text-[#002970] bg-[#E6F7FD]/30'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <Sparkles className={`w-4 h-4 ${currentTab === 'simulator' ? 'text-[#00BAF2]' : 'text-slate-400'}`} />
            <span>AI Scenario Testing Studio</span>
          </button>

          <button
            onClick={() => onTabChange('governance')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold transition-colors whitespace-nowrap ${
              currentTab === 'governance'
                ? 'border-[#00BAF2] text-[#002970] bg-[#E6F7FD]/30'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
            }`}
          >
            <SlidersHorizontal className={`w-4 h-4 ${currentTab === 'governance' ? 'text-[#002970]' : 'text-slate-400'}`} />
            <span>Governance &amp; RBI Rules</span>
          </button>
        </div>
      </nav>
    </header>
  );
};

export default Navbar;
