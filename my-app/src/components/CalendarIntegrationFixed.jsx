import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, AlertCircle, Loader, LogIn } from 'lucide-react';

const CalendarIntegration = ({ studyPlan, onClose }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(''); // 'success' or 'error'
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [accessToken, setAccessToken] = useState(null);
    const [startDate, setStartDate] = useState(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    });

    // Initialize Google API
    useEffect(() => {
        const initGoogleAPI = () => {
            // Load the Google API script
            const script = document.createElement('script');
            script.src = 'https://apis.google.com/js/api.js';
            script.onload = () => {
                window.gapi.load('auth2', () => {
                    window.gapi.auth2.init({
                        client_id: '764086051850-6qr4p6gpi6hn506pt8ejuq83di341hur.apps.googleusercontent.com'
                    });
                });
            };
            document.body.appendChild(script);
        };

        initGoogleAPI();
    }, []);

    const handleGoogleSignIn = async () => {
        try {
            setIsLoading(true);
            setMessage('Opening Google sign-in...');
            setMessageType('success');

            // Check if gapi is loaded
            if (!window.gapi || !window.gapi.auth2) {
                throw new Error('Google API not loaded');
            }

            const authInstance = window.gapi.auth2.getAuthInstance();

            // Sign in with Google
            const user = await authInstance.signIn({
                scope: 'https://www.googleapis.com/auth/calendar'
            });

            // Get access token
            const authResponse = user.getAuthResponse();
            setAccessToken(authResponse.access_token);
            setIsAuthenticated(true);

            setMessage('Successfully signed in! Now creating calendar events...');
            setMessageType('success');

            // Load calendar API and create events
            await loadCalendarAPIAndCreateEvents(authResponse.access_token);

        } catch (error) {
            console.error('Sign-in error:', error);

            if (error.error === 'popup_closed_by_user') {
                setMessage('Sign-in was cancelled. Please try again.');
            } else if (error.error === 'access_denied') {
                setMessage('Access denied. Please grant calendar permissions to sync your study plan.');
            } else {
                setMessage('Failed to sign in to Google. Please try again.');
            }

            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    const loadCalendarAPIAndCreateEvents = async (token) => {
        try {
            // Load the calendar API
            await new Promise((resolve, reject) => {
                window.gapi.load('client', {
                    callback: resolve,
                    onerror: reject
                });
            });

            await window.gapi.client.init({
                apiKey: 'AIzaSyBUwOlQZYDtXL4CVP9qDSqx4t8oZXjUGHE',
                discoveryDocs: ['https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest']
            });

            // Set the access token
            window.gapi.client.setToken({ access_token: token });

            // Create calendar events
            await createCalendarEvents();

        } catch (error) {
            console.error('Calendar API error:', error);
            setMessage('Failed to load calendar API. Please try again.');
            setMessageType('error');
        }
    };

    const createCalendarEvents = async () => {
        try {
            const dailyPlans = studyPlan.daily_plans || {};
            let eventsCreated = 0;
            const startDateTime = new Date(startDate);

            for (const [day, tasks] of Object.entries(dailyPlans)) {
                if (!tasks || tasks.length === 0) {
                    startDateTime.setDate(startDateTime.getDate() + 1);
                    continue;
                }

                // Morning session (9 AM - 12 PM)
                const morningStart = new Date(startDateTime);
                morningStart.setHours(9, 0, 0, 0);
                const morningEnd = new Date(morningStart);
                morningEnd.setHours(12, 0, 0, 0);

                // Afternoon session (2 PM - 5 PM)
                const afternoonStart = new Date(startDateTime);
                afternoonStart.setHours(14, 0, 0, 0);
                const afternoonEnd = new Date(afternoonStart);
                afternoonEnd.setHours(17, 0, 0, 0);

                const midPoint = Math.ceil(tasks.length / 2);
                const morningTasks = tasks.slice(0, midPoint);
                const afternoonTasks = tasks.slice(midPoint);

                // Create morning event
                if (morningTasks.length > 0) {
                    const morningEvent = {
                        summary: `📚 Study Session - ${day} (Morning)`,
                        description: `🎯 StudyMentor AI-Generated Study Session\n\n📋 Tasks for this session:\n${morningTasks.map((task, i) => `${i + 1}. ${task}`).join('\n')}\n\n💡 Generated by StudyMentor - Your AI Learning Companion`,
                        start: {
                            dateTime: morningStart.toISOString(),
                            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                        },
                        end: {
                            dateTime: morningEnd.toISOString(),
                            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                        },
                        reminders: {
                            useDefault: false,
                            overrides: [
                                { method: 'popup', minutes: 30 },
                                { method: 'popup', minutes: 10 }
                            ]
                        }
                    };

                    await window.gapi.client.calendar.events.insert({
                        calendarId: 'primary',
                        resource: morningEvent
                    });
                    eventsCreated++;
                }

                // Create afternoon event
                if (afternoonTasks.length > 0) {
                    const afternoonEvent = {
                        summary: `📖 Study Session - ${day} (Afternoon)`,
                        description: `🎯 StudyMentor AI-Generated Study Session\n\n📋 Tasks for this session:\n${afternoonTasks.map((task, i) => `${i + 1}. ${task}`).join('\n')}\n\n💡 Generated by StudyMentor - Your AI Learning Companion`,
                        start: {
                            dateTime: afternoonStart.toISOString(),
                            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                        },
                        end: {
                            dateTime: afternoonEnd.toISOString(),
                            timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone
                        },
                        reminders: {
                            useDefault: false,
                            overrides: [
                                { method: 'popup', minutes: 30 },
                                { method: 'popup', minutes: 10 }
                            ]
                        }
                    };

                    await window.gapi.client.calendar.events.insert({
                        calendarId: 'primary',
                        resource: afternoonEvent
                    });
                    eventsCreated++;
                }

                startDateTime.setDate(startDateTime.getDate() + 1);
            }

            setMessage(`🎉 Success! Created ${eventsCreated} study sessions in your Google Calendar!\n\nOpen Google Calendar to see your new study events. Each session includes:\n• Detailed task descriptions\n• 30 & 10-minute reminders\n• Optimized time blocks for focused learning`);
            setMessageType('success');

        } catch (error) {
            console.error('Calendar creation error:', error);

            if (error.status === 403) {
                setMessage('Permission denied. Please make sure you granted calendar access during sign-in.');
            } else {
                setMessage('Failed to create calendar events. Please try signing in again.');
            }

            setMessageType('error');
        }
    };

    const handleSignOut = () => {
        if (window.gapi && window.gapi.auth2) {
            const authInstance = window.gapi.auth2.getAuthInstance();
            authInstance.signOut();
        }
        setIsAuthenticated(false);
        setAccessToken(null);
        setMessage('');
    };

    const formatStudyPlanSummary = () => {
        if (!studyPlan) return null;

        const dailyPlans = studyPlan.daily_plans || {};
        const totalDays = Object.keys(dailyPlans).length;
        const subjects = studyPlan.subjects || [];

        return (
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 mb-6 border border-blue-200">
                <h4 className="font-semibold text-gray-800 mb-3 flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-blue-600" />
                    📋 Study Plan Summary
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-700">
                    <div className="flex items-center">
                        <span className="font-medium">📅 Total Days:</span>
                        <span className="ml-2 px-2 py-1 bg-blue-100 rounded-full text-blue-800 font-semibold">{totalDays}</span>
                    </div>
                    <div className="flex items-center">
                        <span className="font-medium">⏱️ Total Hours:</span>
                        <span className="ml-2 px-2 py-1 bg-indigo-100 rounded-full text-indigo-800 font-semibold">{studyPlan.total_hours || 'N/A'}</span>
                    </div>
                    <div className="col-span-2">
                        <span className="font-medium">📚 Subjects:</span>
                        <div className="mt-1 flex flex-wrap gap-1">
                            {subjects.map((subject, index) => (
                                <span key={index} className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                                    {subject}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    if (!studyPlan) {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
                    <div className="text-center">
                        <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">No Study Plan</h3>
                        <p className="text-gray-600 mb-4">
                            Please generate a study plan first before syncing to calendar.
                        </p>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg">
                            <Calendar className="h-6 w-6 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900">
                            Add to Google Calendar
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
                    >
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {formatStudyPlanSummary()}

                {/* Google Sign In Section */}
                {!isAuthenticated ? (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center space-x-3 mb-3">
                            <LogIn className="h-5 w-5 text-blue-600" />
                            <h4 className="font-medium text-blue-900">Sign in to Google</h4>
                        </div>
                        <p className="text-sm text-blue-800 mb-4">
                            Sign in with your Google account to sync your study plan to Google Calendar.
                        </p>
                        <button
                            onClick={handleGoogleSignIn}
                            disabled={isLoading}
                            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                        >
                            {isLoading ? (
                                <Loader className="h-5 w-5 animate-spin text-blue-600" />
                            ) : (
                                <svg className="h-5 w-5" viewBox="0 0 24 24">
                                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                </svg>
                            )}
                            <span>
                                {isLoading ? 'Signing in...' : 'Sign in with Google'}
                            </span>
                        </button>
                    </div>
                ) : (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <p className="text-sm text-green-800">Successfully signed in to Google!</p>
                            </div>
                            <button
                                onClick={handleSignOut}
                                className="text-sm text-green-700 hover:text-green-900 underline"
                            >
                                Sign out
                            </button>
                        </div>
                    </div>
                )}

                <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                        <Clock className="inline h-4 w-4 mr-1" />
                        Start Date
                    </label>
                    <input
                        type="date"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                        min={new Date().toISOString().split('T')[0]}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                        Study sessions will be scheduled starting from this date
                    </p>
                </div>

                {message && (
                    <div className={`mb-6 p-4 rounded-lg flex items-start space-x-3 ${messageType === 'success'
                            ? 'bg-green-50 border border-green-200'
                            : 'bg-red-50 border border-red-200'
                        }`}>
                        {messageType === 'success' ? (
                            <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                        ) : (
                            <AlertCircle className="h-5 w-5 text-red-600 mt-0.5 flex-shrink-0" />
                        )}
                        <div className={`text-sm ${messageType === 'success' ? 'text-green-800' : 'text-red-800'
                            }`}>
                            <pre className="whitespace-pre-wrap font-sans">{message}</pre>
                        </div>
                    </div>
                )}

                <div className="mt-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                    <h4 className="font-medium text-blue-900 mb-2 flex items-center">
                        <span className="mr-2">📝</span>
                        What will be created in your Google Calendar:
                    </h4>
                    <ul className="text-sm text-blue-800 space-y-1.5 list-none">
                        <li className="flex items-center"><span className="mr-2">🌅</span>Morning sessions: 9:00 AM - 12:00 PM</li>
                        <li className="flex items-center"><span className="mr-2">🌆</span>Afternoon sessions: 2:00 PM - 5:00 PM</li>
                        <li className="flex items-center"><span className="mr-2">📋</span>Detailed task descriptions for each session</li>
                        <li className="flex items-center"><span className="mr-2">🔔</span>Reminders 30 and 10 minutes before</li>
                        <li className="flex items-center"><span className="mr-2">🎯</span>AI-optimized study schedule</li>
                        <li className="flex items-center"><span className="mr-2">✨</span>Real Google Calendar integration!</li>
                    </ul>
                </div>

                <div className="mt-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors hover:bg-gray-100 rounded-lg"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CalendarIntegration;