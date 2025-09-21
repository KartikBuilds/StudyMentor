"""
studyplan_utils.py
Generate study plan (LangChain Agent tool).
Generates a daily study plan from a syllabus JSON using Gemini (AI Studio),
with fallback/mock support for quota or testing.
"""

import google.generativeai as genai
from dotenv import load_dotenv
import os
import json

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-pro")

def generate_study_plan(syllabus_json, exam_days=30, hours_per_day=3, use_mock=False):
    """
    Generates a daily study plan from syllabus.
    Args:
        syllabus_json (dict): e.g. {"DBMS": ["ER Model", ...], ...}
        exam_days (int): Number of days until exam
        hours_per_day (int): Study hours per day
        use_mock (bool): If True, return a mock plan (no Gemini call)
    Returns:
        dict: {"Day 1": [...], "Day 2": [...], ...}
    """
    if use_mock:
        # Smart mock plan distribution
        plan = {}
        topics = [(subject, topic) for subject, topics in syllabus_json.items() for topic in topics]
        
        # Distribute topics across all exam days
        for day_num in range(1, exam_days + 1):
            day = f"Day {day_num}"
            day_tasks = []
            
            # Calculate topics per day
            topics_per_day = max(1, len(topics) // exam_days)
            start_idx = (day_num - 1) * topics_per_day
            end_idx = min(start_idx + topics_per_day, len(topics))
            
            # Add study topics for this day
            for topic_idx in range(start_idx, end_idx):
                if topic_idx < len(topics):
                    subject, topic = topics[topic_idx]
                    day_tasks.append(f"📚 Study: {subject} - {topic}")
            
            # Add complementary activities
            if day_num <= len(topics):
                day_tasks.append("📝 Practice problems and exercises")
                day_tasks.append("❓ Take topic quiz (5-10 questions)")
            
            # Add review for middle days
            if day_num > len(topics) // 2:
                day_tasks.append("🔄 Review previous day's topics")
            
            # Final exam preparation for last few days
            if day_num > exam_days - 3:
                day_tasks = [
                    "📖 Comprehensive review of all subjects",
                    "📝 Solve mock exams and past papers", 
                    "🎯 Focus on identified weak areas",
                    "💡 Quick revision of formulas and key concepts"
                ]
            
            plan[day] = day_tasks if day_tasks else ["📚 General study and revision"]
        
        return plan

    # Prepare prompt for Gemini
    syllabus_str = json.dumps(syllabus_json, indent=2)
    prompt = f"""
    You are an expert study planner AI. Create a comprehensive study plan for the following syllabus:

    {syllabus_str}

    Requirements:
    - Total days available: {exam_days} days
    - Study hours per day: {hours_per_day} hours
    - Create a plan for ALL {exam_days} days (Day 1 through Day {exam_days})
    - Distribute topics evenly across all days
    - Include practice exercises, quizzes, and revision sessions
    - Last 2-3 days should focus on comprehensive review and mock tests
    
    Return ONLY a valid JSON object in this exact format:
    {{
      "Day 1": ["📚 Study: Subject - Topic", "📝 Practice exercises", "❓ Topic quiz"],
      "Day 2": ["📚 Study: Subject - Topic", "📝 Practice problems", "🔄 Review Day 1"],
      ...
      "Day {exam_days}": ["📖 Final comprehensive review", "📝 Mock exam", "💡 Key concepts revision"]
    }}

    Make sure to include entries for ALL {exam_days} days. No day should be missing.
    """
    try:
        response = model.generate_content(prompt)
        plan_json = json.loads(response.text)
        return plan_json
    except Exception as e:
        print(f"Gemini API error: {e}. Using fallback mock plan.")
        # Fallback: return comprehensive mock plan if Gemini fails
        return generate_study_plan(syllabus_json, exam_days, hours_per_day, use_mock=True)
