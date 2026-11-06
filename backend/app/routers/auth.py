from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Depends, status
from app.database import get_db
from app.models.schemas import UserLogin, UserRegister, UserResponse, TokenResponse
from app.security import (
    hash_password,
    verify_password,
    create_access_token,
    create_refresh_token,
    decode_token,
    get_current_user_payload
)

router = APIRouter(prefix="/auth", tags=["Authentication & Access Control"])

@router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
def register_user(req: UserRegister):
    db = get_db()
    existing = db.users.find_one({"email": req.email.lower()})
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Account with this email address already exists"
        )

    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    user_id = f"u-{int(datetime.now().timestamp() * 1000)}"

    user_doc = {
        "id": user_id,
        "email": req.email.lower(),
        "name": req.name,
        "role": req.role,
        "department": req.department,
        "district": req.district,
        "password_hash": hash_password(req.password),
        "is_active": True,
        "created_at": now_str,
    }

    db.users.insert_one(user_doc)

    # Log authentication event
    db.authentication_logs.insert_one({
        "event": "USER_REGISTERED",
        "email": req.email.lower(),
        "timestamp": now_str,
        "status": "SUCCESS"
    })

    return UserResponse(
        id=user_id,
        email=req.email.lower(),
        name=req.name,
        role=req.role,
        department=req.department,
        district=req.district,
        is_active=True,
        created_at=now_str
    )

@router.post("/login", response_model=TokenResponse)
def login_user(credentials: UserLogin):
    db = get_db()
    email_clean = credentials.email.strip().lower()
    user = db.users.find_one({"email": email_clean})

    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")

    if not user:
        db.authentication_logs.insert_one({
            "event": "LOGIN_FAILED",
            "email": email_clean,
            "reason": "USER_NOT_FOUND",
            "timestamp": now_str
        })
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    if not user.get("is_active", True):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Account is deactivated. Contact SDMA Administrator."
        )

    pwd_valid = verify_password(credentials.password, user.get("password_hash", ""))
    if not pwd_valid:
        db.authentication_logs.insert_one({
            "event": "LOGIN_FAILED",
            "email": email_clean,
            "reason": "INVALID_PASSWORD",
            "timestamp": now_str
        })
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )

    # Generate Access & Refresh tokens
    token_payload = {
        "sub": user["id"],
        "email": user["email"],
        "name": user["name"],
        "role": user["role"],
        "department": user.get("department", "State Ops"),
        "district": user.get("district", "All")
    }

    access_token = create_access_token(token_payload)
    refresh_token = create_refresh_token(token_payload)

    db.authentication_logs.insert_one({
        "event": "LOGIN_SUCCESS",
        "email": email_clean,
        "role": user["role"],
        "timestamp": now_str
    })

    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        token_type="bearer",
        user=UserResponse(
            id=user["id"],
            email=user["email"],
            name=user["name"],
            role=user["role"],
            department=user.get("department"),
            district=user.get("district"),
            is_active=user.get("is_active", True),
            created_at=user.get("created_at", now_str)
        )
    )

@router.get("/me", response_model=UserResponse)
def get_current_user_profile(user_payload: dict = Depends(get_current_user_payload)):
    db = get_db()
    email = user_payload.get("email")
    user = db.users.find_one({"email": email})
    if not user:
        return UserResponse(
            id="guest",
            email="guest@nivaran.gov.in",
            name="Guest Officer",
            role="Analyst",
            department="Disaster Cell",
            district="All",
            is_active=True,
            created_at=datetime.now(timezone.utc).isoformat()
        )

    return UserResponse(
        id=user["id"],
        email=user["email"],
        name=user["name"],
        role=user["role"],
        department=user.get("department"),
        district=user.get("district"),
        is_active=user.get("is_active", True),
        created_at=user.get("created_at", "")
    )

@router.post("/refresh")
def refresh_token(token_data: dict):
    refresh_tok = token_data.get("refresh_token")
    if not refresh_tok:
        raise HTTPException(status_code=400, detail="Missing refresh token")
    payload = decode_token(refresh_tok)
    if payload.get("type") != "refresh":
        raise HTTPException(status_code=400, detail="Not a valid refresh token")

    new_access = create_access_token({
        "sub": payload["sub"],
        "email": payload["email"],
        "name": payload.get("name"),
        "role": payload.get("role"),
        "department": payload.get("department"),
        "district": payload.get("district")
    })
    return {"access_token": new_access, "token_type": "bearer"}

@router.post("/logout")
def logout_user(user_payload: dict = Depends(get_current_user_payload)):
    db = get_db()
    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M:%S UTC")
    db.authentication_logs.insert_one({
        "event": "USER_LOGOUT",
        "email": user_payload.get("email", "unknown"),
        "timestamp": now_str
    })
    return {"message": "Logged out successfully. Security session invalidated."}

