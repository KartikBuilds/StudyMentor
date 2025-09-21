"""
study_plan.py
Pydantic models for study plan generation endpoints
"""

from pydantic import BaseModel, Field, validator
from typing import Dict, List, Any, Optional

class StudyPlanRequest(BaseModel):
    """Request model for study plan generation"""
    syllabus: Dict[str, List[str]] = Field(..., description="Syllabus in JSON format")
    exam_days: int = Field(default=30, ge=1, le=365, description="Number of days until exam")
    hours_per_day: int = Field(default=3, ge=1, le=12, description="Study hours per day")
    use_mock: bool = Field(default=False, description="Use mock data instead of LLM")

    @validator('syllabus')
    def syllabus_must_not_be_empty(cls, v):
        if not v:
            raise ValueError('Syllabus cannot be empty')
        return v

    class Config:
        schema_extra = {
            "example": {
                "syllabus": {
                    "DBMS": ["ER Model", "Normalization", "SQL Queries"],
                    "Machine Learning": ["Supervised Learning", "Neural Networks"]
                },
                "exam_days": 30,
                "hours_per_day": 3,
                "use_mock": False
            }
        }

class DailyPlan(BaseModel):
    """Model for a single day's study plan"""
    day: str = Field(..., description="Day identifier (e.g., 'Day 1')")
    tasks: List[str] = Field(..., description="List of tasks for the day")
    estimated_hours: Optional[float] = Field(None, description="Estimated hours for the day")

class StudyPlanData(BaseModel):
    """Study plan response data model"""
    plan_id: str = Field(..., description="Unique plan identifier")
    total_days: int = Field(..., description="Total number of study days")
    total_hours: int = Field(..., description="Total study hours")
    subjects: List[str] = Field(..., description="List of subjects covered")
    daily_plans: Dict[str, List[str]] = Field(..., description="Daily study tasks")
    created_at: str = Field(..., description="Plan creation timestamp")

class StudyProgressRequest(BaseModel):
    """Request model for updating study progress"""
    plan_id: str = Field(..., description="Study plan identifier")
    user_id: str = Field(..., description="User identifier")
    completed_day: str = Field(..., description="Completed day (e.g., 'Day 1')")
    tasks_completed: List[str] = Field(..., description="List of completed tasks")

class StudyProgressData(BaseModel):
    """Study progress response data model"""
    plan_id: str
    user_id: str
    days_completed: int = Field(..., description="Number of days completed")
    total_days: int = Field(..., description="Total planned days")
    completion_percentage: float = Field(..., description="Progress percentage")
    next_tasks: List[str] = Field(..., description="Next tasks to complete")