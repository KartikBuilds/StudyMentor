
import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FeatureCard } from './ui/feature-card';
import { Sparkles, Brain, Target, Zap, FileText, ArrowRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';


const features = [
    {
        name: 'AI Syllabus Hub',
        path: '/syllabus-hub',
        description: 'Upload syllabus → Get study plans, flashcards & quizzes automatically! ✨',
        icon: Sparkles,
        color: 'from-purple-500 to-pink-500',
        featured: true
    },
    {
        name: 'AI Study Buddy',
        path: '/ai-buddy',
        description: 'Chat with AI for study help and concept explanations',
        icon: Brain,
        color: 'from-indigo-500 to-purple-500',
    },
    {
        name: 'Smart Flashcards',
        path: '/flashcards',
        description: 'AI-generated flashcards from your study materials',
        icon: Brain,
        color: 'from-cyan-500 to-blue-500',
    },
    {
        name: 'Personalized Study Plans',
        path: '/study-plan',
        description: 'AI creates custom study schedules based on your goals',
        icon: Target,
        color: 'from-blue-500 to-indigo-500',
    },
    {
        name: 'Adaptive Quizzes',
        path: '/quiz',
        description: 'Smart quizzes that adapt to your learning progress',
        icon: Zap,
        color: 'from-orange-500 to-red-500',
    },
];

const HomePage = () => {
    const { isAuthenticated, user } = useAuth();
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMode, setAuthMode] = useState('register');

    const handleAuthClick = (mode) => {
        setAuthMode(mode);
        setShowAuthModal(true);
    };

    return (
        <div className="w-full flex flex-col items-center justify-center px-2 py-8">
            {/* Hero Section */}
            <section className="w-full max-w-5xl mx-auto flex flex-col items-center text-center mb-12 animate-fade-in">
                <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl mb-6 shadow-lg animate-bounce-slow">
                    <Sparkles className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-4 drop-shadow-lg">
                    StudyMentor
                </h1>

                {/* Demo Mode Banner */}
                <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 max-w-2xl">
                    <div className="flex items-center justify-center gap-2 text-orange-700 font-medium mb-2">
                        <Sparkles className="w-5 h-5" />
                        Demo Mode Active
                    </div>
                    <p className="text-orange-600 text-sm text-center">
                        You're logged in as a demo user! Explore all features without needing to sign up.
                        All data is simulated for demonstration purposes.
                    </p>
                </div>

                <p className="text-lg md:text-xl text-gray-700 dark:text-gray-200 max-w-2xl mb-6">
                    Your all-in-one AI-powered study companion. Upload your syllabus, generate a personalized plan, create flashcards, and test yourself with quizzes—all in one beautiful, seamless experience.
                </p>
                <div className="flex flex-wrap gap-4 justify-center">
                    {isAuthenticated ? (
                        <div className="flex flex-col items-center gap-4">
                            <p className="text-gray-600 dark:text-gray-300">
                                Welcome back, <span className="font-semibold text-blue-600">{user?.full_name?.split(' ')[0]}</span>! 👋
                            </p>
                            <div className="flex gap-3">
                                <Link to="/syllabus-hub" className="px-6 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white font-semibold shadow-lg hover:scale-105 transition-transform duration-200 flex items-center gap-2">
                                    ✨ Upload Syllabus
                                    <ArrowRight className="w-4 h-4" />
                                </Link>
                                <Link to="/dashboard" className="px-6 py-3 rounded-xl bg-white text-blue-600 border-2 border-blue-200 font-semibold shadow-lg hover:scale-105 transition-transform duration-200">
                                    View Dashboard
                                </Link>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-wrap gap-4 justify-center">
                                <button
                                    onClick={() => handleAuthClick('register')}
                                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold shadow-lg hover:scale-105 transition-transform duration-200 flex items-center gap-2"
                                >
                                    Get Started Free
                                    <ArrowRight className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => handleAuthClick('login')}
                                    className="px-8 py-3 rounded-xl bg-white text-blue-600 border-2 border-blue-200 font-semibold shadow-lg hover:scale-105 transition-transform duration-200"
                                >
                                    Sign In
                                </button>
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                ✨ Free forever • No credit card required • Start learning in seconds
                            </p>
                        </div>
                    )}
                </div>
            </section>

            {/* Features Section */}
            <section className="w-full max-w-5xl mx-auto">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, idx) => (
                        isAuthenticated ? (
                            <Link to={feature.path} key={feature.name} className="group">
                                <FeatureCard
                                    title={feature.name}
                                    description={feature.description}
                                    icon={feature.icon}
                                    className={`bg-gradient-to-br ${feature.color} text-white shadow-xl group-hover:scale-105 transition-transform duration-300 animate-fade-in-up`}
                                />
                            </Link>
                        ) : (
                            <button
                                key={feature.name}
                                onClick={() => handleAuthClick('register')}
                                className="group"
                            >
                                <FeatureCard
                                    title={feature.name}
                                    description={feature.description}
                                    icon={feature.icon}
                                    className={`bg-gradient-to-br ${feature.color} text-white shadow-xl group-hover:scale-105 transition-transform duration-300 animate-fade-in-up cursor-pointer`}
                                />
                            </button>
                        )
                    ))}
                </div>
            </section>

            {/* Auth Modal */}
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                initialMode={authMode}
            />
        </div>
    );
};

export default HomePage;
