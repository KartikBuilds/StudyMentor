"""
ai.py
API router for AI-powered features including study buddy chat and intelligent content generation
"""

from fastapi import APIRouter, HTTPException, UploadFile, File
from typing import Dict, List, Optional
import uuid
import tempfile
import os
from datetime import datetime, timedelta
import json

from models.base import SuccessResponse
from middleware.error_handling import create_success_response
from utils import llm_utils
from pydantic import BaseModel

router = APIRouter(prefix="/api/ai", tags=["AI Features"])

# Request/Response Models
class ChatMessage(BaseModel):
    id: str
    type: str  # 'user' or 'ai'
    content: str
    timestamp: datetime

class ChatRequest(BaseModel):
    message: str
    context: Optional[str] = None
    user_id: Optional[str] = None

class ChatResponse(BaseModel):
    response: str
    suggested_questions: Optional[List[str]] = None

class SyllabusProcessRequest(BaseModel):
    file_content: str
    file_name: str
    user_preferences: Optional[Dict] = None

class SyllabusAnalysis(BaseModel):
    title: str
    subjects: List[Dict]
    total_topics: int
    estimated_study_time: str
    difficulty: str

class StudyPlanGeneration(BaseModel):
    total_days: int
    daily_average: int
    schedule: List[Dict]

class FlashcardGeneration(BaseModel):
    total: int
    by_subject: List[Dict]
    cards: List[Dict]

class QuizGeneration(BaseModel):
    total: int
    by_difficulty: Dict
    quizzes: List[Dict]

# In-memory storage for demo (replace with database in production)
_chat_sessions: Dict[str, List[ChatMessage]] = {}
_processed_syllabi: Dict[str, Dict] = {}

@router.post("/chat", response_model=SuccessResponse)
async def ai_study_buddy_chat(request: ChatRequest):
    """
    AI-powered study buddy chat using Gemini
    """
    try:
        # Get or create chat session
        session_id = request.user_id or "anonymous"
        if session_id not in _chat_sessions:
            _chat_sessions[session_id] = []

        # Add user message to history
        user_message = ChatMessage(
            id=str(uuid.uuid4()),
            type="user",
            content=request.message,
            timestamp=datetime.now()
        )
        _chat_sessions[session_id].append(user_message)

        # Prepare context from chat history
        chat_context = ""
        if len(_chat_sessions[session_id]) > 1:
            recent_messages = _chat_sessions[session_id][-6:]  # Last 6 messages for context
            chat_context = "\n".join([f"{msg.type}: {msg.content}" for msg in recent_messages[:-1]])

        # Generate AI response using LLM utils
        ai_response = await generate_study_buddy_response(request.message, chat_context, request.context)

        # Add AI response to history
        ai_message = ChatMessage(
            id=str(uuid.uuid4()),
            type="ai",
            content=ai_response["response"],
            timestamp=datetime.now()
        )
        _chat_sessions[session_id].append(ai_message)

        return create_success_response({
            "response": ai_response["response"],
            "suggested_questions": ai_response.get("suggested_questions", []),
            "session_id": session_id
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat error: {str(e)}")

@router.post("/syllabus/analyze", response_model=SuccessResponse)
async def analyze_syllabus_with_ai(request: SyllabusProcessRequest):
    """
    Analyze uploaded syllabus using AI and extract structured information
    """
    try:
        # Use existing syllabus parsing functionality
        parsed_content = await llm_utils.parse_syllabus_text(request.file_content)
        
        # Generate comprehensive analysis
        analysis = await generate_syllabus_analysis(parsed_content, request.file_name)
        
        # Store for later use
        analysis_id = str(uuid.uuid4())
        _processed_syllabi[analysis_id] = {
            "analysis": analysis,
            "original_content": request.file_content,
            "processed_at": datetime.now(),
            "file_name": request.file_name
        }

        return create_success_response({
            "analysis_id": analysis_id,
            "analysis": analysis
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis error: {str(e)}")

@router.post("/syllabus/{analysis_id}/generate-study-plan", response_model=SuccessResponse)
async def generate_ai_study_plan(analysis_id: str, exam_days: int = 30, hours_per_day: int = 3):
    """
    Generate AI-powered personalized study plan from analyzed syllabus
    """
    try:
        if analysis_id not in _processed_syllabi:
            raise HTTPException(status_code=404, detail="Syllabus analysis not found")

        syllabus_data = _processed_syllabi[analysis_id]
        study_plan = await generate_intelligent_study_plan(
            syllabus_data["analysis"], 
            exam_days, 
            hours_per_day
        )

        return create_success_response({
            "study_plan": study_plan,
            "generated_at": datetime.now()
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Study plan generation error: {str(e)}")

@router.post("/syllabus/{analysis_id}/generate-flashcards", response_model=SuccessResponse)
async def generate_ai_flashcards(analysis_id: str, max_cards: int = 50):
    """
    Generate AI-powered flashcards from analyzed syllabus
    """
    try:
        if analysis_id not in _processed_syllabi:
            raise HTTPException(status_code=404, detail="Syllabus analysis not found")

        syllabus_data = _processed_syllabi[analysis_id]
        flashcards = await generate_intelligent_flashcards(
            syllabus_data["analysis"], 
            max_cards
        )

        return create_success_response({
            "flashcards": flashcards,
            "generated_at": datetime.now()
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Flashcard generation error: {str(e)}")

@router.post("/syllabus/{analysis_id}/generate-quizzes", response_model=SuccessResponse)
async def generate_ai_quizzes(analysis_id: str, num_quizzes: int = 5):
    """
    Generate AI-powered adaptive quizzes from analyzed syllabus
    """
    try:
        if analysis_id not in _processed_syllabi:
            raise HTTPException(status_code=404, detail="Syllabus analysis not found")

        syllabus_data = _processed_syllabi[analysis_id]
        quizzes = await generate_intelligent_quizzes(
            syllabus_data["analysis"], 
            num_quizzes
        )

        return create_success_response({
            "quizzes": quizzes,
            "generated_at": datetime.now()
        })

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Quiz generation error: {str(e)}")

# AI Helper Functions

async def generate_study_buddy_response(user_message: str, chat_context: str = "", additional_context: str = ""):
    """
    Generate contextual study buddy response using AI
    """
    prompt = f"""You are StudyMentor AI, a helpful and encouraging study assistant. You help students with:
- Explaining complex concepts in simple terms
- Creating study strategies and plans
- Answering academic questions
- Providing motivation and study tips
- Breaking down difficult topics

Chat Context (recent conversation):
{chat_context}

Additional Context:
{additional_context}

Student's Question: {user_message}

Provide a helpful, encouraging response. Include relevant emojis and be conversational but informative. 
If appropriate, suggest 2-3 follow-up questions the student might ask.

Format your response as:
RESPONSE: [Your main response here]
SUGGESTIONS: [suggestion1]|[suggestion2]|[suggestion3]
"""

    try:
        # Use the existing LLM utilities
        llm_response = await llm_utils.call_llm_async(prompt)
        
        # Parse response
        response_parts = llm_response.split("SUGGESTIONS:")
        main_response = response_parts[0].replace("RESPONSE:", "").strip()
        
        suggestions = []
        if len(response_parts) > 1:
            suggestion_text = response_parts[1].strip()
            suggestions = [s.strip() for s in suggestion_text.split("|") if s.strip()]

        return {
            "response": main_response,
            "suggested_questions": suggestions[:3]  # Limit to 3 suggestions
        }

    except Exception as e:
        # Fallback response
        return {
            "response": "I'd be happy to help you with your studies! Could you please provide more details about what you'd like to learn or any specific questions you have?",
            "suggested_questions": [
                "Help me understand this concept better",
                "Create a study plan for my exams", 
                "Explain this topic in simple terms"
            ]
        }

async def generate_syllabus_analysis(parsed_content: str, file_name: str):
    """
    Generate comprehensive syllabus analysis using AI
    """
    prompt = f"""Analyze this syllabus content and provide a structured analysis:

Syllabus Content:
{parsed_content}

File Name: {file_name}

Please provide a JSON response with:
1. title: A descriptive title for this syllabus
2. subjects: Array of subjects with topics, difficulty, and estimated hours
3. total_topics: Total number of topics
4. estimated_study_time: Total estimated study time
5. difficulty: Overall difficulty level

Format as valid JSON.
"""

    try:
        llm_response = await llm_utils.call_llm_async(prompt)
        # Try to parse as JSON, fallback to default structure
        try:
            analysis = json.loads(llm_response)
        except:
            # Fallback analysis
            analysis = {
                "title": file_name.replace(".pdf", "").replace("_", " ").title(),
                "subjects": [
                    {
                        "name": "Subject Analysis",
                        "topics": ["Topic extraction from content"],
                        "difficulty": "Medium",
                        "estimatedHours": 20
                    }
                ],
                "total_topics": 1,
                "estimated_study_time": "20 hours",
                "difficulty": "Medium"
            }
        
        return analysis

    except Exception as e:
        # Return default analysis on error
        return {
            "title": "Study Material Analysis",
            "subjects": [],
            "total_topics": 0,
            "estimated_study_time": "0 hours",
            "difficulty": "Unknown"
        }

async def generate_intelligent_study_plan(analysis: dict, exam_days: int, hours_per_day: int):
    """
    Generate AI-powered study plan with structured JSON response
    """
    try:
        subjects = analysis.get("subjects", [])
        subjects_text = ""
        for subject in subjects:
            topics_list = ", ".join(subject.get("topics", []))
            subjects_text += f"- {subject.get('name', 'Unknown')}: {topics_list} (Difficulty: {subject.get('difficulty', 'Medium')})\n"
        
        prompt = f"""Create a detailed study plan for {exam_days} days, studying {hours_per_day} hours per day.

Subjects and Topics to Cover:
{subjects_text}

Generate a JSON response with this exact structure:
{{
    "total_days": {exam_days},
    "daily_average": {hours_per_day},
    "schedule": [
        {{
            "day": 1,
            "subject": "Subject Name",
            "topic": "Specific Topic",
            "duration": {hours_per_day},
            "difficulty": "Easy/Medium/Hard",
            "tasks": [
                "Specific learning task 1",
                "Specific learning task 2",
                "Practice problems",
                "Review and notes"
            ],
            "notes": "Study tips for this topic"
        }}
    ]
}}

Important: Return ONLY valid JSON, no additional text or formatting."""

        # Call LLM and parse JSON response
        llm_response = await llm_utils.call_llm_async(prompt)
        
        try:
            import json
            # Try to parse as JSON
            study_plan = json.loads(llm_response.strip())
            return study_plan
        except json.JSONDecodeError:
            # Fallback to mock data if JSON parsing fails
            return generate_fallback_study_plan(analysis, exam_days, hours_per_day)
            
    except Exception as e:
        print(f"Study plan generation error: {e}")
        return generate_fallback_study_plan(analysis, exam_days, hours_per_day)

def generate_fallback_study_plan(analysis: dict, exam_days: int, hours_per_day: int):
    """Fallback study plan if AI fails"""
    subjects = analysis.get("subjects", [])
    schedule = []
    current_day = 1
    
    for subject in subjects:
        subject_name = subject.get("name", "Unknown Subject")
        topics = subject.get("topics", [])
        
        for topic in topics:
            if current_day <= exam_days:
                schedule.append({
                    "day": current_day,
                    "subject": subject_name,
                    "topic": topic,
                    "duration": hours_per_day,
                    "difficulty": subject.get("difficulty", "Medium"),
                    "tasks": [
                        "Read and understand key concepts",
                        "Practice example problems", 
                        "Create summary notes",
                        "Take practice quiz"
                    ],
                    "notes": f"Focus on understanding core concepts of {topic}"
                })
                current_day += 1

    return {
        "total_days": min(len(schedule), exam_days),
        "daily_average": hours_per_day,
        "schedule": schedule[:exam_days]
    }

async def generate_intelligent_flashcards(analysis: dict, max_cards: int):
    """
    Generate AI-powered flashcards with structured JSON response
    """
    try:
        subjects = analysis.get("subjects", [])
        subjects_text = ""
        for subject in subjects:
            topics_list = ", ".join(subject.get("topics", []))
            subjects_text += f"- {subject.get('name', 'Unknown')}: {topics_list}\n"
        
        prompt = f"""Create {max_cards} educational flashcards for these subjects and topics:

{subjects_text}

Generate a JSON response with this exact structure:
{{
    "total": {max_cards},
    "by_subject": [
        {{"name": "Subject Name", "count": 5}}
    ],
    "cards": [
        {{
            "id": "unique-id",
            "subject": "Subject Name",
            "topic": "Specific Topic",
            "question": "Clear, specific question",
            "answer": "Detailed, educational answer",
            "difficulty": "Easy/Medium/Hard",
            "tags": ["subject-tag", "topic-tag"]
        }}
    ]
}}

Make questions specific and educational. Answers should be comprehensive but concise.
Return ONLY valid JSON, no additional text."""

        # Call LLM and parse JSON response
        llm_response = await llm_utils.call_llm_async(prompt)
        
        try:
            import json
            flashcards = json.loads(llm_response.strip())
            return flashcards
        except json.JSONDecodeError:
            return generate_fallback_flashcards(analysis, max_cards)
            
    except Exception as e:
        print(f"Flashcard generation error: {e}")
        return generate_fallback_flashcards(analysis, max_cards)

def generate_fallback_flashcards(analysis: dict, max_cards: int):
    """Fallback flashcards if AI fails"""
    subjects = analysis.get("subjects", [])
    flashcards = []
    card_count = 0
    
    for subject in subjects:
        if card_count >= max_cards:
            break
            
        subject_name = subject.get("name", "Unknown Subject")
        topics = subject.get("topics", [])
        
        for topic in topics:
            if card_count >= max_cards:
                break
                
            flashcards.append({
                "id": str(uuid.uuid4()),
                "subject": subject_name,
                "topic": topic,
                "question": f"What is {topic}?",
                "answer": f"{topic} is a key concept in {subject_name} that involves understanding the fundamental principles and applications.",
                "difficulty": subject.get("difficulty", "Medium"),
                "tags": [subject_name.lower().replace(" ", "-"), topic.lower().replace(" ", "-")]
            })
            card_count += 1

    return {
        "total": len(flashcards),
        "by_subject": [{"name": s["name"], "count": len([t for t in s["topics"]])} for s in subjects],
        "cards": flashcards
    }

async def generate_intelligent_quizzes(analysis: dict, num_quizzes: int):
    """
    Generate AI-powered quizzes with structured JSON response
    """
    try:
        subjects = analysis.get("subjects", [])
        subjects_text = ""
        for subject in subjects:
            topics_list = ", ".join(subject.get("topics", []))
            subjects_text += f"- {subject.get('name', 'Unknown')}: {topics_list}\n"
        
        prompt = f"""Create {num_quizzes} educational quizzes for these subjects and topics:

{subjects_text}

Generate a JSON response with this exact structure:
{{
    "total": {num_quizzes},
    "by_difficulty": {{
        "easy": 1,
        "medium": 2,
        "hard": 1
    }},
    "quizzes": [
        {{
            "id": "unique-id",
            "title": "Quiz Title",
            "description": "Brief quiz description",
            "questions": 10,
            "duration": 30,
            "difficulty": "Easy/Medium/Hard",
            "topics": ["topic1", "topic2"],
            "sample_questions": [
                {{
                    "question": "Sample question text",
                    "type": "multiple_choice",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correct_answer": "Option A"
                }}
            ]
        }}
    ]
}}

Create diverse quiz types covering different difficulty levels.
Return ONLY valid JSON, no additional text."""

        # Call LLM and parse JSON response
        llm_response = await llm_utils.call_llm_async(prompt)
        
        try:
            import json
            quizzes = json.loads(llm_response.strip())
            return quizzes
        except json.JSONDecodeError:
            return generate_fallback_quizzes(analysis, num_quizzes)
            
    except Exception as e:
        print(f"Quiz generation error: {e}")
        return generate_fallback_quizzes(analysis, num_quizzes)

def generate_fallback_quizzes(analysis: dict, num_quizzes: int):
    """Fallback quizzes if AI fails"""
    subjects = analysis.get("subjects", [])
    quizzes = []
    
    for i, subject in enumerate(subjects[:num_quizzes]):
        quizzes.append({
            "id": str(uuid.uuid4()),
            "title": f"{subject.get('name', 'Subject')} Assessment",
            "description": f"Comprehensive quiz covering key concepts in {subject.get('name', 'Subject')}",
            "questions": len(subject.get('topics', [])) * 2,
            "duration": 30,
            "difficulty": subject.get('difficulty', 'Medium'),
            "topics": subject.get('topics', []),
            "sample_questions": [
                {
                    "question": f"What are the key concepts in {subject.get('name', 'Subject')}?",
                    "type": "multiple_choice",
                    "options": ["Concept A", "Concept B", "Concept C", "All of the above"],
                    "correct_answer": "All of the above"
                }
            ]
        })

    return {
        "total": len(quizzes),
        "by_difficulty": {
            "easy": len([q for q in quizzes if q["difficulty"] == "Easy"]),
            "medium": len([q for q in quizzes if q["difficulty"] == "Medium"]),
            "hard": len([q for q in quizzes if q["difficulty"] == "Hard"])
        },
        "quizzes": quizzes
    }