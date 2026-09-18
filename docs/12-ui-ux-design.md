# UI/UX Design Specification

## Paytm AI Workforce — Autonomous AI Collections Agent

---

# 1. Purpose

This document defines the UI/UX requirements for the Paytm AI Workforce MVP.

The product should present the Autonomous AI Collections Agent as an **AI employee that performs work**, rather than as a generic chatbot.

The interface must make it easy for a merchant/operator to:

- Understand what the AI employee is doing.
- Start a collection run.
- Review collection cases.
- See why the agent made a decision.
- See real actions being executed.
- Monitor voice and WhatsApp interactions.
- Review customer responses.
- Handle escalations.
- Inspect memory/context where appropriate.
- Distinguish real and mocked functionality.
- Stop or intervene in autonomous work.

---

# 2. UX Principle

The product should communicate:

```text
"Give the AI employee a goal.
It works through the cases.
You supervise the work."
```

The primary UX should therefore be:

```text
Goal
 ↓
AI Work
 ↓
Actions
 ↓
Outcomes
```

not:

```text
Chat box
 ↓
User asks question
 ↓
AI answers
```

---

# 3. Product Positioning

Primary product name:

# Paytm AI Workforce

Primary employee:

# Autonomous AI Collections Agent

The dashboard should visually communicate that the user is supervising an autonomous worker.

Avoid making the product look like a conventional chatbot.

---

# 4. Design Goals

The interface should be:

- Clean.
- Modern.
- Professional.
- Trustworthy.
- Action-oriented.
- Easy to understand.
- Responsive.
- Suitable for a hackathon demo.
- Designed around real operational workflows.

---

# 5. Design System Direction

The exact visual design is not locked.

Recommended direction:

```text
Professional fintech
+
Modern AI product
+
Operational dashboard
```

Avoid:

- Excessive gradients.
- Decorative animations.
- Generic AI robot imagery.
- Cluttered dashboards.
- Excessive cards with no actionable purpose.
- Fake analytics.

---

# 6. Application Structure

Suggested primary navigation:

```text
AI Workforce
├── Overview
├── Cases
├── Conversations
├── Escalations
├── Activity
└── Settings
```

Additional pages may be added only when required.

---

# 7. Overview Page

The Overview page is the merchant's command center.

It should answer:

```text
What is the AI employee doing?
How many cases need attention?
What actions happened?
What requires me?
```

---

# 8. Overview Layout

Suggested structure:

```text
┌──────────────────────────────────────────────┐
│ Paytm AI Workforce              [AI ACTIVE] │
├──────────────────────────────────────────────┤
│                                              │
│ Collections Agent                            │
│ "Recover pending payments"                   │
│                                              │
│ [Start Collections]   [Pause Agent]          │
│                                              │
├──────────┬──────────┬──────────┬─────────────┤
│ Overdue  │ In Work  │ Recovered│ Escalations │
├──────────┴──────────┴──────────┴─────────────┤
│                                              │
│ AI Employee Activity                         │
│                                              │
│ ● Called Rahul Sharma                       │
│ ● WhatsApp sent to Amit                     │
│ ● Payment verified                          │
│ ● Case escalated                            │
│                                              │
└──────────────────────────────────────────────┘
```

The exact metrics must come from actual database data.

---

# 9. Primary CTA

The primary action should be:

```text
Start Collections
```

When clicked:

```text
Select scope
      ↓
Confirm
      ↓
AI starts processing
```

The product should not make starting autonomous work ambiguous.

---

# 10. Start Collections Dialog

The dialog should show:

- Number of eligible cases.
- Current outstanding amount.
- Communication channels available.
- Agent status.
- Relevant policy configuration.
- Demo/mock indicators where applicable.

Example:

```text
Start AI Collections

42 eligible cases
₹2,84,000 outstanding

Channels
✓ WhatsApp
✓ Voice

Payment verification
Demo / Mock

[Cancel] [Start Collections]
```

All numbers must be dynamic synthetic/demo data in the MVP.

---

# 11. Agent Status

The UI should show a clear agent status.

Suggested:

```text
ACTIVE
PAUSED
IDLE
WAITING
ERROR
```

The exact state machine is defined by the backend.

---

# 12. Active Agent Banner

When active:

```text
● Collections Agent is working

Processing 18 of 42 cases
Last action: Called Rahul Sharma
```

The progress must reflect actual backend/workflow state.

Do not create fake progress animations.

---

# 13. Pause Agent

The merchant should be able to pause autonomous processing.

Example:

```text
[Pause Agent]
```

Pause behavior:

```text
User requests pause
       ↓
Backend updates agent state
       ↓
New autonomous actions stop
       ↓
Already-executing provider operations handled safely
       ↓
UI shows PAUSED
```

Exact behavior for in-flight actions is TBD.

---

# 14. Resume Agent

When paused:

```text
[Resume Agent]
```

Resume should cause the backend to re-evaluate eligible cases rather than blindly replaying stale actions.

---

# 15. Cases Page

The Cases page is the main operational workspace.

Suggested columns:

| Case | Customer | Amount | Status | Last Contact | Next Action | Agent |
|---|---|---:|---|---|---|---|
| CASE-001 | Rahul Sharma | ₹12,500 | Overdue | 2h ago | Call | Working |
| CASE-002 | Amit Kumar | ₹8,400 | Waiting | Today | Follow-up | Waiting |
| CASE-003 | Neha Singh | ₹15,000 | Escalated | Yesterday | Human review | Escalated |

All displayed values must come from actual application data.

---

# 16. Case Filters

Useful filters:

```text
Status
Channel
Priority
Next action
Escalated
Payment state
```

Search:

```text
Search customer / invoice / case ID
```

---

# 17. Case Detail Page

The case detail page should show the complete work history.

Suggested structure:

```text
CASE-001

Rahul Sharma
₹12,500
OVERDUE

[Pause Case] [Escalate]

────────────────────────────

AI Decision
CALL

Reason:
Customer did not respond to the previous message.

────────────────────────────

Conversation
...

────────────────────────────

Timeline
...

────────────────────────────

Payment
NOT PAID

────────────────────────────

Memory
...

────────────────────────────

Audit
...
```

---

# 18. Case Header

The header should immediately communicate:

- Customer.
- Amount.
- Invoice.
- Case status.
- Next action.
- Agent status.

Example:

```text
Rahul Sharma
Invoice INV-1001
₹12,500
OVERDUE

Next:
CALL
```

---

# 19. AI Decision Panel

The AI Decision panel should explain the current decision without exposing private model reasoning.

Show:

```text
Proposed action:
CALL

Confidence:
High / configured level

Reason:
No response to the previous permitted message.

Policy:
Approved

Execution:
Queued
```

The UI should not show chain-of-thought.

---

# 20. Action Status

Use explicit operational states:

```text
QUEUED
EXECUTING
SUCCESS
FAILED
CANCELLED
STALE
```

Avoid vague labels such as:

```text
AI is thinking...
```

when the system actually has a concrete operational state.

---

# 21. Conversation Page

The Conversations page should show:

- Active conversations.
- Completed conversations.
- Voice calls.
- WhatsApp interactions.
- Conversation status.
- Customer intent.
- Outcome.

Suggested layout:

```text
Conversations

┌─────────────────────────────────────────┐
│ Rahul Sharma                            │
│ Voice • In Progress                     │
│ Intent: Payment Commitment              │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ Amit Kumar                              │
│ WhatsApp • Completed                    │
│ Intent: Already Paid                    │
└─────────────────────────────────────────┘
```

---

# 22. Conversation Detail

The conversation detail page should display a chronological transcript.

Example:

```text
AI
Hello, I'm calling regarding a pending payment...

Customer
I already paid yesterday.

AI
Thanks for letting me know. I'll verify the payment status.

SYSTEM
Payment verification requested.

SYSTEM
Payment status: PAID
```

System events should be visually distinct from customer/agent messages.

---

# 23. Voice Call UI

During a live/demo call, show:

```text
Voice Call

Rahul Sharma

● Connected

00:37

Language:
Hindi / Hinglish

Current intent:
Payment commitment

[End Call]
```

Do not show fake waveform/audio visualizations unless they reflect actual audio data.

---

# 24. Voice Call Result

After the call:

```text
Call completed

Duration:
01:42

Outcome:
Payment commitment

Follow-up:
2026-09-20

[View Case]
```

The values must be derived from actual call/workflow results.

---

# 25. WhatsApp UI

Show a familiar conversational layout.

Example:

```text
Rahul Sharma

AI Workforce
"Hello, this is regarding your pending payment..."

Rahul
"I'll pay tomorrow."

AI Workforce
"Thank you. I'll follow up accordingly."
```

The exact generated content should come from the actual agent.

---

# 26. Mock Indicator

Any mocked integration must be visibly identified.

Example:

```text
PAYMENT VERIFICATION
DEMO / MOCK
```

The indicator should not imply that the payment system is a real Paytm production integration.

---

# 27. Real Integration Indicator

For configured real services:

```text
Twilio Voice
● Connected

Gemini
● Connected

Sarvam
● Connected

Cognee
● Connected
```

The status should reflect actual health/configuration.

---

# 28. Escalations Page

The Escalations page is the human-in-the-loop workspace.

Suggested columns:

| Case | Customer | Reason | Priority | Status | Created |
|---|---|---|---|---|---|
| CASE-003 | Neha Singh | Dispute | High | Open | 10m ago |
| CASE-009 | Amit Kumar | Human request | Medium | Assigned | 1h ago |

---

# 29. Escalation Detail

Show:

```text
Why this case was escalated
Customer statement
Conversation summary
Relevant case information
Previous AI actions
Relevant memory
Recommended next step

[Take Over]
[Resolve]
```

The human must be able to understand the case without reading every internal event.

---

# 30. Human Takeover

If supported by the final implementation:

```text
[Take Over]
```

should transition the case into a human-controlled state.

The autonomous agent should stop initiating conflicting actions.

The exact takeover mechanism is TBD.

---

# 31. Activity Page

Activity should show an operational event stream.

Example:

```text
12:41  AI decided to call Rahul
12:42  Call connected
12:43  Customer committed to payment
12:43  Follow-up scheduled
12:44  Memory updated
12:45  Payment verified
12:45  Case closed
```

Events must come from actual audit/workflow records.

---

# 32. Activity Filters

Useful filters:

```text
AI decisions
Customer interactions
Payments
Escalations
Failures
System events
```

---

# 33. Settings Page

Settings may include:

```text
Agent configuration
Communication channels
AI providers
Memory
Workflow
Security
Demo configuration
```

Only expose settings that are actually implemented.

Do not create non-functional configuration controls merely for appearance.

---

# 34. Integration Settings

Display provider status.

Example:

```text
Gemini
Connected

Sarvam
Not configured

Twilio
Connected

Cognee
Connected

n8n
Connected

Payment Provider
Mock
```

A user should be able to distinguish:

```text
Not configured
```

from:

```text
Broken
```

---

# 35. Agent Configuration

Potential configuration:

```text
Agent name
Communication channels
Follow-up behavior
Human escalation behavior
```

Exact configurable policies remain TBD.

Do not expose safety-critical settings unless the backend actually enforces them.

---

# 36. Customer Detail

Customer detail should show:

```text
Customer
Contact information
Open cases
Payment history
Conversations
Commitments
Escalations
Relevant memory
```

Sensitive data should be displayed only to authorized users.

---

# 37. Memory UI

Memory should be visible enough to demonstrate Cognee's role but should not overwhelm the user.

Example:

```text
Relevant AI Memory

• Customer previously requested a follow-up on Friday.
• Customer prefers Hindi communication.

Source:
Previous conversation

Last observed:
Today
```

Memory should be distinguishable from authoritative payment data.

---

# 38. Memory vs Facts

The UI should clearly distinguish:

```text
Verified fact
Customer statement
AI memory
AI decision
```

Example:

```text
Payment:
NOT PAID
Source: Payment system

Customer claim:
"I already paid."
Source: Customer

Memory:
Customer previously requested follow-up.
Source: Previous conversation
```

---

# 39. Timeline

Each case should have a chronological timeline.

Example:

```text
09:00  Case created
09:01  AI evaluated case
09:01  WhatsApp approved
09:02  WhatsApp sent
09:08  Customer replied
09:08  AI detected commitment
09:09  Follow-up scheduled
```

This is one of the most important trust features.

---

# 40. Trust UX

The interface should make autonomy understandable.

Whenever an external action occurs, the UI should make clear:

```text
WHAT happened?
WHY?
WAS it allowed?
WHAT happened afterward?
```

Example:

```text
AI called customer
Reason:
No response to previous message.

Policy:
Approved

Outcome:
Customer requested 3 additional days.
```

---

# 41. Human Control

The merchant should always have a clear mechanism to:

- Pause the agent.
- Pause a case where supported.
- Escalate.
- Take over.
- Review actions.
- Inspect failures.

The exact controls depend on implemented backend capabilities.

---

# 42. Error States

The UI must explicitly represent errors.

Example:

```text
Voice unavailable

Twilio could not start the call.

No customer contact was recorded.

[Retry] [View Details]
```

Do not display:

```text
Call completed
```

after a failed provider operation.

---

# 43. Provider Warning

Example:

```text
Sarvam is not configured.

Voice speech processing is unavailable.

[Configure]
```

If configuration cannot be performed from the UI:

```text
Sarvam is not configured.
Set the required environment configuration.
```

---

# 44. Empty States

Empty states should explain what to do next.

Example:

```text
No escalations

The AI employee has not requested human assistance yet.
```

Cases:

```text
No collection cases

Add/import demo cases to start the AI employee.
```

---

# 45. Loading States

Use loading states for actual network operations.

Examples:

```text
Loading cases...
Loading conversation...
Starting call...
Verifying payment...
```

Do not use long artificial delays to simulate AI work.

---

# 46. Toasts / Notifications

Use concise operational notifications.

Examples:

```text
Collections started.
Case escalated.
Payment verified.
Call completed.
Workflow failed.
```

Avoid excessive notifications.

---

# 47. Accessibility

The UI should support:

- Keyboard navigation.
- Clear focus states.
- Readable contrast.
- Semantic buttons.
- Labels for form fields.
- Screen-reader-friendly structure where practical.

Do not rely on color alone to communicate status.

---

# 48. Responsive Design

The MVP should work on:

```text
Desktop
Tablet
Mobile
```

The primary demo experience is desktop.

The most important operational screens should remain usable at narrower widths.

---

# 49. Mobile Priority

On mobile, prioritize:

```text
Case status
AI action
Customer
Amount
Next action
Escalation
```

Secondary audit information can be collapsed.

---

# 50. Navigation Behavior

Navigation should preserve operational context.

For example:

```text
Cases
 ↓
Case detail
 ↓
Conversation
 ↓
Back to case
```

Do not unnecessarily reset filters or selected cases.

---

# 51. Real-Time Updates

Where practical, the dashboard should update when important events occur.

Examples:

```text
Call connected
Customer replied
Payment verified
Escalation created
Case closed
```

The exact real-time implementation is TBD.

Polling may be used for the MVP if it is simpler and reliable.

---

# 52. No Fake Real-Time

If the system uses polling rather than WebSockets:

Do not present simulated real-time behavior as WebSocket/live streaming.

The UI should simply refresh actual backend state.

---

# 53. Demo Mode

The demo should make the autonomous workflow visually obvious.

Suggested demo flow:

```text
Start Collections
      ↓
Cases begin processing
      ↓
AI decisions appear
      ↓
WhatsApp/Voice action
      ↓
Customer response
      ↓
Decision updates
      ↓
Payment verification
      ↓
Case closes
```

The UI should show actual state transitions.

---

# 54. Demo Scenario Selector

A controlled demo environment may provide scenarios such as:

```text
1. Customer will pay tomorrow
2. Customer already paid
3. Customer disputes invoice
4. Customer requests human
5. Customer cannot pay
6. Customer does not answer
```

These scenarios must be clearly labelled as synthetic/demo scenarios.

---

# 55. Demo Scenario Execution

Selecting a scenario should create or load deterministic test data.

Example:

```text
Scenario:
Already Paid

Customer:
Rahul Sharma

Expected:
Customer claims payment
        ↓
Payment verification
        ↓
Mock API = PAID
        ↓
Case closes
```

The scenario must use the actual application workflow rather than a UI-only animation.

---

# 56. Agent Activity Visualization

The UI may show:

```text
THINKING
VALIDATING
ACTING
WAITING
VERIFYING
ESCALATED
```

These labels should map to actual backend states.

Avoid implying private chain-of-thought when showing `THINKING`.

A safer label is:

```text
Evaluating case
```

---

# 57. Action Detail Drawer

Clicking an activity item can open:

```text
Action: CALL
Case: CASE-001
Reason: ...
Policy: APPROVED
Provider: Twilio
Status: SUCCESS
Reference: ...
```

Sensitive provider data should be masked where appropriate.

---

# 58. Audit Detail

Authorized users may inspect:

```text
Decision
Policy result
Action
Provider result
Timestamp
Correlation ID
```

The UI must not expose secrets.

---

# 59. Customer Communication Preview

Before an approved message is sent, where the workflow requires human review, show:

```text
Channel:
WhatsApp

Recipient:
Masked number

Message:
...

[Approve] [Reject]
```

For fully autonomous actions, the preview may be informational after execution.

Do not add human approval to the autonomous flow unless the backend actually requires it.

---

# 60. Status Vocabulary

Use consistent labels:

```text
AI ACTIVE
PAUSED
WAITING
CALLING
MESSAGING
VERIFYING
ESCALATED
PAID
CLOSED
FAILED
```

The frontend should map these from backend states rather than maintaining independent business logic.

---

# 61. Color Usage

Color should reinforce status, not define it.

For example:

```text
Status icon + label
```

rather than:

```text
Only green/red
```

The final color palette is a design-system decision.

---

# 62. Typography

Use a modern, highly readable sans-serif font.

The exact font is TBD.

Recommended hierarchy:

```text
H1 — Page title
H2 — Section title
H3 — Card/operation title
Body — Main information
Caption — Metadata
```

Avoid excessive typography variations.

---

# 63. Components

Recommended reusable components:

```text
AgentStatusBadge
CaseStatusBadge
MetricCard
CaseTable
CaseCard
ConversationThread
MessageBubble
Timeline
DecisionCard
ActionCard
EscalationCard
ProviderStatus
MockBadge
ConfirmDialog
ErrorBanner
EmptyState
```

The exact component library is TBD.

---

# 64. Frontend State

The frontend should treat backend state as authoritative.

Example:

```text
Backend:
CASE = PAID

Frontend:
must show PAID
```

The frontend must not independently conclude:

```text
Customer said "I paid"
→
CASE = PAID
```

---

# 65. Optimistic UI

Optimistic updates should be avoided for financially or operationally significant state changes unless rollback is implemented correctly.

For example:

```text
Start Collections
```

should show the action as pending until the backend confirms it.

---

# 66. Security UX

The UI should:

- Mask sensitive contact information where appropriate.
- Never expose API credentials.
- Avoid rendering raw provider secrets.
- Respect merchant/user permissions.
- Clearly identify demo/mock data.

---

# 67. Authentication UX

If authentication is implemented:

```text
Login
 ↓
Authenticated session
 ↓
Merchant workspace
```

Unauthorized users should not access case/customer data.

Exact authentication provider is TBD.

---

# 68. Performance

The interface should prioritize fast loading for:

- Overview.
- Cases.
- Case detail.

Large conversations and audit histories should be paginated or incrementally loaded where needed.

---

# 69. Error Recovery UX

When an operation fails:

```text
What happened
Why it failed if known
Whether customer contact occurred
What happens next
Available recovery action
```

Example:

```text
Call failed

Twilio did not establish the call.
No successful customer contact was recorded.

The case will be re-evaluated.

[Retry]
```

---

# 70. UI Acceptance Criteria

The UI is complete when:

1. A merchant can authenticate if authentication is implemented.
2. The merchant can see agent status.
3. The merchant can start autonomous collections.
4. Eligible cases are visible.
5. AI decisions are visible.
6. Actions and outcomes are visible.
7. Conversations are inspectable.
8. Voice interactions have a usable interface.
9. WhatsApp interactions are inspectable.
10. Escalations are actionable.
11. Mocked functionality is clearly labelled.
12. Failures are visible and truthful.
13. The merchant can pause/resume where implemented.
14. Case timelines are reconstructable.
15. No UI element claims an action succeeded without backend confirmation.
16. The frontend does not contain provider secrets.

---

# 71. UI Anti-Patterns

Do not build:

- A generic ChatGPT-style home screen.
- A fake AI chat interface as the primary product.
- Static charts with invented data.
- Fake live activity.
- Fake call animations.
- Fake payment confirmations.
- Decorative AI dashboards without real workflow state.
- Buttons that do nothing.
- Settings that do not affect backend behavior.

Every important interactive element should either work or be clearly marked as planned/TBD.

---

# 72. Final UX Architecture

```text
                 MERCHANT
                    │
                    ↓
            ┌───────────────┐
            │    Overview   │
            └───────┬───────┘
                    ↓
             AI Workforce
                    │
       ┌────────────┼────────────┐
       ↓            ↓            ↓
     Cases      Activity    Escalations
       │
       ↓
  Case Detail
       │
  ┌────┼─────────┐
  ↓    ↓         ↓
AI   Conversation Timeline
Decision
  │
  ↓
Actions
  │
  ↓
Outcomes
```

---

# 73. Final UX Principle

The interface should make autonomous work understandable.

The merchant should be able to look at a case and immediately understand:

```text
WHAT IS HAPPENING?
WHY DID THE AI DO IT?
WHAT DID THE CUSTOMER SAY?
WHAT HAPPENED AFTERWARD?
WHAT WILL HAPPEN NEXT?
DO I NEED TO INTERVENE?
```

The product should feel like a **supervised AI workforce**, not a chatbot with a dashboard attached.
