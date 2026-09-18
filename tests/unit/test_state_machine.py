import pytest
from datetime import datetime, timezone, date
from backend.app.schemas.schemas import CaseStatus
from backend.app.models.models import CollectionCase
from backend.app.services.state_machine import CaseStateMachine, InvalidStateTransitionError


def create_mock_case(status: str = "NEW") -> CollectionCase:
    return CollectionCase(
        id="test_case_1",
        merchant_id="test_merchant",
        customer_id="test_customer",
        invoice_id="test_invoice",
        status=status,
        outstanding_amount=1000.0,
        version=1,
    )


def test_allowed_transitions():
    case = create_mock_case("NEW")

    # NEW -> CONTACT_ATTEMPTED
    CaseStateMachine.transition(case, CaseStatus.CONTACT_ATTEMPTED)
    assert case.status == CaseStatus.CONTACT_ATTEMPTED.value
    assert case.version == 2

    # CONTACT_ATTEMPTED -> CONTACTED
    CaseStateMachine.transition(case, CaseStatus.CONTACTED)
    assert case.status == CaseStatus.CONTACTED.value
    assert case.version == 3

    # CONTACTED -> PROMISE_TO_PAY (with guard)
    CaseStateMachine.transition(
        case,
        CaseStatus.PROMISE_TO_PAY,
        guard_context={"commitment_date": date(2026, 10, 1)},
    )
    assert case.status == CaseStatus.PROMISE_TO_PAY.value
    assert case.version == 4

    # PROMISE_TO_PAY -> PAYMENT_PENDING
    CaseStateMachine.transition(case, CaseStatus.PAYMENT_PENDING)
    assert case.status == CaseStatus.PAYMENT_PENDING.value

    # PAYMENT_PENDING -> SETTLED (with guard payment_status == PAID)
    CaseStateMachine.transition(
        case,
        CaseStatus.SETTLED,
        guard_context={"payment_status": "PAID"},
    )
    assert case.status == CaseStatus.SETTLED.value
    assert case.outstanding_amount == 0.0
    assert case.closed_at is not None

    # SETTLED -> CLOSED
    CaseStateMachine.transition(case, CaseStatus.CLOSED)
    assert case.status == CaseStatus.CLOSED.value


def test_forbidden_transitions():
    # CLOSED is terminal
    closed_case = create_mock_case("CLOSED")
    with pytest.raises(InvalidStateTransitionError):
        CaseStateMachine.transition(closed_case, CaseStatus.CONTACTED)

    # NEW cannot jump directly to SETTLED without verification
    new_case = create_mock_case("NEW")
    with pytest.raises(InvalidStateTransitionError):
        CaseStateMachine.transition(new_case, CaseStatus.SETTLED)


def test_guards_enforcement():
    case = create_mock_case("CONTACTED")

    # Promise to pay without commitment date must fail
    with pytest.raises(InvalidStateTransitionError) as exc_info:
        CaseStateMachine.transition(case, CaseStatus.PROMISE_TO_PAY)
    assert "commitment date" in str(exc_info.value)

    # Dispute without reason must fail
    with pytest.raises(InvalidStateTransitionError) as exc_info:
        CaseStateMachine.transition(case, CaseStatus.DISPUTED)
    assert "dispute reason" in str(exc_info.value)

    # Escalation without reason must fail
    with pytest.raises(InvalidStateTransitionError) as exc_info:
        CaseStateMachine.transition(case, CaseStatus.ESCALATED)
    assert "escalation reason" in str(exc_info.value)

    # Settlement with payment_status != PAID must fail
    payment_pending_case = create_mock_case("PAYMENT_PENDING")
    with pytest.raises(InvalidStateTransitionError) as exc_info:
        CaseStateMachine.transition(
            payment_pending_case,
            CaseStatus.SETTLED,
            guard_context={"payment_status": "PENDING"},
        )
    assert "PAID" in str(exc_info.value)
