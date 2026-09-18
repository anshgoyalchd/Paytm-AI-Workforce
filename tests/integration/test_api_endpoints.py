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
    # 1. Login with demo operator
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "operator@rajelectronics.com", "password": "Password123!"},
    )
    assert login_res.status_code == 200
    token_data = login_res.json()
    assert "access_token" in token_data
    token = token_data["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 2. List Cases
    cases_res = await client.get("/api/v1/cases", headers=headers)
    assert cases_res.status_code == 200
    cases = cases_res.json()
    assert len(cases) >= 5

    # 3. Analytics Overview
    analytics_res = await client.get("/api/v1/analytics/overview", headers=headers)
    assert analytics_res.status_code == 200
    overview = analytics_res.json()
    assert overview["total_cases"] >= 5
    assert overview["governance"]["compliance_adherence_pct"] == 100.0

    # 4. Settings & Mode Toggle
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
    # Login to get token
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": "operator@rajelectronics.com", "password": "Password123!"},
    )
    token = login_res.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # Get scenarios catalog
    scenarios_res = await client.get("/api/v1/simulator/scenarios")
    assert scenarios_res.status_code == 200
    scenarios = scenarios_res.json()
    assert len(scenarios) == 8

    # Run Scenario 1: Immediate Pay
    sim1_res = await client.post(
        "/api/v1/simulator/run",
        headers=headers,
        json={"case_id": "case_003", "scenario_name": "immediate_pay"},
    )
    assert sim1_res.status_code == 200
    data1 = sim1_res.json()
    assert data1["detected_intent"] == "CONFIRM_PAYMENT"
    assert "https://paytm.com/pay" in data1["agent_response"]

    # Run Scenario 3: Dispute Amount
    sim3_res = await client.post(
        "/api/v1/simulator/run",
        headers=headers,
        json={"case_id": "case_002", "scenario_name": "dispute_amount"},
    )
    assert sim3_res.status_code == 200
    data3 = sim3_res.json()
    assert data3["detected_intent"] == "DISPUTE_AMOUNT"
    assert data3["escalated"] is True
    assert data3["case_status_after"] == "ESCALATED"


@pytest.mark.asyncio
async def test_mock_payment_gateway_endpoint(client: AsyncClient):
    # Query payment verification for an invoice
    res = await client.get("/api/mock/payments/inv_001")
    assert res.status_code == 200
    data = res.json()
    assert data["is_mock"] is True
    assert "status" in data
    assert "MOCKED PAYMENT GATEWAY" in data["notice"]
