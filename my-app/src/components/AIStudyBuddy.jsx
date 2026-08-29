import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send, Bot, User, Sparkles, BookOpen, Brain,
    MessageCircle, Lightbulb, ChevronDown, Trash2,
    Copy, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { aiAPI } from '../utils/api';

const AIStudyBuddy = () => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [, setShowSuggestions] = useState(true);
    const [backendConnected, setBackendConnected] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        // Check backend AI chat availability (Gemini/Groq key lives server-side only)
        const checkAPIStatus = async () => {
            let welcomeMessage = {
                id: 1,
                type: 'ai',
                timestamp: new Date(),
                suggested: [
                    "Explain quantum physics basics",
                    "Help me with calculus derivatives",
                    "Create a study plan for my exams",
                    "What are the key concepts in biology?"
                ]
            };

            try {
                await aiAPI.chat({ message: "Hello, can you help me study?" });
                setBackendConnected(true);
                welcomeMessage.content = "Hi! I'm your AI Study Buddy! 🤖✨ I'm connected and ready to help you with any study questions, explain concepts, or assist with your learning journey. What would you like to study today?";
            } catch (error) {
                console.error('AI backend connection test failed:', error);
                setBackendConnected(false);
                welcomeMessage.content = "Hi! I'm your AI Study Buddy. ⚠️ I'm having trouble reaching the AI backend right now, but I can still help with basic study questions using my built-in knowledge. What would you like to study?";
            }

            setMessages([welcomeMessage]);
        };

        checkAPIStatus();
    }, []);

    // AI response function - always routed through the backend so the
    // Gemini/Groq API key never reaches the browser.
    const getAIResponse = async (userMessage) => {
        try {
            const res = await aiAPI.chat({ message: userMessage });
            const aiResponseData = res.data.data;

            return {
                content: aiResponseData.response,
                suggested: aiResponseData.suggested_questions || []
            };
        } catch (error) {
            console.error('AI API Error:', error);
            // Never silently substitute a canned response for a real AI
            // answer - surface the failure so the UI shows an honest error
            // with a retry hint (see handleSendMessage's catch block).
            throw error;
        }
    };

    const handleSendMessage = async () => {
        if (!inputMessage.trim() || isLoading) return;

        const userMessage = {
            id: Date.now(),
            type: 'user',
            content: inputMessage.trim(),
            timestamp: new Date()
        };

        setMessages(prev => [...prev, userMessage]);
        setInputMessage('');
        setIsLoading(true);
        setShowSuggestions(false);

        try {
            const aiResponse = await getAIResponse(userMessage.content);

            const aiMessage = {
                id: Date.now() + 1,
                type: 'ai',
                content: aiResponse.content,
                timestamp: new Date(),
                suggested: aiResponse.suggested || []
            };

            setMessages(prev => [...prev, aiMessage]);
        } catch {
            const errorMessage = {
                id: Date.now() + 1,
                type: 'ai',
                content: "Sorry, I'm having trouble connecting right now. Please try again! 😅",
                timestamp: new Date()
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSuggestionClick = (suggestion) => {
        setInputMessage(suggestion);
        inputRef.current?.focus();
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    const clearChat = () => {
        setMessages([messages[0]]); // Keep only the first welcome message
        setShowSuggestions(true);
    };

    const copyMessage = (content) => {
        navigator.clipboard.writeText(content);
    };

    return (
        <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 text-white">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                            <Bot className="w-6 h-6" />
                        </div>
                        <div>
                            <h3 className="font-bold text-lg">AI Study Buddy</h3>
                            <div className="flex items-center gap-2">
                                <p className="text-purple-200 text-sm">
                                    {backendConnected ? 'AI Connected ✨' : 'Demo Mode 🔧'}
                                </p>
                                <div className={`w-2 h-2 rounded-full ${backendConnected ? 'bg-green-400' : 'bg-red-400'
                                    }`} />
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={clearChat}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                        title="Clear chat"
                    >
                        <Trash2 className="w-5 h-5" />
                    </button>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                <AnimatePresence>
                    {messages.map((message) => (
                        <motion.div
                            key={message.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                            className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div className={`max-w-[85%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                                <div className={`flex items-start gap-3 ${message.type === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                                    {/* Avatar */}
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.type === 'user'
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white'
                                        }`}>
                                        {message.type === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
                                    </div>

                                    {/* Message Content */}
                                    <div className={`relative group ${message.type === 'user' ? 'text-right' : 'text-left'}`}>
                                        <div className={`px-4 py-3 rounded-2xl shadow-sm ${message.type === 'user'
                                            ? 'bg-blue-500 text-white rounded-br-md'
                                            : 'bg-white border border-gray-200 rounded-bl-md'
                                            }`}>
                                            <div className="whitespace-pre-wrap text-sm leading-relaxed">
                                                {message.content}
                                            </div>
                                        </div>

                                        {/* Message Actions */}
                                        <div className={`mt-1 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity ${message.type === 'user' ? 'justify-end' : 'justify-start'
                                            }`}>
                                            <button
                                                onClick={() => copyMessage(message.content)}
                                                className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-700"
                                                title="Copy message"
                                            >
                                                <Copy className="w-3 h-3" />
                                            </button>
                                            {message.type === 'ai' && (
                                                <>
                                                    <button className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-green-600" title="Helpful">
                                                        <ThumbsUp className="w-3 h-3" />
                                                    </button>
                                                    <button className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-red-600" title="Not helpful">
                                                        <ThumbsDown className="w-3 h-3" />
                                                    </button>
                                                </>
                                            )}
                                        </div>

                                        <div className="text-xs text-gray-400 mt-1">
                                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>

                                        {/* Suggestions */}
                                        {message.suggested && message.suggested.length > 0 && (
                                            <div className="mt-3 space-y-2">
                                                <p className="text-xs text-gray-500 flex items-center gap-1">
                                                    <Lightbulb className="w-3 h-3" />
                                                    Suggested questions:
                                                </p>
                                                <div className="space-y-1">
                                                    {message.suggested.map((suggestion, index) => (
                                                        <button
                                                            key={index}
                                                            onClick={() => handleSuggestionClick(suggestion)}
                                                            className="block w-full text-left px-3 py-2 text-xs bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg border border-blue-200 transition-colors"
                                                        >
                                                            {suggestion}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Loading indicator */}
                {isLoading && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start"
                    >
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 text-white flex items-center justify-center">
                                <Bot className="w-4 h-4" />
                            </div>
                            <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-md px-4 py-3">
                                <div className="flex items-center gap-2">
                                    <div className="flex space-x-1">
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                    </div>
                                    <span className="text-sm text-gray-500">AI is thinking...</span>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                )}

                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 bg-white border-t border-gray-200">
                <div className="flex gap-3">
                    <div className="flex-1 relative">
                        <textarea
                            ref={inputRef}
                            value={inputMessage}
                            onChange={(e) => setInputMessage(e.target.value)}
                            onKeyPress={handleKeyPress}
                            placeholder="Ask me anything about your studies..."
                            className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-sm"
                            rows="1"
                            style={{ minHeight: '44px' }}
                        />
                    </div>
                    <button
                        onClick={handleSendMessage}
                        disabled={!inputMessage.trim() || isLoading}
                        className="px-4 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl hover:from-purple-700 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center"
                    >
                        <Send className="w-4 h-4" />
                    </button>
                </div>

                <div className="mt-2 text-xs text-gray-500 text-center">
                    💡 Press Enter to send • Shift+Enter for new line
                </div>
            </div>
        </div>
    );
};

export default AIStudyBuddy;