import pytest
from datetime import datetime, timezone, timedelta
from zoneinfo import ZoneInfo
from backend.app.schemas.schemas import ActionType, Channel
from backend.app.models.models import CollectionCase, AgentSetting, Action
from backend.app.policies.engine import policy_engine


def make_case(status: str = "NEW") -> CollectionCase:
    return CollectionCase(
        id="case_policy_test",
        merchant_id="merch_test",
        customer_id="cust_test",
        invoice_id="inv_test",
        status=status,
        outstanding_amount=5000.0,
    )


def test_contact_hours_policy():
    case = make_case()
    settings = AgentSetting(
        merchant_id="merch_test",
        agent_status="ACTIVE",
        contact_start_hour=9,
        contact_end_hour=19,
    )

    # 14:00 IST (08:30 UTC) -> should be allowed
    tz_ist = ZoneInfo("Asia/Kolkata")
    dt_daytime = datetime(2026, 10, 15, 14, 0, 0, tzinfo=tz_ist)
    result = policy_engine.evaluate(
        case=case,
        action_type=ActionType.TEXT,
        channel=Channel.WHATSAPP,
        settings=settings,
        now=dt_daytime,
    )
    assert result.is_allowed is True

    # 22:00 IST (16:30 UTC) -> outside hours, should be blocked
    dt_night = datetime(2026, 10, 15, 22, 0, 0, tzinfo=tz_ist)
    result = policy_engine.evaluate(
        case=case,
        action_type=ActionType.CALL,
        channel=Channel.VOICE,
        settings=settings,
        now=dt_night,
    )
    assert result.is_allowed is False
    assert "outside allowable contact hours" in result.reason
    assert result.suggested_backoff_hours is not None


def test_frequency_limit_policy():
    case = make_case()
    settings = AgentSetting(
        merchant_id="merch_test",
        agent_status="ACTIVE",
        contact_start_hour=9,
        contact_end_hour=19,
        max_contact_attempts=2,
    )
    now = datetime(2026, 10, 15, 12, 0, 0, tzinfo=timezone.utc)

    # 2 actions already taken today
    recent = [
        Action(
            id="a1",
            case_id=case.id,
            action_type="TEXT",
            idempotency_key="k1",
            requested_at=now - timedelta(hours=6),
        ),
        Action(
            id="a2",
            case_id=case.id,
            action_type="CALL",
            idempotency_key="k2",
            requested_at=now - timedelta(hours=1),
        ),
    ]

    result = policy_engine.evaluate(
        case=case,
        action_type=ActionType.TEXT,
        channel=Channel.WHATSAPP,
        recent_actions=recent,
        settings=settings,
        now=now,
    )
    assert result.is_allowed is False
    assert "Max allowed: 2" in result.reason


def test_dispute_protection_policy():
    disputed_case = make_case(status="DISPUTED")
    settings = AgentSetting(merchant_id="merch_test", agent_status="ACTIVE")

    # Outbound contact to disputed case must be blocked
    result = policy_engine.evaluate(
        case=disputed_case,
        action_type=ActionType.TEXT,
        channel=Channel.WHATSAPP,
        settings=settings,
    )
    assert result.is_allowed is False
    assert "DISPUTE" in result.reason
    assert result.requires_human_approval is True

    # Passive action like WAIT or ESCALATE is allowed
    result_escalate = policy_engine.evaluate(
        case=disputed_case,
        action_type=ActionType.ESCALATE,
        settings=settings,
    )
    assert result_escalate.is_allowed is True


def test_settlement_authority_policy():
    case = make_case()
    settings = AgentSetting(merchant_id="merch_test", agent_status="ACTIVE")
    now = datetime(2026, 10, 15, 12, 0, 0, tzinfo=ZoneInfo("Asia/Kolkata"))

    # 10% discount is within autonomous cap
    res_10 = policy_engine.evaluate(
        case=case,
        action_type=ActionType.TEXT,
        channel=Channel.WHATSAPP,
        settings=settings,
        discount_pct=10.0,
        now=now,
    )
    assert res_10.is_allowed is True
    assert res_10.requires_human_approval is False

    # 15% discount exceeds autonomous cap, requires manager review
    res_15 = policy_engine.evaluate(
        case=case,
        action_type=ActionType.TEXT,
        channel=Channel.WHATSAPP,
        settings=settings,
        discount_pct=15.0,
        now=now,
    )
    assert res_15.requires_human_approval is True
    assert "exceeds autonomous policy cap" in res_15.reason


def test_agent_paused_mode_policy():
    case = make_case()
    settings = AgentSetting(merchant_id="merch_test", agent_status="PAUSED")

    result = policy_engine.evaluate(
        case=case,
        action_type=ActionType.TEXT,
        channel=Channel.WHATSAPP,
        settings=settings,
    )
    assert result.is_allowed is False
    assert "PAUSED" in result.reason
