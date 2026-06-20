from pydantic import BaseModel
from typing import List
from datetime import datetime

class PredictRequest(BaseModel):
    symptoms: List[str]

class PredictionItem(BaseModel):
    disease: str
    confidence: float

class PredictResponse(BaseModel):
    id: str
    symptoms: List[str]
    prediction_results: List[PredictionItem]
    care_guidance: str
    created_at: datetime
