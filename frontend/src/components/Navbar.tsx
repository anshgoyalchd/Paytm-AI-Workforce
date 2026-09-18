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
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            AGENT ONLINE (AUTONOMOUS)
          </div>
        );
      case 'SUPERVISED':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
            <Eye className="w-3.5 h-3.5" />
            SUPERVISED MODE
          </div>
        );
      case 'PAUSED':
        return (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
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
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 bg-white shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand Logo & Info */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-[#002970] flex items-center justify-center text-white shadow-xs">
                <Bot className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-base font-bold text-slate-900 tracking-tight">Paytm AI Workforce</span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                    Collections #01
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <Store className="w-3 h-3 text-slate-400" />
                  <span className="font-medium text-slate-700">{user?.business_name || 'My Merchant Workspace'}</span>
                  <span className="text-slate-300">•</span>
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
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-[#002970] hover:bg-[#001f54] text-white font-medium text-xs shadow-xs transition-all"
                title="Add a new customer overdue invoice"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Add Invoice</span>
              </button>
            )}

            {/* Global Killswitch / Mode Switcher */}
            <div className="hidden sm:flex items-center p-0.5 rounded-lg bg-slate-100 border border-slate-200">
              <button
                onClick={() => onModeChange('AUTONOMOUS')}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                  agentMode === 'AUTONOMOUS'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
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
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
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
                    ? 'bg-rose-600 text-white shadow-xs'
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
              <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-[#002970] font-semibold text-[11px]">
                {getInitials(user?.name)}
              </div>
              <div className="hidden md:block text-left">
                <div className="font-medium text-slate-800 truncate max-w-[120px]">{user?.name || 'Merchant'}</div>
                <div className="text-[10px] text-slate-500 uppercase">{user?.role || 'OWNER'}</div>
              </div>
              {onLogout && (
                <button
                  onClick={onLogout}
                  className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-slate-100 transition-colors ml-1"
                  title="Sign Out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 border-t border-slate-200 -mb-px">
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
                  ? 'border-blue-600 text-blue-600 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <span>{tab.label}</span>
              {tab.badge && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
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
