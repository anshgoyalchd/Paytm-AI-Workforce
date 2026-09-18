from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from backend.app.core.database import get_db
from backend.app.core.security import (
    verify_password,
    create_access_token,
    get_password_hash,
    get_current_user_context,
    CurrentUserContext,
)
from backend.app.models.models import User, Merchant, AgentSetting
from backend.app.schemas.schemas import Token, LoginRequest, RegisterRequest

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=Token)
async def login(req: LoginRequest, db: AsyncSession = Depends(get_db)):
    stmt = select(User).where(User.email == req.email)
    result = await db.execute(stmt)
    user = result.scalar_one_or_none()

    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.status != "ACTIVE":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="User account is inactive",
        )

    m_res = await db.execute(select(Merchant).where(Merchant.id == user.merchant_id))
    merchant = m_res.scalar_one_or_none()

    access_token = create_access_token(
        data={
            "sub": user.id,
            "merchant_id": user.merchant_id,
            "email": user.email,
            "role": user.role,
            "name": user.name,
        }
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        merchant_id=user.merchant_id,
        user_id=user.id,
        role=user.role,
        name=user.name,
        business_name=merchant.name if merchant else None,
    )


@router.post("/register", response_model=Token, status_code=status.HTTP_201_CREATED)
async def register(req: RegisterRequest, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(select(User).where(User.email == req.email.strip().lower()))
    if existing.scalar_one_or_none():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An account with this email already exists",
        )

    # 1. Create Merchant
    merchant = Merchant(
        name=req.business_name.strip(),
        status="ACTIVE",
        timezone=req.timezone or "Asia/Kolkata",
    )
    db.add(merchant)
    await db.flush()

    # 2. Create Agent Settings
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
    db.add(settings)

    # 3. Create Owner User
    user = User(
        merchant_id=merchant.id,
        name=req.owner_name.strip(),
        email=req.email.strip().lower(),
        password_hash=get_password_hash(req.password),
        role="OWNER",
        status="ACTIVE",
    )
    db.add(user)
    await db.commit()
    await db.refresh(user)

    # 4. Generate Token
    access_token = create_access_token(
        data={
            "sub": user.id,
            "merchant_id": user.merchant_id,
            "email": user.email,
            "role": user.role,
            "name": user.name,
        }
    )

    return Token(
        access_token=access_token,
        token_type="bearer",
        merchant_id=user.merchant_id,
        user_id=user.id,
        role=user.role,
        name=user.name,
        business_name=merchant.name,
    )


@router.get("/me")
async def get_current_user_profile(
    current_user: CurrentUserContext = Depends(get_current_user_context),
    db: AsyncSession = Depends(get_db),
):
    stmt = select(User).where(User.id == current_user.user_id)
    res = await db.execute(stmt)
    user = res.scalar_one_or_none()
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    m_res = await db.execute(select(Merchant).where(Merchant.id == current_user.merchant_id))
    merchant = m_res.scalar_one_or_none()

    return {
        "user_id": user.id,
        "name": user.name,
        "email": user.email,
        "role": user.role,
        "merchant_id": user.merchant_id,
        "business_name": merchant.name if merchant else "My Business",
        "timezone": merchant.timezone if merchant else "Asia/Kolkata",
    }
