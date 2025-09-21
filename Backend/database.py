"""
database.py
MongoDB database configuration and connection management
"""

import os
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
import logging
from typing import Optional

logger = logging.getLogger(__name__)

class Database:
    client: Optional[AsyncIOMotorClient] = None
    database = None

# Database instance
db_instance = Database()

async def connect_to_mongo():
    """Create database connection"""
    try:
        # MongoDB connection string
        MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017")
        DATABASE_NAME = os.getenv("DATABASE_NAME", "studymentor")
        
        logger.info(f"Connecting to MongoDB at {MONGODB_URL}")
        
        # Create async MongoDB client
        db_instance.client = AsyncIOMotorClient(
            MONGODB_URL,
            maxPoolSize=10,
            minPoolSize=10,
            serverSelectionTimeoutMS=5000,  # 5 second timeout
        )
        
        # Test the connection
        await db_instance.client.admin.command('ping')
        
        # Get database
        db_instance.database = db_instance.client[DATABASE_NAME]
        
        logger.info(f"Successfully connected to MongoDB database: {DATABASE_NAME}")
        
        # Create indexes
        await create_indexes()
        
    except ConnectionFailure as e:
        logger.error(f"Failed to connect to MongoDB: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error connecting to MongoDB: {e}")
        raise

async def close_mongo_connection():
    """Close database connection"""
    if db_instance.client:
        db_instance.client.close()
        logger.info("Disconnected from MongoDB")

async def create_indexes():
    """Create database indexes for performance"""
    try:
        db = db_instance.database
        
        # Users collection indexes
        await db.users.create_index("email", unique=True)
        await db.users.create_index("auth.email_verification_token")
        await db.users.create_index("auth.password_reset_token")
        
        # Syllabi collection indexes
        await db.syllabi.create_index("user_id")
        await db.syllabi.create_index([("user_id", 1), ("created_at", -1)])
        await db.syllabi.create_index("processing.status")
        
        # Study plans collection indexes
        await db.study_plans.create_index("user_id")
        await db.study_plans.create_index("syllabus_id")
        await db.study_plans.create_index([("user_id", 1), ("status", 1)])
        
        # Quizzes collection indexes
        await db.quizzes.create_index("user_id")
        await db.quizzes.create_index("syllabus_id")
        await db.quizzes.create_index("status")
        
        # Quiz attempts collection indexes
        await db.quiz_attempts.create_index([("user_id", 1), ("created_at", -1)])
        await db.quiz_attempts.create_index("quiz_id")
        await db.quiz_attempts.create_index([("user_id", 1), ("quiz_id", 1), ("attempt_number", 1)])
        
        # User progress collection indexes
        await db.user_progress.create_index([("user_id", 1), ("date", -1)])
        await db.user_progress.create_index([("date", -1)])
        
        logger.info("Database indexes created successfully")
        
    except Exception as e:
        logger.error(f"Failed to create indexes: {e}")
        # Don't raise - indexes are not critical for basic functionality

def get_database():
    """Get database instance"""
    if not db_instance.database:
        raise RuntimeError("Database not initialized. Call connect_to_mongo() first.")
    return db_instance.database

# Collection accessors
def get_users_collection():
    """Get users collection"""
    return get_database().users

def get_syllabi_collection():
    """Get syllabi collection"""
    return get_database().syllabi

def get_study_plans_collection():
    """Get study plans collection"""
    return get_database().study_plans

def get_quizzes_collection():
    """Get quizzes collection"""
    return get_database().quizzes

def get_quiz_attempts_collection():
    """Get quiz attempts collection"""
    return get_database().quiz_attempts

def get_user_progress_collection():
    """Get user progress collection"""
    return get_database().user_progress