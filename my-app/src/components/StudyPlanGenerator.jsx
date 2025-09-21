
import { useState } from 'react';
import { BookOpen, Clock, Calendar, Plus, X, Target, CheckCircle2, Sparkles } from 'lucide-react';
import { studyPlanAPI } from '../utils/api';
import CalendarIntegration from './CalendarIntegrationSimplified';

const defaultSubjects = [
  { name: 'Python', topics: ['Variables', 'Functions', 'Classes'] },
  { name: 'JavaScript', topics: ['DOM', 'Events', 'Promises'] },
];

function StudyPlanGenerator() {
  const [subjects, setSubjects] = useState(defaultSubjects);
  const [examDays, setExamDays] = useState(14);
  const [hoursPerDay, setHoursPerDay] = useState(3);
  const [useMock, setUseMock] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [plan, setPlan] = useState(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);

  // Subject/topic form handlers
  const handleSubjectNameChange = (idx, value) => {
    setSubjects(subjects => subjects.map((s, i) => i === idx ? { ...s, name: value } : s));
  };
  const handleTopicChange = (subIdx, topicIdx, value) => {
    setSubjects(subjects => subjects.map((s, i) =>
      i === subIdx ? { ...s, topics: s.topics.map((t, j) => j === topicIdx ? value : t) } : s
    ));
  };
  const addSubject = () => setSubjects([...subjects, { name: '', topics: [''] }]);
  const removeSubject = idx => setSubjects(subjects.filter((_, i) => i !== idx));
  const addTopic = idx => setSubjects(subjects => subjects.map((s, i) => i === idx ? { ...s, topics: [...s.topics, ''] } : s));
  const removeTopic = (subIdx, topicIdx) => setSubjects(subjects => subjects.map((s, i) =>
    i === subIdx ? { ...s, topics: s.topics.filter((_, j) => j !== topicIdx) } : s
  ));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setPlan(null);
    // Build syllabus object
    const syllabusObj = {};
    for (const s of subjects) {
      if (!s.name.trim()) continue;
      syllabusObj[s.name.trim()] = s.topics.filter(t => t.trim());
    }
    if (Object.keys(syllabusObj).length === 0) {
      setError('Please add at least one subject and topic.');
      setLoading(false);
      return;
    }
    try {
      const res = await studyPlanAPI.generate({
        syllabus: syllabusObj,
        exam_days: Number(examDays),
        hours_per_day: Number(hoursPerDay),
        use_mock: useMock
      });
      setPlan(res.data.data);
    } catch (err) {
      if (err.response?.data?.detail) {
        setError(typeof err.response.data.detail === 'string' ? err.response.data.detail : JSON.stringify(err.response.data.detail));
      } else {
        setError('Failed to generate study plan.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full mb-4">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2">
            Study Plan Generator
          </h1>
          <p className="text-gray-600 dark:text-gray-300 max-w-md mx-auto">
            Create a personalized study schedule tailored to your exam timeline and learning goals
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Form Section */}
          <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8">
            <div className="space-y-6">
              {/* Subjects & Topics */}
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <Target className="w-5 h-5 text-blue-600" />
                  <label className="text-lg font-semibold text-gray-800 dark:text-gray-200">
                    Subjects & Topics
                  </label>
                </div>
                <div className="space-y-4">
                  {subjects.map((subject, subIdx) => (
                    <div key={subIdx} className="group relative">
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 rounded-xl p-4 border border-blue-100 dark:border-gray-600 transition-all duration-200 hover:shadow-md">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-3 h-3 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full"></div>
                          <input
                            className="flex-1 p-3 border-0 rounded-lg bg-white/80 dark:bg-gray-800/80 text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500 transition-all"
                            placeholder="Enter subject name..."
                            value={subject.name}
                            onChange={e => handleSubjectNameChange(subIdx, e.target.value)}
                            required
                          />
                          <button
                            type="button"
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                            onClick={() => removeSubject(subIdx)}
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <div className="space-y-2 ml-6">
                          {subject.topics.map((topic, topicIdx) => (
                            <div key={topicIdx} className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-gray-400 rounded-full flex-shrink-0"></div>
                              <input
                                className="flex-1 p-2 border-0 rounded-md bg-white/60 dark:bg-gray-700/60 text-gray-900 dark:text-gray-100 placeholder-gray-500 text-sm focus:ring-2 focus:ring-blue-400 transition-all"
                                placeholder="Enter topic..."
                                value={topic}
                                onChange={e => handleTopicChange(subIdx, topicIdx, e.target.value)}
                                required
                              />
                              <button
                                type="button"
                                className="p-1 text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                                onClick={() => removeTopic(subIdx, topicIdx)}
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            className="flex items-center gap-1 text-blue-600 hover:text-blue-700 text-sm font-medium ml-3 mt-2 transition-colors"
                            onClick={() => addTopic(subIdx)}
                          >
                            <Plus className="w-3 h-3" />
                            Add Topic
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium py-3 px-4 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                    onClick={addSubject}
                  >
                    <Plus className="w-4 h-4" />
                    Add Subject
                  </button>
                </div>
              </div>

              {/* Study Parameters */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <label className="font-medium text-gray-700 dark:text-gray-300">Exam Days</label>
                  </div>
                  <input
                    type="number"
                    min={1}
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    value={examDays}
                    onChange={e => setExamDays(e.target.value)}
                    required
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <label className="font-medium text-gray-700 dark:text-gray-300">Hours/Day</label>
                  </div>
                  <input
                    type="number"
                    min={1}
                    className="w-full p-3 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                    value={hoursPerDay}
                    onChange={e => setHoursPerDay(e.target.value)}
                    required
                  />
                </div>
              </div>

              {/* Mock Data Toggle */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <input
                  type="checkbox"
                  id="useMock"
                  checked={useMock}
                  onChange={e => setUseMock(e.target.checked)}
                  className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="useMock" className="text-gray-700 dark:text-gray-300 cursor-pointer">
                  Use Mock Data for Demo
                </label>
              </div>

              {/* Submit Button */}
              <button
                onClick={handleSubmit}
                className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold rounded-xl transition-all duration-200 transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none shadow-lg hover:shadow-xl"
                disabled={loading}
              >
                <div className="flex items-center justify-center gap-2">
                  {loading ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Generating Your Plan...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      Generate My Study Plan
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
            </div>
          </div>

          {/* Results Section */}
          <div className="space-y-6">
            {plan ? (
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-6 h-6 text-green-600" />
                    <h3 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Your Study Plan</h3>
                  </div>
                  <button
                    onClick={() => setShowCalendarModal(true)}
                    className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
                  >
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">Add to Calendar</span>
                  </button>
                </div>

                {/* Plan Summary */}
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl">
                    <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{plan.subjects.length}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Subjects</div>
                  </div>
                  <div className="text-center p-4 bg-indigo-50 dark:bg-indigo-900/20 rounded-xl">
                    <div className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">{plan.total_days}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Days</div>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl">
                    <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{plan.total_hours}h</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Total Hours</div>
                  </div>
                </div>

                <div className="mb-4">
                  <p className="text-gray-600 dark:text-gray-400">
                    <span className="font-medium text-gray-800 dark:text-gray-200">Subjects:</span> {plan.subjects.join(', ')}
                  </p>
                </div>

                {/* Daily Plans */}
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {Object.entries(plan.daily_plans).map(([day, tasks]) => (
                    <div key={day} className="border border-gray-200 dark:border-gray-600 rounded-xl overflow-hidden">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-3">
                        <h4 className="font-semibold">{day}</h4>
                      </div>
                      <div className="p-4 bg-white dark:bg-gray-800">
                        {Array.isArray(tasks) && tasks.length > 0 ? (
                          <ul className="space-y-3">
                            {tasks.map((task, idx) => {
                              const taskStr = typeof task === 'string' ? task : String(task);
                              return (
                                <li key={idx} className="flex items-start gap-3">
                                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0"></div>
                                  <span className="text-gray-700 dark:text-gray-300 leading-relaxed">{taskStr}</span>
                                </li>
                              );
                            })}
                          </ul>
                        ) : tasks && typeof tasks === 'object' ? (
                          <div className="text-gray-500 dark:text-gray-400">
                            <p className="mb-2">Tasks object detected:</p>
                            <pre className="bg-gray-100 dark:bg-gray-700 p-2 rounded text-xs overflow-x-auto">
                              {JSON.stringify(tasks, null, 2)}
                            </pre>
                          </div>
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400 italic">No tasks scheduled for this day</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Created: {plan.created_at}
                  </p>
                </div>
              </div>
            ) : (
              <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600 p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 dark:text-gray-400 mb-2">
                  Ready to Create Your Plan?
                </h3>
                <p className="text-gray-500 dark:text-gray-500">
                  Fill out the form to generate a personalized study schedule
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Calendar Integration Modal */}
      {showCalendarModal && (
        <CalendarIntegration
          studyPlan={plan}
          onClose={() => setShowCalendarModal(false)}
        />
      )}
    </div>
  );
}

export default StudyPlanGenerator;