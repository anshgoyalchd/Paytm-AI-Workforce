import React from 'react';
import { 
  Store, 
  Plus, 
  LogOut,
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
  const getInitials = (name?: string) => {
    if (!name) return 'AG';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-white border-b border-slate-200/80 shadow-xs">
      {/* Signature Paytm Top Accent Stripe */}
      <div className="paytm-header-stripe" />

      {/* Main Top Header */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Official Paytm Dual-Tone Wordmark & Merchant Identity */}
          <div className="flex items-center gap-3 shrink-0">
            <div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black tracking-tight flex items-baseline select-none">
                  <span className="text-[#002970]">Pay</span>
                  <span className="text-[#00BAF2]">tm</span>
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500">
                  for Business
                </span>
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500 -mt-0.5">
                <Store className="w-3 h-3 text-[#00BAF2]" />
                <span className="font-semibold text-slate-800 text-[11px]">{user?.business_name || 'Ansh Pharmsy'}</span>
                <span className="inline-flex items-center gap-0.5 text-[9px] font-bold uppercase tracking-wide text-[#00B970] ml-1">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  Verified
                </span>
              </div>
            </div>
          </div>

          {/* Right Action Controls: Clean Mode Switch, Primary Action & Profile */}
          <div className="flex items-center gap-3 shrink-0">
            
            {/* Agent Mode Segmented Control */}
            <div className="hidden sm:flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200/80">
              <button
                type="button"
                onClick={() => onModeChange('AUTONOMOUS')}
                className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  agentMode === 'AUTONOMOUS'
                    ? 'bg-[#002970] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Autonomous: Agent operates and acts within policy bounds"
              >
                <span className={`w-1.5 h-1.5 rounded-full ${agentMode === 'AUTONOMOUS' ? 'bg-[#00BAF2]' : 'bg-slate-400'}`} />
                <span>Auto</span>
              </button>

              <button
                type="button"
                onClick={() => onModeChange('SUPERVISED')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  agentMode === 'SUPERVISED'
                    ? 'bg-[#FF9900] text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Supervised: Actions require human operator sign-off"
              >
                <span>Supervised</span>
              </button>

              <button
                type="button"
                onClick={() => onModeChange('PAUSED')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  agentMode === 'PAUSED'
                    ? 'bg-[#FF3B30] text-white shadow-xs'
                    : 'text-slate-600 hover:text-rose-600'
                }`}
                title="Emergency Pause: Halts outbound touches"
              >
                <span>Pause</span>
              </button>
            </div>

            {/* Quick Add Case Button */}
            {onAddCaseClick && (
              <button
                onClick={onAddCaseClick}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#00BAF2] hover:bg-[#009FD6] active:bg-[#0089BA] text-[#001740] font-bold text-xs shadow-xs transition-all cursor-pointer"
                title="Register a new customer overdue invoice"
              >
                <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                <span className="hidden md:inline">Add Overdue Case</span>
                <span className="md:hidden">Add Case</span>
              </button>
            )}

            {/* Merchant User Profile & Logout */}
            <div className="flex items-center gap-2 pl-2 border-l border-slate-200 text-xs">
              <div className="w-8 h-8 rounded-full bg-[#002970] text-white font-bold text-xs flex items-center justify-center border-2 border-[#00BAF2]/30 shadow-xs select-none">
                {getInitials(user?.name)}
              </div>
              <div className="hidden lg:block text-left leading-tight">
                <div className="font-bold text-slate-800 text-xs truncate max-w-[110px]">{user?.name || 'Ansh Goyal'}</div>
                <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">{user?.role || 'OWNER'}</div>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors cursor-pointer"
                  title="Sign out of merchant console"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              )}
            </div>

          </div>
        </div>
      </div>

      {/* Horizontal Navigation Tab Bar */}
      <nav className="bg-white border-t border-slate-100 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex items-center gap-1 overflow-x-auto no-scrollbar">
          <button
            onClick={() => onTabChange('overview')}
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
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
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
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
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold transition-colors whitespace-nowrap relative cursor-pointer ${
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
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
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
            className={`flex items-center gap-2 py-3 px-4 border-b-2 text-xs font-bold transition-colors whitespace-nowrap cursor-pointer ${
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
