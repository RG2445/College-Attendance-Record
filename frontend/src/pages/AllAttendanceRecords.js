import React, { useState } from 'react';
import axios from 'axios';
axios.defaults.baseURL = process.env.REACT_APP_BACKEND_URL;

const AllAttendanceRecords = () => {
  const [subjectCode, setSubjectCode] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [records, setRecords] = useState([]);
  const [error, setError] = useState('');

  const token = localStorage.getItem("token");

  const fetchAllRecords = async () => {
  if (!month || !year || !subjectCode) {
    alert('Please enter subject code, month, and year');
    return;
  }

  try {
    const res = await axios.get(
      `/api/teachers/subject/${subjectCode}/attendance`,
      {
        params: { month, year },
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setRecords(res.data.records || []);
    setError('');
  } catch (err) {
    console.error('Error:', err);
    setError(err.response?.data?.message || 'Something went wrong');
  }
};


  return (
    <div className="container mt-5">
      <h2 className="mb-4 text-primary">📘 Monthly Attendance Records</h2>

      <div className="row mb-3">
        <div className="col-md-4 mb-2">
          <input
            type="text"
            className="form-control"
            placeholder="Subject Code (e.g., ICT206)"
            value={subjectCode}
            onChange={(e) => setSubjectCode(e.target.value)}
          />
        </div>
        <div className="col-md-3 mb-2">
          <input
            type="number"
            className="form-control"
            placeholder="Month (1-12)"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            min="1"
            max="12"
          />
        </div>
        <div className="col-md-3 mb-2">
          <input
            type="number"
            className="form-control"
            placeholder="Year (e.g., 2025)"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            min="2000"
          />
        </div>
        <div className="col-md-2">
          <button className="btn btn-primary w-100" onClick={fetchAllRecords}>
            Fetch
          </button>
        </div>
      </div>

      {error && <div className="alert alert-danger">{error}</div>}

      {records.length === 0 && !error ? (
        <div className="alert alert-info">No attendance records found for this month.</div>
      ) : (
        <div className="list-group">
          <div className="list-group-item active">
            <strong>Total Days: {records.length}</strong>
          </div>
{records.map((record) => (
  <div key={record._id} className="list-group-item">
    <strong>{new Date(record.date).toLocaleDateString()}</strong> —{' '}
    {record.presentCount} present / {record.totalMarked} total
  </div>
))}

        </div>
      )}
    </div>
  );
};

export default AllAttendanceRecords;
