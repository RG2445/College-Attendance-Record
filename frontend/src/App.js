import React from 'react';
import {BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard.js';
import StudentDashboard from './pages/StudentDashboard.js';
import ViewAttendanceByDate from './pages/ViewAttendanceByDate.js';
import AttendanceSummary from './pages/AttendanceSummary.js';
import AllAttendanceRecords from './pages/AllAttendanceRecords.js';

function App() {
  return (
  <Router>
    <Routes>
      <Route exact path="/" element={<LoginPage />} />
      <Route exact path="/AdminDashBoard" element={<AdminDashboard />} />
      <Route exact path="/TeacherDashBoard" element={<TeacherDashboard />} />
      <Route exact path="/StudentDashBoard" element={<StudentDashboard />} />
      <Route exact path="/viewAttendanceByDate" element={<ViewAttendanceByDate />} />
      <Route exact path="/viewAttendanceBySubject" element={<AllAttendanceRecords />} />
      <Route exact path="/attendanceSummary" element={<AttendanceSummary />} />
    </Routes>
  </Router>
  );
}

export default App;
