export type CaseStatus =
  | 'NEW'
  | 'CONTACT_ATTEMPTED'
  | 'CONTACTED'
  | 'PROMISE_TO_PAY'
  | 'DISPUTED'
  | 'ESCALATED'
  | 'PAYMENT_PENDING'
  | 'SETTLED'
  | 'CLOSED';

export type AgentMode = 'AUTONOMOUS' | 'SUPERVISED' | 'PAUSED';

export interface Customer {
  id: string;
  merchant_id: string;
  name: string;
  phone: string;
  email?: string;
  preferred_language: string;
  preferred_channel: string;
  contact_status: string;
}

export interface Invoice {
  id: string;
  invoice_number: string;
  amount: number;
  currency: string;
  issue_date: string;
  due_date: string;
  status: string;
}

export interface CollectionCase {
  id: string;
  merchant_id: string;
  customer_id: string;
  invoice_id: string;
  status: CaseStatus;
  priority: string;
  outstanding_amount: number;
  currency: string;
  assigned_mode: string;
  opened_at: string;
  closed_at?: string;
  next_action_at?: string;
  version: number;
  created_at: string;
  updated_at: string;
  customer?: Customer;
  invoice?: Invoice;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_type: 'AGENT' | 'CUSTOMER' | 'OPERATOR' | 'SYSTEM';
  message_type: string;
  content: string;
  language: string;
  turn_number: number;
  timestamp: string;
}

export interface Conversation {
  id: string;
  channel: string;
  status: string;
  language: string;
  started_at: string;
  messages: Message[];
}

export interface Decision {
  id: string;
  case_id: string;
  model_provider: string;
  model_name?: string;
  proposed_action: string;
  customer_intent?: string;
  confidence?: number;
  reason: string;
  policy_status: string;
  approval_status: string;
  execution_status: string;
  created_at: string;
}

export interface Action {
  id: string;
  case_id: string;
  action_type: string;
  channel?: string;
  status: string;
  idempotency_key: string;
  provider?: string;
  provider_reference?: string;
  requested_at: string;
  executed_at?: string;
  completed_at?: string;
  error_message_safe?: string;
}

export interface PaymentVerification {
  id: string;
  status: 'PAID' | 'NOT_PAID' | 'PENDING' | 'UNKNOWN' | 'ERROR';
  amount?: number;
  currency: string;
  verified_at: string;
  provider: string;
}

export interface Escalation {
  id: string;
  case_id: string;
  reason: string;
  priority: string;
  status: 'OPEN' | 'RESOLVED';
  assigned_user_id?: string;
  resolution?: string;
  resolved_at?: string;
  created_at: string;
}

export interface CaseDetail extends CollectionCase {
  conversations: Conversation[];
  decisions: Decision[];
  actions: Action[];
  commitments: any[];
  verifications: PaymentVerification[];
  escalations: Escalation[];
}

export interface AgentSettings {
  merchant_id: string;
  agent_status: AgentMode;
  contact_start_hour: number;
  contact_end_hour: number;
  max_contact_attempts: number;
  min_hours_between_contacts: number;
  auto_voice_enabled: boolean;
  auto_whatsapp_enabled: boolean;
  updated_at: string;
}

export interface WorkforceOverview {
  workforce_status: string;
  agent_name: string;
  total_cases: number;
  active_cases: number;
  settled_cases: number;
  escalated_cases: number;
  total_outstanding: number;
  total_recovered: number;
  recovery_rate_pct: number;
  actions_taken: {
    total: number;
    whatsapp_sent: number;
    calls_completed: number;
  };
  governance: {
    total_decisions: number;
    policy_approved: number;
    compliance_adherence_pct: number;
  };
}

export interface SimulatorScenario {
  id: string;
  title: string;
  description: string;
  sample_input: string;
  expected_intent: string;
  expected_action: string;
}

export interface SimulationResult {
  step: string;
  customer_input: string;
  detected_intent: string;
  agent_decision: string;
  policy_check: {
    is_allowed: boolean;
    policy_name: string;
    reason: string;
    requires_human_approval: boolean;
    suggested_backoff_hours?: number;
  };
  agent_response: string;
  case_status_after: CaseStatus;
  verification_status?: string;
  escalated: boolean;
}
