# Project Questions and Decisions Log

This document tracks unresolved or resolved architectural, operational, and configuration decisions for the **Paytm AI Workforce — Autonomous AI Collections Agent**.

---

### Q-001: Default Contact Hours for Customer Outreach
- **Question ID**: Q-001
- **Question**: What contact hours should the Policy Engine enforce for automated calls and messages?
- **Why it matters**: Contacting customers during prohibited hours violates professional communication practices and typical collection policies.
- **Options**:
  - A) `09:00 - 19:00 IST` (Standard business window in India)
  - B) `10:00 - 18:00 IST` (Conservative window)
  - C) Unrestricted (Rejected: unsafe)
- **Current status**: RESOLVED
- **Blocking**: No
- **Decision**: Option A (`09:00 - 19:00 IST`) with configurable policy override in settings.
- **Date**: 2026-09-18

---

### Q-002: Maximum Automated Contact Attempts & Retries
- **Question ID**: Q-002
- **Question**: How many contact attempts should the Autonomous Agent be permitted to make before escalating to a human or pausing?
- **Why it matters**: Prevents runaway automation loops and customer harassment.
- **Options**:
  - A) 2 attempts per channel within 48 hours, then ESCALATE
  - B) 3 attempts total across all channels, then ESCALATE
  - C) Unlimited retries (Rejected: prohibited by PRD/Safety rules)
- **Current status**: RESOLVED
- **Blocking**: No
- **Decision**: Option A (Max 2 attempts per channel with at least 4 hours between attempts; escalates if unresolved after max attempts).
- **Date**: 2026-09-18

---

### Q-003: Gemini API Model Target for MVP
- **Question ID**: Q-003
- **Question**: Which Gemini model should be the primary reasoning engine?
- **Why it matters**: Requires structured JSON output support, low latency for conversational turns, and free-tier eligibility without forcing paid billing.
- **Options**:
  - A) `gemini-1.5-flash` / `gemini-2.0-flash` (Fast, supports structured JSON schemas, free tier available)
  - B) `gemini-1.5-pro` (Higher reasoning capacity, slightly higher latency)
- **Current status**: RESOLVED
- **Blocking**: No
- **Decision**: Default to `gemini-1.5-flash` with configuration toggle `GEMINI_MODEL` allowing `gemini-2.0-flash` or `gemini-1.5-pro`.
- **Date**: 2026-09-18

---

### Q-004: Database Engine for Local Development & Testing
- **Question ID**: Q-004
- **Question**: How should the transactional database be structured for zero-dependency local testing and Supabase deployment?
- **Why it matters**: Allows automated CI/local unit tests to run fast without requiring external cloud network calls or credit cards, while remaining 100% compatible with Supabase PostgreSQL.
- **Options**:
  - A) Dual-mode SQLAlchemy: PostgreSQL (asyncpg) when `DATABASE_URL` is set to Supabase, and SQLite (`aiosqlite`) for local automated testing and offline demos.
  - B) PostgreSQL only (Requires Docker or active cloud Supabase connection for every unit test).
- **Current status**: RESOLVED
- **Blocking**: No
- **Decision**: Option A (PostgreSQL DDL schema is primary; backend repositories support both asyncpg for Supabase and SQLite for deterministic unit tests).
- **Date**: 2026-09-18

---

### Q-005: Voice Interruption & Latency Architecture
- **Question ID**: Q-005
- **Question**: How should voice telephony interaction be structured given Twilio trial and Sarvam STT/TTS APIs?
- **Why it matters**: Undocumented real-time audio streaming or low-latency barge-in must not be hallucinated or faked.
- **Options**:
  - A) Turn-based conversational loop via Twilio TwiML `<Gather input="speech">` / audio streaming webhook to backend, processed via Sarvam STT -> Gemini -> Sarvam TTS -> Twilio audio response.
  - B) Full-duplex WebSocket streaming with acoustic echo cancellation (Requires custom WebRTC/audio gateway not in free tier).
- **Current status**: RESOLVED
- **Blocking**: No
- **Decision**: Option A (Reliable, verifiable turn-based telephony loop with explicit audio handling and conversational simulator).
- **Date**: 2026-09-18
