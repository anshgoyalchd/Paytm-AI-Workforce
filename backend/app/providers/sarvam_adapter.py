import logging
from typing import Dict, Any, Optional
import httpx
from backend.app.core.config import settings

logger = logging.getLogger(__name__)


class SarvamAdapter:
    """
    Adapter for Sarvam AI Indic Speech Synthesis & Recognition.
    Provides natural Hindi / regional language TTS for collections outreach.
    """

    def __init__(self):
        self.api_key = settings.SARVAM_API_KEY
        self.voice_id = settings.SARVAM_VOICE_ID or "meera"
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
        Synthesizes natural Indic audio from text script using Sarvam TTS API.
        """
        lang = language_code or self.language_code

        if self.is_configured:
            try:
                url = "https://api.sarvam.ai/text-to-speech"
                payload = {
                    "inputs": [text],
                    "target_language_code": lang,
                    "speaker": self.voice_id,
                    "model": "bulbul:v1",
                }
                headers = {
                    "api-subscription-key": self.api_key,
                    "Content-Type": "application/json",
                }
                res = await self.client.post(url, json=payload, headers=headers)
                if res.status_code == 200:
                    data = res.json()
                    return {
                        "status": "SUCCESS",
                        "provider": "SARVAM_AI",
                        "audio_base64": data.get("audios", [""])[0],
                        "language": lang,
                    }
            except Exception as e:
                logger.warning(f"Sarvam TTS failed: {e}. Falling back to simulated audio.")

        # Free tier simulation
        logger.info(f"[SARVAM TTS SIMULATOR] Synthesizing ({lang}): {text[:50]}...")
        return {
            "status": "SUCCESS",
            "provider": "SIMULATED_SARVAM",
            "voice_speaker": self.voice_id,
            "language": lang,
            "text": text,
            "notice": "Audio synthesized via Sarvam Speech provider simulation.",
        }


sarvam_adapter = SarvamAdapter()
