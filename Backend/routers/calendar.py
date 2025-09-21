"""
calendar.py
FastAPI router for Google Calendar integration
"""

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from datetime import datetime
from typing import Optional, Dict, Any
from utils.calendar_utils import sync_study_plan_to_calendar, remove_study_plan_from_calendar

router = APIRouter(prefix="/api/calendar", tags=["calendar"])

class CalendarSyncRequest(BaseModel):
    study_plan: Dict[str, Any]
    start_date: Optional[str] = None  # Format: "YYYY-MM-DD"

class CalendarResponse(BaseModel):
    success: bool
    message: str

@router.post("/sync", response_model=CalendarResponse)
async def sync_study_plan(request: CalendarSyncRequest):
    """
    Sync study plan to Google Calendar
    
    Args:
        request: Study plan data and optional start date
        
    Returns:
        CalendarResponse: Success status and message
    """
    try:
        start_date = None
        if request.start_date:
            try:
                start_date = datetime.strptime(request.start_date, "%Y-%m-%d")
            except ValueError:
                raise HTTPException(
                    status_code=400,
                    detail="Invalid date format. Please use YYYY-MM-DD format."
                )
        
        result = sync_study_plan_to_calendar(request.study_plan, start_date)
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result["message"])
        
        return CalendarResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to sync calendar: {str(e)}")

@router.delete("/events", response_model=CalendarResponse)
async def remove_study_events():
    """
    Remove existing StudyMentor events from Google Calendar
    
    Returns:
        CalendarResponse: Success status and message
    """
    try:
        result = remove_study_plan_from_calendar()
        
        if not result["success"]:
            raise HTTPException(status_code=500, detail=result["message"])
        
        return CalendarResponse(**result)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to remove calendar events: {str(e)}")

@router.get("/status")
async def get_calendar_status():
    """
    Check Google Calendar integration status
    
    Returns:
        Dict: Calendar integration status information
    """
    try:
        from utils.calendar_utils import calendar_integration
        import os
        
        credentials_exists = os.path.exists("credentials.json")
        token_exists = os.path.exists("token.json")
        
        # Provide setup guidance based on status
        if not credentials_exists:
            return {
                "credentials_file_exists": False,
                "token_file_exists": token_exists,
                "authentication_status": "not_configured",
                "integration_ready": False,
                "message": "Google Calendar integration not configured. Please follow the setup guide to create 'credentials.json' from Google Cloud Console.",
                "setup_needed": True
            }
        
        # Try to authenticate (without creating new tokens)
        authentication_status = "unknown"
        message = ""
        
        try:
            auth_success = calendar_integration.authenticate()
            if auth_success:
                authentication_status = "authenticated"
                message = "Google Calendar integration is ready!"
            else:
                authentication_status = "not_authenticated"
                message = "Authentication failed. Please check your credentials file."
        except Exception as auth_error:
            authentication_status = "error"
            message = f"Authentication error: {str(auth_error)}"
        
        return {
            "credentials_file_exists": credentials_exists,
            "token_file_exists": token_exists,
            "authentication_status": authentication_status,
            "integration_ready": credentials_exists and authentication_status == "authenticated",
            "message": message,
            "setup_needed": not credentials_exists
        }
        
    except Exception as e:
        return {
            "credentials_file_exists": False,
            "token_file_exists": False,
            "authentication_status": "error",
            "integration_ready": False,
            "message": f"Error checking calendar status: {str(e)}",
            "setup_needed": True,
            "error": str(e)
        }