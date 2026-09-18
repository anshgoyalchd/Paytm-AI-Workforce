# Product Requirements Document

## Paytm AI Workforce — Autonomous AI Collections Agent

---

# 1. Document Purpose

This Product Requirements Document (PRD) defines the product requirements for the MVP of:

> **Paytm AI Workforce — Autonomous AI Collections Agent**

This document translates the project context into a concrete product definition.

It defines:

- Product vision.
- Problem statement.
- Users.
- Goals.
- Non-goals.
- Core use cases.
- MVP scope.
- Functional expectations.
- Non-functional expectations.
- Success metrics.
- Constraints.
- Assumptions that are explicitly allowed.
- Open decisions that must not be guessed.

Detailed technical requirements are defined separately in the remaining specification files.

---

# 2. Product Overview

## Product

**Paytm AI Workforce**

## MVP Employee

**Autonomous AI Collections Agent**

## Primary Job

Help a business recover pending payments by autonomously handling bounded collection workflows.

The agent should be able to move a collection case toward resolution without requiring a human to manually perform every step.

---

# 3. Product Vision

The long-term product vision is:

> Businesses should be able to delegate repetitive operational work to AI employees that can understand objectives, access relevant context, make bounded decisions, take actions, communicate with people, verify outcomes, remember what happened, and escalate exceptions to humans.

The MVP proves this concept through a collections workflow.

---

# 4. Problem Statement

Businesses may have many outstanding payments that require follow-up.

A typical manual process can involve:

```text
Find overdue payment
        ↓
Check customer information
        ↓
Check previous interaction
        ↓
Choose whether to contact
        ↓
Choose communication channel
        ↓
Contact customer
        ↓
Understand response
        ↓
Record outcome
        ↓
Schedule follow-up
        ↓
Check payment status
        ↓
Close or escalate case
```

This process can involve repetitive work and can require context to be maintained across multiple interactions.

The product aims to automate this workflow while keeping the AI bounded by deterministic policies and human escalation.

---

# 5. Target User

## Primary User

A business/merchant using the AI workforce product to manage outstanding customer payments.

The product should allow the merchant to delegate collection work to the AI employee while maintaining visibility into:

- Active work.
- Decisions.
- Customer interactions.
- Outcomes.
- Pending follow-ups.
- Escalations.
- Audit history.

---

# 6. Primary User Goal

The primary user goal is:

> "Recover my pending payments."

The user should not have to manually decide every individual customer action.

The AI employee should process eligible collection cases according to configured policies and available information.

---

# 7. Secondary User Goals

The merchant should also be able to:

- Understand which cases are being handled.
- See why the AI chose a particular action.
- Review customer conversations.
- See promised payment dates.
- See verified payments.
- Review escalations.
- Intervene when necessary.
- Review the agent's historical actions.
- Understand failures.

---

# 8. Product Principles

## 8.1 Outcome-Oriented

The agent should work toward an operational outcome rather than simply generating text.

## 8.2 Bounded Autonomy

The agent can act autonomously only within explicitly defined permissions and policies.

## 8.3 Human Escalation

The agent must stop and escalate when the case exceeds its authority or confidence.

## 8.4 Explainability

Important agent decisions should have understandable reason codes and supporting context.

## 8.5 Auditability

Important actions must be recorded.

## 8.6 No Fabrication

The system must never invent customer, invoice, payment, or conversation information.

## 8.7 Real Over Fake

A smaller real workflow is preferable to a larger fake workflow.

## 8.8 Free/No-Card MVP

The initial MVP must target ₹0 additional cost and must not require paid billing or a credit card.

---

# 9. MVP Scope

The MVP includes one AI employee:

# Autonomous AI Collections Agent

The agent should support the complete lifecycle of a collection case.

### Core lifecycle

```text
Case Identification
        ↓
Context Retrieval
        ↓
Memory Retrieval
        ↓
Case Analysis
        ↓
Action Decision
        ↓
Policy Validation
        ↓
Action Execution
        ↓
Customer Interaction
        ↓
Response Interpretation
        ↓
Payment Verification / Follow-up / Escalation
        ↓
Case Resolution
        ↓
Audit + Memory Update
```

---

# 10. Core Capabilities

The MVP must support the following capabilities.

## PRD-CAP-001 — Identify Collection Cases

The system must identify eligible overdue/pending payment cases from the transactional data source.

The system must distinguish eligible cases from cases that should not currently be acted upon.

---

## PRD-CAP-002 — Retrieve Business Context

Before making a decision, the agent should retrieve relevant structured information such as:

- Customer.
- Invoice.
- Amount.
- Due date.
- Current payment status.
- Current case status.
- Previous actions.

---

## PRD-CAP-003 — Retrieve AI Memory

The agent should retrieve relevant historical interaction information from the AI memory system.

Examples:

- Previous conversations.
- Previous payment commitments.
- Previous collection outcomes.
- Relevant customer interaction context.

Only relevant information should be used.

---

## PRD-CAP-004 — Choose Next Action

The agent must be capable of selecting a bounded next action.

Initial high-level actions:

```text
WAIT
TEXT
CALL
ESCALATE
```

The decision must be represented in structured form.

---

## PRD-CAP-005 — Explain Decision

The system should record a reason for the decision.

Example:

```text
Decision: CALL

Reason:
Customer has not responded to the previous message and
the case remains overdue.
```

The exact reason must be generated from actual available case/context data.

The system must not fabricate justification.

---

## PRD-CAP-006 — Policy Validation

Every external action must pass through deterministic policy validation.

The LLM must not directly execute external actions.

Expected sequence:

```text
AI Decision
    ↓
Schema Validation
    ↓
Policy Validation
    ↓
Permission Validation
    ↓
External Action
```

---

## PRD-CAP-007 — Customer Communication

The agent must be capable of communicating with customers through available supported channels.

The intended channels are:

- Voice.
- WhatsApp.

The exact channel selected must depend on the agent's decision and available system capabilities.

---

## PRD-CAP-008 — Natural Conversation

The voice experience should support natural customer responses.

The agent should understand intent rather than depend exclusively on fixed keywords.

Examples:

- Payment commitment.
- Already paid.
- Request for more time.
- Dispute.
- Unable to pay.
- Request for human assistance.
- Refusal.
- Unclear response.

---

## PRD-CAP-009 — Extract Payment Commitment

When a customer provides a payment commitment, the system should attempt to extract:

- Commitment intent.
- Promised date, if stated.
- Relevant context.

Example:

```text
Customer:
"I'll pay tomorrow."

Agent interpretation:
Payment commitment
Promised date: tomorrow
```

The extracted information must be validated before being stored or used to schedule an action.

---

## PRD-CAP-010 — Handle Already-Paid Claims

If a customer says:

> "I already paid."

The agent should stop inappropriate collection activity and initiate payment verification.

If payment is verified, the case should be updated accordingly.

If payment cannot be verified, the case should follow the defined policy rather than assuming either that the customer is correct or incorrect.

---

## PRD-CAP-011 — Handle Disputes

If the customer disputes the invoice/debt:

```text
Customer dispute
       ↓
Stop inappropriate collection
       ↓
Record dispute
       ↓
Escalate according to policy
```

The AI must not attempt to resolve matters beyond its permitted scope.

---

## PRD-CAP-012 — Handle Human Requests

If the customer requests a human:

```text
Customer requests human
        ↓
Stop autonomous flow where required
        ↓
Create escalation
        ↓
Provide relevant context
```

---

## PRD-CAP-013 — Payment Verification

The system must verify payment status through the available payment-verification interface.

For the prototype, this may be a clearly labelled mocked payment API.

The agent must not claim payment was received without a verification result.

---

## PRD-CAP-014 — Follow-Up Scheduling

If a customer commits to paying later, the system should create a follow-up according to the configured workflow.

The follow-up should contain enough information to identify:

- Collection case.
- Customer.
- Reason.
- Scheduled time/date.
- Expected next action.

---

## PRD-CAP-015 — Escalation

The system must support escalation to a human.

An escalation should include relevant case context so the human does not need to reconstruct the interaction from scratch.

---

## PRD-CAP-016 — Audit Trail

Important events must be recorded.

Examples:

- Case created.
- Case selected.
- Context retrieved.
- Memory retrieved.
- AI decision generated.
- Policy evaluated.
- Call initiated.
- Message sent.
- Customer response received.
- Payment verification performed.
- Follow-up created.
- Escalation created.
- Case closed.

---

## PRD-CAP-017 — Memory Update

After meaningful interactions, the system should store useful information for future context retrieval.

Examples:

- Customer commitment.
- Conversation outcome.
- Dispute.
- Communication result.
- Follow-up outcome.

Memory should not replace transactional records.

---

# 11. Decision Model

The agent should be able to choose between:

| Decision | Meaning |
|---|---|
| `WAIT` | Do not contact or act yet |
| `TEXT` | Use the available messaging channel |
| `CALL` | Attempt a voice interaction |
| `ESCALATE` | Stop autonomous handling and involve a human |

These are high-level decisions.

The detailed decision engine is defined in:

`07-decision-engine.md`

---

# 12. Voice Requirements

Voice is an important MVP capability.

The intended architecture is:

```text
Twilio Voice
     ↓
Speech
     ↓
Sarvam STT
     ↓
Gemini
     ↓
Sarvam TTS
     ↓
Twilio Voice
```

The exact implementation must depend on verified API capabilities.

The system should handle:

- Customer speech.
- Silence.
- Unclear speech.
- Call termination.
- Customer interruption where technically supported.
- Language variation where technically supported.
- Requests for human assistance.
- Payment commitments.
- Disputes.
- Already-paid claims.

---

# 13. WhatsApp Requirements

WhatsApp is intended as an available messaging channel through Twilio.

The current Twilio trial has restrictions.

The MVP must use only functionality actually available under the account.

The system must not assume arbitrary outbound custom WhatsApp messaging.

If a trial template is required, the workflow must use an approved template.

---

# 14. AI Requirements

The primary AI provider direction is:

**Gemini API**

The exact Gemini model remains a technical decision that must be verified before implementation.

The AI must support the project's required structured reasoning and conversational capabilities.

The application should use structured outputs for important decisions wherever supported.

---

# 15. Memory Requirements

The intended AI memory system is:

**Cognee Cloud**

The memory system should help answer questions such as:

- What happened with this customer previously?
- Did the customer make a previous commitment?
- What was the outcome of the previous interaction?
- Is there relevant historical context?

The transactional database remains the source of truth.

---

# 16. Workflow Requirements

The intended workflow automation system is:

**n8n**

n8n should execute repeatable workflows rather than being used merely as a visual diagram.

Potential workflows:

1. Collection start.
2. Communication execution.
3. Customer response processing.
4. Follow-up scheduling.
5. Payment verification.
6. Escalation.
7. Failure recovery.

Detailed workflow specifications are defined in:

`09-workflow-spec.md`

---

# 17. Data Requirements

The product requires structured entities including:

- Merchant.
- Customer.
- Invoice.
- Collection case.
- Conversation.
- Message.
- Call.
- Agent decision.
- Agent action.
- Payment.
- Follow-up.
- Escalation.
- Policy.
- Audit log.
- Memory reference.

The exact database design is defined in:

`11-data-model.md`

---

# 18. UI Requirements

The merchant should have visibility into the AI employee's work.

The product should provide interfaces for:

- Workforce overview.
- Collections cases.
- Active work.
- Customer case details.
- Conversation transcript.
- Decision explanation.
- Escalations.
- Human approvals where applicable.
- Audit timeline.
- Configuration/settings.

The UI must not imply that an action occurred when the backend has no evidence of execution.

---

# 19. Customer Case View

A customer case should provide a consolidated view of:

```text
Customer
   ↓
Outstanding invoice
   ↓
Collection status
   ↓
Previous interactions
   ↓
AI decisions
   ↓
Actions
   ↓
Responses
   ↓
Payment verification
   ↓
Follow-ups
   ↓
Escalations
   ↓
Audit timeline
```

---

# 20. Decision Transparency

For important decisions, the UI should show concise, understandable information.

Example:

```text
NEXT ACTION
Call customer

WHY
Previous WhatsApp outreach received no response
and the collection case remains overdue.

POLICY
Allowed

CONFIDENCE
Verified against application threshold

STATUS
Ready to execute
```

The displayed explanation must correspond to actual recorded decision data.

---

# 21. Human Approval

The system must support human approval where a configured policy requires it.

The AI must not bypass an approval requirement.

Approval records should include:

- Case.
- Requested action.
- Reason.
- Request timestamp.
- Approver.
- Approval/rejection.
- Result.

---

# 22. Safety Requirements

The product must include safeguards against:

- Invalid AI output.
- Unauthorized external actions.
- Excessive customer contact.
- Duplicate actions.
- Unverified payment claims.
- Unhandled disputes.
- Prompt injection.
- Integration failures.
- Incorrect state transitions.

Detailed safety requirements are defined in:

`13-security-and-safety.md`

---

# 23. Reliability Requirements

The product should have explicit handling for:

- API failures.
- Timeouts.
- Rate limits.
- Duplicate webhooks.
- Duplicate requests.
- Partial workflow completion.
- Failed calls.
- Failed messages.
- Payment verification failures.
- AI response failures.

A failed action must be distinguishable from a successful action.

---

# 24. Idempotency

Actions that can be retried must be designed to avoid unintended duplicates.

Example:

If a webhook is delivered twice, the system must not send two identical collection messages solely because the webhook was duplicated.

Idempotency requirements must be defined technically in the workflow and backend specifications.

---

# 25. Authentication and Authorization

The product must authenticate users before allowing access to business data.

Actions must be authorized according to the user's role and permissions.

The exact role model is defined in the security specification.

---

# 26. Cost Requirements

The MVP target is:

> **₹0 additional cost and no credit card requirement.**

The project may use free/trial services.

The following are currently intended:

- Gemini API Free Tier where eligible.
- Twilio trial.
- Sarvam free/available access where eligible.
- Cognee Cloud free access where eligible.
- n8n trial/free access.
- Supabase free tier.
- Free hosting where technically suitable.

Exact limits must be verified.

If a required capability cannot operate within the available free resources, mark it:

`BLOCKED`

and record it in:

`QUESTIONS.md`

---

# 27. Hosting Requirements

Frontend hosting should use a suitable free service where possible.

Cloudflare Pages is a candidate for the frontend.

Backend hosting is:

**TBD**

The backend hosting decision must be made based on:

- Free/no-card availability.
- FastAPI compatibility.
- Deployment reliability.
- Required networking.
- Webhook support.
- Project demonstration requirements.

---

# 28. Non-Goals

The following are NOT required for the MVP:

## 28.1 Multiple AI Employees

Only the Collections Agent is required.

## 28.2 Private Paytm Integration

Private Paytm APIs must not be assumed.

## 28.3 Production Payment Processing

The MVP is not a payment gateway.

## 28.4 Nationwide Production Deployment

The MVP is a functional prototype.

## 28.5 Unlimited Communication

The MVP is constrained by available free/trial communication resources.

## 28.6 Complete CRM

A CRM may be represented only to the extent needed for the collection workflow.

## 28.7 Model Training

The MVP does not require training a new AI model.

## 28.8 Automatic Model Retraining

The workflow does not retrain Gemini.

## 28.9 Unrestricted Autonomous Financial Decisions

The agent must operate within explicitly defined policies.

---

# 29. Demo Requirements

The final demo should demonstrate an actual autonomous workflow.

A representative scenario:

```text
1. Merchant opens AI Workforce.
2. Merchant sees overdue cases.
3. Agent selects an eligible case.
4. Agent retrieves customer/invoice context.
5. Agent retrieves relevant memory.
6. Agent decides CALL/TEXT/WAIT/ESCALATE.
7. Policy engine validates the decision.
8. Communication workflow executes.
9. Customer responds.
10. AI interprets the response.
11. Agent determines the next step.
12. Payment status is verified where applicable.
13. Follow-up or escalation is created if necessary.
14. Case state changes.
15. Audit timeline records the workflow.
16. Useful memory is updated.
```

The exact demo scenario should be selected after the integrations are verified.

---

# 30. Success Metrics

The following metrics should be used to evaluate the prototype.

## 30.1 Task Completion

Percentage of defined demo scenarios that reach their intended final state.

## 30.2 Decision Validity

Percentage of AI decisions that conform to the defined structured schema and policy rules.

## 30.3 Action Reliability

Percentage of requested external actions that receive a confirmed execution result.

## 30.4 State Consistency

Percentage of test scenarios where database state correctly reflects the actual workflow outcome.

## 30.5 Escalation Correctness

Percentage of defined escalation scenarios in which the agent correctly stops autonomous execution and creates an escalation.

## 30.6 Memory Retrieval

Percentage of memory test scenarios where the relevant stored context is retrieved correctly.

## 30.7 End-to-End Success

Percentage of acceptance scenarios that successfully complete:

```text
Decision
→ Validation
→ Action
→ Response
→ Interpretation
→ Next action
→ Final state
```

The exact numerical targets are to be established in `14-testing-and-acceptance.md`.

Do not invent benchmark results before testing.

---

# 31. Acceptance Philosophy

The product should be judged by behavior rather than appearance.

A feature is not considered complete because:

- Its button exists.
- Its API endpoint exists.
- A mock response is displayed.
- The UI shows a success message.
- Gemini produced a plausible answer.

A feature is complete only when its required behavior has been tested.

---

# 32. Real vs Mocked Status

At all times, the project documentation should clearly identify whether an integration is:

- `REAL`
- `MOCKED`
- `BLOCKED`
- `NOT IMPLEMENTED`
- `VERIFIED`

No mock may be presented as a real Paytm service.

---

# 33. Open Product Decisions

The following remain subject to verification or explicit decision:

### PRD-OPEN-001 — Gemini Model

The exact Gemini API model to use.

### PRD-OPEN-002 — Sarvam APIs

The exact APIs and capabilities available under the project account.

### PRD-OPEN-003 — Voice Architecture

The exact implementation for low-latency conversational voice and interruption handling.

### PRD-OPEN-004 — Backend Hosting

The final free/no-card hosting provider.

### PRD-OPEN-005 — Policy Thresholds

Specific operational thresholds must be explicitly defined rather than invented during coding.

These questions belong in:

`QUESTIONS.md`

---

# 34. Requirements Traceability

Every important product capability must map to a detailed requirement.

The implementation should maintain traceability such as:

```text
PRD capability
      ↓
Functional requirement
      ↓
Implementation
      ↓
Test
      ↓
Evidence
```

A capability without a corresponding test should not be marked fully complete.

---

# 35. Product Completion Criteria

The MVP can be considered complete only when:

1. The agent can identify an eligible collection case.
2. Relevant transactional context can be retrieved.
3. Relevant memory can be retrieved.
4. The agent can produce a structured decision.
5. The policy engine validates the decision.
6. At least one real communication path works end-to-end within the available free/trial constraints.
7. Customer responses can be processed.
8. The agent can determine a subsequent action.
9. Payment verification works through the available real or explicitly mocked interface.
10. Follow-ups work where required.
11. Escalation works where required.
12. Important actions are audited.
13. Relevant memory is updated.
14. Failure scenarios are handled.
15. Acceptance tests pass.

---

# 36. Final Product Requirement

The central requirement of the MVP is:

> **The Autonomous AI Collections Agent must demonstrate that an AI employee can take responsibility for a bounded business workflow and move a collection case toward resolution through real actions, while remaining observable, auditable, policy-constrained, and capable of escalating to a human.**

The product must optimize for:

**Real execution + bounded autonomy + reliability + explainability + measurable outcomes**

and not merely:

**LLM conversation + attractive UI.**
