import uuid
from datetime import datetime, timezone
from typing import Optional, List
from sqlalchemy import (
    String,
    Text,
    Numeric,
    Integer,
    Boolean,
    DateTime,
    Date,
    ForeignKey,
    Index,
)
from sqlalchemy.orm import Mapped, mapped_column, relationship
from backend.app.core.database import Base


def generate_uuid() -> str:
    return str(uuid.uuid4())


def utc_now() -> datetime:
    return datetime.now(timezone.utc)


class Merchant(Base):
    __tablename__ = "merchants"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=generate_uuid)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="ACTIVE")
    timezone: Mapped[str] = mapped_column(String(64), nullable=False, default="Asia/Kolkata")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    # Relationships
    users: Mapped[List["User"]] = relationship("User", back_populates="merchant")
    customers: Mapped[List["Customer"]] = relationship("Customer", back_populates="merchant")
    invoices: Mapped[List["Invoice"]] = relationship("Invoice", back_populates="merchant")
    cases: Mapped[List["CollectionCase"]] = relationship("CollectionCase", back_populates="merchant")
    settings: Mapped[Optional["AgentSetting"]] = relationship("AgentSetting", back_populates="merchant", uselist=False)


class User(Base):
    __tablename__ = "users"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=generate_uuid)
    merchant_id: Mapped[str] = mapped_column(String(64), ForeignKey("merchants.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    email: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    password_hash: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[str] = mapped_column(String(32), nullable=False, default="OPERATOR")
    status: Mapped[str] = mapped_column(String(32), nullable=False, default="ACTIVE")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    merchant: Mapped["Merchant"] = relationship("Merchant", back_populates="users")


class Customer(Base):
    __tablename__ = "customers"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=generate_uuid)
    merchant_id: Mapped[str] = mapped_column(String(64), ForeignKey("merchants.id"), nullable=False)
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    phone: Mapped[str] = mapped_column(String(32), nullable=False)
    email: Mapped[Optional[str]] = mapped_column(String(255), nullable=True)
    preferred_language: Mapped[str] = mapped_column(String(32), default="Hindi")
    preferred_channel: Mapped[str] = mapped_column(String(32), default="WHATSAPP")
    contact_status: Mapped[str] = mapped_column(String(32), default="CONTACTABLE")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    merchant: Mapped["Merchant"] = relationship("Merchant", back_populates="customers")
    invoices: Mapped[List["Invoice"]] = relationship("Invoice", back_populates="customer")
    cases: Mapped[List["CollectionCase"]] = relationship("CollectionCase", back_populates="customer")


class Invoice(Base):
    __tablename__ = "invoices"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=generate_uuid)
    merchant_id: Mapped[str] = mapped_column(String(64), ForeignKey("merchants.id"), nullable=False)
    customer_id: Mapped[str] = mapped_column(String(64), ForeignKey("customers.id"), nullable=False)
    invoice_number: Mapped[str] = mapped_column(String(64), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(8), default="INR")
    issue_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    due_date: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="OVERDUE")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    merchant: Mapped["Merchant"] = relationship("Merchant", back_populates="invoices")
    customer: Mapped["Customer"] = relationship("Customer", back_populates="invoices")
    cases: Mapped[List["CollectionCase"]] = relationship("CollectionCase", back_populates="invoice")


class CollectionCase(Base):
    __tablename__ = "collection_cases"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=generate_uuid)
    merchant_id: Mapped[str] = mapped_column(String(64), ForeignKey("merchants.id"), nullable=False)
    customer_id: Mapped[str] = mapped_column(String(64), ForeignKey("customers.id"), nullable=False)
    invoice_id: Mapped[str] = mapped_column(String(64), ForeignKey("invoices.id"), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="NEW")
    priority: Mapped[str] = mapped_column(String(32), default="MEDIUM")
    outstanding_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    currency: Mapped[str] = mapped_column(String(8), default="INR")
    assigned_mode: Mapped[str] = mapped_column(String(32), default="AUTONOMOUS")
    opened_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    closed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    next_action_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    version: Mapped[int] = mapped_column(Integer, default=1)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    merchant: Mapped["Merchant"] = relationship("Merchant", back_populates="cases")
    customer: Mapped["Customer"] = relationship("Customer", back_populates="cases")
    invoice: Mapped["Invoice"] = relationship("Invoice", back_populates="cases")
    conversations: Mapped[List["Conversation"]] = relationship("Conversation", back_populates="case")
    decisions: Mapped[List["Decision"]] = relationship("Decision", back_populates="case")
    actions: Mapped[List["Action"]] = relationship("Action", back_populates="case")
    commitments: Mapped[List["PaymentCommitment"]] = relationship("PaymentCommitment", back_populates="case")
    verifications: Mapped[List["PaymentVerification"]] = relationship("PaymentVerification", back_populates="case")
    escalations: Mapped[List["Escalation"]] = relationship("Escalation", back_populates="case")
    follow_ups: Mapped[List["FollowUp"]] = relationship("FollowUp", back_populates="case")


class Conversation(Base):
    __tablename__ = "conversations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=generate_uuid)
    merchant_id: Mapped[str] = mapped_column(String(64), ForeignKey("merchants.id"), nullable=False)
    customer_id: Mapped[str] = mapped_column(String(64), ForeignKey("customers.id"), nullable=False)
    case_id: Mapped[str] = mapped_column(String(64), ForeignKey("collection_cases.id"), nullable=False)
    channel: Mapped[str] = mapped_column(String(32), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="INITIATED")
    language: Mapped[str] = mapped_column(String(32), default="Hindi")
    provider: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    provider_reference: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    started_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    ended_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    case: Mapped["CollectionCase"] = relationship("CollectionCase", back_populates="conversations")
    messages: Mapped[List["Message"]] = relationship("Message", back_populates="conversation")
    intents: Mapped[List["ConversationIntent"]] = relationship("ConversationIntent", back_populates="conversation")


class Message(Base):
    __tablename__ = "messages"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=generate_uuid)
    conversation_id: Mapped[str] = mapped_column(String(64), ForeignKey("conversations.id"), nullable=False)
    case_id: Mapped[str] = mapped_column(String(64), ForeignKey("collection_cases.id"), nullable=False)
    sender_type: Mapped[str] = mapped_column(String(32), nullable=False)  # AGENT | CUSTOMER | OPERATOR | SYSTEM
    message_type: Mapped[str] = mapped_column(String(32), default="TEXT")
    content: Mapped[str] = mapped_column(Text, nullable=False)
    language: Mapped[str] = mapped_column(String(32), default="Hindi")
    provider_message_id: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    turn_number: Mapped[int] = mapped_column(Integer, default=1)
    timestamp: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    metadata_payload: Mapped[Optional[str]] = mapped_column("metadata", Text, default="{}")

    conversation: Mapped["Conversation"] = relationship("Conversation", back_populates="messages")


class ConversationIntent(Base):
    __tablename__ = "conversation_intents"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=generate_uuid)
    conversation_id: Mapped[str] = mapped_column(String(64), ForeignKey("conversations.id"), nullable=False)
    message_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("messages.id"), nullable=True)
    intent: Mapped[str] = mapped_column(String(64), nullable=False)
    confidence: Mapped[Optional[float]] = mapped_column(Numeric(4, 3), nullable=True)
    extraction_source: Mapped[str] = mapped_column(String(64), default="GEMINI")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    conversation: Mapped["Conversation"] = relationship("Conversation", back_populates="intents")


class PaymentCommitment(Base):
    __tablename__ = "payment_commitments"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=generate_uuid)
    case_id: Mapped[str] = mapped_column(String(64), ForeignKey("collection_cases.id"), nullable=False)
    customer_id: Mapped[str] = mapped_column(String(64), ForeignKey("customers.id"), nullable=False)
    promised_date: Mapped[datetime] = mapped_column(Date, nullable=False)
    promised_time: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    source_message_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("messages.id"), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="PENDING")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    case: Mapped["CollectionCase"] = relationship("CollectionCase", back_populates="commitments")


class PaymentVerification(Base):
    __tablename__ = "payment_verifications"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=generate_uuid)
    case_id: Mapped[str] = mapped_column(String(64), ForeignKey("collection_cases.id"), nullable=False)
    invoice_id: Mapped[str] = mapped_column(String(64), ForeignKey("invoices.id"), nullable=False)
    provider: Mapped[str] = mapped_column(String(32), default="MOCK")
    provider_reference: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    status: Mapped[str] = mapped_column(String(32), nullable=False)  # PAID | NOT_PAID | PENDING | UNKNOWN | ERROR
    amount: Mapped[Optional[float]] = mapped_column(Numeric(12, 2), nullable=True)
    currency: Mapped[str] = mapped_column(String(8), default="INR")
    verified_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    error_code: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    case: Mapped["CollectionCase"] = relationship("CollectionCase", back_populates="verifications")


class Decision(Base):
    __tablename__ = "decisions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=generate_uuid)
    case_id: Mapped[str] = mapped_column(String(64), ForeignKey("collection_cases.id"), nullable=False)
    conversation_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("conversations.id"), nullable=True)
    model_provider: Mapped[str] = mapped_column(String(64), default="GEMINI")
    model_name: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    model_version: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    proposed_action: Mapped[str] = mapped_column(String(64), nullable=False)
    customer_intent: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    confidence: Mapped[Optional[float]] = mapped_column(Numeric(4, 3), nullable=True)
    reason: Mapped[str] = mapped_column(Text, nullable=False)
    policy_status: Mapped[str] = mapped_column(String(32), default="PENDING")
    approval_status: Mapped[str] = mapped_column(String(32), default="NOT_REQUIRED")
    execution_status: Mapped[str] = mapped_column(String(32), default="NOT_EXECUTED")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)

    case: Mapped["CollectionCase"] = relationship("CollectionCase", back_populates="decisions")


class Action(Base):
    __tablename__ = "actions"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=generate_uuid)
    case_id: Mapped[str] = mapped_column(String(64), ForeignKey("collection_cases.id"), nullable=False)
    decision_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("decisions.id"), nullable=True)
    action_type: Mapped[str] = mapped_column(String(64), nullable=False)
    channel: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    status: Mapped[str] = mapped_column(String(32), default="CREATED")
    idempotency_key: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    provider: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    provider_reference: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    requested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    executed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    error_code: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    error_message_safe: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    case: Mapped["CollectionCase"] = relationship("CollectionCase", back_populates="actions")


class FollowUp(Base):
    __tablename__ = "follow_ups"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=generate_uuid)
    case_id: Mapped[str] = mapped_column(String(64), ForeignKey("collection_cases.id"), nullable=False)
    action_type: Mapped[str] = mapped_column(String(64), nullable=False)
    scheduled_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    timezone: Mapped[str] = mapped_column(String(64), default="Asia/Kolkata")
    status: Mapped[str] = mapped_column(String(32), default="SCHEDULED")
    source_action_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("actions.id"), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    case: Mapped["CollectionCase"] = relationship("CollectionCase", back_populates="follow_ups")


class Escalation(Base):
    __tablename__ = "escalations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=generate_uuid)
    case_id: Mapped[str] = mapped_column(String(64), ForeignKey("collection_cases.id"), nullable=False)
    reason: Mapped[str] = mapped_column(String(64), nullable=False)
    priority: Mapped[str] = mapped_column(String(32), default="HIGH")
    status: Mapped[str] = mapped_column(String(32), default="OPEN")
    assigned_user_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("users.id"), nullable=True)
    resolution: Mapped[Optional[str]] = mapped_column(Text, nullable=True)
    resolved_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    case: Mapped["CollectionCase"] = relationship("CollectionCase", back_populates="escalations")


class WorkflowEvent(Base):
    __tablename__ = "workflow_events"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=generate_uuid)
    case_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("collection_cases.id"), nullable=True)
    action_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("actions.id"), nullable=True)
    workflow_name: Mapped[str] = mapped_column(String(128), nullable=False)
    n8n_execution_id: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    event_type: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(32), nullable=False)
    provider: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    provider_reference: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    payload_reference: Mapped[Optional[str]] = mapped_column(String(128), nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    completed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)


class WebhookEvent(Base):
    __tablename__ = "webhook_events"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=generate_uuid)
    provider: Mapped[str] = mapped_column(String(64), nullable=False)
    event_type: Mapped[str] = mapped_column(String(64), nullable=False)
    provider_event_id: Mapped[str] = mapped_column(String(128), unique=True, nullable=False)
    case_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("collection_cases.id"), nullable=True)
    conversation_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("conversations.id"), nullable=True)
    payload_hash: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    processing_status: Mapped[str] = mapped_column(String(32), default="RECEIVED")
    received_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    processed_at: Mapped[Optional[datetime]] = mapped_column(DateTime(timezone=True), nullable=True)
    error_code: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)


class MemoryReference(Base):
    __tablename__ = "memory_references"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=generate_uuid)
    merchant_id: Mapped[str] = mapped_column(String(64), ForeignKey("merchants.id"), nullable=False)
    customer_id: Mapped[str] = mapped_column(String(64), ForeignKey("customers.id"), nullable=False)
    case_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("collection_cases.id"), nullable=True)
    memory_id: Mapped[str] = mapped_column(String(128), nullable=False)
    source_type: Mapped[str] = mapped_column(String(64), nullable=False)
    source_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    memory_type: Mapped[str] = mapped_column(String(64), nullable=False)
    status: Mapped[str] = mapped_column(String(32), default="SYNCED")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)


class AuditEvent(Base):
    __tablename__ = "audit_events"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, default=generate_uuid)
    merchant_id: Mapped[str] = mapped_column(String(64), ForeignKey("merchants.id"), nullable=False)
    case_id: Mapped[Optional[str]] = mapped_column(String(64), ForeignKey("collection_cases.id"), nullable=True)
    actor_type: Mapped[str] = mapped_column(String(32), nullable=False)  # AGENT | USER | SYSTEM
    actor_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    event_type: Mapped[str] = mapped_column(String(64), nullable=False)
    entity_type: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    entity_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    correlation_id: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    metadata_safe: Mapped[Optional[str]] = mapped_column(Text, default="{}")
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now)


class AgentSetting(Base):
    __tablename__ = "agent_settings"

    merchant_id: Mapped[str] = mapped_column(String(64), ForeignKey("merchants.id"), primary_key=True)
    agent_status: Mapped[str] = mapped_column(String(32), default="ACTIVE")  # ACTIVE | PAUSED | THROTTLED
    contact_start_hour: Mapped[int] = mapped_column(Integer, default=9)
    contact_end_hour: Mapped[int] = mapped_column(Integer, default=19)
    max_contact_attempts: Mapped[int] = mapped_column(Integer, default=2)
    min_hours_between_contacts: Mapped[int] = mapped_column(Integer, default=4)
    auto_voice_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    auto_whatsapp_enabled: Mapped[bool] = mapped_column(Boolean, default=True)
    updated_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=utc_now, onupdate=utc_now)

    merchant: Mapped["Merchant"] = relationship("Merchant", back_populates="settings")
