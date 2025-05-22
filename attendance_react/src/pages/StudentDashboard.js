import React, { useEffect, useState } from 'react';
import axios from '../axios';
import AppNavbar from '../components/Navbar';

const StudentDashboard = () => {
  const [attendance, setAttendance] = useState([]);

  useEffect(() => {
    axios.get('/student/attendance/monthly').then(res => setAttendance(res.data));
  }, []);

  return (
    <>
      <AppNavbar role="student" />
      <div className="container mt-4">
        <h2>Your Monthly Attendance</h2>
        <table className="table table-bordered table-striped mt-3">
          <thead>
            <tr>
              <th>Date</th>
              <th>Subject</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {attendance.map((item, idx) => (
              <tr key={idx}>
                <td>{new Date(item.date).toLocaleDateString()}</td>
                <td>{item.subjectName}</td>
                <td>{item.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
};

export default StudentDashboard;
