import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import {
    Home, Brain, Target, Zap, FileText, BookOpen, Sparkles, Menu, X,
    User, LogOut, Settings, LogIn, UserPlus, MessageCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import AuthModal from './AuthModal';

const Navbar = () => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authMode, setAuthMode] = useState('login');
    const [showUserMenu, setShowUserMenu] = useState(false);
    const { isAuthenticated, user, logout } = useAuth();

    const links = [
        { path: '/dashboard', label: 'Dashboard', icon: Home, gradient: 'from-blue-500 to-indigo-500' },
        { path: '/syllabus-hub', label: 'Syllabus Hub', icon: Sparkles, gradient: 'from-purple-500 to-pink-500' },
        { path: '/ai-buddy', label: 'AI Study Buddy', icon: MessageCircle, gradient: 'from-indigo-500 to-purple-500' },
        { path: '/flashcards', label: 'Flashcards', icon: Brain, gradient: 'from-cyan-500 to-blue-500' },
        { path: '/study-plan', label: 'Study Plan', icon: Target, gradient: 'from-blue-500 to-indigo-500' },
        { path: '/quiz', label: 'Quiz', icon: Zap, gradient: 'from-orange-500 to-red-500' },
    ];

    const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

    const handleAuthClick = (mode) => {
        setAuthMode(mode);
        setShowAuthModal(true);
    };

    const handleLogout = async () => {
        await logout();
        setShowUserMenu(false);
    };

    return (
        <nav className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-b border-gray-200/50 dark:border-gray-700/50 sticky top-0 z-50 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <NavLink to="/" className="flex items-center gap-3 group" end>
                        <div className="relative">
                            <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
                                <BookOpen className="w-6 h-6 text-white" />
                            </div>
                            <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 animate-pulse">
                                <Sparkles className="w-2 h-2 text-white" />
                            </div>
                        </div>
                        <div className="hidden sm:block">
                            <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                                StudyMentor
                            </span>
                            <div className="text-xs text-gray-500 dark:text-gray-400 -mt-1 flex items-center gap-2">
                                AI-Powered Learning
                                <span className="px-2 py-0.5 bg-orange-100 text-orange-600 text-xs font-medium rounded-full">
                                    DEMO
                                </span>
                            </div>
                        </div>
                    </NavLink>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex items-center space-x-1">
                        {links.map((link) => {
                            const IconComponent = link.icon;
                            return (
                                <NavLink
                                    key={link.path}
                                    to={link.path}
                                    end={link.path === '/'}
                                    className={({ isActive }) =>
                                        `group relative px-4 py-2 rounded-xl font-medium transition-all duration-200 flex items-center gap-2 ${isActive
                                            ? 'text-white shadow-lg transform scale-105'
                                            : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50'
                                        }`
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            {isActive && (
                                                <div className={`absolute inset-0 bg-gradient-to-r ${link.gradient} rounded-xl -z-10`} />
                                            )}
                                            <IconComponent className="w-4 h-4" />
                                            <span className="text-sm">{link.label}</span>
                                            {isActive && (
                                                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-white rounded-full opacity-80" />
                                            )}
                                        </>
                                    )}
                                </NavLink>
                            );
                        })}
                    </div>

                    {/* Auth Section */}
                    <div className="hidden lg:flex items-center space-x-3">
                        {isAuthenticated ? (
                            <div className="relative">
                                <button
                                    onClick={() => setShowUserMenu(!showUserMenu)}
                                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center">
                                        <span className="text-white text-sm font-semibold">
                                            {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                                        </span>
                                    </div>
                                    <div className="text-left">
                                        <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                            {user?.full_name?.split(' ')[0] || 'User'}
                                        </div>
                                        <div className="text-xs text-gray-500 dark:text-gray-400">
                                            Welcome back!
                                        </div>
                                    </div>
                                </button>

                                {/* User Dropdown */}
                                {showUserMenu && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                                        <NavLink
                                            to="/dashboard"
                                            onClick={() => setShowUserMenu(false)}
                                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        >
                                            <User className="w-4 h-4" />
                                            Dashboard
                                        </NavLink>
                                        <NavLink
                                            to="/settings"
                                            onClick={() => setShowUserMenu(false)}
                                            className="flex items-center gap-3 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                                        >
                                            <Settings className="w-4 h-4" />
                                            Settings
                                        </NavLink>
                                        <hr className="my-1 border-gray-200 dark:border-gray-700" />
                                        <button
                                            onClick={handleLogout}
                                            className="flex items-center gap-3 px-4 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left"
                                        >
                                            <LogOut className="w-4 h-4" />
                                            Sign Out
                                        </button>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="flex items-center space-x-2">
                                <button
                                    onClick={() => handleAuthClick('login')}
                                    className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                                >
                                    <LogIn className="w-4 h-4" />
                                    Sign In
                                </button>
                                <button
                                    onClick={() => handleAuthClick('register')}
                                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl"
                                >
                                    <UserPlus className="w-4 h-4" />
                                    Sign Up
                                </button>
                            </div>
                        )}
                    </div>

                    {/* Theme Toggle & Mobile Menu Button */}
                    <div className="flex items-center gap-3">
                        {/* Theme Toggle Button */}
                        <button className="p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200 hidden sm:block">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
                            </svg>
                        </button>

                        {/* Mobile Menu Button */}
                        <button
                            onClick={toggleMenu}
                            className="lg:hidden p-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-all duration-200"
                        >
                            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Navigation */}
                <div className={`lg:hidden transition-all duration-300 ease-in-out bg-white/95 dark:bg-gray-900/95 backdrop-blur-md ${isMenuOpen ? 'max-h-96 opacity-100 pb-4' : 'max-h-0 opacity-0 overflow-hidden'
                    }`}>
                    <div className="grid grid-cols-1 gap-2 pt-4 border-t border-gray-200/50 dark:border-gray-700/50">
                        {links.map((link) => {
                            const IconComponent = link.icon;
                            return (
                                <NavLink
                                    key={link.path}
                                    to={link.path}
                                    end={link.path === '/'}
                                    onClick={() => setIsMenuOpen(false)}
                                    className={({ isActive }) =>
                                        `group relative px-4 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-3 ${isActive
                                            ? 'text-white shadow-lg'
                                            : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-800/50'
                                        }`
                                    }
                                >
                                    {({ isActive }) => (
                                        <>
                                            {isActive && (
                                                <div className={`absolute inset-0 bg-gradient-to-r ${link.gradient} rounded-xl -z-10`} />
                                            )}
                                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isActive ? 'bg-white/20' : 'bg-gray-100 dark:bg-gray-800'
                                                }`}>
                                                <IconComponent className="w-4 h-4" />
                                            </div>
                                            <div className="flex-1">
                                                <div className="text-sm font-medium">{link.label}</div>
                                                <div className={`text-xs ${isActive ? 'text-white/80' : 'text-gray-500 dark:text-gray-400'
                                                    }`}>
                                                    {link.path === '/' ? 'Dashboard' :
                                                        link.path === '/flashcards' ? 'Memory Cards' :
                                                            link.path === '/study-plan' ? 'Learning Schedule' :
                                                                link.path === '/quiz' ? 'Knowledge Test' :
                                                                    'Document Parser'}
                                                </div>
                                            </div>
                                            {isActive && (
                                                <div className="w-2 h-2 bg-white rounded-full opacity-80" />
                                            )}
                                        </>
                                    )}
                                </NavLink>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Mobile Menu Overlay */}
            {isMenuOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/10 z-40"
                    onClick={() => setIsMenuOpen(false)}
                />
            )}

            {/* Auth Modal */}
            <AuthModal
                isOpen={showAuthModal}
                onClose={() => setShowAuthModal(false)}
                initialMode={authMode}
            />
        </nav>
    );
};

export default Navbar;