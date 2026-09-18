from datetime import datetime, date
from typing import Optional, List, Dict, Any
from pydantic import BaseModel, Field, ConfigDict
from enum import Enum


# --- Enums ---

class CaseStatus(str, Enum):
    NEW = "NEW"
    CONTACT_ATTEMPTED = "CONTACT_ATTEMPTED"
    CONTACTED = "CONTACTED"
    PROMISE_TO_PAY = "PROMISE_TO_PAY"
    DISPUTED = "DISPUTED"
    ESCALATED = "ESCALATED"
    PAYMENT_PENDING = "PAYMENT_PENDING"
    SETTLED = "SETTLED"
    CLOSED = "CLOSED"


class ActionType(str, Enum):
    WAIT = "WAIT"
    TEXT = "TEXT"
    CALL = "CALL"
    ESCALATE = "ESCALATE"


class Channel(str, Enum):
    WHATSAPP = "WHATSAPP"
    VOICE = "VOICE"
    SMS = "SMS"


class CustomerIntent(str, Enum):
    CONFIRM_PAYMENT = "CONFIRM_PAYMENT"
    PROMISE_TO_PAY = "PROMISE_TO_PAY"
    DISPUTE_AMOUNT = "DISPUTE_AMOUNT"
    DISPUTE_GOODS_SERVICES = "DISPUTE_GOODS_SERVICES"
    REQUEST_EXTENSION = "REQUEST_EXTENSION"
    FINANCIAL_HARDSHIP = "FINANCIAL_HARDSHIP"
    ALREADY_PAID = "ALREADY_PAID"
    WRONG_NUMBER = "WRONG_NUMBER"
    REFUSAL_TO_PAY = "REFUSAL_TO_PAY"
    UNCLEAR_QUERY = "UNCLEAR_QUERY"


class VerificationStatus(str, Enum):
    PAID = "PAID"
    NOT_PAID = "NOT_PAID"
    PENDING = "PENDING"
    UNKNOWN = "UNKNOWN"
    ERROR = "ERROR"


class AgentMode(str, Enum):
    AUTONOMOUS = "AUTONOMOUS"
    SUPERVISED = "SUPERVISED"
    PAUSED = "PAUSED"


# --- Common & Token Schemas ---

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    merchant_id: str
    user_id: str
    role: str
    name: str


class LoginRequest(BaseModel):
    email: str
    password: str


# --- Merchant & User ---

class MerchantRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    name: str
    status: str
    timezone: str
    created_at: datetime


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    merchant_id: str
    name: str
    email: str
    role: str
    status: str


# --- Customer & Invoice ---

class CustomerRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    merchant_id: str
    name: str
    phone: str
    email: Optional[str] = None
    preferred_language: str
    preferred_channel: str
    contact_status: str


class InvoiceRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    merchant_id: str
    customer_id: str
    invoice_number: str
    amount: float
    currency: str
    issue_date: datetime
    due_date: datetime
    status: str


# --- Case Schemas ---

class CaseRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    merchant_id: str
    customer_id: str
    invoice_id: str
    status: CaseStatus
    priority: str
    outstanding_amount: float
    currency: str
    assigned_mode: str
    opened_at: datetime
    closed_at: Optional[datetime] = None
    next_action_at: Optional[datetime] = None
    version: int
    created_at: datetime
    updated_at: datetime
    customer: Optional[CustomerRead] = None
    invoice: Optional[InvoiceRead] = None


class CaseDetail(CaseRead):
    conversations: List["ConversationRead"] = []
    decisions: List["DecisionRead"] = []
    actions: List["ActionRead"] = []
    commitments: List["PaymentCommitmentRead"] = []
    verifications: List["PaymentVerificationRead"] = []
    escalations: List["EscalationRead"] = []


# --- Conversation & Message ---

class MessageCreate(BaseModel):
    conversation_id: str
    case_id: str
    sender_type: str  # AGENT | CUSTOMER | OPERATOR | SYSTEM
    message_type: str = "TEXT"
    content: str
    language: str = "Hindi"
    turn_number: int = 1
    metadata: Optional[Dict[str, Any]] = None


class MessageRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    conversation_id: str
    case_id: str
    sender_type: str
    message_type: str
    content: str
    language: str
    turn_number: int
    timestamp: datetime
    metadata_payload: Optional[str] = None


class ConversationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    merchant_id: str
    customer_id: str
    case_id: str
    channel: str
    status: str
    language: str
    provider: Optional[str] = None
    provider_reference: Optional[str] = None
    started_at: datetime
    ended_at: Optional[datetime] = None
    messages: List[MessageRead] = []


# --- Decision & Policy Engine ---

class DecisionPropose(BaseModel):
    case_id: str
    proposed_action: ActionType
    customer_intent: Optional[CustomerIntent] = None
    channel: Optional[Channel] = None
    confidence: float = Field(..., ge=0.0, le=1.0)
    reason: str
    message_content: Optional[str] = None
    scheduled_follow_up_hours: Optional[int] = None
    escalation_reason: Optional[str] = None


class PolicyEvaluationResult(BaseModel):
    is_allowed: bool
    policy_name: str
    reason: str
    requires_human_approval: bool = False
    suggested_backoff_hours: Optional[int] = None
    sanitized_action: Optional[ActionType] = None


class DecisionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    case_id: str
    conversation_id: Optional[str] = None
    model_provider: str
    model_name: Optional[str] = None
    proposed_action: str
    customer_intent: Optional[str] = None
    confidence: Optional[float] = None
    reason: str
    policy_status: str
    approval_status: str
    execution_status: str
    created_at: datetime


# --- Actions ---

class ActionCreate(BaseModel):
    case_id: str
    decision_id: Optional[str] = None
    action_type: ActionType
    channel: Optional[Channel] = None
    idempotency_key: str
    provider: Optional[str] = None


class ActionRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    case_id: str
    decision_id: Optional[str] = None
    action_type: str
    channel: Optional[str] = None
    status: str
    idempotency_key: str
    provider: Optional[str] = None
    provider_reference: Optional[str] = None
    requested_at: datetime
    executed_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    error_code: Optional[str] = None
    error_message_safe: Optional[str] = None


# --- Commitments & Verifications ---

class PaymentCommitmentRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    case_id: str
    customer_id: str
    promised_date: date
    promised_time: Optional[str] = None
    status: str
    created_at: datetime


class PaymentVerificationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    case_id: str
    invoice_id: str
    provider: str
    provider_reference: Optional[str] = None
    status: str  # PAID | NOT_PAID | PENDING | UNKNOWN | ERROR
    amount: Optional[float] = None
    currency: str
    verified_at: datetime
    error_code: Optional[str] = None


# --- Escalations ---

class EscalationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: str
    case_id: str
    reason: str
    priority: str
    status: str
    assigned_user_id: Optional[str] = None
    resolution: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime


class EscalationResolve(BaseModel):
    resolution: str
    status: str = "RESOLVED"


# --- Agent Settings ---

class AgentSettingsRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    merchant_id: str
    agent_status: str
    contact_start_hour: int
    contact_end_hour: int
    max_contact_attempts: int
    min_hours_between_contacts: int
    auto_voice_enabled: bool
    auto_whatsapp_enabled: bool
    updated_at: datetime


class AgentSettingsUpdate(BaseModel):
    agent_status: Optional[str] = None
    contact_start_hour: Optional[int] = None
    contact_end_hour: Optional[int] = None
    max_contact_attempts: Optional[int] = None
    min_hours_between_contacts: Optional[int] = None
    auto_voice_enabled: Optional[bool] = None
    auto_whatsapp_enabled: Optional[bool] = None


# --- Simulation Schema (for 8 scenarios) ---

class SimulationRequest(BaseModel):
    case_id: str
    scenario_name: str  # e.g. "immediate_pay", "promise_to_pay", "dispute", "hardship", etc.
    channel: Channel = Channel.WHATSAPP
    customer_message: Optional[str] = None


class SimulationResponse(BaseModel):
    step: str
    customer_input: str
    detected_intent: str
    agent_decision: str
    policy_check: PolicyEvaluationResult
    agent_response: str
    case_status_after: CaseStatus
    verification_status: Optional[str] = None
    escalated: bool = False
