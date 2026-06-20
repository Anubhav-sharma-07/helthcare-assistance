from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class ReportMarker(BaseModel):
    name: str
    value: float
    unit: str
    reference_range: str
    status: str  # high, low, normal

class ReportResponse(BaseModel):
    id: str
    file_name: str
    summary: str
    markers_flagged: List[ReportMarker]
    created_at: datetime
