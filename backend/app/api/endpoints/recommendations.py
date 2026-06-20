from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from app.api.deps import get_current_user
from app.core.database import get_db
from app.schemas.recommendation import RecommendationResponse

router = APIRouter()

@router.get("/", response_model=List[RecommendationResponse])
async def get_recommendations(current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not available",
        )
        
    cursor = db["recommendations"].find({"user_id": current_user["_id"]}).sort("created_at", -1).limit(20)
    recommendations = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        doc["source_id"] = str(doc["source_id"])
        recommendations.append(doc)
        
    return recommendations
