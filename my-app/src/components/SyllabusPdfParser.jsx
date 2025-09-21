import React, { useState } from 'react';
import { FileText, Upload, Eye, CheckCircle2, BookOpen, Target, TrendingUp, Hash, Download, Sparkles } from 'lucide-react';
import { syllabusAPI } from '../utils/api';

const SyllabusPdfParser = () => {
    const [file, setFile] = useState(null);
    const [textInput, setTextInput] = useState('');
    const [inputMode, setInputMode] = useState('pdf'); // 'pdf' or 'text'
    const [useMock, setUseMock] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [result, setResult] = useState(null);

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
        setResult(null);
        setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setResult(null);

        if (inputMode === 'pdf' && !file && !useMock) {
            setError('Please select a PDF file.');
            setLoading(false);
            return;
        }

        if (inputMode === 'text' && !textInput.trim() && !useMock) {
            setError('Please enter syllabus text.');
            setLoading(false);
            return;
        } try {
            if (useMock) {
                // Simulate API call for demo
                await new Promise(resolve => setTimeout(resolve, 3000));
                const mockResult = {
                    syllabus_id: 'syllabus_' + Date.now(),
                    total_subjects: 4,
                    total_topics: 18,
                    confidence_score: 0.92,
                    structured_topics: {
                        'Data Structures': [
                            'Arrays and Linked Lists',
                            'Stacks and Queues',
                            'Trees and Binary Search Trees',
                            'Hash Tables',
                            'Graph Algorithms'
                        ],
                        'Algorithms': [
                            'Sorting Algorithms',
                            'Search Algorithms',
                            'Dynamic Programming',
                            'Greedy Algorithms',
                            'Divide and Conquer'
                        ],
                        'Object Oriented Programming': [
                            'Classes and Objects',
                            'Inheritance and Polymorphism',
                            'Encapsulation and Abstraction',
                            'Design Patterns'
                        ],
                        'Database Systems': [
                            'Relational Database Design',
                            'SQL Queries',
                            'Normalization',
                            'Indexing and Performance'
                        ]
                    }
                };
                setResult(mockResult);
            } else {
                if (inputMode === 'text') {
                    // Use text parsing API
                    const res = await syllabusAPI.parseText({
                        text: textInput,
                        use_mock: useMock
                    });
                    setResult(res.data.data);
                } else {
                    // Use PDF parsing API
                    const formData = new FormData();
                    formData.append('file', file);
                    formData.append('use_mock', useMock);

                    const res = await syllabusAPI.parsePDF(formData);
                    setResult(res.data.data);
                }
            }
        } catch (err) {
            if (err.response?.data?.detail) {
                setError(typeof err.response.data.detail === 'string' ? err.response.data.detail : JSON.stringify(err.response.data.detail));
            } else {
                setError('Failed to parse PDF.');
            }
        } finally {
            setLoading(false);
        }
    };

    const getConfidenceColor = (score) => {
        if (score >= 0.8) return 'text-green-600 dark:text-green-400';
        if (score >= 0.6) return 'text-yellow-600 dark:text-yellow-400';
        return 'text-red-600 dark:text-red-400';
    };

    const getConfidenceBg = (score) => {
        if (score >= 0.8) return 'bg-green-50 dark:bg-green-900/20';
        if (score >= 0.6) return 'bg-yellow-50 dark:bg-yellow-900/20';
        return 'bg-red-50 dark:bg-red-900/20';
    };

    return (
        <div className="p-4">
            <div className="max-w-5xl mx-auto">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full mb-4">
                        <FileText className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent mb-2">
                        Syllabus PDF Parser
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                        Extract and structure syllabus content from PDF documents using AI-powered parsing
                    </p>
                </div>

                <div className="grid lg:grid-cols-2 gap-8">
                    {/* Upload Section */}
                    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8">
                        <div className="flex items-center gap-2 mb-6">
                            <Upload className="w-5 h-5 text-emerald-600" />
                            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Upload PDF</h2>
                        </div>

                        <div className="space-y-6">
                            {/* Input Mode Toggle */}
                            <div>
                                <label className="block font-medium mb-3 text-gray-700 dark:text-gray-300">
                                    Input Method
                                </label>
                                <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                                    <button
                                        type="button"
                                        onClick={() => setInputMode('pdf')}
                                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${inputMode === 'pdf'
                                                ? 'bg-emerald-600 text-white shadow-md'
                                                : 'text-gray-600 dark:text-gray-300 hover:text-emerald-600'
                                            }`}
                                    >
                                        PDF Upload
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setInputMode('text')}
                                        className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all ${inputMode === 'text'
                                                ? 'bg-emerald-600 text-white shadow-md'
                                                : 'text-gray-600 dark:text-gray-300 hover:text-emerald-600'
                                            }`}
                                    >
                                        Text Input
                                    </button>
                                </div>
                            </div>

                            {/* File Upload or Text Input */}
                            {inputMode === 'pdf' ? (
                                <div>
                                    <label className="block font-medium mb-3 text-gray-700 dark:text-gray-300">
                                        PDF File
                                    </label>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept="application/pdf"
                                            onChange={handleFileChange}
                                            className="hidden"
                                            id="pdf-upload"
                                            required={!useMock}
                                        />
                                        <label
                                            htmlFor="pdf-upload"
                                            className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
                                        >
                                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                                <Upload className="w-8 h-8 mb-4 text-gray-400" />
                                                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                                    <span className="font-semibold">Click to upload</span> or drag and drop
                                                </p>
                                                <p className="text-xs text-gray-500 dark:text-gray-400">PDF files only</p>
                                            </div>
                                        </label>
                                    </div>
                                    {file && (
                                        <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-700">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-emerald-600" />
                                                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                                                    {file.name}
                                                </span>
                                                <span className="text-xs text-emerald-600 dark:text-emerald-400">
                                                    ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div>
                                    <label className="block font-medium mb-3 text-gray-700 dark:text-gray-300">
                                        Syllabus Text
                                    </label>
                                    <textarea
                                        value={textInput}
                                        onChange={(e) => setTextInput(e.target.value)}
                                        placeholder="Paste your syllabus text here..."
                                        rows={8}
                                        className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none"
                                        required={!useMock}
                                    />
                                    {textInput && (
                                        <div className="mt-3 p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg border border-emerald-200 dark:border-emerald-700">
                                            <div className="flex items-center gap-2">
                                                <FileText className="w-4 h-4 text-emerald-600" />
                                                <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">
                                                    {textInput.length} characters ready for parsing
                                                </span>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Mock Data Toggle */}
                            <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                                <input
                                    type="checkbox"
                                    id="useMockPdf"
                                    checked={useMock}
                                    onChange={e => setUseMock(e.target.checked)}
                                    className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500"
                                />
                                <label htmlFor="useMockPdf" className="text-gray-700 dark:text-gray-300 cursor-pointer">
                                    Use Mock Data for Demo
                                </label>
                            </div>

                            {/* Parse Button */}
                            <button
                                onClick={handleSubmit}
                                className="w-full py-4 px-6 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
                                disabled={loading || (inputMode === 'pdf' && !file && !useMock) || (inputMode === 'text' && !textInput.trim() && !useMock)}
                            >
                                <div className="flex items-center justify-center gap-2">
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Parsing PDF...
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-5 h-5" />
                                            Parse Syllabus
                                        </>
                                    )}
                                </div>
                            </button>

                            {/* Error Display */}
                            {error && (
                                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                                    <p className="text-red-600 dark:text-red-400 font-medium">{error}</p>
                                </div>
                            )}

                            {/* Info Section */}
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-2">How it works:</h4>
                                <ul className="text-sm text-blue-700 dark:text-blue-300 space-y-1">
                                    <li>• Upload your syllabus PDF file</li>
                                    <li>• AI extracts and structures the content</li>
                                    <li>• Get organized subjects and topics</li>
                                    <li>• Use results for study planning</li>
                                </ul>
                            </div>
                        </div>
                    </div>

                    {/* Results Section */}
                    <div className="space-y-6">
                        {result ? (
                            <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Parsed Syllabus</h3>
                                </div>

                                {/* Summary Stats */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                                    <div className="text-center p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl">
                                        <BookOpen className="w-6 h-6 text-emerald-600 mx-auto mb-2" />
                                        <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{result.total_subjects}</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Subjects</div>
                                    </div>
                                    <div className="text-center p-4 bg-teal-50 dark:bg-teal-900/20 rounded-xl">
                                        <Target className="w-6 h-6 text-teal-600 mx-auto mb-2" />
                                        <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">{result.total_topics}</div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Topics</div>
                                    </div>
                                    <div className={`text-center p-4 rounded-xl ${getConfidenceBg(result.confidence_score)}`}>
                                        <TrendingUp className={`w-6 h-6 mx-auto mb-2 ${getConfidenceColor(result.confidence_score)}`} />
                                        <div className={`text-2xl font-bold ${getConfidenceColor(result.confidence_score)}`}>
                                            {(result.confidence_score * 100).toFixed(0)}%
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">Confidence</div>
                                    </div>
                                    <div className="text-center p-4 bg-gray-50 dark:bg-gray-700/20 rounded-xl">
                                        <Hash className="w-6 h-6 text-gray-600 mx-auto mb-2" />
                                        <div className="text-sm font-mono text-gray-600 dark:text-gray-400 truncate">
                                            {result.syllabus_id}
                                        </div>
                                        <div className="text-sm text-gray-600 dark:text-gray-400">ID</div>
                                    </div>
                                </div>

                                {/* Structured Topics */}
                                <div className="space-y-4">
                                    <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
                                        Structured Content
                                    </h4>

                                    <div className="space-y-3 max-h-96 overflow-y-auto">
                                        {Object.entries(result.structured_topics).map(([subject, topics]) => (
                                            <div key={subject} className="border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden">
                                                <div className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-4 py-3">
                                                    <h5 className="font-semibold flex items-center gap-2">
                                                        <BookOpen className="w-4 h-4" />
                                                        {subject}
                                                    </h5>
                                                </div>
                                                <div className="p-4 bg-white dark:bg-gray-800">
                                                    <div className="grid gap-2">
                                                        {topics.map((topic, idx) => (
                                                            <div key={idx} className="flex items-start gap-2 p-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                                                                <div className="w-2 h-2 bg-emerald-500 rounded-full mt-2 flex-shrink-0"></div>
                                                                <span className="text-gray-700 dark:text-gray-300 text-sm">{topic}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                                    <div className="flex gap-3">
                                        <button className="flex-1 py-2 px-4 bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-300 font-medium rounded-lg hover:bg-emerald-200 dark:hover:bg-emerald-900/40 transition-colors">
                                            <Eye className="w-4 h-4 inline mr-2" />
                                            View Details
                                        </button>
                                        <button className="flex-1 py-2 px-4 bg-teal-100 dark:bg-teal-900/20 text-teal-700 dark:text-teal-300 font-medium rounded-lg hover:bg-teal-200 dark:hover:bg-teal-900/40 transition-colors">
                                            <Download className="w-4 h-4 inline mr-2" />
                                            Export Data
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-12 text-center">
                                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                                    Ready to Parse Your Syllabus?
                                </h3>
                                <p className="text-gray-500 dark:text-gray-500 mb-4">
                                    Upload a PDF file to extract structured syllabus content
                                </p>
                                <div className="inline-flex items-center gap-2 text-sm text-gray-400">
                                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                    AI-powered parsing ready
                                </div>
                            </div>
                        )}

                        {/* Features Info */}
                        <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border border-gray-200/50 dark:border-gray-700/50 p-6">
                            <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-3">✨ Features</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    Intelligent content extraction
                                </div>
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    Automatic topic categorization
                                </div>
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    Confidence scoring
                                </div>
                                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                                    Structured output format
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default SyllabusPdfParser;