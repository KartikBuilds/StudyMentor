import streamlit as st
import PyPDF2
import io
import json
import random

# ----------------------
# Sidebar Navigation
# ----------------------
st.set_page_config(page_title="AI Study Mentor", page_icon="📚", layout="wide")

PAGES = ["Upload Syllabus", "Study Plan", "Quiz Generator"]
page = st.sidebar.radio("Navigate", PAGES)

# ----------------------
# Helper Functions
# ----------------------
def parse_syllabus(text):
    """Mock parser: splits lines into subjects and topics."""
    lines = [l.strip() for l in text.split('\n') if l.strip()]
    syllabus = {}
    for line in lines:
        if ':' in line:
            subject, topics = line.split(':', 1)
            syllabus[subject.strip()] = [t.strip() for t in topics.split(',') if t.strip()]
        else:
            syllabus.setdefault('General', []).append(line)
    return syllabus

def extract_text_from_pdf(pdf_file):
    """Extracts text from uploaded PDF file."""
    reader = PyPDF2.PdfReader(pdf_file)
    text = ""
    for page in reader.pages:
        text += page.extract_text() or ""
    return text

def generate_study_plan(syllabus, days, hours):
    """Distributes topics across days (mock logic)."""
    topics = [(subj, topic) for subj, topics in syllabus.items() for topic in topics]
    random.shuffle(topics)
    plan = {f"Day {i+1}": [] for i in range(days)}
    for i, (subj, topic) in enumerate(topics):
        plan[f"Day {(i % days) + 1}"].append(f"{subj}: {topic}")
    return plan

def generate_mock_quiz(topic, num, difficulty):
    """Generates mock quiz questions for a topic."""
    quiz = []
    for i in range(num):
        q = {
            "question": f"[{difficulty.title()}] {topic} - What is concept {i+1}?",
            "options": [f"Option {chr(65+j)}" for j in range(4)],
            "answer": random.choice(["A", "B", "C", "D"])
        }
        quiz.append(q)
    return quiz

# ----------------------
# Upload Syllabus Page
# ----------------------
if page == "Upload Syllabus":
    st.title("📄 Upload Syllabus")
    st.markdown("Enter your syllabus as text or upload a PDF. Each line should be 'Subject: topic1, topic2, ...'")
    
    text_input = st.text_area("Paste Syllabus Text", height=150)
    pdf_file = st.file_uploader("Or upload PDF", type=["pdf"])
    
    syllabus_text = text_input
    if pdf_file:
        try:
            pdf_bytes = pdf_file.read()
            pdf_text = extract_text_from_pdf(io.BytesIO(pdf_bytes))
            st.success("Extracted text from PDF!")
            st.text_area("Extracted PDF Text", pdf_text, height=120)
            syllabus_text = pdf_text
        except Exception as e:
            st.error(f"PDF extraction failed: {e}")
    
    if st.button("Parse Syllabus", type="primary") or (syllabus_text and not pdf_file):
        if syllabus_text.strip():
            syllabus_json = parse_syllabus(syllabus_text)
            st.session_state["syllabus_json"] = syllabus_json
            st.success("Syllabus parsed and saved!")
        else:
            st.warning("Please provide syllabus text or upload a PDF.")
    
    # Display structured syllabus
    syllabus_json = st.session_state.get("syllabus_json")
    if syllabus_json:
        st.subheader("Structured Syllabus")
        for subject, topics in syllabus_json.items():
            with st.expander(subject):
                for t in topics:
                    st.markdown(f"- {t}")
    else:
        st.info("No syllabus parsed yet.")

# ----------------------
# Study Plan Page
# ----------------------
elif page == "Study Plan":
    st.title("📅 Study Plan Generator")
    syllabus_json = st.session_state.get("syllabus_json")
    if not syllabus_json:
        st.warning("Please upload and parse a syllabus first.")
    else:
        st.markdown("Set your exam timeline and study hours:")
        days = st.slider("Days until exam", 3, 30, 7)
        hours = st.slider("Study hours per day", 1, 12, 2)
        if st.button("Generate Plan", type="primary"):
            plan = generate_study_plan(syllabus_json, days, hours)
            st.session_state["study_plan"] = plan
            st.success("Study plan generated!")
        plan = st.session_state.get("study_plan")
        if plan:
            st.subheader("Your Study Plan")
            for day, topics in plan.items():
                with st.expander(day):
                    for t in topics:
                        st.markdown(f"- {t}")
            st.download_button("Download Plan as JSON", json.dumps(plan, indent=2), file_name="study_plan.json")

# ----------------------
# Quiz Generator Page
# ----------------------
elif page == "Quiz Generator":
    st.title("❓ Quiz Generator")
    syllabus_json = st.session_state.get("syllabus_json")
    if not syllabus_json:
        st.warning("Please upload and parse a syllabus first.")
    else:
        all_topics = [(subj, t) for subj, topics in syllabus_json.items() for t in topics]
        topic_options = [f"{subj}: {t}" for subj, t in all_topics]
        topic_choice = st.selectbox("Select Topic", topic_options)
        num_questions = st.slider("Number of Questions", 1, 10, 5)
        difficulty = st.selectbox("Difficulty", ["easy", "medium", "hard"])
        if st.button("Generate Quiz", type="primary"):
            topic = topic_choice.split(": ", 1)[-1]
            quiz = generate_mock_quiz(topic, num_questions, difficulty)
            st.session_state["quiz"] = quiz
            st.session_state["quiz_answers"] = {}
        quiz = st.session_state.get("quiz")
        if quiz:
            st.subheader("Quiz: Answer the questions below")
            answers = st.session_state.get("quiz_answers", {})
            for i, q in enumerate(quiz):
                st.markdown(f"**Q{i+1}. {q['question']}**")
                prev_index = answers.get(i, None)
                if prev_index is None or not (0 <= prev_index < 4):
                    prev_index = 0
                user_ans = st.radio(f"Your answer for Q{i+1}", ["A", "B", "C", "D"], key=f"quiz_{i}", index=prev_index)
                answers[i] = ["A", "B", "C", "D"].index(user_ans)
            st.session_state["quiz_answers"] = answers
            if st.button("Submit Quiz", type="primary"):
                score = 0
                for i, q in enumerate(quiz):
                    correct = q["answer"]
                    user_ans = ["A", "B", "C", "D"][answers.get(i, 0)]
                    if user_ans == correct:
                        score += 1
                st.success(f"You scored {score} out of {len(quiz)}!")
                st.markdown("**Correct Answers:**")
                for i, q in enumerate(quiz):
                    st.markdown(f"Q{i+1}: {q['answer']}")
