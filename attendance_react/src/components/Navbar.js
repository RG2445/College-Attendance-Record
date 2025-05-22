import React from 'react';
import { useNavigate } from 'react-router-dom';

const AppNavbar = ({ role }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-dark bg-dark">
      <div className="container-fluid">
        <span className="navbar-brand">Attendance System</span>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navbarNav"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navbarNav">
          <ul className="navbar-nav me-auto">
            <li className="nav-item">
              <a className="nav-link" href={`/${role}`}>Dashboard</a>
            </li>
          </ul>
          <button className="btn btn-outline-light" onClick={handleLogout}>Logout</button>
        </div>
      </div>
    </nav>
  );
};

export default AppNavbar;
