import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Navigate, useLocation } from 'react-router-dom';
import { Brain, Sparkles, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';

const LoginPage = () => {
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMode, setAuthMode] = useState('login');
    const { isAuthenticated } = useAuth();
    const location = useLocation();

    // Redirect if already authenticated
    if (isAuthenticated) {
        const from = location.state?.from?.pathname || '/dashboard';
        return <Navigate to={from} replace />;
    }

    const handleAuthClick = (mode) => {
        setAuthMode(mode);
        setShowAuthModal(true);
    };

    return (
        <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 flex items-center justify-center p-4">
            <div className="max-w-4xl mx-auto">
                <div className="grid lg:grid-cols-2 gap-8 items-center">
                    {/* Left side - Hero content */}
                    <motion.div
                        initial={{ opacity: 0, x: -50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6 }}
                        className="text-center lg:text-left"
                    >
                        <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-6 mx-auto lg:mx-0 shadow-lg">
                            <Brain className="w-10 h-10 text-white" />
                        </div>

                        <h1 className="text-5xl lg:text-6xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4">
                            StudyMentor AI
                        </h1>

                        <p className="text-xl text-gray-600 mb-6 leading-relaxed">
                            Your intelligent learning companion powered by AI. Create personalized study plans,
                            take interactive quizzes, and achieve your academic goals faster than ever.
                        </p>

                        <div className="space-y-4 mb-8">
                            <div className="flex items-center gap-3 text-gray-700">
                                <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-green-600" />
                                </div>
                                <span>AI-powered study plan generation</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-700">
                                <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-blue-600" />
                                </div>
                                <span>Interactive quizzes and flashcards</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-700">
                                <div className="w-6 h-6 bg-purple-100 rounded-full flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-purple-600" />
                                </div>
                                <span>Google Calendar integration</span>
                            </div>
                            <div className="flex items-center gap-3 text-gray-700">
                                <div className="w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                                    <Sparkles className="w-4 h-4 text-orange-600" />
                                </div>
                                <span>Progress tracking and analytics</span>
                            </div>
                        </div>

                        <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
                            <motion.button
                                onClick={() => handleAuthClick('register')}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold shadow-xl hover:shadow-2xl transition-all duration-200"
                            >
                                Get Started Free
                                <ArrowRight className="w-5 h-5" />
                            </motion.button>

                            <motion.button
                                onClick={() => handleAuthClick('login')}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className="flex items-center justify-center gap-2 px-8 py-4 bg-white text-gray-700 rounded-xl font-semibold shadow-lg hover:shadow-xl border border-gray-200 transition-all duration-200"
                            >
                                Sign In
                            </motion.button>
                        </div>
                    </motion.div>

                    {/* Right side - Visual/Demo */}
                    <motion.div
                        initial={{ opacity: 0, x: 50 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                        className="relative"
                    >
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/50 p-8 relative overflow-hidden">
                            {/* Decorative elements */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-400/20 to-purple-400/20 rounded-full blur-2xl"></div>
                            <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-tr from-indigo-400/20 to-cyan-400/20 rounded-full blur-2xl"></div>

                            <div className="relative z-10">
                                <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
                                    🚀 Ready to Start Learning?
                                </h3>

                                <div className="space-y-4">
                                    <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-100">
                                        <h4 className="font-semibold text-gray-800 mb-2">📚 Smart Study Plans</h4>
                                        <p className="text-gray-600 text-sm">
                                            AI analyzes your syllabus and creates optimized daily study schedules
                                        </p>
                                    </div>

                                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                                        <h4 className="font-semibold text-gray-800 mb-2">🧠 Adaptive Quizzes</h4>
                                        <p className="text-gray-600 text-sm">
                                            Dynamic questions that adapt to your learning progress and knowledge gaps
                                        </p>
                                    </div>

                                    <div className="p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg border border-purple-100">
                                        <h4 className="font-semibold text-gray-800 mb-2">📅 Calendar Sync</h4>
                                        <p className="text-gray-600 text-sm">
                                            Seamlessly integrate study sessions with your Google Calendar
                                        </p>
                                    </div>
                                </div>

                                <div className="mt-6 p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-100 text-center">
                                    <p className="text-sm font-medium text-gray-800">
                                        ✨ Join thousands of students already using StudyMentor AI
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>

            {/* Auth Modal */}
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                initialMode={authMode}
            />
        </div>
    );
};

export default LoginPage;