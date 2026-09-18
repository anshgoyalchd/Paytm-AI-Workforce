from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.core.database import get_db
from backend.app.core.security import get_current_user_context, CurrentUserContext
from backend.app.models.models import AgentSetting
from backend.app.schemas.schemas import AgentSettingsRead, AgentSettingsUpdate

router = APIRouter(prefix="/settings", tags=["Agent Governance & Settings"])


@router.get("", response_model=AgentSettingsRead)
async def get_settings(
    current_user: CurrentUserContext = Depends(get_current_user_context),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(AgentSetting).where(AgentSetting.merchant_id == current_user.merchant_id)
    res = await db.execute(stmt)
    setting = res.scalar_one_or_none()

    if not setting:
        setting = AgentSetting(merchant_id=current_user.merchant_id)
        db.add(setting)
        await db.commit()
        await db.refresh(setting)

    return setting


@router.put("", response_model=AgentSettingsRead)
async def update_settings(
    payload: AgentSettingsUpdate,
    current_user: CurrentUserContext = Depends(get_current_user_context),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(AgentSetting).where(AgentSetting.merchant_id == current_user.merchant_id)
    res = await db.execute(stmt)
    setting = res.scalar_one_or_none()

    if not setting:
        setting = AgentSetting(merchant_id=current_user.merchant_id)
        db.add(setting)

    update_data = payload.model_dump(exclude_unset=True)
    for field, val in update_data.items():
        setattr(setting, field, val)

    setting.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(setting)
    return setting


@router.post("/toggle-mode")
async def toggle_agent_mode(
    mode: str,  # AUTONOMOUS | SUPERVISED | PAUSED
    current_user: CurrentUserContext = Depends(get_current_user_context),
    db: AsyncSession = Depends(get_db),
):
    mode_upper = mode.upper()
    if mode_upper not in ("AUTONOMOUS", "SUPERVISED", "PAUSED"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mode must be AUTONOMOUS, SUPERVISED, or PAUSED",
        )

    stmt = select(AgentSetting).where(AgentSetting.merchant_id == current_user.merchant_id)
    res = await db.execute(stmt)
    setting = res.scalar_one_or_none()

    if not setting:
        setting = AgentSetting(merchant_id=current_user.merchant_id)
        db.add(setting)

    setting.agent_status = mode_upper
    setting.updated_at = datetime.now(timezone.utc)
    await db.commit()

    return {"status": "SUCCESS", "merchant_id": current_user.merchant_id, "agent_status": setting.agent_status}
