import React, { useState } from 'react';

const AttendanceSummary = ({ token }) => {
  const [subjectId, setSubjectId] = useState('');
  const [summary, setSummary] = useState([]);

  const fetchSummary = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/teachers/subject/${subjectId}/summary`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      setSummary(data);
    } catch (err) {
      console.error('Error fetching summary:', err);
    }
  };

  return (
    <div>
      <h2>📊 Attendance Summary</h2>
      <input placeholder="Subject ID" onChange={(e) => setSubjectId(e.target.value)} />
      <button onClick={fetchSummary}>Get Summary</button>
      <ul>
        {summary.map((s) => (
          <li key={s._id}>
            {s.student?.name} - {s.attendancePercentage?.toFixed(2)}%
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AttendanceSummary;
