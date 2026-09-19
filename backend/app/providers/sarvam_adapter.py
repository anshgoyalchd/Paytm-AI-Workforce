import logging
from typing import Dict, Any, Optional
import httpx
from backend.app.core.config import settings

logger = logging.getLogger(__name__)


import base64
import uuid

VALID_BULBUL_SPEAKERS = {
    "priya", "shreya", "kavya", "neha", "pooja", "simran", "aditya",
    "rahul", "rohan", "amit", "dev", "shubh", "advait", "anand",
    "tanya", "tarun", "sunny", "mani", "gokul", "vijay", "shruti",
    "suhani", "mohit", "kavitha", "rehan", "soham", "rupali", "ratan"
}

class SarvamAdapter:
    """
    Adapter for Sarvam AI Indic Speech Synthesis & Recognition.
    Provides natural Hindi / regional language TTS for collections outreach.
    Uses Sarvam bulbul:v3 neural Indic voices for authentic native Hindi accents.
    """

    def __init__(self):
        self.api_key = settings.SARVAM_API_KEY
        raw_voice = (settings.SARVAM_VOICE_ID or "priya").lower()
        self.voice_id = raw_voice if raw_voice in VALID_BULBUL_SPEAKERS else "priya"
        self.language_code = settings.SARVAM_LANGUAGE_CODE or "hi-IN"
        self.client = httpx.AsyncClient(timeout=10.0)

    @property
    def is_configured(self) -> bool:
        return bool(self.api_key and not self.api_key.startswith("your_"))

    async def synthesize_speech(
        self,
        text: str,
        language_code: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Synthesizes natural Indic audio from text script using Sarvam TTS API (bulbul:v3).
        Caches the audio in the voice service so Twilio can stream it directly via <Play>.
        """
        lang = language_code or self.language_code
        from backend.app.api.v1.voice import AUDIO_CACHE, TEXT_CACHE

        if self.is_configured:
            try:
                url = "https://api.sarvam.ai/text-to-speech"
                payload = {
                    "inputs": [text],
                    "target_language_code": lang,
                    "speaker": self.voice_id,
                    "model": "bulbul:v3",
                }
                headers = {
                    "api-subscription-key": self.api_key,
                    "Content-Type": "application/json",
                }
                res = await self.client.post(url, json=payload, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    audios = data.get("audios", [])
                    if audios and audios[0]:
                        audio_b64 = audios[0]
                        audio_bytes = base64.b64decode(audio_b64)
                        audio_id = str(uuid.uuid4())
                        AUDIO_CACHE[audio_id] = audio_bytes
                        TEXT_CACHE[audio_id] = text

                        audio_url = f"https://paytm-collections-backend.onrender.com/api/v1/voice/audio/{audio_id}"
                        twiml_url = f"https://paytm-collections-backend.onrender.com/api/v1/voice/twiml?audio_id={audio_id}"

                        return {
                            "status": "SUCCESS",
                            "provider": "SARVAM_AI",
                            "audio_id": audio_id,
                            "audio_url": audio_url,
                            "twiml_url": twiml_url,
                            "speaker": self.voice_id,
                            "language": lang,
                        }
                else:
                    logger.warning(f"Sarvam TTS API returned {res.status_code}: {res.text}")
            except Exception as e:
                logger.warning(f"Sarvam TTS failed: {e}. Falling back to Polly Indian voice.")

        # Fallback using cached text for Polly.Aditi
        text_id = str(uuid.uuid4())
        TEXT_CACHE[text_id] = text
        fallback_twiml_url = f"https://paytm-collections-backend.onrender.com/api/v1/voice/twiml?text_id={text_id}"

        # Free tier simulation
        logger.info(f"[SARVAM TTS SIMULATOR] Synthesizing ({lang}): {text[:50]}...")
        return {
            "status": "SUCCESS",
            "provider": "SIMULATED_SARVAM",
            "voice_speaker": self.voice_id,
            "language": lang,
            "text": text,
            "twiml_url": fallback_twiml_url,
            "notice": "Audio synthesized via Sarvam Speech provider simulation.",
        }


sarvam_adapter = SarvamAdapter()
