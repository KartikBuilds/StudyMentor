"""
quiz.py
Pydantic models for quiz-related endpoints
"""

from pydantic import BaseModel, Field, validator
from typing import List, Optional
from enum import Enum

class DifficultyLevel(str, Enum):
    """Quiz difficulty levels"""
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"

class QuizGenerateRequest(BaseModel):
    """Request model for quiz generation"""
    topic: str = Field(..., min_length=1, max_length=200, description="Topic for quiz generation")
    num_questions: int = Field(default=5, ge=1, le=20, description="Number of questions to generate")
    difficulty: DifficultyLevel = Field(default=DifficultyLevel.MEDIUM, description="Difficulty level")
    use_mock: bool = Field(default=False, description="Use mock data instead of LLM")

    @validator('topic')
    def topic_must_not_be_empty(cls, v):
        if not v.strip():
            raise ValueError('Topic cannot be empty')
        return v.strip()

class QuizQuestion(BaseModel):
    """Individual quiz question model"""
    id: int = Field(..., description="Question ID")
    question: str = Field(..., description="Question text")
    options: List[str] = Field(..., min_items=2, max_items=6, description="Answer options")
    correct_answer: str = Field(..., description="Correct answer")

class QuizData(BaseModel):
    """Quiz response data model"""
    quiz_id: str = Field(..., description="Unique quiz identifier")
    topic: str = Field(..., description="Quiz topic")
    difficulty: str = Field(..., description="Quiz difficulty level")
    total_questions: int = Field(..., description="Total number of questions")
    questions: List[QuizQuestion] = Field(..., description="List of quiz questions")

class QuizSubmitRequest(BaseModel):
    """Request model for quiz submission"""
    quiz_id: str = Field(..., description="Quiz identifier")
    user_id: Optional[str] = Field(None, description="User identifier")
    answers: List[str] = Field(..., description="List of submitted answers")

class QuizResult(BaseModel):
    """Quiz result model"""
    quiz_id: str
    user_id: Optional[str]
    score: int = Field(..., description="Number of correct answers")
    total_questions: int = Field(..., description="Total number of questions")
    percentage: float = Field(..., description="Score percentage")
    correct_answers: List[bool] = Field(..., description="List indicating which answers were correct")
    time_taken: Optional[int] = Field(None, description="Time taken in seconds")