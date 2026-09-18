import asyncio
from datetime import datetime, timezone, timedelta
from sqlalchemy import select
from backend.app.core.database import engine, Base, AsyncSessionLocal
from backend.app.core.security import get_password_hash
from backend.app.models.models import (
    Merchant,
    User,
    Customer,
    Invoice,
    CollectionCase,
    AgentSetting,
    AuditEvent,
)


async def seed_data():
    print("Initializing database tables...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as session:
        # Check if already seeded
        result = await session.execute(select(Merchant).filter_by(id="merch_raj_electronics"))
        existing_merchant = result.scalar_one_or_none()

        if existing_merchant:
            print("Database already contains demo merchant 'Raj Electronics'. Skipping seed.")
            return

        print("Seeding demo merchant & users...")
        now = datetime.now(timezone.utc)

        # 1. Merchant
        merchant = Merchant(
            id="merch_raj_electronics",
            name="Raj Electronics & Retail",
            status="ACTIVE",
            timezone="Asia/Kolkata",
            created_at=now,
        )
        session.add(merchant)
        await session.flush()

        # 2. Agent Settings
        settings = AgentSetting(
            merchant_id=merchant.id,
            agent_status="ACTIVE",
            contact_start_hour=9,
            contact_end_hour=19,
            max_contact_attempts=2,
            min_hours_between_contacts=4,
            auto_voice_enabled=True,
            auto_whatsapp_enabled=True,
        )
        session.add(settings)

        # 3. Users
        operator = User(
            id="user_operator_1",
            merchant_id=merchant.id,
            name="Rajesh Sharma",
            email="operator@rajelectronics.com",
            password_hash=get_password_hash("Password123!"),
            role="OPERATOR",
            status="ACTIVE",
        )
        manager = User(
            id="user_manager_1",
            merchant_id=merchant.id,
            name="Pooja Verma",
            email="manager@rajelectronics.com",
            password_hash=get_password_hash("Password123!"),
            role="MANAGER",
            status="ACTIVE",
        )
        session.add_all([operator, manager])

        # 4. Customers
        c1 = Customer(
            id="cust_rahul_sharma",
            merchant_id=merchant.id,
            name="Rahul Sharma",
            phone="+919876543210",
            email="rahul.sharma@example.com",
            preferred_language="Hindi",
            preferred_channel="WHATSAPP",
            contact_status="CONTACTABLE",
        )
        c2 = Customer(
            id="cust_amit_kumar",
            merchant_id=merchant.id,
            name="Amit Kumar",
            phone="+919876543211",
            email="amit.kumar@example.com",
            preferred_language="Hindi",
            preferred_channel="VOICE",
            contact_status="CONTACTABLE",
        )
        c3 = Customer(
            id="cust_priya_singh",
            merchant_id=merchant.id,
            name="Priya Singh",
            phone="+919876543212",
            email="priya.singh@example.com",
            preferred_language="English",
            preferred_channel="WHATSAPP",
            contact_status="CONTACTABLE",
        )
        c4 = Customer(
            id="cust_vikram_patel",
            merchant_id=merchant.id,
            name="Vikram Patel",
            phone="+919876543213",
            email="vikram.p@example.com",
            preferred_language="Hindi",
            preferred_channel="WHATSAPP",
            contact_status="CONTACTABLE",
        )
        c5 = Customer(
            id="cust_sunita_devi",
            merchant_id=merchant.id,
            name="Sunita Devi",
            phone="+919876543214",
            email="sunita.d@example.com",
            preferred_language="Hindi",
            preferred_channel="VOICE",
            contact_status="CONTACTABLE",
        )
        session.add_all([c1, c2, c3, c4, c5])

        # 5. Invoices
        inv1 = Invoice(
            id="inv_001",
            merchant_id=merchant.id,
            customer_id=c1.id,
            invoice_number="INV-2026-001",
            amount=14500.00,
            currency="INR",
            issue_date=now - timedelta(days=45),
            due_date=now - timedelta(days=15),
            status="OVERDUE",
        )
        inv2 = Invoice(
            id="inv_002",
            merchant_id=merchant.id,
            customer_id=c2.id,
            invoice_number="INV-2026-002",
            amount=42000.00,
            currency="INR",
            issue_date=now - timedelta(days=75),
            due_date=now - timedelta(days=45),
            status="OVERDUE",
        )
        inv3 = Invoice(
            id="inv_003",
            merchant_id=merchant.id,
            customer_id=c3.id,
            invoice_number="INV-2026-003",
            amount=8250.00,
            currency="INR",
            issue_date=now - timedelta(days=35),
            due_date=now - timedelta(days=5),
            status="OVERDUE",
        )
        inv4 = Invoice(
            id="inv_004",
            merchant_id=merchant.id,
            customer_id=c4.id,
            invoice_number="INV-2026-004",
            amount=95000.00,
            currency="INR",
            issue_date=now - timedelta(days=95),
            due_date=now - timedelta(days=65),
            status="OVERDUE",
        )
        inv5 = Invoice(
            id="inv_005",
            merchant_id=merchant.id,
            customer_id=c5.id,
            invoice_number="INV-2026-005",
            amount=5400.00,
            currency="INR",
            issue_date=now - timedelta(days=52),
            due_date=now - timedelta(days=22),
            status="OVERDUE",
        )
        session.add_all([inv1, inv2, inv3, inv4, inv5])
        await session.flush()

        # 6. Collection Cases
        case1 = CollectionCase(
            id="case_001",
            merchant_id=merchant.id,
            customer_id=c1.id,
            invoice_id=inv1.id,
            status="NEW",
            priority="MEDIUM",
            outstanding_amount=14500.00,
            currency="INR",
            assigned_mode="AUTONOMOUS",
            opened_at=now - timedelta(days=15),
        )
        case2 = CollectionCase(
            id="case_002",
            merchant_id=merchant.id,
            customer_id=c2.id,
            invoice_id=inv2.id,
            status="CONTACT_ATTEMPTED",
            priority="HIGH",
            outstanding_amount=42000.00,
            currency="INR",
            assigned_mode="AUTONOMOUS",
            opened_at=now - timedelta(days=45),
        )
        case3 = CollectionCase(
            id="case_003",
            merchant_id=merchant.id,
            customer_id=c3.id,
            invoice_id=inv3.id,
            status="NEW",
            priority="LOW",
            outstanding_amount=8250.00,
            currency="INR",
            assigned_mode="AUTONOMOUS",
            opened_at=now - timedelta(days=5),
        )
        case4 = CollectionCase(
            id="case_004",
            merchant_id=merchant.id,
            customer_id=c4.id,
            invoice_id=inv4.id,
            status="ESCALATED",
            priority="HIGH",
            outstanding_amount=95000.00,
            currency="INR",
            assigned_mode="SUPERVISED",
            opened_at=now - timedelta(days=65),
        )
        case5 = CollectionCase(
            id="case_005",
            merchant_id=merchant.id,
            customer_id=c5.id,
            invoice_id=inv5.id,
            status="PROMISE_TO_PAY",
            priority="MEDIUM",
            outstanding_amount=5400.00,
            currency="INR",
            assigned_mode="AUTONOMOUS",
            opened_at=now - timedelta(days=22),
        )
        session.add_all([case1, case2, case3, case4, case5])
        await session.flush()

        # 7. Initial Audit Log
        audit = AuditEvent(
            merchant_id=merchant.id,
            actor_type="SYSTEM",
            event_type="DEMO_DATA_SEEDED",
            metadata_safe='{"message": "Synthetic demo workforce initialized successfully"}',
        )
        session.add(audit)

        await session.commit()
        print("Demo data seeded successfully!")


if __name__ == "__main__":
    asyncio.run(seed_data())
