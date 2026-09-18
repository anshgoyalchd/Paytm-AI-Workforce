from typing import Optional
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel
from backend.app.providers.payment_mock import payment_gateway, MockPaymentGateway
from backend.app.schemas.schemas import VerificationStatus

router = APIRouter(prefix="/mock/payments", tags=["Mock Payment Gateway"])


class OverrideRequest(BaseModel):
    status: VerificationStatus


@router.get("/{invoice_id}")
async def query_payment_verification(
    invoice_id: str,
    amount: Optional[float] = None,
):
    """
    Public verification inquiry endpoint simulating Paytm PG inquiry.
    Explicitly MOCKED with deterministic response.
    """
    result = await payment_gateway.verify_payment(invoice_id=invoice_id, amount=amount)
    return result


@router.post("/{invoice_id}/override")
async def set_override_status(
    invoice_id: str,
    payload: OverrideRequest,
):
    """
    Sets deterministic verification override for demo simulation or test runner.
    """
    MockPaymentGateway.set_invoice_status(invoice_id, payload.status)
    return {
        "status": "SUCCESS",
        "invoice_id": invoice_id,
        "forced_status": payload.status.value,
        "notice": "[MOCKED PAYMENT GATEWAY] Override activated for testing.",
    }


@router.delete("/overrides")
async def clear_all_overrides():
    MockPaymentGateway.clear_overrides()
    return {"status": "SUCCESS", "message": "All mock gateway overrides cleared."}
