"""
app.py
FastAPI backend entry point for StudyMentor
Replaces the previous Streamlit mock UI with a proper REST API
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime
import uvicorn
import os
from dotenv import load_dotenv

# Import custom middleware and exceptions
from middleware.error_handling import (
    StudyMentorException, 
    studymentor_exception_handler,
    general_exception_handler,
    create_success_response
)

# Import routers
from routers import quiz, study_plan, syllabus, calendar, auth, ai

# Load environment variables
load_dotenv()

# Create FastAPI app instance
app = FastAPI(
    title="StudyMentor API",
    description="REST API for StudyMentor - Your AI-powered learning companion",
    version="1.0.0",
    docs_url="/docs",  # Swagger UI at /docs
    redoc_url="/redoc"  # ReDoc at /redoc
)

# CORS middleware for React frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],  # React dev servers
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add custom exception handlers
app.add_exception_handler(StudyMentorException, studymentor_exception_handler)
app.add_exception_handler(Exception, general_exception_handler)

# Custom exception handler for HTTP exceptions
@app.exception_handler(HTTPException)
async def custom_http_exception_handler(request, exc):
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": "HTTP_ERROR",
                "message": exc.detail,
                "status_code": exc.status_code
            },
            "timestamp": datetime.utcnow().isoformat() + "Z"
        }
    )

# Health check endpoint
@app.get("/api/health")
async def health_check():
    """Health check endpoint to verify API is running"""
    return create_success_response(
        data={
            "status": "healthy",
            "service": "StudyMentor API",
            "version": "1.0.0"
        },
        message="API is running successfully"
    )

# Include routers
app.include_router(auth.router)
app.include_router(ai.router)
app.include_router(quiz.router)
app.include_router(study_plan.router)
app.include_router(syllabus.router)
app.include_router(calendar.router)

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    return create_success_response(
        data={
            "message": "Welcome to StudyMentor API",
            "docs": "/docs",
            "health": "/api/health",
            "endpoints": {
                "ai": "/api/ai",
                "quiz": "/api/quiz",
                "study_plan": "/api/study-plan", 
                "syllabus": "/api/syllabus",
                "auth": "/api/auth"
            }
        }
    )

if __name__ == "__main__":
    # Run the server
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8000,
        reload=True  # Enable hot reload during development
    )
