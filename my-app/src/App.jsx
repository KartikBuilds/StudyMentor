import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';

import { AuthProvider } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import HomePage from './components/HomePage';
import LoginPage from './components/LoginPage';
import UserDashboard from './components/UserDashboard';
import SyllabusPdfParser from './components/SyllabusPdfParser';
import StudyPlanGenerator from './components/StudyPlanGenerator';
import FlashcardGenerator from './components/FlashcardGenerator';
import QuizGenerator from './components/QuizGenerator';
import AIStudyBuddy from './components/AIStudyBuddy';
import SyllabusHub from './components/SyllabusHub';
import { useAuth } from './contexts/AuthContext';

function AppLayout() {
  const location = useLocation();
  const { isAuthenticated } = useAuth();
  const isLoginPage = location.pathname === '/login';

  if (isLoginPage) {
    return <LoginPage />;
  }

  return (
    <>
      <Navbar />
      <main className="min-h-screen w-screen bg-gradient-to-br from-slate-100 via-slate-200 to-slate-100 dark:from-gray-900 dark:via-gray-950 dark:to-gray-900 flex flex-col items-center justify-start">
        <div className="w-full max-w-7xl flex-1 px-2 sm:px-6 lg:px-8 py-6">
          <Routes>
            {/* Auto-redirect to dashboard if authenticated, otherwise show homepage */}
            <Route path="/" element={
              isAuthenticated ? <Navigate to="/dashboard" replace /> : <HomePage />
            } />
            <Route path="/home" element={<HomePage />} />

            {/* All routes accessible in demo mode */}
            {/* Protected routes */}
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <UserDashboard />
              </ProtectedRoute>
            } />
            <Route path="/syllabus-hub" element={
              <ProtectedRoute>
                <SyllabusHub />
              </ProtectedRoute>
            } />
            <Route path="/ai-buddy" element={
              <ProtectedRoute>
                <div className="h-[calc(100vh-8rem)]">
                  <AIStudyBuddy />
                </div>
              </ProtectedRoute>
            } />
            <Route path="/flashcards" element={<FlashcardGenerator />} />
            <Route path="/study-plan" element={<StudyPlanGenerator />} />
            <Route path="/quiz" element={<QuizGenerator />} />
            <Route path="/syllabus-pdf" element={<SyllabusPdfParser />} />

            {/* Catch all route */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </main>
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/*" element={<AppLayout />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
