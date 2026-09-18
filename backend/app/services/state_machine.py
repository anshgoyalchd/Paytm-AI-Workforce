from datetime import datetime, timezone
from typing import Optional, Set, Dict
from backend.app.schemas.schemas import CaseStatus
from backend.app.models.models import CollectionCase


class InvalidStateTransitionError(Exception):
    def __init__(self, from_status: str, to_status: str, reason: str):
        self.from_status = from_status
        self.to_status = to_status
        self.reason = reason
        super().__init__(f"Cannot transition case from {from_status} to {to_status}: {reason}")


class CaseStateMachine:
    """
    Deterministic State Machine governing CollectionCase lifecycle.
    Guarantees strict auditability, legal state paths, and guard condition checks.
    """

    # Allowed transitions graph
    ALLOWED_TRANSITIONS: Dict[CaseStatus, Set[CaseStatus]] = {
        CaseStatus.NEW: {
            CaseStatus.CONTACT_ATTEMPTED,
            CaseStatus.CONTACTED,
            CaseStatus.PAYMENT_PENDING,
            CaseStatus.SETTLED,
            CaseStatus.ESCALATED,
            CaseStatus.DISPUTED,
            CaseStatus.CLOSED,
        },
        CaseStatus.CONTACT_ATTEMPTED: {
            CaseStatus.CONTACT_ATTEMPTED,  # Multiple attempts allowed up to policy limit
            CaseStatus.CONTACTED,
            CaseStatus.ESCALATED,
            CaseStatus.DISPUTED,
            CaseStatus.CLOSED,
        },
        CaseStatus.CONTACTED: {
            CaseStatus.PROMISE_TO_PAY,
            CaseStatus.DISPUTED,
            CaseStatus.ESCALATED,
            CaseStatus.PAYMENT_PENDING,
            CaseStatus.SETTLED,
            CaseStatus.CLOSED,
        },
        CaseStatus.PROMISE_TO_PAY: {
            CaseStatus.CONTACT_ATTEMPTED,  # If promise broken and follow-up initiated
            CaseStatus.CONTACTED,
            CaseStatus.PAYMENT_PENDING,
            CaseStatus.SETTLED,
            CaseStatus.DISPUTED,
            CaseStatus.ESCALATED,
            CaseStatus.CLOSED,
        },
        CaseStatus.DISPUTED: {
            CaseStatus.ESCALATED,
            CaseStatus.CONTACTED,  # Once dispute is resolved by human
            CaseStatus.SETTLED,
            CaseStatus.CLOSED,
        },
        CaseStatus.PAYMENT_PENDING: {
            CaseStatus.SETTLED,       # Payment verified as PAID
            CaseStatus.CONTACTED,     # Payment failed / rejected
            CaseStatus.ESCALATED,
            CaseStatus.CLOSED,
        },
        CaseStatus.ESCALATED: {
            CaseStatus.CONTACTED,     # De-escalated back to agent by human manager
            CaseStatus.SETTLED,       # Resolved & settled manually
            CaseStatus.CLOSED,        # Written off or closed by manager
        },
        CaseStatus.SETTLED: {
            CaseStatus.CLOSED,        # Terminal finalization
        },
        CaseStatus.CLOSED: set(),     # Terminal state: no outgoing transitions allowed
    }

    @classmethod
    def can_transition(cls, current_status: CaseStatus, target_status: CaseStatus) -> bool:
        if current_status == target_status:
            return True  # Idempotent no-op
        allowed = cls.ALLOWED_TRANSITIONS.get(current_status, set())
        return target_status in allowed

    @classmethod
    def transition(
        cls,
        case: CollectionCase,
        target_status: CaseStatus,
        guard_context: Optional[dict] = None,
    ) -> CollectionCase:
        guard_context = guard_context or {}
        current = CaseStatus(case.status)

        if current == target_status:
            return case  # Already in target state

        if not cls.can_transition(current, target_status):
            raise InvalidStateTransitionError(
                from_status=current.value,
                to_status=target_status.value,
                reason=f"Transition from {current.value} to {target_status.value} is forbidden by state machine rules.",
            )

        # Evaluate guards
        cls._evaluate_guards(current, target_status, guard_context)

        # Apply transition
        case.status = target_status.value
        case.version = (case.version or 1) + 1
        case.updated_at = datetime.now(timezone.utc)

        if target_status in (CaseStatus.SETTLED, CaseStatus.CLOSED):
            case.closed_at = datetime.now(timezone.utc)
            if target_status == CaseStatus.SETTLED:
                case.outstanding_amount = 0.0

        return case

    @classmethod
    def _evaluate_guards(
        cls,
        current: CaseStatus,
        target: CaseStatus,
        context: dict,
    ) -> None:
        # Guard: To SETTLED requires payment_status == PAID
        if target == CaseStatus.SETTLED:
            payment_status = context.get("payment_status")
            if payment_status != "PAID":
                raise InvalidStateTransitionError(
                    from_status=current.value,
                    to_status=target.value,
                    reason=f"Cannot transition to SETTLED without verified payment status 'PAID' (current: {payment_status})",
                )

        # Guard: To PROMISE_TO_PAY requires commitment date
        if target == CaseStatus.PROMISE_TO_PAY:
            commitment_date = context.get("commitment_date")
            if not commitment_date:
                raise InvalidStateTransitionError(
                    from_status=current.value,
                    to_status=target.value,
                    reason="Cannot transition to PROMISE_TO_PAY without a valid commitment date.",
                )

        # Guard: To DISPUTED requires a dispute reason or category
        if target == CaseStatus.DISPUTED:
            dispute_reason = context.get("dispute_reason")
            if not dispute_reason:
                raise InvalidStateTransitionError(
                    from_status=current.value,
                    to_status=target.value,
                    reason="Cannot transition to DISPUTED without a valid dispute reason.",
                )

        # Guard: To ESCALATED requires an escalation reason
        if target == CaseStatus.ESCALATED:
            escalation_reason = context.get("escalation_reason")
            if not escalation_reason:
                raise InvalidStateTransitionError(
                    from_status=current.value,
                    to_status=target.value,
                    reason="Cannot transition to ESCALATED without an escalation reason.",
                )
