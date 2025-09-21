"""
syllabus.py
API router for syllabus parsing and flashcard generation endpoints
"""

from fastapi import APIRouter, HTTPException, UploadFile, File, Form
from typing import Dict, Optional
import uuid
import tempfile
import os
from datetime import datetime

from models.syllabus import (
    SyllabusParseRequest, SyllabusData, SyllabusImageParseRequest,
    FlashcardRequest, FlashcardData, Flashcard
)
from models.base import SuccessResponse
from middleware.error_handling import create_success_response
from utils.llm_utils import parse_syllabus_text, extract_text_from_pdf
import utils.llm_utils as llm_utils

router = APIRouter(prefix="/api/syllabus", tags=["Syllabus"])

# In-memory storage for demo
_syllabus_storage: Dict[str, Dict] = {}

@router.post("/parse/text", response_model=SuccessResponse)
async def parse_syllabus_text_endpoint(request: SyllabusParseRequest):
    """
    Parse syllabus from text input
    """
    try:
        # Parse the syllabus text using LLM utils
        if request.use_mock:
            # Mock parsing for testing
            structured_data = {"General Topics": [request.text[:50] + "...", "Additional topics"]}
        else:
            llm_response = await llm_utils.parse_syllabus_text(request.text)
            # Try to parse JSON response, fallback to simple structure
            import json
            try:
                parsed_json = json.loads(llm_response)
                structured_data = {}
                
                # Handle the expected JSON structure with topics array
                if "topics" in parsed_json and isinstance(parsed_json["topics"], list):
                    for topic_obj in parsed_json["topics"]:
                        if isinstance(topic_obj, dict) and "topic_name" in topic_obj:
                            topic_name = topic_obj["topic_name"]
                            subtopics = topic_obj.get("subtopics", [])
                            # Ensure subtopics is a list of strings
                            if isinstance(subtopics, list):
                                structured_data[topic_name] = [str(sub) for sub in subtopics]
                            else:
                                structured_data[topic_name] = [str(subtopics)]
                        else:
                            # Fallback for unexpected topic structure
                            structured_data[str(topic_obj)] = ["Topic details"]
                else:
                    # Fallback for unexpected JSON structure
                    structured_data = {"Parsed Content": [str(parsed_json)[:100] + "..."]}
                    
            except json.JSONDecodeError:
                # Create simple structure if not JSON
                structured_data = {"Parsed Content": [llm_response[:100] + "..."]}
        
        # No need for additional normalization since we handled it above

        # Generate unique syllabus ID
        syllabus_id = str(uuid.uuid4())
        structured_topics = structured_data
        # Calculate statistics
        total_subjects = len(structured_topics)
        total_topics = sum(len(topics) for topics in structured_topics.values())
        
        # Create response data
        response_data = SyllabusData(
            syllabus_id=syllabus_id,
            input_method="text",
            raw_text=request.text,
            structured_topics=structured_topics,
            total_subjects=total_subjects,
            total_topics=total_topics,
            confidence_score=0.9  # High confidence for text input
        )
        
        # Store syllabus
        _syllabus_storage[syllabus_id] = {
            "syllabus_data": response_data.dict(),
            "created_at": datetime.utcnow().isoformat()
        }
        
        return create_success_response(
            data=response_data.dict(),
            message=f"Syllabus parsed successfully. Found {total_subjects} subjects with {total_topics} topics"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Syllabus parsing failed: {str(e)}")

@router.post("/parse/pdf", response_model=SuccessResponse)
async def parse_syllabus_pdf(file: UploadFile = File(...), use_mock: bool = Form(False)):
    # Ensure use_mock is a boolean (handle string from form data)
    if isinstance(use_mock, str):
        use_mock = use_mock.lower() == "true"
    """
    Parse syllabus from PDF file
    """
    if not file.filename.lower().endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported")
    
    try:
        
        # Save uploaded file temporarily
        with tempfile.NamedTemporaryFile(delete=False, suffix='.pdf') as temp_file:
            content = await file.read()
            temp_file.write(content)
            temp_path = temp_file.name
        
        try:
            # Extract text from PDF
            extracted_text = extract_text_from_pdf(temp_path)
            
            if not extracted_text.strip():
                raise HTTPException(status_code=400, detail="No text could be extracted from the PDF")
            
            # Parse the extracted text using LLM utils
            if use_mock:
                structured_data = {"PDF Content": [extracted_text[:100] + "...", "Additional topics"]}
            else:
                from models.syllabus import SyllabusParseRequest
                llm_response = await llm_utils.parse_syllabus_text(extracted_text)
                # Try to parse JSON response
                import json
                try:
                    parsed_json = json.loads(llm_response)
                    structured_data = {}
                    
                    # Handle the expected JSON structure with topics array
                    if "topics" in parsed_json and isinstance(parsed_json["topics"], list):
                        for topic_obj in parsed_json["topics"]:
                            if isinstance(topic_obj, dict) and "topic_name" in topic_obj:
                                topic_name = topic_obj["topic_name"]
                                subtopics = topic_obj.get("subtopics", [])
                                # Ensure subtopics is a list of strings
                                if isinstance(subtopics, list):
                                    structured_data[topic_name] = [str(sub) for sub in subtopics]
                                else:
                                    structured_data[topic_name] = [str(subtopics)]
                            else:
                                # Fallback for unexpected topic structure
                                structured_data[str(topic_obj)] = ["Topic details"]
                    else:
                        # Fallback for unexpected JSON structure
                        structured_data = {"Parsed Content": [str(parsed_json)[:100] + "..."]}
                        
                except json.JSONDecodeError:
                    structured_data = {"Parsed Content": [llm_response[:100] + "..."]}
            
            # No need for additional normalization since we handled it above

            # Generate unique syllabus ID
            syllabus_id = str(uuid.uuid4())
            structured_topics = structured_data
            # Calculate statistics
            total_subjects = len(structured_topics)
            total_topics = sum(len(topics) for topics in structured_topics.values())
            
            # Create response data
            response_data = SyllabusData(
                syllabus_id=syllabus_id,
                input_method="pdf",
                raw_text=extracted_text,
                structured_topics=structured_topics,
                total_subjects=total_subjects,
                total_topics=total_topics,
                confidence_score=0.8  # Slightly lower confidence for PDF
            )
            
            # Store syllabus
            _syllabus_storage[syllabus_id] = {
                "syllabus_data": response_data.dict(),
                "created_at": datetime.utcnow().isoformat()
            }
            
            return create_success_response(
                data=response_data.dict(),
                message=f"PDF syllabus parsed successfully. Found {total_subjects} subjects with {total_topics} topics"
            )
            
        finally:
            # Clean up temporary file
            os.unlink(temp_path)
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PDF parsing failed: {str(e)}")

@router.get("/{syllabus_id}", response_model=SuccessResponse)
async def get_syllabus(syllabus_id: str):
    """
    Retrieve a specific syllabus by ID
    """
    if syllabus_id not in _syllabus_storage:
        raise HTTPException(status_code=404, detail="Syllabus not found")
    
    syllabus_data = _syllabus_storage[syllabus_id]["syllabus_data"]
    
    return create_success_response(
        data=syllabus_data,
        message="Syllabus retrieved successfully"
    )

@router.post("/flashcards/generate", response_model=SuccessResponse)
async def generate_flashcards(request: FlashcardRequest):
    """
    Generate flashcards for a topic
    """
    try:
        if request.use_mock:
            # Mock flashcards for testing
            flashcards = []
            for i in range(request.num_cards):
                flashcard = Flashcard(
                    id=i + 1,
                    front=f"Question about {request.topic} #{i + 1}",
                    back=f"Answer for {request.topic} question #{i + 1}",
                    category=request.topic,
                    difficulty=request.difficulty
                )
                flashcards.append(flashcard)
        else:
            # Generate flashcards using LLM utils
            llm_response = llm_utils.generate_flashcards(request.topic, request.num_cards)
            
            # Parse flashcards from LLM response
            import json
            try:
                flashcard_data = json.loads(llm_response)
                flashcards = []
                for i, card_data in enumerate(flashcard_data.get("flashcards", [])[:request.num_cards]):
                    flashcard = Flashcard(
                        id=i + 1,
                        front=card_data.get("front", f"Question {i+1}"),
                        back=card_data.get("back", f"Answer {i+1}"),
                        category=request.topic,
                        difficulty=request.difficulty
                    )
                    flashcards.append(flashcard)
            except (json.JSONDecodeError, KeyError):
                # Fallback to mock if parsing fails
                flashcards = []
                for i in range(request.num_cards):
                    flashcard = Flashcard(
                        id=i + 1,
                        front=f"Generated question {i + 1}",
                        back=f"Generated answer {i + 1}",
                        category=request.topic,
                        difficulty=request.difficulty
                    )
                    flashcards.append(flashcard)
        
        # Generate unique flashcard set ID
        flashcard_set_id = str(uuid.uuid4())
        
        # Create response data
        response_data = FlashcardData(
            flashcard_set_id=flashcard_set_id,
            topic=request.topic,
            total_cards=len(flashcards),
            flashcards=flashcards,
            created_at=datetime.utcnow().isoformat() + "Z"
        )
        
        return create_success_response(
            data=response_data.dict(),
            message=f"Generated {request.num_cards} flashcards for topic: {request.topic}"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Flashcard generation failed: {str(e)}")