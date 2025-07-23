import React, { useState } from 'react';

const AllAttendanceRecords = ({ token }) => {
  const [subjectId, setSubjectId] = useState('');
  const [records, setRecords] = useState([]);

  const fetchAllRecords = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/teachers/subject/${subjectId}/attendance`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      setRecords(data.records || []);
    } catch (err) {
      console.error('Error:', err);
    }
  };

  return (
    <div>
      <h2>📘 All Attendance Records</h2>
      <input placeholder="Subject ID" onChange={(e) => setSubjectId(e.target.value)} />
      <button onClick={fetchAllRecords}>Fetch</button>
      <ul>
        {records.map((record) => (
          <li key={record._id}>{record.date?.slice(0,10)} - {record.records.length} students</li>
        ))}
      </ul>
    </div>
  );
};

export default AllAttendanceRecords;