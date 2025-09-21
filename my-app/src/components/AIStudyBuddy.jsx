import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Send, Bot, User, Sparkles, BookOpen, Brain,
    MessageCircle, Lightbulb, ChevronDown, Trash2,
    Copy, ThumbsUp, ThumbsDown
} from 'lucide-react';
import { geminiAPI } from '../utils/geminiAPI';

const AIStudyBuddy = () => {
    const [messages, setMessages] = useState([]);
    const [inputMessage, setInputMessage] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(true);
    const [geminiConnected, setGeminiConnected] = useState(false);
    const [apiKeyConfigured, setApiKeyConfigured] = useState(false);
    const messagesEndRef = useRef(null);
    const inputRef = useRef(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        // Check if Gemini API key is configured
        const checkAPIStatus = async () => {
            const hasApiKey = !!(import.meta.env.VITE_GEMINI_API_KEY);
            setApiKeyConfigured(hasApiKey);

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

            if (hasApiKey) {
                try {
                    const connected = await geminiAPI.testConnection();
                    setGeminiConnected(connected);

                    if (connected) {
                        welcomeMessage.content = "Hi! I'm your AI Study Buddy powered by Gemini! 🤖✨ I'm connected and ready to help you with any study questions, explain concepts, or assist with your learning journey. What would you like to study today?";
                    } else {
                        welcomeMessage.content = "Hi! I'm your AI Study Buddy. ⚠️ I'm having trouble connecting to Gemini right now, but I can still help with basic study questions using my built-in knowledge. What would you like to study?";
                    }
                } catch (error) {
                    console.error('Gemini connection test failed:', error);
                    setGeminiConnected(false);
                    welcomeMessage.content = "Hi! I'm your AI Study Buddy. ⚠️ Gemini API connection failed, but I can still help with basic study questions using mock responses. What would you like to study?";
                }
            } else {
                welcomeMessage.content = "Hi! I'm your AI Study Buddy. 🔧 To use Gemini AI, please add your API key to the .env file (VITE_GEMINI_API_KEY). For now, I'll use demo responses. What would you like to study?";
            }

            setMessages([welcomeMessage]);
        };

        checkAPIStatus();
    }, []);

    // AI response function using direct Gemini API
    const getAIResponse = async (userMessage) => {
        try {
            // Get conversation context (last few messages for better context)
            const recentMessages = messages.slice(-5).map(msg => ({
                role: msg.type === 'user' ? 'user' : 'assistant',
                content: msg.content
            }));

            // Call Gemini API directly
            const aiResponseData = await geminiAPI.chatWithStudyBuddy(
                userMessage,
                recentMessages
            );

            return {
                content: aiResponseData.response,
                suggested: aiResponseData.suggested_questions || []
            };
        } catch (error) {
            console.error('AI API Error:', error);
            // Fallback to mock responses if API fails
            return getMockResponse(userMessage);
        }
    };

    // Fallback mock responses
    const getMockResponse = (userMessage) => {
        const lowerMessage = userMessage.toLowerCase();

        if (lowerMessage.includes('quantum') || lowerMessage.includes('physics')) {
            return {
                content: "Quantum physics is the study of matter and energy at the smallest scales! 🔬\n\nKey concepts:\n• **Wave-particle duality**: Light and matter exhibit both wave and particle properties\n• **Uncertainty principle**: You can't know both position and momentum precisely\n• **Superposition**: Particles can exist in multiple states simultaneously\n• **Entanglement**: Particles can be mysteriously connected\n\nThink of it like this: imagine a coin that's spinning - it's both heads and tails until it lands! That's superposition in everyday terms. 🪙✨",
                suggested: ["Tell me more about wave-particle duality", "What is Schrödinger's cat?", "Explain quantum entanglement"]
            };
        } else if (lowerMessage.includes('calculus') || lowerMessage.includes('derivative')) {
            return {
                content: "Derivatives in calculus measure how fast something changes! 📈\n\n**Basic rules:**\n• d/dx(x^n) = n·x^(n-1) - Power rule\n• d/dx(sin x) = cos x\n• d/dx(cos x) = -sin x\n• d/dx(e^x) = e^x\n\n**Example:** If f(x) = x³, then f'(x) = 3x²\n\nThink of derivatives as the \"speedometer\" of functions - they tell you the rate of change at any point! 🚗💨",
                suggested: ["Show me integration examples", "What's the chain rule?", "Practice derivative problems"]
            };
        } else if (lowerMessage.includes('study plan') || lowerMessage.includes('exam')) {
            return {
                content: "I'd love to help you create a study plan! 📚✨\n\n**Effective study plan structure:**\n1. **Assessment** (Week 1): Identify topics and difficulty\n2. **Foundation** (Week 2-3): Cover basic concepts\n3. **Practice** (Week 4-5): Solve problems and exercises\n4. **Review** (Week 6): Intensive revision\n5. **Mock tests** (Final week): Simulate exam conditions\n\n**Daily routine:**\n• 🌅 Morning: Difficult subjects (peak focus)\n• 🌆 Afternoon: Practice problems\n• 🌙 Evening: Review and light reading\n\nWhat subjects are you preparing for?",
                suggested: ["Help with time management", "Create biology study plan", "Math exam preparation tips"]
            };
        } else if (lowerMessage.includes('biology') || lowerMessage.includes('cell')) {
            return {
                content: "Biology is the study of life! 🧬🌱\n\n**Key concepts to master:**\n• **Cell biology**: Prokaryotes vs Eukaryotes\n• **Genetics**: DNA, RNA, protein synthesis\n• **Evolution**: Natural selection, adaptation\n• **Ecology**: Ecosystems, food chains\n• **Physiology**: How body systems work\n\n**Study tip**: Use mnemonics! Like \"King Philip Came Over For Good Soup\" for taxonomy (Kingdom, Phylum, Class, Order, Family, Genus, Species) 🍲👑",
                suggested: ["Explain photosynthesis", "What is mitosis vs meiosis?", "Tell me about DNA structure"]
            };
        } else {
            // Generic helpful response
            return {
                content: `Great question! 🤔💭\n\nI'd be happy to help you with "${userMessage}". While I don't have specific information about this topic right now, I can suggest some study strategies:\n\n• **Break it down**: Divide complex topics into smaller parts\n• **Active recall**: Test yourself without looking at notes\n• **Spaced repetition**: Review material at increasing intervals\n• **Teach others**: Explain concepts to reinforce understanding\n\nWould you like me to help you with a specific subject like Math, Science, History, or Languages? I can provide more targeted assistance! 📖✨`,
                suggested: ["Help with mathematics", "Science concepts", "History topics", "Language learning"]
            };
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
        } catch (error) {
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
                                    {apiKeyConfigured && geminiConnected ? 'Powered by Gemini ✨' :
                                        apiKeyConfigured ? 'Gemini (Connecting...) ⏳' :
                                            'Demo Mode 🔧'}
                                </p>
                                <div className={`w-2 h-2 rounded-full ${apiKeyConfigured && geminiConnected ? 'bg-green-400' :
                                        apiKeyConfigured ? 'bg-yellow-400' :
                                            'bg-red-400'
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