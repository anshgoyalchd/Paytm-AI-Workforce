import hashlib
from datetime import datetime, timezone
from typing import Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.models.models import Action, CollectionCase
from backend.app.schemas.schemas import ActionType, Channel, CaseStatus


class StaleCaseStateError(Exception):
    def __init__(self, current_status: str, expected_status: str):
        super().__init__(
            f"Case state changed from '{expected_status}' to '{current_status}'. Execution aborted to prevent stale action."
        )


class DuplicateActionError(Exception):
    def __init__(self, key: str, existing_action_id: str):
        super().__init__(
            f"Action with idempotency key '{key}' already exists (ID: {existing_action_id}). Execution suppressed."
        )


class IdempotencyService:
    """
    Guarantees that no duplicate actions are executed and prevents
    stale action execution against modified case states.
    """

    @staticmethod
    def generate_key(
        case_id: str,
        action_type: ActionType,
        channel: Optional[Channel] = None,
        qualifier: Optional[str] = None,
    ) -> str:
        """
        Generates a deterministic idempotency key.
        Qualifier defaults to current UTC date (YYYY-MM-DD) if none given,
        ensuring daily channel touches have unique keys.
        """
        today_str = qualifier or datetime.now(timezone.utc).strftime("%Y-%m-%d-%H")
        channel_str = channel.value if channel else "SYSTEM"
        raw = f"{case_id}:{action_type.value}:{channel_str}:{today_str}"
        return hashlib.sha256(raw.encode("utf-8")).hexdigest()

    @staticmethod
    async def get_existing_action(
        session: AsyncSession,
        idempotency_key: str,
    ) -> Optional[Action]:
        stmt = select(Action).where(Action.idempotency_key == idempotency_key)
        result = await session.execute(stmt)
        return result.scalar_one_or_none()

    @staticmethod
    async def validate_and_lock_action(
        session: AsyncSession,
        case_id: str,
        action_type: ActionType,
        expected_status: Optional[CaseStatus] = None,
        channel: Optional[Channel] = None,
        idempotency_key: Optional[str] = None,
        decision_id: Optional[str] = None,
    ) -> Tuple[Action, CollectionCase]:
        # 1. Fresh fetch of case from database
        case_stmt = select(CollectionCase).where(CollectionCase.id == case_id)
        case_res = await session.execute(case_stmt)
        case = case_res.scalar_one_or_none()
        if not case:
            raise ValueError(f"Case {case_id} not found.")

        # Stale state protection
        if expected_status and case.status != expected_status.value:
            raise StaleCaseStateError(current_status=case.status, expected_status=expected_status.value)

        # Terminal state protection
        if case.status in (CaseStatus.SETTLED.value, CaseStatus.CLOSED.value):
            raise StaleCaseStateError(current_status=case.status, expected_status="ACTIVE")

        # 2. Key generation & duplicate check
        key = idempotency_key or IdempotencyService.generate_key(case_id, action_type, channel)
        existing = await IdempotencyService.get_existing_action(session, key)
        if existing:
            raise DuplicateActionError(key=key, existing_action_id=existing.id)

        # 3. Create action record in CREATED state
        action = Action(
            case_id=case.id,
            decision_id=decision_id,
            action_type=action_type.value,
            channel=channel.value if channel else None,
            status="CREATED",
            idempotency_key=key,
            requested_at=datetime.now(timezone.utc),
        )
        session.add(action)
        await session.flush()

        return action, case
