import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Upload, FileText, Brain, Target, Zap, Sparkles,
    CheckCircle, ArrowRight, Calendar, Clock, BookOpen,
    Download, Trash2, Eye, Plus, X, AlertCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { geminiAPI } from '../utils/geminiAPI';

const SyllabusHub = () => {
    const { user } = useAuth();
    const [uploadedFiles, setUploadedFiles] = useState([]);
    const [selectedFile, setSelectedFile] = useState(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [processingStep, setProcessingStep] = useState('');
    const [extractedContent, setExtractedContent] = useState(null);
    const [generatedContent, setGeneratedContent] = useState({
        studyPlan: null,
        flashcards: null,
        quizzes: null
    });
    const [activeTab, setActiveTab] = useState('upload');
    const [apiStatus, setApiStatus] = useState('checking');
    const [showApiKeyForm, setShowApiKeyForm] = useState(false);
    const [tempApiKey, setTempApiKey] = useState('');
    const [showStudyPlanModal, setShowStudyPlanModal] = useState(false);
    const [showFlashcardsModal, setShowFlashcardsModal] = useState(false);
    const [showQuizzesModal, setShowQuizzesModal] = useState(false);
    const fileInputRef = useRef(null);

    // File reading utility
    const readFileAsText = (file) => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(e);
            reader.readAsText(file);
        });
    };

    // Check API status on component mount
    React.useEffect(() => {
        const checkApiStatus = async () => {
            try {
                await geminiAPI.testConnection();
                setApiStatus('connected');
            } catch (error) {
                console.error('API connection failed:', error);
                setApiStatus('disconnected');
            }
        };
        checkApiStatus();
    }, []);

    // Configure API key
    const handleApiKeySubmit = async (e) => {
        e.preventDefault();
        if (!tempApiKey.trim()) return;

        try {
            geminiAPI.setApiKey(tempApiKey.trim());
            await geminiAPI.testConnection();
            setApiStatus('connected');
            setShowApiKeyForm(false);
            setTempApiKey('');
            alert('Gemini API configured successfully!');
        } catch (error) {
            console.error('API configuration failed:', error);
            setApiStatus('disconnected');
            alert('Failed to connect to Gemini API. Please check your API key.');
        }
    };

    // Mock syllabus content for demo
    const mockSyllabusContent = {
        title: "Computer Science Fundamentals",
        subjects: [
            {
                name: "Data Structures & Algorithms",
                topics: [
                    "Arrays and Linked Lists",
                    "Stacks and Queues",
                    "Trees and Binary Search Trees",
                    "Hash Tables",
                    "Sorting Algorithms",
                    "Graph Algorithms"
                ],
                difficulty: "Hard",
                estimatedHours: 40
            },
            {
                name: "Object-Oriented Programming",
                topics: [
                    "Classes and Objects",
                    "Inheritance and Polymorphism",
                    "Encapsulation and Abstraction",
                    "Design Patterns",
                    "Exception Handling"
                ],
                difficulty: "Medium",
                estimatedHours: 25
            },
            {
                name: "Database Systems",
                topics: [
                    "Relational Database Design",
                    "SQL Queries",
                    "Normalization",
                    "Indexing and Performance",
                    "Transactions and ACID"
                ],
                difficulty: "Medium",
                estimatedHours: 30
            }
        ],
        totalTopics: 16,
        estimatedStudyTime: "95 hours",
        difficulty: "Medium-Hard"
    };

    const handleFileUpload = (event) => {
        const files = Array.from(event.target.files);
        const newFiles = files.map(file => ({
            id: Date.now() + Math.random(),
            name: file.name,
            size: file.size,
            type: file.type,
            uploadDate: new Date(),
            status: 'uploaded',
            file: file
        }));
        setUploadedFiles(prev => [...prev, ...newFiles]);
    };

    const processFile = async (file) => {
        setSelectedFile(file);
        setIsProcessing(true);
        setActiveTab('processing');

        try {
            // Step 1: Extract content from file
            setProcessingStep('Extracting content from syllabus...');
            const fileContent = await readFileAsText(file.file);
            console.log('File content length:', fileContent?.length);
            console.log('File content preview:', fileContent?.substring(0, 300));

            if (!fileContent || fileContent.trim().length < 10) {
                throw new Error('File appears to be empty or unreadable');
            }

            // Step 2: Analyze syllabus with Gemini AI
            setProcessingStep('Analyzing syllabus structure with AI...');
            const analysisResult = await geminiAPI.analyzeSyllabus(fileContent, file.name);

            setExtractedContent(analysisResult);

            // Step 3: Generate study materials using Gemini AI
            setProcessingStep('Generating personalized study plan...');
            const studyPlan = await geminiAPI.generateStudyPlan(analysisResult, 30, 3);
            setGeneratedContent(prev => ({ ...prev, studyPlan }));

            setProcessingStep('Creating intelligent flashcards...');
            const flashcards = await geminiAPI.generateFlashcards(analysisResult, 20);
            setGeneratedContent(prev => ({ ...prev, flashcards }));

            setProcessingStep('Building adaptive quizzes...');
            const quizzes = await geminiAPI.generateQuizzes(analysisResult, 3);
            setGeneratedContent(prev => ({ ...prev, quizzes }));

            // Update file status
            setUploadedFiles(prev =>
                prev.map(f =>
                    f.id === file.id ? { ...f, status: 'processed', processedDate: new Date() } : f
                )
            );

            setActiveTab('results');
        } catch (error) {
            console.error('Processing error:', error);
            setApiStatus('disconnected');

            // Fallback to mock data if API fails
            setProcessingStep('AI analysis failed - Using demo data...');
            await new Promise(resolve => setTimeout(resolve, 1000));

            // Create better mock data based on file name
            const fileName = file.name || 'Unknown';
            const mockData = {
                analysis_id: `demo-${Date.now()}`,
                title: fileName.replace(/\.(pdf|txt|doc|docx)$/i, ''),
                subjects: [
                    {
                        name: "Computer Science Fundamentals",
                        topics: [
                            "Programming Basics",
                            "Data Structures",
                            "Algorithms",
                            "Object-Oriented Programming",
                            "Database Systems"
                        ],
                        difficulty: "Medium",
                        estimatedHours: 40
                    },
                    {
                        name: "Web Development",
                        topics: [
                            "HTML & CSS",
                            "JavaScript",
                            "React Framework",
                            "Backend Development",
                            "API Integration"
                        ],
                        difficulty: "Medium",
                        estimatedHours: 35
                    }
                ],
                totalTopics: 10,
                estimatedStudyTime: "75 hours",
                difficulty: "Medium",
                recommendations: [
                    "Start with programming fundamentals",
                    "Practice coding regularly",
                    "Build projects to apply concepts"
                ],
                isDemo: true,
                error: `AI analysis failed: ${error.message}. Showing demo content instead.`
            };

            setExtractedContent(mockData);

            const studyPlan = generateMockStudyPlan(mockSyllabusContent);
            setGeneratedContent(prev => ({ ...prev, studyPlan: { ...studyPlan, isDemo: true } }));

            const flashcards = generateMockFlashcards(mockSyllabusContent);
            setGeneratedContent(prev => ({ ...prev, flashcards: { ...flashcards, isDemo: true } }));

            const quizzes = generateMockQuizzes(mockSyllabusContent);
            setGeneratedContent(prev => ({ ...prev, quizzes: { ...quizzes, isDemo: true } }));

            setUploadedFiles(prev =>
                prev.map(f =>
                    f.id === file.id ? { ...f, status: 'processed', processedDate: new Date() } : f
                )
            );

            setActiveTab('results');
        } finally {
            setIsProcessing(false);
            setProcessingStep('');
        }
    };

    const generateMockStudyPlan = (content) => {
        const plan = [];
        let currentDay = 1;

        content.subjects.forEach(subject => {
            subject.topics.forEach(topic => {
                plan.push({
                    day: currentDay,
                    subject: subject.name,
                    topic: topic,
                    duration: Math.ceil(subject.estimatedHours / subject.topics.length),
                    difficulty: subject.difficulty,
                    tasks: [
                        "Read and understand key concepts",
                        "Practice example problems",
                        "Create summary notes",
                        "Take practice quiz"
                    ]
                });
                currentDay++;
            });
        });

        return {
            totalDays: plan.length,
            dailyAverage: Math.round(content.subjects.reduce((acc, s) => acc + s.estimatedHours, 0) / plan.length),
            schedule: plan.slice(0, 14) // Show first 14 days
        };
    };

    const generateMockFlashcards = (content) => {
        const flashcards = [];
        content.subjects.forEach(subject => {
            subject.topics.forEach(topic => {
                flashcards.push({
                    id: Math.random(),
                    subject: subject.name,
                    topic: topic,
                    question: `What is ${topic}?`,
                    answer: `${topic} is a fundamental concept in ${subject.name} that involves...`,
                    difficulty: subject.difficulty,
                    tags: [subject.name.toLowerCase().replace(/\s+/g, '-')]
                });
            });
        });
        return {
            total: flashcards.length,
            bySubject: content.subjects.map(s => ({
                name: s.name,
                count: s.topics.length
            })),
            cards: flashcards.slice(0, 8) // Show first 8 cards
        };
    };

    const generateMockQuizzes = (content) => {
        return {
            total: content.subjects.length * 2, // 2 quizzes per subject
            byDifficulty: {
                easy: 2,
                medium: 3,
                hard: 1
            },
            quizzes: content.subjects.map(subject => ({
                id: Math.random(),
                title: `${subject.name} Assessment`,
                questions: subject.topics.length * 2,
                duration: 30,
                difficulty: subject.difficulty,
                topics: subject.topics
            }))
        };
    };

    const removeFile = (fileId) => {
        setUploadedFiles(prev => prev.filter(f => f.id !== fileId));
    };

    const formatFileSize = (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    return (
        <div className="max-w-6xl mx-auto p-6">
            {/* Header */}
            <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full mb-4">
                    <Sparkles className="w-8 h-8 text-white" />
                </div>
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
                    AI Syllabus Hub
                </h1>
                <p className="text-gray-600 max-w-2xl mx-auto mb-4">
                    Upload your syllabus and let AI create personalized study plans, flashcards, and quizzes automatically.
                    One upload, complete study ecosystem! ✨
                </p>

                {/* API Status Indicator */}
                <div className="flex items-center justify-center gap-4 mb-4">
                    <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${apiStatus === 'connected' ? 'bg-green-500' :
                            apiStatus === 'disconnected' ? 'bg-red-500' : 'bg-yellow-500'
                            }`} />
                        <span className={`text-sm font-medium ${apiStatus === 'connected' ? 'text-green-600' :
                            apiStatus === 'disconnected' ? 'text-red-600' : 'text-yellow-600'
                            }`}>
                            {apiStatus === 'connected' ? 'AI Connected' :
                                apiStatus === 'disconnected' ? 'AI Disconnected' : 'Checking AI Connection...'}
                        </span>
                    </div>

                    {apiStatus === 'disconnected' && (
                        <button
                            onClick={() => setActiveTab('settings')}
                            className="text-sm bg-purple-600 text-white px-4 py-1 rounded-full hover:bg-purple-700 transition-colors"
                        >
                            Configure AI
                        </button>
                    )}
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex justify-center mb-8">
                <div className="bg-gray-100 rounded-xl p-1 flex space-x-1">
                    {[
                        { id: 'upload', label: 'Upload', icon: Upload },
                        { id: 'processing', label: 'Processing', icon: Brain },
                        { id: 'results', label: 'Results', icon: Target },
                        { id: 'settings', label: 'Settings', icon: AlertCircle }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${activeTab === tab.id
                                ? 'bg-white text-purple-600 shadow-sm'
                                : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            <tab.icon className="w-4 h-4" />
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <AnimatePresence mode="wait">
                {/* Upload Tab */}
                {activeTab === 'upload' && (
                    <motion.div
                        key="upload"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-6"
                    >
                        {/* Upload Area */}
                        <div
                            className="border-2 border-dashed border-purple-300 rounded-2xl p-12 text-center bg-purple-50 hover:bg-purple-100 transition-colors cursor-pointer"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="w-12 h-12 text-purple-600 mx-auto mb-4" />
                            <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Your Syllabus</h3>
                            <p className="text-gray-600 mb-4">
                                Drag and drop your syllabus file here, or click to browse
                            </p>
                            <p className="text-sm text-gray-500">
                                Supports PDF, DOC, DOCX, TXT files up to 10MB
                            </p>
                            <input
                                ref={fileInputRef}
                                type="file"
                                multiple
                                accept=".pdf,.doc,.docx,.txt"
                                onChange={handleFileUpload}
                                className="hidden"
                            />
                        </div>

                        {/* Uploaded Files */}
                        {uploadedFiles.length > 0 && (
                            <div className="bg-white rounded-xl border border-gray-200 p-6">
                                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-purple-600" />
                                    Uploaded Files ({uploadedFiles.length})
                                </h3>
                                <div className="space-y-3">
                                    {uploadedFiles.map(file => (
                                        <div key={file.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                                    <FileText className="w-5 h-5 text-purple-600" />
                                                </div>
                                                <div>
                                                    <p className="font-medium text-gray-900">{file.name}</p>
                                                    <p className="text-sm text-gray-500">
                                                        {formatFileSize(file.size)} • {file.uploadDate.toLocaleDateString()}
                                                    </p>
                                                </div>
                                                {file.status === 'processed' && (
                                                    <div className="flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                                                        <CheckCircle className="w-3 h-3" />
                                                        Processed
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {file.status === 'uploaded' && (
                                                    <button
                                                        onClick={() => processFile(file)}
                                                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
                                                    >
                                                        <Brain className="w-4 h-4" />
                                                        Process with AI
                                                    </button>
                                                )}
                                                <button
                                                    onClick={() => removeFile(file.id)}
                                                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </motion.div>
                )}

                {/* Processing Tab */}
                {activeTab === 'processing' && (
                    <motion.div
                        key="processing"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="text-center space-y-8"
                    >
                        <div className="bg-white rounded-2xl border border-gray-200 p-12">
                            <div className="w-16 h-16 bg-gradient-to-r from-purple-600 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 animate-pulse">
                                <Brain className="w-8 h-8 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold text-gray-900 mb-4">AI is Working Its Magic! ✨</h3>
                            <p className="text-gray-600 mb-8 max-w-md mx-auto">
                                Our AI is analyzing your syllabus and creating personalized study materials just for you.
                            </p>

                            {isProcessing && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-center gap-3 text-purple-600">
                                        <div className="flex space-x-1">
                                            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce"></div>
                                            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                            <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                        </div>
                                        <span className="font-medium">{processingStep}</span>
                                    </div>

                                    {/* Progress Steps */}
                                    <div className="max-w-md mx-auto">
                                        <div className="space-y-4">
                                            {[
                                                'Extracting content from syllabus...',
                                                'Analyzing syllabus structure with AI...',
                                                'Generating personalized study plan...',
                                                'Creating intelligent flashcards...',
                                                'Building adaptive quizzes...'
                                            ].map((step, index) => (
                                                <div key={index} className="flex items-center gap-3">
                                                    <div className={`w-6 h-6 rounded-full flex items-center justify-center ${processingStep === step
                                                        ? 'bg-purple-600 text-white'
                                                        : processingStep && index < ['Extracting content from syllabus...', 'Analyzing syllabus structure with AI...', 'Generating personalized study plan...', 'Creating intelligent flashcards...', 'Building adaptive quizzes...'].indexOf(processingStep)
                                                            ? 'bg-green-500 text-white'
                                                            : 'bg-gray-200 text-gray-500'
                                                        }`}>
                                                        {processingStep && index < ['Extracting content from syllabus...', 'Analyzing syllabus structure with AI...', 'Generating personalized study plan...', 'Creating intelligent flashcards...', 'Building adaptive quizzes...'].indexOf(processingStep) ? (
                                                            <CheckCircle className="w-4 h-4" />
                                                        ) : (
                                                            <span className="text-xs font-bold">{index + 1}</span>
                                                        )}
                                                    </div>
                                                    <span className={`text-sm ${processingStep === step ? 'text-purple-600 font-medium' : 'text-gray-600'
                                                        }`}>
                                                        {step}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )}

                {/* Results Tab */}
                {activeTab === 'results' && extractedContent && (
                    <motion.div
                        key="results"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className="space-y-8"
                    >
                        {/* Syllabus Overview */}
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-xl font-bold flex items-center gap-2">
                                    <FileText className="w-5 h-5 text-purple-600" />
                                    Syllabus Analysis
                                </h3>
                                {extractedContent.isDemo && (
                                    <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 text-yellow-700 rounded-full text-sm">
                                        <AlertCircle className="w-4 h-4" />
                                        Demo Data
                                    </div>
                                )}
                            </div>

                            {extractedContent.error && (
                                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                                    <div className="flex items-center gap-2 text-red-600 text-sm">
                                        <AlertCircle className="w-4 h-4" />
                                        {extractedContent.error}
                                    </div>
                                </div>
                            )}
                            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                <div className="bg-purple-50 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-purple-600">{extractedContent.subjects.length}</div>
                                    <div className="text-sm text-gray-600">Subjects</div>
                                </div>
                                <div className="bg-blue-50 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-blue-600">{extractedContent.totalTopics}</div>
                                    <div className="text-sm text-gray-600">Topics</div>
                                </div>
                                <div className="bg-green-50 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-green-600">{extractedContent.estimatedStudyTime}</div>
                                    <div className="text-sm text-gray-600">Est. Study Time</div>
                                </div>
                                <div className="bg-orange-50 rounded-lg p-4 text-center">
                                    <div className="text-2xl font-bold text-orange-600">{extractedContent.difficulty}</div>
                                    <div className="text-sm text-gray-600">Difficulty</div>
                                </div>
                            </div>
                        </div>

                        {/* Generated Content Cards */}
                        <div className="grid md:grid-cols-3 gap-6">
                            {/* Study Plan Card */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                                            <Target className="w-5 h-5 text-blue-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900">Study Plan</h4>
                                            <p className="text-sm text-gray-500">AI-generated schedule</p>
                                        </div>
                                    </div>
                                    {generatedContent.studyPlan?.isDemo && (
                                        <div className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                                            Demo
                                        </div>
                                    )}
                                </div>
                                {generatedContent.studyPlan && (
                                    <div className="space-y-3 mb-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Total Days:</span>
                                            <span className="font-medium">
                                                {generatedContent.studyPlan.totalDays || generatedContent.studyPlan.total_days}
                                            </span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Daily Average:</span>
                                            <span className="font-medium">
                                                {generatedContent.studyPlan.dailyAverage || generatedContent.studyPlan.daily_average}h
                                            </span>
                                        </div>
                                    </div>
                                )}
                                <button
                                    onClick={() => setShowStudyPlanModal(true)}
                                    className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Eye className="w-4 h-4" />
                                    View Plan
                                </button>
                            </div>

                            {/* Flashcards Card */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                                            <Brain className="w-5 h-5 text-purple-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900">Flashcards</h4>
                                            <p className="text-sm text-gray-500">Smart memory cards</p>
                                        </div>
                                    </div>
                                    {generatedContent.flashcards?.isDemo && (
                                        <div className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                                            Demo
                                        </div>
                                    )}
                                </div>
                                {generatedContent.flashcards && (
                                    <div className="space-y-3 mb-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Total Cards:</span>
                                            <span className="font-medium">{generatedContent.flashcards.total}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Subjects:</span>
                                            <span className="font-medium">
                                                {(generatedContent.flashcards.bySubject || generatedContent.flashcards.by_subject || []).length}
                                            </span>
                                        </div>
                                    </div>
                                )}
                                <button
                                    onClick={() => setShowFlashcardsModal(true)}
                                    className="w-full px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Eye className="w-4 h-4" />
                                    View Cards
                                </button>
                            </div>

                            {/* Quizzes Card */}
                            <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center">
                                            <Zap className="w-5 h-5 text-orange-600" />
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-gray-900">Quizzes</h4>
                                            <p className="text-sm text-gray-500">Adaptive assessments</p>
                                        </div>
                                    </div>
                                    {generatedContent.quizzes?.isDemo && (
                                        <div className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full">
                                            Demo
                                        </div>
                                    )}
                                </div>
                                {generatedContent.quizzes && (
                                    <div className="space-y-3 mb-4">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Total Quizzes:</span>
                                            <span className="font-medium">{generatedContent.quizzes.total}</span>
                                        </div>
                                        <div className="flex justify-between text-sm">
                                            <span className="text-gray-600">Avg. Duration:</span>
                                            <span className="font-medium">30 min</span>
                                        </div>
                                    </div>
                                )}
                                <button
                                    onClick={() => setShowQuizzesModal(true)}
                                    className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Eye className="w-4 h-4" />
                                    Take Quiz
                                </button>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl p-6 text-white">
                            <h3 className="text-xl font-bold mb-4">🎉 Your Study Materials Are Ready!</h3>
                            <p className="mb-6 text-purple-100">
                                AI has analyzed your syllabus and created a complete study ecosystem. Start learning smarter today!
                            </p>
                            <div className="flex flex-wrap gap-3">
                                <button className="px-6 py-2 bg-white text-purple-600 rounded-lg hover:bg-gray-100 transition-colors font-medium">
                                    Start Study Plan
                                </button>
                                <button className="px-6 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors">
                                    Practice Flashcards
                                </button>
                                <button className="px-6 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors">
                                    Take Practice Quiz
                                </button>
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Study Plan Modal */}
            {showStudyPlanModal && generatedContent.studyPlan && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                    >
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <Target className="w-6 h-6 text-blue-600" />
                                Your Personalized Study Plan
                            </h3>
                            <button
                                onClick={() => setShowStudyPlanModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                            {generatedContent.studyPlan.isDemo && (
                                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <div className="flex items-center gap-2 text-yellow-700 text-sm">
                                        <AlertCircle className="w-4 h-4" />
                                        This is demo data. Configure Gemini API for personalized plans.
                                    </div>
                                </div>
                            )}

                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                                <div className="bg-blue-50 rounded-lg p-4">
                                    <div className="text-2xl font-bold text-blue-600">
                                        {generatedContent.studyPlan.totalDays || generatedContent.studyPlan.total_days} Days
                                    </div>
                                    <div className="text-sm text-gray-600">Total Study Duration</div>
                                </div>
                                <div className="bg-green-50 rounded-lg p-4">
                                    <div className="text-2xl font-bold text-green-600">
                                        {generatedContent.studyPlan.dailyAverage || generatedContent.studyPlan.daily_average}h
                                    </div>
                                    <div className="text-sm text-gray-600">Daily Study Time</div>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <h4 className="text-lg font-semibold text-gray-900">Daily Schedule</h4>
                                {(generatedContent.studyPlan.schedule || []).map((day, index) => (
                                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                                        <div className="flex items-start justify-between mb-3">
                                            <div>
                                                <div className="font-semibold text-gray-900">Day {day.day}</div>
                                                <div className="text-sm text-gray-600">{day.subject}</div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${day.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                                                        day.difficulty === 'Hard' ? 'bg-red-100 text-red-700' :
                                                            'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {day.difficulty}
                                                </span>
                                                <span className="text-sm text-gray-500">{day.duration}h</span>
                                            </div>
                                        </div>

                                        <div className="mb-3">
                                            <div className="font-medium text-gray-900 mb-1">📚 {day.topic}</div>
                                            {day.notes && <div className="text-sm text-gray-600">{day.notes}</div>}
                                        </div>

                                        {day.tasks && day.tasks.length > 0 && (
                                            <div>
                                                <div className="text-sm font-medium text-gray-700 mb-2">Tasks:</div>
                                                <ul className="space-y-1">
                                                    {day.tasks.map((task, taskIndex) => (
                                                        <li key={taskIndex} className="text-sm text-gray-600 flex items-start gap-2">
                                                            <span className="text-blue-500 mt-1">•</span>
                                                            {task}
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Flashcards Modal */}
            {showFlashcardsModal && generatedContent.flashcards && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                    >
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <Brain className="w-6 h-6 text-purple-600" />
                                Study Flashcards ({generatedContent.flashcards.total} cards)
                            </h3>
                            <button
                                onClick={() => setShowFlashcardsModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                            {generatedContent.flashcards.isDemo && (
                                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <div className="flex items-center gap-2 text-yellow-700 text-sm">
                                        <AlertCircle className="w-4 h-4" />
                                        This is demo data. Configure Gemini API for personalized flashcards.
                                    </div>
                                </div>
                            )}

                            <div className="grid md:grid-cols-2 gap-4">
                                {(generatedContent.flashcards.cards || []).map((card, index) => (
                                    <div key={card.id || index} className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow">
                                        <div className="flex items-center justify-between mb-3">
                                            <span className="text-sm font-medium text-purple-600">{card.subject}</span>
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${card.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                                                    card.difficulty === 'Hard' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {card.difficulty}
                                            </span>
                                        </div>

                                        <div className="mb-3">
                                            <div className="font-semibold text-gray-900 mb-2">Q: {card.question}</div>
                                            <div className="text-gray-700">A: {card.answer}</div>
                                        </div>

                                        {card.tags && card.tags.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {card.tags.map((tag, tagIndex) => (
                                                    <span key={tagIndex} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* Quizzes Modal */}
            {showQuizzesModal && generatedContent.quizzes && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-hidden"
                    >
                        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
                            <h3 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <Zap className="w-6 h-6 text-orange-600" />
                                Available Quizzes ({generatedContent.quizzes.total} quizzes)
                            </h3>
                            <button
                                onClick={() => setShowQuizzesModal(false)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>

                        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
                            {generatedContent.quizzes.isDemo && (
                                <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                    <div className="flex items-center gap-2 text-yellow-700 text-sm">
                                        <AlertCircle className="w-4 h-4" />
                                        This is demo data. Configure Gemini API for personalized quizzes.
                                    </div>
                                </div>
                            )}

                            <div className="space-y-4">
                                {(generatedContent.quizzes.quizzes || []).map((quiz, index) => (
                                    <div key={quiz.id || index} className="border border-gray-200 rounded-lg p-6 hover:shadow-sm transition-shadow">
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <h4 className="text-lg font-semibold text-gray-900">{quiz.title}</h4>
                                                <p className="text-gray-600 mt-1">{quiz.description}</p>
                                            </div>
                                            <span className={`px-3 py-1 rounded-full text-sm font-medium ${quiz.difficulty === 'Easy' ? 'bg-green-100 text-green-700' :
                                                    quiz.difficulty === 'Hard' ? 'bg-red-100 text-red-700' :
                                                        'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                {quiz.difficulty}
                                            </span>
                                        </div>

                                        <div className="grid md:grid-cols-3 gap-4 mb-4">
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-blue-600">{quiz.questions}</div>
                                                <div className="text-sm text-gray-600">Questions</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-green-600">{quiz.duration}</div>
                                                <div className="text-sm text-gray-600">Minutes</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-2xl font-bold text-purple-600">{quiz.topics?.length || 0}</div>
                                                <div className="text-sm text-gray-600">Topics</div>
                                            </div>
                                        </div>

                                        {quiz.topics && quiz.topics.length > 0 && (
                                            <div className="mb-4">
                                                <div className="text-sm font-medium text-gray-700 mb-2">Topics Covered:</div>
                                                <div className="flex flex-wrap gap-2">
                                                    {quiz.topics.map((topic, topicIndex) => (
                                                        <span key={topicIndex} className="px-2 py-1 bg-blue-100 text-blue-700 text-sm rounded-full">
                                                            {topic}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {quiz.sample_questions && quiz.sample_questions.length > 0 && (
                                            <div className="mb-4">
                                                <div className="text-sm font-medium text-gray-700 mb-2">Sample Question:</div>
                                                <div className="bg-gray-50 rounded-lg p-3">
                                                    <div className="font-medium text-gray-900 mb-2">{quiz.sample_questions[0].question}</div>
                                                    {quiz.sample_questions[0].options && (
                                                        <div className="space-y-1">
                                                            {quiz.sample_questions[0].options.map((option, optIndex) => (
                                                                <div key={optIndex} className={`text-sm p-2 rounded ${option === quiz.sample_questions[0].correct_answer
                                                                        ? 'bg-green-100 text-green-700 font-medium'
                                                                        : 'text-gray-600'
                                                                    }`}>
                                                                    {String.fromCharCode(97 + optIndex)}) {option}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        )}

                                        <button className="w-full px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors font-medium">
                                            Start Quiz
                                        </button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default SyllabusHub;