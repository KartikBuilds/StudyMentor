import React, { useState } from 'react';
import { Calendar, Clock, CheckCircle, AlertCircle, Loader } from 'lucide-react';
import { calendarAPI } from '../utils/api';

const CalendarIntegration = ({ studyPlan, onClose }) => {
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [messageType, setMessageType] = useState(''); // 'success' or 'error'
    const [startDate, setStartDate] = useState(() => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        return tomorrow.toISOString().split('T')[0];
    });

    const handleSyncToCalendar = async () => {
        setIsLoading(true);
        setMessage('');

        try {
            const response = await calendarAPI.syncStudyPlan({
                study_plan: studyPlan,
                start_date: startDate
            });

            setMessage(response.message);
            setMessageType('success');
        } catch (error) {
            setMessage(error.response?.data?.detail || 'Failed to sync with Google Calendar');
            setMessageType('error');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveEvents = async () => {
        setIsLoading(true);
        setMessage('');

        try {
            const response = await calendarAPI.removeStudyEvents();
            setMessage(response.message);
            setMessageType('success');
        } catch (error) {
            setMessage(error.response?.data?.detail || 'Failed to remove calendar events');
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
                            Google Calendar Integration
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
                        onClick={handleSyncToCalendar}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <Loader className="h-5 w-5 animate-spin" />
                        ) : (
                            <Calendar className="h-5 w-5" />
                        )}
                        <span>
                            {isLoading ? 'Syncing...' : 'Sync to Google Calendar'}
                        </span>
                    </button>

                    <button
                        onClick={handleRemoveEvents}
                        disabled={isLoading}
                        className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {isLoading ? (
                            <Loader className="h-5 w-5 animate-spin" />
                        ) : (
                            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        )}
                        <span>
                            {isLoading ? 'Removing...' : 'Remove Existing Events'}
                        </span>
                    </button>
                </div>

                <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">📝 Setup Instructions:</h4>
                    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                        <li>First time users need to authenticate with Google</li>
                        <li>Study sessions will be created in 3-hour blocks</li>
                        <li>Morning sessions: 9 AM - 12 PM</li>
                        <li>Afternoon sessions: 2 PM - 5 PM</li>
                        <li>Events include detailed task descriptions</li>
                        <li>Reminders set for 30 and 10 minutes before</li>
                    </ol>
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