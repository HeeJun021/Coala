from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
from app.services import admin_service

router = APIRouter(prefix="/admin", tags=["Admin"])

@router.get("/summary")
def get_dashboard_summary(db: Session = Depends(get_db)):
    return admin_service.get_dashboard_summary(db)

@router.get("/reports/recent")
def get_recent_reports(db: Session = Depends(get_db)):
    return admin_service.get_recent_reports(db)

@router.get("/reports/weekly")
def get_weekly_report_trend(db: Session = Depends(get_db)):
    return admin_service.get_weekly_report_trend(db)