"""
Authentication utilities for StudyMentor
Handles user registration, login, JWT tokens, and password hashing
"""

import os
import jwt
import bcrypt
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
from pymongo import MongoClient
from pymongo.errors import DuplicateKeyError
from fastapi import HTTPException, status
from pydantic import BaseModel, EmailStr, Field
import re

# MongoDB connection (optional for demo mode)
MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017/")
try:
    client = MongoClient(MONGODB_URL, serverSelectionTimeoutMS=5000)  # 5 second timeout
    # Test connection
    client.server_info()
    db = client.studymentor
    users_collection = db.users
    MONGODB_AVAILABLE = True
    print("MongoDB connected successfully")
except Exception as e:
    print(f"MongoDB not available, running in demo mode: {e}")
    MONGODB_AVAILABLE = False
    client = None
    db = None
    users_collection = None

# JWT Configuration
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY", "your-super-secret-jwt-key-change-in-production")
JWT_ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 1440  # 24 hours

# Pydantic Models
class UserRegistration(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=6, max_length=100)
    study_preferences: Optional[Dict] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    full_name: str
    email: str
    created_at: datetime
    study_preferences: Optional[Dict] = None
    study_stats: Optional[Dict] = None

class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserResponse

# Password utilities
def hash_password(password: str) -> str:
    """Hash a password using bcrypt"""
    salt = bcrypt.gensalt()
    hashed = bcrypt.hashpw(password.encode('utf-8'), salt)
    return hashed.decode('utf-8')

def verify_password(password: str, hashed_password: str) -> bool:
    """Verify a password against its hash"""
    return bcrypt.checkpw(password.encode('utf-8'), hashed_password.encode('utf-8'))

def validate_password_strength(password: str) -> bool:
    """Validate password strength"""
    if len(password) < 6:
        return False
    if not re.search(r"[A-Za-z]", password):
        return False
    if not re.search(r"\d", password):
        return False
    return True

# JWT utilities
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None) -> str:
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def decode_access_token(token: str) -> Optional[Dict]:
    """Decode and validate JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        return None
    except jwt.JWTError:
        return None

# User database operations
def create_user_in_db(user_data: UserRegistration) -> Dict:
    """Create a new user in MongoDB or return demo user"""
    if not MONGODB_AVAILABLE:
        # Return a demo user for testing
        return {
            "_id": "demo_user_id",
            "full_name": user_data.full_name,
            "email": user_data.email.lower(),
            "created_at": datetime.utcnow(),
            "study_preferences": user_data.study_preferences or {},
            "study_stats": {"total_study_time": 0, "completed_sessions": 0}
        }
    
    try:
        # Check if user already exists
        existing_user = users_collection.find_one({"email": user_data.email.lower()})
        if existing_user:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email already registered"
            )
        
        # Validate password strength
        if not validate_password_strength(user_data.password):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Password must be at least 6 characters with letters and numbers"
            )
        
        # Hash password
        hashed_password = hash_password(user_data.password)
        
        # Prepare user document
        user_doc = {
            "full_name": user_data.full_name.strip(),
            "email": user_data.email.lower(),
            "password_hash": hashed_password,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "is_active": True,
            "study_preferences": user_data.study_preferences or {
                "preferred_difficulty": "medium",
                "daily_study_goal": 60,  # minutes
                "preferred_subjects": [],
                "study_time_preference": "morning"
            },
            "study_stats": {
                "total_study_time": 0,
                "completed_sessions": 0,
                "quiz_scores": [],
                "streak_count": 0,
                "last_activity": datetime.utcnow()
            }
        }
        
        # Insert user
        result = users_collection.insert_one(user_doc)
        user_doc["_id"] = result.inserted_id
        
        return user_doc
        
    except DuplicateKeyError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to create user: {str(e)}"
        )

def authenticate_user(email: str, password: str) -> Optional[Dict]:
    """Authenticate user login"""
    try:
        user = users_collection.find_one({"email": email.lower()})
        if not user:
            return None
        
        if not verify_password(password, user["password_hash"]):
            return None
        
        # Update last activity
        users_collection.update_one(
            {"_id": user["_id"]},
            {"$set": {"study_stats.last_activity": datetime.utcnow()}}
        )
        
        return user
        
    except Exception as e:
        print(f"Authentication error: {e}")
        return None

def get_user_by_id(user_id: str) -> Optional[Dict]:
    """Get user by ID"""
    try:
        from bson import ObjectId
        user = users_collection.find_one({"_id": ObjectId(user_id)})
        return user
    except Exception as e:
        print(f"Get user error: {e}")
        return None

def update_user_profile(user_id: str, update_data: Dict) -> bool:
    """Update user profile"""
    try:
        from bson import ObjectId
        
        # Remove sensitive fields that shouldn't be updated directly
        update_data.pop("password_hash", None)
        update_data.pop("_id", None)
        update_data["updated_at"] = datetime.utcnow()
        
        result = users_collection.update_one(
            {"_id": ObjectId(user_id)},
            {"$set": update_data}
        )
        
        return result.modified_count > 0
        
    except Exception as e:
        print(f"Update user error: {e}")
        return False

def format_user_response(user_doc: Dict) -> UserResponse:
    """Format user document for API response"""
    return UserResponse(
        id=str(user_doc["_id"]),
        full_name=user_doc["full_name"],
        email=user_doc["email"],
        created_at=user_doc["created_at"],
        study_preferences=user_doc.get("study_preferences", {}),
        study_stats=user_doc.get("study_stats", {})
    )

# Initialize database indexes
def init_db_indexes():
    """Initialize database indexes for better performance"""
    try:
        # Create unique index on email
        users_collection.create_index("email", unique=True)
        print("Database indexes initialized successfully")
    except Exception as e:
        print(f"Index initialization error: {e}")

# Call this when the module is imported (optional for demo mode)
try:
    init_db_indexes()
except Exception as e:
    print(f"Warning: Database not available, running in demo mode: {e}")