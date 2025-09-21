"""
syllabus.py
Pydantic models for syllabus parsing endpoints
"""

from pydantic import BaseModel, Field, validator
from typing import Dict, List, Optional, Union
from enum import Enum

class InputMethod(str, Enum):
    """Syllabus input methods"""
    TEXT = "text"
    PDF = "pdf"
    IMAGE = "image"

class OCRMethod(str, Enum):
    """OCR processing methods"""
    AUTO = "auto"
    EASYOCR = "easyocr"
    PYTESSERACT = "pytesseract"

class SyllabusParseRequest(BaseModel):
    """Request model for syllabus parsing from text"""
    text: str = Field(..., min_length=10, description="Syllabus text to parse")
    use_mock: bool = Field(default=False, description="Use mock parsing instead of LLM")

    @validator('text')
    def text_must_not_be_empty(cls, v):
        if not v.strip():
            raise ValueError('Syllabus text cannot be empty')
        return v.strip()

class SyllabusImageParseRequest(BaseModel):
    """Request model for syllabus parsing from image (OCR)"""
    ocr_method: OCRMethod = Field(default=OCRMethod.AUTO, description="OCR method to use")
    use_mock: bool = Field(default=False, description="Use mock parsing instead of LLM")

class SyllabusData(BaseModel):
    """Syllabus parsing response data model"""
    syllabus_id: str = Field(..., description="Unique syllabus identifier")
    input_method: str = Field(..., description="Method used for input (text/pdf/image)")
    raw_text: Optional[str] = Field(None, description="Extracted raw text (for PDF/image)")
    structured_topics: Dict[str, List[str]] = Field(..., description="Structured topics by subject")
    total_subjects: int = Field(..., description="Number of subjects found")
    total_topics: int = Field(..., description="Total number of topics found")
    confidence_score: Optional[float] = Field(None, ge=0.0, le=1.0, description="Parsing confidence score")

class FlashcardRequest(BaseModel):
    """Request model for flashcard generation"""
    topic: str = Field(..., min_length=1, max_length=200, description="Topic for flashcard generation")
    num_cards: int = Field(default=10, ge=1, le=50, description="Number of flashcards to generate")
    difficulty: str = Field(default="medium", description="Difficulty level")
    use_mock: bool = Field(default=False, description="Use mock data instead of LLM")

class Flashcard(BaseModel):
    """Individual flashcard model"""
    id: int = Field(..., description="Flashcard ID")
    front: str = Field(..., description="Front side of the card (question)")
    back: str = Field(..., description="Back side of the card (answer)")
    category: Optional[str] = Field(None, description="Flashcard category")
    difficulty: str = Field(default="medium", description="Difficulty level")

class FlashcardData(BaseModel):
    """Flashcard generation response data model"""
    flashcard_set_id: str = Field(..., description="Unique flashcard set identifier")
    topic: str = Field(..., description="Topic for the flashcards")
    total_cards: int = Field(..., description="Total number of flashcards")
    flashcards: List[Flashcard] = Field(..., description="List of flashcards")
    created_at: str = Field(..., description="Creation timestamp")