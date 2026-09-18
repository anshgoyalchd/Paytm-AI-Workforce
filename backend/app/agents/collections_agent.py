import logging
import json
from datetime import datetime, timezone, date, timedelta
from typing import Dict, Any, Optional, Tuple
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.models.models import (
    CollectionCase,
    Conversation,
    Message,
    ConversationIntent,
    PaymentCommitment,
    PaymentVerification,
    Decision,
    Action,
    Escalation,
    AuditEvent,
    AgentSetting,
    Customer,
    Invoice,
)
from backend.app.schemas.schemas import (
    CaseStatus,
    ActionType,
    Channel,
    CustomerIntent,
    VerificationStatus,
)
from backend.app.services.state_machine import CaseStateMachine
from backend.app.services.idempotency import IdempotencyService
from backend.app.policies.engine import policy_engine
from backend.app.providers.gemini_adapter import gemini_adapter
from backend.app.providers.payment_mock import payment_gateway
from backend.app.providers.cognee_adapter import cognee_adapter
from backend.app.providers.twilio_adapter import twilio_adapter
from backend.app.providers.sarvam_adapter import sarvam_adapter

logger = logging.getLogger(__name__)


class CollectionsAgent:
    """
    Autonomous Collections Employee.
    Executes the 7-step loop:
    Understand -> Remember -> Decide -> Verify -> Authorize -> Act -> Escalate & Learn
    """

    async def process_turn(
        self,
        session: AsyncSession,
        case_id: str,
        incoming_message: Optional[str] = None,
        incoming_channel: Channel = Channel.WHATSAPP,
        forced_discount_pct: Optional[float] = None,
    ) -> Dict[str, Any]:
        """
        Executes a complete autonomous collections loop turn for a case.
        """
        logger.info(f"--- [START COLLECTIONS AGENT LOOP] Case: {case_id} ---")

        # 1. Fetch fresh case, customer, invoice, and settings
        case_stmt = (
            select(CollectionCase)
            .where(CollectionCase.id == case_id)
        )
        case_res = await session.execute(case_stmt)
        case = case_res.scalar_one_or_none()
        if not case:
            raise ValueError(f"Case {case_id} not found")

        cust_stmt = select(Customer).where(Customer.id == case.customer_id)
        cust_res = await session.execute(cust_stmt)
        customer = cust_res.scalar_one()

        inv_stmt = select(Invoice).where(Invoice.id == case.invoice_id)
        inv_res = await session.execute(inv_stmt)
        invoice = inv_res.scalar_one()

        setting_stmt = select(AgentSetting).where(AgentSetting.merchant_id == case.merchant_id)
        setting_res = await session.execute(setting_stmt)
        settings = setting_res.scalar_one_or_none()
        if not settings:
            settings = AgentSetting(
                merchant_id=case.merchant_id,
                agent_status="ACTIVE",
                contact_start_hour=9,
                contact_end_hour=19,
                max_contact_attempts=2,
                min_hours_between_contacts=4,
            )

        # 2. UNDERSTAND: Extract Intent
        detected_intent = CustomerIntent.UNCLEAR_QUERY
        intent_conf = 0.8
        if incoming_message:
            detected_intent, intent_conf = await gemini_adapter.extract_intent(
                customer_message=incoming_message,
                language=customer.preferred_language or "Hindi",
            )
            logger.info(f"[UNDERSTAND] Extracted intent: {detected_intent.value} (conf: {intent_conf})")

        # 3. REMEMBER: Retrieve Durable Memory Context
        memory_ctx = await cognee_adapter.retrieve_customer_context(
            merchant_id=case.merchant_id,
            customer_id=customer.id,
            case_id=case.id,
        )

        # 4. DECIDE: Generate Next Best Action Proposal
        case_info = {
            "outstanding_amount": float(case.outstanding_amount),
            "customer_name": customer.name,
            "invoice_number": invoice.invoice_number,
            "status": case.status,
            "preferred_language": customer.preferred_language,
        }
        decision_raw = await gemini_adapter.decide_next_action(
            case_info=case_info,
            customer_intent=detected_intent,
            memory_context=memory_ctx.get("summary"),
            language=customer.preferred_language or "Hindi",
        )
        proposed_action_enum = ActionType(decision_raw["proposed_action"])

        # 5. VERIFY: Payment Gateway Check (if customer claimed payment)
        verification_result = None
        if detected_intent in (CustomerIntent.ALREADY_PAID, CustomerIntent.CONFIRM_PAYMENT):
            verification_result = await payment_gateway.verify_payment(
                invoice_id=invoice.id,
                amount=float(case.outstanding_amount),
            )
            # Store verification record
            pv = PaymentVerification(
                case_id=case.id,
                invoice_id=invoice.id,
                provider="MOCK",
                provider_reference=verification_result.get("provider_reference"),
                status=verification_result["status"],
                amount=float(case.outstanding_amount),
                error_code=verification_result.get("error_code"),
            )
            session.add(pv)

            # If verified PAID, settle case!
            if verification_result["status"] == "PAID":
                invoice.status = "PAID"
                CaseStateMachine.transition(
                    case,
                    CaseStatus.SETTLED,
                    guard_context={"payment_status": "PAID"},
                )
                logger.info(f"[VERIFY] Payment verified as PAID! Settled case {case.id}")

        # 6. AUTHORIZE: Deterministic Policy Engine
        # Fetch recent actions for frequency checks
        recent_actions_stmt = (
            select(Action)
            .where(Action.case_id == case.id)
            .order_by(Action.requested_at.desc())
            .limit(10)
        )
        recent_actions = (await session.execute(recent_actions_stmt)).scalars().all()

        policy_check = policy_engine.evaluate(
            case=case,
            action_type=proposed_action_enum,
            channel=incoming_channel,
            recent_actions=list(recent_actions),
            settings=settings,
            discount_pct=forced_discount_pct,
        )
        logger.info(f"[AUTHORIZE] Policy check: is_allowed={policy_check.is_allowed}, reason='{policy_check.reason}'")

        # Save Decision Record
        decision = Decision(
            case_id=case.id,
            model_provider="GEMINI",
            model_name=gemini_adapter.model_name,
            proposed_action=proposed_action_enum.value,
            customer_intent=detected_intent.value,
            confidence=decision_raw.get("confidence", 0.9),
            reason=decision_raw.get("reason", ""),
            policy_status="APPROVED" if policy_check.is_allowed else "REJECTED",
            approval_status="PENDING_OPERATOR_APPROVAL" if policy_check.requires_human_approval else "NOT_REQUIRED",
            execution_status="PENDING",
        )
        session.add(decision)
        await session.flush()

        # 7. ESCALATE (if required by decision or policy)
        is_escalated = False
        if proposed_action_enum == ActionType.ESCALATE or policy_check.requires_human_approval:
            is_escalated = True
            esc_reason = decision_raw.get("escalation_reason") or policy_check.policy_name or "OPERATOR_REVIEW_REQUIRED"
            CaseStateMachine.transition(
                case,
                CaseStatus.ESCALATED,
                guard_context={"escalation_reason": esc_reason},
            )
            escalation = Escalation(
                case_id=case.id,
                reason=esc_reason,
                priority="HIGH" if float(case.outstanding_amount) > 25000 else "MEDIUM",
                status="OPEN",
            )
            session.add(escalation)
            logger.info(f"[ESCALATE] Case {case.id} escalated to human queue. Reason: {esc_reason}")

        # 8. ACT: Safe Execution with Idempotency Protection
        action_record = None
        execution_output = {}

        if policy_check.is_allowed and not policy_check.requires_human_approval and not is_escalated:
            if proposed_action_enum == ActionType.TEXT:
                # Validate and lock action via idempotency service
                try:
                    action_record, fresh_case = await IdempotencyService.validate_and_lock_action(
                        session=session,
                        case_id=case.id,
                        action_type=ActionType.TEXT,
                        channel=incoming_channel,
                        decision_id=decision.id,
                    )
                    # Dispatch message
                    msg_content = decision_raw.get("message_content", "")
                    send_res = await twilio_adapter.send_whatsapp_message(
                        to_phone=customer.phone,
                        message=msg_content,
                    )
                    action_record.status = "COMPLETED"
                    action_record.executed_at = datetime.now(timezone.utc)
                    action_record.completed_at = datetime.now(timezone.utc)
                    action_record.provider = send_res.get("provider")
                    action_record.provider_reference = send_res.get("provider_message_id")
                    execution_output = send_res

                    # Transition case status
                    if case.status == CaseStatus.NEW.value:
                        CaseStateMachine.transition(case, CaseStatus.CONTACTED)

                except Exception as e:
                    logger.warning(f"[ACT] Action execution skipped or failed: {e}")
                    if action_record:
                        action_record.status = "FAILED"
                        action_record.error_message_safe = str(e)

            elif proposed_action_enum == ActionType.CALL:
                try:
                    action_record, fresh_case = await IdempotencyService.validate_and_lock_action(
                        session=session,
                        case_id=case.id,
                        action_type=ActionType.CALL,
                        channel=Channel.VOICE,
                        decision_id=decision.id,
                    )
                    call_res = await twilio_adapter.initiate_voice_call(
                        to_phone=customer.phone,
                        say_text=decision_raw.get("message_content"),
                    )
                    action_record.status = "COMPLETED"
                    action_record.executed_at = datetime.now(timezone.utc)
                    action_record.completed_at = datetime.now(timezone.utc)
                    action_record.provider = call_res.get("provider")
                    action_record.provider_reference = call_res.get("provider_call_id")
                    execution_output = call_res

                    if case.status == CaseStatus.NEW.value:
                        CaseStateMachine.transition(case, CaseStatus.CONTACT_ATTEMPTED)

                except Exception as e:
                    logger.warning(f"[ACT] Voice call execution skipped or failed: {e}")
                    if action_record:
                        action_record.status = "FAILED"
                        action_record.error_message_safe = str(e)

        # 9. LEARN: Record audit trail and memory facts
        audit = AuditEvent(
            merchant_id=case.merchant_id,
            case_id=case.id,
            actor_type="AGENT",
            event_type="AGENT_TURN_COMPLETED",
            entity_type="COLLECTION_CASE",
            entity_id=case.id,
            metadata_safe=json.dumps({
                "intent": detected_intent.value,
                "action": proposed_action_enum.value,
                "policy_allowed": policy_check.is_allowed,
                "case_status_after": case.status,
            }),
        )
        session.add(audit)

        # Update Cognee memory with interaction summary
        if incoming_message:
            await cognee_adapter.add_interaction_memory(
                merchant_id=case.merchant_id,
                customer_id=customer.id,
                case_id=case.id,
                interaction_summary=f"Customer message: '{incoming_message[:80]}'. Intent: {detected_intent.value}. Agent response: {decision_raw.get('reason')}",
            )

        # Commit transaction
        await session.commit()
        await session.refresh(case)

        logger.info(f"--- [END COLLECTIONS AGENT LOOP] Case: {case_id} Status: {case.status} ---")

        return {
            "case_id": case.id,
            "case_status": case.status,
            "customer_intent": detected_intent.value,
            "intent_confidence": intent_conf,
            "proposed_action": proposed_action_enum.value,
            "decision_reason": decision_raw.get("reason"),
            "agent_response": decision_raw.get("message_content"),
            "policy_check": policy_check.model_dump(),
            "verification_status": verification_result.get("status") if verification_result else None,
            "is_escalated": is_escalated,
            "execution": execution_output,
        }


collections_agent = CollectionsAgent()
