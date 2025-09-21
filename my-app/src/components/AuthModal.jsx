import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    User, Mail, Lock, Eye, EyeOff, UserPlus, LogIn,
    AlertCircle, CheckCircle, Loader, Brain, Sparkles
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const AuthModal = ({ isOpen, onClose, initialMode = 'login' }) => {
    const [mode, setMode] = useState(initialMode); // 'login' or 'register'
    const [showPassword, setShowPassword] = useState(false);
    const [formData, setFormData] = useState({
        full_name: '',
        email: '',
        password: '',
        confirmPassword: ''
    });
    const [validationErrors, setValidationErrors] = useState({});

    const { login, register, isLoading, error, clearError } = useAuth();

    // Reset form when switching modes
    const switchMode = (newMode) => {
        setMode(newMode);
        setFormData({
            full_name: '',
            email: '',
            password: '',
            confirmPassword: ''
        });
        setValidationErrors({});
        clearError();
    };

    // Handle input changes
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));

        // Clear validation error for this field
        if (validationErrors[name]) {
            setValidationErrors(prev => ({ ...prev, [name]: '' }));
        }
        clearError();
    };

    // Validate form
    const validateForm = () => {
        const errors = {};

        // Email validation
        if (!formData.email) {
            errors.email = 'Email is required';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            errors.email = 'Please enter a valid email';
        }

        // Password validation
        if (!formData.password) {
            errors.password = 'Password is required';
        } else if (formData.password.length < 6) {
            errors.password = 'Password must be at least 6 characters';
        } else if (!/(?=.*[A-Za-z])(?=.*\d)/.test(formData.password)) {
            errors.password = 'Password must contain letters and numbers';
        }

        // Registration-specific validation
        if (mode === 'register') {
            if (!formData.full_name) {
                errors.full_name = 'Full name is required';
            } else if (formData.full_name.length < 2) {
                errors.full_name = 'Full name must be at least 2 characters';
            }

            if (formData.password !== formData.confirmPassword) {
                errors.confirmPassword = 'Passwords do not match';
            }
        }

        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        const authData = {
            email: formData.email,
            password: formData.password
        };

        if (mode === 'register') {
            authData.full_name = formData.full_name;
            authData.study_preferences = {
                preferred_difficulty: 'medium',
                daily_study_goal: 60,
                preferred_subjects: [],
                study_time_preference: 'morning'
            };
        }

        const result = mode === 'login'
            ? await login(authData)
            : await register(authData);

        if (result.success) {
            onClose();
        }
    };

    // Don't render if not open
    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
                <div className="flex items-center justify-center min-h-full w-full">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.9, y: 20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 300 }}
                        className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto my-8 overflow-hidden relative"
                    >
                        {/* Header */}
                        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-20 h-20 bg-white bg-opacity-10 rounded-full -mr-10 -mt-10"></div>
                            <div className="absolute bottom-0 left-0 w-16 h-16 bg-white bg-opacity-10 rounded-full -ml-8 -mb-8"></div>

                            <div className="relative z-10">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center space-x-3">
                                        <div className="p-2 bg-white bg-opacity-20 rounded-xl">
                                            <Brain className="h-6 w-6" />
                                        </div>
                                        <h2 className="text-xl font-bold">StudyMentor AI</h2>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="p-1 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                                    >
                                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <h3 className="text-lg font-semibold mb-2">
                                    {mode === 'login' ? 'Welcome Back!' : 'Join StudyMentor'}
                                </h3>
                                <p className="text-blue-100 text-sm">
                                    {mode === 'login'
                                        ? 'Sign in to continue your learning journey'
                                        : 'Start your AI-powered learning adventure'
                                    }
                                </p>
                            </div>
                        </div>

                        {/* Form */}
                        <div className="p-6">
                            {/* Error Message */}
                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2 text-red-700"
                                >
                                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                                    <span className="text-sm">{error}</span>
                                </motion.div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-4">
                                {/* Full Name (Register only) */}
                                {mode === 'register' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Full Name
                                        </label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                type="text"
                                                name="full_name"
                                                value={formData.full_name}
                                                onChange={handleInputChange}
                                                placeholder="Enter your full name"
                                                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${validationErrors.full_name ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                                    }`}
                                            />
                                        </div>
                                        {validationErrors.full_name && (
                                            <p className="mt-1 text-sm text-red-600">{validationErrors.full_name}</p>
                                        )}
                                    </motion.div>
                                )}

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Email Address
                                    </label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="email"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleInputChange}
                                            placeholder="Enter your email"
                                            className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${validationErrors.email ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                                }`}
                                        />
                                    </div>
                                    {validationErrors.email && (
                                        <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
                                    )}
                                </div>

                                {/* Password */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Password
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            name="password"
                                            value={formData.password}
                                            onChange={handleInputChange}
                                            placeholder="Enter your password"
                                            className={`w-full pl-10 pr-12 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${validationErrors.password ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                                }`}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                        >
                                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    {validationErrors.password && (
                                        <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
                                    )}
                                    {mode === 'register' && !validationErrors.password && (
                                        <p className="mt-1 text-xs text-gray-500">
                                            Must be at least 6 characters with letters and numbers
                                        </p>
                                    )}
                                </div>

                                {/* Confirm Password (Register only) */}
                                {mode === 'register' && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        transition={{ duration: 0.3 }}
                                    >
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Confirm Password
                                        </label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                name="confirmPassword"
                                                value={formData.confirmPassword}
                                                onChange={handleInputChange}
                                                placeholder="Confirm your password"
                                                className={`w-full pl-10 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${validationErrors.confirmPassword ? 'border-red-300 bg-red-50' : 'border-gray-300'
                                                    }`}
                                            />
                                        </div>
                                        {validationErrors.confirmPassword && (
                                            <p className="mt-1 text-sm text-red-600">{validationErrors.confirmPassword}</p>
                                        )}
                                    </motion.div>
                                )}

                                {/* Submit Button */}
                                <button
                                    type="submit"
                                    disabled={isLoading}
                                    className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 focus:ring-4 focus:ring-blue-200 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                                >
                                    {isLoading ? (
                                        <Loader className="h-4 w-4 animate-spin" />
                                    ) : mode === 'login' ? (
                                        <>
                                            <LogIn className="h-4 w-4" />
                                            <span>Sign In</span>
                                        </>
                                    ) : (
                                        <>
                                            <UserPlus className="h-4 w-4" />
                                            <span>Create Account</span>
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Mode Switch */}
                            <div className="mt-6 text-center">
                                <p className="text-gray-600 text-sm">
                                    {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
                                    <button
                                        onClick={() => switchMode(mode === 'login' ? 'register' : 'login')}
                                        className="ml-2 text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
                                    >
                                        {mode === 'login' ? 'Sign Up' : 'Sign In'}
                                    </button>
                                </p>
                            </div>

                            {/* Features Preview */}
                            <div className="mt-6 pt-6 border-t border-gray-100">
                                <div className="flex items-center justify-center space-x-6 text-xs text-gray-500">
                                    <div className="flex items-center space-x-1">
                                        <Sparkles className="h-3 w-3" />
                                        <span>AI-Powered</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <CheckCircle className="h-3 w-3" />
                                        <span>Free to Use</span>
                                    </div>
                                    <div className="flex items-center space-x-1">
                                        <Brain className="h-3 w-3" />
                                        <span>Smart Learning</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </AnimatePresence>
    );
};

export default AuthModal;