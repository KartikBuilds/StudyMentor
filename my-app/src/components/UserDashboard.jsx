import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
    User, Settings, BookOpen, Clock, Calendar, Trophy,
    Target, TrendingUp, Award, Sparkles, Edit3, Save, X,
    Brain, Zap, Star, CheckCircle, MessageCircle
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const UserDashboard = () => {
    const { user, updateProfile, logout } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        full_name: user?.full_name || '',
        study_preferences: {
            preferred_difficulty: user?.study_preferences?.preferred_difficulty || 'medium',
            daily_study_goal: user?.study_preferences?.daily_study_goal || 60,
            preferred_subjects: user?.study_preferences?.preferred_subjects || [],
            study_time_preference: user?.study_preferences?.study_time_preference || 'morning'
        }
    });

    const handleEditToggle = () => {
        if (isEditing) {
            // Reset form to current user data
            setEditForm({
                full_name: user?.full_name || '',
                study_preferences: user?.study_preferences || {}
            });
        }
        setIsEditing(!isEditing);
    };

    const handleSaveProfile = async () => {
        const result = await updateProfile(editForm);
        if (result.success) {
            setIsEditing(false);
        } else {
            alert('Failed to update profile: ' + result.error);
        }
    };

    const handleInputChange = (field, value) => {
        if (field.startsWith('study_preferences.')) {
            const prefField = field.replace('study_preferences.', '');
            setEditForm(prev => ({
                ...prev,
                study_preferences: {
                    ...prev.study_preferences,
                    [prefField]: value
                }
            }));
        } else {
            setEditForm(prev => ({ ...prev, [field]: value }));
        }
    };

    const stats = user?.study_stats || {};
    const totalStudyHours = Math.floor((stats.total_study_time || 0) / 60);
    const completedSessions = stats.completed_sessions || 0;
    const currentStreak = stats.streak_count || 0;
    const avgQuizScore = stats.quiz_scores?.length
        ? Math.round(stats.quiz_scores.reduce((a, b) => a + b, 0) / stats.quiz_scores.length)
        : 0;

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-8"
                >
                    <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-full mb-4 shadow-lg">
                        <Brain className="w-10 h-10 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
                        Welcome back, {user?.full_name?.split(' ')[0] || 'Student'}! 👋
                    </h1>
                    <p className="text-gray-600 max-w-md mx-auto">
                        Track your progress, manage your study preferences, and achieve your learning goals
                    </p>
                </motion.div>

                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Profile Section */}
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-1"
                    >
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6">
                            <div className="flex items-center justify-between mb-6">
                                <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
                                    <User className="w-5 h-5 text-blue-600" />
                                    Profile
                                </h2>
                                <button
                                    onClick={isEditing ? handleSaveProfile : handleEditToggle}
                                    className={`p-2 rounded-lg transition-colors ${isEditing
                                            ? 'bg-green-100 hover:bg-green-200 text-green-700'
                                            : 'bg-blue-100 hover:bg-blue-200 text-blue-700'
                                        }`}
                                >
                                    {isEditing ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                                </button>
                            </div>

                            <div className="space-y-4">
                                {/* Avatar */}
                                <div className="text-center">
                                    <div className="w-20 h-20 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mx-auto mb-3">
                                        <span className="text-2xl font-bold text-white">
                                            {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        Member since {new Date(user?.created_at).toLocaleDateString()}
                                    </div>
                                </div>

                                {/* Name */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            value={editForm.full_name}
                                            onChange={(e) => handleInputChange('full_name', e.target.value)}
                                            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        />
                                    ) : (
                                        <p className="p-3 bg-gray-50 rounded-lg text-gray-800">{user?.full_name}</p>
                                    )}
                                </div>

                                {/* Email */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                    <p className="p-3 bg-gray-50 rounded-lg text-gray-600">{user?.email}</p>
                                </div>

                                {/* Study Preferences */}
                                <div className="space-y-3">
                                    <h3 className="font-medium text-gray-800 flex items-center gap-2">
                                        <Settings className="w-4 h-4" />
                                        Study Preferences
                                    </h3>

                                    {/* Difficulty Level */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty Level</label>
                                        {isEditing ? (
                                            <select
                                                value={editForm.study_preferences.preferred_difficulty}
                                                onChange={(e) => handleInputChange('study_preferences.preferred_difficulty', e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="easy">Easy</option>
                                                <option value="medium">Medium</option>
                                                <option value="hard">Hard</option>
                                            </select>
                                        ) : (
                                            <p className="p-2 bg-gray-50 rounded-lg text-gray-800 capitalize">
                                                {user?.study_preferences?.preferred_difficulty || 'Medium'}
                                            </p>
                                        )}
                                    </div>

                                    {/* Daily Study Goal */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Daily Study Goal (minutes)</label>
                                        {isEditing ? (
                                            <input
                                                type="number"
                                                min="15"
                                                max="480"
                                                value={editForm.study_preferences.daily_study_goal}
                                                onChange={(e) => handleInputChange('study_preferences.daily_study_goal', parseInt(e.target.value))}
                                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        ) : (
                                            <p className="p-2 bg-gray-50 rounded-lg text-gray-800">
                                                {user?.study_preferences?.daily_study_goal || 60} minutes
                                            </p>
                                        )}
                                    </div>

                                    {/* Study Time Preference */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Preferred Study Time</label>
                                        {isEditing ? (
                                            <select
                                                value={editForm.study_preferences.study_time_preference}
                                                onChange={(e) => handleInputChange('study_preferences.study_time_preference', e.target.value)}
                                                className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            >
                                                <option value="morning">Morning</option>
                                                <option value="afternoon">Afternoon</option>
                                                <option value="evening">Evening</option>
                                                <option value="night">Night</option>
                                            </select>
                                        ) : (
                                            <p className="p-2 bg-gray-50 rounded-lg text-gray-800 capitalize">
                                                {user?.study_preferences?.study_time_preference || 'Morning'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </motion.div>

                    {/* Stats and Activities */}
                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="lg:col-span-2 space-y-6"
                    >
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Study Hours</p>
                                        <p className="text-2xl font-bold text-blue-600">{totalStudyHours}</p>
                                    </div>
                                    <Clock className="w-8 h-8 text-blue-600" />
                                </div>
                            </div>

                            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Sessions</p>
                                        <p className="text-2xl font-bold text-green-600">{completedSessions}</p>
                                    </div>
                                    <BookOpen className="w-8 h-8 text-green-600" />
                                </div>
                            </div>

                            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Streak</p>
                                        <p className="text-2xl font-bold text-orange-600">{currentStreak}</p>
                                    </div>
                                    <Zap className="w-8 h-8 text-orange-600" />
                                </div>
                            </div>

                            <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-lg border border-white/50 p-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-600">Avg Score</p>
                                        <p className="text-2xl font-bold text-purple-600">{avgQuizScore}%</p>
                                    </div>
                                    <Star className="w-8 h-8 text-purple-600" />
                                </div>
                            </div>
                        </div>

                        {/* Recent Activity */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-blue-600" />
                                Recent Activity
                            </h3>

                            <div className="space-y-3">
                                {stats.quiz_scores?.length > 0 ? (
                                    stats.quiz_scores.slice(-5).map((score, index) => (
                                        <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                            <div className="flex items-center gap-3">
                                                <CheckCircle className="w-5 h-5 text-green-600" />
                                                <span className="text-gray-700">Quiz completed</span>
                                            </div>
                                            <span className="font-semibold text-blue-600">{score}%</span>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                                        <p>No recent activity</p>
                                        <p className="text-sm">Start studying to see your progress here!</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Achievements */}
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl border border-white/50 p-6">
                            <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
                                <Trophy className="w-5 h-5 text-yellow-600" />
                                Achievements
                            </h3>

                            <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                                {/* Sample achievements */}
                                <div className={`p-4 rounded-lg border-2 ${totalStudyHours >= 10
                                        ? 'bg-yellow-50 border-yellow-200'
                                        : 'bg-gray-50 border-gray-200 opacity-50'
                                    }`}>
                                    <Award className={`w-8 h-8 mb-2 ${totalStudyHours >= 10 ? 'text-yellow-600' : 'text-gray-400'
                                        }`} />
                                    <h4 className="font-semibold text-sm">Study Warrior</h4>
                                    <p className="text-xs text-gray-600">Complete 10 hours of study</p>
                                </div>

                                <div className={`p-4 rounded-lg border-2 ${currentStreak >= 7
                                        ? 'bg-orange-50 border-orange-200'
                                        : 'bg-gray-50 border-gray-200 opacity-50'
                                    }`}>
                                    <Zap className={`w-8 h-8 mb-2 ${currentStreak >= 7 ? 'text-orange-600' : 'text-gray-400'
                                        }`} />
                                    <h4 className="font-semibold text-sm">Week Streak</h4>
                                    <p className="text-xs text-gray-600">Study for 7 days straight</p>
                                </div>

                                <div className={`p-4 rounded-lg border-2 ${avgQuizScore >= 80
                                        ? 'bg-green-50 border-green-200'
                                        : 'bg-gray-50 border-gray-200 opacity-50'
                                    }`}>
                                    <Star className={`w-8 h-8 mb-2 ${avgQuizScore >= 80 ? 'text-green-600' : 'text-gray-400'
                                        }`} />
                                    <h4 className="font-semibold text-sm">Quiz Master</h4>
                                    <p className="text-xs text-gray-600">Average 80% in quizzes</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>

                {/* Logout Button */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mt-8"
                >
                    <button
                        onClick={logout}
                        className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                    >
                        Sign Out
                    </button>
                </motion.div>
            </div>
        </div>
    );
};

export default UserDashboard;