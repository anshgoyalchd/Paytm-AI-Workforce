from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from backend.app.core.config import settings
from backend.app.core.database import engine, Base

from backend.app.api.v1.auth import router as auth_router
from backend.app.api.v1.cases import router as cases_router
from backend.app.api.v1.decisions import router as decisions_router
from backend.app.api.v1.escalations import router as escalations_router
from backend.app.api.v1.analytics import router as analytics_router
from backend.app.api.v1.settings import router as settings_router
from backend.app.api.v1.simulator import router as simulator_router
from backend.app.api.v1.voice import router as voice_router
from backend.app.api.v1.mock_payment import router as mock_payment_router
from backend.app.api.webhooks import router as webhooks_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title=settings.APP_NAME,
    description="Autonomous AI Workforce Collections Employee Backend API",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount V1 Routers
api_v1_prefix = settings.API_V1_STR
app.include_router(auth_router, prefix=api_v1_prefix)
app.include_router(cases_router, prefix=api_v1_prefix)
app.include_router(decisions_router, prefix=api_v1_prefix)
app.include_router(escalations_router, prefix=api_v1_prefix)
app.include_router(analytics_router, prefix=api_v1_prefix)
app.include_router(settings_router, prefix=api_v1_prefix)
app.include_router(simulator_router, prefix=api_v1_prefix)
app.include_router(voice_router, prefix=api_v1_prefix)

# Mount Mock & Webhook Routers
app.include_router(mock_payment_router, prefix="/api")
app.include_router(webhooks_router, prefix="/api")


@app.get("/health")
async def health_check():
    return {
        "status": "HEALTHY",
        "app_name": settings.APP_NAME,
        "env": settings.APP_ENV,
        "mode": "ACTIVE",
    }
