"""
base.py
Base Pydantic models for StudyMentor API
"""

from pydantic import BaseModel, Field
from typing import Any, Dict, Optional
from datetime import datetime

class BaseResponse(BaseModel):
    """Base response model for all API endpoints"""
    success: bool
    message: str = "Success"
    timestamp: str = Field(default_factory=lambda: datetime.utcnow().isoformat() + "Z")

class SuccessResponse(BaseResponse):
    """Success response with data"""
    success: bool = True
    data: Dict[str, Any]

class ErrorResponse(BaseResponse):
    """Error response model"""
    success: bool = False
    error: Dict[str, Any]

class HealthCheckData(BaseModel):
    """Health check response data"""
    status: str = "healthy"
    service: str = "StudyMentor API"
    version: str = "1.0.0"