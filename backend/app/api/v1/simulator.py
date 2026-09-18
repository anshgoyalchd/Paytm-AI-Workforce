from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.core.database import get_db
from backend.app.core.security import get_current_user_context, CurrentUserContext
from backend.app.models.models import CollectionCase, Customer, Invoice
from backend.app.schemas.schemas import SimulationRequest, SimulationResponse, Channel, VerificationStatus
from backend.app.agents.collections_agent import collections_agent
from backend.app.providers.payment_mock import MockPaymentGateway

router = APIRouter(prefix="/simulator", tags=["Customer Scenario Simulator"])

SCENARIOS: Dict[str, Dict[str, Any]] = {
    "immediate_pay": {
        "title": "1. Immediate Payment Request",
        "description": "Customer wants to pay now and requests the payment link/QR code.",
        "sample_input": "Bhaiya mujhe payment karna hai, link ya QR code bhej dijiye.",
        "expected_intent": "CONFIRM_PAYMENT",
        "expected_action": "TEXT",
    },
    "promise_to_pay": {
        "title": "2. Promise to Pay (Future Date)",
        "description": "Customer commits to pay on a specific upcoming date.",
        "sample_input": "Meri salary somwar (Monday) ko aayegi, main tab pura payment kar dunga.",
        "expected_intent": "PROMISE_TO_PAY",
        "expected_action": "TEXT",
    },
    "dispute_amount": {
        "title": "3. Invoice Amount Dispute",
        "description": "Customer disputes charges or claims incorrect bill calculation.",
        "sample_input": "Ye galat bill hai! Maine sirf ₹5,000 ka saman liya tha, aap ₹14,500 kyu mang rahe ho?",
        "expected_intent": "DISPUTE_AMOUNT",
        "expected_action": "ESCALATE",
    },
    "dispute_goods": {
        "title": "4. Defective Goods / Undelivered Service Dispute",
        "description": "Customer claims goods were returned or damaged.",
        "sample_input": "Jo saman bheja tha wo to defective tha aur maine return kar diya tha, payment kis baat ka?",
        "expected_intent": "DISPUTE_GOODS_SERVICES",
        "expected_action": "ESCALATE",
    },
    "financial_hardship": {
        "title": "5. Financial Hardship / Job Loss",
        "description": "Customer reports acute financial distress requiring compassionate EMI restructuring.",
        "sample_input": "Meri job chali gayi hai aur ghar me medical emergency hai. Mere paas abhi paise nahi hain.",
        "expected_intent": "FINANCIAL_HARDSHIP",
        "expected_action": "ESCALATE",
    },
    "request_extension": {
        "title": "6. Payment Extension Request",
        "description": "Customer asks for a temporary grace period of a few days.",
        "sample_input": "Mujhe thoda 4-5 din ka aur time de dijiye, main arrange kar raha hoon.",
        "expected_intent": "REQUEST_EXTENSION",
        "expected_action": "TEXT",
    },
    "already_paid": {
        "title": "7. Payment Already Made (Verify & Settle)",
        "description": "Customer claims paid. Agent verifies with Mock Payment Gateway and settles case.",
        "sample_input": "Bhaiya maine kal raat ko hi UPI se payment kar diya tha, check kijiye.",
        "expected_intent": "ALREADY_PAID",
        "expected_action": "TEXT",
        "force_paid_verification": True,
    },
    "refusal_wrong_number": {
        "title": "8. Refusal to Pay / Wrong Contact",
        "description": "Customer refuses or states wrong number. Escalates immediately.",
        "sample_input": "Main koi payment nahi karunga, jo karna hai kar lo.",
        "expected_intent": "REFUSAL_TO_PAY",
        "expected_action": "ESCALATE",
    },
}


@router.get("/scenarios")
async def list_available_scenarios():
    """Returns catalog of all 8 customer scenarios with descriptions and sample inputs."""
    return [
        {
            "id": k,
            "title": v["title"],
            "description": v["description"],
            "sample_input": v["sample_input"],
            "expected_intent": v["expected_intent"],
            "expected_action": v["expected_action"],
        }
        for k, v in SCENARIOS.items()
    ]


@router.post("/run", response_model=SimulationResponse)
async def run_scenario_simulation(
    req: SimulationRequest,
    current_user: CurrentUserContext = Depends(get_current_user_context),
    db: AsyncSession = Depends(get_db),
):
    """
    Executes an end-to-end interactive simulation of the collections agent loop
    for any chosen customer scenario.
    """
    scenario = SCENARIOS.get(req.scenario_name)
    if not scenario:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Unknown scenario '{req.scenario_name}'. Available: {list(SCENARIOS.keys())}",
        )

    # Fetch case
    stmt = (
        select(CollectionCase)
        .where(
            CollectionCase.id == req.case_id,
            CollectionCase.merchant_id == current_user.merchant_id,
        )
    )
    res = await db.execute(stmt)
    case = res.scalar_one_or_none()
    if not case:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Case not found")

    customer_input = req.customer_message or scenario["sample_input"]

    # If scenario requires mock paid verification, set it
    if scenario.get("force_paid_verification"):
        MockPaymentGateway.set_invoice_status(case.invoice_id, VerificationStatus.PAID)

    # Process agent turn
    result = await collections_agent.process_turn(
        session=db,
        case_id=case.id,
        incoming_message=customer_input,
        incoming_channel=req.channel,
    )

    # Clean up any test override
    if scenario.get("force_paid_verification"):
        MockPaymentGateway.clear_overrides()

    return SimulationResponse(
        step="TURN_COMPLETED",
        customer_input=customer_input,
        detected_intent=result["customer_intent"],
        agent_decision=result["proposed_action"],
        policy_check=result["policy_check"],
        agent_response=result["agent_response"] or "",
        case_status_after=result["case_status"],
        verification_status=result.get("verification_status"),
        escalated=result["is_escalated"],
    )
