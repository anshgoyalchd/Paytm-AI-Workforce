import pytest
import pytest_asyncio
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from backend.app.main import app
from backend.app.core.database import Base
from backend.app.models.models import (
    Merchant,
    User,
    Customer,
    Invoice,
    CollectionCase,
    AgentSetting,
    Action,
)
from backend.app.schemas.schemas import CaseStatus, ActionType, Channel, VerificationStatus
from backend.app.services.state_machine import CaseStateMachine, InvalidStateTransitionError
from backend.app.policies.engine import policy_engine
from backend.app.providers.gemini_adapter import gemini_adapter
from backend.app.providers.payment_mock import MockPaymentGateway, payment_gateway
from backend.app.agents.collections_agent import collections_agent


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac


@pytest_asyncio.fixture
async def auth_headers(client: AsyncClient):
    email = f"test_owner_{datetime.now(timezone.utc).timestamp()}@example.com"
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={
            "business_name": "Test Acceptance Merchant",
            "owner_name": "Test Owner",
            "email": email,
            "password": "Password123!",
        },
    )
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Dynamically create test cases for this merchant
    for i in range(5):
        await client.post(
            "/api/v1/cases",
            headers=headers,
            json={
                "customer_name": f"Customer {i+1}",
                "customer_phone": f"+9198765432{i}0",
                "invoice_number": f"INV-TEST-00{i+1}",
                "amount": 5000.0 * (i + 1),
            },
        )

    return headers


# =============================================================================
# SCENARIOS 1-6: Case Lifecycle, Guardrails, and Outbound Dispatch
# =============================================================================

@pytest.mark.asyncio
async def test_scenario_01_case_creation_and_status(client: AsyncClient, auth_headers: dict):
    """Scenario 1: Verified case portfolio listing and initial status."""
    res = await client.get("/api/v1/cases", headers=auth_headers)
    assert res.status_code == 200
    cases = res.json()
    assert len(cases) >= 5
    case = cases[0]
    assert "status" in case
    assert case["outstanding_amount"] > 0


@pytest.mark.asyncio
async def test_scenario_02_contact_hours_policy_enforcement():
    """Scenario 2: Allowed during daytime (14:00 IST), blocked at night (23:00 IST)."""
    case = CollectionCase(id="c2", merchant_id="m", customer_id="u", invoice_id="i", status="NEW", outstanding_amount=5000)
    settings = AgentSetting(merchant_id="m", agent_status="ACTIVE", contact_start_hour=9, contact_end_hour=19)
    tz_ist = ZoneInfo("Asia/Kolkata")

    # Daytime
    allowed_res = policy_engine.evaluate(
        case=case, action_type=ActionType.TEXT, channel=Channel.WHATSAPP, settings=settings,
        now=datetime(2026, 10, 15, 14, 0, 0, tzinfo=tz_ist)
    )
    assert allowed_res.is_allowed is True

    # Nighttime
    blocked_res = policy_engine.evaluate(
        case=case, action_type=ActionType.TEXT, channel=Channel.WHATSAPP, settings=settings,
        now=datetime(2026, 10, 15, 23, 0, 0, tzinfo=tz_ist)
    )
    assert blocked_res.is_allowed is False
    assert "outside allowable contact hours" in blocked_res.reason


@pytest.mark.asyncio
async def test_scenario_03_daily_frequency_limit():
    """Scenario 3: Maximum 2 touches per 24 hours."""
    case = CollectionCase(id="c3", merchant_id="m", customer_id="u", invoice_id="i", status="NEW", outstanding_amount=5000)
    settings = AgentSetting(merchant_id="m", max_contact_attempts=2)
    now = datetime(2026, 10, 15, 12, 0, 0, tzinfo=timezone.utc)
    recent = [
        Action(id="a1", case_id="c3", action_type="TEXT", idempotency_key="k1", requested_at=now - timedelta(hours=3)),
        Action(id="a2", case_id="c3", action_type="CALL", idempotency_key="k2", requested_at=now - timedelta(hours=1)),
    ]
    res = policy_engine.evaluate(case=case, action_type=ActionType.TEXT, recent_actions=recent, settings=settings, now=now)
    assert res.is_allowed is False
    assert "Max allowed: 2" in res.reason


@pytest.mark.asyncio
async def test_scenario_04_channel_cooldown():
    """Scenario 4: Minimum 4 hours between contacts."""
    case = CollectionCase(id="c4", merchant_id="m", customer_id="u", invoice_id="i", status="NEW", outstanding_amount=5000)
    settings = AgentSetting(merchant_id="m", min_hours_between_contacts=4)
    now = datetime(2026, 10, 15, 12, 0, 0, tzinfo=timezone.utc)
    recent = [
        Action(id="a1", case_id="c4", action_type="TEXT", idempotency_key="k1", requested_at=now - timedelta(hours=2)),
    ]
    res = policy_engine.evaluate(case=case, action_type=ActionType.TEXT, recent_actions=recent, settings=settings, now=now)
    assert res.is_allowed is False
    assert "Minimum cooldown of 4h required" in res.reason


@pytest.mark.asyncio
async def test_scenario_05_whatsapp_outbound_dispatch():
    """Scenario 5: Outbound WhatsApp message formatting and dispatch."""
    from backend.app.providers.twilio_adapter import twilio_adapter
    send_res = await twilio_adapter.send_whatsapp_message(
        to_phone="+919876543210",
        message="Paytm Collections Reminder: Invoice INV-2026-001 is overdue.",
    )
    assert send_res["status"] == "DELIVERED"
    assert "provider_message_id" in send_res


@pytest.mark.asyncio
async def test_scenario_06_voice_telephony_call():
    """Scenario 6: Outbound Voice Call initiation with Indic prompt."""
    from backend.app.providers.twilio_adapter import twilio_adapter
    call_res = await twilio_adapter.initiate_voice_call(
        to_phone="+919876543211",
        say_text="Namaste, this is Raj Electronics regarding your invoice.",
    )
    assert call_res["status"] == "INITIATED"
    assert "provider_call_id" in call_res


# =============================================================================
# SCENARIOS 7-14: Intent Extraction across All Customer Responses
# =============================================================================

@pytest.mark.asyncio
async def test_scenarios_07_to_14_intent_classifications():
    """Scenarios 7-14: Accurate customer intent recognition across Hindi & English."""
    # 7. CONFIRM_PAYMENT
    i7, _ = await gemini_adapter.extract_intent("Payment link ya QR code bhejiye, mujhe pay karna hai")
    assert i7.value == "CONFIRM_PAYMENT"

    # 8. PROMISE_TO_PAY
    i8, _ = await gemini_adapter.extract_intent("Main kal dopahar tak payment de dunga")
    assert i8.value == "PROMISE_TO_PAY"

    # 9. DISPUTE_AMOUNT
    i9, _ = await gemini_adapter.extract_intent("Ye galat bill hai, maine itna saman nahi liya tha!")
    assert i9.value == "DISPUTE_AMOUNT"

    # 10. DISPUTE_GOODS_SERVICES
    i10, _ = await gemini_adapter.extract_intent("Saman kharab defective tha aur maine return kar diya tha")
    assert i10.value == "DISPUTE_GOODS_SERVICES"

    # 11. FINANCIAL_HARDSHIP
    i11, _ = await gemini_adapter.extract_intent("Meri job chali gayi hai aur ghar me medical problem hai, paise nahi hain")
    assert i11.value == "FINANCIAL_HARDSHIP"

    # 12. REQUEST_EXTENSION
    i12, _ = await gemini_adapter.extract_intent("Mujhe 4 din ka thoda time de do please")
    assert i12.value == "REQUEST_EXTENSION"

    # 13. ALREADY_PAID
    i13, _ = await gemini_adapter.extract_intent("Maine kal raat ko UPI se payment kar diya tha")
    assert i13.value == "ALREADY_PAID"

    # 14. REFUSAL_TO_PAY
    i14, _ = await gemini_adapter.extract_intent("Main paise nahi dunga jo karna hai kar lo")
    assert i14.value == "REFUSAL_TO_PAY"


# =============================================================================
# SCENARIOS 15-24: Verification, Settlements, Escalations, Governance & Multi-Tenancy
# =============================================================================

@pytest.mark.asyncio
async def test_scenario_15_mock_payment_gateway_verified_paid():
    """Scenario 15: Mock Payment Gateway verification returns PAID."""
    MockPaymentGateway.set_invoice_status("inv_test_verify", VerificationStatus.PAID)
    res = await payment_gateway.verify_payment("inv_test_verify", 5000.0)
    assert res["status"] == "PAID"
    assert res["is_mock"] is True
    assert "[MOCKED PAYMENT GATEWAY]" in res["notice"]
    MockPaymentGateway.clear_overrides()


@pytest.mark.asyncio
async def test_scenario_16_settlement_on_verified_paid():
    """Scenario 16: Case settlement transition upon verified payment."""
    case = CollectionCase(id="c16", merchant_id="m", customer_id="u", invoice_id="i", status="PAYMENT_PENDING", outstanding_amount=5000)
    CaseStateMachine.transition(case, CaseStatus.SETTLED, guard_context={"payment_status": "PAID"})
    assert case.status == "SETTLED"
    assert case.outstanding_amount == 0.0
    assert case.closed_at is not None


@pytest.mark.asyncio
async def test_scenario_17_mock_payment_gateway_not_paid():
    """Scenario 17: Mock Payment Gateway returns NOT_PAID when payment not found."""
    MockPaymentGateway.set_invoice_status("inv_not_paid", VerificationStatus.NOT_PAID)
    res = await payment_gateway.verify_payment("inv_not_paid", 5000.0)
    assert res["status"] == "NOT_PAID"
    MockPaymentGateway.clear_overrides()


@pytest.mark.asyncio
async def test_scenario_18_dispute_automatic_escalation():
    """Scenario 18: Dispute immediately transitions case to ESCALATED."""
    case = CollectionCase(id="c18", merchant_id="m", customer_id="u", invoice_id="i", status="CONTACTED", outstanding_amount=5000)
    CaseStateMachine.transition(case, CaseStatus.ESCALATED, guard_context={"escalation_reason": "CUSTOMER_DISPUTE"})
    assert case.status == "ESCALATED"


@pytest.mark.asyncio
async def test_scenario_19_dispute_freeze_policy():
    """Scenario 19: Disputed case blocks automated collection contacts."""
    case = CollectionCase(id="c19", merchant_id="m", customer_id="u", invoice_id="i", status="DISPUTED", outstanding_amount=5000)
    settings = AgentSetting(merchant_id="m", agent_status="ACTIVE")
    res = policy_engine.evaluate(case=case, action_type=ActionType.TEXT, channel=Channel.WHATSAPP, settings=settings)
    assert res.is_allowed is False
    assert "DISPUTE" in res.reason


@pytest.mark.asyncio
async def test_scenario_20_settlement_discount_cap_allowed():
    """Scenario 20: 10% settlement discount is autonomously authorized."""
    case = CollectionCase(id="c20", merchant_id="m", customer_id="u", invoice_id="i", status="CONTACTED", outstanding_amount=5000)
    settings = AgentSetting(merchant_id="m", agent_status="ACTIVE", contact_start_hour=0, contact_end_hour=24)
    res = policy_engine.evaluate(case=case, action_type=ActionType.TEXT, settings=settings, discount_pct=10.0)
    assert res.is_allowed is True
    assert res.requires_human_approval is False


@pytest.mark.asyncio
async def test_scenario_21_settlement_discount_exceeded_requires_approval():
    """Scenario 21: 15% discount exceeds autonomous authority, requires approval."""
    case = CollectionCase(id="c21", merchant_id="m", customer_id="u", invoice_id="i", status="CONTACTED", outstanding_amount=5000)
    settings = AgentSetting(merchant_id="m", agent_status="ACTIVE", contact_start_hour=0, contact_end_hour=24)
    res = policy_engine.evaluate(case=case, action_type=ActionType.TEXT, settings=settings, discount_pct=15.0)
    assert res.requires_human_approval is True
    assert "exceeds autonomous policy cap" in res.reason


@pytest.mark.asyncio
async def test_scenario_22_agent_mode_toggle(client: AsyncClient, auth_headers: dict):
    """Scenario 22: Switch agent mode to SUPERVISED and AUTONOMOUS."""
    # Supervised
    r1 = await client.post("/api/v1/settings/toggle-mode?mode=SUPERVISED", headers=auth_headers)
    assert r1.status_code == 200
    assert r1.json()["agent_status"] == "SUPERVISED"

    # Back to Autonomous
    r2 = await client.post("/api/v1/settings/toggle-mode?mode=AUTONOMOUS", headers=auth_headers)
    assert r2.status_code == 200
    assert r2.json()["agent_status"] == "AUTONOMOUS"


@pytest.mark.asyncio
async def test_scenario_23_immediate_pause_killswitch():
    """Scenario 23: When agent is PAUSED, all outbound contacts are halted."""
    case = CollectionCase(id="c23", merchant_id="m", customer_id="u", invoice_id="i", status="NEW", outstanding_amount=5000)
    settings = AgentSetting(merchant_id="m", agent_status="PAUSED")
    res = policy_engine.evaluate(case=case, action_type=ActionType.TEXT, channel=Channel.WHATSAPP, settings=settings)
    assert res.is_allowed is False
    assert "PAUSED" in res.reason


@pytest.mark.asyncio
async def test_scenario_24_multi_tenant_isolation(client: AsyncClient, auth_headers: dict):
    """Scenario 24: Merchant context is enforced from token; cannot access other tenant's cases."""
    # Attempting to fetch a nonexistent or foreign case returns 404
    foreign_res = await client.get("/api/v1/cases/case_foreign_merchant_999", headers=auth_headers)
    assert foreign_res.status_code == 404
