"""
vector_utils.py
Vector database utilities for PDF document embeddings and retrieval.
Uses FAISS for efficient similarity search and sentence-transformers for embeddings.
"""

import os
import tempfile
from typing import List, Dict, Any, Optional
import numpy as np
import streamlit as st
from sentence_transformers import SentenceTransformer
import faiss
import PyPDF2
from langchain.text_splitter import RecursiveCharacterTextSplitter
import pickle
import json


class VectorDatabase:
    """
    A vector database for storing and retrieving PDF document embeddings.
    """
    
    def __init__(self, model_name: str = "all-MiniLM-L6-v2"):
        """
        Initialize the vector database with a sentence transformer model.
        
        Args:
            model_name: Name of the sentence transformer model to use
        """
        self.model = SentenceTransformer(model_name)
        self.dimension = self.model.get_sentence_embedding_dimension()
        self.index = faiss.IndexFlatIP(self.dimension)  # Inner product for cosine similarity
        self.documents = []  # Store original text chunks
        self.metadata = []   # Store metadata for each chunk
        
    def extract_text_from_pdf(self, pdf_file) -> str:
        """
        Extract text from uploaded PDF file.
        
        Args:
            pdf_file: Streamlit uploaded file object
            
        Returns:
            str: Extracted text from PDF
        """
        text = ""
        try:
            # Create a temporary file to save the uploaded PDF
            with tempfile.NamedTemporaryFile(delete=False, suffix=".pdf") as tmp_file:
                tmp_file.write(pdf_file.getvalue())
                tmp_path = tmp_file.name
            
            # Extract text using PyPDF2
            with open(tmp_path, "rb") as f:
                reader = PyPDF2.PdfReader(f)
                for page_num, page in enumerate(reader.pages):
                    page_text = page.extract_text() or ""
                    text += f"\n--- Page {page_num + 1} ---\n{page_text}"
                    
            # Clean up temporary file
            os.unlink(tmp_path)
            
        except Exception as e:
            st.error(f"Error extracting text from PDF: {str(e)}")
            return ""
            
        return text
    
    def chunk_text(self, text: str, chunk_size: int = 1000, chunk_overlap: int = 200) -> List[str]:
        """
        Split text into overlapping chunks for better retrieval.
        
        Args:
            text: Input text to chunk
            chunk_size: Maximum size of each chunk
            chunk_overlap: Overlap between chunks
            
        Returns:
            List of text chunks
        """
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=chunk_size,
            chunk_overlap=chunk_overlap,
            length_function=len,
            separators=["\n\n", "\n", " ", ""]
        )
        
        chunks = text_splitter.split_text(text)
        return chunks
    
    def create_embeddings(self, texts: List[str]) -> np.ndarray:
        """
        Create embeddings for a list of texts.
        
        Args:
            texts: List of text chunks
            
        Returns:
            Numpy array of embeddings
        """
        embeddings = self.model.encode(texts, convert_to_numpy=True, normalize_embeddings=True)
        return embeddings
    
    def add_documents(self, texts: List[str], metadata: List[Dict[str, Any]] = None):
        """
        Add documents to the vector database.
        
        Args:
            texts: List of text chunks
            metadata: Optional metadata for each chunk
        """
        if not texts:
            return
            
        embeddings = self.create_embeddings(texts)
        
        # Add to FAISS index
        self.index.add(embeddings)
        
        # Store documents and metadata
        self.documents.extend(texts)
        if metadata:
            self.metadata.extend(metadata)
        else:
            self.metadata.extend([{"chunk_id": len(self.documents) + i} for i in range(len(texts))])
    
    def search(self, query: str, k: int = 5) -> List[Dict[str, Any]]:
        """
        Search for similar documents using semantic similarity.
        
        Args:
            query: Search query
            k: Number of results to return
            
        Returns:
            List of search results with text, score, and metadata
        """
        if self.index.ntotal == 0:
            return []
            
        # Create query embedding
        query_embedding = self.create_embeddings([query])
        
        # Search in FAISS index
        scores, indices = self.index.search(query_embedding, k)
        
        results = []
        for score, idx in zip(scores[0], indices[0]):
            if idx < len(self.documents):
                results.append({
                    "text": self.documents[idx],
                    "score": float(score),
                    "metadata": self.metadata[idx]
                })
                
        return results
    
    def save_database(self, filepath: str):
        """
        Save the vector database to disk.
        
        Args:
            filepath: Path to save the database
        """
        # Save FAISS index
        faiss.write_index(self.index, f"{filepath}.index")
        
        # Save documents and metadata
        data = {
            "documents": self.documents,
            "metadata": self.metadata,
            "dimension": self.dimension
        }
        
        with open(f"{filepath}.pkl", "wb") as f:
            pickle.dump(data, f)
    
    def load_database(self, filepath: str):
        """
        Load the vector database from disk.
        
        Args:
            filepath: Path to load the database from
        """
        # Load FAISS index
        self.index = faiss.read_index(f"{filepath}.index")
        
        # Load documents and metadata
        with open(f"{filepath}.pkl", "rb") as f:
            data = pickle.load(f)
            
        self.documents = data["documents"]
        self.metadata = data["metadata"]
        self.dimension = data["dimension"]


# Global vector database instance
_vector_db = None

def get_vector_database() -> VectorDatabase:
    """
    Get or create the global vector database instance.
    
    Returns:
        VectorDatabase instance
    """
    global _vector_db
    if _vector_db is None:
        _vector_db = VectorDatabase()
    return _vector_db


def create_vector_embeddings(uploaded_files) -> bool:
    """
    Process uploaded PDF files and create vector embeddings.
    
    Args:
        uploaded_files: List of Streamlit uploaded file objects
        
    Returns:
        bool: True if successful, False otherwise
    """
    if not uploaded_files:
        st.warning("No files uploaded!")
        return False
    
    vector_db = get_vector_database()
    
    progress_bar = st.progress(0)
    status_text = st.empty()
    
    all_chunks = []
    all_metadata = []
    
    for i, uploaded_file in enumerate(uploaded_files):
        try:
            status_text.text(f"Processing {uploaded_file.name}...")
            
            # Extract text from PDF
            pdf_text = vector_db.extract_text_from_pdf(uploaded_file)
            
            if not pdf_text.strip():
                st.warning(f"No text extracted from {uploaded_file.name}")
                continue
            
            # Chunk the text
            chunks = vector_db.chunk_text(pdf_text)
            
            # Create metadata for each chunk
            chunk_metadata = [
                {
                    "filename": uploaded_file.name,
                    "chunk_id": j,
                    "total_chunks": len(chunks)
                }
                for j in range(len(chunks))
            ]
            
            all_chunks.extend(chunks)
            all_metadata.extend(chunk_metadata)
            
            # Update progress
            progress = (i + 1) / len(uploaded_files)
            progress_bar.progress(progress)
            
        except Exception as e:
            st.error(f"Error processing {uploaded_file.name}: {str(e)}")
            continue
    
    if all_chunks:
        status_text.text("Creating embeddings and building vector database...")
        try:
            # Add all documents to the vector database
            vector_db.add_documents(all_chunks, all_metadata)
            
            progress_bar.progress(1.0)
            status_text.empty()
            progress_bar.empty()
            
            st.success(f"Vector database is ready! Processed {len(all_chunks)} text chunks from {len(uploaded_files)} files.")
            
            # Display some stats
            with st.expander("Database Statistics"):
                st.write(f"**Total documents in database:** {vector_db.index.ntotal}")
                st.write(f"**Embedding dimension:** {vector_db.dimension}")
                st.write(f"**Files processed:** {len(set(meta['filename'] for meta in all_metadata))}")
                
                # Show file breakdown
                file_counts = {}
                for meta in all_metadata:
                    filename = meta['filename']
                    file_counts[filename] = file_counts.get(filename, 0) + 1
                
                st.write("**Chunks per file:**")
                for filename, count in file_counts.items():
                    st.write(f"- {filename}: {count} chunks")
            
            return True
            
        except Exception as e:
            st.error(f"Error creating vector embeddings: {str(e)}")
            return False
    else:
        st.error("No text could be extracted from the uploaded files!")
        return False


def search_documents(query: str, k: int = 5) -> List[Dict[str, Any]]:
    """
    Search for relevant documents based on a query.
    
    Args:
        query: Search query
        k: Number of results to return
        
    Returns:
        List of search results
    """
    vector_db = get_vector_database()
    
    if vector_db.index.ntotal == 0:
        st.warning("No documents in the vector database. Please upload and process some PDFs first.")
        return []
    
    results = vector_db.search(query, k)
    return results


def get_relevant_context(query: str, max_context_length: int = 2000) -> str:
    """
    Get relevant context for a query by searching the vector database.
    
    Args:
        query: Search query
        max_context_length: Maximum length of context to return
        
    Returns:
        Relevant context text
    """
    results = search_documents(query, k=3)
    
    if not results:
        return ""
    
    context_parts = []
    current_length = 0
    
    for result in results:
        text = result["text"]
        if current_length + len(text) <= max_context_length:
            context_parts.append(text)
            current_length += len(text)
        else:
            # Add partial text if there's remaining space
            remaining_space = max_context_length - current_length
            if remaining_space > 100:  # Only add if there's meaningful space left
                context_parts.append(text[:remaining_space] + "...")
            break
    
    return "\n\n".join(context_parts)