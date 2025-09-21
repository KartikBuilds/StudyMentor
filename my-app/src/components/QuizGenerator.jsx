import React, { useState } from 'react';
import { Brain, Settings, Play, Send, Trophy, CheckCircle2, XCircle, Target, User, Zap, Clock } from 'lucide-react';
import { quizAPI } from '../utils/api';

const difficulties = [
    { label: 'Easy', value: 'easy', color: 'green', icon: '🟢' },
    { label: 'Medium', value: 'medium', color: 'yellow', icon: '🟡' },
    { label: 'Hard', value: 'hard', color: 'red', icon: '🔴' },
];

const QuizGenerator = () => {
    const [topic, setTopic] = useState('');
    const [numQuestions, setNumQuestions] = useState(5);
    const [difficulty, setDifficulty] = useState('easy');
    const [useMock, setUseMock] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [quiz, setQuiz] = useState(null);
    const [answers, setAnswers] = useState([]);
    const [result, setResult] = useState(null);
    const [userId, setUserId] = useState('');

    const handleGenerate = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setQuiz(null);
        setResult(null);
        setAnswers([]);
        try {
            // Simulate API call for demo
            if (useMock) {
                await new Promise(resolve => setTimeout(resolve, 2000));
                const mockQuiz = {
                    quiz_id: 'quiz_' + Date.now(),
                    topic: topic,
                    difficulty: difficulty,
                    total_questions: numQuestions,
                    questions: Array.from({ length: numQuestions }, (_, i) => ({
                        id: i + 1,
                        question: `Sample question ${i + 1} about ${topic}?`,
                        options: ['A) Option A', 'B) Option B', 'C) Option C', 'D) Option D']
                    }))
                };
                setQuiz(mockQuiz);
                setAnswers(Array(mockQuiz.total_questions).fill(''));
            } else {
                const res = await quizAPI.generate({
                    topic,
                    num_questions: Number(numQuestions),
                    difficulty,
                    use_mock: useMock
                });
                setQuiz(res.data.data);
                setAnswers(Array(res.data.data.total_questions).fill(''));
            }
        } catch (err) {
            if (err.response?.data?.detail) {
                setError(typeof err.response.data.detail === 'string' ? err.response.data.detail : JSON.stringify(err.response.data.detail));
            } else {
                setError('Failed to generate quiz.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleAnswerChange = (idx, value) => {
        setAnswers(ans => ans.map((a, i) => i === idx ? value : a));
    };

    const handleSubmitQuiz = async (e) => {
        e.preventDefault();
        if (!quiz) return;
        setLoading(true);
        setError('');
        setResult(null);
        try {
            // Simulate API call for demo
            if (useMock) {
                await new Promise(resolve => setTimeout(resolve, 1500));
                const correctAnswers = Array.from({ length: quiz.total_questions }, () => Math.random() > 0.3);
                const score = correctAnswers.filter(Boolean).length;
                const mockResult = {
                    quiz_id: quiz.quiz_id,
                    user_id: userId || 'anonymous',
                    score: score,
                    total_questions: quiz.total_questions,
                    percentage: (score / quiz.total_questions) * 100,
                    correct_answers: correctAnswers
                };
                setResult(mockResult);
            } else {
                const res = await quizAPI.submit({
                    quiz_id: quiz.quiz_id,
                    user_id: userId,
                    answers: answers
                });
                setResult(res.data.data);
            }
        } catch (err) {
            if (err.response?.data?.detail) {
                setError(typeof err.response.data.detail === 'string' ? err.response.data.detail : JSON.stringify(err.response.data.detail));
            } else {
                setError('Failed to submit quiz.');
            }
        } finally {
            setLoading(false);
        }
    };

    const getDifficultyColor = (diff) => {
        const colors = {
            easy: 'from-green-500 to-emerald-500',
            medium: 'from-yellow-500 to-orange-500',
            hard: 'from-red-500 to-rose-500'
        };
        return colors[diff] || colors.easy;
    };

    const getScoreColor = (percentage) => {
        if (percentage >= 80) return 'text-green-600 dark:text-green-400';
        if (percentage >= 60) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-red-600 dark:text-red-400';
    };

    const answeredQuestions = answers.filter(a => a !== '').length;
    const progressPercentage = quiz ? (answeredQuestions / quiz.total_questions) * 100 : 0;

    return (
        <div className="p-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full mb-4">
                        <Brain className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-2">
                        Quiz Generator
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                        Create custom quizzes to test your knowledge and track your learning progress
                    </p>
                </div>

                <div className="grid lg:grid-cols-3 gap-8">
                    {/* Quiz Generation Form */}
                    <div className="lg:col-span-1">
                        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-6 sticky top-4">
                            <div className="flex items-center gap-2 mb-6">
                                <Settings className="w-5 h-5 text-purple-600" />
                                <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Quiz Settings</h2>
                            </div>

                            <div className="space-y-6">
                                {/* Topic */}
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Target className="w-4 h-4 text-purple-600" />
                                        <label className="font-medium text-gray-700 dark:text-gray-300">Topic</label>
                                    </div>
                                    <input
                                        className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                        value={topic}
                                        onChange={e => setTopic(e.target.value)}
                                        placeholder="e.g. Python Functions"
                                        required
                                    />
                                </div>

                                {/* Number of Questions */}
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Clock className="w-4 h-4 text-purple-600" />
                                        <label className="font-medium text-gray-700 dark:text-gray-300">Questions</label>
                                    </div>
                                    <input
                                        type="number"
                                        min={1}
                                        max={20}
                                        className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                        value={numQuestions}
                                        onChange={e => setNumQuestions(e.target.value)}
                                        required
                                    />
                                </div>

                                {/* Difficulty */}
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Zap className="w-4 h-4 text-purple-600" />
                                        <label className="font-medium text-gray-700 dark:text-gray-300">Difficulty</label>
                                    </div>
                                    <div className="grid grid-cols-3 gap-2">
                                        {difficulties.map(d => (
                                            <button
                                                key={d.value}
                                                type="button"
                                                className={`p-3 rounded-lg border text-sm font-medium transition-all ${difficulty === d.value
                                                    ? `bg-gradient-to-r ${getDifficultyColor(d.value)} text-white border-transparent shadow-lg`
                                                    : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-purple-300'
                                                    }`}
                                                onClick={() => setDifficulty(d.value)}
                                            >
                                                <div className="text-xs mb-1">{d.icon}</div>
                                                {d.label}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Mock Data Toggle */}
                                <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                    <input
                                        type="checkbox"
                                        id="useMockQuiz"
                                        checked={useMock}
                                        onChange={e => setUseMock(e.target.checked)}
                                        className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500"
                                    />
                                    <label htmlFor="useMockQuiz" className="text-gray-700 dark:text-gray-300 cursor-pointer">
                                        Use Mock Data for Demo
                                    </label>
                                </div>

                                {/* Generate Button */}
                                <button
                                    onClick={handleGenerate}
                                    className="w-full py-3 px-6 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
                                    disabled={loading || !topic.trim()}
                                >
                                    <div className="flex items-center justify-center gap-2">
                                        {loading ? (
                                            <>
                                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                Generating...
                                            </>
                                        ) : (
                                            <>
                                                <Play className="w-5 h-5" />
                                                Generate Quiz
                                            </>
                                        )}
                                    </div>
                                </button>

                                {/* Error Display */}
                                {error && (
                                    <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                                        <p className="text-red-600 dark:text-red-400 font-medium text-sm">{error}</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Quiz Content */}
                    <div className="lg:col-span-2 space-y-6">
                        {quiz ? (
                            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8">
                                {/* Quiz Header */}
                                <div className="mb-6">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                                            {quiz.topic}
                                        </h3>
                                        <div className={`px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r ${getDifficultyColor(quiz.difficulty)} text-white`}>
                                            {difficulties.find(d => d.value === quiz.difficulty)?.icon} {quiz.difficulty.charAt(0).toUpperCase() + quiz.difficulty.slice(1)}
                                        </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div className="mb-4">
                                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                                            <span>Progress: {answeredQuestions}/{quiz.total_questions} questions</span>
                                            <span>{Math.round(progressPercentage)}% complete</span>
                                        </div>
                                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                                            <div
                                                className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-300"
                                                style={{ width: `${progressPercentage}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>

                                {/* Questions */}
                                <div className="space-y-6 mb-8">
                                    {quiz.questions.map((q, idx) => (
                                        <div key={q.id} className="border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden">
                                            <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-4">
                                                <h4 className="font-semibold">Question {q.id}</h4>
                                            </div>
                                            <div className="p-6">
                                                <p className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-4">
                                                    {q.question}
                                                </p>
                                                <div className="space-y-3">
                                                    {q.options.map((opt, oidx) => (
                                                        <label key={oidx} className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-all ${answers[idx] === opt[0]
                                                            ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                                                            : 'border-gray-200 dark:border-gray-600 hover:border-purple-300 hover:bg-purple-50/50 dark:hover:bg-purple-900/10'
                                                            }`}>
                                                            <input
                                                                type="radio"
                                                                name={`q${idx}`}
                                                                value={opt[0]}
                                                                checked={answers[idx] === opt[0]}
                                                                onChange={() => handleAnswerChange(idx, opt[0])}
                                                                className="mt-1 w-4 h-4 text-purple-600 focus:ring-purple-500"
                                                                required
                                                            />
                                                            <span className="text-gray-700 dark:text-gray-300 flex-1">{opt}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                {/* Submit Section */}
                                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                                    <div className="flex gap-4 items-end">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <User className="w-4 h-4 text-purple-600" />
                                                <label className="font-medium text-gray-700 dark:text-gray-300">User ID (Optional)</label>
                                            </div>
                                            <input
                                                className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                                                placeholder="Enter your ID for tracking..."
                                                value={userId}
                                                onChange={e => setUserId(e.target.value)}
                                            />
                                        </div>
                                        <button
                                            onClick={handleSubmitQuiz}
                                            className="py-3 px-6 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
                                            disabled={loading || answeredQuestions < quiz.total_questions}
                                        >
                                            <div className="flex items-center gap-2">
                                                {loading ? (
                                                    <>
                                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                                        Submitting...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Send className="w-5 h-5" />
                                                        Submit Quiz
                                                    </>
                                                )}
                                            </div>
                                        </button>
                                    </div>
                                    {answeredQuestions < quiz.total_questions && (
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                            Please answer all questions before submitting.
                                        </p>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-12 text-center">
                                <Brain className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                                    Ready to Test Your Knowledge?
                                </h3>
                                <p className="text-gray-500 dark:text-gray-500">
                                    Configure your quiz settings and click "Generate Quiz" to get started
                                </p>
                            </div>
                        )}

                        {/* Results */}
                        {result && (
                            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <Trophy className="w-6 h-6 text-yellow-600" />
                                    <h4 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Quiz Results</h4>
                                </div>

                                {/* Score Summary */}
                                <div className="grid grid-cols-3 gap-4 mb-6">
                                    <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                                        <div className={`text-2xl font-bold ${getScoreColor(result.percentage)}`}>
                                            {result.score}/{result.total_questions}
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Score</div>
                                    </div>
                                    <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                                        <div className={`text-2xl font-bold ${getScoreColor(result.percentage)}`}>
                                            {result.percentage.toFixed(1)}%
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Percentage</div>
                                    </div>
                                    <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl">
                                        <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                                            {result.correct_answers.filter(Boolean).length}
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Correct</div>
                                    </div>
                                </div>

                                {/* Detailed Results */}
                                <div>
                                    <h5 className="font-semibold text-gray-800 dark:text-gray-200 mb-4">Question Breakdown:</h5>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {result.correct_answers.map((isCorrect, idx) => (
                                            <div key={idx} className={`flex items-center gap-3 p-3 rounded-lg ${isCorrect ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'
                                                }`}>
                                                {isCorrect ?
                                                    <CheckCircle2 className="w-5 h-5 text-green-600" /> :
                                                    <XCircle className="w-5 h-5 text-red-600" />
                                                }
                                                <span className={`font-medium ${isCorrect ? 'text-green-700 dark:text-green-300' : 'text-red-600 dark:text-red-400'
                                                    }`}>
                                                    Question {idx + 1}: {isCorrect ? 'Correct' : 'Incorrect'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {result.user_id && (
                                    <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                                        <p className="text-sm text-gray-500 dark:text-gray-400">
                                            Submitted by: {result.user_id}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default QuizGenerator;