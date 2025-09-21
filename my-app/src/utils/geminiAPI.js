// geminiAPI.js - Direct Gemini AI API integration for study buddy

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY;
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

class GeminiAPI {
    constructor() {
        this.apiKey = GEMINI_API_KEY;
        this.conversationHistory = [];
    }

    async chatWithStudyBuddy(userMessage, conversationContext = []) {
        if (!this.apiKey) {
            throw new Error('Gemini API key not configured');
        }

        try {
            // Build conversation context for better responses
            let contextPrompt = `You are StudyMentor AI, a helpful and encouraging study assistant. You help students with:
- Explaining complex concepts in simple terms
- Creating study strategies and plans
- Answering academic questions across all subjects
- Providing motivation and study tips
- Breaking down difficult topics into manageable parts

Guidelines:
- Be encouraging and supportive
- Use emojis appropriately to make responses engaging
- Provide practical, actionable advice
- If asked about specific subjects, give detailed explanations
- Suggest follow-up questions when appropriate
- Keep responses concise but comprehensive

`;

            // Add recent conversation context
            if (conversationContext.length > 0) {
                contextPrompt += "Recent conversation:\n";
                conversationContext.forEach(msg => {
                    contextPrompt += `${msg.role === 'user' ? 'Student' : 'StudyMentor'}: ${msg.content}\n`;
                });
                contextPrompt += "\n";
            }

            contextPrompt += `Student's current question: ${userMessage}

Please provide a helpful, encouraging response as StudyMentor AI. If appropriate, suggest 2-3 follow-up questions the student might find useful.`;

            const requestBody = {
                contents: [
                    {
                        parts: [
                            {
                                text: contextPrompt
                            }
                        ]
                    }
                ],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 1000,
                }
            };

            const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(`Gemini API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
            }

            const data = await response.json();

            if (!data.candidates || data.candidates.length === 0) {
                throw new Error('No response generated from Gemini');
            }

            const generatedText = data.candidates[0].content.parts[0].text;

            // Extract suggested questions if they exist
            const suggestedQuestions = this.extractSuggestedQuestions(generatedText);

            return {
                response: generatedText,
                suggested_questions: suggestedQuestions
            };

        } catch (error) {
            console.error('Gemini API Error:', error);
            throw error;
        }
    }

    extractSuggestedQuestions(text) {
        // Try to extract suggested questions from the response
        const suggestions = [];

        // Look for common patterns of suggested questions
        const patterns = [
            /(?:follow-up questions?|you might ask|consider asking|also explore):?\s*\n?(.*?)(?:\n\n|$)/gi,
            /(?:here are some|try these|consider these)\s+(?:questions?|topics?):?\s*\n?(.*?)(?:\n\n|$)/gi,
            /(?:\d+\.\s*)(.*?)\?/g
        ];

        patterns.forEach(pattern => {
            const matches = text.match(pattern);
            if (matches) {
                matches.forEach(match => {
                    // Clean up and extract question
                    const question = match
                        .replace(/^\d+\.\s*/, '')
                        .replace(/^-\s*/, '')
                        .replace(/^\*\s*/, '')
                        .trim();

                    if (question.length > 10 && question.length < 100 && suggestions.length < 3) {
                        suggestions.push(question);
                    }
                });
            }
        });

        // If no suggestions found, provide some default ones based on the context
        if (suggestions.length === 0) {
            suggestions.push(
                "Can you explain this in more detail?",
                "What are some practical examples?",
                "How can I apply this in my studies?"
            );
        }

        return suggestions.slice(0, 3); // Limit to 3 suggestions
    }

    // Test connection to Gemini API
    async testConnection() {
        try {
            const response = await this.chatWithStudyBuddy("Hello, can you help me study?");
            return true;
        } catch (error) {
            console.error('Gemini connection test failed:', error);
            return false;
        }
    }

    // Analyze syllabus content
    async analyzeSyllabus(syllabusContent, fileName) {
        if (!this.apiKey) {
            throw new Error('Gemini API key not configured');
        }

        console.log('Analyzing syllabus content:', syllabusContent?.substring(0, 200) + '...');

        const prompt = `Analyze this syllabus content and extract structured information:

Syllabus Content:
${syllabusContent}

Please provide a JSON response with this exact structure:
{
    "title": "Course/Subject Title from the content",
    "analysis_id": "analysis-${Date.now()}",
    "subjects": [
        {
            "name": "Subject Name",
            "topics": ["Topic 1", "Topic 2", "Topic 3"],
            "difficulty": "Easy/Medium/Hard",
            "estimatedHours": 20
        }
    ],
    "totalTopics": 15,
    "estimatedStudyTime": "60 hours",
    "difficulty": "Medium",
    "recommendations": [
        "Study recommendation 1",
        "Study recommendation 2"
    ]
}

IMPORTANT: Extract actual subjects and topics from the provided content. If the content is not clear, create reasonable educational subjects based on what you can understand. Always return valid JSON with at least one subject. Return ONLY valid JSON.`;

        try {
            const response = await this.callGeminiAPI(prompt);
            console.log('Raw Gemini response:', response);

            // Try to parse JSON response
            try {
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    const parsed = JSON.parse(jsonMatch[0]);
                    console.log('Parsed analysis result:', parsed);

                    // Validate the response has required fields
                    if (!parsed.subjects || parsed.subjects.length === 0) {
                        throw new Error('No subjects found in analysis');
                    }

                    // Calculate totalTopics if not provided
                    if (!parsed.totalTopics) {
                        parsed.totalTopics = parsed.subjects.reduce((total, subject) =>
                            total + (subject.topics ? subject.topics.length : 0), 0);
                    }

                    return parsed;
                }
                throw new Error('No JSON found in response');
            } catch (parseError) {
                console.error('JSON parsing failed:', parseError);

                // Enhanced fallback: try to extract info from the text response
                const fallbackResult = this.createIntelligentFallback(response, fileName, syllabusContent);
                console.log('Using intelligent fallback:', fallbackResult);
                return fallbackResult;
            }
        } catch (error) {
            console.error('Syllabus analysis error:', error);

            // Last resort fallback
            const emergencyFallback = this.createEmergencyFallback(fileName, syllabusContent);
            console.log('Using emergency fallback:', emergencyFallback);
            return emergencyFallback;
        }
    }

    // Create intelligent fallback from text response
    createIntelligentFallback(response, fileName, syllabusContent) {
        // Try to extract subjects and topics from the response text
        const subjects = [];
        const lines = response.split('\n');

        let currentSubject = null;
        let topics = [];

        lines.forEach(line => {
            line = line.trim();
            if (line.includes('Subject:') || line.includes('Course:') || line.includes('Module:')) {
                if (currentSubject) {
                    subjects.push({
                        name: currentSubject,
                        topics: [...topics],
                        difficulty: "Medium",
                        estimatedHours: Math.max(10, topics.length * 5)
                    });
                }
                currentSubject = line.replace(/^(Subject:|Course:|Module:)/i, '').trim();
                topics = [];
            } else if (line.includes('Topic:') || line.match(/^\d+\./) || line.includes('-')) {
                const topic = line.replace(/^(Topic:|\d+\.|-)/i, '').trim();
                if (topic.length > 0 && topic.length < 100) {
                    topics.push(topic);
                }
            }
        });

        // Add the last subject
        if (currentSubject && topics.length > 0) {
            subjects.push({
                name: currentSubject,
                topics: [...topics],
                difficulty: "Medium",
                estimatedHours: Math.max(10, topics.length * 5)
            });
        }

        // If no subjects found, create one from filename or content analysis
        if (subjects.length === 0) {
            const subjectName = fileName ? fileName.replace(/\.(pdf|txt|doc|docx)$/i, '') : "General Studies";
            subjects.push({
                name: subjectName,
                topics: this.extractTopicsFromContent(syllabusContent),
                difficulty: "Medium",
                estimatedHours: 30
            });
        }

        const totalTopics = subjects.reduce((total, subject) => total + subject.topics.length, 0);
        const totalHours = subjects.reduce((total, subject) => total + subject.estimatedHours, 0);

        return {
            analysis_id: `analysis-${Date.now()}`,
            title: fileName || "Uploaded Syllabus",
            subjects: subjects,
            totalTopics: totalTopics,
            estimatedStudyTime: `${totalHours} hours`,
            difficulty: "Medium",
            recommendations: [
                "Break down complex topics into smaller parts",
                "Create a consistent study schedule",
                "Practice regularly with examples"
            ]
        };
    }

    // Extract topics from content using simple text analysis
    extractTopicsFromContent(content) {
        if (!content || content.length < 10) {
            return ["Introduction", "Core Concepts", "Practice Exercises", "Review"];
        }

        const topics = [];
        const lines = content.split('\n');

        lines.forEach(line => {
            line = line.trim();
            // Look for numbered lists, bullet points, or chapter headings
            if (line.match(/^\d+\./) || line.match(/^-/) || line.match(/^Chapter/i) || line.match(/^Unit/i)) {
                const topic = line.replace(/^(\d+\.|-|Chapter\s*\d*:?|Unit\s*\d*:?)/i, '').trim();
                if (topic.length > 3 && topic.length < 80 && !topics.includes(topic)) {
                    topics.push(topic);
                }
            }
        });

        // If still no topics, create generic ones
        if (topics.length === 0) {
            return ["Fundamentals", "Key Concepts", "Advanced Topics", "Applications", "Review & Practice"];
        }

        return topics.slice(0, 10); // Limit to 10 topics
    }

    // Create emergency fallback when everything else fails
    createEmergencyFallback(fileName, syllabusContent) {
        const subjectName = fileName ? fileName.replace(/\.(pdf|txt|doc|docx)$/i, '') : "Study Material";

        return {
            analysis_id: `emergency-${Date.now()}`,
            title: subjectName,
            subjects: [{
                name: subjectName,
                topics: [
                    "Introduction and Overview",
                    "Core Concepts",
                    "Key Principles",
                    "Practical Applications",
                    "Advanced Topics",
                    "Review and Summary"
                ],
                difficulty: "Medium",
                estimatedHours: 25
            }],
            totalTopics: 6,
            estimatedStudyTime: "25 hours",
            difficulty: "Medium",
            recommendations: [
                "Start with basic concepts before moving to advanced topics",
                "Allocate time for regular review sessions",
                "Practice with real examples when possible"
            ]
        };
    }    // Generate study plan from analysis
    async generateStudyPlan(analysisData, examDays = 30, hoursPerDay = 3) {
        if (!this.apiKey) {
            throw new Error('Gemini API key not configured');
        }

        const subjectsText = analysisData.subjects.map(s =>
            `${s.name}: ${s.topics.join(', ')}`
        ).join('\n');

        const prompt = `Create a detailed ${examDays}-day study plan for these subjects:

${subjectsText}

Study Parameters:
- Total days: ${examDays}
- Hours per day: ${hoursPerDay}
- Total hours available: ${examDays * hoursPerDay}

Generate a JSON response with this exact structure:
{
    "total_days": ${examDays},
    "daily_average": ${hoursPerDay},
    "schedule": [
        {
            "day": 1,
            "subject": "Subject Name",
            "topic": "Specific Topic",
            "duration": ${hoursPerDay},
            "difficulty": "Easy/Medium/Hard",
            "tasks": [
                "📚 Read and understand key concepts (90 mins)",
                "📝 Practice example problems (60 mins)",
                "🔄 Create summary notes (30 mins)"
            ],
            "notes": "Focus on understanding fundamentals"
        }
    ]
}

Distribute all topics evenly across ${examDays} days with specific tasks and time allocations. Return ONLY valid JSON.`;

        try {
            const response = await this.callGeminiAPI(prompt);

            try {
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
                throw new Error('No JSON found in response');
            } catch (parseError) {
                // Fallback structure
                return {
                    total_days: examDays,
                    daily_average: hoursPerDay,
                    schedule: this.generateFallbackSchedule(analysisData, examDays, hoursPerDay)
                };
            }
        } catch (error) {
            console.error('Study plan generation error:', error);
            throw error;
        }
    }

    // Generate flashcards from analysis
    async generateFlashcards(analysisData, maxCards = 20) {
        if (!this.apiKey) {
            throw new Error('Gemini API key not configured');
        }

        const topicsText = analysisData.subjects.flatMap(s =>
            s.topics.map(t => `${s.name}: ${t}`)
        ).join('\n');

        const prompt = `Create ${maxCards} educational flashcards for these topics:

${topicsText}

Generate a JSON response with this exact structure:
{
    "total": ${maxCards},
    "by_subject": [
        {"name": "Subject Name", "count": 5}
    ],
    "cards": [
        {
            "id": "card-1",
            "subject": "Subject Name",
            "topic": "Specific Topic",
            "question": "Clear, specific question",
            "answer": "Detailed, educational answer",
            "difficulty": "Easy/Medium/Hard",
            "tags": ["tag1", "tag2"]
        }
    ]
}

Make questions specific and educational. Answers should be comprehensive but concise. Return ONLY valid JSON.`;

        try {
            const response = await this.callGeminiAPI(prompt);

            try {
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
                throw new Error('No JSON found in response');
            } catch (parseError) {
                // Fallback structure
                return {
                    total: maxCards,
                    by_subject: analysisData.subjects.map(s => ({ name: s.name, count: 5 })),
                    cards: this.generateFallbackFlashcards(analysisData, maxCards)
                };
            }
        } catch (error) {
            console.error('Flashcard generation error:', error);
            throw error;
        }
    }

    // Generate quizzes from analysis
    async generateQuizzes(analysisData, numQuizzes = 3) {
        if (!this.apiKey) {
            throw new Error('Gemini API key not configured');
        }

        const subjectsText = analysisData.subjects.map(s =>
            `${s.name}: ${s.topics.join(', ')}`
        ).join('\n');

        const prompt = `Create ${numQuizzes} educational quizzes for these subjects:

${subjectsText}

Generate a JSON response with this exact structure:
{
    "total": ${numQuizzes},
    "by_difficulty": {
        "easy": 1,
        "medium": 1,
        "hard": 1
    },
    "quizzes": [
        {
            "id": "quiz-1",
            "title": "Quiz Title",
            "description": "Brief quiz description",
            "questions": 10,
            "duration": 30,
            "difficulty": "Easy/Medium/Hard",
            "topics": ["topic1", "topic2"],
            "sample_questions": [
                {
                    "question": "Sample question text",
                    "type": "multiple_choice",
                    "options": ["Option A", "Option B", "Option C", "Option D"],
                    "correct_answer": "Option A"
                }
            ]
        }
    ]
}

Create diverse quiz types covering different difficulty levels. Return ONLY valid JSON.`;

        try {
            const response = await this.callGeminiAPI(prompt);

            try {
                const jsonMatch = response.match(/\{[\s\S]*\}/);
                if (jsonMatch) {
                    return JSON.parse(jsonMatch[0]);
                }
                throw new Error('No JSON found in response');
            } catch (parseError) {
                // Fallback structure
                return {
                    total: numQuizzes,
                    by_difficulty: { easy: 1, medium: 1, hard: 1 },
                    quizzes: this.generateFallbackQuizzes(analysisData, numQuizzes)
                };
            }
        } catch (error) {
            console.error('Quiz generation error:', error);
            throw error;
        }
    }

    // Helper method for Gemini API calls
    async callGeminiAPI(prompt) {
        const requestBody = {
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: {
                temperature: 0.7,
                topK: 40,
                topP: 0.95,
                maxOutputTokens: 4000,
            }
        };

        const response = await fetch(`${GEMINI_API_URL}?key=${this.apiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(requestBody)
        });

        if (!response.ok) {
            throw new Error(`Gemini API error: ${response.status}`);
        }

        const data = await response.json();
        return data.candidates[0].content.parts[0].text;
    }

    // Fallback generators
    generateFallbackSchedule(analysisData, days, hoursPerDay) {
        const schedule = [];
        const allTopics = analysisData.subjects.flatMap(s =>
            s.topics.map(t => ({ subject: s.name, topic: t, difficulty: s.difficulty }))
        );

        for (let day = 1; day <= days; day++) {
            const topicIndex = (day - 1) % allTopics.length;
            const currentTopic = allTopics[topicIndex];

            schedule.push({
                day: day,
                subject: currentTopic.subject,
                topic: currentTopic.topic,
                duration: hoursPerDay,
                difficulty: currentTopic.difficulty,
                tasks: [
                    `📚 Study: ${currentTopic.topic} (${Math.floor(hoursPerDay * 0.6 * 60)} mins)`,
                    `📝 Practice exercises (${Math.floor(hoursPerDay * 0.3 * 60)} mins)`,
                    `🔄 Review and notes (${Math.floor(hoursPerDay * 0.1 * 60)} mins)`
                ],
                notes: `Focus on understanding ${currentTopic.topic} concepts`
            });
        }
        return schedule;
    }

    generateFallbackFlashcards(analysisData, maxCards) {
        const cards = [];
        let cardId = 1;

        analysisData.subjects.forEach(subject => {
            subject.topics.forEach(topic => {
                if (cards.length < maxCards) {
                    cards.push({
                        id: `card-${cardId++}`,
                        subject: subject.name,
                        topic: topic,
                        question: `What is ${topic}?`,
                        answer: `${topic} is a key concept in ${subject.name} that involves understanding the fundamental principles and applications.`,
                        difficulty: subject.difficulty || "Medium",
                        tags: [subject.name.toLowerCase(), topic.toLowerCase()]
                    });
                }
            });
        });

        return cards;
    }

    generateFallbackQuizzes(analysisData, numQuizzes) {
        const quizzes = [];

        analysisData.subjects.slice(0, numQuizzes).forEach((subject, index) => {
            quizzes.push({
                id: `quiz-${index + 1}`,
                title: `${subject.name} Assessment`,
                description: `Comprehensive quiz covering key concepts in ${subject.name}`,
                questions: Math.min(10, subject.topics.length * 2),
                duration: 30,
                difficulty: subject.difficulty || "Medium",
                topics: subject.topics,
                sample_questions: [{
                    question: `What are the key concepts in ${subject.name}?`,
                    type: "multiple_choice",
                    options: ["Concept A", "Concept B", "Concept C", "All of the above"],
                    correct_answer: "All of the above"
                }]
            });
        });

        return quizzes;
    }

    // Generate study materials directly (legacy method - keeping for compatibility)
    async generateStudyMaterial(topic, materialType = 'explanation') {
        if (!this.apiKey) {
            throw new Error('Gemini API key not configured');
        }

        let prompt = '';

        switch (materialType) {
            case 'flashcards':
                prompt = `Create 5 educational flashcards about "${topic}". Format each as:
Q: [Question]
A: [Answer]

Make them concise but comprehensive for effective studying.`;
                break;

            case 'quiz':
                prompt = `Create a 5-question multiple choice quiz about "${topic}". Format as:
Q1: [Question]
a) [Option A]
b) [Option B] 
c) [Option C]
d) [Option D]
Correct: [Letter]

Make questions challenging but fair.`;
                break;

            case 'summary':
                prompt = `Create a comprehensive study summary about "${topic}". Include:
- Key concepts and definitions
- Important points to remember
- Practical applications
- Study tips for mastering this topic

Keep it structured and easy to review.`;
                break;

            default:
                prompt = `Explain "${topic}" in a clear, educational way suitable for studying. Include examples and key points to remember.`;
        }

        try {
            return await this.callGeminiAPI(prompt);
        } catch (error) {
            console.error('Gemini study material generation error:', error);
            throw error;
        }
    }
}

export const geminiAPI = new GeminiAPI();