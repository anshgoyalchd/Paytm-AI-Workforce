import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { WorkforceOverview } from './components/WorkforceOverview';
import { CasesList } from './components/CasesList';
import { CaseDetailModal } from './components/CaseDetailModal';
import { EscalationCenter } from './components/EscalationCenter';
import { CustomerSimulator } from './components/CustomerSimulator';
import { GovernanceSettings } from './components/GovernanceSettings';
import { 
  CollectionCase, 
  WorkforceOverview as OverviewType, 
  Escalation, 
  AgentSettings, 
  AgentMode 
} from './types';
import { api } from './services/api';

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<string>('overview');
  const [agentMode, setAgentMode] = useState<AgentMode>('AUTONOMOUS');
  const [overview, setOverview] = useState<OverviewType | null>(null);
  const [cases, setCases] = useState<CollectionCase[]>([]);
  const [escalations, setEscalations] = useState<Escalation[]>([]);
  const [settings, setSettings] = useState<AgentSettings | null>(null);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    try {
      setIsLoading(true);
      const [overviewData, casesData, escalationsData, settingsData] = await Promise.all([
        api.getOverview().catch(() => null),
        api.getCases().catch(() => []),
        api.getEscalations().catch(() => []),
        api.getSettings().catch(() => null),
      ]);

      if (overviewData) setOverview(overviewData);
      setCases(casesData);
      setEscalations(escalationsData);
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
          <span className="font-mono text-[11px] text-slate-600">Free Tier Architecture • Gemini Flash • Mock Payment Gateway</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
