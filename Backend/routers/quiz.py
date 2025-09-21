"""
quiz.py
API router for quiz-related endpoints
"""

from fastapi import APIRouter, HTTPException
from typing import Dict
import uuid
from datetime import datetime

from models.quiz import (
    QuizGenerateRequest, QuizData, QuizQuestion,
    QuizSubmitRequest, QuizResult
)
from models.base import SuccessResponse
from middleware.error_handling import create_success_response, LLMQuotaExceededException
from utils.llm_utils import generate_quiz

router = APIRouter(prefix="/api/quiz", tags=["Quiz"])

# In-memory storage for demo (replace with database later)
_quiz_storage: Dict[str, Dict] = {}

@router.post("/generate", response_model=SuccessResponse)
async def generate_quiz_endpoint(request: QuizGenerateRequest):
    """
    Generate a quiz for a given topic
    """
    try:
        if request.use_mock:
            # Mock quiz for testing/quota fallback
            quiz_data = {
                "questions": [
                    {
                        "question": f"What is {request.topic}?",
                        "options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],
                        "correct_answer": "A",
                        "explanation": "Mock explanation"
                    } for _ in range(request.num_questions)
                ]
            }
        else:
            # Generate quiz using LLM utils
            llm_response = generate_quiz(request.topic)
            
            # Parse JSON response from LLM
            import json
            try:
                quiz_data = json.loads(llm_response)
            except json.JSONDecodeError:
                # Fallback to mock if JSON parsing fails
                raise Exception("Invalid JSON response from LLM")
        
        # Generate unique quiz ID
        quiz_id = str(uuid.uuid4())
        
        # Limit questions to requested number
        questions_to_use = quiz_data["questions"][:request.num_questions]
        
        # Format questions with IDs
        formatted_questions = [
            QuizQuestion(
                id=i + 1,
                question=q["question"],
                options=q["options"],
                correct_answer=q["correct_answer"]
            )
            for i, q in enumerate(questions_to_use)
        ]
        
        # Create response data
        response_data = QuizData(
            quiz_id=quiz_id,
            topic=request.topic,
            difficulty=request.difficulty.value,
            total_questions=len(formatted_questions),
            questions=formatted_questions
        )
        
        # Store quiz for later submission
        _quiz_storage[quiz_id] = {
            "quiz_data": response_data.dict(),
            "created_at": datetime.utcnow().isoformat(),
            "topic": request.topic
        }
        
        return create_success_response(
            data=response_data.dict(),
            message=f"Quiz generated successfully for topic: {request.topic}"
        )
        
    except Exception as e:
        # If LLM fails, try with mock data
        if "quota" in str(e).lower() or "rate limit" in str(e).lower():
            # Retry with mock data
            mock_request = QuizGenerateRequest(
                topic=request.topic,
                num_questions=request.num_questions,
                difficulty=request.difficulty,
                use_mock=True
            )
            return await generate_quiz_endpoint(mock_request)
        else:
            raise HTTPException(status_code=500, detail=f"Quiz generation failed: {str(e)}")

@router.post("/submit", response_model=SuccessResponse)
async def submit_quiz_endpoint(request: QuizSubmitRequest):
    """
    Submit quiz answers and get results
    """
    # Check if quiz exists
    if request.quiz_id not in _quiz_storage:
        raise HTTPException(status_code=404, detail="Quiz not found")
    
    quiz_data = _quiz_storage[request.quiz_id]["quiz_data"]
    questions = quiz_data["questions"]
    
    # Validate number of answers
    if len(request.answers) != len(questions):
        raise HTTPException(
            status_code=400, 
            detail=f"Expected {len(questions)} answers, got {len(request.answers)}"
        )
    
    # Calculate score
    correct_answers = []
    score = 0
    
    for i, (answer, question) in enumerate(zip(request.answers, questions)):
        is_correct = answer == question["correct_answer"]
        correct_answers.append(is_correct)
        if is_correct:
            score += 1
    
    # Calculate percentage
    percentage = (score / len(questions)) * 100
    
    # Create result
    result = QuizResult(
        quiz_id=request.quiz_id,
        user_id=request.user_id,
        score=score,
        total_questions=len(questions),
        percentage=percentage,
        correct_answers=correct_answers
    )
    
    # Store result if user_id provided (for memory tracking)
    if request.user_id:
        # This would typically go to a database
        # For now, we can integrate with memory_utils
        try:
            from utils.memory_utils import record_quiz_result
            record_quiz_result(
                user_id=request.user_id,
                topic=_quiz_storage[request.quiz_id]["topic"],
                score=score,
                total=len(questions)
            )
        except ImportError:
            pass  # Skip if memory utils not available
    
    return create_success_response(
        data=result.dict(),
        message=f"Quiz submitted successfully. Score: {score}/{len(questions)} ({percentage:.1f}%)"
    )

@router.get("/history/{user_id}", response_model=SuccessResponse)
async def get_quiz_history(user_id: str):
    """
    Get quiz history for a user (placeholder for future implementation)
    """
    # This would query the database for user's quiz history
    # For now, return empty history
    return create_success_response(
        data={
            "user_id": user_id,
            "total_quizzes": 0,
            "quiz_history": []
        },
        message="Quiz history retrieved successfully"
    )