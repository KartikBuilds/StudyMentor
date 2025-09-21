"""
mock_ui.py
A super lightweight Streamlit webapp to test StudyMentor backend utilities.
"""


import streamlit as st
from streamlit_extras.switch_page_button import switch_page
import json
import os
import random


# Configure for minimal UI
st.set_page_config(
    page_title="StudyMentor",
    page_icon="📚",
    layout="wide",
    initial_sidebar_state="expanded"
)


# --- Sidebar Navigation ---
with st.sidebar:
    st.image("https://img.icons8.com/color/96/000000/books.png", width=80)
    st.title("StudyMentor")
    st.markdown("A smart study assistant for students.")
    st.markdown("---")
    page = st.radio(
        "Navigate",
        [
            "🏠 Home",
            "📄 Syllabus",
            "📅 Study Plan",
            "❓ Quiz",
            "🃏 Flashcards",
            "🧠 Memory Tracker",
            "📈 Progress",
            "⚙️ Settings"
        ],
        key="nav_page"
    )
    st.markdown("---")
    st.markdown("**Quick Links:**")
    st.markdown("- [GitHub](https://github.com/)\n- [Docs](#)\n- [Contact](mailto:support@example.com)")
    st.markdown("---")
    theme = st.radio("Theme", ["Light", "Dark"], horizontal=True)
    st.markdown("---")
    st.caption("Made with ❤️ using Streamlit")

# --- Page Routing ---
if 'page' not in st.session_state:
    st.session_state['page'] = "🏠 Home"
if page != st.session_state['page']:
    st.session_state['page'] = page

def show_home():
    st.title("🏠 Welcome to StudyMentor")
    st.markdown("""
<span style='font-size:1.2em;'>Your all-in-one smart study assistant.</span>
    """, unsafe_allow_html=True)
    st.markdown(":books: **Features:**")
    st.markdown("""
    - **Syllabus Upload & Management**: Easily upload, view, and edit your syllabus.
    - **Study Plan**: Generate and track personalized study plans.
    - **Quiz**: Take quizzes and review your answers.
    - **Flashcards**: Study with interactive flashcards.
    - **Progress & Analytics**: Visualize your study progress and performance.
    - **Settings**: Customize your experience.
    """)
    st.markdown("---")
    st.subheader(":rocket: Get Started")
    st.markdown("1. Upload your syllabus on the **Syllabus** page.")
    st.markdown("2. Generate a study plan and quizzes.")
    st.markdown("3. Track your progress and keep learning!")
    st.markdown("---")
    st.info("Tip: Use the sidebar to navigate between features at any time.")
    st.success("Ready to boost your learning? Start by uploading your syllabus!")

# Placeholder functions for other pages
def show_syllabus():
    st.title("📄 Syllabus Upload & Management")
    st.markdown("> This page will let you upload, view, and edit your syllabus in a user-friendly way.")

def show_study_plan():
    st.title("📅 Study Plan")
    st.markdown("> This page will help you generate and track your study plan.")

def show_quiz():
    st.title("❓ Quiz")
    st.markdown("> This page will let you take quizzes and review your answers.")

def show_flashcards():
    st.title("🃏 Flashcards")
    st.markdown("Study and review topics using interactive flashcards.")
    syllabus_json = st.session_state.get("syllabus_json")
    if not syllabus_json:
        st.warning("Please upload and parse a syllabus first.")
        return
    all_topics = [(subj, t) for subj, topics in syllabus_json.items() for t in topics]
    topic_options = [f"{subj}: {t}" for subj, t in all_topics]
    topic_choice = st.selectbox("Select Topic", topic_options, key="flashcard_topic")
    num_cards = st.slider("Number of Flashcards", 3, 20, 5, key="flashcard_num")
    if st.button("Generate Flashcards", key="flashcard_generate"):
        # Mock flashcards
        flashcards = [
            {"front": f"Q: {topic_choice} Concept {i+1}", "back": f"Answer {i+1}", "difficulty": random.choice(["easy", "medium", "hard"])}
            for i in range(num_cards)
        ]
        st.session_state["flashcards"] = flashcards
    flashcards = st.session_state.get("flashcards")
    if flashcards:
        st.subheader("Your Flashcards")
        for i, card in enumerate(flashcards):
            with st.expander(f"Card {i+1}"):
                st.markdown(f"**Front:** {card['front']}")
                st.markdown(f"**Back:** {card['back']}")
                st.caption(f"Difficulty: {card['difficulty'].title()}")

def show_progress():
    st.title("📈 Progress & Analytics")
    st.markdown("> This page will visualize your study progress and performance.")

def show_settings():
def show_memory_tracker():
    st.title("🧠 Memory Tracker")
    st.markdown("Track your quiz performance and weak topics.")
    col1, col2 = st.columns(2)
    with col1:
        user_id = st.text_input("User ID:", "user123", key="mem_user")
        mem_topic = st.text_input("Topic:", "Python", key="mem_topic")
    with col2:
        score = st.number_input("Score:", value=3, key="mem_score")
        total = st.number_input("Total:", value=5, key="mem_total")
    col1, col2, col3 = st.columns(3)
    with col1:
        if st.button("Record", key="mem_record"):
            st.success("✅ Recorded! (mock)")
    with col2:
        if st.button("Weak Topics", key="mem_weak"):
            st.info("Weak: ['Sample Weak Topic']")
    with col3:
        if st.button("Performance", key="mem_perf"):
            st.json({"accuracy": 0.8, "attempts": 5})
    st.title("⚙️ Settings")
    st.markdown("> This page will let you customize your preferences and profile.")

# --- Page Dispatcher ---
page_map = {
    "🏠 Home": show_home,
    "📄 Syllabus": show_syllabus,
    "📅 Study Plan": show_study_plan,
    "❓ Quiz": show_quiz,
    "🃏 Flashcards": show_flashcards,
    "🧠 Memory Tracker": show_memory_tracker,
    "📈 Progress": show_progress,
    "⚙️ Settings": show_settings
}
page_map[st.session_state['page']]()

st.title("📚 StudyMentor - Quick Test")
st.markdown("*Select a function to test from the dropdown*")

# Helper function for interactive flashcard display
def display_flashcards_interactive(flashcards):
    """Display flashcards in an interactive format with flip functionality"""
    if not flashcards:
        st.info("No flashcards to display")
        return
    
    for i, card in enumerate(flashcards):
        with st.container():
            col1, col2 = st.columns([4, 1])
            with col1:
                st.markdown(f"**Card {i+1}**")
            with col2:
                difficulty = card.get("difficulty", "medium")
                color = {"easy": "🟢", "medium": "🟡", "hard": "🔴"}.get(difficulty, "⚪")
                st.markdown(f"{color} {difficulty.title()}")
            
            # Use expander for flip effect
            with st.expander(f"🃏 {card.get('front', 'Question missing')}", expanded=False):
                st.markdown("**Answer:**")
                st.markdown(card.get('back', 'Answer missing'))
                if card.get('category'):
                    st.caption(f"Category: {card['category']}")
            
            st.markdown("---")

# Simple selector for different functions
function_choice = st.selectbox(
    "Choose a function to test:",
    ["Select...", "Syllabus Parser", "Quiz Generator", "Flashcard Generator", "Study Planner", "Memory Tracker", "Vector Search"],
    index=0
)

# Only show interface for selected function
if function_choice == "Syllabus Parser":
    st.header("📄 Parse Syllabus")
    
    # Input method selection
    input_method = st.radio(
        "Choose input method:",
        ["📝 Text Input", "📁 PDF Upload", "📸 Image Upload (OCR)"],
        horizontal=True
    )
    
    if input_method == "📝 Text Input":
        syllabus_text = st.text_area("Paste syllabus text:", height=120)
        pdf_file = None
        image_file = None
        
    elif input_method == "📁 PDF Upload":
        syllabus_text = ""
        pdf_file = st.file_uploader("Upload PDF file", type=["pdf"])
        image_file = None
        
    elif input_method == "📸 Image Upload (OCR)":
        syllabus_text = ""
        pdf_file = None
        image_file = st.file_uploader(
            "Upload image file", 
            type=["png", "jpg", "jpeg", "bmp", "tiff"],
            help="Upload a screenshot or photo of your syllabus"
        )
        
        if image_file:
            # Show image preview
            st.image(image_file, caption="Uploaded Image", width=400)
            
            # Check OCR availability
            try:
                from utils.llm_utils import check_ocr_availability
                ocr_status = check_ocr_availability()
                
                # Show OCR status
                col1, col2, col3 = st.columns(3)
                with col1:
                    status_icon = "✅" if ocr_status["easyocr"] else "❌"
                    st.caption(f"{status_icon} EasyOCR")
                with col2:
                    status_icon = "✅" if ocr_status["pytesseract"] else "❌"
                    st.caption(f"{status_icon} Pytesseract")
                with col3:
                    status_icon = "✅" if ocr_status["tesseract_engine"] else "❌"
                    st.caption(f"{status_icon} Tesseract Engine")
                
                # Show installation help if needed
                if not ocr_status["easyocr"] and not ocr_status["pytesseract"]:
                    st.warning("⚠️ No OCR libraries available!")
                    with st.expander("📥 Installation Instructions"):
                        st.markdown("**EasyOCR (Recommended - easier setup):**")
                        st.code("pip install easyocr")
                        st.markdown("**Pytesseract (requires additional setup):**")
                        st.code("pip install pytesseract")
                        st.markdown("Then install Tesseract engine:")
                        st.markdown("- **Windows**: Download from [GitHub](https://github.com/UB-Mannheim/tesseract/wiki)")
                        st.markdown("- **Mac**: `brew install tesseract`")
                        st.markdown("- **Linux**: `apt-get install tesseract-ocr`")
                elif not ocr_status["tesseract_engine"] and ocr_status["pytesseract"]:
                    st.info("💡 Pytesseract installed but Tesseract engine missing. EasyOCR will be used instead.")
                
                # OCR method selection with smart defaults
                available_methods = ["auto"]
                if ocr_status["easyocr"]:
                    available_methods.append("easyocr")
                if ocr_status["pytesseract"]:
                    available_methods.append("pytesseract")
                
                ocr_method = st.selectbox(
                    "OCR Method:",
                    available_methods,
                    help="Auto will try the best available method"
                )
                
            except Exception as e:
                st.error(f"Error checking OCR availability: {e}")
                ocr_method = "auto"
    
    if st.button("Parse", type="primary"):
        if pdf_file or image_file or syllabus_text.strip():
            with st.spinner("Processing..."):
                try:
                    from utils.llm_utils import parse_syllabus_text, extract_text_from_pdf, extract_text_from_image
                    
                    text_to_parse = ""
                    
                    if pdf_file:
                        st.info("📄 Extracting text from PDF...")
                        temp_path = "temp_syllabus.pdf"
                        with open(temp_path, "wb") as f:
                            f.write(pdf_file.read())
                        text_to_parse = extract_text_from_pdf(temp_path)
                        os.remove(temp_path)
                        
                        # Show extracted text for debugging
                        if text_to_parse.strip():
                            with st.expander("📄 Extracted PDF Text (First 500 chars)"):
                                st.text(text_to_parse[:500] + ("..." if len(text_to_parse) > 500 else ""))
                        else:
                            st.error("❌ No text could be extracted from the PDF!")
                            
                    elif image_file:
                        st.info("🔍 Performing OCR on image...")
                        text_to_parse = extract_text_from_image(image_file, ocr_method)
                        
                        # Show extracted text for debugging
                        if text_to_parse.strip() and not text_to_parse.startswith("Error"):
                            with st.expander("📸 Extracted Image Text (OCR)", expanded=True):
                                st.text_area("OCR Result:", value=text_to_parse, height=150, disabled=True)
                        elif text_to_parse.startswith("Error"):
                            st.error(f"❌ OCR failed: {text_to_parse}")
                        else:
                            st.error("❌ No text could be extracted from the image!")
                            
                    else:
                        text_to_parse = syllabus_text
                    
                    # Validate we have text to parse
                    if not text_to_parse.strip() or text_to_parse.startswith("Error"):
                        if text_to_parse.startswith("Error"):
                            st.error("❌ Text extraction failed!")
                        else:
                            st.error("❌ No text provided to parse!")
                    else:
                        st.info(f"📊 Processing {len(text_to_parse)} characters...")
                        import asyncio
                        result = asyncio.run(parse_syllabus_text(text_to_parse))
                        
                        st.success("✅ Parsed successfully!")
                        with st.expander("📋 Structured Topics (JSON)", expanded=True):
                            st.code(result, language="json")
                        
                except Exception as e:
                    st.error(f"❌ Error: {str(e)}")
        else:
            st.warning("⚠️ Please provide text, upload a PDF, or upload an image.")

elif function_choice == "Quiz Generator":
    st.header("❓ Generate Quiz")
    
    topic = st.text_input("Topic:", placeholder="Machine Learning")
    
    if st.button("Generate", type="primary", disabled=not topic.strip()):
        with st.spinner("Generating..."):
            try:
                from utils.llm_utils import generate_quiz
                quiz = generate_quiz(topic)
                st.success("✅ Quiz generated!")
                st.code(quiz, language="json")
            except Exception as e:
                st.error(f"❌ Error: {str(e)}")

elif function_choice == "Flashcard Generator":
    st.header("🃏 Generate Flashcards")
    
    # Input method selection
    flashcard_input = st.radio(
        "Generate flashcards from:",
        ["📝 Topic", "📋 Syllabus JSON"],
        horizontal=True,
        help="Choose to create flashcards from a specific topic or from structured syllabus"
    )
    
    if flashcard_input == "📝 Topic":
        col1, col2 = st.columns([3, 1])
        with col1:
            topic = st.text_input("Topic:", placeholder="Machine Learning Algorithms")
        with col2:
            num_cards = st.number_input("Number of cards:", min_value=5, max_value=50, value=10)
        
        if st.button("Generate Flashcards", type="primary", disabled=not topic.strip()):
            with st.spinner("Creating flashcards..."):
                try:
                    from utils.llm_utils import generate_flashcards
                    flashcards = generate_flashcards(topic, num_cards)
                    st.success("✅ Flashcards generated!")
                    
                    # Display flashcards in an interactive format
                    with st.expander("🃏 Flashcards (JSON)", expanded=False):
                        st.code(flashcards, language="json")
                    
                    # Try to parse and display flashcards interactively
                    try:
                        import json
                        flashcard_data = json.loads(flashcards)
                        if "flashcards" in flashcard_data:
                            st.subheader("📚 Interactive Flashcards")
                            
                            # Create tabs for different difficulty levels
                            difficulties = list(set([card.get("difficulty", "medium") for card in flashcard_data["flashcards"]]))
                            if len(difficulties) > 1:
                                diff_tabs = st.tabs([f"{diff.title()} ({sum(1 for card in flashcard_data['flashcards'] if card.get('difficulty') == diff)})" for diff in difficulties])
                                
                                for i, difficulty in enumerate(difficulties):
                                    with diff_tabs[i]:
                                        cards_for_diff = [card for card in flashcard_data["flashcards"] if card.get("difficulty") == difficulty]
                                        display_flashcards_interactive(cards_for_diff)
                            else:
                                display_flashcards_interactive(flashcard_data["flashcards"])
                    except json.JSONDecodeError:
                        st.info("💡 Flashcards generated as text. Check the JSON format above.")
                        
                except Exception as e:
                    st.error(f"❌ Error: {str(e)}")
    
    else:  # Syllabus JSON
        syllabus_json = st.text_area(
            "Paste structured syllabus JSON:", 
            height=120, 
            placeholder='{"course_title": "Course Name", "topics": [{"topic_name": "Topic 1", "subtopics": ["Sub 1"]}]}'
        )
        num_cards = st.number_input("Number of cards:", min_value=10, max_value=100, value=15)
        
        if st.button("Generate Flashcards from Syllabus", type="primary", disabled=not syllabus_json.strip()):
            with st.spinner("Creating flashcards from syllabus..."):
                try:
                    from utils.llm_utils import generate_flashcards_from_syllabus
                    flashcards = generate_flashcards_from_syllabus(syllabus_json, num_cards)
                    st.success("✅ Flashcards generated from syllabus!")
                    
                    # Display flashcards
                    with st.expander("🃏 Flashcards (JSON)", expanded=False):
                        st.code(flashcards, language="json")
                    
                    # Try to parse and display flashcards interactively
                    try:
                        import json
                        flashcard_data = json.loads(flashcards)
                        if "flashcards" in flashcard_data:
                            st.subheader("📚 Interactive Flashcards")
                            
                            # Group by category
                            categories = list(set([card.get("category", "General") for card in flashcard_data["flashcards"]]))
                            if len(categories) > 1:
                                cat_tabs = st.tabs([f"{cat} ({sum(1 for card in flashcard_data['flashcards'] if card.get('category') == cat)})" for cat in categories])
                                
                                for i, category in enumerate(categories):
                                    with cat_tabs[i]:
                                        cards_for_cat = [card for card in flashcard_data["flashcards"] if card.get("category") == category]
                                        display_flashcards_interactive(cards_for_cat)
                            else:
                                display_flashcards_interactive(flashcard_data["flashcards"])
                    except json.JSONDecodeError:
                        st.info("💡 Flashcards generated as text. Check the JSON format above.")
                        
                except Exception as e:
                    st.error(f"❌ Error: {str(e)}")

elif function_choice == "Study Planner":
    st.header("📅 Generate Study Plan")
    
    topics_json = st.text_area("Topics JSON:", height=80, placeholder='{"topics": ["Topic 1"]}')
    days = st.number_input("Days:", min_value=1, value=7)
    
    if st.button("Generate", type="primary", disabled=not topics_json.strip()):
        with st.spinner("Creating plan..."):
            try:
                from utils.llm_utils import generate_study_plan
                plan = generate_study_plan(topics_json, days)
                st.success("✅ Plan created!")
                st.code(plan, language="json")
            except Exception as e:
                st.error(f"❌ Error: {str(e)}")

elif function_choice == "Memory Tracker":
    st.header("🧠 Memory Tool")
    
    col1, col2 = st.columns(2)
    with col1:
        user_id = st.text_input("User ID:", "user123")
        mem_topic = st.text_input("Topic:", "Python")
    with col2:
        score = st.number_input("Score:", value=3)
        total = st.number_input("Total:", value=5)
    
    col1, col2, col3 = st.columns(3)
    
    with col1:
        if st.button("Record"):
            try:
                from utils.memory_utils import record_quiz_result
                record_quiz_result(user_id, mem_topic, score, total)
                st.success("✅ Recorded!")
            except Exception as e:
                st.error(f"❌ {str(e)}")
    
    with col2:
        if st.button("Weak Topics"):
            try:
                from utils.memory_utils import get_weak_topics
                weak = get_weak_topics(user_id)
                st.info(f"Weak: {weak}")
            except Exception as e:
                st.error(f"❌ {str(e)}")
    
    with col3:
        if st.button("Performance"):
            try:
                from utils.memory_utils import get_user_performance
                perf = get_user_performance(user_id)
                st.json(perf)
            except Exception as e:
                st.error(f"❌ {str(e)}")

elif function_choice == "Vector Search":
    st.header("🔍 Vector Search")
    
    # Upload section
    with st.expander("Upload PDFs"):
        uploaded_files = st.file_uploader("PDFs:", type=["pdf"], accept_multiple_files=True)
        
        col1, col2 = st.columns(2)
        with col1:
            if st.button("Create Embeddings", disabled=not uploaded_files):
                with st.spinner("Processing..."):
                    try:
                        from utils.vector_utils import create_vector_embeddings
                        success = create_vector_embeddings(uploaded_files)
                        if success:
                            st.success("✅ Ready!")
                    except Exception as e:
                        st.error(f"❌ {str(e)}")
        
        with col2:
            if st.button("Clear DB"):
                st.success("✅ Cleared!")
    
    # Search section
    search_query = st.text_input("Search:", placeholder="machine learning")
    
    if st.button("Search", type="primary", disabled=not search_query.strip()):
        with st.spinner("Searching..."):
            try:
                from utils.vector_utils import search_documents
                results = search_documents(search_query, k=3)
                
                if results:
                    st.success(f"✅ Found {len(results)} results")
                    for i, result in enumerate(results, 1):
                        with st.expander(f"Result {i} (Score: {result['score']:.3f})"):
                            st.text(result['text'][:500] + "..." if len(result['text']) > 500 else result['text'])
                else:
                    st.warning("⚠️ No results found.")
            except Exception as e:
                st.error(f"❌ {str(e)}")
    
    # Q&A section
    st.subheader("💬 Ask Question")
    question = st.text_input("Question:", placeholder="What is machine learning?")
    
    if st.button("Ask", disabled=not question.strip()):
        with st.spinner("Answering..."):
            try:
                from utils.llm_utils import generate_contextual_answer
                answer = generate_contextual_answer(question)
                st.success("✅ Answer:")
                st.markdown(answer)
            except Exception as e:
                st.error(f"❌ {str(e)}")

elif function_choice == "Select...":
    st.info("👆 Please select a function from the dropdown above to get started!")
    
    st.markdown("### Available Functions:")
    st.markdown("- **📄 Syllabus Parser**: Extract and structure topics from text/PDF/images")
    st.markdown("- **❓ Quiz Generator**: Create MCQs for any topic")
    st.markdown("- **🃏 Flashcard Generator**: Create interactive flashcards for memorization")
    st.markdown("- **📅 Study Planner**: Generate daily study schedules")
    st.markdown("- **🧠 Memory Tracker**: Track quiz performance and weak areas")
    st.markdown("- **🔍 Vector Search**: Upload PDFs and search/ask questions")

# Footer
st.markdown("---")
st.markdown("*StudyMentor - Lightweight Interface*")