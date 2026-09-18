import pytest
import pytest_asyncio
from datetime import datetime, timezone, timedelta
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession
from backend.app.core.database import Base
from backend.app.models.models import (
    Merchant,
    Customer,
    Invoice,
    CollectionCase,
    AgentSetting,
)
from backend.app.agents.collections_agent import collections_agent
from backend.app.providers.payment_mock import payment_gateway
from backend.app.schemas.schemas import VerificationStatus


@pytest_asyncio.fixture
async def test_db_session():
    test_engine = create_async_engine("sqlite+aiosqlite:///:memory:", echo=False)
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    session_maker = async_sessionmaker(bind=test_engine, class_=AsyncSession, expire_on_commit=False)
    async with session_maker() as session:
        # Seed test data
        now = datetime.now(timezone.utc)
        merch = Merchant(id="m_test", name="Test Store", status="ACTIVE")
        settings = AgentSetting(
            merchant_id="m_test",
            agent_status="ACTIVE",
            contact_start_hour=0,  # 24h allowed for test
            contact_end_hour=24,
            max_contact_attempts=5,
        )
        cust = Customer(
            id="c_test",
            merchant_id="m_test",
            name="Ramesh Gupta",
            phone="+919876500000",
            preferred_language="Hindi",
            preferred_channel="WHATSAPP",
        )
        inv = Invoice(
            id="inv_test_paid",
            merchant_id="m_test",
            customer_id="c_test",
            invoice_number="INV-TEST-001",
            amount=5000.0,
            issue_date=now - timedelta(days=10),
            due_date=now - timedelta(days=2),
            status="OVERDUE",
        )
        case = CollectionCase(
            id="case_test_001",
            merchant_id="m_test",
            customer_id="c_test",
            invoice_id="inv_test_paid",
            status="NEW",
            outstanding_amount=5000.0,
        )
        session.add_all([merch, settings, cust, inv, case])
        await session.commit()
        yield session


@pytest.mark.asyncio
async def test_collections_agent_verify_and_settle(test_db_session: AsyncSession):
    # Customer claims payment was made
    payment_gateway.set_invoice_status("inv_test_paid", VerificationStatus.PAID)

    result = await collections_agent.process_turn(
        session=test_db_session,
        case_id="case_test_001",
        incoming_message="Bhaiya maine kal hi payment kar diya tha",
    )

    assert result["customer_intent"] == "ALREADY_PAID"
    assert result["verification_status"] == "PAID"
    assert result["case_status"] == "SETTLED"
    payment_gateway.clear_overrides()


@pytest.mark.asyncio
async def test_collections_agent_dispute_escalation(test_db_session: AsyncSession):
    # Customer raises dispute about amount
    result = await collections_agent.process_turn(
        session=test_db_session,
        case_id="case_test_001",
        incoming_message="Ye galat bill hai, maine itna saman nahi liya tha!",
    )

    assert result["customer_intent"] == "DISPUTE_AMOUNT"
    assert result["proposed_action"] == "ESCALATE"
    assert result["is_escalated"] is True
    assert result["case_status"] == "ESCALATED"
