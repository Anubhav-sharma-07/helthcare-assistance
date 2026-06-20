from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone
from app.api.deps import get_current_user
from app.core.database import get_db
from app.schemas.user import UserProfileResponse, VitalLogCreate, VitalLogResponse
from bson import ObjectId

router = APIRouter()

@router.get("/me", response_model=UserProfileResponse)
async def get_profile(current_user: dict = Depends(get_current_user)):
    # Convert MongoDB ObjectId to string for compatibility with response DTO
    current_user["id"] = str(current_user["_id"])
    return current_user

@router.post("/vitals", response_model=VitalLogResponse)
async def log_vitals(vital_in: VitalLogCreate, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not available",
        )
        
    vital_log = {
        "heart_rate": vital_in.heart_rate,
        "blood_pressure": vital_in.blood_pressure,
        "blood_sugar": vital_in.blood_sugar,
        "bmi": vital_in.bmi,
        "recorded_at": datetime.now(timezone.utc)
    }
    
    # Append to the user's vitals history array
    await db["users"].update_one(
        {"_id": current_user["_id"]},
        {"$push": {
            "vitals_history": {
                "$each": [vital_log],
                "$slice": -100 # Maintain only the 100 most recent records
            }
        }}
    )
    
    # Audit log
    audit_doc = {
        "user_id": current_user["_id"],
        "action": "RECORDED_VITALS",
        "timestamp": datetime.now(timezone.utc)
    }
    await db["audit_logs"].insert_one(audit_doc)
    
    return vital_log
