import csv
import io
import json
from datetime import datetime, timezone, timedelta, date
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status, UploadFile, File
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
    AuditEvent,
)
from backend.app.schemas.schemas import (
    CaseRead,
    CaseDetail,
    CaseStatus,
    CaseCreateRequest,
    BulkCaseUploadResponse,
)
from backend.app.agents.collections_agent import collections_agent

router = APIRouter(prefix="/cases", tags=["Collection Cases"])


def _parse_due_date(due_date_str: Optional[str]) -> datetime:
    if due_date_str:
        try:
            clean_str = due_date_str.strip().replace("Z", "+00:00")
            if len(clean_str) == 10:
                d = date.fromisoformat(clean_str)
                return datetime(d.year, d.month, d.day, 12, 0, 0, tzinfo=timezone.utc)
            return datetime.fromisoformat(clean_str)
        except Exception:
            pass
    return datetime.now(timezone.utc) - timedelta(days=7)


def _determine_priority(amount: float, explicit_priority: Optional[str] = None) -> str:
    if explicit_priority and explicit_priority.upper() in ["HIGH", "MEDIUM", "LOW", "CRITICAL"]:
        return explicit_priority.upper()
    if amount >= 50000:
        return "HIGH"
    elif amount >= 15000:
        return "MEDIUM"
    return "LOW"


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


@router.post("/{case_id}/auto-reach")
async def trigger_autonomous_reach(
    case_id: str,
    channel: Optional[str] = None,
    current_user: CurrentUserContext = Depends(get_current_user_context),
    db: AsyncSession = Depends(get_db),
):
    """
    1-Click Autonomous Outreach:
    Analyzes due amount, previous history, past commitments, and Cognee memory,
    then automatically dispatches WhatsApp message or initiates Voice call to the debtor.
    """
    # Verify tenant ownership
    case_stmt = select(CollectionCase).where(
        CollectionCase.id == case_id,
        CollectionCase.merchant_id == current_user.merchant_id,
    )
    res = await db.execute(case_stmt)
    case = res.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")

    try:
        result = await collections_agent.run_autonomous_outreach(
            session=db,
            case_id=case_id,
            preferred_channel=channel,
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail=str(e))


@router.post("/auto-reach-all")
async def trigger_autonomous_reach_all(
    current_user: CurrentUserContext = Depends(get_current_user_context),
    db: AsyncSession = Depends(get_db),
):
    """
    1-Click Bulk Portfolio Outreach:
    Runs autonomous analysis and outbound contact across all pending/contactable cases.
    """
    cases_stmt = select(CollectionCase).where(
        CollectionCase.merchant_id == current_user.merchant_id,
        CollectionCase.status.in_(["NEW", "CONTACTED", "PROMISE_TO_PAY"]),
    )
    cases = (await db.execute(cases_stmt)).scalars().all()

    results = []
    for c in cases:
        try:
            res = await collections_agent.run_autonomous_outreach(
                session=db,
                case_id=c.id,
            )
            results.append(res)
        except Exception as e:
            results.append({
                "case_id": c.id,
                "success": False,
                "error": str(e),
            })

    return {
        "total_processed": len(cases),
        "successful_touches": sum(1 for r in results if r.get("success")),
        "results": results,
    }


@router.post("", response_model=CaseRead, status_code=status.HTTP_201_CREATED)
async def create_case(
    req: CaseCreateRequest,
    current_user: CurrentUserContext = Depends(get_current_user_context),
    db: AsyncSession = Depends(get_db),
):
    # 1. Find or create customer for this merchant
    phone_clean = req.customer_phone.strip()
    c_stmt = select(Customer).where(
        Customer.merchant_id == current_user.merchant_id,
        Customer.phone == phone_clean,
    )
    c_res = await db.execute(c_stmt)
    customer = c_res.scalar_one_or_none()

    if not customer:
        customer = Customer(
            merchant_id=current_user.merchant_id,
            name=req.customer_name.strip(),
            phone=phone_clean,
            email=req.customer_email.strip() if req.customer_email else None,
            preferred_language=req.preferred_language or "Hindi",
            preferred_channel=req.preferred_channel or "WHATSAPP",
            contact_status="CONTACTABLE",
        )
        db.add(customer)
        await db.flush()
    else:
        # Update name or email if provided
        if req.customer_name.strip():
            customer.name = req.customer_name.strip()
        if req.customer_email:
            customer.email = req.customer_email.strip()

    # 2. Create invoice
    due_dt = _parse_due_date(req.due_date)
    issue_dt = due_dt - timedelta(days=30)
    invoice = Invoice(
        merchant_id=current_user.merchant_id,
        customer_id=customer.id,
        invoice_number=req.invoice_number.strip(),
        amount=req.amount,
        currency="INR",
        issue_date=issue_dt,
        due_date=due_dt,
        status="OVERDUE",
    )
    db.add(invoice)
    await db.flush()

    # 3. Create collection case
    priority = _determine_priority(req.amount, req.priority)
    now = datetime.now(timezone.utc)
    case = CollectionCase(
        merchant_id=current_user.merchant_id,
        customer_id=customer.id,
        invoice_id=invoice.id,
        status="NEW",
        priority=priority,
        outstanding_amount=req.amount,
        currency="INR",
        assigned_mode="AUTONOMOUS",
        opened_at=now,
        next_action_at=now,
    )
    db.add(case)
    await db.flush()

    # 4. Audit Log
    audit = AuditEvent(
        merchant_id=current_user.merchant_id,
        case_id=case.id,
        actor_type="USER",
        actor_id=current_user.user_id,
        event_type="CASE_CREATED",
        entity_type="COLLECTION_CASE",
        entity_id=case.id,
        metadata_safe=json.dumps({"amount": req.amount, "invoice_number": req.invoice_number}),
    )
    db.add(audit)
    await db.commit()

    # 5. Reload with customer and invoice
    stmt = (
        select(CollectionCase)
        .options(
            selectinload(CollectionCase.customer),
            selectinload(CollectionCase.invoice),
        )
        .where(CollectionCase.id == case.id)
    )
    res = await db.execute(stmt)
    return res.scalar_one()


@router.post("/upload-csv", response_model=BulkCaseUploadResponse)
async def upload_cases_csv(
    file: UploadFile = File(...),
    current_user: CurrentUserContext = Depends(get_current_user_context),
    db: AsyncSession = Depends(get_db),
):
    content = await file.read()
    text = content.decode("utf-8-sig", errors="replace")
    csv_reader = csv.DictReader(io.StringIO(text))

    created_cases: List[CollectionCase] = []
    errors: List[str] = []
    row_num = 1

    for row in csv_reader:
        row_num += 1
        # Normalize header keys (lowercase and stripped)
        norm_row = {k.strip().lower() if k else "": v.strip() if v else "" for k, v in row.items()}
        
        name = norm_row.get("customer_name") or norm_row.get("name")
        phone = norm_row.get("phone") or norm_row.get("customer_phone") or norm_row.get("mobile")
        inv_num = norm_row.get("invoice_number") or norm_row.get("invoice_no") or norm_row.get("invoice")
        amt_str = norm_row.get("amount") or norm_row.get("outstanding_amount")
        due_date_str = norm_row.get("due_date") or norm_row.get("due")
        language = norm_row.get("language") or norm_row.get("preferred_language") or "Hindi"
        email = norm_row.get("email") or norm_row.get("customer_email")

        if not name or not phone or not inv_num or not amt_str:
            errors.append(f"Row {row_num}: Missing required fields (customer_name, phone, invoice_number, amount)")
            continue

        try:
            amount = float(amt_str.replace(",", "").replace("₹", "").strip())
        except ValueError:
            errors.append(f"Row {row_num}: Invalid amount '{amt_str}'")
            continue

        # Find or create customer
        c_stmt = select(Customer).where(
            Customer.merchant_id == current_user.merchant_id,
            Customer.phone == phone,
        )
        c_res = await db.execute(c_stmt)
        customer = c_res.scalar_one_or_none()

        if not customer:
            customer = Customer(
                merchant_id=current_user.merchant_id,
                name=name,
                phone=phone,
                email=email if email else None,
                preferred_language=language,
                preferred_channel="WHATSAPP",
                contact_status="CONTACTABLE",
            )
            db.add(customer)
            await db.flush()

        due_dt = _parse_due_date(due_date_str)
        issue_dt = due_dt - timedelta(days=30)
        invoice = Invoice(
            merchant_id=current_user.merchant_id,
            customer_id=customer.id,
            invoice_number=inv_num,
            amount=amount,
            currency="INR",
            issue_date=issue_dt,
            due_date=due_dt,
            status="OVERDUE",
        )
        db.add(invoice)
        await db.flush()

        priority = _determine_priority(amount)
        now = datetime.now(timezone.utc)
        case = CollectionCase(
            merchant_id=current_user.merchant_id,
            customer_id=customer.id,
            invoice_id=invoice.id,
            status="NEW",
            priority=priority,
            outstanding_amount=amount,
            currency="INR",
            assigned_mode="AUTONOMOUS",
            opened_at=now,
            next_action_at=now,
        )
        db.add(case)
        await db.flush()

        created_cases.append(case)

    await db.commit()

    # Reload all created cases with relationships
    reloaded_cases = []
    for c in created_cases:
        stmt = (
            select(CollectionCase)
            .options(
                selectinload(CollectionCase.customer),
                selectinload(CollectionCase.invoice),
            )
            .where(CollectionCase.id == c.id)
        )
        r = await db.execute(stmt)
        reloaded_cases.append(r.scalar_one())

    return BulkCaseUploadResponse(
        imported_count=len(reloaded_cases),
        skipped_count=len(errors),
        errors=errors,
        cases=reloaded_cases,
    )
