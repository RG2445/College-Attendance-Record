import React, { useState } from 'react';

const ViewAttendanceByDate = ({ token }) => {
  const [subjectId, setSubjectId] = useState('');
  const [date, setDate] = useState('');
  const [records, setRecords] = useState([]);

  const fetchAttendance = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/teachers/attendance/${subjectId}/${date}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      const data = await res.json();
      setRecords(data);
    } catch (err) {
      console.error('Error fetching attendance:', err);
    }
  };

  return (
    <div>
      <h2>📅 Attendance By Date</h2>
      <input placeholder="Subject ID" onChange={(e) => setSubjectId(e.target.value)} />
      <input type="date" onChange={(e) => setDate(e.target.value)} />
      <button onClick={fetchAttendance}>Fetch</button>
      <ul>
        {records.map((record) => (
          <li key={record._id}>{record.student?.name} - {record.status}</li>
        ))}
      </ul>
    </div>
  );
};

export default ViewAttendanceByDate;