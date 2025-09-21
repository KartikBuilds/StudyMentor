import axios from 'axios';

// Configure axios with base URL for all API calls
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
    timeout: 30000, // 30 seconds timeout
});

// Request interceptor for adding auth tokens (if needed in future)
api.interceptors.request.use(
    (config) => {
        // Add auth token if available
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response interceptor for handling errors globally
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Handle common error scenarios
        if (error.response?.status === 401) {
            // Handle unauthorized access
            localStorage.removeItem('auth_token');
            // Could redirect to login page here
        } else if (error.response?.status >= 500) {
            // Handle server errors
            console.error('Server error:', error.response?.data?.error?.message || error.message);
        }

        return Promise.reject(error);
    }
);

// API endpoint functions
export const syllabusAPI = {
    parseText: (data) => api.post('/api/syllabus/parse/text', data),
    parsePDF: (formData) => api.post('/api/syllabus/parse/pdf', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
    }),
    getSyllabus: (syllabusId) => api.get(`/api/syllabus/${syllabusId}`),
    generateFlashcards: (data) => api.post('/api/syllabus/flashcards/generate', data),
};

export const studyPlanAPI = {
    generate: (data) => api.post('/api/study-plan/generate', data),
};

export const quizAPI = {
    generate: (data) => api.post('/api/quiz/generate', data),
    submit: (data) => api.post('/api/quiz/submit', data),
    getHistory: (userId) => api.get(`/api/quiz/history/${userId}`),
};

export const calendarAPI = {
    syncStudyPlan: (data) => api.post('/api/calendar/sync', data),
    removeStudyEvents: () => api.delete('/api/calendar/events'),
    getStatus: () => api.get('/api/calendar/status'),
};

export const healthAPI = {
    check: () => api.get('/api/health'),
};

export default api;