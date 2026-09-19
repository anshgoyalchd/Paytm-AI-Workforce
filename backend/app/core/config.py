from typing import Optional
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        case_sensitive=False,
        extra="ignore"
    )

    # Core App
    APP_NAME: str = "Paytm AI Workforce - Collections Agent"
    APP_ENV: str = "development"
    DEBUG: bool = True
    API_V1_STR: str = "/api/v1"
    SECRET_KEY: str = "paytm-collections-dev-secret-key-change-in-prod-32bytes"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 1440  # 24 hours

    # Database
    DATABASE_URL: str = "sqlite+aiosqlite:///./paytm_collections.db"

    # LLM & AI
    GEMINI_API_KEY: str = ""
    GEMINI_MODEL: str = "gemini-2.0-flash"

    # Telephony & Messaging (Twilio Free Trial / Mock fallback)
    TWILIO_ACCOUNT_SID: str = ""
    TWILIO_AUTH_TOKEN: str = ""
    TWILIO_PHONE_NUMBER: str = ""
    TWILIO_WHATSAPP_NUMBER: str = ""
    TWILIO_WHATSAPP_CONTENT_SID: str = ""

    # Indic Speech (Sarvam AI / Mock fallback)
    SARVAM_API_KEY: str = ""
    SARVAM_SPEECH_MODEL: str = "saaras:v1"
    SARVAM_VOICE_ID: str = "meera"
    SARVAM_LANGUAGE_CODE: str = "hi-IN"

    # Memory (Cognee Cloud / Local fallback)
    COGNEE_API_KEY: str = ""
    COGNEE_API_URL: str = "https://api.cognee.ai"
    COGNEE_BASE_URL: str = "https://api.cognee.ai"

    # Orchestration (n8n Cloud / Self-hosted)
    N8N_WEBHOOK_BASE_URL: str = "http://localhost:5678/webhook"
    N8N_BASE_URL: str = "http://localhost:5678"
    N8N_API_KEY: str = ""

    # Operational & Policy Guardrails (RBI / TRAI / Paytm Fair Practice Standards)
    POLICY_CALL_START_HOUR: int = 9       # 09:00 IST
    POLICY_CALL_END_HOUR: int = 19        # 19:00 IST
    POLICY_TIMEZONE: str = "Asia/Kolkata"
    POLICY_MAX_ATTEMPTS_PER_DAY: int = 2
    POLICY_MAX_CALLS_PER_WEEK: int = 4
    POLICY_MIN_HOURS_BETWEEN_TOUCHES: int = 4
    POLICY_DISPUTE_COOLDOWN_DAYS: int = 7
    POLICY_SETTLEMENT_MAX_DISCOUNT_PCT: float = 10.0
    POLICY_AUTO_ESCALATE_OVERDUE_DAYS: int = 60

    # Human-in-the-Loop default settings
    DEFAULT_AGENT_MODE: str = "autonomous"  # autonomous | supervised | paused
    AGENT_MAX_ACTIONS_PER_MINUTE: int = 30


settings = Settings()
