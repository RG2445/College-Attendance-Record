import React from 'react';
import {BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import AdminDashboard from './pages/AdminDashboard';
import TeacherDashboard from './pages/TeacherDashboard.js';
import StudentDashboard from './pages/StudentDashboard.js';

function App() {
  return (
  <Router>
    <Routes>
      <Route exact path="/" element={<LoginPage />} />
      <Route exact path="/AdminDashBoard" element={<AdminDashboard />} />
      <Route exact path="/TeacherDashBoard" element={<TeacherDashboard />} />
      <Route exact path="/StudentDashBoard" element={<StudentDashboard />} />
    </Routes>
  </Router>
  );
}

export default App;
