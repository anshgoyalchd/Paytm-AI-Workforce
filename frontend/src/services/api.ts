import axios from 'axios';
import {
  CollectionCase,
  CaseDetail,
  WorkforceOverview,
  Escalation,
  Decision,
  AgentSettings,
  SimulatorScenario,
  SimulationResult,
  AgentMode,
  AuthUser,
  LoginPayload,
  RegisterPayload,
  CreateCasePayload,
  BulkUploadResponse,
} from '../types';

const BASE_URL = import.meta.env.VITE_API_BASE_URL ? import.meta.env.VITE_API_BASE_URL.replace(/\/+$/, '') : '';
const API_BASE = `${BASE_URL}/api/v1`;

const apiClient = axios.create({
  timeout: 60000, // 60s timeout allows Render cold-start without prematurely failing
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auto-inject JWT token from localStorage
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('paytm_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Intercept responses for cold-start retry and 401 unauthorized
apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error.config;
    if (!config) return Promise.reject(error);

    // Track retry count
    config.__retryCount = config.__retryCount || 0;

    // Retry on cold-start / server booting errors (502, 503, 504, ECONNABORTED, ERR_NETWORK)
    const isColdStartError =
      error.code === 'ECONNABORTED' ||
      error.code === 'ERR_NETWORK' ||
      (error.response && [502, 503, 504].includes(error.response.status));

    if (isColdStartError && config.__retryCount < 2 && (!config.method || config.method.toLowerCase() === 'get')) {
      config.__retryCount += 1;
      // Wait 3 seconds for container to initialize before retry
      await new Promise((resolve) => setTimeout(resolve, 3000));
      return apiClient(config);
    }

    if (error.response?.status === 401) {
      localStorage.removeItem('paytm_token');
      localStorage.removeItem('paytm_user');
      window.dispatchEvent(new Event('auth:unauthorized'));
    }
    return Promise.reject(error);
  }
);

export const api = {
  // Authentication & Onboarding
  async login(payload: LoginPayload): Promise<AuthUser> {
    const res = await axios.post(`${API_BASE}/auth/login`, payload, { timeout: 60000 });
    const data = res.data;
    localStorage.setItem('paytm_token', data.access_token);
    localStorage.setItem('paytm_user', JSON.stringify(data));
    return data;
  },

  async register(payload: RegisterPayload): Promise<AuthUser> {
    const res = await axios.post(`${API_BASE}/auth/register`, payload, { timeout: 60000 });
    const data = res.data;
    localStorage.setItem('paytm_token', data.access_token);
    localStorage.setItem('paytm_user', JSON.stringify(data));
    return data;
  },

  async getMe(): Promise<AuthUser> {
    const res = await apiClient.get<AuthUser>(`${API_BASE}/auth/me`);
    return res.data;
  },

  logout(): void {
    localStorage.removeItem('paytm_token');
    localStorage.removeItem('paytm_user');
    window.location.reload();
  },

  // Overview & Analytics
  async getOverview(): Promise<WorkforceOverview> {
    const res = await apiClient.get<WorkforceOverview>(`${API_BASE}/analytics/overview`);
    return res.data;
  },

  // Cases
  async getCases(status?: string, search?: string): Promise<CollectionCase[]> {
    const params: Record<string, string> = {};
    if (status && status !== 'ALL') params.status = status;
    if (search) params.search = search;
    const res = await apiClient.get<CollectionCase[]>(`${API_BASE}/cases`, { params });
    return res.data;
  },

  async getCaseDetail(caseId: string): Promise<CaseDetail> {
    const res = await apiClient.get<CaseDetail>(`${API_BASE}/cases/${caseId}`);
    return res.data;
  },

  async createCase(payload: CreateCasePayload): Promise<CollectionCase> {
    const res = await apiClient.post<CollectionCase>(`${API_BASE}/cases`, payload);
    return res.data;
  },

  async uploadCasesCSV(file: File): Promise<BulkUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);
    const res = await apiClient.post<BulkUploadResponse>(`${API_BASE}/cases/upload-csv`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return res.data;
  },

  async triggerCaseTurn(caseId: string, message?: string): Promise<any> {
    const params: Record<string, string> = {};
    if (message) params.customer_message = message;
    const res = await apiClient.post(`${API_BASE}/cases/${caseId}/trigger-turn`, null, { params });
    return res.data;
  },

  async triggerAutoReach(caseId: string, channel?: string): Promise<any> {
    const params: Record<string, string> = {};
    if (channel) params.channel = channel;
    const res = await apiClient.post(`${API_BASE}/cases/${caseId}/auto-reach`, null, { params });
    return res.data;
  },

  async triggerAutoReachAll(): Promise<any> {
    const res = await apiClient.post(`${API_BASE}/cases/auto-reach-all`);
    return res.data;
  },

  async getCogneeHealth(): Promise<any> {
    const res = await apiClient.get(`${API_BASE}/analytics/cognee-health`);
    return res.data;
  },

  // Escalations
  async getEscalations(status?: string): Promise<Escalation[]> {
    const params: Record<string, string> = {};
    if (status && status !== 'ALL') params.status = status;
    const res = await apiClient.get<Escalation[]>(`${API_BASE}/escalations`, { params });
    return res.data;
  },

  async resolveEscalation(escalationId: string, resolution: string): Promise<any> {
    const res = await apiClient.post(`${API_BASE}/escalations/${escalationId}/resolve`, {
      resolution,
      status: 'RESOLVED',
    });
    return res.data;
  },

  // Decisions
  async getDecisions(caseId?: string): Promise<Decision[]> {
    const params: Record<string, string> = {};
    if (caseId) params.case_id = caseId;
    const res = await apiClient.get<Decision[]>(`${API_BASE}/decisions`, { params });
    return res.data;
  },

  async approveDecision(decisionId: string): Promise<any> {
    const res = await apiClient.post(`${API_BASE}/decisions/${decisionId}/approve`);
    return res.data;
  },

  async rejectDecision(decisionId: string, reason?: string): Promise<any> {
    const res = await apiClient.post(`${API_BASE}/decisions/${decisionId}/reject`, null, {
      params: { reason },
    });
    return res.data;
  },

  // Agent Settings & Governance
  async getSettings(): Promise<AgentSettings> {
    const res = await apiClient.get<AgentSettings>(`${API_BASE}/settings`);
    return res.data;
  },

  async toggleAgentMode(mode: AgentMode): Promise<any> {
    const res = await apiClient.post(`${API_BASE}/settings/toggle-mode?mode=${mode}`);
    return res.data;
  },

  async updateSettings(payload: Partial<AgentSettings>): Promise<AgentSettings> {
    const res = await apiClient.put<AgentSettings>(`${API_BASE}/settings`, payload);
    return res.data;
  },

  // Customer Scenario Simulator
  async getScenarios(): Promise<SimulatorScenario[]> {
    const res = await apiClient.get<SimulatorScenario[]>(`${API_BASE}/simulator/scenarios`);
    return res.data;
  },

  async runScenario(caseId: string, scenarioName: string, customerMessage?: string): Promise<SimulationResult> {
    const res = await apiClient.post<SimulationResult>(`${API_BASE}/simulator/run`, {
      case_id: caseId,
      scenario_name: scenarioName,
      customer_message: customerMessage,
    });
    return res.data;
  },

  // Mock Payment Gateway Direct Inspection
  async checkMockPayment(invoiceId: string): Promise<any> {
    const res = await apiClient.get(`${BASE_URL}/api/mock/payments/${invoiceId}`);
    return res.data;
  },

  // Health check & keep-alive ping
  async pingHealth(): Promise<{ status: string; rtt: number }> {
    const t0 = performance.now();
    const res = await axios.get(`${BASE_URL}/health`, { timeout: 60000 });
    const rtt = Math.round(performance.now() - t0);
    return { status: res.data?.status || 'HEALTHY', rtt };
  },

  // Cloudflare Edge warmup proxy
  async warmupEdge(): Promise<any> {
    try {
      const res = await axios.get('/api/warmup', { timeout: 60000 });
      return res.data;
    } catch (e) {
      return null;
    }
  },
};

