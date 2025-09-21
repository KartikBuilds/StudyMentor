
import React, { useState } from 'react';
import axios from 'axios';

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
      const res = await axios.post('/api/study-plan/generate', {
        syllabus: syllabusObj,
        exam_days: Number(examDays),
        hours_per_day: Number(hoursPerDay),
        use_mock: useMock
      });
      setPlan(res.data.data);
    } catch (err) {
      // Show FastAPI error details if present
      if (err.response?.data?.detail) {
        const detail = err.response.data.detail;
        if (Array.isArray(detail)) {
          setError(detail.map(d => d.msg).join(' | '));
        } else {
          setError(typeof detail === 'string' ? detail : JSON.stringify(detail));
        }
      } else {
        setError('Failed to generate study plan.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white dark:bg-gray-900 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4 text-gray-800 dark:text-gray-100">Generate Study Plan</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium mb-1 text-gray-700 dark:text-gray-200">Subjects & Topics</label>
          <div className="space-y-4">
            {subjects.map((subject, subIdx) => (
              <div key={subIdx} className="border rounded p-3 bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-2 mb-2">
                  <input
                    className="flex-1 p-2 border rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                    placeholder="Subject name"
                    value={subject.name}
                    onChange={e => handleSubjectNameChange(subIdx, e.target.value)}
                    required
                  />
                  <button type="button" className="text-red-500 ml-2" onClick={() => removeSubject(subIdx)} title="Remove subject">&times;</button>
                </div>
                <div className="space-y-2">
                  {subject.topics.map((topic, topicIdx) => (
                    <div key={topicIdx} className="flex items-center gap-2">
                      <input
                        className="flex-1 p-2 border rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                        placeholder="Topic"
                        value={topic}
                        onChange={e => handleTopicChange(subIdx, topicIdx, e.target.value)}
                        required
                      />
                      <button type="button" className="text-red-500" onClick={() => removeTopic(subIdx, topicIdx)} title="Remove topic">&times;</button>
                    </div>
                  ))}
                  <button type="button" className="text-blue-600 text-xs mt-1" onClick={() => addTopic(subIdx)}>+ Add Topic</button>
                </div>
              </div>
            ))}
            <button type="button" className="text-blue-600 text-sm" onClick={addSubject}>+ Add Subject</button>
          </div>
        </div>
        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block font-medium mb-1 text-gray-700 dark:text-gray-200">Exam Days</label>
            <input
              type="number"
              min={1}
              className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              value={examDays}
              onChange={e => setExamDays(e.target.value)}
              required
            />
          </div>
          <div className="flex-1">
            <label className="block font-medium mb-1 text-gray-700 dark:text-gray-200">Hours/Day</label>
            <input
              type="number"
              min={1}
              className="w-full p-2 border rounded bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-gray-100"
              value={hoursPerDay}
              onChange={e => setHoursPerDay(e.target.value)}
              required
            />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="useMock"
            checked={useMock}
            onChange={e => setUseMock(e.target.checked)}
          />
          <label htmlFor="useMock" className="text-gray-700 dark:text-gray-200">Use Mock Data</label>
        </div>
        <button
          type="submit"
          className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded transition"
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Plan'}
        </button>
        {error && <div className="text-red-600 dark:text-red-400 mt-2">{error}</div>}
      </form>
      {plan && (
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-2 text-gray-800 dark:text-gray-100">Your Study Plan</h3>
          <div className="mb-2 text-gray-700 dark:text-gray-200">
            <span className="font-semibold">Subjects:</span> {plan.subjects.join(', ')}<br />
            <span className="font-semibold">Total Days:</span> {plan.total_days}<br />
            <span className="font-semibold">Total Hours:</span> {plan.total_hours}
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full border mt-2 text-sm">
              <thead>
                <tr className="bg-gray-100 dark:bg-gray-800">
                  <th className="border px-2 py-1 text-left">Day/Section</th>
                  <th className="border px-2 py-1 text-left">Tasks</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(plan.daily_plans).map(([day, tasks]) => (
                  <tr key={day}>
                    <td className="border px-2 py-1 font-semibold text-blue-700 dark:text-blue-300 align-top">{day}</td>
                    <td className="border px-2 py-1">
                      {Array.isArray(tasks) && tasks.length > 0 ? (
                        <ul className="list-disc ml-4">
                          {tasks.map((task, idx) => (
                            typeof task === 'string' ? <li key={idx}>{task}</li> : null
                          ))}
                        </ul>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="text-xs text-gray-500 mt-2">Created at: {plan.created_at}</div>
        </div>
      )}
    </div>
  );
}

export default StudyPlanGenerator;
