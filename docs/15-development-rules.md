# Development Rules

## Paytm AI Workforce — Autonomous AI Collections Agent

---

# 1. Purpose

This document defines the engineering rules that Antigravity must follow while implementing the Autonomous AI Collections Agent.

These rules are intended to prevent:

- Unapproved assumptions.
- Hallucinated integrations.
- Unsafe autonomous actions.
- Hard-coded provider behavior.
- Secret exposure.
- Unnecessary complexity.
- Unmaintainable code.
- Fake/demo functionality presented as real functionality.

---

# 2. Primary Development Principle

Build exactly what is specified.

Do not silently invent missing requirements.

When a requirement is unclear:

```text
Identify ambiguity
      ↓
Ask a question
      ↓
Wait for clarification
```

If implementation can safely proceed without the missing decision:

```text
Mark as TBD
      ↓
Isolate the decision
      ↓
Continue only with the unaffected work
```

---

# 3. No-Assumption Rule

Antigravity must not assume:

- An API exists.
- An API is free.
- A provider supports a feature.
- A provider supports real-time streaming.
- A provider supports a specific language.
- A provider supports a specific webhook.
- A provider supports a specific authentication method.
- A provider supports unlimited usage.
- A provider has a particular rate limit.
- A Paytm private API is available.
- A hackathon sponsor provides unrestricted production access.

All provider capabilities must be verified before implementation.

---

# 4. Source of Truth Hierarchy

When deciding how the system should behave:

```text
1. Current explicit user requirements
2. Approved project specification
3. Official provider documentation
4. Existing implementation contracts
5. Explicitly approved engineering decisions
6. General engineering assumptions
```

If two requirements conflict:

```text
Do not silently choose one.
Flag the conflict.
```

---

# 5. Requirement Status Vocabulary

Use these labels consistently:

```text
REQUIRED
OPTIONAL
TBD
OPEN QUESTION
BLOCKED
VERIFIED
MOCKED
NOT IMPLEMENTED
DEPRECATED
```

Never label something `VERIFIED` unless it has actually been tested or confirmed from an authoritative source.

---

# 6. Real vs Mocked

Every external capability must be classified.

Example:

```text
Gemini API          → REAL
Twilio Voice        → REAL TEST
Twilio WhatsApp     → REAL TEST
Sarvam              → REAL if configured and verified
Cognee              → REAL if configured and verified
n8n                 → REAL
Supabase            → REAL
Payment verification→ MOCKED
```

The exact status must reflect the actual environment.

Never represent mocked behavior as production functionality.

---

# 7. No Fake Integrations

Do not create code that merely looks integrated.

Bad:

```text
sendWhatsApp()
```

that only logs:

```text
"WhatsApp sent"
```

while no provider call occurred.

If a feature is mocked:

```text
MOCKED
```

must be explicit in code, documentation, logs, and UI where relevant.

---

# 8. Provider Abstraction

External providers must be accessed through adapters/interfaces where practical.

Example:

```text
LLMProvider
 └── GeminiProvider

SpeechProvider
 └── SarvamProvider

VoiceProvider
 └── TwilioVoiceProvider

MessagingProvider
 └── TwilioWhatsAppProvider

MemoryProvider
 └── CogneeProvider
```

This prevents the entire application from depending directly on one provider's implementation details.

---

# 9. Backend as Trust Boundary

FastAPI is the main trusted backend boundary.

The frontend must not directly perform privileged provider operations.

Preferred:

```text
React
 ↓
FastAPI
 ↓
Provider
```

Not:

```text
React
 ↓
Gemini/Twilio/Cognee directly
```

unless a provider capability explicitly requires a safe browser-side operation and the security model has been reviewed.

---

# 10. Frontend Rules

The frontend should contain:

- UI.
- User interactions.
- Display logic.
- Local non-sensitive state.
- API client logic.

It should not contain:

- Provider secrets.
- Business authorization logic.
- Payment verification truth.
- Autonomous-action authorization.
- Private API credentials.

---

# 11. Backend Rules

The backend should contain:

- Authentication.
- Authorization.
- Business logic.
- Case state management.
- Policy enforcement.
- AI orchestration.
- Provider adapters.
- Validation.
- Audit creation.
- Idempotency.
- Transactional operations.

---

# 12. AI Boundary

Gemini is responsible for reasoning within the allowed context.

Gemini must not be treated as:

```text
Database
Payment authority
Authorization system
Policy engine
Workflow engine
Secret manager
```

---

# 13. Deterministic Policy Boundary

The architecture must retain a deterministic policy layer.

```text
Gemini
 ↓
Structured Decision
 ↓
Schema Validation
 ↓
Policy Engine
 ↓
Permission Check
 ↓
External Action
```

Do not allow the model to bypass this boundary.

---

# 14. No Business Logic Hidden in Prompts

Critical rules must not exist only inside a system prompt.

For example:

```text
Customer has already paid
```

must be enforced through application logic.

Not merely:

```text
Prompt:
"Do not contact paid customers."
```

The backend/policy layer must enforce it.

---

# 15. Structured AI Output

Prefer structured output over free-form parsing.

Example conceptual schema:

```json
{
  "case_id": "CASE-001",
  "action": "CALL",
  "reason_code": "NO_RESPONSE",
  "confidence": 0.87,
  "requires_human": false
}
```

The actual schema is defined by `07-decision-engine.md`.

---

# 16. Validate Before Execution

Never execute raw LLM output.

Required:

```text
LLM
 ↓
Parse
 ↓
Schema validation
 ↓
Business validation
 ↓
Policy
 ↓
Authorization
 ↓
Execute
```

---

# 17. No Chain-of-Thought Storage

Do not store private model chain-of-thought.

Store structured information such as:

```text
Decision
Reason code
Confidence
Evidence references
Policy result
Action
Outcome
```

The system should provide auditability without exposing hidden reasoning.

---

# 18. Explainability

When the UI shows why an action was selected, use concise structured explanations.

Example:

```text
Reason:
Customer has not responded to the previous message.

Decision:
CALL

Policy:
Allowed

Confidence:
0.87
```

Do not expose hidden chain-of-thought.

---

# 19. Data Source Rules

Use the correct source for each type of information.

Example:

```text
Invoice amount
→ Supabase

Payment status
→ Payment verification service

Conversation
→ Conversation store

Relevant memory
→ Cognee

AI inference
→ Gemini
```

Do not let one component impersonate another source of truth.

---

# 20. Payment Rules

Payment state must come from the payment verification layer.

Customer statements are claims.

Example:

```text
Customer:
"I paid."

↓

Payment verification

↓

PAID / NOT_PAID / PENDING / UNKNOWN
```

Never update payment state directly from an LLM response.

---

# 21. Customer Claims

Customer claims must be explicitly represented when relevant.

Examples:

```text
CUSTOMER_CLAIM
ALREADY_PAID_CLAIM
PAYMENT_COMMITMENT
DISPUTE
```

Do not convert a claim into a verified fact automatically.

---

# 22. State Machine Rule

Case state transitions must be deterministic.

Use explicit transition functions.

Avoid scattered code such as:

```text
case.status = ...
```

throughout the application.

Prefer:

```text
transition_case(...)
```

with validation.

---

# 23. Database Rules

Use migrations for schema changes.

Do not manually modify production/demo databases as part of normal development.

Schema changes must be reproducible.

---

# 24. Database Migration Rules

Every migration should:

- Have a unique order.
- Be committed to source control.
- Be deterministic.
- Be reviewed for destructive changes.
- Be compatible with the current application version where practical.

---

# 25. IDs

Use stable unique IDs.

Do not rely on display names as primary identifiers.

Example:

```text
merchant_id
customer_id
invoice_id
case_id
conversation_id
message_id
action_id
event_id
```

---

# 26. Money Handling

Do not use floating-point arithmetic for authoritative money calculations.

Prefer:

```text
integer minor units
```

or:

```text
NUMERIC/DECIMAL
```

with explicit currency.

Example:

```text
₹12,500.00
```

must not be represented by an imprecise binary floating-point calculation for transactional purposes.

---

# 27. Date/Time Rules

Use timezone-aware timestamps.

Do not assume:

```text
UTC
```

is the customer's local timezone.

The merchant/customer timezone must be explicitly represented where required.

---

# 28. Environment Configuration

Configuration must be environment-driven.

Examples:

```text
DATABASE_URL
GEMINI_API_KEY
SARVAM_API_KEY
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
COGNEE_API_KEY
N8N_BASE_URL
N8N_WEBHOOK_SECRET
```

Names are illustrative; final names must match implementation.

---

# 29. No Secrets in Git

Never commit:

```text
API keys
Passwords
Tokens
Private certificates
Provider credentials
Service-role keys
```

Use `.env.example` for documentation.

---

# 30. `.env.example`

The repository should include safe placeholders.

Example:

```text
GEMINI_API_KEY=
SARVAM_API_KEY=
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
```

Never put real values into this file.

---

# 31. Error Handling

Errors must be explicit.

Avoid:

```text
except:
    pass
```

or silently converting failures into success.

---

# 32. Error Categories

Where useful, classify failures:

```text
VALIDATION_ERROR
AUTH_ERROR
AUTHORIZATION_ERROR
PROVIDER_ERROR
TIMEOUT
RATE_LIMITED
NOT_FOUND
CONFLICT
POLICY_BLOCKED
UNKNOWN
```

---

# 33. Retry Rules

Only retry operations that are safe to retry.

For side-effecting operations:

```text
Idempotency first
```

before automatic retry.

---

# 34. Retry Limits

Every retry mechanism must have a bounded limit.

Do not implement:

```text
while True:
    retry()
```

without an explicit safe termination condition.

---

# 35. Exponential Backoff

For retryable provider failures, use bounded backoff where appropriate.

Exact values are implementation-specific and should be configurable.

---

# 36. Timeout Rules

External calls must have explicit timeouts.

Do not allow a request to wait indefinitely for:

```text
Gemini
Sarvam
Twilio
Cognee
n8n
Database
```

---

# 37. Idempotency Rules

Every side-effecting workflow should have a stable action/event identifier.

Example:

```text
action_id = ACT-123
```

If the same action is submitted again:

```text
Do not execute twice.
```

---

# 38. Webhook Rules

Webhook handlers must:

1. Validate authenticity where supported.
2. Validate payload schema.
3. Identify provider event ID.
4. Check duplicate processing.
5. Apply state transition safely.
6. Return an appropriate response.

---

# 39. Concurrency

Do not assume only one worker will process a case.

The system must handle:

```text
Two workers
Two webhooks
Human + AI
Retry + original request
```

without creating conflicting actions.

---

# 40. Stale Data

Before important side effects:

```text
Reload current state
 ↓
Check version/state
 ↓
Execute only if still valid
```

---

# 41. Human Override

Human intervention has priority over autonomous continuation for the affected case.

Example:

```text
Human takeover
 ↓
Autonomous action blocked
```

---

# 42. Pause/Resume

Agent pause must prevent new autonomous actions.

Resume must re-evaluate current state.

Do not blindly replay queued actions.

---

# 43. Logging

Use structured logs.

Useful fields:

```text
timestamp
level
service
correlation_id
merchant_id
case_id
action_id
event_id
provider
operation
result
duration
error_code
```

Only include customer information when necessary.

---

# 44. Log Levels

Use appropriate levels:

```text
DEBUG
INFO
WARNING
ERROR
```

Avoid logging complete customer transcripts at normal production log levels unless required.

---

# 45. Audit vs Debug Logs

These are different.

### Audit

Records business/security events.

### Debug logs

Help engineers troubleshoot implementation.

Do not treat debug logs as the authoritative audit trail.

---

# 46. API Design

Endpoints should be:

- Explicit.
- Resource-oriented where appropriate.
- Validated.
- Authenticated.
- Authorized.
- Versionable where needed.

Avoid creating dozens of unnecessary endpoints.

---

# 47. API Documentation

FastAPI should expose useful OpenAPI documentation for development.

Document:

- Request schema.
- Response schema.
- Authentication.
- Error responses.
- Important side effects.

---

# 48. API Response Rules

Responses should be predictable.

Example:

```json
{
  "success": true,
  "data": {},
  "error": null
}
```

or another consistent project-wide format.

Do not mix unrelated response conventions without a reason.

---

# 49. Frontend State

The frontend must distinguish:

```text
loading
success
empty
error
pending
blocked
```

Do not display stale success after a failed backend request.

---

# 50. Optimistic UI

Do not use optimistic UI for high-risk actions unless the resulting state can be safely reconciled.

Examples requiring caution:

```text
Start agent
Send communication
Escalate
Take over
Close case
```

---

# 51. Provider Adapters

Each provider adapter should:

- Validate input.
- Call provider.
- Parse provider response.
- Normalize provider errors.
- Return application-level results.
- Never expose raw credentials.
- Be independently testable.

---

# 52. Provider-Specific Code

Do not spread Twilio/Gemini/Sarvam/Cognee-specific logic throughout unrelated modules.

Prefer:

```text
providers/
```

or equivalent architecture.

---

# 53. Mock Providers

Mocks should implement the same application interface as the real provider where practical.

Example:

```text
PaymentProvider
 ├── MockPaymentProvider
 └── FutureRealPaymentProvider
```

This allows safe replacement.

---

# 54. Mock Behavior

Mocks must be deterministic enough for testing.

Example:

```text
Payment Mock:
INV-1001 → PAID
INV-1002 → NOT_PAID
```

The mapping should be explicit.

---

# 55. Demo Mode

Demo mode may simplify setup but must not silently alter the production architecture.

Example:

```text
DEMO_MODE=true
```

can select:

```text
MockPaymentProvider
```

while the same application interfaces remain intact.

---

# 56. No Demo Hacks in Core Logic

Avoid code such as:

```text
if demo:
    pretend_payment_success()
```

Prefer:

```text
PaymentProvider.verify(...)
```

with a mock implementation.

---

# 57. UI Labels

When functionality is mocked:

```text
MOCK
DEMO
SIMULATED
```

must be clearly visible where user understanding could otherwise be affected.

---

# 58. Voice Architecture

Voice implementation must use verified provider capabilities.

Do not assume that:

```text
Twilio + Sarvam + Gemini
```

automatically provides real-time human-like conversation.

The exact streaming/turn-taking architecture must be verified during implementation.

---

# 59. Voice Fallback

If real-time voice cannot be implemented reliably:

Do not fake it.

Use the best verified fallback and mark the unsupported capability as:

```text
BLOCKED
```

or:

```text
NOT IMPLEMENTED
```

---

# 60. Natural Conversation Rule

The agent should sound natural but must remain policy-controlled.

Avoid robotic:

```text
"Your invoice is overdue. Pay now."
```

when context supports a more conversational approach.

But naturalness must never override:

```text
Truth
Safety
Authorization
Policy
Customer preference
```

---

# 61. Language Handling

The system should use the language selected/detected through verified mechanisms.

Do not claim universal Indian-language support.

Supported languages must be listed based on actual tested provider capability.

---

# 62. Prompt Versioning

Prompts are application assets.

Store them in source control.

Use explicit versions where useful:

```text
collections-agent-v1
```

A prompt change should be traceable.

---

# 63. Prompt Testing

Every important prompt change must run:

```text
Normal scenarios
Edge cases
Prompt injection tests
Policy tests
Regression tests
```

---

# 64. Prompt Scope

Prompts should explicitly state:

- Role.
- Current task.
- Trusted context.
- Untrusted content.
- Allowed actions.
- Output schema.
- Prohibited behavior.
- Escalation conditions.

---

# 65. Context Construction

Build context deliberately.

Preferred:

```text
Current case
+
Relevant transactional data
+
Relevant conversation
+
Relevant memory
+
Policy
+
Allowed actions
```

Avoid dumping unrelated database records into the prompt.

---

# 66. Memory Retrieval

Cognee retrieval should be relevance-based.

Do not retrieve an entire customer history if only one previous commitment is relevant.

---

# 67. Memory Writes

Memory should record useful durable facts.

Examples:

```text
Customer prefers Hindi
Customer requested human
Customer promised payment on a date
Customer disputed invoice
```

Only store information appropriate for the defined retention/privacy policy.

---

# 68. Memory Authority

Cognee is not the transactional source of truth.

If memory conflicts with Supabase/payment verification:

```text
Authoritative transactional data wins.
```

---

# 69. No Chain-of-Thought Memory

Never write private chain-of-thought into Cognee.

Store:

```text
Outcome
Decision
Reason code
Relevant evidence
Commitment
Escalation
```

---

# 70. n8n Rules

n8n should orchestrate workflows.

It should not become the primary database.

It should not become the only place where business policy exists.

Critical policy must remain enforceable in the backend.

---

# 71. n8n Workflow Design

Workflows should be:

- Small enough to debug.
- Clearly named.
- Idempotent where necessary.
- Observable.
- Version-controlled/exportable where practical.
- Explicit about failure branches.

---

# 72. n8n Credentials

Provider credentials should use n8n's credential system where appropriate.

Do not hard-code:

```text
Twilio token
API keys
Webhook secrets
```

inside workflow nodes.

---

# 73. Workflow Naming

Use consistent IDs.

Example:

```text
WF-001-case-processing
WF-002-whatsapp
WF-003-voice
WF-004-customer-response
WF-005-payment-verification
WF-006-follow-up
WF-007-escalation
WF-008-failure-retry
```

---

# 74. Database Access

Do not allow arbitrary database queries from AI-generated instructions.

The AI should call controlled backend tools.

Bad:

```text
Gemini → arbitrary SQL
```

Preferred:

```text
Gemini
 ↓
Approved tool
 ↓
Validated parameters
 ↓
Backend query
```

---

# 75. Tool Calling

Every AI tool should define:

```text
Name
Purpose
Input schema
Permission
Side effects
Validation
Failure behavior
```

---

# 76. Tool Permissions

Tools should be divided conceptually:

### Read

```text
get_case
get_invoice
get_customer_context
get_payment_status
get_relevant_memory
```

### Side effect

```text
send_message
start_call
schedule_followup
create_escalation
```

Side-effecting tools require stricter validation.

---

# 77. Tool Parameter Validation

Never pass arbitrary model-generated parameters directly to providers.

Validate:

```text
Case ID
Customer ID
Phone number
Message length
Date/time
Action ID
```

---

# 78. Phone Number Handling

Phone numbers must be validated and normalized before provider use.

Do not allow a model to freely choose an arbitrary recipient.

The recipient should come from authorized case/customer data.

---

# 79. Recipient Safety

A customer communication action should reference an authorized recipient associated with the case.

Example:

```text
case_id
 ↓
customer_id
 ↓
verified contact method
```

not:

```text
Gemini-generated phone number
```

---

# 80. Communication Content

The model may generate content within the allowed policy.

The system should validate:

- Recipient.
- Channel.
- Case association.
- Content constraints.
- Action authorization.

---

# 81. Contact Frequency

Frequency restrictions must be deterministic.

The model may propose:

```text
CALL
```

but the policy engine determines whether a call is currently allowed.

---

# 82. Contact Hours

Do not allow the LLM to independently decide unrestricted contact hours.

Use configurable policy.

Exact values are:

```text
TBD
```

until approved.

---

# 83. Escalation

Escalation should be deterministic where possible.

Examples:

```text
Customer requests human
Dispute detected
Low confidence
Payment conflict
Provider failure
Policy block
```

---

# 84. Confidence

Confidence must not be the only safety control.

Use:

```text
Confidence
+
Policy
+
State
+
Evidence
+
Permissions
```

The exact threshold is configurable/TBD.

---

# 85. Unknowns

When critical information is unavailable:

```text
UNKNOWN
```

must be a valid system outcome.

Do not force an action simply because the workflow expects one.

---

# 86. Testing During Development

After implementing a feature:

```text
Write/update unit tests
 ↓
Run lint/type checks
 ↓
Run integration tests
 ↓
Run relevant end-to-end scenario
```

Do not wait until the end of the project to test the complete system.

---

# 87. Type Safety

Use strong typing where the selected language/framework supports it.

For TypeScript:

```text
strict mode
```

should be enabled unless there is a documented reason not to.

For Python:

```text
Pydantic models
type hints
```

should be used for API and structured data.

---

# 88. Validation Libraries

Prefer established validation mechanisms.

FastAPI/Pydantic should validate backend request/response models.

Frontend schemas may be used where appropriate.

Do not duplicate complex validation unnecessarily.

---

# 89. Code Organization

Suggested backend structure:

```text
backend/
├── app/
│   ├── api/
│   ├── agents/
│   ├── policies/
│   ├── providers/
│   ├── services/
│   ├── models/
│   ├── schemas/
│   ├── workflows/
│   ├── security/
│   └── utils/
├── tests/
└── migrations/
```

Exact structure may evolve if a better maintainable structure is justified.

---

# 90. Frontend Organization

Suggested:

```text
frontend/
├── src/
│   ├── components/
│   ├── pages/
│   ├── features/
│   ├── hooks/
│   ├── services/
│   ├── types/
│   ├── utils/
│   └── styles/
```

Avoid a single giant component.

---

# 91. Component Rules

Components should have one clear responsibility where practical.

Avoid:

```text
Dashboard.jsx
```

containing:

```text
API calls
AI logic
database logic
workflow logic
UI
```

all in one file.

---

# 92. Reusable UI

Reuse components for:

```text
StatusBadge
ActionCard
CaseCard
Timeline
ConversationMessage
MetricCard
Modal
ConfirmationDialog
```

where appropriate.

---

# 93. UI and Backend Contract

Frontend types should match backend schemas.

Do not manually guess response fields.

If the backend contract changes:

```text
Update API schema
Update frontend types
Update tests
```

---

# 94. Loading and Error States

Every asynchronous feature should have:

```text
Loading
Success
Empty
Error
```

where applicable.

---

# 95. Destructive Actions

For important actions:

```text
Pause Agent
Take Over
Close Case
Reset Demo
```

provide confirmation where appropriate.

---

# 96. Accessibility

Do not use color as the only indicator of state.

Example:

```text
PAID
```

should not be represented only by a color.

Use:

```text
Text
Icon where appropriate
Accessible label
```

---

# 97. Responsive Design

The UI should be tested at common desktop and smaller viewport sizes.

Do not assume the user will only use one screen size.

---

# 98. Dependency Rules

Prefer:

```text
Small dependency set
Well-maintained packages
Official SDKs where appropriate
Pinned/locked versions
```

Do not add a package for trivial functionality.

---

# 99. Package Installation Rule

Before adding a dependency ask:

```text
Is it required?
Can existing project functionality solve it?
Is it maintained?
Does it introduce security/cost risk?
```

---

# 100. Free Infrastructure Constraint

The project must respect the requirement:

```text
No paid service dependency for the MVP where a viable free option exists.
No credit-card-required dependency unless explicitly approved.
```

However:

```text
Free
```

must never be interpreted as:

```text
Unlimited
Guaranteed
Production-ready
```

---

# 101. Provider Cost Awareness

Before implementing a potentially expensive operation:

```text
Check provider pricing/limits
 ↓
Confirm current account access
 ↓
Design bounded usage
```

Do not assume the user's subscription includes unlimited API usage.

---

# 102. Gemini API Rule

The Google AI Pro subscription and Gemini API billing/access are separate concepts.

The implementation must verify the actual Gemini API access available to the project.

Do not enable paid API billing without explicit approval.

---

# 103. Twilio Rule

Use the user's available trial resources for testing where applicable.

Do not assume trial limits remain unchanged.

The implementation must verify:

```text
Voice allowance
WhatsApp allowance
Verified recipients
Trial restrictions
```

before relying on them.

---

# 104. Sarvam Rule

Before implementing production-style speech architecture:

```text
Verify current Sarvam API
Verify authentication
Verify supported languages
Verify STT capability
Verify TTS capability
Verify streaming/realtime capability if needed
Verify current free access/limits
```

---

# 105. Cognee Rule

Verify:

```text
Current API
Authentication
Memory ingestion
Retrieval
Update behavior
Free-tier availability
Rate/usage limits
```

Do not assume API syntax from an older tutorial.

---

# 106. n8n Rule

Verify:

```text
Current webhook behavior
Credential mechanism
Workflow execution behavior
Retry behavior
Available plan limits
```

Do not build around undocumented assumptions.

---

# 107. Supabase Rule

Verify the actual configured project capabilities.

Do not assume:

```text
No pause
Unlimited database
Unlimited egress
Unlimited users
```

Free-tier limitations must be respected.

---

# 108. Hosting Rule

Hosting provider is:

```text
TBD
```

until compatibility and free-tier requirements are verified.

Do not commit the project to a provider merely because it has a free landing page.

---

# 109. Local Development

The project must run on Windows.

Document:

```text
Prerequisites
Environment variables
Install commands
Database setup
Backend start
Frontend start
n8n setup
Webhook setup
Provider setup
Test commands
```

---

# 110. Local Development Principle

A new developer should be able to understand:

```text
What to install
What to configure
What to run
What to test
```

without reverse-engineering the repository.

---

# 111. Documentation Rule

If implementation behavior changes, update the corresponding specification/documentation.

Important documents:

```text
README
PRD
Agent Spec
Decision Engine
Conversation Spec
Workflow Spec
Integration Spec
Data Model
UI/UX
Security
Testing
Development Rules
```

---

# 112. Questions File

Maintain:

```text
docs/QUESTIONS.md
```

for unresolved decisions.

Each question should include:

```text
Question
Why it matters
Current assumption, if any
Blocking status
Decision
Decision date
```

---

# 113. No Silent Decisions

If a decision materially changes:

```text
Architecture
Cost
Security
Provider
Data model
User experience
AI behavior
External communication
```

ask before making it unless the specification already decides it.

---

# 114. Safe Defaults

When a non-critical value is not specified, choose a conservative default only if:

1. It does not change architecture.
2. It does not create financial/legal risk.
3. It can be changed through configuration.
4. It is documented.

Otherwise ask.

---

# 115. Open Question Example

Bad:

```text
We'll call customers after 10 AM.
```

if no requirement specifies this.

Good:

```text
OPEN QUESTION:
What contact hours should the policy engine enforce?
```

---

# 116. Legal/Compliance Claims

Do not invent legal requirements.

Use:

```text
Applicable requirements must be verified
```

when deployment-specific legal/compliance requirements have not been established.

The hackathon prototype must not be presented as legally/compliance certified.

---

# 117. Production Claims

Do not claim:

```text
Production-ready
Enterprise-grade
Fully compliant
Bank-grade
100% reliable
Human-equivalent
```

unless those claims are actually supported by evidence and scope.

---

# 118. AI Capability Claims

Do not claim:

```text
Fully autonomous
Human-level
Perfect
Always correct
Understands every language
```

without clearly defining and demonstrating the actual supported scope.

---

# 119. UI Honesty

The UI must not show:

```text
Payment verified
```

when only the customer said:

```text
I paid.
```

Similarly:

```text
Call successful
```

must mean the provider actually reported the relevant result.

---

# 120. Observability

Important autonomous actions should be traceable through:

```text
correlation_id
case_id
action_id
event_id
```

This should allow developers to follow:

```text
Decision
→ Workflow
→ Provider
→ Event
→ Result
```

---

# 121. Feature Flags

Use feature flags/configuration for capabilities that may not be available in every environment.

Examples:

```text
VOICE_ENABLED
WHATSAPP_ENABLED
COGNEE_ENABLED
SARVAM_ENABLED
DEMO_MODE
```

Exact configuration names are implementation details.

---

# 122. Disabled Provider Behavior

If a provider is not configured:

```text
Do not crash the entire application unnecessarily.
```

Show:

```text
Integration not configured
```

where the feature depends on it.

---

# 123. Startup Validation

At startup, the backend should validate required configuration.

Example:

```text
Required DB configuration → checked
Required AI configuration → checked
```

Optional providers can be reported separately.

---

# 124. Health Checks

Where practical expose safe health information such as:

```text
Database
AI provider configuration
n8n connectivity
Provider availability
```

Do not expose secrets.

---

# 125. Testable Architecture

A module is easier to test if dependencies are injected rather than hard-coded.

Prefer:

```text
CollectionService(payment_provider)
```

over:

```text
CollectionService()
```

that internally creates a specific provider.

---

# 126. Deterministic Tests

Tests should not depend unnecessarily on:

```text
Current real-world API state
Random model output
External network
Provider quotas
```

Use mocks/fixtures for deterministic tests.

---

# 127. Real Integration Tests

Real provider tests should be separate from deterministic unit tests.

Example:

```text
tests/unit/
tests/integration/
tests/e2e/
```

---

# 128. Test Credentials

Use dedicated test credentials where available.

Never use personal production credentials in automated tests.

---

# 129. External API Testing

Do not repeatedly call expensive/limited providers during local unit tests.

Mock them.

Use real APIs for:

```text
Integration validation
Final demo validation
```

where appropriate.

---

# 130. Code Quality

Before considering a feature complete:

```text
Lint passes
Type checks pass
Tests pass
No obvious dead code
No debug prints
No hard-coded secrets
No broken imports
No unused critical configuration
```

---

# 131. Debug Code

Do not leave:

```text
console.log()
print()
debugger
temporary bypasses
```

in production/demo paths unless intentionally retained for observability.

---

# 132. Temporary Bypasses

If a temporary bypass is absolutely necessary:

```text
TODO
Reason
Owner
Removal condition
```

must be documented.

Never leave an undocumented security bypass.

---

# 133. Git Rules

Use meaningful commits.

Examples:

```text
feat: add collection decision engine
feat: add Twilio voice adapter
fix: prevent duplicate webhook actions
test: add stale action regression
```

Avoid:

```text
update
changes
final
final2
working
```

---

# 134. Branching

The exact Git workflow is optional.

At minimum:

```text
main
```

must remain in a runnable state before demo/release milestones.

---

# 135. Pull Request/Review Checklist

Before merging a substantial feature:

- Requirement identified.
- Security considered.
- Tests added.
- Documentation updated.
- No secret exposure.
- Mock/real status clear.
- Failure handling implemented.
- Audit behavior considered.

---

# 136. No Overengineering

The MVP should not introduce unnecessary:

```text
Microservices
Message brokers
Redis
Kubernetes
Complex event buses
Multiple databases
```

unless a documented requirement justifies them.

---

# 137. Keep Architecture Replaceable

The system should allow future replacement of:

```text
Gemini
Sarvam
Twilio
Cognee
Supabase
n8n
```

through clear interfaces where practical.

---

# 138. Do Not Prematurely Build Future Agents

The vision may include:

```text
Sales Agent
Support Agent
Bookkeeping Agent
Finance Agent
```

but the MVP implementation should remain focused on:

```text
Autonomous AI Collections Agent
```

Future agents should not destabilize the collections workflow.

---

# 139. MVP Priority

When tradeoffs occur:

```text
Working collections loop
>
Reliable action execution
>
Safety
>
Auditability
>
Natural conversation
>
Visual polish
>
Future extensibility
```

This is a development priority, not a product ranking.

---

# 140. Build Order

Recommended sequence:

```text
1. Repository setup
2. Environment configuration
3. Database schema
4. Authentication
5. Basic merchant UI
6. Case management
7. Policy engine
8. Gemini adapter
9. Structured agent
10. Cognee memory
11. n8n workflows
12. Twilio WhatsApp
13. Payment mock
14. Customer response loop
15. Sarvam integration
16. Twilio voice
17. Human escalation
18. Audit/observability
19. Security tests
20. End-to-end tests
21. Demo mode
22. Deployment
```

The actual order may change if a dependency requires it.

---

# 141. Vertical Slice Rule

Prefer completing one end-to-end slice before building many disconnected features.

Example:

```text
Case
→ Decision
→ WhatsApp
→ Response
→ Resolution
```

before implementing many dashboard-only features.

---

# 142. Voice Should Build on Existing Conversation Logic

Do not create a completely separate AI brain for voice.

Preferred:

```text
Shared Conversation/Agent Logic
          ↑
    ┌─────┴─────┐
 WhatsApp     Voice
```

Only channel-specific transport/voice processing should differ.

---

# 143. Channel Abstraction

Conceptually:

```text
CommunicationChannel
 ├── WhatsApp
 └── Voice
```

Both should feed into the same conversation and case-management system.

---

# 144. Shared Intent Model

The same intent model should be used across:

```text
Text
WhatsApp
Voice
```

Examples:

```text
PAYMENT_COMMITMENT
ALREADY_PAID_CLAIM
DISPUTE
MORE_TIME
UNABLE_TO_PAY
HUMAN_REQUEST
UNKNOWN
```

---

# 145. Shared Case State

Communication channel must not determine the underlying case truth.

Example:

```text
Voice:
"I paid."

WhatsApp:
"I paid."
```

Both create:

```text
ALREADY_PAID_CLAIM
```

and use the same payment verification path.

---

# 146. Final Code Review Questions

Before declaring implementation complete, ask:

```text
Did we assume anything undocumented?

Did we expose any secrets?

Can AI bypass policy?

Can duplicate events create duplicate actions?

Can a paid customer be contacted by a stale action?

Can one merchant access another merchant's data?

Can customer text modify authoritative financial state?

Can provider failure be mistaken for success?

Can the AI enter an infinite loop?

Can a human stop the agent?

Can we explain what happened?

Can we reproduce the demo?
```

---

# 147. Final Antigravity Rule

When uncertain:

```text
DO NOT GUESS.
DO NOT HALLUCINATE.
DO NOT FAKE.
DO NOT BYPASS.
ASK.
```

When a capability is unavailable:

```text
Mark it clearly.
Provide a safe fallback if possible.
Do not pretend it works.
```

When a capability is available:

```text
Verify it.
Integrate it.
Test it.
Document it.
```

---

# 148. Completion Standard

Antigravity should consider implementation complete only when:

```text
Specification
      ↓
Implementation
      ↓
Validation
      ↓
Testing
      ↓
Real integration verification
      ↓
Security verification
      ↓
End-to-end demo
```

all agree.

The system should be understandable, testable, safe, replaceable, and honest about what is real versus mocked.
