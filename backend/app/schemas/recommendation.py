from pydantic import BaseModel
from typing import List
from datetime import datetime

class RecommendationContent(BaseModel):
    category: str  # Diet, Activity, Medical Checkup, Medication, Lifestyle
    advice: str

class RecommendationResponse(BaseModel):
    id: str
    source_type: str  # prediction, report
    source_id: str
    content: List[RecommendationContent]
    created_at: datetime
