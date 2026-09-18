# Workflow Specification

## Paytm AI Workforce — Autonomous AI Collections Agent

---

# 1. Purpose

This document defines the workflow orchestration layer for the Autonomous AI Collections Agent.

The workflow layer connects:

```text
AI Decision
    ↓
Policy Validation
    ↓
n8n
    ↓
External Communication / Verification
    ↓
Result
    ↓
Backend
    ↓
New AI Decision
```

The goal is to make every action **observable, retryable, bounded, and safe**.

---

# 2. Core Principle

n8n is the workflow execution/orchestration layer.

It is not the primary source of truth for:

- Customer records.
- Invoice state.
- Payment state.
- Case state.
- Authorization.
- AI memory.

The application backend and database remain authoritative for business state.

---

# 3. Workflow Architecture

Intended architecture:

```text
                         ┌───────────────┐
                         │    Gemini     │
                         └───────┬───────┘
                                 ↓
                         ┌───────────────┐
                         │Decision Engine│
                         └───────┬───────┘
                                 ↓
                         ┌───────────────┐
                         │ Policy Engine │
                         └───────┬───────┘
                                 ↓
                              n8n
                ┌────────────────┼────────────────┐
                ↓                ↓                ↓
             Twilio           Twilio          Payment API
             Voice           WhatsApp            MOCK
                ↓                ↓                ↓
             Customer         Customer         Verification
                └────────────────┼────────────────┘
                                 ↓
                              Webhook
                                 ↓
                           FastAPI Backend
                                 ↓
                           Supabase/Cognee
                                 ↓
                         Re-evaluate Case
```

---

# 4. n8n Responsibilities

n8n may handle:

- Workflow orchestration.
- Calling Twilio.
- Sending WhatsApp messages.
- Receiving/processing supported webhook events.
- Scheduling workflow execution.
- Calling approved backend endpoints.
- Calling the mock payment API.
- Formatting integration requests.
- Routing success/failure paths.
- Retrying safe transient operations.

---

# 5. Responsibilities n8n Must NOT Own

n8n must not independently determine:

- Whether a customer owes money.
- Whether a payment is genuinely complete.
- Whether an AI action is permitted.
- Whether a customer should be contacted.
- Whether a dispute is resolved.
- Whether an action is authorized.

These decisions belong to the backend/policy architecture.

---

# 6. Workflow Types

The MVP should support these logical workflows:

```text
WF-001 Case Processing
WF-002 Text/WhatsApp Outreach
WF-003 Voice Call
WF-004 Customer Response
WF-005 Payment Verification
WF-006 Follow-Up
WF-007 Human Escalation
WF-008 Failure/Retry
WF-009 Memory Synchronization
```

The exact number of n8n workflows may differ from this logical model.

---

# 7. WF-001 — Case Processing

Purpose:

Start or resume autonomous processing for a collection case.

Flow:

```text
Trigger
  ↓
Load case
  ↓
Load authoritative context
  ↓
Retrieve relevant memory
  ↓
Call AI reasoning
  ↓
Structured decision
  ↓
Policy validation
  ↓
Execute next permitted action
```

---

# 8. Case Processing Trigger

Possible triggers:

- Merchant starts collections.
- New overdue case is detected.
- Customer responds.
- Payment event occurs.
- Follow-up becomes due.
- Human approval is received.
- Previous workflow requests re-evaluation.

The trigger must identify the relevant case.

---

# 9. Case Processing Idempotency

Every processing event should have an idempotency/event identifier.

Conceptual:

```text
event_id
case_id
event_type
created_at
```

If the same event is received again:

```text
Existing event
     ↓
Do not repeat unsafe side effect
```

---

# 10. WF-002 — WhatsApp/Text Outreach

Flow:

```text
Approved decision
      ↓
n8n
      ↓
Validate request
      ↓
Twilio WhatsApp
      ↓
Provider result
      ↓
Record result
```

The message must be generated from approved case context.

---

# 11. WhatsApp Message Boundary

The frontend must never send messages directly using Twilio credentials.

Correct:

```text
Frontend
  ↓
FastAPI
  ↓
Decision/Policy
  ↓
n8n
  ↓
Twilio
```

Incorrect:

```text
Frontend
  ↓
Twilio secret
  ↓
Customer
```

---

# 12. WhatsApp Trial Restrictions

The implementation must respect the current Twilio trial environment.

Before building the final workflow, verify:

- Recipient verification requirements.
- Sandbox requirements if used.
- Template requirements.
- Trial message limits.
- Current free-form messaging behavior.
- Customer response window behavior.

Do not assume unrestricted production WhatsApp access.

If the trial requires a specific template or sandbox flow, the workflow must use that supported path.

---

# 13. WF-003 — Voice Call

Conceptual flow:

```text
Approved CALL decision
        ↓
n8n
        ↓
Twilio Voice
        ↓
Customer answers
        ↓
Conversation begins
        ↓
Speech/audio processing
        ↓
Sarvam STT
        ↓
Gemini
        ↓
Sarvam TTS
        ↓
Twilio Voice
        ↓
Customer
```

The exact real-time voice implementation must be verified against the currently available Twilio and Sarvam APIs.

---

# 14. Voice Workflow Requirements

The voice workflow must:

- Initiate only approved calls.
- Associate the call with a case.
- Record call ID.
- Record start/end timestamps where available.
- Capture call outcome.
- Process customer responses.
- Handle hang-up.
- Handle no-answer.
- Handle technical failure.
- Prevent duplicate call execution.

---

# 15. Voice Call State

Suggested logical states:

```text
REQUESTED
INITIATED
RINGING
ANSWERED
IN_PROGRESS
COMPLETED
NO_ANSWER
BUSY
FAILED
CANCELLED
```

The final provider-compatible status mapping is TBD.

---

# 16. Voice Conversation Loop

Once a call is answered:

```text
Greeting
   ↓
Purpose
   ↓
Customer speech
   ↓
STT
   ↓
Conversation interpretation
   ↓
Gemini response
   ↓
TTS
   ↓
Customer
   ↓
Repeat
```

The loop must have an explicit termination condition.

---

# 17. Voice Termination Conditions

The conversation may terminate when:

- Customer confirms the relevant outcome.
- Customer requests human handling.
- Customer ends the call.
- Call fails.
- Conversation reaches a defined timeout.
- The agent cannot safely continue.
- The workflow reaches its configured turn/interaction limit.

Exact timeout and turn limits are TBD.

---

# 18. Voice Failure Handling

If the call cannot be established:

```text
CALL_FAILED
   ↓
Record failure
   ↓
Re-evaluate case
```

If speech recognition fails:

```text
STT_FAILED
   ↓
Retry if safe
   ↓
Alternative interaction / escalation
```

If TTS fails:

```text
TTS_FAILED
   ↓
Retry if safe
   ↓
Alternative interaction / escalation
```

No technical failure may be recorded as successful customer contact.

---

# 19. WF-004 — Customer Response

Customer response may originate from:

```text
WhatsApp
Voice
Future supported channel
```

Flow:

```text
Incoming event
      ↓
Webhook validation
      ↓
Identify case/customer
      ↓
Store event
      ↓
Interpret response
      ↓
Retrieve relevant memory
      ↓
Gemini reasoning
      ↓
Decision Engine
      ↓
Policy
      ↓
Next action
```

---

# 20. Webhook Validation

Incoming provider events must be validated before processing.

The system should verify, where supported:

- Provider signature/authentication.
- Event structure.
- Expected event type.
- Case/customer association.
- Idempotency.

Invalid events must be rejected or quarantined.

The exact Twilio signature-validation implementation must be verified against official documentation.

---

# 21. Customer-to-Case Association

Every incoming response should be associated with the correct case.

Possible identifiers:

```text
conversation_id
provider_message_id
provider_call_id
case_id
customer_id
```

The exact mapping must be finalized in the data model.

If association is ambiguous:

```text
Do not guess.
Escalate / quarantine.
```

---

# 22. WF-005 — Payment Verification

Purpose:

Verify whether an outstanding payment has actually been completed.

For the MVP, the payment service is:

```text
MOCK PAYMENT API
```

This must be clearly labelled as mocked in the product/demo.

Flow:

```text
Verification requested
      ↓
n8n
      ↓
Mock Payment API
      ↓
Payment result
      ↓
FastAPI
      ↓
Supabase update
      ↓
Case re-evaluation
```

---

# 23. Payment Result

Minimum logical results:

```text
PAID
NOT_PAID
UNKNOWN
ERROR
```

The exact API response schema is defined in the data-model/integration specifications.

---

# 24. Payment Verification Rules

The workflow must not:

- Treat customer text as payment proof.
- Mark payment successful without an authoritative result.
- Close a case because an LLM predicted payment.
- Retry indefinitely.
- Modify payment records outside an authorized backend operation.

---

# 25. WF-006 — Follow-Up

Follow-up workflow:

```text
Commitment recorded
      ↓
Follow-up scheduled
      ↓
Time becomes due
      ↓
Reload case
      ↓
Verify current payment state
      ↓
Re-evaluate
```

Important:

The workflow must not blindly execute the decision created when the commitment was first recorded.

---

# 26. Stale Follow-Up Protection

Example:

```text
Customer:
"I'll pay Friday."

Follow-up scheduled.

Before Friday:
Payment arrives.

Friday:
Follow-up workflow starts.

System:
Payment = PAID.

Result:
Do not contact customer.
```

The case must be re-read before customer contact.

---

# 27. WF-007 — Human Escalation

Flow:

```text
Escalation condition
      ↓
Create escalation
      ↓
Pause autonomous collection where required
      ↓
Attach context
      ↓
Notify/show human operator
      ↓
Human decision
```

The exact notification channel is TBD.

---

# 28. Escalation Payload

The human review record should include:

```text
case_id
customer
invoice
outstanding amount
current case state
conversation summary
customer intent
reason for escalation
previous actions
relevant memory
recommended next step
```

---

# 29. Human Approval Workflow

Where approval is required:

```text
AI proposal
    ↓
Policy
    ↓
Approval required
    ↓
Human review
    ├── APPROVE
    └── REJECT
```

Approval must be recorded.

The action should execute only after valid approval.

---

# 30. WF-008 — Failure and Retry

All external workflows should have explicit failure branches.

General pattern:

```text
Action
 ↓
Success ─────────→ Record success
 ↓
Failure
 ↓
Classify error
 ├── Transient
 ├── Permanent
 └── Unknown
 ↓
Retry if safe
 ↓
Escalate/mark failed if retry exhausted
```

---

# 31. Retry Classification

## Transient

Examples:

- Temporary provider timeout.
- Temporary network error.
- Temporary service unavailability.

Possible handling:

```text
Bounded retry
```

## Permanent

Examples:

- Invalid recipient.
- Invalid request.
- Unauthorized integration.
- Unsupported operation.

Handling:

```text
Do not repeatedly retry.
Record failure.
Re-evaluate/escalate.
```

## Unknown

If error classification is uncertain:

```text
Do not assume success.
Record unknown failure.
Use safe recovery.
```

---

# 32. Retry Safety

Only operations that are safe to repeat should be automatically retried.

Every side-effecting operation should have an idempotency strategy where supported.

Examples:

```text
send message
start call
record payment result
create follow-up
```

The implementation must define a unique key for each operation.

---

# 33. n8n Execution Tracking

Every workflow execution should be traceable to:

```text
workflow_id
execution_id
case_id
event_id
action_id
timestamp
status
error
```

The exact fields depend on the n8n integration.

---

# 34. Backend–n8n Contract

The backend should invoke n8n using a narrow contract.

Conceptual request:

```json
{
  "action_id": "ACT-001",
  "case_id": "CASE-001",
  "action": "CALL",
  "channel": "VOICE",
  "payload_reference": "REF-001",
  "idempotency_key": "CASE-001-ACT-001"
}
```

Do not send unrestricted internal database access or secrets.

The exact webhook/API contract is TBD.

---

# 35. n8n-to-Backend Callback

After execution:

```text
n8n
 ↓
Provider
 ↓
Result
 ↓
FastAPI callback
 ↓
Validate result
 ↓
Update database
```

The callback must not directly modify arbitrary application state.

---

# 36. Result Validation

Before accepting a workflow result, the backend should validate:

- Action ID.
- Case ID.
- Expected action.
- Provider status.
- Event ID.
- Idempotency key.
- Result schema.

A malformed result must not be treated as success.

---

# 37. External Event Loop

The complete autonomous workflow is event-driven:

```text
Decision
  ↓
Action
  ↓
External event
  ↓
Webhook
  ↓
Validate
  ↓
Persist
  ↓
Memory update
  ↓
Re-evaluate
  ↓
New decision
```

This is the central mechanism that allows the AI employee to continue working after its initial response.

---

# 38. Scheduled Workflow

A scheduler may trigger follow-ups.

Conceptual:

```text
Scheduled event
      ↓
Case reload
      ↓
Payment verification
      ↓
Policy validation
      ↓
Gemini decision
      ↓
Action
```

The scheduler must not assume that the case remains unchanged.

---

# 39. Case Lock / Processing Boundary

To prevent two workflows from acting on the same case simultaneously, the backend should use an appropriate concurrency-control mechanism.

Possible implementation approaches include:

- Database row/version checks.
- Transaction boundaries.
- Distributed lock where justified.

The final mechanism is TBD.

---

# 40. Workflow Cancellation

A pending workflow should be cancellable when the case becomes ineligible.

Example:

```text
CALL scheduled
     ↓
Customer pays
     ↓
Case becomes PAID
     ↓
Pending CALL invalidated
```

The workflow must check current state before execution.

---

# 41. Workflow Rollback

Not every external action can literally be rolled back.

Therefore the system should distinguish:

```text
REVERSIBLE
IRREVERSIBLE
COMPENSATABLE
```

Example:

A sent WhatsApp message may not be reversible.

The system should instead prevent invalid future actions and record the event.

The exact compensation strategy is TBD.

---

# 42. Workflow Audit

Every workflow should produce an audit trail containing, where applicable:

```text
event
decision
policy result
action
provider request reference
provider result
retry
failure
final outcome
```

Sensitive data should not be unnecessarily copied into logs.

---

# 43. Workflow Observability

Minimum operational metrics:

```text
workflow_success_rate
workflow_failure_rate
workflow_retry_rate
workflow_latency
twilio_call_success_rate
whatsapp_delivery_rate
payment_verification_success_rate
escalation_rate
```

Metrics should be measured during testing/demo where practical.

---

# 44. n8n Credentials

Credentials must be stored using secure n8n credential mechanisms or environment/secret configuration.

Never:

- Hard-code API keys in workflow nodes.
- Commit credentials to Git.
- Send credentials to the frontend.
- Put secrets into customer-facing messages.

---

# 45. Environment Separation

The project should distinguish:

```text
development
demo
production
```

At minimum, the demo environment should make mocked services explicit.

Example:

```text
PAYMENT_PROVIDER=mock
```

The system must never silently present mock behavior as a real financial integration.

---

# 46. Free-Tier Constraint

The prototype should operate within the available free resources as far as practical.

Current project assumptions include:

- Twilio free trial.
- n8n free trial.
- Cognee free tier.
- Supabase free tier.
- Gemini API Free Tier where eligible.
- Free/no-card hosting where technically compatible.
- Sarvam free/available access if an appropriate account/API plan is available.

These limits must be verified at implementation time.

---

# 47. Workflow Cost Guardrails

The application should prevent accidental runaway usage.

Examples:

```text
Maximum retry count
Maximum conversation turns
Maximum follow-up attempts
Maximum workflow executions per case
```

Exact limits are configuration decisions and remain TBD.

---

# 48. Demo Mode

The MVP should support a controlled demo environment.

Example:

```text
Demo merchant
     ↓
Synthetic overdue cases
     ↓
AI decision
     ↓
Real Twilio test communication
     ↓
Synthetic payment verification
```

The demo must clearly distinguish:

```text
REAL:
Communication through configured Twilio trial.

MOCKED:
Payment backend.

SYNTHETIC:
Customer/case data.
```

---

# 49. Recommended n8n Workflow Naming

Suggested names:

```text
AIWF - Case Processor
AIWF - WhatsApp Outreach
AIWF - Voice Call
AIWF - Customer Response
AIWF - Payment Verification
AIWF - Follow Up
AIWF - Human Escalation
AIWF - Error Handler
AIWF - Memory Sync
```

These are naming recommendations and may be changed.

---

# 50. Workflow Testing

Each workflow must be tested independently and end-to-end.

### Case Processor

- New case.
- Existing case.
- Already-paid case.
- Disputed case.

### WhatsApp

- Successful message.
- Trial restriction.
- Invalid recipient.
- Provider failure.
- Duplicate request.

### Voice

- Answered.
- No answer.
- Busy.
- Hang-up.
- STT failure.
- TTS failure.
- Provider failure.

### Payment

- PAID.
- NOT_PAID.
- UNKNOWN.
- ERROR.

### Follow-Up

- Payment received before follow-up.
- Payment still pending.
- Duplicate scheduler event.

### Escalation

- Human requested.
- Dispute.
- Low confidence.
- Approval required.

---

# 51. End-to-End Workflow Test

Required happy-path test:

```text
Create overdue case
       ↓
Agent starts
       ↓
AI chooses permitted outreach
       ↓
n8n executes
       ↓
Customer responds
       ↓
Response reaches backend
       ↓
Gemini interprets
       ↓
Customer commits to payment
       ↓
Follow-up created
       ↓
Payment verification
       ↓
Payment confirmed
       ↓
Case closed
       ↓
Memory updated
       ↓
Audit complete
```

---

# 52. End-to-End Dispute Test

```text
Overdue case
     ↓
Customer contacted
     ↓
Customer disputes invoice
     ↓
Intent detected
     ↓
Decision = ESCALATE
     ↓
Collection automation paused
     ↓
Human case created
     ↓
Context attached
```

---

# 53. End-to-End Failure Test

```text
AI chooses CALL
     ↓
Policy permits
     ↓
n8n starts
     ↓
Twilio fails
     ↓
Failure recorded
     ↓
No false contact success
     ↓
Retry if safe
     ↓
Re-evaluate
```

---

# 54. End-to-End Stale Action Test

```text
CALL scheduled
     ↓
Customer pays
     ↓
Payment event updates case
     ↓
CALL workflow begins
     ↓
Current state reloaded
     ↓
Case = PAID
     ↓
CALL cancelled/skipped
```

This test is mandatory because stale actions are a major autonomous-agent failure mode.

---

# 55. Workflow Security

The workflow architecture must protect:

- API credentials.
- Customer data.
- Webhooks.
- Provider callbacks.
- Internal APIs.
- Tenant boundaries.

Security requirements include:

```text
Authentication
Authorization
Webhook validation
Secret management
Input validation
Output validation
Tenant isolation
Audit logging
```

---

# 56. Workflow Completion Criteria

The workflow layer is complete when:

1. Backend can trigger approved n8n workflows.
2. n8n can execute Twilio actions.
3. Customer responses can return to the backend.
4. Payment verification works with the explicitly mocked API.
5. Follow-ups can be scheduled and revalidated.
6. Human escalation can be created.
7. Failures are classified and handled.
8. Duplicate execution is prevented.
9. Stale actions are prevented.
10. Workflow results are persisted.
11. All important execution paths are observable.
12. No credentials are exposed to the frontend.
13. The complete autonomous loop works end-to-end.

---

# 57. Open Questions

Before implementation, verify:

- Current n8n free-trial execution limits.
- Whether the chosen hosting environment can run the required n8n/backend components.
- Exact n8n webhook authentication strategy.
- Exact Twilio Voice implementation.
- Exact Twilio WhatsApp trial behavior.
- Sarvam STT/TTS API and streaming capabilities.
- Gemini API request/response contract.
- Payment mock API contract.
- Scheduler implementation.
- Retry mechanism.
- Concurrency mechanism.
- Human notification mechanism.
- Workflow result callback contract.

Do not silently assume unsupported capabilities.

---

# 58. Final Workflow Principle

The AI employee should not be:

```text
LLM → API
```

It should be:

```text
LLM
 ↓
Structured Decision
 ↓
Policy
 ↓
Permission
 ↓
n8n Workflow
 ↓
External System
 ↓
Verified Result
 ↓
Database
 ↓
Memory
 ↓
New Decision
```

n8n gives the AI employee the ability to **do work**.

The backend and policy layer ensure that it does that work **only when the action is valid, authorized, observable, and safe**.
