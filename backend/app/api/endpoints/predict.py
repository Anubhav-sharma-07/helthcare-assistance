from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone
from typing import List
from app.api.deps import get_current_user
from app.core.database import get_db
from app.schemas.predict import PredictRequest, PredictResponse
from app.services.ml_service import ml_service
from bson import ObjectId

router = APIRouter()

@router.post("/", response_model=PredictResponse)
async def predict_disease(payload: PredictRequest, current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not available",
        )
    
    if not payload.symptoms:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Symptoms list cannot be empty",
        )

    # Perform inference (ML model or Rule Fallback)
    inference = ml_service.predict(payload.symptoms)
    
    # Structure Prediction Document
    prediction_doc = {
        "user_id": current_user["_id"],
        "symptoms": payload.symptoms,
        "prediction_results": inference["results"],
        "care_guidance": inference["guidance"],
        "created_at": datetime.now(timezone.utc)
    }
    
    # Save Prediction History
    pred_res = await db["predictions"].insert_one(prediction_doc)
    prediction_id = str(pred_res.inserted_id)
    
    # Generate structured recommendation entry based on main disease prediction
    primary_disease = inference["results"][0]["disease"]
    recommendations_content = []
    
    if primary_disease != "General / Unknown":
        recommendations_content = [
            {
                "category": "Diet",
                "advice": f"Support recovery for {primary_disease} with fresh fluids and clean, home-cooked foods."
            },
            {
                "category": "Lifestyle",
                "advice": f"Ensure 8 hours of sleep and isolate/rest to manage symptoms of {primary_disease}."
            },
            {
                "category": "Medical Checkup",
                "advice": f"Schedule an appointment with a primary care practitioner for clinical validation of {primary_disease}."
            }
        ]
    else:
        recommendations_content = [
            {
                "category": "General Advice",
                "advice": "Monitor symptoms. Drink fluids and seek clinical attention if you experience severe shortness of breath or chest pain."
            }
        ]
        
    rec_doc = {
        "user_id": current_user["_id"],
        "source_type": "prediction",
        "source_id": ObjectId(prediction_id),
        "content": recommendations_content,
        "created_at": datetime.now(timezone.utc)
    }
    await db["recommendations"].insert_one(rec_doc)
    
    # Log Audit Event
    audit_doc = {
        "user_id": current_user["_id"],
        "action": "PERFORMED_DISEASE_PREDICTION",
        "timestamp": datetime.now(timezone.utc)
    }
    await db["audit_logs"].insert_one(audit_doc)

    return {
        "id": prediction_id,
        "symptoms": prediction_doc["symptoms"],
        "prediction_results": prediction_doc["prediction_results"],
        "care_guidance": prediction_doc["care_guidance"],
        "created_at": prediction_doc["created_at"]
    }

@router.get("/history", response_model=List[PredictResponse])
async def get_prediction_history(current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not available",
        )
        
    cursor = db["predictions"].find({"user_id": current_user["_id"]}).sort("created_at", -1).limit(20)
    history = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        history.append(doc)
        
    return history
