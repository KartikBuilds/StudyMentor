// aiAPI.js - API client for AI-powered features

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

class AIAPIClient {
    async chatWithStudyBuddy(message, context = null, userId = null) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message,
                    context,
                    user_id: userId
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error('Chat API error:', error);
            throw error;
        }
    }

    async analyzeSyllabus(fileContent, fileName, userPreferences = null) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/ai/syllabus/analyze`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    file_content: fileContent,
                    file_name: fileName,
                    user_preferences: userPreferences
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error('Syllabus analysis API error:', error);
            throw error;
        }
    }

    async generateStudyPlan(analysisId, examDays = 30, hoursPerDay = 3) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/ai/syllabus/${analysisId}/generate-study-plan?exam_days=${examDays}&hours_per_day=${hoursPerDay}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error('Study plan generation API error:', error);
            throw error;
        }
    }

    async generateFlashcards(analysisId, maxCards = 50) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/ai/syllabus/${analysisId}/generate-flashcards?max_cards=${maxCards}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error('Flashcard generation API error:', error);
            throw error;
        }
    }

    async generateQuizzes(analysisId, numQuizzes = 5) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/ai/syllabus/${analysisId}/generate-quizzes?num_quizzes=${numQuizzes}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            return data.data;
        } catch (error) {
            console.error('Quiz generation API error:', error);
            throw error;
        }
    }

    // Helper method to read file content
    async readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    }

    // Test API connection
    async testConnection() {
        try {
            const response = await fetch(`${API_BASE_URL}/api/health`);
            return response.ok;
        } catch (error) {
            console.error('API connection test failed:', error);
            return false;
        }
    }
}

export const aiAPI = new AIAPIClient();