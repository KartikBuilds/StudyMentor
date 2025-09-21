import React, { useState } from 'react';
import { BookOpen, RefreshCw, Download, Eye, EyeOff, Shuffle, CheckCircle, Target, Zap, Clock, Play, Square, ChevronLeft, ChevronRight, Sparkles, Brain, Trophy } from 'lucide-react';
import { syllabusAPI } from '../utils/api';



export default function FlashcardGenerator() {
  const [topic, setTopic] = useState("");
  const [numCards, setNumCards] = useState(5);
  const [difficulty, setDifficulty] = useState("medium");
  const [useMock, setUseMock] = useState(true);
  const [loading, setLoading] = useState(false);
  const [flashcards, setFlashcards] = useState(null);
  const [error, setError] = useState("");

  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [studyMode, setStudyMode] = useState(false);
  const [mastered, setMastered] = useState(new Set());
  const [direction, setDirection] = useState(0); // 1 = next, -1 = prev

  const difficulties = [
    { label: 'Easy', value: 'easy', color: 'green', icon: '🟢' },
    { label: 'Medium', value: 'medium', color: 'yellow', icon: '🟡' },
    { label: 'Hard', value: 'hard', color: 'red', icon: '🔴' },
  ];

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setFlashcards(null);
    setStudyMode(false);
    setCurrentCardIndex(0);
    setShowAnswer(false);
    setMastered(new Set());

    try {
      if (useMock) {
        // Simulate API call for demo
        await new Promise(resolve => setTimeout(resolve, 2500));
        const mockFlashcards = Array.from({ length: numCards }, (_, i) => ({
          id: i + 1,
          front: `Question ${i + 1} about ${topic}?`,
          back: `Answer ${i + 1} explaining the concept of ${topic} in detail.`,
          difficulty: difficulty,
          category: topic
        }));
        setFlashcards(mockFlashcards);
      } else {
        const response = await syllabusAPI.generateFlashcards({
          topic,
          num_cards: numCards,
          difficulty,
          use_mock: useMock
        });
        setFlashcards(response.data.data.flashcards);
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const shuffleCards = () => {
    if (!flashcards) return;
    setFlashcards([...flashcards].sort(() => Math.random() - 0.5));
    setCurrentCardIndex(0);
    setShowAnswer(false);
  };

  const nextCard = () => {
    if (currentCardIndex < flashcards.length - 1) {
      setDirection(1);
      setCurrentCardIndex(currentCardIndex + 1);
      setShowAnswer(false);
    }
  };

  const prevCard = () => {
    if (currentCardIndex > 0) {
      setDirection(-1);
      setCurrentCardIndex(currentCardIndex - 1);
      setShowAnswer(false);
    }
  };

  const markAsMastered = (cardId) => {
    const newMastered = new Set(mastered);
    if (newMastered.has(cardId)) newMastered.delete(cardId);
    else newMastered.add(cardId);
    setMastered(newMastered);
  };

  const exportFlashcards = () => {
    if (!flashcards) return;
    const content = flashcards.map(c => `Q: ${c.front}\nA: ${c.back}`).join("\n\n");
    const blob = new Blob([content], { type: "text/plain" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${topic}-flashcards.txt`;
    a.click();
  };

  const getDifficultyColor = (diff) => {
    const colors = {
      easy: 'from-green-500 to-emerald-500',
      medium: 'from-yellow-500 to-orange-500',
      hard: 'from-red-500 to-rose-500'
    };
    return colors[diff] || colors.medium;
  };

  const getDifficultyBg = (diff) => {
    const colors = {
      easy: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
      medium: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300',
      hard: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
    };
    return colors[diff] || colors.medium;
  };

  const currentCard = flashcards && flashcards[currentCardIndex];
  const masteredCount = mastered.size;
  const progressPercentage = flashcards ? (masteredCount / flashcards.length) * 100 : 0;

  return (
    <div className="min-h-screen w-full flex flex-col">
      {/* Hero Section */}
      <section className="w-full bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-indigo-900/20 py-12 px-4 animate-fade-in">
        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-2xl mb-6 shadow-xl animate-bounce-slow">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-4 drop-shadow-lg">
            Flashcard Generator
          </h1>
          <p className="text-lg md:text-xl text-gray-700 dark:text-gray-200 max-w-2xl mx-auto mb-6">
            Transform your study material into interactive flashcards powered by AI. Master any topic with personalized learning cards designed for maximum retention.
          </p>
          <div className="flex flex-wrap gap-4 justify-center items-center">
            <div className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 rounded-full shadow-md backdrop-blur-sm">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm text-gray-600 dark:text-gray-300">AI-Powered Generation</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-white/80 dark:bg-gray-800/80 rounded-full shadow-md backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-cyan-500" />
              <span className="text-sm text-gray-600 dark:text-gray-300">Interactive Study Mode</span>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <div className="flex-1 p-4">
        <div className="max-w-6xl mx-auto">

          <div className="grid lg:grid-cols-3 gap-8">
            {/* Settings Panel */}
            <div className="lg:col-span-1 animate-fade-in">
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-6 sticky top-4 hover:shadow-3xl transition-all duration-300 transform hover:scale-[1.02]">
                <div className="flex items-center gap-2 mb-6">
                  <Target className="w-5 h-5 text-cyan-600" />
                  <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">Card Settings</h2>
                </div>

                <div className="space-y-6">
                  {/* Topic */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="w-4 h-4 text-cyan-600" />
                      <label className="font-medium text-gray-700 dark:text-gray-300">Topic</label>
                    </div>
                    <input
                      value={topic}
                      onChange={e => setTopic(e.target.value)}
                      placeholder="Enter topic..."
                      className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 transform focus:scale-[1.02] hover:shadow-md"
                    />
                  </div>

                  {/* Number of Cards */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-cyan-600" />
                      <label className="font-medium text-gray-700 dark:text-gray-300">Number of Cards</label>
                    </div>
                    <input
                      type="number"
                      min={1}
                      max={50}
                      value={numCards}
                      onChange={e => setNumCards(Number(e.target.value))}
                      className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-cyan-500 focus:border-transparent transition-all duration-300 transform focus:scale-[1.02] hover:shadow-md"
                    />
                  </div>

                  {/* Difficulty */}
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <Zap className="w-4 h-4 text-cyan-600" />
                      <label className="font-medium text-gray-700 dark:text-gray-300">Difficulty</label>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      {difficulties.map(d => (
                        <button
                          key={d.value}
                          type="button"
                          className={`p-3 rounded-lg border text-sm font-medium transition-all ${difficulty === d.value
                            ? `bg-gradient-to-r ${getDifficultyColor(d.value)} text-white border-transparent shadow-lg`
                            : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-600 hover:border-cyan-300'
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
                      id="useMock"
                      checked={useMock}
                      onChange={e => setUseMock(e.target.checked)}
                      className="w-4 h-4 text-cyan-600 rounded focus:ring-cyan-500"
                    />
                    <label htmlFor="useMock" className="text-gray-700 dark:text-gray-300 cursor-pointer">
                      Use Mock Data for Demo
                    </label>
                  </div>

                  {/* Generate Button */}
                  <button
                    onClick={handleGenerate}
                    disabled={loading || !topic.trim()}
                    className="w-full py-3 px-6 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
                  >
                    <div className="flex items-center justify-center gap-2">
                      {loading ? (
                        <>
                          <RefreshCw className="w-5 h-5 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5" />
                          Generate Cards
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

                  {/* Study Stats */}
                  {flashcards && (
                    <div className="space-y-3">
                      <div className="text-center p-4 bg-cyan-50 dark:bg-cyan-900/20 rounded-xl">
                        <Trophy className="w-6 h-6 text-cyan-600 mx-auto mb-2" />
                        <div className="text-2xl font-bold text-cyan-600 dark:text-cyan-400">{masteredCount}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">Cards Mastered</div>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                      <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                        {Math.round(progressPercentage)}% Complete
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6 animate-fade-in-up">
              {flashcards ? (
                <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-md rounded-2xl shadow-2xl border border-gray-200/50 dark:border-gray-700/50 p-8 hover:shadow-3xl transition-all duration-300">
                  {/* Header Controls */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                      <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">
                        {flashcards.length} Flashcards
                      </h3>
                      <span className="px-3 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300 rounded-full text-sm font-medium">
                        {topic}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={shuffleCards}
                        className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <Shuffle className="w-4 h-4" />
                        Shuffle
                      </button>
                      <button
                        onClick={exportFlashcards}
                        className="px-3 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg flex items-center gap-1 transition-colors"
                      >
                        <Download className="w-4 h-4" />
                        Export
                      </button>
                      <button
                        onClick={() => setStudyMode(!studyMode)}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${studyMode
                          ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 hover:bg-green-200'
                          : 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-800 dark:text-cyan-300 hover:bg-cyan-200'
                          }`}
                      >
                        <div className="flex items-center gap-2">
                          {studyMode ? <Square className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          {studyMode ? 'Exit Study Mode' : 'Study Mode'}
                        </div>
                      </button>
                    </div>
                  </div>

                  {studyMode && currentCard ? (
                    /* Study Mode */
                    <div className="space-y-6">
                      {/* Navigation */}
                      <div className="flex justify-between items-center">
                        <button
                          onClick={prevCard}
                          disabled={currentCardIndex === 0}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Previous
                        </button>
                        <div className="text-center flex-1 mx-4">
                          <div className="text-sm text-gray-500 dark:text-gray-400 mb-2">
                            Card {currentCardIndex + 1} of {flashcards.length}
                          </div>
                          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div
                              className="bg-gradient-to-r from-cyan-500 to-blue-500 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${((currentCardIndex + 1) / flashcards.length) * 100}%` }}
                            />
                          </div>
                        </div>
                        <button
                          onClick={nextCard}
                          disabled={currentCardIndex === flashcards.length - 1}
                          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                        >
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>

                      {/* Flashcard */}
                      <div
                        className="relative bg-gradient-to-br from-white via-cyan-50/30 to-blue-50/30 dark:from-gray-800 dark:via-cyan-900/10 dark:to-blue-900/10 rounded-2xl shadow-2xl p-8 min-h-[350px] flex flex-col justify-center items-center cursor-pointer border border-cyan-200/50 dark:border-cyan-700/50 hover:shadow-3xl transition-all duration-500 transform hover:scale-[1.03] hover:rotate-1 group animate-fade-in"
                        onClick={() => setShowAnswer(!showAnswer)}
                      >
                        <div className="absolute top-4 right-4 flex items-center gap-2">
                          <span className={`px-3 py-1 rounded-full text-sm font-medium ${getDifficultyBg(currentCard.difficulty)}`}>
                            {difficulties.find(d => d.value === currentCard.difficulty)?.icon} {currentCard.difficulty}
                          </span>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-4">
                            {showAnswer ? 'Answer' : 'Question'}
                          </div>
                          <div className="text-2xl font-bold text-gray-800 dark:text-gray-200 mb-6 leading-relaxed">
                            {showAnswer ? currentCard.back : currentCard.front}
                          </div>
                          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                            {showAnswer ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            Click to {showAnswer ? 'show question' : 'reveal answer'}
                          </div>
                        </div>
                      </div>

                      {/* Card Actions */}
                      <div className="flex justify-center">
                        <button
                          onClick={() => markAsMastered(currentCard.id)}
                          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all transform hover:scale-105 ${mastered.has(currentCard.id)
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 hover:bg-green-200'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200'
                            }`}
                        >
                          <CheckCircle className="w-5 h-5" />
                          {mastered.has(currentCard.id) ? 'Mastered' : 'Mark as Mastered'}
                        </button>
                      </div>
                    </div>
                  ) : (
                    /* List Mode */
                    <div className="grid gap-4 max-h-96 overflow-y-auto">
                      {flashcards.map((card, index) => (
                        <div
                          key={card.id}
                          className={`border rounded-xl p-4 transition-all duration-200 hover:shadow-lg cursor-pointer ${mastered.has(card.id)
                            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-700'
                            : 'bg-gray-50 dark:bg-gray-700/50 border-gray-200 dark:border-gray-600 hover:bg-white dark:hover:bg-gray-700'
                            }`}
                        >
                          <div className="flex justify-between items-start mb-3">
                            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">#{index + 1}</span>
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyBg(card.difficulty)}`}>
                                {difficulties.find(d => d.value === card.difficulty)?.icon} {card.difficulty}
                              </span>
                              <span className="px-2 py-1 bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-300 rounded-full text-xs">
                                {card.category}
                              </span>
                              <button
                                onClick={() => markAsMastered(card.id)}
                                className={`p-1 rounded-full transition-colors ${mastered.has(card.id)
                                  ? 'text-green-600 dark:text-green-400'
                                  : 'text-gray-400 hover:text-green-600'
                                  }`}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <div className="flex items-start gap-2">
                              <span className="font-semibold text-blue-800 dark:text-blue-300 text-sm">Q:</span>
                              <span className="text-gray-800 dark:text-gray-200 text-sm">{card.front}</span>
                            </div>
                            <div className="flex items-start gap-2">
                              <span className="font-semibold text-green-800 dark:text-green-300 text-sm">A:</span>
                              <span className="text-gray-700 dark:text-gray-300 text-sm">{card.back}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-gradient-to-br from-white/80 via-cyan-50/50 to-blue-50/50 dark:from-gray-800/80 dark:via-cyan-900/20 dark:to-blue-900/20 backdrop-blur-md rounded-2xl border-2 border-dashed border-cyan-300/50 dark:border-cyan-600/50 p-12 text-center hover:shadow-xl transition-all duration-300 animate-fade-in">
                  <div className="animate-bounce-slow">
                    <Brain className="w-20 h-20 text-cyan-500 mx-auto mb-6" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-700 dark:text-gray-300 mb-3">
                    Ready to Create Flashcards?
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
                    Enter a topic and configure your settings to generate interactive study cards powered by AI
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
                    <div className="inline-flex items-center gap-2 text-sm text-cyan-600 dark:text-cyan-400 bg-cyan-100/50 dark:bg-cyan-900/20 px-4 py-2 rounded-full">
                      <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
                      AI-powered generation
                    </div>
                    <div className="inline-flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 bg-blue-100/50 dark:bg-blue-900/20 px-4 py-2 rounded-full">
                      <Sparkles className="w-4 h-4" />
                      Interactive study mode
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}