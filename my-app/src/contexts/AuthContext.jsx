import React, { createContext, useContext, useReducer, useEffect } from 'react';

// Authentication API base URL
const API_BASE_URL = 'http://localhost:8000';

// Auth Context
const AuthContext = createContext();

// Auth Actions
const AUTH_ACTIONS = {
    LOGIN_START: 'LOGIN_START',
    LOGIN_SUCCESS: 'LOGIN_SUCCESS',
    LOGIN_FAILURE: 'LOGIN_FAILURE',
    REGISTER_START: 'REGISTER_START',
    REGISTER_SUCCESS: 'REGISTER_SUCCESS',
    REGISTER_FAILURE: 'REGISTER_FAILURE',
    LOGOUT: 'LOGOUT',
    LOAD_USER: 'LOAD_USER',
    CLEAR_ERROR: 'CLEAR_ERROR',
    UPDATE_PROFILE: 'UPDATE_PROFILE'
};

// Demo mode - set to true to bypass authentication
const DEMO_MODE = true;

// Initial state
const initialState = {
    user: DEMO_MODE ? {
        id: 'demo-user-1',
        full_name: 'Demo User',
        email: 'demo@studymentor.ai',
        user_stats: {
            total_study_hours: 45,
            quizzes_completed: 12,
            flashcards_created: 85,
            study_streak: 7
        },
        study_preferences: {
            preferred_difficulty: 'medium',
            daily_study_goal: 120,
            preferred_subjects: ['Mathematics', 'Physics', 'Computer Science'],
            study_time_preference: 'evening'
        }
    } : null,
    token: DEMO_MODE ? 'demo-token-12345' : localStorage.getItem('studymentor_token'),
    isAuthenticated: DEMO_MODE,
    isLoading: false,
    error: null
};

// Auth Reducer
const authReducer = (state, action) => {
    switch (action.type) {
        case AUTH_ACTIONS.LOGIN_START:
        case AUTH_ACTIONS.REGISTER_START:
            return {
                ...state,
                isLoading: true,
                error: null
            };

        case AUTH_ACTIONS.LOGIN_SUCCESS:
        case AUTH_ACTIONS.REGISTER_SUCCESS:
            localStorage.setItem('studymentor_token', action.payload.access_token);
            return {
                ...state,
                user: action.payload.user,
                token: action.payload.access_token,
                isAuthenticated: true,
                isLoading: false,
                error: null
            };

        case AUTH_ACTIONS.LOGIN_FAILURE:
        case AUTH_ACTIONS.REGISTER_FAILURE:
            localStorage.removeItem('studymentor_token');
            return {
                ...state,
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
                error: action.payload
            };

        case AUTH_ACTIONS.LOGOUT:
            localStorage.removeItem('studymentor_token');
            return {
                ...state,
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
                error: null
            };

        case AUTH_ACTIONS.LOAD_USER:
            return {
                ...state,
                user: action.payload,
                isAuthenticated: true,
                isLoading: false,
                error: null
            };

        case AUTH_ACTIONS.CLEAR_ERROR:
            return {
                ...state,
                error: null
            };

        case AUTH_ACTIONS.UPDATE_PROFILE:
            return {
                ...state,
                user: action.payload,
                error: null
            };

        default:
            return state;
    }
};

// Auth Provider Component
export const AuthProvider = ({ children }) => {
    const [state, dispatch] = useReducer(authReducer, initialState);

    // API utility function
    const apiCall = async (endpoint, options = {}) => {
        const url = `${API_BASE_URL}${endpoint}`;
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        // Add auth token if available
        if (state.token && !options.skipAuth) {
            config.headers.Authorization = `Bearer ${state.token}`;
        }

        const response = await fetch(url, config);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.detail || 'API request failed');
        }

        return data;
    };

    // Load user on app start
    useEffect(() => {
        if (DEMO_MODE) {
            // Skip API call in demo mode, user is already set in initial state
            return;
        }

        const loadUser = async () => {
            const token = localStorage.getItem('studymentor_token');
            if (token) {
                try {
                    const userData = await apiCall('/auth/me');
                    dispatch({ type: AUTH_ACTIONS.LOAD_USER, payload: userData });
                } catch (error) {
                    console.error('Failed to load user:', error);
                    localStorage.removeItem('studymentor_token');
                }
            }
        };

        loadUser();
    }, []);

    // Register function
    const register = async (userData) => {
        if (DEMO_MODE) {
            // In demo mode, simulate successful registration
            return { success: true, message: 'Demo registration successful!' };
        }

        dispatch({ type: AUTH_ACTIONS.REGISTER_START });
        try {
            const response = await apiCall('/auth/register', {
                method: 'POST',
                body: JSON.stringify(userData),
                skipAuth: true
            });

            dispatch({ type: AUTH_ACTIONS.REGISTER_SUCCESS, payload: response });
            return { success: true, data: response };
        } catch (error) {
            dispatch({ type: AUTH_ACTIONS.REGISTER_FAILURE, payload: error.message });
            return { success: false, error: error.message };
        }
    };

    // Login function
    const login = async (credentials) => {
        if (DEMO_MODE) {
            // In demo mode, simulate successful login
            return { success: true, message: 'Demo login successful!' };
        }

        dispatch({ type: AUTH_ACTIONS.LOGIN_START });
        try {
            const response = await apiCall('/auth/login', {
                method: 'POST',
                body: JSON.stringify(credentials),
                skipAuth: true
            });

            dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: response });
            return { success: true, data: response };
        } catch (error) {
            dispatch({ type: AUTH_ACTIONS.LOGIN_FAILURE, payload: error.message });
            return { success: false, error: error.message };
        }
    };

    // Logout function
    const logout = async () => {
        if (DEMO_MODE) {
            // In demo mode, just reset to demo state
            window.location.reload(); // Simple way to reset demo state
            return;
        }

        try {
            await apiCall('/auth/logout', { method: 'POST' });
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            dispatch({ type: AUTH_ACTIONS.LOGOUT });
        }
    };

    // Update profile function
    const updateProfile = async (profileData) => {
        if (DEMO_MODE) {
            // In demo mode, simulate successful profile update
            const updatedUser = { ...state.user, ...profileData };
            dispatch({ type: AUTH_ACTIONS.UPDATE_PROFILE, payload: updatedUser });
            return { success: true, data: updatedUser };
        }

        try {
            const response = await apiCall('/auth/me', {
                method: 'PUT',
                body: JSON.stringify(profileData)
            });

            dispatch({ type: AUTH_ACTIONS.UPDATE_PROFILE, payload: response });
            return { success: true, data: response };
        } catch (error) {
            return { success: false, error: error.message };
        }
    };

    // Clear error function
    const clearError = () => {
        dispatch({ type: AUTH_ACTIONS.CLEAR_ERROR });
    };

    // Refresh token function
    const refreshToken = async () => {
        try {
            const response = await apiCall('/auth/refresh', { method: 'POST' });
            dispatch({ type: AUTH_ACTIONS.LOGIN_SUCCESS, payload: response });
            return true;
        } catch (error) {
            dispatch({ type: AUTH_ACTIONS.LOGOUT });
            return false;
        }
    };

    // Context value
    const contextValue = {
        ...state,
        register,
        login,
        logout,
        updateProfile,
        clearError,
        refreshToken,
        apiCall
    };

    return (
        <AuthContext.Provider value={contextValue}>
            {children}
        </AuthContext.Provider>
    );
};

// Custom hook to use auth context
export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext;