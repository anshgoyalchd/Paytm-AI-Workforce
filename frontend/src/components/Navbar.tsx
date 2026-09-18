import React from 'react';
import { 
  Bot, 
  ShieldCheck, 
  AlertTriangle, 
  PauseCircle, 
  PlayCircle, 
  Eye, 
  Store, 
  UserCheck,
  Plus,
  LogOut
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
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            AGENT ONLINE (AUTONOMOUS)
          </div>
        );
      case 'SUPERVISED':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Eye className="w-3.5 h-3.5" />
            SUPERVISED MODE
          </div>
        );
      case 'PAUSED':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-500/10 text-rose-400 border border-rose-500/20">
            <PauseCircle className="w-3.5 h-3.5" />
            AGENT PAUSED
          </div>
        );
    }
  };

  const getInitials = (name?: string) => {
    if (!name) return 'ME';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-paytm-blue to-paytm-cyan flex items-center justify-center shadow-lg shadow-sky-500/10">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-white tracking-tight">Paytm AI Workforce</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-paytm-cyan/10 text-paytm-cyan border border-paytm-cyan/20">
                    Collections #01
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Store className="w-3 h-3 text-slate-500" />
                  <span className="font-medium text-slate-300">{user?.business_name || 'My Merchant Workspace'}</span>
                  <span className="text-slate-600">•</span>
                  <span>Asia/Kolkata (IST)</span>
                </div>
              </div>
            </div>
            <div className="hidden md:block ml-2">
              {getStatusBadge()}
            </div>
          </div>

          {/* Mode Controls, Add Invoice & User */}
          <div className="flex items-center gap-3">
            {/* Add Invoice Quick Action */}
            {onAddCaseClick && (
              <button
                onClick={onAddCaseClick}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500 hover:bg-sky-400 text-white font-semibold text-xs shadow-md shadow-sky-500/20 transition-all"
                title="Add a new customer overdue invoice"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Invoice</span>
              </button>
            )}

            {/* Global Killswitch / Mode Switcher */}
            <div className="hidden sm:flex items-center p-0.5 rounded-lg bg-slate-900 border border-slate-800">
              <button
                onClick={() => onModeChange('AUTONOMOUS')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  agentMode === 'AUTONOMOUS'
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Autonomous: Agent decides and acts within policy rules"
              >
                <PlayCircle className="w-3.5 h-3.5" />
                Auto
              </button>
              <button
                onClick={() => onModeChange('SUPERVISED')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  agentMode === 'SUPERVISED'
                    ? 'bg-amber-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Supervised: Actions require human approval"
              >
                <Eye className="w-3.5 h-3.5" />
                Supervised
              </button>
              <button
                onClick={() => onModeChange('PAUSED')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  agentMode === 'PAUSED'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-rose-400'
                }`}
                title="Emergency Pause: Halts all outbound collection contacts"
              >
                <PauseCircle className="w-3.5 h-3.5" />
                Pause
              </button>
            </div>

            {/* Merchant User Pill */}
            <div className="flex items-center gap-2 pl-3 border-l border-slate-800 text-xs">
              <div className="w-7 h-7 rounded-full bg-sky-950 border border-sky-600/40 flex items-center justify-center text-sky-300 font-semibold text-[11px]">
                {getInitials(user?.name)}
              </div>
              <div className="hidden md:block text-left">
                <div className="font-medium text-slate-200 truncate max-w-[120px]">{user?.name || 'Merchant'}</div>
                <div className="text-[10px] text-slate-400 uppercase">{user?.role || 'OWNER'}</div>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-900 transition-colors ml-1"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 border-t border-slate-800/80 -mb-px">
          {[
            { id: 'overview', label: 'Workforce Overview' },
            { id: 'cases', label: 'Collections Portfolio' },
            { 
              id: 'escalations', 
              label: 'Escalation Center', 
              badge: pendingEscalationsCount > 0 ? pendingEscalationsCount : undefined 
            },
            { id: 'simulator', label: 'Scenario Simulator' },
            { id: 'governance', label: 'Policy & Governance' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 py-3 px-4 text-xs font-medium border-b-2 transition-all ${
                currentTab === tab.id
                  ? 'border-paytm-cyan text-paytm-cyan'
                  : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-400 border border-rose-500/30">
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};
