# Integrations Specification

## Paytm AI Workforce — Autonomous AI Collections Agent

---

# 1. Purpose

This document defines the integration boundaries between the Autonomous AI Collections Agent and external services.

Target integrations:

- Gemini API
- Sarvam AI
- Twilio Voice
- Twilio WhatsApp
- n8n
- Cognee
- Supabase
- Mock Payment API
- Frontend ↔ Backend API
- Optional hosting/deployment services

The goal is to make every integration:

- Explicit.
- Replaceable.
- Secure.
- Testable.
- Observable.
- Compatible with the free/no-card prototype constraint where possible.

---

# 2. Integration Architecture

```text
                         ┌──────────────────┐
                         │   React Frontend │
                         └────────┬─────────┘
                                  │ HTTPS
                                  ↓
                         ┌──────────────────┐
                         │  FastAPI Backend │
                         └───────┬──────────┘
                                 │
            ┌────────────────────┼────────────────────┐
            ↓                    ↓                    ↓
       Supabase              Gemini API            Cognee
      Transaction DB         AI Reasoning          AI Memory
            │                    │                    │
            └────────────────────┼────────────────────┘
                                 ↓
                         Decision + Policy
                                 │
                                 ↓
                                n8n
                         ┌───────┼────────┐
                         ↓       ↓        ↓
                      Twilio  Twilio    Mock
                      Voice   WhatsApp  Payment
                         │       │        │
                         └───────┼────────┘
                                 ↓
                              Customer
```

---

# 3. Integration Rules

Every external service must have:

1. A defined responsibility.
2. A backend integration boundary.
3. Credential management.
4. Request validation.
5. Response validation.
6. Timeout behavior.
7. Error handling.
8. Retry behavior where safe.
9. Observability.
10. A mocked/test alternative where practical.

---

# 4. Provider Status Vocabulary

The application should distinguish:

```text
CONFIGURED
NOT_CONFIGURED
CONNECTED
AUTH_FAILED
RATE_LIMITED
TEMPORARILY_UNAVAILABLE
PERMANENTLY_FAILED
DISABLED
```

Exact status values may be refined during implementation.

---

# 5. Gemini API

## Role

Gemini is the primary AI reasoning/model layer for the MVP.

It may be used for:

- Intent interpretation.
- Conversation response generation.
- Structured decision generation.
- Commitment extraction.
- Conversation summarization.
- Context-aware reasoning.

Gemini is not the authorization layer.

---

# 6. Gemini Boundary

Correct:

```text
FastAPI
  ↓
Gemini API
  ↓
Structured result
  ↓
Validation
```

Incorrect:

```text
React
  ↓
Gemini API key
```

API credentials must never be exposed in frontend code.

---

# 7. Gemini Input

The backend should provide controlled context:

```text
System instructions
+
Current case
+
Authoritative facts
+
Relevant conversation
+
Relevant memory
+
Allowed actions
+
Policy constraints
```

The model should not receive unrestricted database access.

---

# 8. Gemini Output

Where the model is making an operational decision, use structured output.

Conceptual:

```json
{
  "action": "CALL",
  "customer_intent": "UNKNOWN",
  "confidence": 0.91,
  "reason": "No response was received to the previous permitted message."
}
```

The exact schema is defined in `07-decision-engine.md` and `11-data-model.md`.

---

# 9. Gemini Model Selection

The exact Gemini model must be selected based on:

- Current API availability.
- Free-tier eligibility.
- Structured output support.
- Tool/function calling requirements.
- Latency.
- Context window.
- Rate limits.
- Quality in multilingual conversation.

The project must verify the current Google AI documentation before locking the model.

Do not assume the user's Google AI Pro subscription automatically provides unlimited or free API usage.

The application should use Gemini API access that is explicitly available under the project's chosen billing/free-tier configuration.

---

# 10. Gemini Failure Handling

```text
Request
  ↓
Gemini unavailable
  ↓
Retry if safe
  ↓
If still unavailable:
  ↓
Deterministic fallback / WAIT / ESCALATE
```

The agent must never fabricate a decision because the model is unavailable.

---

# 11. Sarvam AI

## Role

Sarvam is intended to provide Indian-language speech capabilities.

Potential roles:

```text
Customer speech
    ↓
Sarvam STT
    ↓
Transcript

Agent response
    ↓
Sarvam TTS
    ↓
Speech
```

Sarvam may also support multilingual/Hinglish processing depending on the selected APIs.

---

# 12. Sarvam Capability Verification

Before implementation, verify the current official Sarvam documentation for:

- Speech-to-text API.
- Text-to-speech API.
- Supported languages.
- Hinglish support.
- Streaming capabilities.
- Real-time voice capabilities.
- Audio formats.
- Authentication.
- Free-tier availability.
- Rate limits.
- SDK/API versions.

Do not assume real-time conversational voice behavior until it is tested.

---

# 13. Sarvam STT Integration

Conceptual:

```text
Twilio Voice
     ↓
Audio
     ↓
Sarvam STT
     ↓
Transcript
     ↓
Conversation Manager
```

The transcript should include enough metadata to associate it with:

```text
call_id
conversation_id
case_id
turn_id
```

Exact implementation is TBD.

---

# 14. STT Failure

If transcription fails:

```text
STT request
   ↓
Failure
   ↓
Retry if safe
   ↓
If unsuccessful:
   ↓
Ask customer to repeat / alternative channel / escalation
```

The system must not infer the customer's intent from missing audio.

---

# 15. Sarvam TTS Integration

Conceptual:

```text
Gemini response
      ↓
Response validation
      ↓
Sarvam TTS
      ↓
Audio
      ↓
Twilio Voice
```

The response should be generated from approved context and should not contain unsupported claims.

---

# 16. TTS Failure

If TTS fails:

```text
TTS request
   ↓
Failure
   ↓
Retry if safe
   ↓
Alternative supported response / end safely
```

The system must record the technical failure.

---

# 17. Twilio

Twilio provides the communication infrastructure for the MVP.

Target services:

```text
Twilio Voice
Twilio WhatsApp
```

Twilio is an execution provider, not a decision engine.

---

# 18. Twilio Voice Integration

Conceptual:

```text
Approved CALL action
      ↓
n8n
      ↓
Twilio Voice
      ↓
Customer phone
```

The backend must create the action before n8n executes it.

---

# 19. Voice Credentials

Twilio credentials must remain server-side.

Potential secrets include:

```text
TWILIO_ACCOUNT_SID
TWILIO_AUTH_TOKEN
TWILIO_PHONE_NUMBER
```

Exact required variables depend on the final Twilio implementation.

Never commit credentials to Git.

---

# 20. Twilio Voice Trial

The prototype may use the available Twilio trial voice allowance.

The current account limits and trial behavior must be checked at implementation time.

The demo must not assume unlimited calls.

Recipient verification and trial restrictions must be respected.

---

# 21. Twilio Voice Result

The workflow should capture provider information where available:

```text
call_id
status
duration
timestamp
error_code
```

The exact provider response mapping is TBD.

---

# 22. Twilio WhatsApp Integration

Conceptual:

```text
Approved TEXT action
      ↓
n8n
      ↓
Twilio WhatsApp
      ↓
Customer
```

Incoming response:

```text
Customer
   ↓
Twilio
   ↓
Webhook
   ↓
FastAPI
```

---

# 23. Twilio WhatsApp Trial

The implementation must verify current trial restrictions before relying on WhatsApp.

Potential restrictions include:

- Recipient verification.
- Sandbox participation.
- Approved/predefined templates.
- Trial message limits.
- Messaging windows.

Do not implement unrestricted production-style WhatsApp behavior on the assumption that the trial account supports it.

---

# 24. Twilio Webhooks

Incoming Twilio events should be sent to a controlled backend endpoint.

Conceptual:

```text
POST /webhooks/twilio
```

The exact endpoint is TBD.

Webhook handling must include:

```text
Authenticate/verify
     ↓
Validate payload
     ↓
Check idempotency
     ↓
Associate case
     ↓
Persist event
     ↓
Process event
```

---

# 25. n8n Integration

n8n is the workflow orchestration layer.

Backend:

```text
POST n8n webhook
```

n8n:

```text
Validate input
   ↓
Execute provider operation
   ↓
Return/callback result
```

The exact webhook URLs and authentication mechanism are deployment-specific and must be configured through environment variables.

---

# 26. n8n Authentication

The backend-to-n8n connection must use an authenticated mechanism.

Possible approaches include:

- Secret header.
- Signed request.
- Authenticated webhook.
- Other supported n8n mechanism.

The final mechanism is TBD.

Do not expose n8n webhook secrets in the frontend.

---

# 27. n8n Request Contract

Conceptual:

```json
{
  "action_id": "ACT-001",
  "case_id": "CASE-001",
  "action": "TEXT",
  "channel": "WHATSAPP",
  "idempotency_key": "CASE-001-ACT-001",
  "payload": {}
}
```

The final payload schema must be versioned.

---

# 28. n8n Response Contract

Conceptual:

```json
{
  "action_id": "ACT-001",
  "status": "SUCCESS",
  "provider_reference": "MSG-001"
}
```

Failure:

```json
{
  "action_id": "ACT-001",
  "status": "FAILED",
  "error_code": "PROVIDER_TIMEOUT"
}
```

The backend must validate the response before updating business state.

---

# 29. Cognee Integration

Cognee is the AI memory layer.

Conceptual:

```text
Relevant conversation/case event
          ↓
Cognee
          ↓
Memory retrieval
          ↓
FastAPI
          ↓
Gemini
```

The exact API/SDK contract must be verified against current official documentation.

---

# 30. Cognee Credentials

Cognee credentials must remain server-side.

Potential configuration:

```text
COGNEE_API_KEY
COGNEE_BASE_URL
```

Exact variables depend on the selected Cognee deployment/API.

Do not assume these names if the official SDK uses a different configuration.

---

# 31. Cognee Failure

If Cognee is unavailable:

```text
Try retrieval
    ↓
Failure
    ↓
Use current authoritative context
    ↓
Continue if safe
```

If required context is unavailable:

```text
WAIT / ESCALATE
```

No memory should be invented.

---

# 32. Supabase Integration

Supabase is the primary transactional database for the prototype.

It should store:

- Merchants.
- Customers.
- Cases.
- Invoices.
- Payment status.
- Conversations.
- Messages.
- Actions.
- Follow-ups.
- Escalations.
- Audit events.
- Integration events.

The exact schema is defined in `11-data-model.md`.

---

# 33. Supabase Access Model

The preferred architecture is:

```text
Frontend
   ↓
FastAPI
   ↓
Supabase
```

The frontend should not receive unrestricted database credentials.

If direct Supabase client access is used for a specific UI feature, Row Level Security must be correctly configured and documented.

The MVP should prefer backend-controlled business operations.

---

# 34. Supabase Authentication

Authentication may be handled by:

- Supabase Auth.
- Backend-issued authentication.
- Another explicitly selected authentication mechanism.

The final authentication architecture is TBD.

Do not implement multiple authentication systems unnecessarily.

---

# 35. Supabase Transaction Rule

Business-critical state changes should be persisted transactionally where appropriate.

Examples:

```text
Payment status
Case status
Action status
Escalation status
```

The implementation should prevent partial updates where consistency matters.

---

# 36. Mock Payment API

The MVP requires a payment-verification mechanism.

Because private Paytm payment APIs/data cannot be assumed, the prototype should use a clearly labelled mock payment API.

Example:

```text
GET /mock/payments/{case_id}
```

Conceptual response:

```json
{
  "status": "PAID",
  "transaction_id": "MOCK-TXN-001"
}
```

The exact API contract is TBD.

---

# 37. Mock Payment Rules

The mock API should support at least:

```text
PAID
NOT_PAID
UNKNOWN
ERROR
```

Synthetic payment records must be clearly identified as mock data.

The frontend should display:

```text
Demo / Mock Payment Data
```

where appropriate.

---

# 38. Paytm Integration Boundary

The hackathon brief does not provide private Paytm merchant/payment APIs for the project.

Therefore:

```text
Paytm private API = NOT ASSUMED
```

The MVP must not depend on unavailable internal Paytm systems.

The product can be positioned as a new Paytm-launched AI workforce product without requiring private Paytm infrastructure.

---

# 39. FastAPI Backend

The backend is the central integration boundary.

Responsibilities include:

- Authentication.
- Authorization.
- Case operations.
- AI orchestration.
- Policy validation.
- Memory retrieval.
- Integration calls.
- Webhook handling.
- Audit logging.
- Error handling.

---

# 40. Suggested Backend Integration Modules

Suggested structure:

```text
backend/
├── integrations/
│   ├── gemini.py
│   ├── sarvam.py
│   ├── twilio.py
│   ├── cognee.py
│   ├── n8n.py
│   └── payment_mock.py
├── agents/
├── policies/
├── services/
├── models/
├── api/
└── workers/
```

This is a recommendation, not a mandatory directory structure.

---

# 41. Integration Interface Pattern

Each provider should have a narrow application interface.

Example:

```python
class VoiceProvider:
    async def start_call(...):
        ...

    async def get_call_status(...):
        ...
```

The rest of the application should not depend directly on provider-specific implementation details.

---

# 42. Provider Abstraction

Recommended abstraction boundaries:

```text
LLMProvider
MemoryProvider
SpeechToTextProvider
TextToSpeechProvider
MessagingProvider
VoiceProvider
PaymentProvider
WorkflowProvider
```

This allows mocked providers during testing.

---

# 43. Environment Variables

The final `.env.example` should include only required variables.

Potential categories:

```text
APP_
DATABASE_
SUPABASE_
GEMINI_
SARVAM_
TWILIO_
COGNEE_
N8N_
PAYMENT_
```

Actual variable names must be defined consistently across code and documentation.

---

# 44. Secret Management

Secrets must:

- Exist only server-side.
- Be loaded through environment/secret configuration.
- Never be committed to Git.
- Never be rendered in logs.
- Never be returned by API responses.
- Never be included in prompts.

---

# 45. Integration Timeouts

Each provider call should have an explicit timeout.

Conceptual:

```text
request
 ↓
timeout
 ↓
retry if safe
 ↓
failure handling
```

Exact timeout values are TBD and should be based on provider behavior/testing.

---

# 46. Integration Retries

Retries should only be used for safe transient failures.

Each integration should define:

```text
retryable errors
max attempts
backoff
idempotency strategy
final failure behavior
```

Do not retry indefinitely.

---

# 47. Rate Limits

The implementation must respect provider rate limits.

Important providers:

- Gemini.
- Sarvam.
- Twilio.
- Cognee.
- Supabase.
- n8n.

Current limits should be verified from official provider documentation during implementation.

The application should surface rate-limit failures as explicit operational errors.

---

# 48. Logging

Integration logs should capture:

```text
provider
operation
request_id
case_id
action_id
status
latency
error_code
timestamp
```

Do not log:

- API secrets.
- Authentication tokens.
- Unnecessary sensitive customer data.
- Full raw audio unless explicitly required and protected.

---

# 49. Correlation IDs

A single autonomous operation should be traceable across systems.

Conceptual:

```text
correlation_id
    ↓
FastAPI
    ↓
Gemini
    ↓
n8n
    ↓
Twilio
    ↓
Webhook
    ↓
FastAPI
```

The same logical correlation reference should be preserved where possible.

---

# 50. Health Checks

The backend should expose an internal/admin health mechanism that can distinguish:

```text
Backend healthy
Database reachable
Gemini configured/reachable
Sarvam configured/reachable
Twilio configured/reachable
Cognee configured/reachable
n8n reachable
```

Health checks must not expose secrets.

---

# 51. Startup Validation

On application startup, validate configuration where practical.

Example:

```text
Required environment variables
    ↓
Check
    ↓
Missing
    ↓
Clear startup/configuration error
```

Do not silently disable critical features.

---

# 52. Feature Availability

The UI should know which capabilities are currently configured.

Example:

```text
Voice:
READY

WhatsApp:
READY

AI:
READY

Memory:
READY

Payment:
DEMO / MOCK
```

If a provider is unavailable, the UI should not present the capability as fully operational.

---

# 53. Local Development

The system should support local development on Windows.

Recommended local components:

```text
React
FastAPI
Supabase cloud
n8n cloud/trial
Provider APIs
Cognee cloud
```

The exact local process must be defined in the development documentation.

---

# 54. Public Webhooks During Development

Provider webhooks require a publicly reachable endpoint.

If the local backend is used, a secure tunnelling solution may be required.

Possible development tooling:

```text
Cloudflare Tunnel
ngrok
```

The final tool should be selected based on:

- Free availability.
- No-card requirement.
- Stability.
- Provider compatibility.

Do not assume a tunnel URL is permanent.

---

# 55. Hosting

Frontend hosting should preferably use a free/no-card platform such as Cloudflare Pages if compatible with the final frontend.

Backend hosting is:

**TBD**

The selected backend host must support:

- FastAPI.
- Environment secrets.
- HTTPS.
- Required execution model.
- Webhook endpoints.
- Free/no-card prototype operation if possible.

---

# 56. Real vs Mocked Integrations

The project must maintain an explicit integration status table.

Example:

| Integration | MVP Status |
|---|---|
| Gemini | Real API if configured |
| Sarvam | Real API if configured |
| Twilio Voice | Real trial API |
| Twilio WhatsApp | Real trial/sandbox API if configured |
| n8n | Real workflow |
| Cognee | Real API if configured |
| Supabase | Real database |
| Payment verification | MOCKED |
| Paytm private APIs | NOT ASSUMED |

The table must be updated when implementation changes.

---

# 57. Integration Fallbacks

Fallbacks must be explicit.

Example:

```text
Real Twilio Voice unavailable
        ↓
Do not pretend call happened
        ↓
Use demo simulation only if clearly labelled
```

A mocked fallback must never be represented as a real provider action.

---

# 58. Provider Replacement

The architecture should allow provider replacement without rewriting the business logic.

Example:

```text
VoiceProvider
   ├── TwilioVoiceProvider
   └── MockVoiceProvider
```

Similarly:

```text
PaymentProvider
   ├── MockPaymentProvider
   └── FuturePaytmProvider
```

The second implementation is future/placeholder only and must not be assumed to exist.

---

# 59. Integration Testing Strategy

Tests should be divided into:

```text
Unit tests
Integration tests
Provider tests
Workflow tests
End-to-end tests
Failure tests
```

Provider-dependent tests should use real APIs only where practical and within free/test limits.

---

# 60. Mock Providers

Development should provide mock implementations for:

- Voice.
- WhatsApp.
- Payment.
- LLM where necessary.
- Memory where necessary.

This allows deterministic testing without consuming trial quotas.

However, the hackathon demo should clearly distinguish mocked behavior from real integrations.

---

# 61. Integration Acceptance Criteria

The integration layer is complete when:

1. Gemini can receive controlled context and return structured output.
2. Sarvam can process supported speech/text capabilities used by the MVP.
3. Twilio Voice can execute a real test call if configured.
4. Twilio WhatsApp can execute a supported trial/sandbox test if configured.
5. n8n can execute approved workflows.
6. Cognee can store/retrieve relevant memory if configured.
7. Supabase persists transactional data.
8. Mock Payment API returns deterministic test outcomes.
9. Webhooks are validated.
10. Duplicate events are handled.
11. Secrets remain server-side.
12. Provider failures are observable.
13. The system can run in a clearly labelled demo configuration.
14. Unsupported capabilities are not claimed as working.

---

# 62. Required Verification Before Coding

The implementation team must verify current official documentation for:

### Gemini
- API access.
- Model availability.
- Free tier.
- Structured output.
- Tool/function calling.
- Rate limits.

### Sarvam
- STT.
- TTS.
- Language support.
- Streaming/realtime capabilities.
- Pricing/free access.

### Twilio
- Trial voice.
- WhatsApp trial/sandbox.
- Webhooks.
- Voice interaction capabilities.
- Current limits.

### n8n
- Trial limits.
- Webhook behavior.
- Credentials.
- Scheduling.
- Execution behavior.

### Cognee
- Cloud/API access.
- Free tier.
- SDK/API.
- Retrieval.
- Storage/update/delete.

### Supabase
- Free plan.
- Database limits.
- Authentication if used.
- Row Level Security if used.

---

# 63. Integration Configuration Principle

The codebase must never depend on undocumented assumptions.

For every external integration:

```text
Official capability verified
        ↓
Configuration documented
        ↓
Implementation
        ↓
Tested
        ↓
Marked REAL
```

If not:

```text
TBD / BLOCKED
```

---

# 64. Final Integration Architecture

```text
                    ┌──────────────────┐
                    │      Gemini      │
                    │   AI Reasoning   │
                    └────────┬─────────┘
                             │
                    ┌────────▼─────────┐
                    │   FastAPI Agent  │
                    │ Decision + Policy│
                    └────┬───────┬─────┘
                         │       │
              ┌──────────┘       └──────────┐
              ↓                             ↓
       ┌─────────────┐               ┌─────────────┐
       │  Supabase   │               │   Cognee    │
       │ Transaction │               │ AI Memory   │
       └─────────────┘               └─────────────┘
                         │
                         ↓
                       n8n
                  ┌──────┼──────┐
                  ↓      ↓      ↓
               Twilio Twilio   Mock
               Voice  WhatsApp Payment
                  ↓      ↓      ↓
                  └──────┼──────┘
                         ↓
                      Customer
```

---

# 65. Final Principle

External providers give the AI employee capabilities.

They do not define the business logic.

The architecture must remain:

```text
Gemini     → Think
Cognee     → Remember
Sarvam     → Hear/Speak
Decision   → Decide
Policy     → Authorize
n8n        → Orchestrate
Twilio     → Communicate
Supabase   → Store truth
Mock API   → Simulate payment verification
```

Every integration must have a clear boundary, an explicit failure mode, and a verifiable implementation status.
