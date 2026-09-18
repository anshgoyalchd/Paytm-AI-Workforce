from typing import List, Optional
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.core.database import get_db
from backend.app.core.security import get_current_user_context, CurrentUserContext
from backend.app.models.models import Escalation, CollectionCase
from backend.app.schemas.schemas import EscalationRead, EscalationResolve

router = APIRouter(prefix="/escalations", tags=["Escalations"])


@router.get("", response_model=List[EscalationRead])
async def list_escalations(
    status_filter: Optional[str] = Query(None, alias="status"),
    current_user: CurrentUserContext = Depends(get_current_user_context),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Escalation)
        .join(CollectionCase, Escalation.case_id == CollectionCase.id)
        .where(CollectionCase.merchant_id == current_user.merchant_id)
        .order_by(Escalation.created_at.desc())
    )
    if status_filter:
        stmt = stmt.where(Escalation.status == status_filter)

    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/{escalation_id}/resolve")
async def resolve_escalation(
    escalation_id: str,
    payload: EscalationResolve,
    current_user: CurrentUserContext = Depends(get_current_user_context),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Escalation)
        .join(CollectionCase, Escalation.case_id == CollectionCase.id)
        .where(
            Escalation.id == escalation_id,
            CollectionCase.merchant_id == current_user.merchant_id,
        )
    )
    result = await db.execute(stmt)
    escalation = result.scalar_one_or_none()
    if not escalation:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Escalation not found")

    escalation.status = payload.status
    escalation.resolution = payload.resolution
    escalation.assigned_user_id = current_user.user_id
    escalation.resolved_at = datetime.now(timezone.utc)
    await db.commit()

    return {"status": "SUCCESS", "escalation_id": escalation.id, "resolved_at": escalation.resolved_at}
