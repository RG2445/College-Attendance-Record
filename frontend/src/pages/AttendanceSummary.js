import React, { useState } from 'react';
import axios from 'axios';
axios.defaults.baseURL = process.env.REACT_APP_BACKEND_URL;

const AttendanceSummary = () => {
  const [subjectCode, setSubjectCode] = useState('');
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("token");
  if (!token) { 
    return (
      <div className="alert alert-warning mt-4 text-center" role="alert"> 
        Please log in to view attendance summary.
      </div>
    );
  }

const fetchSummary = async () => {
  setLoading(true);
  try {
    const res = await axios.get(
      `/api/teachers/subject/${subjectCode}/summary`,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setSummary(res.data || []);
  } catch (err) {
    if (err.response?.status === 404) {
      setSummary([]);
    } else {
      console.error("Error fetching summary:", err);
      setSummary([]);
    }
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="container mt-5">
      <div className="card shadow-sm">
        <div className="card-header bg-primary text-white">
          <h4 className="mb-0">📊 Attendance Summary</h4>
        </div>
        <div className="card-body">
          <div className="row mb-3">
            <div className="col-md-9">
              <input
                className="form-control"
                type="text"
                placeholder="Enter Subject Code (e.g., ICT206)"
                value={subjectCode}
                onChange={(e) => setSubjectCode(e.target.value)}
              />
            </div>
            <div className="col-md-3">
              <button
                className="btn btn-primary w-100"
                onClick={fetchSummary}
                disabled={loading}
              >
                {loading ? 'Loading...' : 'Get Summary'}
              </button>
            </div>
          </div>
{summary.length > 0 ? (
  <div className="table-responsive">
    <table className="table table-bordered table-striped">
      <thead className="table-primary">
        <tr>
          <th>Name</th>
          <th>Enrollment Number</th>
          <th>Attendance %</th>
          <th>Present Classes</th>
          <th>Total Classes</th>
        </tr>
      </thead>
      <tbody>
        {summary.map((item, idx) => (
          <tr key={item.enrollmentNumber || idx}>
            <td>{item.name}</td>
            <td>{item.enrollmentNumber}</td>
            <td>{item.percentage}%</td>
            <td>{item.presentClasses}</td>
            <td>{item.totalClasses}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
) : (
  <div className="alert alert-info" role="alert">
    No records found for this subject.
  </div>
)}


        </div>
      </div>
    </div>
  );
};

export default AttendanceSummary;
