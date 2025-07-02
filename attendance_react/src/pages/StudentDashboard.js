import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell
} from 'recharts';
import './StudentDashboard.css';

const COLORS = ['#4A90E2', '#FF8C00'];

const StudentDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState([]);
  const [overallAttendance, setOverallAttendance] = useState(null);
  const [error, setError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');

  useEffect(() => {
    fetchProfile();
    //eslint-disable-next-line
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch('http://localhost:5000/api/students/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setProfile(data);
      fetchAttendanceStats(data._id);
    } catch (err) {
      setError('Failed to fetch student profile.');
      console.error(err);
    }
  };

  const fetchAttendanceStats = async (studentId) => {
    try {
      const res = await fetch(`http://localhost:5000/api/students/${studentId}/attendance/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setAttendanceStats(data);

      const total = data.reduce((sum, stat) => sum + stat.totalClasses, 0);
      const present = data.reduce((sum, stat) => sum + stat.presentClasses, 0);
      setOverallAttendance({ total, present });
    } catch (err) {
      setError('Failed to fetch attendance stats.');
      console.error(err);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (error) return <p className="error-text">{error}</p>;
  if (!profile) return <p className="loading-text">Loading...</p>;

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="dashboard-title">🎓 Student Dashboard</h1>
        <div className="profile-wrapper">
          <button className="profile-icon" onClick={() => setShowDropdown(prev => !prev)}>👤</button>
          {showDropdown && (
            <div className="dropdown-menu">
              <button onClick={handleLogout}>Logout</button>
            </div>
          )}
        </div>
      </header>

      <hr className="divider" />

      <section className="section">
        <h2>👤 Profile</h2>
        <p><strong>Name:</strong> {profile.name}</p>
        <p><strong>Email:</strong> {profile.user.email}</p>
        <p><strong>Enrollment No:</strong> {profile.enrollmentNumber}</p>
        <p><strong>Branch:</strong> {profile.branch}</p>
        <p><strong>Class:</strong> {profile.classId?.name || 'N/A'}</p>
      </section>

      <section className="section">
        <h2>📊 Attendance Statistics</h2>
        {attendanceStats.length === 0 ? (
          <p>No attendance data available.</p>
        ) : (
          <>
            <div className="table-container">
              <table className="table">
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Code</th>
                    <th>Total Classes</th>
                    <th>Present</th>
                    <th>Percentage</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceStats.map((stat, index) => (
                    <tr key={index}>
                      <td>{stat.subject?.name}</td>
                      <td>{stat.subject?.code}</td>
                      <td>{stat.totalClasses}</td>
                      <td>{stat.presentClasses}</td>
                      <td>{stat.attendancePercentage.toFixed(2)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="charts-container">
              <div style={{ height: 350, marginTop: '2rem' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={attendanceStats.map(stat => ({
                      name: stat.subject?.code || 'N/A',
                      percentage: +stat.attendancePercentage.toFixed(2)
                    }))}
                    margin={{ top: 20, right: 30, left: 0, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 100]} tickFormatter={val => `${val}%`} />
                    <Tooltip formatter={(val) => `${val}%`} />
                    <Legend />
                    <Bar dataKey="percentage" fill="#4A90E2" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {overallAttendance && (
                <div className="overall-attendance" style={{ marginTop: '3rem', textAlign: 'center' }}>
                  <h3>📈 Overall Attendance</h3>
                  <p>
                    <strong>{((overallAttendance.present / overallAttendance.total) * 100).toFixed(2)}%</strong> 
                    &nbsp;({overallAttendance.present}/{overallAttendance.total} classes attended)
                  </p>
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer>
                      <PieChart>
                        <Pie
                          dataKey="value"
                          data={[
                            { name: 'Present', value: overallAttendance.present },
                            { name: 'Absent', value: overallAttendance.total - overallAttendance.present }
                          ]}
                          cx="50%"
                          cy="50%"
                          outerRadius={100}
                          label
                        >
                          {[
                            { name: 'Present', value: overallAttendance.present },
                            { name: 'Absent', value: overallAttendance.total - overallAttendance.present }
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </section>
    </div>
  );
};

export default StudentDashboard;
