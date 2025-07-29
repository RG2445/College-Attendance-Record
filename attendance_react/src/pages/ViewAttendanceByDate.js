import React, { useState } from 'react';

const ViewAttendanceByDate = () => {
  const [subjectCode, setSubjectCode] = useState('');
  const [date, setDate] = useState('');
  const [records, setRecords] = useState([]);

  const token = localStorage.getItem("token");
  if (!token) {
    return (
      <div className="alert alert-warning mt-4 text-center" role="alert">
        Please log in to view attendance records.
      </div>
    );
  }

  const fetchAttendance = async () => {
    try {
      const res = await fetch(
        `http://localhost:5000/api/teachers/attendance/${subjectCode}/${date}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
        }
      );
      const data = await res.json();
          if (!res.ok || !Array.isArray(data)) {
      setRecords([]);
    } else {
      setRecords(data);
    }
    } catch (err) {
      console.error('Error fetching attendance:', err);
    }
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">📅 View Attendance By Date</h2>

      <div className="row mb-3 justify-content-center">
        <div className="col-md-4 mb-2">
          <input
            type="text"
            className="form-control"
            placeholder="Enter Subject Code"
            onChange={(e) => setSubjectCode(e.target.value)}
          />
        </div>
        <div className="col-md-4 mb-2">
          <input
            type="date"
            className="form-control"
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <div className="col-md-2">
          <button className="btn btn-primary w-100" onClick={fetchAttendance}>
            Fetch
          </button>
        </div>
      </div>

      {records.length === 0 ? (
        <div className="text-center text-muted">No attendance records found.</div>
      ) : (
        <ul className="list-group">
          {records.map((record) => (
            <li key={record._id} className="list-group-item">
              <h5>Date: {new Date(record.date).toLocaleDateString()}</h5>
              <ul className="list-group mt-2">
                {record.records.map((r, index) => (
                  <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                    <span>{r.student?.name || r.student}</span>
                    <span className={`badge ${r.status === 'Present' ? 'bg-success' : 'bg-danger'}`}>
                      {r.status}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default ViewAttendanceByDate;
