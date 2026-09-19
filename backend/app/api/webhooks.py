import hashlib
import logging
from datetime import datetime, timezone
from typing import Optional
from fastapi import APIRouter, Form, Request, Response, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.core.database import get_db
from backend.app.models.models import WebhookEvent, Customer, CollectionCase
from backend.app.agents.collections_agent import collections_agent
from backend.app.schemas.schemas import Channel

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/webhooks", tags=["External Webhooks (Twilio / Telephony)"])


@router.post("/whatsapp")
async def handle_whatsapp_webhook(
    request: Request,
    From: str = Form(...),
    Body: str = Form(...),
    MessageSid: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Inbound WhatsApp webhook compatible with Twilio and Free-Tier simulator.
    """
    provider_event_id = MessageSid or f"SIM_MSG_{hashlib.md5((From + Body).encode()).hexdigest()[:16]}"
    logger.info(f"[WEBHOOK] Inbound WhatsApp from {From}: '{Body}' (ID: {provider_event_id})")

    # Idempotency check on webhook event
    existing_evt = await db.execute(
        select(WebhookEvent).where(WebhookEvent.provider_event_id == provider_event_id)
    )
    if existing_evt.scalar_one_or_none():
        logger.info(f"[WEBHOOK] Duplicate event {provider_event_id} suppressed.")
        return Response(content="<Response></Response>", media_type="application/xml")

    # Extract clean phone number
    clean_phone = From.replace("whatsapp:", "").strip()

    # Find customer(s) matching phone (ordered newest first)
    cust_res = await db.execute(
        select(Customer)
        .where(Customer.phone.ilike(f"%{clean_phone[-10:]}%"))
        .order_by(Customer.created_at.desc())
    )
    customers = cust_res.scalars().all()

    reply_text = "धन्यवाद, आपका संदेश प्राप्त हुआ है।"
    case_id = None
    target_customer = None
    target_case = None

    if customers:
        # Prefer the customer that has an active overdue case
        for c in customers:
            case_res = await db.execute(
                select(CollectionCase)
                .where(
                    CollectionCase.customer_id == c.id,
                    CollectionCase.status.not_in(["SETTLED", "CLOSED"]),
                )
                .order_by(CollectionCase.created_at.desc())
            )
            found_case = case_res.scalars().first()
            if found_case:
                target_case = found_case
                target_customer = c
                break

        if not target_customer:
            target_customer = customers[0]

        if target_case:
            case_id = target_case.id
            try:
                result = await collections_agent.process_turn(
                    session=db,
                    case_id=target_case.id,
                    incoming_message=Body,
                    incoming_channel=Channel.WHATSAPP,
                )
                reply_text = result.get("agent_response") or reply_text
            except Exception as e:
                logger.warning(f"[WEBHOOK] Error processing turn: {e}")
                # Fallback to direct payment reminder
                reply_text = f"नमस्ते {target_customer.name} जी! पेटीएम से इनवॉइस बकाया राशि का आवश्यक रिमाइंडर। कृपया सुरक्षित यूपीआई द्वारा भुगतान करें।"
        else:
            reply_text = f"नमस्ते {target_customer.name} जी! आपका संदेश प्राप्त हुआ है। पेटीएम कलेक्शंस टीम जल्द ही आपसे संपर्क करेगी।"

    # Log webhook event safely
    try:
        webhook_event = WebhookEvent(
            provider="TWILIO_WHATSAPP",
            event_type="INBOUND_MESSAGE",
            provider_event_id=provider_event_id,
            case_id=case_id,
            payload_hash=hashlib.sha256(Body.encode()).hexdigest(),
            processing_status="PROCESSED",
            processed_at=datetime.now(timezone.utc),
        )
        db.add(webhook_event)
        await db.commit()
    except Exception as e:
        logger.warning(f"[WEBHOOK] Audit log error: {e}")
        await db.rollback()

    twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message>{reply_text}</Message>
</Response>"""
    return Response(content=twiml, media_type="application/xml; charset=utf-8")


@router.post("/voice")
async def handle_voice_webhook(
    request: Request,
    CallSid: Optional[str] = Form(None),
    From: Optional[str] = Form(None),
    CallStatus: Optional[str] = Form(None),
    SpeechResult: Optional[str] = Form(None),
    db: AsyncSession = Depends(get_db),
):
    """
    Inbound Voice callback webhook compatible with Twilio Voice / TwiML.
    """
    logger.info(f"[VOICE WEBHOOK] CallSid: {CallSid} Status: {CallStatus} Speech: {SpeechResult}")

    if SpeechResult:
        # Handle spoken turn
        clean_phone = (From or "").strip()
        cust_res = await db.execute(
            select(Customer)
            .where(Customer.phone.ilike(f"%{clean_phone[-10:]}%"))
            .order_by(Customer.created_at.desc())
        )
        customers = cust_res.scalars().all()
        spoken_response = "धन्यवाद, आपकी बात हमने नोट कर ली है।"

        target_case = None
        if customers:
            for c in customers:
                case_res = await db.execute(
                    select(CollectionCase)
                    .where(
                        CollectionCase.customer_id == c.id,
                        CollectionCase.status.not_in(["SETTLED", "CLOSED"]),
                    )
                    .order_by(CollectionCase.created_at.desc())
                )
                found_case = case_res.scalars().first()
                if found_case:
                    target_case = found_case
                    break

            if target_case:
                try:
                    turn = await collections_agent.process_turn(
                        session=db,
                        case_id=target_case.id,
                        incoming_message=SpeechResult,
                        incoming_channel=Channel.VOICE,
                    )
                    spoken_response = turn.get("agent_response") or spoken_response
                except Exception as e:
                    logger.warning(f"[VOICE WEBHOOK] Turn error: {e}")
                    spoken_response = "नमस्ते, आपका भुगतान प्राप्त करने के लिए धन्यवाद, हम आपका विवरण दर्ज कर रहे हैं।"

        twiml = f"""<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="hi-IN">{spoken_response}</Say>
    <Hangup/>
</Response>"""
        return Response(content=twiml, media_type="application/xml")

    # Initial call pickup: greet and listen for speech
    twiml = """<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Say language="hi-IN">नमस्ते, मैं राज इलेक्ट्रॉनिक्स से बात कर रहा हूँ। क्या मैं आपकी इनवॉइस के बारे में बात कर सकता हूँ?</Say>
    <Gather input="speech" action="/api/webhooks/voice" timeout="4" language="hi-IN"/>
</Response>"""
    return Response(content=twiml, media_type="application/xml")
