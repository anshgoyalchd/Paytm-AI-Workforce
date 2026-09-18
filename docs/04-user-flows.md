# User Flows

## Paytm AI Workforce — Autonomous AI Collections Agent

---

# 1. Purpose

This document defines the end-to-end user, agent, system, and integration flows for the Autonomous AI Collections Agent.

The goal is to describe what should happen from trigger to final state.

Each flow should be implementable and testable.

The system must never:

- Skip required validation.
- Execute an unauthorized action.
- Claim an action succeeded without confirmation.
- Continue autonomous collection after a required escalation.
- Treat mocked services as real services.

---

# 2. Flow Notation

The following notation is used:

```text
USER
  ↓
FRONTEND
  ↓
BACKEND
  ↓
AGENT
  ↓
POLICY
  ↓
n8n
  ↓
EXTERNAL SERVICE
  ↓
RESULT
```

---

# 3. Actors

| Actor | Responsibility |
|---|---|
| Merchant | Defines/starts business work and reviews results |
| AI Collections Agent | Performs bounded autonomous collection work |
| Customer | Responds to collection communication |
| Human Operator | Handles escalations/approvals |
| Frontend | Displays and initiates product actions |
| Backend | Business logic, state, security, orchestration |
| Gemini | AI reasoning/language generation |
| Cognee | AI memory |
| Supabase | Transactional source of truth |
| n8n | Workflow orchestration |
| Twilio | Voice/WhatsApp communication |
| Sarvam | Speech processing where verified/supported |
| Payment API | Payment verification; mocked in prototype if required |

---

# 4. Global Flow Rules

Every autonomous external action follows:

```text
AI decision
    ↓
Schema validation
    ↓
Policy validation
    ↓
Permission validation
    ↓
Idempotency check
    ↓
Workflow execution
    ↓
External result
    ↓
Persist result
    ↓
Continue / retry / escalate
```

No step may be silently skipped.

---

# 5. Flow UF-001 — Merchant Login

## Goal

Allow an authorized merchant to access the workforce application.

## Flow

```text
Merchant
   ↓
Open application
   ↓
Authentication
   ↓
Credentials/session validation
   ↓
Backend
   ↓
Authorized?
```

### Success

```text
Authorized
   ↓
Create/restore session
   ↓
Open Workforce Home
```

### Failure

```text
Unauthorized
   ↓
Access denied
   ↓
No merchant data exposed
```

---

# 6. Flow UF-002 — Open Workforce Home

## Goal

Show the merchant the current state of the AI workforce.

## Flow

```text
Merchant opens Workforce Home
        ↓
Frontend requests workforce data
        ↓
Backend validates session
        ↓
Backend retrieves relevant data
        ↓
Frontend displays:
    - AI employee
    - collection workload
    - active work
    - follow-ups
    - escalations
    - recent activity
```

All displayed values must come from actual application state.

---

# 7. Flow UF-003 — Start Collections Work

## Goal

Allow the merchant to delegate collection work to the AI employee.

## Flow

```text
Merchant
   ↓
"Recover pending payments"
   ↓
Frontend
   ↓
Backend
   ↓
Create/activate collection run
   ↓
Identify eligible cases
   ↓
Process cases
```

The merchant should not need to manually choose every individual customer.

The agent operates only on eligible cases.

---

# 8. Flow UF-004 — Identify Eligible Case

## Goal

Determine whether a collection case can currently be processed.

## Flow

```text
Collection run
      ↓
Retrieve open collection cases
      ↓
For each case:
      ↓
Validate required data
      ↓
Check current state
      ↓
Check payment status
      ↓
Check policy eligibility
```

### Eligible

```text
Case eligible
    ↓
Send to agent reasoning
```

### Not eligible

```text
Case not eligible
    ↓
Do not contact customer
    ↓
Record reason
    ↓
Continue with next case
```

---

# 9. Flow UF-005 — Build Case Context

## Goal

Provide the agent with the relevant information needed for a decision.

## Flow

```text
Eligible case
      ↓
Retrieve Supabase context
      ↓
Customer
Invoice
Payment state
Case state
Previous actions
      ↓
Retrieve relevant Cognee memory
      ↓
Combine approved context
      ↓
Agent
```

The agent must not receive unrelated or unauthorized data.

---

# 10. Flow UF-006 — Agent Decides Next Action

## Goal

Choose what should happen next.

## Flow

```text
Case context
    +
Relevant memory
    +
Current policies
    ↓
Gemini
    ↓
Structured decision
```

Possible high-level outcomes:

```text
WAIT
TEXT
CALL
ESCALATE
```

The structured decision must be validated.

---

# 11. Flow UF-007 — Validate Agent Decision

## Goal

Prevent an invalid AI decision from becoming an external action.

## Flow

```text
Gemini decision
      ↓
Schema validation
      ↓
Allowed action?
      ↓
Required fields present?
      ↓
Policy validation
      ↓
Permission validation
      ↓
Idempotency validation
```

### Valid

```text
Approved
   ↓
Execute action
```

### Invalid

```text
Rejected
   ↓
Record validation failure
   ↓
Do not execute
   ↓
Escalate or safely stop according to policy
```

---

# 12. Flow UF-008 — WAIT

## Goal

Allow the agent to decide that no immediate external action should happen.

## Flow

```text
Agent decision = WAIT
        ↓
Policy validation
        ↓
Record decision
        ↓
No external communication
        ↓
Optional future condition/follow-up
        ↓
Case remains in appropriate state
```

The system must not accidentally trigger a message or call for a `WAIT` decision.

---

# 13. Flow UF-009 — TEXT

## Goal

Send an allowed text communication.

## Flow

```text
Agent decides TEXT
       ↓
Policy validation
       ↓
Permission validation
       ↓
n8n communication workflow
       ↓
Twilio WhatsApp
       ↓
Customer
```

Then:

```text
Twilio result
       ↓
Backend
       ↓
Persist message/action result
       ↓
Wait for customer response
```

If the action fails:

```text
Failure
   ↓
Record failure
   ↓
Apply retry policy
   ↓
Retry / WAIT / ESCALATE
```

---

# 14. Flow UF-010 — CALL

## Goal

Make a real customer call when the agent determines a call is appropriate.

## Flow

```text
Agent decides CALL
       ↓
Policy validation
       ↓
Permission validation
       ↓
Recipient eligibility check
       ↓
n8n
       ↓
Twilio Voice
       ↓
Customer phone
```

The system must record:

- Call ID.
- Case ID.
- Call start.
- Call result.
- Duration where available.
- Failure/no-answer status where available.

---

# 15. Flow UF-011 — Voice Conversation

## Goal

Allow the AI employee to conduct a natural voice interaction.

## Conceptual Flow

```text
Twilio Voice
      ↓
Customer speech
      ↓
Sarvam STT
      ↓
Transcript
      ↓
Agent
      ↓
Gemini
      ↓
Response
      ↓
Sarvam TTS
      ↓
Twilio Voice
      ↓
Customer
```

The exact real-time/streaming architecture is dependent on verified provider capabilities.

Do not implement undocumented streaming behavior.

---

# 16. Flow UF-012 — Customer Says "I'll Pay Tomorrow"

## Example

Customer:

> "I'll pay tomorrow."

## Flow

```text
Customer speech/text
        ↓
Transcription if voice
        ↓
Intent detection
        ↓
PAYMENT_COMMITMENT
        ↓
Extract promised date
        ↓
Validate date
        ↓
Store commitment
        ↓
Generate appropriate response
        ↓
Schedule follow-up
        ↓
Update case
        ↓
Update memory
```

The system should not create a follow-up if the date is invalid or cannot be reliably interpreted without additional clarification.

---

# 17. Flow UF-013 — Customer Says "Give Me Another Week"

## Flow

```text
Customer request
      ↓
Detect request for more time
      ↓
Determine whether permitted
      ↓
If policy allows:
      ↓
Record proposed/confirmed follow-up
      ↓
Respond to customer
      ↓
Schedule follow-up
```

If approval is required:

```text
Customer request
      ↓
Approval required
      ↓
Escalate/request approval
      ↓
Do not make unauthorized commitment
```

The agent must not promise a new arrangement outside its configured authority.

---

# 18. Flow UF-014 — Customer Says "I Already Paid"

## Flow

```text
Customer
   ↓
"I already paid."
   ↓
Detect ALREADY_PAID
   ↓
Stop inappropriate collection action
   ↓
Payment verification
```

### Payment verified

```text
Payment found
   ↓
Update payment state
   ↓
Close/resolve case if closure conditions are satisfied
   ↓
Update memory
   ↓
Audit
```

### Payment not found

```text
Payment not found
   ↓
Do not accuse customer
   ↓
Follow defined policy
   ↓
Possible escalation / clarification / verification retry
```

### Verification unavailable

```text
Verification failure
   ↓
Do not claim payment status
   ↓
Record failure
   ↓
Retry or escalate according to policy
```

---

# 19. Flow UF-015 — Customer Disputes Invoice

## Example

Customer:

> "This invoice is wrong."

## Flow

```text
Customer response
      ↓
Detect DISPUTE
      ↓
Restrict ordinary collection actions
      ↓
Create dispute record
      ↓
Create escalation
      ↓
Provide context to human
      ↓
Await human handling
```

The AI must not continue normal collection behavior when the configured policy requires escalation.

---

# 20. Flow UF-016 — Customer Requests Human

## Example

Customer:

> "I want to speak to someone."

## Flow

```text
Customer response
      ↓
Detect HUMAN_REQUEST
      ↓
Stop autonomous flow where required
      ↓
Create escalation
      ↓
Store conversation context
      ↓
Notify/display escalation
```

The customer should not be forced to continue with the AI employee when policy requires human assistance.

---

# 21. Flow UF-017 — Customer Cannot Pay

## Example

Customer:

> "I can't pay right now."

## Flow

```text
Customer response
      ↓
Detect UNABLE_TO_PAY
      ↓
Retrieve relevant case/policy
      ↓
Determine permitted next step
```

Possible system outcomes:

```text
Follow-up
Escalation
Wait
Other permitted workflow
```

The agent must not invent financial arrangements.

---

# 22. Flow UF-018 — Customer Refuses

## Example

Customer:

> "I'm not paying."

## Flow

```text
Customer response
      ↓
Detect REFUSAL
      ↓
Retrieve policy
      ↓
Determine permitted response
      ↓
Respond within policy
      ↓
Continue / WAIT / ESCALATE
```

The agent must remain professional and must not use threats or fabricated consequences.

---

# 23. Flow UF-019 — Customer Response Is Unknown

## Flow

```text
Customer response
      ↓
Intent confidence insufficient
      ↓
Do not force an incorrect intent
      ↓
Attempt clarification if permitted
      ↓
If still uncertain:
      ↓
ESCALATE / WAIT according to policy
```

The system must not fabricate an interpretation.

---

# 24. Flow UF-020 — Customer Does Not Answer

## Flow

```text
Call initiated
      ↓
No answer
      ↓
Twilio call result
      ↓
Record NO_ANSWER
      ↓
Evaluate retry/contact policy
```

Possible outcomes:

```text
Retry later
WAIT
TEXT
ESCALATE
```

The agent must not retry indefinitely.

---

# 25. Flow UF-021 — Customer Hangs Up

## Flow

```text
Call active
      ↓
Customer hangs up
      ↓
Twilio result
      ↓
Record call termination
      ↓
Determine whether conversation was completed
      ↓
Next action
```

If the conversation was incomplete, the system should not assume the customer agreed to anything.

---

# 26. Flow UF-022 — Call Failure

## Flow

```text
Agent requests call
      ↓
Twilio call attempt
      ↓
Provider failure
```

Then:

```text
Record failure
      ↓
Determine retry eligibility
      ↓
Retry / TEXT / WAIT / ESCALATE
```

The exact retry behavior is defined by policy.

---

# 27. Flow UF-023 — WhatsApp Customer Response

## Flow

```text
Customer replies
      ↓
Twilio webhook/event
      ↓
Validate webhook
      ↓
Identify customer/case
      ↓
Store inbound message
      ↓
Agent interpretation
      ↓
Next decision
```

The system must protect against duplicate webhook delivery.

---

# 28. Flow UF-024 — Follow-Up Created

## Flow

```text
Customer commitment / permitted delay
       ↓
Follow-up required
       ↓
Create follow-up
       ↓
Store:
    case
    customer
    scheduled time
    reason
    intended action
       ↓
Case = FOLLOW_UP / WAITING
```

---

# 29. Flow UF-025 — Follow-Up Becomes Due

## Flow

```text
Follow-up becomes due
       ↓
Retrieve latest case state
       ↓
Verify case is still eligible
```

### Still eligible

```text
Resume agent workflow
```

### No longer eligible

```text
Do not contact
       ↓
Record reason
       ↓
Mark/cancel follow-up appropriately
```

This prevents stale follow-ups from causing unintended communication.

---

# 30. Flow UF-026 — Payment Verification

## Flow

```text
Verification requested
      ↓
Payment verification interface
      ↓
Result
```

Possible result categories:

```text
PAID
NOT_PAID
UNKNOWN
ERROR
```

The exact API response schema must be defined in `09-workflow-spec.md`.

---

# 31. Flow UF-027 — Payment Confirmed

## Flow

```text
Payment verification
      ↓
PAID
      ↓
Update payment state
      ↓
Update collection case
      ↓
Cancel unnecessary future follow-ups
      ↓
Close case if permitted
      ↓
Audit
      ↓
Memory update
```

---

# 32. Flow UF-028 — Payment Not Confirmed

## Flow

```text
Payment verification
      ↓
NOT_PAID
      ↓
Keep case open
      ↓
Determine next permitted action
      ↓
Agent decision
```

The system must not close the case.

---

# 33. Flow UF-029 — Payment Verification Error

## Flow

```text
Payment verification
      ↓
ERROR / UNKNOWN
      ↓
Do not modify payment state as paid
      ↓
Record verification failure
      ↓
Retry if permitted
      ↓
Otherwise escalate or wait
```

---

# 34. Flow UF-030 — Escalation

## Trigger Examples

- Customer dispute.
- Customer requests human.
- Insufficient confidence.
- Policy requires human approval.
- Payment verification ambiguity.
- Repeated integration failure.
- Required information missing.

## Flow

```text
Escalation condition
      ↓
Create escalation
      ↓
Stop restricted autonomous actions
      ↓
Store context
      ↓
Human sees escalation
      ↓
Human resolves / approves / rejects
```

---

# 35. Flow UF-031 — Human Approval

## Flow

```text
Agent proposes action
      ↓
Policy says approval required
      ↓
Create approval request
      ↓
Human reviews
```

### Approved

```text
Approval
   ↓
Authorized action
   ↓
Execute
   ↓
Record result
```

### Rejected

```text
Rejection
   ↓
Do not execute
   ↓
Update case
   ↓
Determine next permitted state
```

---

# 36. Flow UF-032 — Human Takes Over Conversation

## Flow

```text
Customer requests human
       ↓
Escalation
       ↓
Human opens case
       ↓
Human reviews:
    customer
    invoice
    previous conversation
    AI decisions
    memory summary
    audit trail
       ↓
Human handles case
       ↓
Record resolution
```

The AI must not continue autonomous collection after a human takeover unless the case is explicitly returned to autonomous handling.

---

# 37. Flow UF-033 — Memory Update

## Trigger

A meaningful interaction or outcome occurs.

## Flow

```text
Interaction/outcome
       ↓
Determine useful memory
       ↓
Validate data
       ↓
Write to Cognee
       ↓
Store memory reference/status
       ↓
Audit
```

Examples:

```text
Customer promised payment
Customer disputed invoice
Customer requested human
Previous communication failed
Payment confirmed after follow-up
```

---

# 38. Flow UF-034 — Audit Event

Every important event should follow:

```text
Action/event occurs
      ↓
Create audit event
      ↓
Persist event
      ↓
Associate with:
    case
    actor
    timestamp
    action
    result
```

The audit system must distinguish:

```text
AI action
Human action
System action
External integration event
```

---

# 39. Flow UF-035 — Duplicate Webhook

## Scenario

The same external webhook is received more than once.

## Flow

```text
Webhook
   ↓
Validate authenticity
   ↓
Extract event ID
   ↓
Check whether event already processed
```

### Already processed

```text
Do not repeat side effect
Return appropriate acknowledgement
```

### New event

```text
Process event
   ↓
Record event ID
```

---

# 40. Flow UF-036 — Duplicate Action Prevention

## Scenario

A workflow is retried after an uncertain response.

## Flow

```text
Action request
      ↓
Generate/validate idempotency key
      ↓
Check existing action
```

### Existing successful action

```text
Do not repeat external side effect
Return stored result
```

### No prior action

```text
Execute
      ↓
Persist result
```

---

# 41. Flow UF-037 — Gemini Failure

## Flow

```text
Agent requests Gemini
      ↓
API failure / timeout / rate limit
```

Then:

```text
Record failure
      ↓
No external action
      ↓
Retry if permitted
      ↓
Otherwise WAIT / ESCALATE
```

The system must not generate a fake AI result to continue the workflow.

---

# 42. Flow UF-038 — Sarvam Failure

## Flow

```text
Voice processing
      ↓
Sarvam failure
```

Then:

```text
Record failure
      ↓
Do not pretend transcription succeeded
      ↓
Determine fallback
```

Fallback behavior must be explicitly defined and must not assume an unavailable service.

---

# 43. Flow UF-039 — Cognee Failure

## Flow

```text
Memory retrieval
      ↓
Cognee failure
```

The system must distinguish:

```text
Memory unavailable
```

from:

```text
No memory exists
```

The agent must not treat a failed memory request as proof that no previous interaction exists.

The case may proceed only if current policy allows reasoning without memory.

---

# 44. Flow UF-040 — Supabase Failure

## Flow

```text
Database operation
      ↓
Failure
```

The system must not report the transaction as successfully persisted.

External side effects must be carefully coordinated with database state to avoid inconsistent records.

The exact consistency strategy is defined in the technical specifications.

---

# 45. Flow UF-041 — n8n Failure

## Flow

```text
Backend triggers workflow
      ↓
n8n failure/unavailable
```

Then:

```text
Record workflow failure
      ↓
Do not claim external action succeeded
      ↓
Retry if safe
      ↓
Otherwise WAIT / ESCALATE
```

---

# 46. Flow UF-042 — Customer Opts Out / Contact Restriction

If the application supports an opt-out/contact restriction state:

```text
Restriction detected
      ↓
Block prohibited communication
      ↓
Record reason
      ↓
Determine permitted next state
```

The system must not bypass a configured contact restriction.

Exact legal/compliance requirements are outside the scope of this document and must not be invented.

---

# 47. Flow UF-043 — Case Already Paid Before Follow-Up

## Scenario

A follow-up is scheduled, but payment arrives before the follow-up executes.

```text
Follow-up due
      ↓
Refresh current case state
      ↓
Payment status = PAID
      ↓
Do not contact customer
      ↓
Cancel/complete follow-up
      ↓
Close case if permitted
```

This prevents stale automated communication.

---

# 48. Flow UF-044 — Case Becomes Disputed Before Follow-Up

## Scenario

A customer disputes the invoice after a follow-up was scheduled.

```text
Follow-up due
      ↓
Refresh case
      ↓
Case = DISPUTED
      ↓
Do not execute ordinary collection action
      ↓
Escalate/route according to policy
```

---

# 49. Flow UF-045 — Customer Changes Language

If multilingual conversation is supported by the verified voice stack:

```text
Customer uses language A
      ↓
Agent responds appropriately
      ↓
Customer switches to language B
      ↓
Language detection/handling
      ↓
Continue conversation in supported language
```

The exact supported languages must come from verified Sarvam/API capabilities.

Do not claim support for a language that has not been verified.

---

# 50. Flow UF-046 — Customer Gives Ambiguous Date

## Example

> "I'll pay sometime next week."

## Flow

```text
Customer statement
      ↓
Detect commitment
      ↓
Date extraction ambiguous
      ↓
Agent requests clarification if permitted
```

If clarification is not possible:

```text
Do not store an exact confirmed date
      ↓
Use a safe state
      ↓
WAIT / ESCALATE according to policy
```

---

# 51. Flow UF-047 — Customer Gives Multiple Requests

## Example

> "I already paid, and there is another invoice that is wrong."

The agent must separate the intents where possible.

Conceptual flow:

```text
Customer response
      ↓
Intent extraction
      ↓
Multiple intents
      ↓
Handle each according to policy
      ↓
Prioritize safety/restrictions
      ↓
Do not continue ordinary collection if a dispute requires stopping
```

---

# 52. Flow UF-048 — Agent Cannot Determine Next Action

## Flow

```text
Current context
      ↓
Agent reasoning
      ↓
No sufficiently reliable action
      ↓
Structured uncertainty
      ↓
Policy
      ↓
WAIT / ESCALATE
```

The agent must not be forced into an arbitrary action.

---

# 53. Flow UF-049 — Case Completion

A collection case reaches a terminal state.

Possible legitimate terminal outcomes depend on the final state model.

Conceptual flow:

```text
Outcome verified
      ↓
Case closure conditions checked
      ↓
Update case
      ↓
Cancel unnecessary follow-ups
      ↓
Update memory
      ↓
Audit
      ↓
Case complete
```

---

# 54. Flow UF-050 — Merchant Reviews Completed Case

## Flow

```text
Merchant
   ↓
Open completed case
   ↓
View:
    customer
    invoice
    decision history
    communication
    payment verification
    follow-ups
    escalation
    audit
```

The displayed information must correspond to persisted system data.

---

# 55. Flow UF-051 — Merchant Reviews Agent Decision

## Flow

```text
Merchant opens case
      ↓
Decision history
      ↓
Select decision
      ↓
Display:
    action
    reason code
    explanation
    context reference
    policy result
    execution result
```

The UI should make it possible to understand what the agent attempted and what actually happened.

---

# 56. Flow UF-052 — Merchant Reviews Escalation

## Flow

```text
Merchant
   ↓
Escalation Center
   ↓
Open escalation
   ↓
Review:
    reason
    customer
    invoice
    conversation
    AI decision
    relevant memory
    audit history
```

Human resolution should be recorded.

---

# 57. Flow UF-053 — Full Autonomous Collection Loop

This is the primary MVP flow.

```text
Merchant
   ↓
"Recover my pending payments"
   ↓
Collection run
   ↓
Identify eligible case
   ↓
Retrieve Supabase context
   ↓
Retrieve Cognee memory
   ↓
Gemini reasoning
   ↓
Structured decision
   ↓
Schema validation
   ↓
Policy validation
   ↓
Permission validation
   ↓
Action
   ├── WAIT
   ├── TEXT
   ├── CALL
   └── ESCALATE
```

If communication occurs:

```text
Action
   ↓
n8n
   ↓
Twilio
   ↓
Customer
   ↓
Response
   ↓
AI interpretation
   ↓
Next decision
```

Then:

```text
Payment verification
        OR
Follow-up
        OR
Escalation
        OR
Closure
        ↓
Supabase update
        ↓
Cognee memory update
        ↓
Audit event
```

This flow is the primary end-to-end acceptance target.

---

# 58. Flow Completion Rule

For every flow in this document:

A flow is complete only when:

```text
Trigger
   ↓
Expected processing
   ↓
Expected result
   ↓
Failure handling
   ↓
Persistence
   ↓
Test
```

has been implemented and verified.

A diagram alone does not constitute implementation.

---

# 59. Implementation Rule

If a flow depends on an external API whose:

- Endpoint is unknown.
- Authentication is unknown.
- Request format is unknown.
- Response format is unknown.
- Free-tier capability is unknown.

then implementation must stop at that dependency and the issue must be recorded in:

`QUESTIONS.md`

No undocumented behavior may be invented.

---

# 60. Final Flow Principle

The Autonomous AI Collections Agent should behave as:

```text
Goal
 ↓
Context
 ↓
Memory
 ↓
Decision
 ↓
Policy
 ↓
Action
 ↓
Observation
 ↓
Interpretation
 ↓
Verification
 ↓
Next action
 ↓
Resolution / Escalation
 ↓
Audit + Memory
```

The agent is considered autonomous only when it can progress through this loop using real system actions within its defined boundaries.
