"""
Authentication router for StudyMentor API
Handles user registration, login, logout, and profile management
"""

from fastapi import APIRouter, HTTPException, status, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from typing import Optional
from datetime import timedelta

from utils.auth_utils import (
    UserRegistration, UserLogin, AuthResponse, UserResponse,
    create_user_in_db, authenticate_user, get_user_by_id, 
    update_user_profile, format_user_response, create_access_token,
    decode_access_token, ACCESS_TOKEN_EXPIRE_MINUTES
)

router = APIRouter(prefix="/auth", tags=["Authentication"])
security = HTTPBearer()

# Dependency to get current user
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)) -> dict:
    """Get current authenticated user"""
    token = credentials.credentials
    payload = decode_access_token(token)
    
    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_id = payload.get("sub")
    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload"
        )
    
    user = get_user_by_id(user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register_user(user_data: UserRegistration):
    """
    Register a new user
    
    - **full_name**: User's full name (2-100 characters)
    - **email**: Valid email address
    - **password**: Strong password (min 6 chars, letters + numbers)
    - **study_preferences**: Optional study preferences
    """
    try:
        # Create user in database
        user_doc = create_user_in_db(user_data)
        
        # Generate access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user_doc["_id"])},
            expires_delta=access_token_expires
        )
        
        # Format user response
        user_response = format_user_response(user_doc)
        
        return AuthResponse(
            access_token=access_token,
            user=user_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login", response_model=AuthResponse)
async def login_user(user_credentials: UserLogin):
    """
    Login user with email and password
    
    - **email**: Registered email address
    - **password**: User's password
    """
    try:
        # Authenticate user
        user = authenticate_user(user_credentials.email, user_credentials.password)
        
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
                headers={"WWW-Authenticate": "Bearer"},
            )
        
        # Generate access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(user["_id"])},
            expires_delta=access_token_expires
        )
        
        # Format user response
        user_response = format_user_response(user)
        
        return AuthResponse(
            access_token=access_token,
            user=user_response
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Login failed: {str(e)}"
        )

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """
    Get current user's profile information
    Requires valid JWT token in Authorization header
    """
    return format_user_response(current_user)

@router.put("/me", response_model=UserResponse)
async def update_current_user_profile(
    update_data: dict,
    current_user: dict = Depends(get_current_user)
):
    """
    Update current user's profile
    
    - **full_name**: Updated full name
    - **study_preferences**: Updated study preferences
    """
    try:
        user_id = str(current_user["_id"])
        
        # Validate update data
        allowed_fields = ["full_name", "study_preferences"]
        filtered_data = {k: v for k, v in update_data.items() if k in allowed_fields}
        
        if not filtered_data:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No valid fields to update"
            )
        
        # Update user in database
        success = update_user_profile(user_id, filtered_data)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to update profile"
            )
        
        # Get updated user
        updated_user = get_user_by_id(user_id)
        return format_user_response(updated_user)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Profile update failed: {str(e)}"
        )

@router.post("/logout")
async def logout_user(current_user: dict = Depends(get_current_user)):
    """
    Logout user (client should remove token)
    Note: JWT tokens are stateless, so logout is handled client-side
    """
    return {
        "message": "Successfully logged out",
        "detail": "Please remove the token from client storage"
    }

@router.post("/refresh", response_model=AuthResponse)
async def refresh_token(current_user: dict = Depends(get_current_user)):
    """
    Refresh user's access token
    """
    try:
        # Generate new access token
        access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = create_access_token(
            data={"sub": str(current_user["_id"])},
            expires_delta=access_token_expires
        )
        
        # Format user response
        user_response = format_user_response(current_user)
        
        return AuthResponse(
            access_token=access_token,
            user=user_response
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Token refresh failed: {str(e)}"
        )

@router.get("/validate")
async def validate_token(current_user: dict = Depends(get_current_user)):
    """
    Validate if current token is valid
    Returns user info if token is valid
    """
    return {
        "valid": True,
        "user": format_user_response(current_user)
    }