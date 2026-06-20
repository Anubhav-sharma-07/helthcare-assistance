from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional
from datetime import datetime

class VitalLogCreate(BaseModel):
    heart_rate: int = Field(..., ge=30, le=220)
    blood_pressure: str = Field(..., pattern=r"^\d{2,3}/\d{2,3}$")
    blood_sugar: int = Field(..., ge=30, le=500)
    bmi: float = Field(..., ge=10.0, le=50.0)

class VitalLogResponse(VitalLogCreate):
    recorded_at: datetime

class UserRegister(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6)
    age: int = Field(..., ge=0, le=120)
    gender: str = Field(..., pattern="^(male|female|other)$")

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class UserProfileResponse(BaseModel):
    id: str
    email: EmailStr
    username: str
    age: int
    gender: str
    vitals_history: List[VitalLogResponse] = []
    created_at: datetime
