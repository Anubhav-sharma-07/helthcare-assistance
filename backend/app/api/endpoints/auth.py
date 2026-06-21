from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone, timedelta
import random
import smtplib
import logging
from email.mime.text import MIMEText
from app.core.config import settings
from app.core.database import get_db
from app.core.security import get_password_hash, verify_password, create_access_token
from app.schemas.user import UserRegister, UserLogin, Token, OTPSend, OTPVerify
from bson import ObjectId

logger = logging.getLogger("uvicorn.error")

def send_email_otp(to_email: str, otp_code: str) -> bool:
    if not settings.SMTP_USERNAME or not settings.SMTP_PASSWORD:
        logger.warning("SMTP credentials not configured. Falling back to local console log.")
        return False
    
    from_email = settings.SMTP_FROM_EMAIL or settings.SMTP_USERNAME
    subject = f"{settings.PROJECT_NAME} - Verification OTP Code"
    body = f"""Hello,

Your verification security code to access the SmartCare Clinical Portal is: {otp_code}

This code is valid for 5 minutes. If you did not request this code, please ignore this email.

Best regards,
SmartCare Portal Support Team
"""
    
    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = from_email
    msg["To"] = to_email
    
    try:
        if settings.SMTP_PORT == 465:
            server = smtplib.SMTP_SSL(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
        else:
            server = smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=10)
            server.starttls()
            
        server.login(settings.SMTP_USERNAME, settings.SMTP_PASSWORD)
        server.sendmail(from_email, [to_email], msg.as_string())
        server.quit()
        logger.info(f"OTP email successfully sent to {to_email}")
        return True
    except Exception as e:
        logger.error(f"Failed to send email to {to_email} via SMTP: {e}")
        return False


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

@router.post("/send-otp")
async def send_otp(otp_in: OTPSend):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not available",
        )
    
    email = otp_in.email.lower().strip()
    
    # Check if the user exists
    user = await db["users"].find_one({"email": email})
    is_registered = user is not None
    
    # Generate 6 digit numeric OTP code
    otp_code = f"{random.randint(100000, 999999)}"
    
    # Remove any existing OTPs for this email
    await db["otps"].delete_many({"email": email})
    
    # Store new OTP code with a 5 minutes expiry
    expiry = datetime.now(timezone.utc) + timedelta(minutes=5)
    await db["otps"].insert_one({
        "email": email,
        "otp": otp_code,
        "expiry": expiry,
        "created_at": datetime.now(timezone.utc)
    })
    
    # Log to server console
    logger.info(f"\n========================================\n[SIMULATED EMAIL] OTP for {email}: {otp_code}\n========================================\n")
    
    # Try sending real email
    email_sent = send_email_otp(email, otp_code)
    
    return {
        "message": "OTP verification code sent to email." if email_sent else "OTP code logged to console (local fallback).",
        "is_registered": is_registered,
        "debug_otp": otp_code  # Expose to frontend to facilitate seamless local testing simulation
    }

@router.post("/verify-otp", response_model=Token)
async def verify_otp(verify_in: OTPVerify):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not available",
        )
        
    email = verify_in.email.lower().strip()
    otp_code = verify_in.otp.strip()
    
    # Find matching OTP
    otp_record = await db["otps"].find_one({"email": email, "otp": otp_code})
    if not otp_record:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid OTP verification code",
        )
    
    # Check expiry
    expiry = otp_record.get("expiry")
    if expiry:
        now = datetime.now(timezone.utc)
        if expiry.tzinfo is None:
            expiry = expiry.replace(tzinfo=timezone.utc)
        if now > expiry:
            await db["otps"].delete_many({"email": email})
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="OTP verification code has expired",
            )
            
    # Delete the OTP record as it has been used
    await db["otps"].delete_many({"email": email})
    
    # Verify/create user
    user = await db["users"].find_one({"email": email})
    
    if user:
        # Returning user: update/save password and log in
        hashed_password = get_password_hash(verify_in.password)
        await db["users"].update_one(
            {"_id": user["_id"]},
            {"$set": {"hashed_password": hashed_password}}
        )
        user_id = user["_id"]
        action = "USER_LOGGED_IN_OTP"
    else:
        # New user registration
        username = verify_in.username or email.split("@")[0]
        age = verify_in.age if verify_in.age is not None else 30
        gender = verify_in.gender or "other"
        
        user_doc = {
            "email": email,
            "username": username,
            "hashed_password": get_password_hash(verify_in.password),
            "age": age,
            "gender": gender,
            "vitals_history": [],
            "created_at": datetime.now(timezone.utc)
        }
        result = await db["users"].insert_one(user_doc)
        user_id = result.inserted_id
        action = "USER_REGISTERED_OTP"
        
    # Sign JWT token
    access_token = create_access_token(data={"sub": str(user_id)})
    
    # Log audit event
    audit_doc = {
        "user_id": user_id,
        "action": action,
        "timestamp": datetime.now(timezone.utc)
    }
    await db["audit_logs"].insert_one(audit_doc)
    
    return {"access_token": access_token, "token_type": "bearer"}

