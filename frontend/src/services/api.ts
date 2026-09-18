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

// Intercept 401 unauthorized to clear expired session
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
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
    const res = await axios.post(`${API_BASE}/auth/login`, payload);
    const data = res.data;
    localStorage.setItem('paytm_token', data.access_token);
    localStorage.setItem('paytm_user', JSON.stringify(data));
    return data;
  },

  async register(payload: RegisterPayload): Promise<AuthUser> {
    const res = await axios.post(`${API_BASE}/auth/register`, payload);
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
};
