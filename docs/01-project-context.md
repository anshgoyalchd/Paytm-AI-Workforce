# Project Context

## 1. Purpose of This Document

This document establishes the fixed context for the Paytm AI Workforce project.

It explains:

- What the project is.
- Which hackathon track it targets.
- What problem the project addresses.
- What the MVP actually contains.
- How the product should be positioned.
- How the sponsor technologies fit into the solution.
- What is explicitly in scope and out of scope.
- Which assumptions are prohibited.

This document provides context only.

Detailed functional requirements are defined in:

- `02-prd.md`
- `03-product-requirements.md`
- `04-user-flows.md`
- `05-agent-spec.md`
- `07-decision-engine.md`
- `09-workflow-spec.md`

---

# 2. Project Name

## Paytm AI Workforce

### MVP Employee

## Autonomous AI Collections Agent

The product is envisioned as a new AI workforce capability that can perform operational work for businesses.

The MVP focuses on one specific employee:

> **An autonomous AI employee that helps businesses recover pending payments.**

The project must not attempt to build multiple fully functional AI employees during the MVP.

Other AI employees may be described as future extensions, but they must not be represented as implemented functionality unless they actually exist and pass the project's acceptance tests.

---

# 3. Hackathon Context

This project is being developed for the Paytm Build for India AI Hackathon — Delhi Edition.

The selected direction is:

## Track 3 — Build AI teammates that don't just respond; they get the job done.

The central interpretation of this track is that the AI should perform work rather than merely provide conversational responses.

The project therefore focuses on an autonomous agent that can:

```text
Understand a goal
      ↓
Inspect relevant business information
      ↓
Remember previous context
      ↓
Make a bounded decision
      ↓
Execute an action
      ↓
Observe the result
      ↓
Verify the outcome
      ↓
Continue / follow up / escalate
```

The product should demonstrate this complete loop.

---

# 4. Product Positioning

The product should be positioned as an:

> **AI workforce / AI employee for business operations**

rather than as:

- A chatbot.
- A generic AI assistant.
- A dashboard.
- A simple automation.
- A static RAG system.

The distinction is important.

A chatbot primarily responds to requests.

An AI employee should be able to receive a business objective and perform a sequence of bounded actions toward that objective.

For this MVP:

```text
Business Goal:
"Recover my pending payments."

AI Employee:
Autonomous AI Collections Agent
```

---

# 5. Core Problem

Businesses can have customers with:

- Outstanding invoices.
- Pending payments.
- Missed payment commitments.
- Previous collection conversations.
- Payment disputes.
- Requests for additional time.
- Unclear payment status.

Traditional collection processes can require people to repeatedly:

1. Identify overdue cases.
2. Check customer history.
3. Decide whom to contact.
4. Choose a communication channel.
5. Contact the customer.
6. Understand the response.
7. Record the outcome.
8. Schedule another follow-up.
9. Verify whether payment was received.
10. Escalate exceptional cases.

The MVP aims to demonstrate that an AI employee can perform this operational loop within defined permissions and safety boundaries.

---

# 6. Product Goal

The primary product goal is:

> Enable a business to delegate a bounded collections workflow to an autonomous AI employee while retaining visibility, control, auditability, and human escalation.

The agent should be capable of working through a collection case rather than stopping after generating a recommendation.

---

# 7. Core Autonomous Loop

The product is built around:

## Understand → Remember → Decide → Act → Verify → Escalate → Learn

### Understand

Understand:

- The business objective.
- The collection case.
- Customer information.
- Invoice/payment information.
- Current case state.
- Customer's latest response.

### Remember

Retrieve relevant information from previous interactions and stored memory.

### Decide

Determine the next appropriate action.

Possible high-level outcomes:

- `WAIT`
- `TEXT`
- `CALL`
- `ESCALATE`

### Act

Perform the approved action through the appropriate system.

Examples:

- Send a message.
- Initiate a call.
- Schedule a follow-up.
- Verify payment.
- Escalate to a human.

### Verify

Determine whether the action produced the intended result.

Examples:

- Customer committed to a payment date.
- Customer stated that payment was already made.
- Payment verification confirms payment.
- Customer disputed the invoice.
- Customer requested human intervention.

### Escalate

Stop autonomous execution when the case falls outside the agent's permitted scope or requires human handling.

### Learn

Store useful outcomes and interaction context for future decisions.

"Learn" here means updating persistent application/AI memory. It does not imply that the model itself is retrained during the workflow.

---

# 8. MVP Scope

The MVP is the:

## Autonomous AI Collections Agent

The MVP should support a complete collection lifecycle for synthetic/demo business data.

The expected lifecycle is:

```text
Overdue Case
     ↓
Context Retrieval
     ↓
Memory Retrieval
     ↓
AI Decision
     ↓
Policy Validation
     ↓
Communication
     ↓
Customer Response
     ↓
Response Interpretation
     ↓
Next Decision
     ↓
Payment Verification / Follow-up / Escalation
     ↓
Case Resolution
     ↓
Audit + Memory
```

---

# 9. Customer Communication

Communication is a core part of the MVP.

The agent should be able to determine whether communication should happen through an available channel.

The primary rich communication experience is intended to be:

## Voice

The customer can receive a real telephone call through Twilio.

The voice interaction is intended to use Sarvam for speech processing where supported and Gemini for reasoning/conversation generation.

The intended conceptual flow is:

```text
Customer Speech
      ↓
Speech-to-Text
      ↓
AI Agent
      ↓
Intent / Context / Decision
      ↓
Generated Response
      ↓
Text-to-Speech
      ↓
Customer
```

The exact technical implementation must be based on verified capabilities of the selected APIs.

---

# 10. Natural Conversation Requirement

The voice agent should not behave like a rigid IVR script.

It should be capable of understanding natural customer statements such as:

> "I'll make the payment tomorrow."

> "I already paid this."

> "Give me another week."

> "I don't know anything about this invoice."

> "I can't pay right now."

> "I want to talk to someone."

The agent should extract relevant meaning from the customer's response and determine the next permitted action.

It must not invent information that is not available in the case context.

---

# 11. Communication Examples

## Payment Commitment

Customer:

> "I'll pay tomorrow."

Expected conceptual behavior:

```text
Detect payment commitment
        ↓
Extract promised date
        ↓
Validate extracted information
        ↓
Record commitment
        ↓
Schedule appropriate follow-up
        ↓
Later verify payment
```

---

## Already Paid

Customer:

> "I already paid."

Expected conceptual behavior:

```text
Detect payment claim
        ↓
Stop collection attempt
        ↓
Verify payment status
        ↓
If payment confirmed:
        Close/update case
If payment not found:
        Handle according to defined policy
```

The agent must not accuse the customer of lying merely because payment is not immediately found.

---

## Dispute

Customer:

> "This invoice is wrong."

Expected conceptual behavior:

```text
Detect dispute
        ↓
Stop inappropriate collection action
        ↓
Record dispute
        ↓
Escalate according to policy
```

---

## Human Request

Customer:

> "I want to speak to a person."

Expected conceptual behavior:

```text
Detect human-assistance request
        ↓
Stop autonomous collection activity where required
        ↓
Create escalation
        ↓
Provide case context to human
```

---

# 12. Sponsor Technology Context

The project intends to meaningfully use the hackathon sponsor technologies.

The sponsor technologies are not decorative integrations.

Each should have a defined role in the system.

---

# 13. Sarvam

Sarvam is intended to support Indian-language voice interaction.

Potential responsibilities:

- Speech-to-text.
- Text-to-speech.
- Indian-language speech capabilities.

The exact APIs and capabilities must be verified before implementation.

Sarvam should contribute to making the voice interaction practical for Indian customers rather than merely being listed as a sponsor integration.

If a required Sarvam capability is unavailable under the available account/free constraints, the limitation must be documented rather than simulated without disclosure.

---

# 14. Cognee

Cognee is intended to provide persistent AI memory.

The agent should be able to remember relevant previous context.

For example:

```text
Previous interaction:
Customer promised payment on Friday.

Later interaction:
Agent retrieves that commitment.
```

Memory should help the agent make better contextual decisions.

Cognee is not the transactional database.

The transactional source of truth is Supabase.

---

# 15. n8n

n8n is intended to execute and orchestrate workflows.

Examples include:

- Starting a communication workflow.
- Calling Twilio.
- Handling communication callbacks/events.
- Scheduling follow-ups.
- Triggering payment verification.
- Handling retries.
- Returning workflow results to the application.

n8n should demonstrate actual workflow automation.

It should not merely appear in the architecture diagram.

---

# 16. Gemini

Gemini is intended to provide the primary AI reasoning and language-generation capability.

Potential responsibilities:

- Understanding customer language.
- Extracting structured information.
- Classifying customer intent.
- Reasoning over case context.
- Selecting a bounded action.
- Generating natural responses.
- Summarizing interactions.
- Identifying uncertainty.
- Producing structured agent decisions.

Gemini should operate within explicit application constraints.

It should not have unrestricted permission to call external systems.

---

# 17. Twilio

Twilio is intended to provide real communication infrastructure.

Primary uses:

- Voice calls.
- WhatsApp messaging.

The current project has a Twilio trial account.

The trial account's restrictions must be respected.

The initial MVP should prioritize the communication path that can demonstrate the strongest real end-to-end experience within the available trial limits.

No unlimited or paid usage should be assumed.

---

# 18. Supabase

Supabase is intended to provide the application's transactional database.

It should store structured operational state such as:

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
- Audit log.

The database must remain authoritative for transactional state.

---

# 19. Paytm Relationship

The product is conceptually designed as a new Paytm-adoptable product/capability.

It does not need to be an extension of an existing Paytm application screen or publicly documented Paytm API.

The project must NOT assume access to private Paytm systems.

If Paytm-specific APIs or internal data are not publicly available for the prototype, synthetic data and clearly labelled mock interfaces may be used.

The project must never claim that a mocked interface is an actual private Paytm API.

---

# 20. Synthetic Data

Synthetic data may be used for the demonstration.

Examples may include:

```text
Merchant:
Raj Electronics

Customer:
Rahul Sharma

Invoice:
INV-001

Outstanding Amount:
Synthetic/demo value

Due Date:
Synthetic/demo value
```

All such data must be treated as demonstration data.

The project must not imply that the named individuals, businesses, invoices, or amounts are real Paytm customers or real Paytm records.

---

# 21. Customer Simulation

The prototype should support a controlled customer simulation so the complete workflow can be demonstrated without depending on real customers.

Possible simulated responses include:

- "I'll pay tomorrow."
- "I already paid."
- "Give me another week."
- "I don't recognize this invoice."
- "I cannot pay right now."
- "Let me talk to a person."
- Custom text response.
- Voice response where supported.

The simulator must be clearly identified as a demo/synthetic environment.

---

# 22. Human-in-the-Loop Philosophy

Autonomy does not mean unrestricted autonomy.

The agent must operate within boundaries.

The system should provide:

- Policy validation.
- Permission boundaries.
- Confidence checks.
- Audit logs.
- Human escalation.
- Approval where required.
- Failure handling.
- Idempotency.
- Rollback or safe stopping where applicable.

The AI employee should know when it should not continue autonomously.

---

# 23. What the AI Must Not Do

The agent must not:

- Invent invoice details.
- Invent payment status.
- Invent customer information.
- Invent previous conversations.
- Promise actions it cannot perform.
- Claim a call was completed if it failed.
- Claim a payment was received without verification.
- Ignore a customer dispute.
- Ignore a request for human assistance.
- Execute an action that violates application policy.
- Expose private credentials.
- Treat mock services as real services.
- Bypass deterministic validation.
- Continue indefinitely when an integration is failing.
- Create duplicate external actions because of retries.

---

# 24. Security Context

The product handles business and customer-related information.

Therefore:

- Secrets must remain server-side.
- External actions must be authenticated.
- Customer data must be minimized.
- AI-generated outputs must be validated.
- Webhooks must be protected.
- External tools must have limited permissions.
- Actions must be auditable.
- Prompt injection must be considered.
- Duplicate actions must be prevented.

Detailed security requirements are defined in:

`13-security-and-safety.md`

---

# 25. Cost Context

The current product requirement is:

## ₹0 additional cost / no credit card

This is a development constraint.

The project intends to use:

- Gemini API Free Tier where eligible.
- Twilio trial resources.
- Sarvam free/available access if eligible.
- Cognee Cloud free access if eligible.
- n8n trial/free access.
- Supabase free tier.
- Free hosting where compatible.

These services may have changing limits.

Current limits must always be verified from official documentation before implementation.

If a required capability requires payment, it must be marked as blocked rather than silently adding a paid dependency.

---

# 26. Hosting Context

The frontend is intended to be deployed using a free hosting option such as Cloudflare Pages if technically appropriate.

The backend hosting provider is currently:

**TBD**

Antigravity must not assume that a particular backend hosting provider is free, suitable, or compatible.

The hosting decision must be verified before deployment.

---

# 27. Development Environment

The development environment is:

**Windows**

Development instructions should therefore work on Windows unless a documented reason requires another environment.

Commands should preferably have Windows-compatible alternatives where relevant.

---

# 28. Team Size

The product architecture, requirements, scalability, security model, and technical decisions must NOT depend on the number of developers working on the project.

Do not hardcode team size, individual responsibilities, or team-member names into the application architecture.

Team composition is not a product requirement.

---

# 29. Scalability Context

The prototype should be architected so that it can conceptually scale beyond the demo.

However, scalability claims must be supported by the actual architecture.

Do not claim production-scale capacity without testing or evidence.

The prototype should avoid unnecessary architectural complexity while preserving clear boundaries between:

- Frontend.
- Backend.
- Agent.
- Policy engine.
- Database.
- Memory.
- Workflow automation.
- External communication.
- Payment verification.

---

# 30. Reliability Context

The system should be designed around the principle:

> **AI proposes; deterministic systems validate; authorized systems execute; the result is recorded.**

This reduces the risk of an LLM directly causing unintended external actions.

The agent should produce structured decisions.

The application should validate those decisions.

Only permitted actions should reach external systems.

---

# 31. Observability Context

The system should make it possible to understand:

- What the agent decided.
- Why it decided it.
- Which data/context was used.
- Which policy was applied.
- What action was executed.
- What the external system returned.
- What happened next.

This is important for:

- Debugging.
- Demonstrations.
- Safety.
- Human oversight.
- Acceptance testing.

---

# 32. MVP Boundary

The MVP is successful if one autonomous collections employee works end-to-end.

It is NOT necessary to build:

- A complete Paytm merchant ecosystem.
- Multiple AI employees.
- A full banking platform.
- A complete lending platform.
- A complete insurance platform.
- Production-grade nationwide collections infrastructure.
- Every possible communication channel.

The MVP should focus on depth of execution rather than breadth of unrelated features.

---

# 33. Future Expansion

After the Collections Agent is proven, the same workforce architecture could theoretically support other AI employees.

Examples may include:

- Sales follow-up employee.
- Customer support employee.
- Invoice reconciliation employee.
- Merchant operations employee.
- Appointment follow-up employee.
- Business finance operations employee.

These are future concepts only.

They are not part of the current MVP unless separately implemented and tested.

---

# 34. Critical Unknowns

The following must remain explicit until verified:

### AI model

The exact Gemini model used for production-like execution is:

**TBD**

It must be selected after checking:

- Free-tier availability.
- Tool/function calling support if required.
- Structured output support if required.
- Context capacity.
- Latency.
- Quality for the intended workflow.

### Sarvam

The exact Sarvam APIs and account availability are:

**TBD**

### Backend hosting

The final backend hosting provider is:

**TBD**

### Paytm APIs

Private Paytm APIs are:

**NOT ASSUMED AVAILABLE**

A mock interface may be used where required.

---

# 35. Decision-Making Principle

Whenever there is a choice between:

```text
Fast demo
```

and

```text
Fake functionality
```

choose:

```text
Real, smaller functionality
```

Whenever there is a choice between:

```text
Assumption
```

and

```text
Explicit unknown
```

choose:

```text
Explicit unknown
```

Whenever there is a choice between:

```text
LLM-only decision
```

and

```text
LLM + deterministic validation
```

choose:

```text
LLM + deterministic validation
```

---

# 36. Required Product Character

The final product should feel like:

> **A real AI employee working inside a business.**

The user should be able to see:

```text
What work exists
        ↓
What the AI is working on
        ↓
What it remembered
        ↓
What it decided
        ↓
What it did
        ↓
What happened
        ↓
What it will do next
```

The product should make autonomous work visible and understandable.

---

# 37. Relationship to Other Specification Files

This document establishes context.

The following documents define the implementation details:

| File | Purpose |
|---|---|
| `02-prd.md` | Product requirements document |
| `03-product-requirements.md` | Detailed functional/non-functional requirements |
| `04-user-flows.md` | End-to-end user and agent flows |
| `05-agent-spec.md` | AI employee specification |
| `06-conversation-spec.md` | Conversation and voice behavior |
| `07-decision-engine.md` | Decision logic and policy boundaries |
| `08-memory-spec.md` | Cognee memory design |
| `09-workflow-spec.md` | n8n workflow definitions |
| `10-integrations.md` | External integration specifications |
| `11-data-model.md` | Database schema |
| `12-ui-ux-design.md` | UI/UX specification |
| `13-security-and-safety.md` | Security and safety requirements |
| `14-testing-and-acceptance.md` | Acceptance tests |
| `15-development-rules.md` | Development constitution/rules |
| `16-free-infrastructure.md` | Free/no-card infrastructure rules |
| `QUESTIONS.md` | Open questions and unresolved decisions |

---

# 38. Final Context Rule

The product is an:

> **Autonomous AI Collections Employee**

not a chatbot.

The MVP must demonstrate:

**Understand → Remember → Decide → Act → Verify → Escalate → Learn**

All autonomy must remain bounded by:

**Policies → Permissions → Validation → Auditability → Human Escalation**

When information is missing:

**Do not guess.**

When an API is unknown:

**Do not invent it.**

When a feature is not actually working:

**Do not mark it complete.**

When a real service cannot be used within the project's free/no-card constraint:

**Mark it BLOCKED and record it in `QUESTIONS.md`.**
