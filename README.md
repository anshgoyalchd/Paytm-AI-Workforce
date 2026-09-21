# Paytm AI Workforce

## Autonomous AI Collections Agent

> A fully functional autonomous AI employee that helps businesses recover pending payments by understanding cases, remembering customer context, choosing the appropriate communication channel, communicating with customers, verifying outcomes, scheduling follow-ups, and escalating cases when required.

## ☁️ 1-Click Cloud Deployment

| Component | Platform | Deployment Action |
| :--- | :--- | :--- |
| **Backend API** | Render | [![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/anshgoyalchd/Paytm-AI-Workforce) |
| **Frontend UI** | Cloudflare Pages | [Deploy on Cloudflare Pages](https://dash.cloudflare.com/?to=/:account/pages/new) (Connect GitHub repo `anshgoyalchd/Paytm-AI-Workforce`, set root to `frontend`) |

---

## ⚡ Quickstart & Execution Guide

### Prerequisites
- Python 3.10+ (Verified on Python 3.12)
- Node.js 18+ (Verified on Node v24)

### 1. Start the Backend API
```bash
# Install dependencies
pip install -r backend/requirements.txt

# Seed initial database with synthetic merchant (Raj Electronics), customers, and invoices
python -m database.seed.demo_data

# Start FastAPI server on port 8000
python -m uvicorn backend.app.main:app --reload --port 8000
```
- API Docs (Swagger): `http://localhost:8000/docs`
- Health Check: `http://localhost:8000/health`

### 2. Start the Frontend Command Center
```bash
cd frontend
npm install
npm run dev
```
- Open `http://localhost:5173` in your browser.
- Demo Login: `operator@rajelectronics.com` / `Password123!` (or Manager: `manager@rajelectronics.com`)

### 3. Run Full Test Suite (31 Tests Passing)
```bash
python -m pytest tests/
```
Covers:
- All 24 Acceptance Scenarios (`tests/e2e/test_acceptance_scenarios.py`)
- Full REST API Integration (`tests/integration/test_api_endpoints.py`)
- Autonomous Employee Loop (`tests/unit/test_collections_agent.py`)
- Deterministic Policy Engine (`tests/unit/test_policy_engine.py`)
- State Machine Transitions & Guards (`tests/unit/test_state_machine.py`)

---

# 1. Project Status

**Project:** Paytm AI Workforce  
**MVP:** Autonomous AI Collections Agent  
**Hackathon Track:** Track 3 — Build AI teammates that don't just respond; they get the job done.

This project is a hackathon prototype intended to demonstrate a real, working autonomous AI employee.

The MVP must demonstrate an actual end-to-end workflow rather than a simulated chatbot or a collection of static UI screens.

---

# 2. Core Product Idea

A business gives the AI employee a goal such as:

> "Recover my pending payments."

The AI employee should be able to:

1. Identify relevant overdue payment cases.
2. Retrieve customer and business context.
3. Retrieve relevant historical memory.
4. Determine what action should happen next.
5. Decide whether to:
   - WAIT
   - TEXT
   - CALL
   - ESCALATE
6. Contact the customer using an appropriate communication channel.
7. Understand the customer's response.
8. Conduct a natural conversation.
9. Detect important intents such as:
   - Payment commitment
   - Already paid
   - Payment dispute
   - Invoice dispute
   - Request for more time
   - Unable to pay
   - Request for human assistance
   - Refusal
   - Unknown/uncertain response
10. Verify payment status through the available payment-verification mechanism.
11. Schedule a follow-up when appropriate.
12. Escalate cases that require human intervention.
13. Record the complete action and outcome.
14. Store useful memory for future interactions.

The core autonomous loop is:

**Understand → Remember → Decide → Act → Verify → Escalate → Learn**

---

# 3. Product Philosophy

This project is NOT intended to be:

- A generic chatbot.
- A simple CRM dashboard.
- A static analytics dashboard.
- A basic RAG application.
- A UI prototype with fake buttons.
- A workflow where every decision is hardcoded.
- A system that pretends mocked integrations are real.
- A system that claims an action succeeded when it was never actually executed.

The product must demonstrate an AI employee that can actually perform work.

---

# 4. Definition of "Working"

A feature is considered implemented only when the complete required flow works.

For an external action, the expected pattern is:

**Request → External System → Real Response → Result Handling → Logging → Verification**

Example:

```text
AI decides to call customer
        ↓
Policy validation
        ↓
n8n workflow
        ↓
Twilio
        ↓
Real call attempt
        ↓
Customer response / call result
        ↓
Speech processing if applicable
        ↓
AI interpretation
        ↓
Action/outcome recorded
        ↓
Follow-up / verification / escalation
```

A UI element that only changes state locally does NOT count as a completed implementation.

---

# 5. Real vs Mocked Components

The system must clearly distinguish between real and mocked components.

## 5.1 Intended Real Components

The following are intended to use real services where technically and freely possible:

- Gemini API
- Twilio Voice
- Twilio WhatsApp
- Sarvam
- n8n
- Cognee Cloud
- Supabase
- Frontend hosting

Exact API availability, credentials, and free-tier capabilities must be verified before implementation.

---

## 5.2 Mocked Components

Payment verification may initially use a controlled mock payment API because private Paytm/payment APIs cannot be assumed to be available.

Any mocked payment functionality must be explicitly labelled:

> MOCKED

The application must never represent a mocked API as a real Paytm API.

---

# 6. Current Technology Direction

The current proposed architecture is:

```text
                    Merchant
                       │
                       ▼
                React Frontend
                       │
                       ▼
                 FastAPI Backend
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
   Supabase         Cognee         Gemini API
   PostgreSQL       Memory         AI Reasoning
        │              │              │
        └──────────────┼──────────────┘
                       │
                       ▼
              AI Collections Agent
                       │
                       ▼
                 Policy Engine
                       │
             ┌─────────┼─────────┐
             │         │         │
             ▼         ▼         ▼
           WAIT       n8n      HUMAN
                       │
             ┌─────────┴─────────┐
             │                   │
             ▼                   ▼
        Twilio Voice       Twilio WhatsApp
             │                   │
             └─────────┬─────────┘
                       │
                       ▼
                    Customer
                       │
                       ▼
                Customer Response
                       │
                       ▼
                 AI Agent Again
                       │
             ┌─────────┴─────────┐
             ▼                   ▼
          Cognee             Supabase
          Memory            Transaction Data
```

This architecture is a working direction, not permission to invent unavailable APIs or capabilities.

If an integration cannot be implemented exactly as specified because an external service does not support the required functionality, development must stop at that integration point and the issue must be recorded in `docs/QUESTIONS.md`.

---

# 7. AI Model

## Primary AI Provider

**Google Gemini API**

The Gemini API must be accessed using an API key stored securely on the backend.

The Google AI Pro subscription and Gemini API access must be treated as separate concepts.

The project should initially target the Gemini API Free Tier and must not enable paid billing without explicit approval.

At the time this specification was written, Google's official documentation states that the Gemini Developer API has a Free tier with limited access to certain models and free input/output tokens. Paid access requires billing configuration. The exact model used by the project must be verified during implementation rather than assumed.

Official documentation:

- Gemini API Getting Started: https://ai.google.dev/gemini-api/docs/get-started
- Gemini API Pricing: https://ai.google.dev/gemini-api/docs/pricing
- Gemini API Rate Limits: https://ai.google.dev/gemini-api/docs/rate-limits

Do not hardcode a model name until it has been verified against the current Gemini API documentation and tested for the capabilities required by this project.

---

# 8. AI Responsibilities

Gemini may be used for:

- Natural-language understanding.
- Customer intent detection.
- Conversation generation.
- Contextual reasoning.
- Structured decision generation.
- Tool selection where appropriate.
- Follow-up reasoning.
- Summarizing conversations.
- Extracting commitments and dates.
- Detecting uncertainty.
- Producing structured agent decisions.

Gemini must NOT have unrestricted authority to execute external actions.

All external actions must pass through deterministic application logic and policy validation.

---

# 9. Sarvam Responsibilities

Sarvam is intended to provide Indian-language voice capabilities where supported by its APIs.

Potential responsibilities include:

- Speech-to-text.
- Indian-language processing.
- Text-to-speech.

The exact Sarvam API, model, endpoint, authentication method, supported languages, and free-tier availability must be verified before implementation.

Do not invent Sarvam endpoints or request formats.

---

# 10. Twilio Responsibilities

Twilio is intended for:

- Real telephone calls.
- WhatsApp messaging.

The project currently has access to a Twilio trial account.

The current Twilio documentation states that its trial includes product-specific free units, including 75 voice minutes and 100 WhatsApp messages, and that trial accounts do not require a credit card. Trial accounts also have restrictions such as verified recipients and predefined WhatsApp content. These limits must be respected and rechecked during implementation.

For the trial:

- Calls/messages can only be made to verified recipients.
- Up to five recipients can be verified.
- Voice calls are restricted to the sign-up country.
- WhatsApp trial messaging uses Twilio-provided/pre-approved templates.
- Trial accounts expire after 30 days.

Sources:

- https://www.twilio.com/docs/usage/trials
- https://www.twilio.com/docs/usage/trials/try-out-voice
- https://www.twilio.com/docs/usage/trials/try-out-whatsapp

Twilio credentials must never be exposed in the frontend.

---

# 11. n8n Responsibilities

n8n is the workflow execution layer.

It should be responsible for orchestration such as:

- Triggering communication.
- Calling Twilio.
- Processing external events.
- Scheduling follow-ups.
- Handling retries.
- Calling payment verification.
- Sending results back to the backend/agent.
- Executing deterministic workflow steps.

n8n must not become the sole location of business logic.

Critical business decisions must remain understandable and testable in the application.

The available n8n access is currently a trial/free development environment. Exact limits must be verified before implementation.

---

# 12. Cognee Responsibilities

Cognee Cloud is intended to provide persistent AI memory.

Memory may include information such as:

- Previous customer interactions.
- Previous collection outcomes.
- Customer communication preferences when legitimately available.
- Promised payment dates.
- Previous disputes.
- Relevant historical context.
- Conversation summaries.
- Outcomes of previous actions.

Cognee must not become the transactional source of truth.

Supabase remains the transactional source of truth.

The exact Cognee Cloud plan and current free-tier limits must be verified before implementation.

---

# 13. Supabase Responsibilities

Supabase PostgreSQL is intended to store structured application data.

Examples include:

- Merchants.
- Customers.
- Invoices.
- Collection cases.
- Conversations.
- Messages.
- Calls.
- Agent decisions.
- Agent actions.
- Payments.
- Follow-ups.
- Escalations.
- Policies.
- Audit logs.
- Integration events.

The exact schema is defined separately in:

`docs/11-data-model.md`

---

# 14. Frontend

The frontend is expected to use React.

The UI should represent a serious B2B AI workforce product rather than a generic chatbot.

Expected areas include:

- Authentication.
- Workforce home.
- Collections dashboard.
- Active cases.
- Customer case details.
- Active call.
- Conversation transcript.
- AI decision explanation.
- Approval center.
- Escalation center.
- Audit timeline.
- Settings.

The complete UI specification is defined in:

`docs/12-ui-ux-design.md`

---

# 15. Backend

The current backend direction is:

**Python + FastAPI**

The backend should:

- Authenticate users.
- Expose application APIs.
- Manage business logic.
- Coordinate the AI agent.
- Validate AI outputs.
- Enforce policies.
- Access Supabase.
- Access Cognee.
- Trigger n8n workflows.
- Process integration callbacks.
- Maintain audit logs.
- Prevent unauthorized external actions.

The backend must not expose secret API keys to the browser.

The final hosting provider is currently **TBD** and must not be assumed until compatibility and free-tier requirements are verified.

---

# 16. Autonomous Agent

The MVP contains one fully implemented AI employee:

# Autonomous AI Collections Agent

The agent must be capable of:

```text
Receive Goal
     ↓
Identify Cases
     ↓
Retrieve Context
     ↓
Retrieve Memory
     ↓
Analyze Case
     ↓
Choose Action
     ↓
Validate Policy
     ↓
Execute Action
     ↓
Observe Result
     ↓
Interpret Result
     ↓
Verify Outcome
     ↓
Update Memory
     ↓
Continue / Follow-up / Escalate / Close
```

The agent should not simply generate a recommendation and stop.

The objective is to demonstrate autonomous task completion.

---

# 17. Communication Channels

## Voice

Primary rich communication channel for the MVP.

Expected flow:

```text
Customer
   ↓
Twilio Voice
   ↓
Speech
   ↓
Sarvam STT
   ↓
Agent
   ↓
Gemini
   ↓
Sarvam TTS
   ↓
Twilio Voice
   ↓
Customer
```

The voice agent should handle natural conversation rather than reading a rigid script.

It should support situations such as:

- "I'll pay tomorrow."
- "I already paid."
- "Give me one more week."
- "I don't recognize this invoice."
- "I cannot pay right now."
- "Let me speak to a person."
- Silence.
- Call failure.
- Unclear speech.
- Customer interruption.

The exact implementation of real-time conversational voice, interruptions, and streaming must be verified against the capabilities of the selected APIs before being declared implemented.

---

## WhatsApp

WhatsApp is intended as a secondary communication channel.

Twilio trial restrictions must be respected.

The application must not assume arbitrary outbound WhatsApp messaging is available on the trial account.

For the current trial environment, Twilio documents predefined/pre-approved WhatsApp templates and verified recipients.

Therefore, the WhatsApp portion of the MVP must be designed around the actual trial capabilities rather than assuming unrestricted custom outbound messaging.

---

# 18. Action Types

The agent's high-level action space is:

```text
WAIT
TEXT
CALL
ESCALATE
```

Additional internal actions may exist, but every externally meaningful action must be explicitly represented and logged.

Examples:

```text
CALL_CUSTOMER
SEND_WHATSAPP
SCHEDULE_FOLLOW_UP
VERIFY_PAYMENT
ESCALATE_TO_HUMAN
CLOSE_CASE
```

---

# 19. Policy Engine

The LLM must not directly execute external actions.

The flow must be:

```text
Gemini Decision
      ↓
Structured Validation
      ↓
Policy Engine
      ↓
Permission Check
      ↓
Action
```

The policy engine should enforce rules such as:

- Whether the action is permitted.
- Whether customer contact is currently allowed.
- Whether the contact frequency limit has been reached.
- Whether the case is disputed.
- Whether the AI confidence is sufficient.
- Whether required information is missing.
- Whether the action is idempotent.
- Whether the customer requested human assistance.
- Whether the action must be stopped.

Specific policy thresholds must be defined in the relevant specification files and must not be invented during coding.

---

# 20. Human Escalation

The AI employee must be able to stop autonomous execution and escalate.

Escalation should occur when appropriate, including situations such as:

- Customer disputes the debt.
- Customer disputes the invoice.
- Customer requests human assistance.
- Agent confidence is insufficient.
- Required information is missing.
- Policy prohibits autonomous action.
- Payment verification is ambiguous.
- External integration repeatedly fails.
- The customer reports an issue that requires investigation.

The exact escalation rules are defined in the agent, policy, and safety specifications.

---

# 21. Auditability

Every important AI action must be traceable.

The system should record:

- What happened.
- When it happened.
- Which case was affected.
- Which decision was made.
- Why the decision was made.
- Which policy was evaluated.
- Which external action was attempted.
- External result.
- Final outcome.
- Whether a human approved the action.

The system must not claim an action happened without evidence that the action was actually executed.

---

# 22. Security Requirements

At minimum:

- Secrets must be stored in environment variables.
- API keys must never be committed to Git.
- API keys must never be sent to the frontend.
- External webhook requests must be validated.
- Database access must be authenticated.
- AI outputs must be validated before execution.
- Tool permissions must be restricted.
- User input must be treated as untrusted.
- Prompt injection must be considered.
- External actions must be auditable.
- Duplicate actions must be prevented where possible.
- Retries must be idempotent.
- Customer data must be minimized.

Complete requirements are defined in:

`docs/13-security-and-safety.md`

---

# 23. Free Infrastructure Constraint

The project has a strict development requirement:

> **No paid service should be required for the MVP.**

The initial target is:

**₹0 additional cost / no credit card requirement.**

This applies to:

- AI API.
- Database.
- Memory.
- Workflow automation.
- Voice.
- WhatsApp.
- Hosting.

Free/trial services may have limitations.

Those limitations must not be hidden.

If a required feature cannot operate within the available free tier, the implementation must be marked:

`BLOCKED`

and recorded in:

`docs/QUESTIONS.md`

Do not silently introduce a paid alternative.

---

# 24. No Assumptions Rule

This is a critical project rule.

Antigravity must NOT assume:

- Private Paytm APIs exist.
- Paytm credentials exist.
- Private merchant data exists.
- Twilio trial capabilities beyond documented limits.
- Sarvam API access before credentials are provided.
- Unlimited free API usage.
- Unlimited Gemini API usage.
- Unlimited Cognee usage.
- Unlimited n8n execution.
- A particular hosting provider without verification.
- An undocumented API endpoint.
- An undocumented request format.
- An undocumented response format.
- An undocumented authentication method.

If something is unknown:

**ASK.**

Do not guess.

---

# 25. No Hallucinated Integrations

Before implementing an external integration:

1. Verify the official documentation.
2. Verify authentication requirements.
3. Verify endpoint availability.
4. Verify request format.
5. Verify response format.
6. Verify relevant free/trial limitations.
7. Verify required permissions.
8. Record the integration status.
9. Implement only what has been verified.

If documentation cannot be verified, do not invent the integration.

---

# 26. Mocking Rules

Mocks are allowed when a real integration is unavailable.

However:

1. The mock must be clearly labelled.
2. The mock must have a documented interface.
3. The mock must behave predictably.
4. The application must know whether it is using a mock.
5. The UI must not misleadingly display a mock as a real external action.
6. The documentation must state that it is mocked.
7. Replacing the mock with the real service should be possible without rewriting the entire application.

---

# 27. Development Order

Antigravity must follow this general order:

```text
1. Read all documentation
        ↓
2. Identify contradictions
        ↓
3. Identify unanswered questions
        ↓
4. Update QUESTIONS.md
        ↓
5. Verify external integrations
        ↓
6. Propose implementation plan
        ↓
7. Wait for approval where required
        ↓
8. Create project structure
        ↓
9. Implement database
        ↓
10. Implement backend
        ↓
11. Implement AI agent
        ↓
12. Implement policy engine
        ↓
13. Implement Cognee memory
        ↓
14. Implement n8n workflows
        ↓
15. Implement Twilio
        ↓
16. Implement Sarvam
        ↓
17. Implement frontend
        ↓
18. Connect complete end-to-end flow
        ↓
19. Run acceptance tests
        ↓
20. Fix failures
        ↓
21. Only then mark MVP complete
```

This order may be adjusted when technically necessary, but changes must be documented.

---

# 28. Required Documentation Files

The project specification is divided into:

```text
docs/
├── 01-project-context.md
├── 02-prd.md
├── 03-product-requirements.md
├── 04-user-flows.md
├── 05-agent-spec.md
├── 06-conversation-spec.md
├── 07-decision-engine.md
├── 08-memory-spec.md
├── 09-workflow-spec.md
├── 10-integrations.md
├── 11-data-model.md
├── 12-ui-ux-design.md
├── 13-security-and-safety.md
├── 14-testing-and-acceptance.md
├── 15-development-rules.md
├── 16-free-infrastructure.md
└── QUESTIONS.md
```

Every file must be read before implementation begins.

---

# 29. Definition of Done

The MVP is NOT complete merely because:

- The frontend loads.
- The dashboard looks good.
- Gemini generates text.
- A chatbot responds.
- A Twilio button exists.
- n8n workflows exist.
- Mock data exists.
- An API returns HTTP 200.
- A demo video works.

The MVP is complete only when the defined acceptance tests demonstrate the intended end-to-end behavior.

At minimum, the final demonstration should show:

```text
Merchant
   ↓
Pending payment case
   ↓
AI retrieves context
   ↓
AI makes a decision
   ↓
Policy validation
   ↓
Real communication action
   ↓
Customer responds
   ↓
AI understands response
   ↓
Agent takes next action
   ↓
Payment/outcome verification
   ↓
Case updated
   ↓
Memory updated
   ↓
Audit trail recorded
```

---

# 30. Failure Handling

The system must gracefully handle:

- Gemini API failure.
- Sarvam API failure.
- Twilio failure.
- n8n failure.
- Cognee failure.
- Supabase failure.
- Customer does not answer.
- Customer hangs up.
- Invalid customer response.
- Duplicate webhook.
- Duplicate action.
- Payment verification failure.
- Timeout.
- Rate limit.
- Invalid AI output.

Failures must not silently disappear.

---

# 31. Status Vocabulary

Use only these statuses when describing implementation state:

- `PLANNED`
- `IN_PROGRESS`
- `IMPLEMENTED`
- `TESTED`
- `BLOCKED`
- `FAILED`
- `NOT_IMPLEMENTED`
- `MOCKED`
- `VERIFIED`

Do not describe something as "fully working" unless it has been tested.

---

# 32. Questions and Unknowns

All unresolved implementation decisions must be maintained in:

`docs/QUESTIONS.md`

Each question should include:

```text
Question ID
Question
Why it matters
Options
Current status
Required decision
```

Antigravity should stop only the affected implementation when an unanswered question blocks it.

It must not make up an answer.

---

# 33. Important Instruction to Antigravity

Before writing application code:

**READ EVERY FILE IN `docs/`.**

Then:

1. Build a requirements matrix.
2. Identify missing information.
3. Identify contradictions.
4. Identify external integrations that require verification.
5. Update `QUESTIONS.md`.
6. Propose an implementation plan.
7. Do not silently resolve important unanswered questions.
8. Do not invent APIs.
9. Do not invent credentials.
10. Do not invent free-tier capabilities.
11. Do not create fake functionality.
12. Do not mark features complete without testing.

---

# 34. Product Success Principle

The goal is not to demonstrate that an LLM can chat.

The goal is to demonstrate that an AI employee can:

> **Understand a business goal, make bounded decisions, perform real work, interact with people, verify outcomes, remember what happened, and safely continue or escalate the task.**

---

# 35. Source of Truth

When requirements conflict:

1. Explicit user decisions.
2. Official hackathon specification.
3. Official third-party API documentation.
4. Project specification files.
5. Existing implementation.

Do not resolve conflicts by guessing.

Record unresolved conflicts in `docs/QUESTIONS.md`.

---

# 36. Final Rule

## DO NOT ASSUME.

## DO NOT INVENT.

## DO NOT HALLUCINATE.

## DO NOT FAKE COMPLETION.

## ASK WHEN INFORMATION IS REQUIRED.

## VERIFY EXTERNAL SERVICES BEFORE IMPLEMENTING THEM.

## TEST REAL END-TO-END BEHAVIOR BEFORE CALLING IT COMPLETE.
