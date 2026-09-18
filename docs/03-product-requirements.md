# Product Requirements

## Paytm AI Workforce — Autonomous AI Collections Agent

---

# 1. Purpose

This document converts the PRD into **testable product requirements**.

Each requirement has a unique ID and should be traceable to:

```text
Requirement
    ↓
Implementation
    ↓
Test
    ↓
Evidence
```

A requirement must not be marked complete unless the required behavior has been implemented and tested.

---

# 2. Requirement Status

Use only the following statuses:

- `PLANNED`
- `IN_PROGRESS`
- `IMPLEMENTED`
- `TESTED`
- `BLOCKED`
- `FAILED`
- `NOT_IMPLEMENTED`
- `MOCKED`
- `VERIFIED`

Do not use vague statuses such as:

- Almost done
- Mostly done
- Working fine
- Basically complete

---

# 3. Priority Definitions

| Priority | Meaning |
|---|---|
| P0 | Essential for the MVP; must work |
| P1 | Important for the MVP |
| P2 | Useful but not required for the core demo |
| P3 | Future enhancement |

---

# 4. Functional Requirements

## FR-001 — Merchant Access

**Priority:** P0

The system must provide an authenticated merchant-facing application.

### Requirements

- A user must be able to authenticate.
- Unauthorized users must not access merchant data.
- Authentication state must be handled securely.
- Credentials/secrets must not be exposed to the frontend.

### Acceptance

Given a valid authenticated user:

```text
Login
  ↓
Authenticated session
  ↓
Application accessible
```

Given an unauthenticated user:

```text
Attempt protected resource
  ↓
Access denied / redirected to authentication
```

---

## FR-002 — Merchant Workforce Overview

**Priority:** P1

The application should provide an overview of the AI workforce.

The MVP should clearly identify:

- Autonomous AI Collections Agent.
- Current operating state.
- Number of relevant cases.
- Active work.
- Follow-ups.
- Escalations.
- Recent activity.

Values displayed by the UI must originate from application data.

---

## FR-003 — Collection Case Identification

**Priority:** P0

The system must identify collection cases eligible for processing.

A case should contain sufficient information for the agent to determine whether action is possible.

At minimum, relevant case data should include:

- Customer identifier.
- Invoice identifier.
- Outstanding amount.
- Due date.
- Payment status.
- Collection status.

### Validation

The system must not initiate collection activity when required case information is missing.

---

## FR-004 — Case State Management

**Priority:** P0

Every collection case must have an explicit state.

The exact state machine is defined in `04-user-flows.md` and `11-data-model.md`.

The system must prevent invalid state transitions.

Examples of meaningful states may include:

```text
OPEN
PROCESSING
CONTACTING
WAITING
FOLLOW_UP
DISPUTED
ESCALATED
PAID
CLOSED
FAILED
```

These states are implementation candidates and must be finalized in the data-model specification.

---

## FR-005 — Context Retrieval

**Priority:** P0

Before making an important collection decision, the agent must be able to retrieve relevant structured case context.

Relevant context may include:

- Customer.
- Invoice.
- Outstanding amount.
- Due date.
- Payment status.
- Previous actions.
- Current case state.

The agent must not make decisions using fabricated context.

---

## FR-006 — Memory Retrieval

**Priority:** P0

The agent must retrieve relevant historical memory from Cognee when historical context is required.

Examples:

- Previous conversation.
- Previous payment commitment.
- Previous collection outcome.
- Previous dispute.

Memory retrieval must be scoped to the relevant customer/case context.

---

## FR-007 — Memory Separation

**Priority:** P0

Transactional state must remain in Supabase.

AI memory must not be treated as the authoritative payment database.

Example:

```text
Payment status → Supabase
Conversation memory → Cognee
```

If the two sources disagree, the transactional source of truth must be used for transactional facts.

---

## FR-008 — Agent Decision Generation

**Priority:** P0

The agent must generate a structured next-action decision.

The initial high-level action set is:

```text
WAIT
TEXT
CALL
ESCALATE
```

The decision must contain sufficient structured information for deterministic validation.

At minimum, the decision should include:

- Action.
- Reason.
- Confidence or equivalent uncertainty signal.
- Case identifier.
- Relevant context reference.

The exact schema is defined in `07-decision-engine.md`.

---

## FR-009 — Deterministic Decision Validation

**Priority:** P0

AI-generated decisions must be validated before execution.

Validation must include:

1. Schema validation.
2. Allowed-action validation.
3. Required-field validation.
4. Policy validation.
5. Permission validation.

An invalid decision must not reach an external action system.

---

## FR-010 — Decision Reason Code

**Priority:** P1

Every important autonomous decision must include a machine-readable reason code.

Example:

```text
NO_RESPONSE_AFTER_OUTREACH
PAYMENT_COMMITMENT
PAYMENT_ALREADY_CLAIMED
CUSTOMER_DISPUTE
HUMAN_REQUEST
INSUFFICIENT_CONFIDENCE
```

The final reason-code vocabulary must be defined in `07-decision-engine.md`.

Reason codes must describe actual system conditions.

---

## FR-011 — WAIT Action

**Priority:** P0

The agent must be able to choose `WAIT`.

When the agent chooses `WAIT`:

- No external communication should be triggered.
- The reason must be recorded.
- A future condition/time may be recorded if required.
- The case must remain in an appropriate state.

---

## FR-012 — TEXT Action

**Priority:** P0

The agent must be able to choose `TEXT` when permitted.

The communication workflow must:

1. Validate the action.
2. Trigger the appropriate n8n workflow.
3. Execute the available messaging integration.
4. Record the result.
5. Handle failure.

The implementation must respect Twilio trial restrictions.

---

## FR-013 — CALL Action

**Priority:** P0

The agent must be able to choose `CALL` when permitted.

The communication workflow must:

1. Validate the action.
2. Trigger the n8n workflow.
3. Initiate a real Twilio call where the configured test recipient is eligible.
4. Record call status.
5. Handle call failure/no-answer/hang-up.
6. Process customer responses where supported.
7. Return the result to the application.

A button that only simulates a call is not sufficient.

---

## FR-014 — Voice Conversation

**Priority:** P0

Where the verified API capabilities permit it, the voice workflow should support:

```text
Customer speech
      ↓
Speech-to-text
      ↓
Agent reasoning
      ↓
Response generation
      ↓
Text-to-speech
      ↓
Customer
```

The system should support natural conversational responses rather than only predefined scripts.

If a required real-time voice capability cannot be implemented with the available free services, the limitation must be recorded as `BLOCKED` or `NOT IMPLEMENTED`.

---

## FR-015 — Customer Intent Detection

**Priority:** P0

The agent must identify relevant customer intents.

At minimum, the test suite should cover:

- `PAYMENT_COMMITMENT`
- `ALREADY_PAID`
- `REQUEST_MORE_TIME`
- `DISPUTE`
- `UNABLE_TO_PAY`
- `HUMAN_REQUEST`
- `REFUSAL`
- `UNKNOWN`

The exact intent taxonomy may be refined in `06-conversation-spec.md`.

---

## FR-016 — Payment Commitment Extraction

**Priority:** P0

The system should extract a payment commitment when the customer provides one.

Example:

```text
Customer:
"I'll pay tomorrow."

Result:
intent = PAYMENT_COMMITMENT
promised_date = <validated date>
```

The system must not store an invalid or ambiguous date as a confirmed commitment.

---

## FR-017 — Already-Paid Handling

**Priority:** P0

If the customer says they already paid:

```text
Customer claim
      ↓
Stop inappropriate collection
      ↓
Payment verification
      ↓
Result
```

Possible outcomes:

```text
Payment verified
Payment not found
Verification unavailable
```

The agent must not invent the verification result.

---

## FR-018 — Dispute Handling

**Priority:** P0

If a customer disputes an invoice or debt:

```text
Dispute detected
      ↓
Collection action restricted
      ↓
Dispute recorded
      ↓
Escalation according to policy
```

The agent must not continue ordinary collection behavior when policy requires the case to stop/escalate.

---

## FR-019 — Human Assistance

**Priority:** P0

If the customer requests a human:

```text
Human request
      ↓
Stop autonomous handling where required
      ↓
Create escalation
```

The escalation must contain enough context for human follow-up.

---

## FR-020 — Follow-Up Creation

**Priority:** P0

The system must be able to create a follow-up.

A follow-up must identify:

- Collection case.
- Customer.
- Scheduled date/time.
- Reason.
- Next intended action.
- Current status.

---

## FR-021 — Follow-Up Execution

**Priority:** P1

When a follow-up becomes due, the system should be able to resume the collection workflow.

The follow-up must not automatically execute an external action if the case is no longer eligible.

Before execution, current case state must be checked.

---

## FR-022 — Payment Verification

**Priority:** P0

The system must provide a payment-verification interface.

For the prototype, this may be a mocked payment service.

If mocked:

```text
MOCKED PAYMENT API
```

must be clearly identifiable.

The system must use the returned verification state rather than assuming payment success.

---

## FR-023 — Case Closure

**Priority:** P0

A case may be closed only when the defined closure conditions are satisfied.

Examples may include:

- Payment verified.
- Human resolution.
- Other explicitly defined terminal outcome.

The agent must not close a case merely because a customer says they paid.

---

## FR-024 — Escalation Creation

**Priority:** P0

The system must create an escalation when an escalation condition is met.

An escalation should contain:

- Case.
- Customer.
- Reason.
- Relevant interaction.
- Current status.
- Required human action, if known.
- Timestamp.

---

## FR-025 — Human Escalation Visibility

**Priority:** P1

The merchant must be able to view open escalations.

The UI should provide sufficient information to understand:

- Why the case was escalated.
- What happened previously.
- What action is pending.

---

## FR-026 — Agent Action Logging

**Priority:** P0

Every externally meaningful agent action must be logged.

Examples:

```text
CALL_CUSTOMER
SEND_WHATSAPP
VERIFY_PAYMENT
SCHEDULE_FOLLOW_UP
ESCALATE_TO_HUMAN
CLOSE_CASE
```

Each action should have:

- Action ID.
- Case ID.
- Timestamp.
- Requested action.
- Validation result.
- Execution result.
- Failure reason where applicable.

---

## FR-027 — Decision Logging

**Priority:** P0

Each important AI decision must be stored.

The record should contain:

- Decision ID.
- Case ID.
- Action.
- Reason code.
- Explanation.
- Confidence/uncertainty information where applicable.
- Relevant context reference.
- Policy evaluation.
- Final execution status.

---

## FR-028 — Conversation Logging

**Priority:** P0

Relevant communication events must be stored.

For a conversation, the system should be able to reconstruct:

```text
Outbound action
      ↓
Customer response
      ↓
Agent interpretation
      ↓
Agent response
      ↓
Outcome
```

Sensitive information must be handled according to the security specification.

---

## FR-029 — Memory Update

**Priority:** P0

Meaningful interaction outcomes should be written to Cognee memory.

Examples:

```text
Customer promised payment on DATE
Customer disputed invoice
Customer requested human assistance
Previous call unsuccessful
Payment verified after previous interaction
```

The system must not store fabricated facts.

---

## FR-030 — Audit Timeline

**Priority:** P1

The merchant should be able to view an audit timeline for a collection case.

Example:

```text
09:00  Case identified
09:01  Context retrieved
09:01  Memory retrieved
09:02  AI decided CALL
09:02  Policy validated
09:03  Call initiated
09:04  Customer responded
09:04  Intent detected: PAYMENT_COMMITMENT
09:05  Follow-up created
09:05  Memory updated
```

The timeline must reflect actual recorded events.

---

# 5. AI Requirements

## AI-001 — Structured AI Output

AI decisions should use a structured response format rather than free-form text whenever the selected Gemini capability supports it.

Invalid structured output must be rejected.

---

## AI-002 — No Direct Tool Authority

Gemini must not directly receive unrestricted credentials for:

- Twilio.
- Supabase administrative operations.
- Payment systems.
- n8n administrative operations.
- Other privileged services.

The application controls tool access.

---

## AI-003 — Context-Bounded Reasoning

The agent must reason only from:

- System-provided case data.
- Retrieved memory.
- Current conversation.
- Defined policies.
- Tool results.

It must not fabricate unavailable information.

---

## AI-004 — Uncertainty Handling

When the agent cannot confidently determine the correct next action, it should return an uncertainty/insufficient-confidence outcome that can be handled by deterministic logic.

The system must not force an arbitrary action simply because an AI response is required.

---

## AI-005 — No Fabricated Tool Results

The AI must never claim:

```text
Payment verified
```

unless a payment-verification tool/system returned a corresponding result.

Likewise, it must not claim:

```text
Call completed
Message sent
Follow-up created
```

unless the corresponding system confirms the action.

---

# 6. Policy Requirements

## POL-001 — Policy Before External Action

No external action may execute without policy evaluation.

---

## POL-002 — Contact Permission

Before contacting a customer, the system must evaluate whether contact is currently permitted under the configured policy.

---

## POL-003 — Contact Frequency

The system must support configurable contact-frequency limits.

The exact values are intentionally not fixed in this document.

They must be defined explicitly before implementation.

---

## POL-004 — Dispute Restriction

The system must support a policy that prevents inappropriate autonomous collection actions after a dispute is detected.

---

## POL-005 — Human Escalation

The policy engine must be able to require human escalation.

---

## POL-006 — Approval Boundary

The system must support policies where a particular action requires human approval.

Specific thresholds and conditions must be explicitly configured.

Do not invent monetary thresholds during implementation.

---

# 7. Workflow Requirements

## WF-001 — Collection Start Workflow

The system must support:

```text
Trigger
 ↓
Identify eligible case
 ↓
Retrieve context
 ↓
Retrieve memory
 ↓
Agent decision
 ↓
Policy validation
 ↓
Action
```

---

## WF-002 — Communication Workflow

The communication workflow must:

```text
Receive authorized action
        ↓
Validate inputs
        ↓
Execute external communication
        ↓
Capture result
        ↓
Persist result
        ↓
Return result
```

---

## WF-003 — Customer Response Workflow

Customer responses must be processed as events.

The workflow should:

```text
Receive response
      ↓
Validate event
      ↓
Associate with case
      ↓
Process content
      ↓
Interpret intent
      ↓
Generate next action
      ↓
Validate next action
```

---

## WF-004 — Payment Verification Workflow

The workflow must:

```text
Payment claim / follow-up condition
       ↓
Payment verification
       ↓
Verification result
       ↓
Case update
       ↓
Agent continuation or closure
```

---

## WF-005 — Escalation Workflow

The workflow must:

```text
Escalation condition
       ↓
Create escalation
       ↓
Stop restricted autonomous actions
       ↓
Notify/display to human
       ↓
Await human resolution
```

---

## WF-006 — Failure Recovery

External workflow failures must produce an explicit failure state.

The system must not silently retry indefinitely.

Retry behavior must be bounded and documented.

---

# 8. Integration Requirements

## INT-001 — Gemini

Gemini API must be accessed from a trusted backend environment.

The API key must not be exposed to the frontend.

Exact model and API configuration must be verified before implementation.

---

## INT-002 — Twilio Voice

The system must use the verified Twilio Voice API/interface available to the account.

Trial restrictions must be respected.

The system must capture call outcomes.

---

## INT-003 — Twilio WhatsApp

The system must use only WhatsApp functionality available to the current account.

Trial template and recipient restrictions must be respected.

---

## INT-004 — Sarvam

Sarvam integration must use verified official API documentation.

No endpoint or request/response format may be invented.

---

## INT-005 — Cognee

Cognee integration must use verified official API documentation and credentials.

Memory failures must not corrupt transactional case state.

---

## INT-006 — n8n

n8n workflows must be independently identifiable and versioned.

Workflow execution failures must be returned to the application.

---

## INT-007 — Supabase

Supabase must store authoritative structured application state.

Database errors must be surfaced rather than silently ignored.

---

## INT-008 — Payment API

If a payment API is mocked:

- The interface must be documented.
- Test scenarios must be deterministic.
- The UI must label it as mocked.
- No real Paytm integration must be implied.

---

# 9. Data Requirements

## DATA-001 — Customer

A customer record must have a stable identifier.

---

## DATA-002 — Invoice

An invoice must have:

- Stable identifier.
- Customer reference.
- Amount.
- Due date.
- Payment status.

---

## DATA-003 — Collection Case

A collection case must reference:

- Customer.
- Invoice.
- Current status.
- Outstanding amount/status.
- Relevant timestamps.

---

## DATA-004 — Conversation

A conversation must be associated with a collection case.

---

## DATA-005 — Agent Decision

Agent decisions must be persistable and auditable.

---

## DATA-006 — Agent Action

External actions must have persistent records.

---

## DATA-007 — Follow-Up

Follow-ups must have an explicit scheduled state and execution state.

---

## DATA-008 — Escalation

Escalations must have an explicit lifecycle.

---

## DATA-009 — Audit Log

Important state changes and external actions must produce audit records.

---

# 10. Security Requirements

## SEC-001 — Secret Protection

API keys and secrets must not be committed to source control.

---

## SEC-002 — Frontend Secret Protection

No privileged service credential may be embedded in frontend JavaScript.

---

## SEC-003 — Input Validation

All external input must be validated.

---

## SEC-004 — AI Output Validation

AI-generated structured outputs must be validated before use.

---

## SEC-005 — Webhook Validation

External webhook events must be authenticated/validated using the mechanism supported by the relevant provider.

---

## SEC-006 — Permission Boundaries

AI tools must expose only the minimum operations required.

---

## SEC-007 — Auditability

Security-relevant and externally meaningful actions must be auditable.

---

# 11. Reliability Requirements

## REL-001 — Explicit Failure

Failures must produce explicit failure states.

---

## REL-002 — Idempotency

Retryable actions must use an idempotency mechanism where the external service and workflow allow it.

---

## REL-003 — Duplicate Event Protection

Duplicate webhook/event delivery must not cause unintended duplicate actions.

---

## REL-004 — Timeout Handling

External calls must have bounded timeouts.

---

## REL-005 — Retry Limits

Retries must be bounded.

---

## REL-006 — State Consistency

The system must avoid marking an action successful before receiving the relevant execution result.

---

# 12. UI Requirements

## UI-001 — Workforce Home

Display the AI workforce and current operational state.

---

## UI-002 — Collections Dashboard

Display collection cases and meaningful status information.

---

## UI-003 — Case Details

Display:

- Customer.
- Invoice.
- Outstanding amount.
- Case status.
- Recent activity.
- Agent decisions.
- Actions.
- Follow-ups.
- Escalations.

---

## UI-004 — Decision Explanation

Display the latest important AI decision and a concise explanation.

---

## UI-005 — Conversation Transcript

Display the relevant conversation where available.

---

## UI-006 — Escalation Center

Display open escalations requiring human attention.

---

## UI-007 — Audit Timeline

Display meaningful case events in chronological order.

---

## UI-008 — Real/Mocked Visibility

Where a workflow uses a mock integration, the interface should make that clear.

---

# 13. Observability Requirements

## OBS-001 — Request Correlation

Important workflow executions should have correlation identifiers allowing related events to be traced.

---

## OBS-002 — Integration Results

External integration results should be recorded.

---

## OBS-003 — Agent Decisions

Agent decisions should be traceable to the case and execution.

---

## OBS-004 — Error Visibility

Operational errors should be visible to authorized users/developers.

---

# 14. Free Infrastructure Requirements

## FREE-001 — No Paid Dependency

The MVP must not require a paid service.

---

## FREE-002 — No Credit Card

The intended MVP configuration must not require adding a credit card.

---

## FREE-003 — Free-Tier Verification

Free-tier limits must be verified against current official provider documentation before implementation.

---

## FREE-004 — Usage Awareness

The application/development process should make resource limits visible enough to avoid unexpectedly exhausting trial resources.

---

## FREE-005 — Block Rather Than Pay

If a required feature cannot operate within the available free resources:

```text
BLOCKED
```

must be recorded rather than silently introducing paid infrastructure.

---

# 15. Demo Requirements

## DEMO-001 — End-to-End Collection

The demo must show:

```text
Overdue case
   ↓
Context
   ↓
Memory
   ↓
Decision
   ↓
Policy
   ↓
Real action
   ↓
Customer response
   ↓
AI interpretation
   ↓
Next action
   ↓
Verification/follow-up/escalation
   ↓
Final state
```

---

## DEMO-002 — Voice Demonstration

Where the verified voice implementation is available, at least one real test call should demonstrate the autonomous agent interacting with the customer.

---

## DEMO-003 — Customer Scenarios

The test/demo environment should support representative scenarios:

1. Payment commitment.
2. Already paid.
3. Request for more time.
4. Dispute.
5. Human request.
6. Unable to pay.
7. No response.
8. Integration failure.

---

## DEMO-004 — Audit Demonstration

After a scenario, the merchant should be able to inspect what the agent did.

---

# 16. Acceptance Status Rules

A requirement may be marked `TESTED` only if:

1. The feature is implemented.
2. A defined test exists.
3. The test was actually executed.
4. The observed result matches the expected result.

A requirement must be marked `BLOCKED` if an external dependency prevents testing.

A requirement must be marked `MOCKED` if the intended real integration has been replaced by a documented mock.

---

# 17. Traceability Matrix

The following high-level mapping must be maintained:

| Product Area | Requirement IDs | Primary Specification |
|---|---|---|
| Authentication | FR-001 | `13-security-and-safety.md` |
| Workforce dashboard | FR-002 | `12-ui-ux-design.md` |
| Collection cases | FR-003 to FR-004 | `11-data-model.md` |
| Context | FR-005 | `05-agent-spec.md` |
| Memory | FR-006 to FR-007, FR-029 | `08-memory-spec.md` |
| AI decision | FR-008 to FR-011 | `07-decision-engine.md` |
| Text | FR-012 | `09-workflow-spec.md` |
| Voice | FR-013 to FR-015 | `06-conversation-spec.md` |
| Commitments | FR-016 | `06-conversation-spec.md` |
| Already-paid | FR-017 | `04-user-flows.md` |
| Disputes | FR-018 | `04-user-flows.md` |
| Human escalation | FR-019, FR-024, FR-025 | `13-security-and-safety.md` |
| Follow-ups | FR-020 to FR-021 | `09-workflow-spec.md` |
| Payment verification | FR-022 to FR-023 | `09-workflow-spec.md` |
| Audit | FR-026 to FR-030 | `11-data-model.md` |
| AI safety | AI-001 to AI-005 | `05-agent-spec.md` |
| Policies | POL-001 to POL-006 | `07-decision-engine.md` |
| Integrations | INT-001 to INT-008 | `10-integrations.md` |
| Security | SEC-001 to SEC-007 | `13-security-and-safety.md` |
| Reliability | REL-001 to REL-006 | `13-security-and-safety.md` |
| UI | UI-001 to UI-008 | `12-ui-ux-design.md` |
| Testing | All P0/P1 requirements | `14-testing-and-acceptance.md` |

---

# 18. Implementation Rule

Antigravity must implement requirements from this document without silently changing their meaning.

If a requirement is technically impossible under the currently verified services:

1. Do not fake it.
2. Do not silently remove it.
3. Mark it `BLOCKED`.
4. Record the technical reason.
5. Add the issue to `QUESTIONS.md` if a decision is required.
6. Propose an alternative only when necessary.

---

# 19. Final Product Requirement

The most important P0 requirement is the complete autonomous loop:

```text
Identify
   ↓
Understand
   ↓
Remember
   ↓
Decide
   ↓
Validate
   ↓
Act
   ↓
Observe
   ↓
Interpret
   ↓
Verify
   ↓
Continue / Follow-up / Escalate / Close
   ↓
Audit + Memory
```

The project should prioritize making this loop genuinely functional over adding unrelated features.
