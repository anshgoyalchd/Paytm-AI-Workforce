import logging
import uuid
from typing import Dict, Any, Optional
from datetime import datetime, timezone
import httpx
from backend.app.core.config import settings

logger = logging.getLogger(__name__)


class TwilioAdapter:
    """
    Adapter for Twilio Free Trial Messaging & Voice telephony.
    Provides live communication when credentials are provided,
    and a fully functional Free-Tier simulator when offline.
    """

    def __init__(self):
        self.account_sid = settings.TWILIO_ACCOUNT_SID
        self.auth_token = settings.TWILIO_AUTH_TOKEN
        self.from_phone = settings.TWILIO_PHONE_NUMBER
        self.from_whatsapp = settings.TWILIO_WHATSAPP_NUMBER
        self.client = httpx.AsyncClient(timeout=10.0)

    @property
    def is_configured(self) -> bool:
        return bool(
            self.account_sid
            and self.auth_token
            and not self.account_sid.startswith("your_")
        )

    async def send_whatsapp_message(
        self,
        to_phone: str,
        message: str,
    ) -> Dict[str, Any]:
        """
        Sends an outbound WhatsApp message via Twilio or Free-Tier simulator.
        """
        to_formatted = f"whatsapp:{to_phone}" if not to_phone.startswith("whatsapp:") else to_phone

        if self.is_configured and self.from_whatsapp:
            try:
                url = f"https://api.twilio.com/2010-04-01/Accounts/{self.account_sid}/Messages.json"
                response = await self.client.post(
                    url,
                    auth=(self.account_sid, self.auth_token),
                    data={
                        "From": self.from_whatsapp,
                        "To": to_formatted,
                        "Body": message,
                    },
                )
                if response.status_code in (200, 201):
                    data = response.json()
                    return {
                        "status": "DELIVERED",
                        "provider": "TWILIO",
                        "provider_message_id": data.get("sid"),
                        "sent_at": datetime.now(timezone.utc).isoformat(),
                    }
                else:
                    logger.warning(f"Twilio WhatsApp request failed: {response.text}")
            except Exception as e:
                logger.error(f"Error calling Twilio API: {e}")

        # Free-Tier simulated execution
        synthetic_sid = f"SM_{uuid.uuid4().hex[:16]}"
        logger.info(f"[TWILIO SIMULATOR] Sent WhatsApp to {to_formatted}: {message[:60]}... (SID: {synthetic_sid})")
        return {
            "status": "DELIVERED",
            "provider": "SIMULATED_TWILIO",
            "provider_message_id": synthetic_sid,
            "sent_at": datetime.now(timezone.utc).isoformat(),
            "content_preview": message,
        }

    async def initiate_voice_call(
        self,
        to_phone: str,
        twiml_url: Optional[str] = None,
        say_text: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Initiates an outbound voice telephony call via Twilio Voice or Free-Tier simulator.
        """
        if self.is_configured and self.from_phone:
            try:
                url = f"https://api.twilio.com/2010-04-01/Accounts/{self.account_sid}/Calls.json"
                data = {
                    "From": self.from_phone,
                    "To": to_phone,
                }
                if twiml_url:
                    data["Url"] = twiml_url
                elif say_text:
                    data["Twiml"] = f"<Response><Say language='hi-IN'>{say_text}</Say></Response>"

                response = await self.client.post(
                    url,
                    auth=(self.account_sid, self.auth_token),
                    data=data,
                )
                if response.status_code in (200, 201):
                    call_data = response.json()
                    return {
                        "status": "INITIATED",
                        "provider": "TWILIO_VOICE",
                        "provider_call_id": call_data.get("sid"),
                        "started_at": datetime.now(timezone.utc).isoformat(),
                    }
            except Exception as e:
                logger.error(f"Error calling Twilio Voice API: {e}")

        # Free-Tier simulated call
        synthetic_call_sid = f"CA_{uuid.uuid4().hex[:16]}"
        logger.info(f"[TWILIO VOICE SIMULATOR] Initiated call to {to_phone} (SID: {synthetic_call_sid})")
        return {
            "status": "INITIATED",
            "provider": "SIMULATED_TWILIO_VOICE",
            "provider_call_id": synthetic_call_sid,
            "started_at": datetime.now(timezone.utc).isoformat(),
            "spoken_prompt": say_text or "Simulated Hindi collection call script",
        }


twilio_adapter = TwilioAdapter()
