from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from datetime import datetime, timezone
from typing import List
import shutil
import os
from app.api.deps import get_current_user
from app.core.config import settings
from app.core.database import get_db
from app.schemas.report import ReportResponse
from app.services.ocr_service import ocr_service
from bson import ObjectId

router = APIRouter()

@router.post("/upload", response_model=ReportResponse)
async def upload_report(file: UploadFile = File(...), current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not available",
        )
        
    ext = os.path.splitext(file.filename)[1].lower()
    if ext not in [".pdf", ".png", ".jpg", ".jpeg"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported file format. Please upload a PDF, PNG, JPG, or JPEG file.",
        )
        
    # Generate unique filename on system disk
    file_id = str(ObjectId())
    stored_filename = f"{file_id}_{file.filename}"
    file_path = settings.UPLOAD_DIR / stored_filename
    
    # Save file on local filesystem
    try:
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not save file upload locally: {e}"
        )
        
    # Run parsing and analysis
    analysis = ocr_service.process_report(str(file_path), file.filename)
    
    # Save report metadata to MongoDB
    report_doc = {
        "_id": ObjectId(file_id),
        "user_id": current_user["_id"],
        "file_name": file.filename,
        "storage_path": str(file_path),
        "extracted_text": analysis["raw_text"],
        "summary": analysis["summary"],
        "markers_flagged": analysis["markers"],
        "created_at": datetime.now(timezone.utc)
    }
    
    await db["medical_reports"].insert_one(report_doc)
    
    # Create matching recommendations for high/low markers
    recommendations_content = []
    for marker in analysis["markers"]:
        if marker["status"] == "high":
            if "cholesterol" in marker["name"].lower():
                recommendations_content.append({
                    "category": "Diet",
                    "advice": "Elevated cholesterol detected. Reduce consumption of saturated fats and eat more fiber (beans, oats)."
                })
            elif "glucose" in marker["name"].lower() or "hba1c" in marker["name"].lower():
                recommendations_content.append({
                    "category": "Diet",
                    "advice": "Elevated glucose/sugar level detected. Limit refined carbohydrates and sweet drinks; focus on lean protein and veggies."
                })
        elif marker["status"] == "low":
            if "hemoglobin" in marker["name"].lower():
                recommendations_content.append({
                    "category": "Diet",
                    "advice": "Low hemoglobin levels found. Increase intake of iron-rich foods like spinach, red meat, or lentils."
                })

    if not recommendations_content:
        recommendations_content.append({
            "category": "Maintenance",
            "advice": "All tested parameters appear optimal. Maintain your current active lifestyle and balanced diet."
        })
        
    rec_doc = {
        "user_id": current_user["_id"],
        "source_type": "report",
        "source_id": ObjectId(file_id),
        "content": recommendations_content,
        "created_at": datetime.now(timezone.utc)
    }
    await db["recommendations"].insert_one(rec_doc)
    
    # Audit log
    audit_doc = {
        "user_id": current_user["_id"],
        "action": "UPLOADED_MEDICAL_REPORT",
        "timestamp": datetime.now(timezone.utc)
    }
    await db["audit_logs"].insert_one(audit_doc)
    
    return {
        "id": file_id,
        "file_name": report_doc["file_name"],
        "summary": report_doc["summary"],
        "markers_flagged": report_doc["markers_flagged"],
        "created_at": report_doc["created_at"]
    }

@router.get("/history", response_model=List[ReportResponse])
async def get_report_history(current_user: dict = Depends(get_current_user)):
    db = get_db()
    if db is None:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection is not available",
        )
        
    cursor = db["medical_reports"].find({"user_id": current_user["_id"]}).sort("created_at", -1).limit(20)
    history = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        history.append(doc)
        
    return history
