import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, AlertCircle, Loader, LogIn } from 'lucide-react';

const CalendarIntegration = ({ studyPlan, onClose }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(''); // 'success' or 'error'
    const [isGoogleSignedIn, setIsGoogleSignedIn] = useState(false);
    const [googleAuth, setGoogleAuth] = useState(null);
    const [isGoogleApiLoading, setIsGoogleApiLoading] = useState(true);
    const [startDate, setStartDate] = useState(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    });

    // Using a public demo client ID that works with localhost
    const GOOGLE_CLIENT_ID = '764086051850-6qr4p6gpi6hn506pt8ejuq83di341hur.apps.googleusercontent.com';

    // Initialize Google Auth
    useEffect(() => {
        const initializeGoogleAuth = () => {
            setIsGoogleApiLoading(true);

            // Load Google Identity Services
            const script = document.createElement('script');
            script.src = 'https://accounts.google.com/gsi/client';
            script.async = true;
            script.defer = true;
            script.onload = () => {
                if (window.google) {
                    // Initialize Google Identity Services
                    window.google.accounts.id.initialize({
                        client_id: GOOGLE_CLIENT_ID,
                        callback: handleCredentialResponse,
                    });

                    setIsGoogleApiLoading(false);
                }
            };
            script.onerror = () => {
                setIsGoogleApiLoading(false);
                setMessage('Failed to load Google authentication. Please check your internet connection.');
                setMessageType('error');
            };

            document.head.appendChild(script);
        };

        initializeGoogleAuth();
    }, []);

    const handleCredentialResponse = (response) => {
        console.log('Google credential response:', response);
        // This will be called after successful sign-in
        setIsGoogleSignedIn(true);
        setMessage('Successfully signed in to Google!');
        setMessageType('success');
    };

    const handleGoogleSignIn = async () => {
        try {
            setIsLoading(true);
            setMessage('Opening Google sign-in...');
            setMessageType('success');

            // Method 1: Using Google Identity Services (newer approach)
            if (window.google && window.google.accounts) {
                window.google.accounts.id.prompt((notification) => {
                    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
                        // Try alternative sign-in method
                        initiateOAuthFlow();
                    }
                });
            } else {
                // Fallback to OAuth flow
                initiateOAuthFlow();
            }
        } catch (error) {
            console.error('Sign-in error:', error);
            setMessage('Failed to start Google sign-in. Please try again.');
            setMessageType('error');
            setIsLoading(false);
        }
    };

    const initiateOAuthFlow = () => {
        // OAuth 2.0 flow for Google Calendar access
        const oauth2Endpoint = 'https://accounts.google.com/o/oauth2/v2/auth';
        const redirectUri = window.location.origin;

        const params = new URLSearchParams({
            client_id: GOOGLE_CLIENT_ID,
            redirect_uri: redirectUri,
            response_type: 'token',
            scope: 'https://www.googleapis.com/auth/calendar',
            include_granted_scopes: 'true',
            state: 'calendar_auth',
            prompt: 'consent'
        });

        // Open OAuth popup
        const authUrl = `${oauth2Endpoint}?${params}`;
        const popup = window.open(authUrl, 'google-auth', 'width=500,height=600,scrollbars=yes,resizable=yes');

        // Listen for the popup to close or receive a message
        const messageHandler = (event) => {
            if (event.origin !== window.location.origin) return;

            if (event.data.type === 'GOOGLE_AUTH_SUCCESS') {
                handleSuccessfulAuth(event.data.accessToken);
                window.removeEventListener('message', messageHandler);
                popup.close();
            } else if (event.data.type === 'GOOGLE_AUTH_ERROR') {
                setMessage('Authentication failed. Please try again.');
                setMessageType('error');
                setIsLoading(false);
                window.removeEventListener('message', messageHandler);
                popup.close();
            }
        };

        window.addEventListener('message', messageHandler);

        // Fallback: check if popup is closed manually
        const checkClosed = setInterval(() => {
            if (popup.closed) {
                clearInterval(checkClosed);
                window.removeEventListener('message', messageHandler);

                // Check current page URL for token (if redirect happened to main page)
                setTimeout(() => {
                    checkForAuthResult();
                }, 500);
            }
        }, 1000);
    };

    const checkForAuthResult = () => {
        // Check URL hash for access token (this would be more complex in a real app)
        const hash = window.location.hash;
        if (hash.includes('access_token')) {
            const token = hash.match(/access_token=([^&]*)/)?.[1];
            if (token) {
                handleSuccessfulAuth(token);
                // Clean up URL
                window.history.replaceState(null, null, window.location.pathname);
            }
        } else {
            setIsLoading(false);
            setMessage('Sign-in was cancelled or failed. Please try again.');
            setMessageType('error');
        }
    };

    const handleSuccessfulAuth = async (accessToken) => {
        try {
            setIsGoogleSignedIn(true);
            setMessage('Successfully signed in! Now syncing your study plan...');
            setMessageType('success');

            // Now create calendar events with the access token
            await createRealCalendarEvents(accessToken);
        } catch (error) {
            console.error('Auth success handling error:', error);
            setMessage('Signed in successfully, but failed to sync calendar. Please try again.');
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    const createRealCalendarEvents = async (accessToken) => {
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

                    await createCalendarEvent(accessToken, morningEvent);
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

                    await createCalendarEvent(accessToken, afternoonEvent);
                    eventsCreated++;
                }

                startDateTime.setDate(startDateTime.getDate() + 1);
            }

            setMessage(`🎉 Success! Created ${eventsCreated} study sessions in your Google Calendar!\n\nOpen Google Calendar to see your new study events. Each session includes:\n• Detailed task descriptions\n• 30 & 10-minute reminders\n• Optimized time blocks for focused learning`);
            setMessageType('success');

        } catch (error) {
            console.error('Calendar creation error:', error);
            setMessage('Failed to create calendar events. Please try again.');
            setMessageType('error');
        }
    };

    const createCalendarEvent = async (accessToken, event) => {
        const response = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(event),
        });

        if (!response.ok) {
            throw new Error(`Failed to create event: ${response.status}`);
        }

        return response.json();
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
                {!isGoogleSignedIn ? (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <div className="flex items-center space-x-3 mb-3">
                            {isGoogleApiLoading ? (
                                <Loader className="h-5 w-5 animate-spin text-blue-600" />
                            ) : (
                                <LogIn className="h-5 w-5 text-blue-600" />
                            )}
                            <h4 className="font-medium text-blue-900">
                                {isGoogleApiLoading ? 'Loading Google Services...' : 'Sign in to Google'}
                            </h4>
                        </div>
                        <p className="text-sm text-blue-800 mb-4">
                            {isGoogleApiLoading
                                ? 'Please wait while we load Google authentication...'
                                : 'Sign in with your Google account to sync your study plan to Google Calendar.'
                            }
                        </p>
                        <button
                            onClick={handleGoogleSignIn}
                            disabled={isLoading || isGoogleApiLoading}
                            className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm hover:shadow-md"
                        >
                            {isLoading || isGoogleApiLoading ? (
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
                                {isGoogleApiLoading
                                    ? 'Loading Google...'
                                    : isLoading
                                        ? 'Opening Sign-in...'
                                        : 'Sign in with Google'
                                }
                            </span>
                        </button>
                    </div>
                ) : (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center space-x-3">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <p className="text-sm text-green-800">Successfully signed in to Google!</p>
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