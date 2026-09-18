from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.core.database import get_db
from backend.app.core.security import get_current_user_context, CurrentUserContext
from backend.app.models.models import Decision, CollectionCase
from backend.app.schemas.schemas import DecisionRead

router = APIRouter(prefix="/decisions", tags=["Decisions"])


@router.get("", response_model=List[DecisionRead])
async def list_decisions(
    case_id: Optional[str] = None,
    current_user: CurrentUserContext = Depends(get_current_user_context),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Decision)
        .join(CollectionCase, Decision.case_id == CollectionCase.id)
        .where(CollectionCase.merchant_id == current_user.merchant_id)
        .order_by(Decision.created_at.desc())
    )
    if case_id:
        stmt = stmt.where(Decision.case_id == case_id)

    result = await db.execute(stmt)
    return result.scalars().all()


@router.post("/{decision_id}/approve")
async def approve_decision(
    decision_id: str,
    current_user: CurrentUserContext = Depends(get_current_user_context),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Decision)
        .join(CollectionCase, Decision.case_id == CollectionCase.id)
        .where(
            Decision.id == decision_id,
            CollectionCase.merchant_id == current_user.merchant_id,
        )
    )
    result = await db.execute(stmt)
    decision = result.scalar_one_or_none()
    if not decision:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Decision not found")

    decision.approval_status = "APPROVED_BY_OPERATOR"
    decision.policy_status = "APPROVED"
    await db.commit()
    return {"status": "SUCCESS", "decision_id": decision.id, "approval_status": decision.approval_status}


@router.post("/{decision_id}/reject")
async def reject_decision(
    decision_id: str,
    reason: Optional[str] = "Operator manual rejection",
    current_user: CurrentUserContext = Depends(get_current_user_context),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(Decision)
        .join(CollectionCase, Decision.case_id == CollectionCase.id)
        .where(
            Decision.id == decision_id,
            CollectionCase.merchant_id == current_user.merchant_id,
        )
    )
    result = await db.execute(stmt)
    decision = result.scalar_one_or_none()
    if not decision:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Decision not found")

    decision.approval_status = "REJECTED_BY_OPERATOR"
    decision.policy_status = "REJECTED"
    decision.reason = f"{decision.reason} [REJECTED: {reason}]"
    await db.commit()
    return {"status": "REJECTED", "decision_id": decision.id}
