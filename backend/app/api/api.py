from fastapi import APIRouter
from app.api.endpoints import auth, predict, reports, user, recommendations

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(predict.router, prefix="/predict", tags=["prediction"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(user.router, prefix="/user", tags=["user"])
api_router.include_router(recommendations.router, prefix="/recommendations", tags=["recommendations"])
