# Data Model Specification

## Paytm AI Workforce — Autonomous AI Collections Agent

---

# 1. Purpose

This document defines the transactional and operational data model for the Autonomous AI Collections Agent.

The data model must support:

- Merchants.
- Customers.
- Invoices.
- Collection cases.
- Conversations.
- Messages.
- AI decisions.
- Actions.
- Follow-ups.
- Payment verification.
- Escalations.
- Memory references.
- Workflow executions.
- Webhook events.
- Audit events.
- Integration health.

The transactional source of truth for the MVP is intended to be **Supabase PostgreSQL**.

Cognee is the AI-memory layer and must not replace transactional records.

---

# 2. Data Architecture

```text
                     Supabase
              Transactional Source of Truth
                         │
       ┌─────────────────┼─────────────────┐
       ↓                 ↓                 ↓
    Merchant          Customer           Case
       │                 │                 │
       └─────────────────┼─────────────────┘
                         ↓
                      Invoice
                         │
                         ↓
                    Conversation
                         │
                         ↓
                       Message
                         │
                         ↓
                      Decision
                         │
                         ↓
                       Action
                         │
          ┌──────────────┼───────────────┐
          ↓              ↓               ↓
      Follow-up      Escalation      Workflow Event
          │              │               │
          └──────────────┼───────────────┘
                         ↓
                    Audit Events

                         ↕
                      Cognee
                    AI Memory
```

---

# 3. General Data Principles

1. Every important business object has a stable identifier.
2. Records must have timestamps.
3. Tenant/merchant ownership must be explicit.
4. Transactional state must remain authoritative in Supabase.
5. Customer statements must be distinguishable from verified facts.
6. External provider references must be stored separately from internal IDs.
7. Sensitive credentials must never be stored in business tables.
8. Side-effecting operations require idempotency.
9. Deleted/deactivated records must not silently disappear from audit history where audit retention requires preservation.
10. Schema changes must be version-controlled.

---

# 4. Identifier Strategy

Use application-generated stable identifiers.

Recommended format:

```text
MER-xxxx
CUS-xxxx
INV-xxxx
CASE-xxxx
CONV-xxxx
MSG-xxxx
DEC-xxxx
ACT-xxxx
FUP-xxxx
ESC-xxxx
MEM-xxxx
EVT-xxxx
AUD-xxxx
```

The exact ID generation mechanism is TBD.

UUIDs may be used internally if preferred.

The human-readable prefixes are a recommendation for the application/UI.

---

# 5. `merchants`

Represents a business using the AI Workforce platform.

Suggested fields:

```text
id
name
status
timezone
created_at
updated_at
```

Possible statuses:

```text
ACTIVE
INACTIVE
SUSPENDED
```

The final authentication/tenant model is defined separately.

---

# 6. `users`

Represents authenticated users belonging to a merchant.

Suggested fields:

```text
id
merchant_id
name
email
role
status
created_at
updated_at
```

Possible roles:

```text
OWNER
ADMIN
OPERATOR
VIEWER
```

The exact permission model is TBD.

---

# 7. `customers`

Represents customers whose collection cases are managed.

Suggested fields:

```text
id
merchant_id
name
phone
email
preferred_language
preferred_channel
contact_status
created_at
updated_at
```

Potential contact states:

```text
CONTACTABLE
RESTRICTED
OPTED_OUT
UNKNOWN
```

The exact contact-policy representation is TBD.

---

# 8. Customer Isolation

Every customer must belong to a merchant.

Conceptually:

```text
merchant_id
      ↓
customer_id
```

A merchant must never be able to access another merchant's customers.

---

# 9. `invoices`

Represents an amount owed by a customer.

Suggested fields:

```text
id
merchant_id
customer_id
invoice_number
amount
currency
issue_date
due_date
status
created_at
updated_at
```

Possible statuses:

```text
OPEN
OVERDUE
PAID
DISPUTED
CANCELLED
UNKNOWN
```

The final status enum is TBD.

---

# 10. Invoice Authority

Invoice information must come from application data.

Gemini must not invent:

- Invoice number.
- Amount.
- Due date.
- Customer association.
- Payment status.

---

# 11. `collection_cases`

Represents the AI employee's work item.

Suggested fields:

```text
id
merchant_id
customer_id
invoice_id
status
priority
outstanding_amount
currency
assigned_mode
opened_at
closed_at
next_action_at
created_at
updated_at
```

---

# 12. Case States

Suggested states:

```text
NEW
OVERDUE
IN_PROGRESS
WAITING_FOR_CUSTOMER
PAYMENT_PENDING
PAYMENT_VERIFICATION
DISPUTED
ESCALATED
HUMAN_REVIEW
PAID
CLOSED
FAILED
CANCELLED
```

The exact state machine must be finalized before implementation.

---

# 13. Case State Rules

The system must define legal transitions.

Example:

```text
NEW
 ↓
OVERDUE
 ↓
IN_PROGRESS
 ↓
WAITING_FOR_CUSTOMER
 ↓
PAYMENT_PENDING
 ↓
PAYMENT_VERIFICATION
 ↓
PAID
 ↓
CLOSED
```

A disputed case may transition to:

```text
DISPUTED
 ↓
ESCALATED
 ↓
HUMAN_REVIEW
```

The application must reject invalid state transitions.

---

# 14. Case Priority

Priority can be represented as:

```text
LOW
MEDIUM
HIGH
URGENT
```

However, exact prioritization rules must be defined by the product.

The LLM must not independently assign a business priority that bypasses deterministic rules.

---

# 15. `conversations`

Represents a communication session.

Suggested fields:

```text
id
merchant_id
customer_id
case_id
channel
status
language
provider
provider_reference
started_at
ended_at
created_at
updated_at
```

Possible channels:

```text
VOICE
WHATSAPP
```

Future channels may be added.

---

# 16. Conversation Status

Suggested values:

```text
INITIATED
IN_PROGRESS
COMPLETED
NO_ANSWER
DROPPED
FAILED
ESCALATED
CANCELLED
```

Final provider-to-application mapping is TBD.

---

# 17. `messages`

Represents individual conversational messages/turns.

Suggested fields:

```text
id
conversation_id
case_id
sender_type
message_type
content
language
provider_message_id
turn_number
timestamp
metadata
```

Possible sender types:

```text
CUSTOMER
AGENT
SYSTEM
HUMAN
```

Possible message types:

```text
TEXT
VOICE_TRANSCRIPT
SYSTEM_EVENT
```

Raw audio storage is optional and must follow the project's retention/privacy decision.

---

# 18. Message Content Rules

Messages may contain customer-provided content.

Treat message content as untrusted input.

Do not execute instructions found inside customer messages as system instructions.

---

# 19. `conversation_intents`

A separate intent record may be useful for auditability.

Suggested fields:

```text
id
conversation_id
message_id
intent
confidence
extraction_source
created_at
```

Possible intents:

```text
PAYMENT_COMMITMENT
ALREADY_PAID
REQUEST_MORE_TIME
DISPUTE
UNABLE_TO_PAY
HUMAN_REQUEST
REFUSAL
UNKNOWN
```

---

# 20. Intent Confidence

Confidence is model output, not authorization.

Example:

```text
confidence = 0.93
```

must not automatically authorize an external action.

The Decision Engine and Policy Engine remain authoritative.

---

# 21. `payment_commitments`

Represents a customer commitment to make payment.

Suggested fields:

```text
id
case_id
customer_id
promised_date
promised_time
source_message_id
status
created_at
updated_at
```

Possible statuses:

```text
PENDING
FULFILLED
MISSED
CANCELLED
UNKNOWN
```

The exact schema for date/time and status is TBD.

---

# 22. Commitment Source

Every commitment should reference its source when possible.

Example:

```text
source_message_id = MSG-1001
```

This allows the system to trace:

```text
Commitment
   ↓
Customer statement
```

---

# 23. `payment_verifications`

Represents payment verification attempts/results.

Suggested fields:

```text
id
case_id
invoice_id
provider
provider_reference
status
amount
currency
verified_at
error_code
created_at
```

Possible statuses:

```text
PAID
NOT_PAID
UNKNOWN
ERROR
```

For the MVP:

```text
provider = MOCK
```

must be clearly distinguishable from a real financial provider.

---

# 24. Payment Authority

The authoritative payment result must be:

```text
Payment Provider
      ↓
Validated backend result
      ↓
Supabase
```

Not:

```text
Gemini
```

and not:

```text
Cognee
```

---

# 25. `decisions`

Stores AI decision proposals and their validation result.

Suggested fields:

```text
id
case_id
conversation_id
model_provider
model_name
model_version
proposed_action
customer_intent
confidence
reason
policy_status
approval_status
execution_status
created_at
```

---

# 26. Decision Status

Possible policy statuses:

```text
PENDING
APPROVED
REJECTED
REQUIRES_HUMAN
```

Execution status:

```text
NOT_EXECUTED
QUEUED
EXECUTING
SUCCESS
FAILED
CANCELLED
STALE
```

---

# 27. `actions`

Represents an actual requested/executed operation.

Suggested fields:

```text
id
case_id
decision_id
action_type
channel
status
idempotency_key
provider
provider_reference
requested_at
executed_at
completed_at
error_code
error_message_safe
created_at
updated_at
```

---

# 28. Action Types

Minimum:

```text
WAIT
TEXT
CALL
ESCALATE
VERIFY_PAYMENT
```

Additional types may be added when required.

---

# 29. Action Lifecycle

```text
CREATED
   ↓
VALIDATING
   ↓
APPROVED
   ↓
QUEUED
   ↓
EXECUTING
   ↓
SUCCESS
```

Failure:

```text
EXECUTING
   ↓
FAILED
   ↓
RETRY / ESCALATE
```

Cancellation:

```text
QUEUED
   ↓
CANCELLED
```

---

# 30. Idempotency

Every side-effecting action should have an idempotency key.

Example:

```text
CASE-001:CALL:001
```

The exact generation mechanism is TBD.

Database constraints should prevent duplicate execution where practical.

---

# 31. `follow_ups`

Represents future work.

Suggested fields:

```text
id
case_id
action_type
scheduled_at
timezone
status
source_action_id
created_at
updated_at
```

Possible statuses:

```text
SCHEDULED
DUE
EXECUTING
COMPLETED
CANCELLED
SKIPPED
FAILED
```

---

# 32. Follow-Up Rule

When a follow-up becomes due:

```text
Load current case
      ↓
Verify current payment state
      ↓
Check policy
      ↓
Re-evaluate
      ↓
Execute only if still valid
```

A follow-up must not blindly execute an old decision.

---

# 33. `escalations`

Represents a human-review request.

Suggested fields:

```text
id
case_id
reason
priority
status
assigned_user_id
created_at
updated_at
resolved_at
resolution
```

Possible reasons:

```text
CUSTOMER_REQUEST
DISPUTE
LOW_CONFIDENCE
POLICY_RESTRICTION
PAYMENT_UNCERTAIN
TECHNICAL_FAILURE
HUMAN_APPROVAL
OTHER
```

---

# 34. Escalation Status

Suggested:

```text
OPEN
ASSIGNED
IN_REVIEW
RESOLVED
CANCELLED
```

Final values are TBD.

---

# 35. `workflow_events`

Represents n8n/provider workflow events.

Suggested fields:

```text
id
case_id
action_id
workflow_name
n8n_execution_id
event_type
status
provider
provider_reference
payload_reference
created_at
completed_at
```

Do not store sensitive raw payloads unnecessarily.

---

# 36. `webhook_events`

Represents inbound provider callbacks.

Suggested fields:

```text
id
provider
event_type
provider_event_id
case_id
conversation_id
payload_hash
processing_status
received_at
processed_at
error_code
```

---

# 37. Webhook Idempotency

`provider_event_id` or an equivalent unique identifier should be used to prevent duplicate processing.

Conceptually:

```text
Webhook
   ↓
Check provider_event_id
   ↓
Already processed?
   ├── YES → Ignore safely
   └── NO  → Process
```

---

# 38. `memory_references`

Represents the relationship between application records and Cognee memory.

Suggested fields:

```text
id
merchant_id
customer_id
case_id
memory_id
source_type
source_id
memory_type
status
created_at
updated_at
```

This is a reference/index, not the full AI-memory store.

---

# 39. Memory Types

Suggested:

```text
CASE
CONVERSATION
CUSTOMER_CONTEXT
COMMITMENT
DISPUTE
ESCALATION
OUTCOME
```

The final taxonomy is defined in `08-memory-spec.md`.

---

# 40. Memory Sync Status

Suggested:

```text
PENDING
SYNCED
FAILED
DELETED
```

This allows Supabase to track whether the corresponding memory operation succeeded.

---

# 41. `audit_events`

Represents security and operational audit events.

Suggested fields:

```text
id
merchant_id
case_id
actor_type
actor_id
event_type
entity_type
entity_id
correlation_id
metadata_safe
created_at
```

Possible actor types:

```text
SYSTEM
AI
HUMAN
CUSTOMER
PROVIDER
```

---

# 42. Audit Event Examples

```text
CASE_CREATED
AI_DECISION_CREATED
POLICY_APPROVED
POLICY_REJECTED
ACTION_EXECUTED
ACTION_FAILED
CUSTOMER_MESSAGE_RECEIVED
PAYMENT_VERIFIED
ESCALATION_CREATED
HUMAN_APPROVAL
HUMAN_REJECTION
MEMORY_SYNC_FAILED
WEBHOOK_RECEIVED
```

---

# 43. Audit Rules

Audit records should answer:

```text
What happened?
When?
For which case?
Who/what initiated it?
What decision led to it?
What provider was involved?
What was the result?
```

Audit logs must not contain secrets.

---

# 44. `integration_status`

Optional operational table for configured providers.

Suggested fields:

```text
id
merchant_id
provider
status
last_checked_at
last_success_at
last_error_code
created_at
updated_at
```

Possible providers:

```text
GEMINI
SARVAM
TWILIO
COGNEE
N8N
SUPABASE
PAYMENT_MOCK
```

---

# 45. Relationships

Primary relationships:

```text
Merchant
 ├── Users
 ├── Customers
 │    └── Invoices
 │         └── Collection Cases
 │              ├── Conversations
 │              │    └── Messages
 │              ├── Decisions
 │              │    └── Actions
 │              ├── Follow-Ups
 │              ├── Payment Verifications
 │              ├── Escalations
 │              └── Memory References
 │
 └── Audit Events
```

---

# 46. Foreign-Key Expectations

Important relationships should use foreign keys.

Examples:

```text
customers.merchant_id
invoices.customer_id
invoices.merchant_id
collection_cases.customer_id
collection_cases.invoice_id
collection_cases.merchant_id
conversations.case_id
messages.conversation_id
decisions.case_id
actions.decision_id
follow_ups.case_id
escalations.case_id
```

Exact database constraints must be implemented and tested.

---

# 47. Cascading Deletes

Do not automatically cascade-delete important financial/audit history without an explicit data-retention decision.

Deletion behavior must be defined for:

- Customer.
- Invoice.
- Case.
- Conversation.
- Memory.
- Audit data.

The final retention/deletion policy is TBD.

---

# 48. Timestamps

Use a consistent timezone strategy.

Recommended database practice:

```text
Store timestamps in UTC.
```

Display times in the appropriate configured timezone.

The final implementation should verify the Supabase/PostgreSQL timezone configuration.

---

# 49. Money Representation

Do not use floating-point numbers for financial amounts.

Use a suitable exact numeric/decimal representation.

Conceptual:

```text
amount = DECIMAL
currency = "INR"
```

The exact PostgreSQL type and precision are TBD.

---

# 50. Currency

The MVP is expected to demonstrate Indian payment scenarios.

The exact supported currency set is:

**TBD**

The system must not silently convert currencies.

---

# 51. JSON Metadata

Some records may require flexible metadata.

Examples:

```text
provider_metadata
workflow_metadata
safe_audit_metadata
```

Use JSON/JSONB only where flexible structure is genuinely needed.

Core transactional fields should remain typed columns.

---

# 52. Tenant Isolation

Every merchant-scoped table should have a merchant relationship.

At minimum:

```text
merchant_id
```

should be available directly or derivable through a secure relationship.

The backend must enforce tenant authorization.

---

# 53. Row Level Security

If Supabase client access is exposed to the frontend, Row Level Security must be enabled and tested for merchant isolation.

If all database access occurs through FastAPI using a server-side credential:

```text
Frontend
  ↓
FastAPI
  ↓
Supabase
```

then backend authorization remains mandatory.

The final architecture is TBD.

---

# 54. API vs Database State

API responses should expose application-safe representations.

Do not return:

- API keys.
- Internal provider credentials.
- Unnecessary internal metadata.
- Raw authentication tokens.
- Private infrastructure details.

---

# 55. Case Snapshot

For efficient AI reasoning, the backend may construct a read-only case snapshot.

Conceptual:

```json
{
  "case_id": "CASE-001",
  "customer": {},
  "invoice": {},
  "payment_status": "NOT_PAID",
  "case_status": "OVERDUE",
  "recent_conversation": [],
  "relevant_memory": [],
  "available_actions": [
    "WAIT",
    "TEXT",
    "CALL",
    "ESCALATE"
  ]
}
```

This is a runtime representation, not necessarily a database table.

---

# 56. Optimistic Concurrency

To prevent stale decisions, the case may use:

```text
version
updated_at
```

or an equivalent concurrency mechanism.

Example:

```text
Decision based on version 12.

Current case version = 13.

Result:
Decision is stale.
```

The final implementation is TBD.

---

# 57. State Transition Audit

Important state transitions should create audit events.

Example:

```text
OVERDUE
  ↓
IN_PROGRESS
```

Audit:

```text
CASE_STATUS_CHANGED
```

This helps reconstruct autonomous behavior.

---

# 58. Data Integrity Constraints

The database should enforce, where practical:

- Required fields.
- Foreign keys.
- Unique identifiers.
- Valid status values.
- Positive financial amounts where appropriate.
- Unique idempotency keys.
- Unique provider event IDs.
- Tenant ownership consistency.

---

# 59. Example Synthetic Data

The prototype may include synthetic records such as:

```text
Merchant:
Raj Electronics

Customer:
Rahul Sharma

Invoice:
INV-1001

Amount:
₹12,500

Status:
OVERDUE
```

These are demonstration data only.

They must not be represented as real Paytm customer/payment data.

---

# 60. Example Full Record Chain

```text
MER-001
  ↓
CUS-001
  ↓
INV-001
  ↓
CASE-001
  ↓
CONV-001
  ↓
MSG-001
  ↓
DEC-001
  ↓
ACT-001
  ↓
EVT-001
```

A later customer response may create:

```text
MSG-002
  ↓
INTENT-002
  ↓
DEC-002
  ↓
ACT-002
```

---

# 61. Example Payment Verification Chain

```text
Customer:
"I already paid."

        ↓

MSG-010

        ↓

Intent:
ALREADY_PAID

        ↓

DEC-010

        ↓

VERIFY_PAYMENT

        ↓

ACT-010

        ↓

Payment Verification:
PAY-010

        ↓

MOCK PAYMENT API

        ↓

PAID

        ↓

CASE → PAID
```

---

# 62. Example Human Escalation Chain

```text
Customer:
"I want to speak to someone."

        ↓

MSG-020

        ↓

Intent:
HUMAN_REQUEST

        ↓

DEC-020

        ↓

ESCALATE

        ↓

ACT-020

        ↓

ESC-020

        ↓

Human Review
```

---

# 63. Data Access Boundaries

### Frontend

Can access:

- Dashboard data.
- Case summaries.
- Customer-safe information.
- Conversation history allowed by permissions.
- Action status.
- Escalation status.

### Backend

Can access:

- Full application data according to authorization.
- Provider integrations.
- AI services.
- Memory.

### n8n

Should receive:

- Only the workflow payload required for execution.

### Gemini

Should receive:

- Controlled context only.

### Cognee

Should receive:

- Relevant memory data only.

### Twilio

Should receive:

- Communication data required to execute the approved action.

---

# 64. Sensitive Data Handling

The final schema must identify fields that require additional protection.

Potential examples:

```text
phone
email
customer identifiers
payment references
conversation content
```

Exact classification and encryption requirements are TBD.

---

# 65. Backup and Recovery

The production data architecture should define:

- Database backups.
- Recovery objectives.
- Restore procedure.
- Provider-event replay strategy.

The hackathon MVP may rely on managed Supabase capabilities, but the exact backup guarantees must not be assumed without verification.

---

# 66. Schema Migration

Database schema changes must be version-controlled.

Recommended approach:

```text
database/migrations/
```

Each migration should be:

- Ordered.
- Reproducible.
- Reviewable.
- Tested.

Do not manually change the production/demo schema without recording the migration.

---

# 67. Seed Data

The repository should include deterministic synthetic seed data.

Example:

```text
database/
├── migrations/
└── seed/
```

Seed data should support the demo scenarios:

- New overdue case.
- Payment commitment.
- Already-paid claim.
- Dispute.
- Human request.
- No-answer case.
- Payment verification.

---

# 68. Test Data Isolation

Test data must be distinguishable from real data.

Recommended:

```text
environment = DEMO
```

or equivalent tenant/environment separation.

Do not mix test and production customer records.

---

# 69. Data Model Acceptance Criteria

The data model is complete when:

1. Merchant isolation is enforceable.
2. Customer and invoice relationships work.
3. Collection cases have explicit states.
4. Conversations and messages are persisted.
5. AI decisions are auditable.
6. Actions have idempotency keys.
7. Follow-ups can be scheduled.
8. Payment verification is recorded.
9. Escalations are persisted.
10. Workflow/webhook events are traceable.
11. Cognee memory references are trackable.
12. Audit events can reconstruct important actions.
13. Financial amounts use exact numeric representation.
14. Invalid state transitions are prevented.
15. Duplicate provider events are safely handled.

---

# 70. Open Questions

Before final implementation, determine:

- Exact PostgreSQL schema/types.
- UUID vs readable IDs.
- Authentication tables/ownership model.
- Supabase Auth vs backend authentication.
- RLS strategy.
- Case state enum.
- Action enum.
- Conversation status enum.
- Exact payment mock schema.
- Currency precision.
- Retention policy.
- Deletion behavior.
- Sensitive-field classification.
- Concurrency strategy.
- Provider event schema.
- Memory-reference schema.
- Audit metadata limits.
- Backup/recovery expectations.

No unresolved item should be silently assumed.

---

# 71. Final Data Principle

The database must make the AI employee's work reconstructable.

At any point, the system should be able to answer:

```text
Who was the customer?
What was owed?
What was the current case state?
What did the customer say?
What did the AI understand?
What did the AI propose?
Was it allowed?
What action was executed?
Did the provider succeed?
What happened afterward?
What does the system currently believe?
Why was the case closed or escalated?
```

The data model exists to make the autonomous employee **traceable, consistent, recoverable, and safe**.
