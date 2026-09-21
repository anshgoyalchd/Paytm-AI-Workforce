import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { WorkforceOverview } from './components/WorkforceOverview';
import { CasesList } from './components/CasesList';
import { CaseDetailModal } from './components/CaseDetailModal';
import { EscalationCenter } from './components/EscalationCenter';
import { CustomerSimulator } from './components/CustomerSimulator';
import { GovernanceSettings } from './components/GovernanceSettings';
import { AuthModal } from './components/AuthModal';
import { AddCaseModal } from './components/AddCaseModal';
import { 
  CollectionCase, 
  WorkforceOverview as OverviewType, 
  Escalation, 
  AgentSettings, 
  AgentMode,
  AuthUser
} from './types';
import { api } from './services/api';

export const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(() => {
    try {
      const saved = localStorage.getItem('paytm_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [agentMode, setAgentMode] = useState<AgentMode>('AUTONOMOUS');
  const [overview, setOverview] = useState<OverviewType | null>(null);
  const [cases, setCases] = useState<CollectionCase[]>([]);
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [settings, setSettings] = useState<AgentSettings | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [isAddCaseOpen, setIsAddCaseOpen] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [backendStatus, setBackendStatus] = useState<'idle' | 'waking' | 'ready'>('idle');
  const [backendLatency, setBackendLatency] = useState<number | null>(null);

  useEffect(() => {
    const handleUnauthorized = () => {
      setCurrentUser(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);

    // Eager backend health probe & keep-alive
    let isMounted = true;
    const wakeTimer = setTimeout(() => {
      if (isMounted) setBackendStatus('waking');
    }, 2500);

    const pingBackend = () => {
      api.pingHealth()
        .then((res) => {
          if (!isMounted) return;
          clearTimeout(wakeTimer);
          setBackendLatency(res.rtt);
          setBackendStatus((prev) => {
            if (prev === 'waking') {
              setTimeout(() => {
                if (isMounted) setBackendStatus('idle');
              }, 4000);
              return 'ready';
            }
            return 'idle';
          });
        })
        .catch(() => {
          // If direct ping fails or times out, try edge warmup proxy
          api.warmupEdge().catch(() => {});
        });
    };

    pingBackend();

    // Regular 8-minute client heartbeat while dashboard is open to prevent Render spin-down
    const heartbeatInterval = setInterval(() => {
      pingBackend();
    }, 8 * 60 * 1000);

    if (localStorage.getItem('paytm_token')) {
      // Refresh current profile from server to ensure active merchant details
      api.getMe()
        .then((me) => {
          setCurrentUser((prev) => ({ ...prev, ...me }));
          localStorage.setItem('paytm_user', JSON.stringify({ ...me }));
        })
        .catch(() => {
          // If token invalid, clear
          setCurrentUser(null);
          localStorage.removeItem('paytm_token');
          localStorage.removeItem('paytm_user');
        });
      loadAllData();
    } else {
      setIsLoading(false);
    }

    return () => {
      isMounted = false;
      clearTimeout(wakeTimer);
      clearInterval(heartbeatInterval);
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const loadAllData = async () => {
    if (!localStorage.getItem('paytm_token')) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const [overviewData, casesData, escalationsData, settingsData] = await Promise.all([
        api.getOverview().catch(() => null),
        api.getCases().catch(() => []),
        api.getEscalations().catch(() => []),
        api.getSettings().catch(() => null),
      ]);

      if (overviewData) setOverview(overviewData);
      setCases(casesData || []);
      setEscalations(escalationsData || []);
      if (settingsData) {
        setSettings(settingsData);
        setAgentMode(settingsData.agent_status);
      }
    } catch (err) {
      console.error('Error loading workforce data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleModeChange = async (newMode: AgentMode) => {
    setAgentMode(newMode);
    try {
      await api.toggleAgentMode(newMode);
      if (settings) {
        setSettings({ ...settings, agent_status: newMode });
      }
    } catch (err) {
      console.error('Failed to update agent mode:', err);
    }
  };

  const handleAuthSuccess = (user: AuthUser) => {
    setCurrentUser(user);
    loadAllData();
  };

  const pendingEscalationsCount = escalations.filter((e) => e.status === 'OPEN').length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        onTabChange={(t) => setCurrentTab(t)}
        agentMode={agentMode}
        onModeChange={handleModeChange}
        pendingEscalationsCount={pendingEscalationsCount}
        user={currentUser}
        onAddCaseClick={() => setIsAddCaseOpen(true)}
        onLogout={api.logout}
      />

      {/* Cold-start status notification */}
      {backendStatus === 'waking' && (
        <div className="bg-amber-50 border-b border-amber-200/80 px-4 py-2 text-xs font-medium text-amber-800 transition-all">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-amber-500"></span>
              </span>
              <span>
                <strong>Paytm Cloud Instance Initializing:</strong> Render backend is waking up from idle state (~25–40s). Real-time telemetry, calls, and agent models will be active shortly.
              </span>
            </div>
            <span className="hidden sm:inline-block font-mono text-[11px] bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-300">
              Waking Container...
            </span>
          </div>
        </div>
      )}

      {backendStatus === 'ready' && (
        <div className="bg-emerald-50 border-b border-emerald-200 px-4 py-2 text-xs font-medium text-emerald-800 transition-all">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              <span>
                <strong>Paytm AI Neural Engine Online:</strong> Backend container is fully warmed and synchronized.
              </span>
            </div>
            {backendLatency !== null && (
              <span className="font-mono text-[11px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded border border-emerald-300">
                RTT: {backendLatency}ms
              </span>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {currentTab === 'overview' && (
          <WorkforceOverview
            overview={overview}
            onNavigateTab={(t) => setCurrentTab(t)}
          />
        )}

        {currentTab === 'cases' && (
          <CasesList
            cases={cases}
            onSelectCase={(c) => setSelectedCaseId(c.id)}
            isLoading={isLoading}
            onAddCaseClick={() => setIsAddCaseOpen(true)}
            onCaseUpdated={loadAllData}
          />
        )}

        {currentTab === 'escalations' && (
          <EscalationCenter
            escalations={escalations}
            onEscalationResolved={loadAllData}
            isLoading={isLoading}
          />
        )}

        {currentTab === 'simulator' && (
          <CustomerSimulator cases={cases} />
        )}

        {currentTab === 'governance' && (
          <GovernanceSettings
            settings={settings}
            onSettingsSaved={loadAllData}
          />
        )}
      </main>

      {/* Auth Modal if unauthenticated */}
      {!currentUser && (
        <AuthModal onSuccess={handleAuthSuccess} />
      )}

      {/* Add Overdue Invoice Modal */}
      <AddCaseModal
        isOpen={isAddCaseOpen}
        onClose={() => setIsAddCaseOpen(false)}
        onSuccess={() => {
          loadAllData();
        }}
      />

      {/* Case Detail Modal / Drawer */}
      {selectedCaseId && (
        <CaseDetailModal
          caseId={selectedCaseId}
          onClose={() => setSelectedCaseId(null)}
          onCaseUpdated={loadAllData}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Paytm AI Workforce — Autonomous Collections Agent #01 (Track 3: AI Teammates)</span>
          <span className="font-mono text-[11px] text-slate-500">Multi-Tenant Production SaaS • Real Overdue Invoices • Gemini Flash</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
