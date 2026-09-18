-- =============================================================================
-- Migration 001: Initial Schema for Paytm AI Workforce
-- Target: Supabase / PostgreSQL (ANSI SQL compatible with SQLite test runner)
-- =============================================================================

CREATE TABLE IF NOT EXISTS merchants (
    id VARCHAR(64) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    timezone VARCHAR(64) NOT NULL DEFAULT 'Asia/Kolkata',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(64) PRIMARY KEY,
    merchant_id VARCHAR(64) NOT NULL REFERENCES merchants(id),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(32) NOT NULL DEFAULT 'OPERATOR',
    status VARCHAR(32) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS customers (
    id VARCHAR(64) PRIMARY KEY,
    merchant_id VARCHAR(64) NOT NULL REFERENCES merchants(id),
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(32) NOT NULL,
    email VARCHAR(255),
    preferred_language VARCHAR(32) DEFAULT 'Hindi',
    preferred_channel VARCHAR(32) DEFAULT 'WHATSAPP',
    contact_status VARCHAR(32) DEFAULT 'CONTACTABLE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoices (
    id VARCHAR(64) PRIMARY KEY,
    merchant_id VARCHAR(64) NOT NULL REFERENCES merchants(id),
    customer_id VARCHAR(64) NOT NULL REFERENCES customers(id),
    invoice_number VARCHAR(64) NOT NULL,
    amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(8) DEFAULT 'INR',
    issue_date TIMESTAMP WITH TIME ZONE NOT NULL,
    due_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'OVERDUE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS collection_cases (
    id VARCHAR(64) PRIMARY KEY,
    merchant_id VARCHAR(64) NOT NULL REFERENCES merchants(id),
    customer_id VARCHAR(64) NOT NULL REFERENCES customers(id),
    invoice_id VARCHAR(64) NOT NULL REFERENCES invoices(id),
    status VARCHAR(32) NOT NULL DEFAULT 'NEW',
    priority VARCHAR(32) DEFAULT 'MEDIUM',
    outstanding_amount NUMERIC(12, 2) NOT NULL,
    currency VARCHAR(8) DEFAULT 'INR',
    assigned_mode VARCHAR(32) DEFAULT 'AUTONOMOUS',
    opened_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITH TIME ZONE,
    next_action_at TIMESTAMP WITH TIME ZONE,
    version INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS conversations (
    id VARCHAR(64) PRIMARY KEY,
    merchant_id VARCHAR(64) NOT NULL REFERENCES merchants(id),
    customer_id VARCHAR(64) NOT NULL REFERENCES customers(id),
    case_id VARCHAR(64) NOT NULL REFERENCES collection_cases(id),
    channel VARCHAR(32) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'INITIATED',
    language VARCHAR(32) DEFAULT 'Hindi',
    provider VARCHAR(32),
    provider_reference VARCHAR(128),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
    id VARCHAR(64) PRIMARY KEY,
    conversation_id VARCHAR(64) NOT NULL REFERENCES conversations(id),
    case_id VARCHAR(64) NOT NULL REFERENCES collection_cases(id),
    sender_type VARCHAR(32) NOT NULL,
    message_type VARCHAR(32) NOT NULL DEFAULT 'TEXT',
    content TEXT NOT NULL,
    language VARCHAR(32) DEFAULT 'Hindi',
    provider_message_id VARCHAR(128),
    turn_number INTEGER NOT NULL DEFAULT 1,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    metadata TEXT DEFAULT '{}'
);

CREATE TABLE IF NOT EXISTS conversation_intents (
    id VARCHAR(64) PRIMARY KEY,
    conversation_id VARCHAR(64) NOT NULL REFERENCES conversations(id),
    message_id VARCHAR(64) REFERENCES messages(id),
    intent VARCHAR(64) NOT NULL,
    confidence NUMERIC(4, 3),
    extraction_source VARCHAR(64) DEFAULT 'GEMINI',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_commitments (
    id VARCHAR(64) PRIMARY KEY,
    case_id VARCHAR(64) NOT NULL REFERENCES collection_cases(id),
    customer_id VARCHAR(64) NOT NULL REFERENCES customers(id),
    promised_date DATE NOT NULL,
    promised_time VARCHAR(32),
    source_message_id VARCHAR(64) REFERENCES messages(id),
    status VARCHAR(32) DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_verifications (
    id VARCHAR(64) PRIMARY KEY,
    case_id VARCHAR(64) NOT NULL REFERENCES collection_cases(id),
    invoice_id VARCHAR(64) NOT NULL REFERENCES invoices(id),
    provider VARCHAR(32) NOT NULL DEFAULT 'MOCK',
    provider_reference VARCHAR(128),
    status VARCHAR(32) NOT NULL,
    amount NUMERIC(12, 2),
    currency VARCHAR(8) DEFAULT 'INR',
    verified_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    error_code VARCHAR(64),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS decisions (
    id VARCHAR(64) PRIMARY KEY,
    case_id VARCHAR(64) NOT NULL REFERENCES collection_cases(id),
    conversation_id VARCHAR(64) REFERENCES conversations(id),
    model_provider VARCHAR(64) DEFAULT 'GEMINI',
    model_name VARCHAR(64),
    model_version VARCHAR(64),
    proposed_action VARCHAR(64) NOT NULL,
    customer_intent VARCHAR(64),
    confidence NUMERIC(4, 3),
    reason TEXT NOT NULL,
    policy_status VARCHAR(32) NOT NULL DEFAULT 'PENDING',
    approval_status VARCHAR(32) DEFAULT 'NOT_REQUIRED',
    execution_status VARCHAR(32) DEFAULT 'NOT_EXECUTED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS actions (
    id VARCHAR(64) PRIMARY KEY,
    case_id VARCHAR(64) NOT NULL REFERENCES collection_cases(id),
    decision_id VARCHAR(64) REFERENCES decisions(id),
    action_type VARCHAR(64) NOT NULL,
    channel VARCHAR(32),
    status VARCHAR(32) NOT NULL DEFAULT 'CREATED',
    idempotency_key VARCHAR(128) NOT NULL UNIQUE,
    provider VARCHAR(64),
    provider_reference VARCHAR(128),
    requested_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    executed_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    error_code VARCHAR(64),
    error_message_safe TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS follow_ups (
    id VARCHAR(64) PRIMARY KEY,
    case_id VARCHAR(64) NOT NULL REFERENCES collection_cases(id),
    action_type VARCHAR(64) NOT NULL,
    scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
    timezone VARCHAR(64) DEFAULT 'Asia/Kolkata',
    status VARCHAR(32) DEFAULT 'SCHEDULED',
    source_action_id VARCHAR(64) REFERENCES actions(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS escalations (
    id VARCHAR(64) PRIMARY KEY,
    case_id VARCHAR(64) NOT NULL REFERENCES collection_cases(id),
    reason VARCHAR(64) NOT NULL,
    priority VARCHAR(32) DEFAULT 'HIGH',
    status VARCHAR(32) DEFAULT 'OPEN',
    assigned_user_id VARCHAR(64) REFERENCES users(id),
    resolution TEXT,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS workflow_events (
    id VARCHAR(64) PRIMARY KEY,
    case_id VARCHAR(64) REFERENCES collection_cases(id),
    action_id VARCHAR(64) REFERENCES actions(id),
    workflow_name VARCHAR(128) NOT NULL,
    n8n_execution_id VARCHAR(128),
    event_type VARCHAR(64) NOT NULL,
    status VARCHAR(32) NOT NULL,
    provider VARCHAR(64),
    provider_reference VARCHAR(128),
    payload_reference VARCHAR(128),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE
);

CREATE TABLE IF NOT EXISTS webhook_events (
    id VARCHAR(64) PRIMARY KEY,
    provider VARCHAR(64) NOT NULL,
    event_type VARCHAR(64) NOT NULL,
    provider_event_id VARCHAR(128) NOT NULL UNIQUE,
    case_id VARCHAR(64) REFERENCES collection_cases(id),
    conversation_id VARCHAR(64) REFERENCES conversations(id),
    payload_hash VARCHAR(64),
    processing_status VARCHAR(32) DEFAULT 'RECEIVED',
    received_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP WITH TIME ZONE,
    error_code VARCHAR(64)
);

CREATE TABLE IF NOT EXISTS memory_references (
    id VARCHAR(64) PRIMARY KEY,
    merchant_id VARCHAR(64) NOT NULL REFERENCES merchants(id),
    customer_id VARCHAR(64) NOT NULL REFERENCES customers(id),
    case_id VARCHAR(64) REFERENCES collection_cases(id),
    memory_id VARCHAR(128) NOT NULL,
    source_type VARCHAR(64) NOT NULL,
    source_id VARCHAR(64),
    memory_type VARCHAR(64) NOT NULL,
    status VARCHAR(32) DEFAULT 'SYNCED',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS audit_events (
    id VARCHAR(64) PRIMARY KEY,
    merchant_id VARCHAR(64) NOT NULL REFERENCES merchants(id),
    case_id VARCHAR(64) REFERENCES collection_cases(id),
    actor_type VARCHAR(32) NOT NULL,
    actor_id VARCHAR(64),
    event_type VARCHAR(64) NOT NULL,
    entity_type VARCHAR(64),
    entity_id VARCHAR(64),
    correlation_id VARCHAR(64),
    metadata_safe TEXT DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS agent_settings (
    merchant_id VARCHAR(64) PRIMARY KEY REFERENCES merchants(id),
    agent_status VARCHAR(32) DEFAULT 'ACTIVE',
    contact_start_hour INTEGER DEFAULT 9,
    contact_end_hour INTEGER DEFAULT 19,
    max_contact_attempts INTEGER DEFAULT 2,
    min_hours_between_contacts INTEGER DEFAULT 4,
    auto_voice_enabled BOOLEAN DEFAULT TRUE,
    auto_whatsapp_enabled BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Indices for performance & tenant filtering
CREATE INDEX IF NOT EXISTS idx_customers_merchant ON customers(merchant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_merchant ON invoices(merchant_id);
CREATE INDEX IF NOT EXISTS idx_cases_merchant ON collection_cases(merchant_id);
CREATE INDEX IF NOT EXISTS idx_cases_status ON collection_cases(status);
CREATE INDEX IF NOT EXISTS idx_conversations_case ON conversations(case_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_actions_case ON actions(case_id);
CREATE INDEX IF NOT EXISTS idx_actions_idempotency ON actions(idempotency_key);
CREATE INDEX IF NOT EXISTS idx_audit_events_merchant ON audit_events(merchant_id);
CREATE INDEX IF NOT EXISTS idx_audit_events_case ON audit_events(case_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_provider_id ON webhook_events(provider_event_id);
