# Free Infrastructure and Deployment Specification

## Paytm AI Workforce — Autonomous AI Collections Agent

---

# 1. Purpose

This document defines the infrastructure strategy for building and demonstrating the Autonomous AI Collections Agent while prioritizing:

- Free services.
- No mandatory credit card.
- No unexpected paid usage.
- Simple deployment.
- Easy local development.
- Replaceable providers.
- Clear real-vs-mocked boundaries.
- Sufficient reliability for the hackathon prototype.

The infrastructure described here is a target architecture.

Provider availability, quotas, pricing, and free-tier conditions must be verified before implementation because they can change.

---

# 2. Non-Negotiable Infrastructure Constraint

The MVP should use:

```text
FREE / NO-CARD where a viable option exists
```

Do not introduce a paid dependency without explicit approval.

Do not enable:

```text
Pay-as-you-go billing
Automatic paid upgrades
Credit-card-backed spending
```

without explicit user approval.

---

# 3. Important Free-Tier Principle

A free plan does not mean:

```text
Unlimited
Permanent
Production-grade
Guaranteed available
```

The implementation must respect actual provider limits.

---

# 4. Target Infrastructure

```text
                    ┌─────────────────┐
                    │    Merchant     │
                    └────────┬────────┘
                             ↓
                    ┌─────────────────┐
                    │ React Frontend  │
                    │ Cloudflare Pages│
                    └────────┬────────┘
                             ↓
                    ┌─────────────────┐
                    │ FastAPI Backend │
                    └────────┬────────┘
                             │
       ┌─────────────────────┼─────────────────────┐
       ↓                     ↓                     ↓
┌──────────────┐      ┌──────────────┐      ┌──────────────┐
│  Supabase    │      │    Gemini    │      │   Cognee     │
│ Transactional│      │ AI Reasoning │      │ AI Memory    │
│ Source Truth │      └──────────────┘      └──────────────┘
└──────────────┘
                             │
                             ↓
                    ┌─────────────────┐
                    │       n8n       │
                    │    Workflows    │
                    └───────┬─────────┘
                            │
                 ┌──────────┴──────────┐
                 ↓                     ↓
          ┌──────────────┐      ┌──────────────┐
          │Twilio Voice  │      │Twilio WhatsApp│
          └──────────────┘      └──────────────┘

                    ┌─────────────────┐
                    │ Mock Payment API│
                    │   DEMO ONLY     │
                    └─────────────────┘
```

---

# 5. Infrastructure Responsibilities

| Component | Responsibility |
|---|---|
| React | Merchant UI |
| Cloudflare Pages | Frontend hosting target |
| FastAPI | Backend/API/authorization/orchestration |
| Supabase | Transactional database |
| Gemini | AI reasoning |
| Cognee | AI memory |
| n8n | Workflow execution |
| Twilio Voice | Phone communication |
| Twilio WhatsApp | WhatsApp communication |
| Sarvam | Speech/language capabilities |
| Payment Mock | Synthetic payment verification |

---

# 6. Frontend Hosting

Target:

```text
Cloudflare Pages
```

Use it for:

```text
React frontend
```

Advantages for the prototype:

- Static frontend hosting.
- Git-based deployment option.
- Suitable for React builds.
- Avoids putting provider secrets in the browser.

The exact current free-tier limits must be verified before deployment.

---

# 7. Frontend Deployment

Recommended flow:

```text
GitHub
 ↓
Cloudflare Pages
 ↓
React build
 ↓
Deployed frontend
```

Environment-specific API configuration should point to the backend.

---

# 8. Frontend Environment Variables

Only public configuration may be exposed.

Example:

```text
VITE_API_BASE_URL
```

Do not expose:

```text
GEMINI_API_KEY
SARVAM_API_KEY
TWILIO_AUTH_TOKEN
COGNEE_API_KEY
N8N_SECRET
SUPABASE_SERVICE_ROLE_KEY
```

---

# 9. Backend Hosting

Backend hosting is:

```text
TBD
```

The final provider must satisfy:

```text
Free/no-card requirement
Python/FastAPI support
HTTPS
Webhook accessibility
Reasonable runtime limits
Environment variables/secrets
```

Do not select a backend host solely based on a free marketing tier.

---

# 10. Backend Hosting Verification

Before committing to a provider verify:

```text
Current free plan
Card requirement
Sleep/cold-start behavior
Monthly runtime
Bandwidth
CPU/RAM
HTTPS
Custom domain support if required
Webhook accessibility
Environment variables
Deployment method
```

---

# 11. Alternative Backend Strategy

If a traditional free Python host does not satisfy requirements, evaluate another architecture.

Possible options are:

```text
Serverless functions
Cloudflare Workers-compatible backend
Other verified free hosting
Local backend + tunnel for demo
```

The final choice is:

```text
TBD
```

until compatibility is tested.

---

# 12. Local Backend Fallback

For hackathon development, the backend must work locally even if cloud hosting is unavailable.

Example:

```text
Windows
 ↓
Python
 ↓
FastAPI
 ↓
localhost
```

---

# 13. Public Webhook Requirement

Twilio and other external providers require a reachable callback endpoint for relevant webhook flows.

Local development can use a verified tunneling mechanism if required.

Do not assume a tunnel is always available or free.

The exact tunnel solution is:

```text
TBD
```

---

# 14. Database

Target:

```text
Supabase PostgreSQL
```

Use it as:

```text
Transactional source of truth
```

It stores:

- Merchants.
- Users.
- Customers.
- Invoices.
- Collection cases.
- Conversations.
- Messages.
- Decisions.
- Actions.
- Commitments.
- Payment verification.
- Escalations.
- Audit events.
- Workflow events.

---

# 15. Database vs Memory

Do not use Cognee as the primary transactional database.

Use:

```text
Supabase
→ authoritative structured state

Cognee
→ contextual AI memory
```

---

# 16. Supabase Free-Tier Awareness

The project should verify the current free plan before deployment.

Potential constraints may include:

```text
Database size
Storage
Egress
Authentication usage
Project inactivity/pausing
```

Do not assume these limits are permanent.

---

# 17. Database Activity

If the project database pauses due to provider inactivity rules:

```text
Application health check
 ↓
Detect unavailable database
 ↓
Show service unavailable state
```

Do not represent unavailable data as empty data.

---

# 18. Database Backups

The free infrastructure plan must not assume unlimited managed backups.

For hackathon development:

```text
Schema → source controlled
Seed data → source controlled
Migrations → source controlled
```

A backup/export procedure should be documented if supported by the selected database plan.

---

# 19. Gemini

Gemini is the primary AI reasoning candidate.

Responsibilities:

```text
Intent understanding
Context reasoning
Decision proposal
Conversation generation
Commitment extraction
Ambiguity handling
```

---

# 20. Gemini API Cost Rule

The user's Google AI Pro subscription must not be treated as automatic unlimited Gemini API access.

The implementation must verify:

```text
API access
Selected model
Free-tier eligibility
Rate limits
Usage limits
Structured output support
Tool/function-calling support if required
```

before implementation.

---

# 21. Gemini Paid Billing

Do not enable paid Gemini API billing automatically.

If free-tier limits are insufficient:

```text
Stop
 ↓
Document limitation
 ↓
Ask for approval
```

Do not silently incur charges.

---

# 22. Gemini Model Selection

The exact model is:

```text
TBD
```

Choose based on verified:

```text
Free-tier availability
Latency
Structured output
Tool calling
Reasoning quality
Context limits
Reliability
```

Do not select a model solely because its name is newer.

---

# 23. Sarvam

Sarvam is intended for Indian-language and speech capabilities.

Potential responsibilities:

```text
Speech-to-text
Indian-language processing
Text-to-speech
```

Only capabilities actually verified in the current API should be implemented.

---

# 24. Sarvam Account

Before implementation:

```text
Create/verify Sarvam account
Obtain API credentials
Verify available APIs
Verify current free access/limits
```

The project must not assume free access until verified.

---

# 25. Sarvam Voice Verification

Before claiming real-time natural calling, verify:

```text
STT latency
TTS latency
Streaming support
Audio formats
Authentication
Concurrency
Language support
```

If any required capability is unavailable:

```text
Do not fake it.
```

---

# 26. Twilio

Twilio provides communication infrastructure.

Use:

```text
Twilio Voice
Twilio WhatsApp
```

for real test communication where the account and trial rules permit.

---

# 27. Twilio Trial

The user's current trial resources should be treated as limited test capacity.

The implementation must verify the account's current:

```text
Voice allowance
WhatsApp allowance
Verified recipients
Trial restrictions
```

before final demo planning.

---

# 28. Twilio Credentials

Keep credentials server-side.

Example:

```text
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
```

must never reach the frontend.

---

# 29. Twilio Voice Architecture

Target:

```text
Customer
 ↓
Twilio Voice
 ↓
Voice processing
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

Exact real-time implementation must be verified.

---

# 30. Twilio WhatsApp Architecture

Target:

```text
Agent
 ↓
n8n
 ↓
Twilio WhatsApp
 ↓
Customer
 ↓
Customer response
 ↓
Twilio webhook
 ↓
n8n/FastAPI
 ↓
Agent
```

---

# 31. WhatsApp Trial Constraints

During trial/testing, WhatsApp may impose recipient/template/sandbox restrictions.

Therefore:

```text
Do not design the MVP around unrestricted production WhatsApp behavior.
```

The exact current restrictions must be checked against the active Twilio account.

---

# 32. n8n

n8n is the workflow execution layer.

Responsibilities:

```text
Communication workflows
Webhook processing
Scheduling
Retries
Provider orchestration
Workflow branching
```

---

# 33. n8n Free Trial

The current account is a temporary n8n free trial.

The implementation should not assume the trial continues indefinitely.

Export workflows regularly.

---

# 34. n8n Portability

Workflows should be exportable and reproducible.

Keep workflow definitions under:

```text
n8n/
```

where practical.

Do not make the application dependent on undocumented manual node configuration.

---

# 35. n8n Credentials

Use n8n's supported credential mechanisms.

Do not hard-code secrets in workflow JSON or code.

---

# 36. n8n vs Backend

Use this boundary:

```text
Backend:
Business truth
Authorization
Policy
Case state

n8n:
Workflow execution
External orchestration
Communication
Scheduling
Retries
```

---

# 37. Cognee

Cognee is the AI memory layer.

Use it for:

```text
Relevant historical context
Conversation memory
Customer interaction memory
Commitments
Outcomes
Escalation context
```

Do not store hidden chain-of-thought.

---

# 38. Cognee Free Plan

The project should use the free plan only if its current limits support the prototype.

Verify:

```text
Current token allowance
Workspace restrictions
API access
Retention
Data handling
```

before relying on it.

---

# 39. Cognee Failure Strategy

If Cognee is temporarily unavailable:

```text
Do not fabricate memory.
```

The system may continue only when enough authoritative/current context exists.

Otherwise:

```text
Escalate
```

or safely delay the action.

---

# 40. Supabase + Cognee Synchronization

Preferred flow:

```text
Transactional event
 ↓
Supabase update
 ↓
Memory event
 ↓
Cognee update
```

Supabase remains authoritative.

---

# 41. Mock Payment API

The MVP does not require a real financial/payment provider.

Use:

```text
Mock Payment API
```

for:

```text
PAID
NOT_PAID
PENDING
UNKNOWN
ERROR
```

---

# 42. Mock Payment API Rules

The mock service must be clearly labelled.

Example:

```text
MOCK PAYMENT VERIFICATION
```

The system must never imply that it processed a real payment.

---

# 43. Mock Payment API Implementation

It can be implemented as:

```text
FastAPI route
```

or another simple backend component.

Example:

```text
GET /mock/payments/{invoice_id}
```

Exact route is implementation-defined.

---

# 44. Mock Payment Data

Example:

```text
INV-1001 → NOT_PAID
INV-1002 → PAID
INV-1003 → PENDING
```

Use deterministic test fixtures.

---

# 45. Authentication Infrastructure

Preferred candidate:

```text
Supabase Auth
```

if it satisfies the application requirements and current free-tier constraints.

Otherwise:

```text
TBD
```

---

# 46. Domain and HTTPS

External webhooks should use HTTPS.

Frontend:

```text
Cloudflare Pages HTTPS
```

Backend:

```text
HTTPS required for public deployment
```

Local HTTP is acceptable only for local development where provider requirements allow a tunnel/proxy.

---

# 47. Custom Domain

Custom domain is optional for the MVP.

Do not purchase a domain solely for the hackathon unless explicitly desired.

---

# 48. GitHub

GitHub should be used for:

```text
Source control
Issues/tasks where useful
Deployment integration
Documentation
n8n workflow exports
Database migrations
```

Never commit secrets.

---

# 49. Repository Structure

Target:

```text
paytm-ai-workforce/
├── README.md
├── .env.example
├── docs/
├── frontend/
├── backend/
├── n8n/
├── database/
├── tests/
└── scripts/
```

---

# 50. Infrastructure Environment Variables

A central `.env.example` should document required configuration.

Potential categories:

```text
Application
Database
Authentication
Gemini
Sarvam
Twilio
Cognee
n8n
Demo
```

---

# 51. Environment Separation

Use separate configuration for:

```text
local
test
demo
```

At minimum, test credentials must not be accidentally replaced by production credentials.

---

# 52. Production Credentials

Production credentials are not required for the hackathon MVP.

If later introduced:

```text
Production secrets
≠
Development secrets
```

---

# 53. Deployment Sequence

Recommended:

```text
1. Create GitHub repository
2. Configure backend locally
3. Configure Supabase
4. Configure Gemini
5. Configure Cognee
6. Configure n8n
7. Configure Twilio
8. Configure Sarvam
9. Run local end-to-end tests
10. Deploy frontend
11. Deploy backend
12. Configure public webhooks
13. Run external integration tests
14. Run final demo
```

The order may change according to provider dependencies.

---

# 54. Local-First Strategy

Before deploying:

```text
All core business logic
```

must work locally.

Cloud deployment should not be used as the first debugging environment.

---

# 55. Infrastructure Health

The backend should expose safe health information.

Conceptual:

```text
GET /health
```

and potentially:

```text
GET /health/providers
```

without exposing credentials.

---

# 56. Provider Health

Track provider availability:

```text
Gemini
Sarvam
Twilio
Cognee
n8n
Supabase
```

A provider being configured does not mean it is healthy.

---

# 57. Graceful Degradation

Example:

```text
Cognee unavailable
 ↓
Current case context still sufficient
 ↓
Continue safely
```

But:

```text
Payment verification unavailable
 ↓
Payment state unknown
 ↓
Do not close case as paid
```

---

# 58. Service Dependency Matrix

| Feature | Required dependencies |
|---|---|
| Login | Auth + DB |
| Dashboard | Backend + DB |
| Case list | Backend + DB |
| AI decision | Gemini + DB |
| Memory | Cognee + DB |
| WhatsApp | n8n + Twilio |
| Voice | n8n/Twilio + Sarvam + Gemini |
| Payment verification | Mock Payment API |
| Escalation | Backend + DB |
| Audit | Backend + DB |

---

# 59. Minimal Demo Dependency Set

If the final voice stack is not yet verified, the minimum demonstrable loop should still be:

```text
Frontend
 ↓
FastAPI
 ↓
Supabase
 ↓
Gemini
 ↓
n8n
 ↓
Twilio WhatsApp
 ↓
Customer Response
 ↓
Gemini
 ↓
Mock Payment
 ↓
Resolution
```

Voice should be added once its complete architecture is verified.

---

# 60. Infrastructure Fallbacks

If a provider becomes unavailable:

```text
Do not silently replace it.
```

Instead:

```text
Record provider failure
 ↓
Use documented fallback if one exists
 ↓
Mark capability state
```

---

# 61. Provider Replacement

Provider abstraction should allow future replacement.

Example:

```text
LLM:
Gemini → another verified provider

Memory:
Cognee → another verified memory layer

Voice:
Twilio → another verified provider
```

No replacement should be assumed to have identical capabilities.

---

# 62. Cost Monitoring

Track usage where provider dashboards expose it.

At minimum monitor:

```text
Gemini usage
Twilio minutes/messages
n8n workflow executions
Cognee usage
Supabase database/storage usage
```

---

# 63. Spending Safety

The application itself should not have functionality that silently upgrades plans or enables paid billing.

If a provider reports:

```text
Quota exceeded
```

the system should fail safely.

---

# 64. Free-Tier Exhaustion

Example:

```text
Twilio trial minutes exhausted
```

Expected:

```text
Voice action fails/blocked
UI explains test resource unavailable
No false call success
```

Similarly for other providers.

---

# 65. Demo Budget Protection

The demo should avoid unnecessary provider calls.

Use:

```text
Deterministic scenarios
Cached non-sensitive data
Mocks for expensive/unavailable services
Limited retry counts
```

---

# 66. AI Cost Protection

Avoid unnecessary Gemini calls.

Prefer:

```text
Deterministic rules first
 ↓
AI only when reasoning is required
```

For example, a paid case should not require an LLM decision just to determine:

```text
Do not contact.
```

if a deterministic policy can block the action.

---

# 67. Voice Cost Protection

Do not initiate calls automatically during development unless the test case explicitly requires it.

Use:

```text
Demo/Test mode
Verified recipient
Bounded call duration
```

where supported.

---

# 68. WhatsApp Cost Protection

Use the trial/sandbox mechanisms correctly.

Do not build loops that repeatedly send messages.

Every outbound message must correspond to a valid action.

---

# 69. n8n Cost Protection

Avoid infinite workflow executions.

Every workflow should have:

```text
Clear trigger
Clear termination
Bounded retries
```

---

# 70. Database Cost Protection

Avoid:

```text
Unbounded queries
Repeated full-table scans
Storing duplicate transcripts unnecessarily
Large unnecessary payloads
```

Use pagination and appropriate indexes.

---

# 71. Infrastructure Observability

Useful dashboard values:

```text
Active cases
Actions today
Successful actions
Failed actions
Pending actions
Escalations
Provider errors
AI invalid responses
```

These are application metrics, not provider guarantees.

---

# 72. Deployment Failure Strategy

If deployment fails:

```text
Inspect logs
 ↓
Identify failing dependency
 ↓
Fix configuration/code
 ↓
Redeploy
```

Do not disable security controls merely to make deployment succeed.

---

# 73. Rollback

Keep the previous working deployment/version available where the selected hosting platform supports it.

At minimum:

```text
Git commit
Database migration
Environment configuration
```

must be traceable.

---

# 74. Database Migration Safety

Before applying destructive migrations:

```text
Confirm impact
 ↓
Back up/export where possible
 ↓
Test locally
 ↓
Apply
```

---

# 75. Disaster Recovery Scope

Full production disaster recovery is outside the hackathon MVP.

However, the project must preserve:

```text
Source code
Schema
Migrations
Seed data
Workflow definitions
Environment variable documentation
```

---

# 76. Infrastructure Security

All secrets must be managed through:

```text
Environment variables
Provider credential stores
Secret management facilities
```

Never through source code.

---

# 77. CORS

Backend CORS should allow only the required frontend origins.

Do not use:

```text
allow_origins=["*"]
```

in a sensitive deployed environment unless there is a documented reason and no credentials are exposed through that configuration.

---

# 78. CSRF

If browser cookies/session authentication is used, CSRF protections must be evaluated.

The exact mechanism depends on the authentication architecture.

---

# 79. API Rate Limiting

Public endpoints should have appropriate rate limits.

Exact values:

```text
TBD
```

and should be selected based on actual usage.

---

# 80. Network Security

Use HTTPS for public service-to-service communication where supported.

Do not transmit provider credentials over unencrypted channels.

---

# 81. SSRF Protection

If the backend ever accepts URLs from users or AI-generated inputs:

```text
Do not blindly fetch arbitrary URLs.
```

Use an allowlist or strict validation.

The MVP should avoid unnecessary arbitrary URL fetching.

---

# 82. File Uploads

File uploads are not required for the initial MVP.

If introduced:

```text
Validate type
Validate size
Scan where appropriate
Store outside executable paths
Use access control
```

---

# 83. Dependency on External Services

Every external service must have:

```text
Timeout
Error handling
Provider abstraction
Configuration
Health status
```

where applicable.

---

# 84. Infrastructure Acceptance Criteria

Infrastructure is complete when:

1. Local development works.
2. Frontend can be built.
3. Backend can be started.
4. Database migrations work.
5. Required environment variables are documented.
6. Provider credentials are not committed.
7. Gemini can be called when configured.
8. Cognee can be called when configured.
9. n8n workflows can be executed.
10. Twilio test communication works when configured.
11. Sarvam capabilities used by the implementation are verified.
12. Payment mock works.
13. Public webhooks work in the chosen deployment/test environment.
14. Health/failure states are visible.
15. No unexpected paid dependency exists.

---

# 85. Infrastructure Verification Checklist

Before final demo:

```text
[ ] GitHub repository clean
[ ] No secrets committed
[ ] .env.example complete
[ ] Supabase connected
[ ] Migrations applied
[ ] Gemini API verified
[ ] Sarvam API verified
[ ] Cognee API verified
[ ] n8n workflows imported/tested
[ ] Twilio Voice verified
[ ] Twilio WhatsApp verified
[ ] Mock Payment verified
[ ] Frontend deployed/tested
[ ] Backend publicly reachable if required
[ ] Webhooks verified
[ ] End-to-end test passed
[ ] Demo data loaded
[ ] Provider limits checked
[ ] No paid billing accidentally enabled
```

---

# 86. Current Infrastructure Status

At the beginning of implementation, treat the following as:

```text
Frontend hosting:
TARGET — Cloudflare Pages

Backend hosting:
TBD

Database:
TARGET — Supabase

AI:
TARGET — Gemini API

Memory:
TARGET — Cognee

Workflow:
TARGET — n8n

Voice:
TARGET — Twilio + Sarvam

WhatsApp:
TARGET — Twilio WhatsApp

Payment:
MOCKED

Sarvam account:
NOT YET VERIFIED

Gemini API configuration:
MUST VERIFY

Twilio trial:
AVAILABLE FOR TESTING SUBJECT TO CURRENT ACCOUNT LIMITS

n8n:
CURRENT FREE TRIAL

Production payment integration:
NOT REQUIRED FOR MVP
```

---

# 87. Important Provider Verification Rule

Before writing provider-specific production code, verify the provider's current official documentation for:

```text
Authentication
Endpoints
SDK
Supported models
Streaming
Webhooks
Rate limits
Pricing
Free tier
Regional availability
Trial restrictions
```

If documentation conflicts with this document:

```text
Official current provider documentation wins
```

and the relevant project specification must be updated.

---

# 88. Final Infrastructure Architecture

The intended MVP infrastructure is:

```text
                 MERCHANT
                    │
                    ↓
             Cloudflare Pages
                React App
                    │
                    ↓
              FastAPI Backend
                    │
       ┌────────────┼────────────┐
       ↓            ↓            ↓
   Supabase      Gemini       Cognee
  SQL Truth     Reasoning      Memory
       │            │            │
       └────────────┼────────────┘
                    ↓
                   n8n
                    │
          ┌─────────┴─────────┐
          ↓                   ↓
      Twilio Voice      Twilio WhatsApp
          │                   │
          └─────────┬─────────┘
                    ↓
                  Customer
                    │
                    ↓
             Customer Response
                    │
                    ↓
              FastAPI / n8n
                    │
                    ↓
                Gemini
                    │
                    ↓
             Payment Verification
                    │
                    ↓
              Mock Payment API
                    │
                    ↓
              Supabase State
                    │
                    ↓
                Cognee Memory
```

---

# 89. Final Principle

The infrastructure must optimize for:

```text
Working
+
Safe
+
Free where viable
+
Replaceable
+
Observable
+
Honest
```

not merely:

```text
Most technologies
```

The project should use the smallest infrastructure that can reliably demonstrate the complete Autonomous AI Collections Agent.

If a provider capability cannot be verified, mark it:

```text
TBD / BLOCKED
```

rather than inventing support.
