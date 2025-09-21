import React from 'react';
import { Heart, BookOpen, Github, Twitter, Linkedin, Mail, Sparkles } from 'lucide-react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    const socialLinks = [
        { icon: Github, href: '#', label: 'GitHub' },
        { icon: Twitter, href: '#', label: 'Twitter' },
        { icon: Linkedin, href: '#', label: 'LinkedIn' },
        { icon: Mail, href: 'mailto:support@studymentor.com', label: 'Email' },
    ];

    const quickLinks = [
        { name: 'Home', href: '/' },
        { name: 'Flashcards', href: '/flashcards' },
        { name: 'Study Plan', href: '/study-plan' },
        { name: 'Quiz', href: '/quiz' },
        { name: 'Syllabus PDF', href: '/syllabus-pdf' },
    ];

    const resources = [
        { name: 'API Documentation', href: '/docs' },
        { name: 'Help Center', href: '#' },
        { name: 'Privacy Policy', href: '#' },
        { name: 'Terms of Service', href: '#' },
    ];

    return (
        <footer className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-t border-gray-200/50 dark:border-gray-700/50 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {/* Brand Section */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                                <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <div>
                                <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                    StudyMentor
                                </span>
                                <div className="text-xs text-gray-500 dark:text-gray-400 -mt-1">
                                    AI-Powered Learning
                                </div>
                            </div>
                        </div>
                        <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md">
                            Transform your learning experience with AI-powered study tools. Generate personalized flashcards,
                            create custom study plans, and test your knowledge with intelligent quizzes.
                        </p>
                        <div className="flex items-center gap-4">
                            {socialLinks.map((link) => {
                                const IconComponent = link.icon;
                                return (
                                    <a
                                        key={link.label}
                                        href={link.href}
                                        aria-label={link.label}
                                        className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-all duration-200 group hover:scale-110"
                                    >
                                        <IconComponent className="w-5 h-5 text-gray-600 dark:text-gray-400 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors" />
                                    </a>
                                );
                            })}
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                            Quick Links
                        </h3>
                        <ul className="space-y-3">
                            {quickLinks.map((link) => (
                                <li key={link.name}>
                                    <a
                                        href={link.href}
                                        className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 flex items-center gap-2 group"
                                    >
                                        <div className="w-1 h-1 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        {link.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Resources */}
                    <div>
                        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                            Resources
                        </h3>
                        <ul className="space-y-3">
                            {resources.map((link) => (
                                <li key={link.name}>
                                    <a
                                        href={link.href}
                                        className="text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors duration-200 flex items-center gap-2 group"
                                    >
                                        <div className="w-1 h-1 bg-blue-500 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                        {link.name}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Bottom Section */}
                <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                            <span>© {currentYear} StudyMentor. Made with</span>
                            <Heart className="w-4 h-4 text-red-500 animate-pulse" />
                            <span>for learners everywhere.</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            <Sparkles className="w-4 h-4 text-blue-500" />
                            <span>Powered by AI</span>
                        </div>
                    </div>
                </div>
            </div>
        </footer>
    );
};

export default Footer;