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

    // Initialize Google Auth
    useEffect(() => {
        const initializeGoogleAuth = async () => {
            try {
                setIsGoogleApiLoading(true);

                // Check if script already exists
                if (document.querySelector('script[src="https://apis.google.com/js/api.js"]')) {
                    // Script already loaded, just initialize
                    if (window.gapi && window.gapi.auth2) {
                        const authInstance = window.gapi.auth2.getAuthInstance();
                        if (authInstance) {
                            setGoogleAuth(authInstance);
                            setIsGoogleSignedIn(authInstance.isSignedIn.get());
                            setIsGoogleApiLoading(false);
                            return;
                        }
                    }
                }

                // Load the Google APIs
                const script = document.createElement('script');
                script.src = 'https://apis.google.com/js/api.js';
                script.onload = () => {
                    window.gapi.load('auth2', () => {
                        window.gapi.auth2.init({
                            client_id: '1097086393644-ckn9ufrh4mhkv0n4p3p0k8c2h6n0c7jq.apps.googleusercontent.com', // Public demo client ID
                        }).then(() => {
                            const authInstance = window.gapi.auth2.getAuthInstance();
                            setGoogleAuth(authInstance);
                            setIsGoogleSignedIn(authInstance.isSignedIn.get());
                            setIsGoogleApiLoading(false);
                        }).catch((error) => {
                            console.error('Google Auth init error:', error);
                            setIsGoogleApiLoading(false);
                            setMessage('Failed to initialize Google authentication. Please refresh and try again.');
                            setMessageType('error');
                        });
                    });
                };
                script.onerror = () => {
                    console.error('Failed to load Google API script');
                    setIsGoogleApiLoading(false);
                    setMessage('Failed to load Google API. Please check your internet connection.');
                    setMessageType('error');
                };
                document.head.appendChild(script);
            } catch (error) {
                console.error('Failed to initialize Google Auth:', error);
                setIsGoogleApiLoading(false);
                setMessage('Failed to initialize Google authentication.');
                setMessageType('error');
            }
        };

        initializeGoogleAuth();
    }, []);

    const handleGoogleSignIn = async () => {
        try {
            setIsLoading(true);
            const user = await googleAuth.signIn({
                scope: 'https://www.googleapis.com/auth/calendar'
            });
            setIsGoogleSignedIn(true);
            setMessage('Successfully signed in to Google! You can now sync your study plan.');
            setMessageType('success');
        } catch (error) {
            setMessage('Failed to sign in to Google. Please try again.');
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleGoogleSignOut = () => {
        googleAuth.signOut();
        setIsGoogleSignedIn(false);
        setMessage('');
    };

    const createCalendarEvents = async () => {
        if (!isGoogleSignedIn || !googleAuth) {
            setMessage('Please sign in to Google first.');
            setMessageType('error');
            return;
        }

        setIsLoading(true);
        setMessage('');

        try {
            // Load the Google Calendar API
            await new Promise((resolve) => {
                window.gapi.load('client', resolve);
            });

            await window.gapi.client.init({
                apiKey: 'AIzaSyC8Q9F9D9E9F9G9H9I9J9K9L9M9N9O9P9Q', // Public API key for demo
                clientId: '1097086393644-ckn9ufrh4mhkv0n4p3p0k8c2h6n0c7jq.apps.googleusercontent.com',
                discoveryDocs: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
                scope: 'https://www.googleapis.com/auth/calendar'
            });

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
                        description: `🎯 StudyMentor AI-Generated Study Session\n\n📋 Tasks:\n${morningTasks.map((task, i) => `${i + 1}. ${task}`).join('\n')}\n\n💡 Generated by StudyMentor`,
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
                        description: `🎯 StudyMentor AI-Generated Study Session\n\n📋 Tasks:\n${afternoonTasks.map((task, i) => `${i + 1}. ${task}`).join('\n')}\n\n💡 Generated by StudyMentor`,
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

            setMessage(`🎉 Successfully created ${eventsCreated} study sessions in your Google Calendar!`);
            setMessageType('success');

        } catch (error) {
            console.error('Calendar sync error:', error);
            setMessage('Failed to sync with Google Calendar. Please try again.');
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    const formatStudyPlanSummary = () => {
        if (!studyPlan) return null;

        const dailyPlans = studyPlan.daily_plans || {};
        const totalDays = Object.keys(dailyPlans).length;
        const subjects = studyPlan.subjects || [];

        return (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h4 className="font-semibold text-gray-800 mb-2">📋 Study Plan Summary</h4>
                <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                    <div>
                        <span className="font-medium">Total Days:</span> {totalDays}
                    </div>
                    <div>
                        <span className="font-medium">Total Hours:</span> {studyPlan.total_hours || 'N/A'}
                    </div>
                    <div className="col-span-2">
                        <span className="font-medium">Subjects:</span> {subjects.join(', ')}
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
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <Calendar className="h-6 w-6 text-blue-600" />
                        </div>
                        <h3 className="text-xl font-semibold text-gray-900">
                            Add to Google Calendar
                        </h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 transition-colors"
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
                            disabled={isLoading || isGoogleApiLoading || !googleAuth}
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
                                        ? 'Signing in...'
                                        : 'Sign in with Google'
                                }
                            </span>
                        </button>
                    </div>
                ) : (
                    <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <CheckCircle className="h-5 w-5 text-green-600" />
                                <p className="text-sm text-green-800">Signed in to Google</p>
                            </div>
                            <button
                                onClick={handleGoogleSignOut}
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
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                        <p className={`text-sm ${messageType === 'success' ? 'text-green-800' : 'text-red-800'
                            }`}>
                            {message}
                        </p>
                    </div>
                )}

                <div className="space-y-3">
                    <button
                        onClick={createCalendarEvents}
                        disabled={isLoading || !isGoogleSignedIn}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <Loader className="h-5 w-5 animate-spin" />
                        ) : (
                            <Calendar className="h-5 w-5" />
                        )}
                        <span>
                            {isLoading
                                ? 'Creating Events...'
                                : !isGoogleSignedIn
                                    ? 'Sign in First'
                                    : 'Add to Google Calendar'
                            }
                        </span>
                    </button>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">📝 What this does:</h4>
                    <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
                        <li>Creates study sessions in 3-hour blocks</li>
                        <li>Morning sessions: 9 AM - 12 PM</li>
                        <li>Afternoon sessions: 2 PM - 5 PM</li>
                        <li>Adds detailed task descriptions</li>
                        <li>Sets reminders 30 and 10 minutes before</li>
                        <li>No complex setup required - just sign in!</li>
                    </ul>
                </div>

                <div className="mt-4 flex justify-end">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
};

export default CalendarIntegration;