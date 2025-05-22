import React from 'react';
import AppNavbar from '../components/Navbar';

const AdminDashboard = () => {
  return (
    <>
      <AppNavbar role="admin" />
      <div className="container mt-4">
        <h2>Admin Dashboard</h2>
        <p>Manage teachers, students, and generate reports.</p>
      </div>
    </>
  );
};

export default AdminDashboard;
