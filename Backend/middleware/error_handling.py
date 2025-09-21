"""
error_handling.py
Custom error handlers and middleware for StudyMentor API
"""

from fastapi import Request, HTTPException
from fastapi.responses import JSONResponse
from datetime import datetime
import logging
import traceback

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class StudyMentorException(Exception):
    """Base exception for StudyMentor API"""
    def __init__(self, message: str, code: str = "INTERNAL_ERROR", details: dict = None):
        self.message = message
        self.code = code
        self.details = details or {}
        super().__init__(self.message)

class LLMQuotaExceededException(StudyMentorException):
    """Exception raised when LLM quota is exceeded"""
    def __init__(self, message: str = "LLM quota exceeded, using fallback", details: dict = None):
        super().__init__(message, "LLM_QUOTA_EXCEEDED", details)

class FileProcessingException(StudyMentorException):
    """Exception raised during file processing"""
    def __init__(self, message: str = "File processing failed", details: dict = None):
        super().__init__(message, "FILE_PROCESSING_ERROR", details)

class ValidationException(StudyMentorException):
    """Exception raised for validation errors"""
    def __init__(self, message: str = "Validation failed", details: dict = None):
        super().__init__(message, "VALIDATION_ERROR", details)

async def studymentor_exception_handler(request: Request, exc: StudyMentorException):
    """Custom exception handler for StudyMentor exceptions"""
    logger.error(f"StudyMentor Exception: {exc.code} - {exc.message}")
    
    return JSONResponse(
        status_code=400 if exc.code == "VALIDATION_ERROR" else 500,
        content={
            "success": False,
            "error": {
                "code": exc.code,
                "message": exc.message,
                "details": exc.details
            },
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    )

async def general_exception_handler(request: Request, exc: Exception):
    """Handler for unexpected exceptions"""
    logger.error(f"Unexpected error: {str(exc)}")
    logger.error(traceback.format_exc())
    
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_SERVER_ERROR",
                "message": "An unexpected error occurred",
                "details": {}
            },
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    )

def create_success_response(data: dict, message: str = "Success"):
    """Helper function to create consistent success responses"""
    return {
        "success": True,
        "data": data,
        "message": message,
        "timestamp": datetime.utcnow().isoformat() + "Z"
    }