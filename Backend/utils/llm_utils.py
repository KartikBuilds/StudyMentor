"""
llm_utils.py
Wraps LLM calls with support for multiple providers (Groq, Gemini, etc.)
Currently uses Groq for local testing - easily switchable to Gemini.
Includes PDF document extraction for syllabus parsing.

SWITCHING BETWEEN LLM PROVIDERS:
1. To use Groq (Current): Keep current code active
2. To use Gemini: 
   - Set GOOGLE_API_KEY in your .env file
   - Comment out Groq section (lines ~15-25)
   - Uncomment Gemini section (lines ~27-42)
   - Uncomment alternative Gemini implementations in functions
   - Run: pip install langchain-google-genai (if not already installed)
"""

# LLM Backend Configuration
# Currently using Groq for local testing - easy to switch to Gemini later

# Option 1: Groq (Current - Active)
from langchain_groq import ChatGroq
import dotenv
import os
import PyPDF2
import tempfile
from PIL import Image
import numpy as np

# OCR imports with fallback handling
try:
    import pytesseract
    PYTESSERACT_AVAILABLE = True
except ImportError:
    PYTESSERACT_AVAILABLE = False

try:
    import easyocr
    EASYOCR_AVAILABLE = True
except ImportError:
    EASYOCR_AVAILABLE = False

try:
    import cv2
    OPENCV_AVAILABLE = True
except ImportError:
    OPENCV_AVAILABLE = False

dotenv.load_dotenv()

# Groq Configuration (Currently Active)
groq_api_key = os.getenv("GROQ_API_KEY")
# print(f"Groq API Key: {groq_api_key}")
if not groq_api_key:
    raise RuntimeError("GROQ_API_KEY not found in environment. Please set it in your .env file.")

# Initialize Groq LLM


# Option 2: Google Gemini (Commented - Ready to Switch)
# Uncomment the lines below and comment out the Groq section above to switch to Gemini

import google.generativeai as genai
from langchain_google_genai import ChatGoogleGenerativeAI

# Gemini Configuration
gemini_api_key = os.getenv("GOOGLE_API_KEY") or "AIzaSyD_yx_UaIu8_e65WMoQnZGdG5171gULoVM"
if not gemini_api_key:
    raise RuntimeError("GOOGLE_API_KEY not found in environment. Please set it in your .env file.")

# Configure Gemini
genai.configure(api_key=gemini_api_key)

# Initialize Gemini LLM
llm = ChatGoogleGenerativeAI(
    model="gemini-1.5-flash",  
    google_api_key=gemini_api_key,
    temperature=0.7,
    convert_system_message_to_human=True
)




# llm = ChatGroq(api_key=groq_api_key, model='gemma2-9b-it')
def extract_text_from_pdf(pdf_path: str) -> str:
    """
    Extracts all text from a PDF file.
    Args:
        pdf_path (str): Path to the PDF file
    Returns:
        str: Extracted text
    """
    text = ""
    with open(pdf_path, "rb") as f:
        reader = PyPDF2.PdfReader(f)
        for page in reader.pages:
            text += page.extract_text() or ""
    return text

def preprocess_image_for_ocr(image_path: str) -> str:
    """
    Preprocess image for better OCR results using OpenCV.
    Args:
        image_path (str): Path to the image file
    Returns:
        str: Path to the processed image
    """
    if not OPENCV_AVAILABLE:
        return image_path  # Return original if OpenCV not available
    
    try:
        # Read image
        img = cv2.imread(image_path)
        
        # Convert to grayscale
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        
        # Apply denoising
        denoised = cv2.fastNlMeansDenoising(gray)
        
        # Apply threshold to get better contrast
        _, thresh = cv2.threshold(denoised, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        
        # Save processed image
        processed_path = image_path.replace('.', '_processed.')
        cv2.imwrite(processed_path, thresh)
        
        return processed_path
    except Exception as e:
        print(f"Image preprocessing failed: {e}")
        return image_path  # Return original on error

def extract_text_from_image_pytesseract(image_path: str) -> str:
    """
    Extract text from image using Pytesseract OCR.
    Args:
        image_path (str): Path to the image file
    Returns:
        str: Extracted text
    """
    if not PYTESSERACT_AVAILABLE:
        return "Error: Pytesseract not available. Please install: pip install pytesseract"
    
    try:
        # Test if tesseract is accessible
        try:
            pytesseract.get_tesseract_version()
        except Exception:
            return "Error: Tesseract engine not found. Please install Tesseract OCR:\n" + \
                   "Windows: Download from https://github.com/UB-Mannheim/tesseract/wiki\n" + \
                   "Mac: brew install tesseract\n" + \
                   "Linux: apt-get install tesseract-ocr"
        
        # Preprocess image for better OCR
        processed_path = preprocess_image_for_ocr(image_path)
        
        # Open image with PIL
        image = Image.open(processed_path)
        
        # Extract text using Pytesseract with multiple PSM modes for better results
        configs = [
            '--psm 6',  # Uniform block of text
            '--psm 4',  # Variable-size text blocks
            '--psm 3',  # Fully automatic page segmentation
            '--psm 1'   # Automatic page segmentation with OSD
        ]
        
        best_text = ""
        for config in configs:
            try:
                text = pytesseract.image_to_string(image, config=config)
                if len(text.strip()) > len(best_text.strip()):
                    best_text = text
            except Exception:
                continue
        
        # Clean up processed image if it was created
        if processed_path != image_path and os.path.exists(processed_path):
            os.remove(processed_path)
        
        return best_text.strip() if best_text.strip() else "Error: No text could be extracted from the image"
        
    except Exception as e:
        return f"Error extracting text with Pytesseract: {str(e)}"

def extract_text_from_image_easyocr(image_path: str) -> str:
    """
    Extract text from image using EasyOCR.
    Args:
        image_path (str): Path to the image file
    Returns:
        str: Extracted text
    """
    if not EASYOCR_AVAILABLE:
        return "Error: EasyOCR not available. Please install: pip install easyocr"
    
    try:
        # Initialize EasyOCR reader (English by default)
        reader = easyocr.Reader(['en'])
        
        # Extract text
        results = reader.readtext(image_path)
        
        # Combine all detected text
        text_parts = [result[1] for result in results if result[2] > 0.5]  # Confidence > 0.5
        extracted_text = '\n'.join(text_parts)
        
        return extracted_text.strip()
    except Exception as e:
        return f"Error extracting text with EasyOCR: {str(e)}"

def check_ocr_availability() -> dict:
    """
    Check which OCR methods are available and working.
    Returns:
        dict: Status of OCR methods
    """
    status = {
        "pytesseract": False,
        "easyocr": False,
        "tesseract_engine": False
    }
    
    # Check Pytesseract
    if PYTESSERACT_AVAILABLE:
        try:
            pytesseract.get_tesseract_version()
            status["pytesseract"] = True
            status["tesseract_engine"] = True
        except Exception:
            status["pytesseract"] = False
            status["tesseract_engine"] = False
    
    # Check EasyOCR
    status["easyocr"] = EASYOCR_AVAILABLE
    
    return status

def extract_text_from_image(image_file, ocr_method: str = "auto") -> str:
    """
    Extract text from uploaded image file using OCR.
    Args:
        image_file: Streamlit uploaded file object
        ocr_method: OCR method to use ("pytesseract", "easyocr", or "auto")
    Returns:
        str: Extracted text
    """
    try:
        # Create temporary file for the image
        with tempfile.NamedTemporaryFile(delete=False, suffix=".png") as tmp_file:
            tmp_file.write(image_file.getvalue())
            temp_path = tmp_file.name
        
        extracted_text = ""
        
        if ocr_method == "pytesseract":
            extracted_text = extract_text_from_image_pytesseract(temp_path)
        elif ocr_method == "easyocr":
            extracted_text = extract_text_from_image_easyocr(temp_path)
        elif ocr_method == "auto":
            # Smart auto-selection: Try EasyOCR first (more reliable), then Pytesseract
            extracted_text = ""
            
            if EASYOCR_AVAILABLE:
                extracted_text = extract_text_from_image_easyocr(temp_path)
                
            # If EasyOCR failed or not available, try Pytesseract
            if (not extracted_text or extracted_text.startswith("Error")) and PYTESSERACT_AVAILABLE:
                pytesseract_result = extract_text_from_image_pytesseract(temp_path)
                if pytesseract_result and not pytesseract_result.startswith("Error"):
                    extracted_text = pytesseract_result
            
            # If both failed or neither available
            if not extracted_text or extracted_text.startswith("Error"):
                if not EASYOCR_AVAILABLE and not PYTESSERACT_AVAILABLE:
                    extracted_text = "Error: No OCR libraries available. Please install either:\n" + \
                                   "1. EasyOCR: pip install easyocr (Recommended - no additional setup)\n" + \
                                   "2. Pytesseract: pip install pytesseract + install Tesseract engine"
                elif not extracted_text:
                    extracted_text = "Error: No text could be detected in the image"
        else:
            extracted_text = f"Error: Unknown OCR method '{ocr_method}'. Use 'auto', 'pytesseract', or 'easyocr'"
        
        # Clean up temporary file
        if os.path.exists(temp_path):
            os.remove(temp_path)
        
        return extracted_text
        
    except Exception as e:
        return f"Error processing image: {str(e)}"

async def parse_syllabus_text(text: str) -> str:
    """Send syllabus text to LLM and get structured topics JSON"""
    # Validate input
    if not text or not text.strip():
        return "Error: No text provided to parse"
    
    # Clean and truncate text if too long
    clean_text = text.strip()
    if len(clean_text) > 8000:  # Limit for context window
        clean_text = clean_text[:8000] + "..."
    
    # More detailed prompt with specific instructions
    prompt = f"""
Please analyze the following syllabus text and organize it into structured topics and subtopics.

SYLLABUS TEXT:
{clean_text}

INSTRUCTIONS:
- Extract all main topics and their subtopics
- Organize them in a clear hierarchical structure
- Return the result in JSON format like this:
{{
  "course_title": "Course Name (if found)",
  "topics": [
    {{
      "topic_name": "Main Topic 1",
      "subtopics": ["Subtopic 1.1", "Subtopic 1.2"]
    }},
    {{
      "topic_name": "Main Topic 2", 
      "subtopics": ["Subtopic 2.1", "Subtopic 2.2"]
    }}
  ]
}}

Please respond ONLY with the JSON structure, no additional text.
"""
    
    # Current implementation (Groq/LangChain)
    response = llm.predict(prompt)
    return response
    
    # Alternative Gemini implementation (Commented - Ready to Switch)
    """
    # Direct Gemini API call
    try:
        gemini_model = genai.GenerativeModel('gemini-1.5-flash')
        response = gemini_model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Gemini API error: {e}")
        return f"Error: {str(e)}"
    """

async def call_llm_async(prompt: str) -> str:
    """Generic async LLM call function for AI features"""
    try:
        # Current implementation (Groq/LangChain)
        response = llm.predict(prompt)
        return response
        
        # Alternative Gemini implementation (Commented - Ready to Switch)
        """
        # Direct Gemini API call
        gemini_model = genai.GenerativeModel('gemini-1.5-flash')
        response = gemini_model.generate_content(prompt)
        return response.text
        """
    except Exception as e:
        print(f"LLM call error: {e}")
        return f"I apologize, but I'm having trouble processing your request right now. Please try again later."

def generate_quiz(topic: str) -> str:
    """Generate 5 MCQs or flashcards for a topic, optionally using vector database context"""
    try:
        from .vector_utils import get_relevant_context
        context = get_relevant_context(topic)
        if context:
            prompt = f"""Based on the following context, create 5 multiple choice questions for the topic: {topic}. 
            
Context:
{context}

Create questions that test understanding of the key concepts. Output in JSON format with this structure:
{{
    "questions": [
        {{
            "question": "Question text",
            "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
            "correct_answer": "A",
            "explanation": "Brief explanation"
        }}
    ]
}}"""
        else:
            prompt = f"""Create 5 multiple choice questions for the topic: {topic}.

Please create educational questions that test understanding of key concepts.

Output in JSON format with this exact structure:
{{
    "questions": [
        {{
            "question": "Question text",
            "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
            "correct_answer": "A",
            "explanation": "Brief explanation"
        }}
    ]
}}

Respond ONLY with the JSON, no additional text."""
    except ImportError:
        prompt = f"""Create 5 multiple choice questions for the topic: {topic}.

Output in JSON format with this exact structure:
{{
    "questions": [
        {{
            "question": "Question text",
            "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
            "correct_answer": "A",
            "explanation": "Brief explanation"
        }}
    ]
}}

Respond ONLY with the JSON, no additional text."""
    
    # Current implementation (Groq/LangChain)
    response = llm.predict(prompt)
    return response
    
    # Alternative Gemini implementation (Commented - Ready to Switch)
    """
    # Direct Gemini API call
    try:
        gemini_model = genai.GenerativeModel('gemini-1.5-flash')
        response = gemini_model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Gemini API error: {e}")
        return f"Error: {str(e)}"
    """

def generate_study_plan(topics_json: str, days: int) -> str:
    """Generate daily study plan based on topics JSON and days"""
    prompt = f"""Create a detailed {days}-day study plan for the following syllabus: {topics_json}

Generate a JSON response with this exact structure:
{{
    "Day 1": [
        "📚 Study: Subject - Topic (60 mins)",
        "📝 Practice exercises (30 mins)",
        "❓ Take practice quiz (15 mins)"
    ],
    "Day 2": [
        "📚 Study: Subject - Topic (60 mins)",
        "🔄 Review previous day's topics (30 mins)",
        "📝 Practice problems (30 mins)"
    ]
}}

Rules:
- Distribute all topics evenly across {days} days
- Include study time, practice, and review activities
- Use emojis for visual appeal
- Each day should have 3-5 specific tasks
- Include time estimates in parentheses
- For later days, add review sessions
- For final days, focus on comprehensive review

Return ONLY valid JSON, no additional text."""
    
    # Current implementation (Groq/LangChain)
    response = llm.predict(prompt)
    return response
    
    # Alternative Gemini implementation (Commented - Ready to Switch)
    """
    # Direct Gemini API call
    try:
        gemini_model = genai.GenerativeModel('gemini-1.5-flash')
        response = gemini_model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Gemini API error: {e}")
        return f"Error: {str(e)}"
    """

def generate_flashcards(topic: str, num_cards: int = 10) -> str:
    """Generate flashcards for a given topic, optionally using vector database context"""
    try:
        from .vector_utils import get_relevant_context
        context = get_relevant_context(topic)
        if context:
            prompt = f"""Based on the following context, create {num_cards} flashcards for the topic: {topic}.

Context:
{context}

Create flashcards that help students memorize and understand key concepts, definitions, formulas, and important facts.

Output in JSON format with this exact structure:
{{
    "flashcards": [
        {{
            "front": "Question or concept to remember",
            "back": "Answer, definition, or explanation",
            "category": "Category or subtopic",
            "difficulty": "easy|medium|hard"
        }}
    ]
}}

Guidelines:
- Include definitions, key concepts, formulas, and important facts
- Make questions clear and concise
- Provide comprehensive but concise answers
- Vary difficulty levels
- Cover different aspects of the topic

Respond ONLY with the JSON, no additional text."""
        else:
            prompt = f"""Create {num_cards} flashcards for the topic: {topic}.

Create flashcards that help students memorize and understand key concepts, definitions, formulas, and important facts.

Output in JSON format with this exact structure:
{{
    "flashcards": [
        {{
            "front": "Question or concept to remember",
            "back": "Answer, definition, or explanation", 
            "category": "Category or subtopic",
            "difficulty": "easy|medium|hard"
        }}
    ]
}}

Guidelines:
- Include definitions, key concepts, formulas, and important facts
- Make questions clear and concise
- Provide comprehensive but concise answers
- Vary difficulty levels (easy, medium, hard)
- Cover different aspects of the topic

Respond ONLY with the JSON, no additional text."""
    except ImportError:
        prompt = f"""Create {num_cards} flashcards for the topic: {topic}.

Create flashcards that help students memorize and understand key concepts, definitions, formulas, and important facts.

Output in JSON format with this exact structure:
{{
    "flashcards": [
        {{
            "front": "Question or concept to remember",
            "back": "Answer, definition, or explanation",
            "category": "Category or subtopic", 
            "difficulty": "easy|medium|hard"
        }}
    ]
}}

Guidelines:
- Include definitions, key concepts, formulas, and important facts
- Make questions clear and concise
- Provide comprehensive but concise answers
- Vary difficulty levels (easy, medium, hard)
- Cover different aspects of the topic

Respond ONLY with the JSON, no additional text."""
    
    # Current implementation (Groq/LangChain)
    response = llm.predict(prompt)
    return response
    
    # Alternative Gemini implementation (Commented - Ready to Switch)
    """
    # Direct Gemini API call
    try:
        gemini_model = genai.GenerativeModel('gemini-1.5-flash')
        response = gemini_model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Gemini API error: {e}")
        return f"Error: {str(e)}"
    """

def generate_flashcards_from_syllabus(syllabus_json: str, num_cards: int = 15) -> str:
    """Generate flashcards from structured syllabus JSON"""
    prompt = f"""Based on the following structured syllabus, create {num_cards} flashcards covering all major topics and subtopics.

Syllabus Structure:
{syllabus_json}

Create comprehensive flashcards that cover:
- Key definitions and concepts
- Important formulas and principles  
- Major topics and their relationships
- Critical facts and information

Output in JSON format with this exact structure:
{{
    "flashcards": [
        {{
            "front": "Question or concept to remember",
            "back": "Answer, definition, or explanation",
            "category": "Category or subtopic from syllabus",
            "difficulty": "easy|medium|hard"
        }}
    ]
}}

Guidelines:
- Distribute cards across all major topics in the syllabus
- Include both basic and advanced concepts
- Make questions specific and clear
- Provide detailed but concise answers
- Use category names from the syllabus structure

Respond ONLY with the JSON, no additional text."""
    
    # Current implementation (Groq/LangChain)
    response = llm.predict(prompt)
    return response
    
    # Alternative Gemini implementation (Commented - Ready to Switch)
    """
    # Direct Gemini API call
    try:
        gemini_model = genai.GenerativeModel('gemini-1.5-flash')
        response = gemini_model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Gemini API error: {e}")
        return f"Error: {str(e)}"
    """

def generate_contextual_answer(question: str) -> str:
    """Generate an answer to a question using vector database context"""
    try:
        from .vector_utils import get_relevant_context
        context = get_relevant_context(question)
        if context:
            prompt = f"""Based on the following context, answer the question: {question}

Context:
{context}

Provide a comprehensive answer based on the context provided. If the context doesn't contain enough information, mention that and provide what you can."""
        else:
            prompt = f"Answer the following question: {question}"
    except ImportError:
        prompt = f"Answer the following question: {question}"
    
    # Current implementation (Groq/LangChain)
    response = llm.predict(prompt)
    return response
    
    # Alternative Gemini implementation (Commented - Ready to Switch)
    """
    # Direct Gemini API call
    try:
        gemini_model = genai.GenerativeModel('gemini-1.5-flash')
        response = gemini_model.generate_content(prompt)
        return response.text
    except Exception as e:
        print(f"Gemini API error: {e}")
        return f"Error: {str(e)}"
    """
