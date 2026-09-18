import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from backend.app.main import app


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://testserver") as ac:
        yield ac


@pytest.mark.asyncio
async def test_health_check(client: AsyncClient):
    response = await client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "HEALTHY"


@pytest.mark.asyncio
async def test_auth_and_protected_routes(client: AsyncClient):
    # 1. Register a new real merchant business
    uid = uuid.uuid4().hex[:8]
    email = f"owner_{uid}@apexretail.com"
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={
            "business_name": f"Apex Retail {uid}",
            "owner_name": "Apex Owner",
            "email": email,
            "password": "Password123!",
            "phone": "+919876543210",
        },
    )
    assert reg_res.status_code == 201
    token_data = reg_res.json()
    assert "access_token" in token_data
    assert token_data["business_name"] == f"Apex Retail {uid}"
    token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. Get Profile (/auth/me)
    me_res = await client.get("/api/v1/auth/me", headers=headers)
    assert me_res.status_code == 200
    assert me_res.json()["business_name"] == f"Apex Retail {uid}"

    # 3. Create a Single Case
    create_res = await client.post(
        "/api/v1/cases",
        headers=headers,
        json={
            "customer_name": "Ramesh Sharma",
            "customer_phone": "+919876543210",
            "invoice_number": f"INV-{uid}-001",
            "amount": 18500.0,
            "due_date": "2026-03-01",
            "preferred_language": "Hindi",
        },
    )
    assert create_res.status_code == 201
    created_case = create_res.json()
    assert created_case["outstanding_amount"] == 18500.0
    assert created_case["customer"]["name"] == "Ramesh Sharma"

    # 4. Upload CSV Bulk Cases
    csv_content = (
        "customer_name,phone,invoice_number,amount,due_date,language\n"
        f"Sita Patel,+919876543212,INV-{uid}-002,42000,2026-02-15,English\n"
        f"Vikram Singh,+919876543213,INV-{uid}-003,9500,2026-03-10,Hinglish\n"
    )
    files = {"file": ("cases.csv", csv_content.encode("utf-8"), "text/csv")}
    csv_res = await client.post("/api/v1/cases/upload-csv", headers=headers, files=files)
    assert csv_res.status_code == 200
    assert csv_res.json()["imported_count"] == 2

    # 5. List Cases
    cases_res = await client.get("/api/v1/cases", headers=headers)
    assert cases_res.status_code == 200
    cases = cases_res.json()
    assert len(cases) == 3

    # 6. Analytics Overview
    analytics_res = await client.get("/api/v1/analytics/overview", headers=headers)
    assert analytics_res.status_code == 200
    overview = analytics_res.json()
    assert overview["total_cases"] == 3
    assert overview["active_cases"] == 3

    # 7. Settings & Mode Toggle
    settings_res = await client.get("/api/v1/settings", headers=headers)
    assert settings_res.status_code == 200
    assert settings_res.json()["agent_status"] in ("ACTIVE", "AUTONOMOUS", "SUPERVISED", "PAUSED")

    toggle_res = await client.post("/api/v1/settings/toggle-mode?mode=SUPERVISED", headers=headers)
    assert toggle_res.status_code == 200
    assert toggle_res.json()["agent_status"] == "SUPERVISED"

    # Reset back to AUTONOMOUS
    await client.post("/api/v1/settings/toggle-mode?mode=AUTONOMOUS", headers=headers)


@pytest.mark.asyncio
async def test_simulator_scenarios(client: AsyncClient):
    # Register a merchant
    uid = uuid.uuid4().hex[:8]
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={
            "business_name": f"Sim Merchant {uid}",
            "owner_name": "Sim Owner",
            "email": f"sim_{uid}@test.com",
            "password": "Password123!",
        },
    )
    token = reg_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Create a case for simulation
    c_res = await client.post(
        "/api/v1/cases",
        headers=headers,
        json={
            "customer_name": "Test Debtor",
            "customer_phone": "+919876543299",
            "invoice_number": f"INV-SIM-{uid}",
            "amount": 14500.0,
        },
    )
    case_id = c_res.json()["id"]

    # Get scenarios catalog
    scenarios_res = await client.get("/api/v1/simulator/scenarios")
    assert scenarios_res.status_code == 200
    scenarios = scenarios_res.json()
    assert len(scenarios) == 8

    # Run Scenario 1: Immediate Pay
    sim1_res = await client.post(
        "/api/v1/simulator/run",
        headers=headers,
        json={"case_id": case_id, "scenario_name": "immediate_pay"},
    )
    assert sim1_res.status_code == 200
    data1 = sim1_res.json()
    assert data1["detected_intent"] == "CONFIRM_PAYMENT"
    assert "https://paytm.com/pay" in data1["agent_response"]


@pytest.mark.asyncio
async def test_mock_payment_gateway_endpoint(client: AsyncClient):
    # Query payment verification for an invoice
    res = await client.get("/api/mock/payments/inv_001")
    assert res.status_code == 200
    data = res.json()
    assert data["is_mock"] is True
    assert "status" in data
    assert "MOCKED PAYMENT GATEWAY" in data["notice"]
