import React, { useEffect, useState } from 'react';
import axios from 'axios';

const StudentDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState([]);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token'); // JWT token

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await axios.get('http://localhost:5000/api/student/profile', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProfile(res.data);
      fetchAttendanceStats(res.data._id);
    } catch (err) {
      setError('Failed to fetch student profile.');
      console.error(err);
    }
  };

  const fetchAttendanceStats = async (studentId) => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/student/${studentId}/attendance/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAttendanceStats(res.data);
    } catch (err) {
      setError('Failed to fetch attendance stats.');
      console.error(err);
    }
  };

  if (error) return <p>{error}</p>;
  if (!profile) return <p>Loading...</p>;

  return (
    <div style={{ padding: '20px', fontFamily: 'sans-serif' }}>
      <h1>🎓 Student Dashboard</h1>
      <hr />

      <section>
        <h2>👤 Profile</h2>
        <p><strong>Name:</strong> {profile.name}</p>
        <p><strong>Email:</strong> {profile.user.email}</p>
        <p><strong>Enrollment No:</strong> {profile.enrollmentNumber}</p>
        <p><strong>Branch:</strong> {profile.branch}</p>
        <p><strong>Class:</strong> {profile.classId?.name || 'N/A'}</p>
      </section>

      <hr />

      <section>
        <h2>📊 Attendance Statistics</h2>
        {attendanceStats.length === 0 ? (
          <p>No attendance data available.</p>
        ) : (
          <table border="1" cellPadding="10" style={{ width: '100%', textAlign: 'left' }}>
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
        )}
      </section>
    </div>
  );
};

export default StudentDashboard;
