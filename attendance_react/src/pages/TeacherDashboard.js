import React, { useEffect, useState } from 'react';
import axios from '../axios';
import AppNavbar from '../components/Navbar';

const TeacherDashboard = () => {
  const [students, setStudents] = useState([]);
  const [subjectId, setSubjectId] = useState('');
  const [date, setDate] = useState('');
  const [attendance, setAttendance] = useState({});

  useEffect(() => {
    axios.get('/teacher/students').then(res => setStudents(res.data));
  }, []);

  const handleSubmit = () => {
    axios.post('/teacher/attendance/mark', {
      subjectId,
      date,
      records: attendance,
    }).then(() => alert('Attendance marked'));
  };

  return (
    <>
      <AppNavbar role="teacher" />
      <div className="container mt-4">
        <h2>Mark Attendance</h2>
        <input type="text" className="form-control my-2" placeholder="Subject ID" onChange={(e) => setSubjectId(e.target.value)} />
        <input type="date" className="form-control my-2" onChange={(e) => setDate(e.target.value)} />
        {students.map((student) => (
          <div key={student._id} className="d-flex align-items-center my-2">
            <span className="me-2">{student.name}</span>
            <select
              className="form-select w-auto"
              onChange={(e) => setAttendance(prev => ({ ...prev, [student._id]: e.target.value }))}
            >
              <option value="Present">Present</option>
              <option value="Absent">Absent</option>
            </select>
          </div>
        ))}
        <button className="btn btn-success mt-3" onClick={handleSubmit}>Submit Attendance</button>
      </div>
    </>
  );
};

export default TeacherDashboard;
