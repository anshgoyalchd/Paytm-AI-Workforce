from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from sqlalchemy.orm import selectinload
from backend.app.core.database import get_db
from backend.app.core.security import get_current_user_context, CurrentUserContext
from backend.app.models.models import (
    CollectionCase,
    Customer,
    Invoice,
    Conversation,
    Decision,
    Action,
    PaymentCommitment,
    PaymentVerification,
    Escalation,
)
from backend.app.schemas.schemas import CaseRead, CaseDetail, CaseStatus
from backend.app.agents.collections_agent import collections_agent

router = APIRouter(prefix="/cases", tags=["Collection Cases"])


@router.get("", response_model=List[CaseRead])
async def list_cases(
    status_filter: Optional[str] = Query(None, alias="status"),
    priority_filter: Optional[str] = Query(None, alias="priority"),
    search: Optional[str] = None,
    current_user: CurrentUserContext = Depends(get_current_user_context),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(CollectionCase)
        .options(
            selectinload(CollectionCase.customer),
            selectinload(CollectionCase.invoice),
        )
        .where(CollectionCase.merchant_id == current_user.merchant_id)
    )

    if status_filter:
        stmt = stmt.where(CollectionCase.status == status_filter)
    if priority_filter:
        stmt = stmt.where(CollectionCase.priority == priority_filter)

    if search:
        search_pattern = f"%{search}%"
        stmt = stmt.join(CollectionCase.customer).join(CollectionCase.invoice).where(
            or_(
                Customer.name.ilike(search_pattern),
                Customer.phone.ilike(search_pattern),
                Invoice.invoice_number.ilike(search_pattern),
            )
        )

    stmt = stmt.order_by(CollectionCase.created_at.desc())
    result = await db.execute(stmt)
    return result.scalars().all()


@router.get("/{case_id}", response_model=CaseDetail)
async def get_case_detail(
    case_id: str,
    current_user: CurrentUserContext = Depends(get_current_user_context),
    db: AsyncSession = Depends(get_db),
):
    stmt = (
        select(CollectionCase)
        .options(
            selectinload(CollectionCase.customer),
            selectinload(CollectionCase.invoice),
            selectinload(CollectionCase.conversations).selectinload(Conversation.messages),
            selectinload(CollectionCase.decisions),
            selectinload(CollectionCase.actions),
            selectinload(CollectionCase.commitments),
            selectinload(CollectionCase.verifications),
            selectinload(CollectionCase.escalations),
        )
        .where(
            CollectionCase.id == case_id,
            CollectionCase.merchant_id == current_user.merchant_id,
        )
    )
    result = await db.execute(stmt)
    case = result.scalar_one_or_none()

    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")

    return case


@router.post("/{case_id}/trigger-turn")
async def trigger_agent_turn(
    case_id: str,
    customer_message: Optional[str] = None,
    current_user: CurrentUserContext = Depends(get_current_user_context),
    db: AsyncSession = Depends(get_db),
):
    # Verify tenant ownership
    case_stmt = select(CollectionCase).where(
        CollectionCase.id == case_id,
        CollectionCase.merchant_id == current_user.merchant_id,
    )
    res = await db.execute(case_stmt)
    case = res.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")

    result = await collections_agent.process_turn(
        session=db,
        case_id=case_id,
        incoming_message=customer_message,
    )
    return result
