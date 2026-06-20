from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.schemas.user import UserRegister, UserLogin, Token
from bson import ObjectId

router = APIRouter()

@router.post("/register", status_code=status.HTTP_201_CREATED)
async def register(user_in: UserRegister):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not available",
        )
    
    # Check if email already registered
    existing_user = await db["users"].find_one({"email": user_in.email})
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered",
        )
    
    # Create user document
    user_doc = {
        "email": user_in.email,
        "username": user_in.username,
        "hashed_password": get_password_hash(user_in.password),
        "age": user_in.age,
        "gender": user_in.gender,
        "vitals_history": [],
        "created_at": datetime.now(timezone.utc)
    }
    
    result = await db["users"].insert_one(user_doc)
    
    # Create an initial login log or audit log
    audit_doc = {
        "user_id": result.inserted_id,
        "action": "USER_REGISTERED",
        "timestamp": datetime.now(timezone.utc)
    }
    await db["audit_logs"].insert_one(audit_doc)
    
    return {"message": "User registered successfully", "id": str(result.inserted_id)}

@router.post("/login", response_model=Token)
async def login(credentials: UserLogin):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not available",
        )
        
    user = await db["users"].find_one({"email": credentials.email})
    if not user or not verify_password(credentials.password, user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
        
    # Sign JWT token
    access_token = create_access_token(data={"sub": str(user["_id"])})
    
    # Log audit event
    audit_doc = {
        "user_id": user["_id"],
        "action": "USER_LOGGED_IN",
        "timestamp": datetime.now(timezone.utc)
    }
    await db["audit_logs"].insert_one(audit_doc)
    
    return {"access_token": access_token, "token_type": "bearer"}
