"""
quiz_utils.py
QuizToolAgent for StudyMentor: generates MCQs/flashcards for a given topic using Gemini (AI Studio) or mock fallback.
"""

import google.generativeai as genai
from dotenv import load_dotenv
import os
import json

load_dotenv()

genai.configure(api_key=os.getenv("GEMINI_API_KEY"))
model = genai.GenerativeModel("gemini-1.5-pro")

def generate_quiz(topic, num_questions=5, use_mock=False):
    """
    Generate MCQs or flashcards for a topic using Gemini or mock fallback.
    Args:
        topic (str): The topic for which to generate questions
        num_questions (int): Number of questions to generate
        use_mock (bool): If True, return a mock quiz (no Gemini call)
    Returns:
        dict: Quiz in JSON format {"topic": ..., "questions": [{...}, ...]}
    """
    if use_mock:
        # Simple mock quiz for testing/quota fallback
        return {
            "topic": topic,
            "questions": [
                {
                    "question": f"What is {topic}?",
                    "options": ["A", "B", "C", "D"],
                    "answer": "A"
                } for _ in range(num_questions)
            ]
        }
    prompt = f"""
    You are an AI tutor. Generate {num_questions} multiple-choice questions (MCQs) for the topic: "{topic}".
    Format JSON like this:
    {{
      "topic": "{topic}",
      "questions": [
        {{
          "question": "Question text",
          "options": ["A", "B", "C", "D"],
          "answer": "Correct option"
        }},
        ...
      ]
    }}
    """
    try:
        response = model.generate_content(prompt)
        quiz_json = json.loads(response.text)
        return quiz_json
    except Exception as e:
        # Fallback: return mock quiz if Gemini fails (quota, etc.)
        return {
            "topic": topic,
            "questions": [
                {
                    "question": f"What is {topic}?",
                    "options": ["A", "B", "C", "D"],
                    "answer": "A"
                } for _ in range(num_questions)
            ]
        }
