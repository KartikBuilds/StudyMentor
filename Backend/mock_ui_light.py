"""
mock_ui.py
A lightweight Streamlit webapp to test StudyMentor backend utilities.
Organized with tabs for better performance and user experience.
"""

import streamlit as st
import json
import os

# Configure page for better performance
st.set_page_config(
    page_title="StudyMentor",
    page_icon="📚",
    layout="centered",
    initial_sidebar_state="collapsed"
)

st.title("📚 StudyMentor")
st.markdown("*Lightweight backend testing interface*")

# Create tabs for better organization
tab1, tab2, tab3, tab4, tab5 = st.tabs([
    "📄 Syllabus Parser", 
    "❓ Quiz Generator", 
    "📅 Study Planner", 
    "🧠 Memory Tracker",
    "🔍 Vector Search"
])

# Tab 1: Syllabus Parser
with tab1:
    st.header("Parse Syllabus Text or PDF")
    
    # Text input
    syllabus_text = st.text_area("Paste syllabus text here:", height=150)
    
    # PDF upload
    pdf_file = st.file_uploader("Or upload syllabus PDF", type=["pdf"])
    
    if st.button("Parse Syllabus", type="primary"):
        if pdf_file or syllabus_text.strip():      
            with st.spinner("Processing..."):
                try:
                    from utils.llm_utils import parse_syllabus_text, extract_text_from_pdf
                    
                    # Handle PDF if uploaded
                    if pdf_file:
                        temp_path = "temp_syllabus.pdf"
                        with open(temp_path, "wb") as f:
                            f.write(pdf_file.read())
                        text_to_parse = extract_text_from_pdf(temp_path)
                        os.remove(temp_path)
                        
                        # Show extracted text preview
                        with st.expander("📄 Extracted PDF Text Preview"):
                            st.text(text_to_parse[:1000] + ("..." if len(text_to_parse) > 1000 else ""))
                    else:
                        text_to_parse = syllabus_text
                    
                    # Parse the text
                    result = parse_syllabus_text(text_to_parse)
                    
                    st.success("✅ Syllabus parsed successfully!")
                    with st.expander("📋 Structured Topics (JSON)", expanded=True):
                        st.code(result, language="json")
                        
                except Exception as e:
                    st.error(f"❌ Error: {str(e)}")
        else:
            st.warning("⚠️ Please provide either text or upload a PDF file.")

# Tab 2: Quiz Generator
with tab2:
    st.header("Generate Quiz for Topic")
    
    col1, col2 = st.columns([3, 1])
    with col1:
        topic = st.text_input("Enter topic for quiz:", placeholder="e.g., Machine Learning Algorithms")
    with col2:
        st.write("") # spacing
        st.write("") # spacing
        
    if st.button("Generate Quiz", type="primary", disabled=not topic.strip()):
        if topic.strip():
            with st.spinner("Generating quiz..."):
                try:
                    from utils.llm_utils import generate_quiz
                    quiz = generate_quiz(topic)
                    
                    st.success("✅ Quiz generated successfully!")
                    with st.expander("❓ Quiz Questions (JSON)", expanded=True):
                        st.code(quiz, language="json")
                        
                except Exception as e:
                    st.error(f"❌ Error: {str(e)}")

# Tab 3: Study Planner
with tab3:
    st.header("Generate Study Plan")
    
    topics_json = st.text_area("Paste structured topics JSON:", height=120, 
                              placeholder='{"topics": ["Topic 1", "Topic 2"]}')
    
    col1, col2 = st.columns([2, 1])
    with col1:
        days = st.number_input("Number of days", min_value=1, max_value=365, value=7)
    
    if st.button("Generate Study Plan", type="primary", disabled=not topics_json.strip()):
        if topics_json.strip():
            with st.spinner("Creating study plan..."):
                try:
                    from utils.llm_utils import generate_study_plan
                    plan = generate_study_plan(topics_json, days)
                    
                    st.success("✅ Study plan generated successfully!")
                    with st.expander(f"📅 {days}-Day Study Plan", expanded=True):
                        st.code(plan, language="json")
                        
                except Exception as e:
                    st.error(f"❌ Error: {str(e)}")

# Tab 4: Memory Tracker
with tab4:
    st.header("Memory Tool (Mock)")
    
    col1, col2 = st.columns(2)
    
    with col1:
        user_id = st.text_input("User ID:", placeholder="user123")
        mem_topic = st.text_input("Quiz topic:", placeholder="Python Basics")
        
    with col2:
        score = st.number_input("Score", min_value=0, max_value=100, value=3)
        total = st.number_input("Total Questions", min_value=1, max_value=100, value=5)
    
    # Action buttons
    col1, col2, col3 = st.columns(3)
    
    with col1:
        if st.button("📝 Record Result", disabled=not user_id or not mem_topic):
            try:
                from utils.memory_utils import record_quiz_result
                record_quiz_result(user_id, mem_topic, score, total)
                st.success("✅ Quiz result recorded!")
            except Exception as e:
                st.error(f"❌ Error: {str(e)}")
    
    with col2:
        if st.button("📊 Weak Topics", disabled=not user_id):
            try:
                from utils.memory_utils import get_weak_topics
                weak = get_weak_topics(user_id)
                st.info(f"Weak Topics: {weak}")
            except Exception as e:
                st.error(f"❌ Error: {str(e)}")
    
    with col3:
        if st.button("📈 Performance", disabled=not user_id):
            try:
                from utils.memory_utils import get_user_performance
                perf = get_user_performance(user_id)
                st.json(perf)
            except Exception as e:
                st.error(f"❌ Error: {str(e)}")

# Tab 5: Vector Search
with tab5:
    st.header("Vector Database & PDF Search")
    
    # File upload section
    with st.expander("📁 Upload & Process Documents", expanded=False):
        uploaded_files = st.file_uploader(
            "Upload PDF documents", 
            type=["pdf"], 
            accept_multiple_files=True,
            help="Upload PDFs to create searchable embeddings"
        )
        
        col1, col2 = st.columns(2)
        with col1:
            if st.button("🔄 Create Embeddings", disabled=not uploaded_files):
                if uploaded_files:
                    with st.spinner("Processing documents..."):
                        try:
                            from utils.vector_utils import create_vector_embeddings
                            success = create_vector_embeddings(uploaded_files)
                            if success:
                                st.balloons()
                        except Exception as e:
                            st.error(f"❌ Error: {str(e)}")
        
        with col2:
            if st.button("🗑️ Clear Database"):
                try:
                    # Reset the global vector database
                    import sys
                    if 'utils.vector_utils' in sys.modules:
                        from utils.vector_utils import get_vector_database
                        vector_db = get_vector_database()
                        vector_db.__init__()  # Reinitialize
                    st.success("✅ Database cleared!")
                except Exception as e:
                    st.error(f"❌ Error: {str(e)}")
    
    # Search section
    st.subheader("🔍 Search Documents")
    
    col1, col2 = st.columns([3, 1])
    with col1:
        search_query = st.text_input("Search query:", placeholder="machine learning algorithms")
    with col2:
        num_results = st.selectbox("Results", [1, 3, 5, 10], index=1)
    
    if st.button("Search", type="primary", disabled=not search_query.strip()):
        if search_query.strip():
            with st.spinner("Searching..."):
                try:
                    from utils.vector_utils import search_documents
                    results = search_documents(search_query, k=num_results)
                    
                    if results:
                        st.success(f"✅ Found {len(results)} results")
                        
                        for i, result in enumerate(results, 1):
                            with st.expander(f"📄 Result {i} (Score: {result['score']:.3f})"):
                                st.markdown(f"**📁 File:** {result['metadata'].get('filename', 'Unknown')}")
                                st.markdown(f"**📊 Chunk:** {result['metadata'].get('chunk_id', 'N/A')} of {result['metadata'].get('total_chunks', 'N/A')}")
                                st.text_area("Content:", value=result['text'], height=120, disabled=True, key=f"result_{i}")
                    else:
                        st.warning("⚠️ No results found. Upload and process some PDFs first.")
                        
                except Exception as e:
                    st.error(f"❌ Error: {str(e)}")
    
    # Q&A section
    st.subheader("💬 Ask Questions")
    question = st.text_input("Ask about your documents:", placeholder="What are the main concepts?")
    
    if st.button("Get Answer", type="primary", disabled=not question.strip()):
        if question.strip():
            with st.spinner("Generating answer..."):
                try:
                    from utils.llm_utils import generate_contextual_answer
                    answer = generate_contextual_answer(question)
                    
                    st.success("✅ Answer generated!")
                    with st.expander("💡 Answer", expanded=True):
                        st.markdown(answer)
                        
                except Exception as e:
                    st.error(f"❌ Error: {str(e)}")

# Footer
st.markdown("---")
st.markdown("*StudyMentor - Lightweight Backend Testing Interface*")