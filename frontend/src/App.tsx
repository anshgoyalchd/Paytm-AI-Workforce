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

  useEffect(() => {
    const handleUnauthorized = () => {
      setCurrentUser(null);
    };
    window.addEventListener('auth:unauthorized', handleUnauthorized);

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
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-paytm-cyan selection:text-paytm-dark">
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
      <footer className="border-t border-slate-900 bg-slate-950/60 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Paytm AI Workforce — Autonomous Collections Agent #01 (Track 2: AI Teammates)</span>
          <span className="font-mono text-[11px] text-slate-600">Multi-Tenant Production SaaS • Real Overdue Invoices • Gemini Flash</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
