import React, { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import "./NavbarWithSidebar.css";

const NavbarWithSidebar = ({ teacherProfile }) => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  const toggleMenu = () => setMenuOpen(!menuOpen);
  const toggleDropdown = () => setDropdownOpen(!dropdownOpen);

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      {/* Top Navbar */}
      <nav className="navbar sticky-top shadow-sm bg-light d-flex justify-content-between align-items-center px-3">
        <div className="d-flex align-items-center">
          <button className="btn btn-outline-secondary me-3" onClick={toggleMenu}>
            ☰
          </button>
          <h3 className="dashboard-title d-flex align-items-center mb-0">
            <span role="img" aria-label="teacher" className="me-2">🧑🏫</span>
            Teacher Dashboard
          </h3>
        </div>

        <div className="position-relative" ref={dropdownRef}>
          <button
            className="btn btn-outline-light d-flex align-items-center shadow-sm"
            onClick={toggleDropdown}
          >
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(
                teacherProfile?.name || "T"
              )}&background=007bff&color=fff&size=30`}
              alt="Avatar"
              className="rounded-circle me-2"
              style={{ width: "30px", height: "30px" }}
            />
            <span className="fw-semibold text-dark">{teacherProfile?.name || "Teacher"}</span>
          </button>

          {dropdownOpen && (
<ul
  className="dropdown-menu dropdown-menu-end show mt-2 shadow rounded"
  style={{ minWidth: '220px', border: '1px solid black' }}
>
  <li className="px-3 py-2 border-bottom">
    <div className="fw-semibold text-dark">{teacherProfile?.name}</div>
    <div className="text-muted small">{teacherProfile?.user?.email || "Email not available"}</div>
  </li>
  <li>
    <button
      className="dropdown-item d-flex align-items-center gap-2 text-danger"
      onClick={handleLogout}
    >
      <span>🚪</span> Logout
    </button>
  </li>
</ul>



          )}
        </div>
      </nav>

      {/* Temporary Sidebar Menu */}
      {menuOpen && (
        <div className="sidebar-popup shadow">
          <Link className="menu-item" to="/dashboard" onClick={() => setMenuOpen(false)}>
            📊 Dashboard
          </Link>
          <Link className="menu-item" to="/students" onClick={() => setMenuOpen(false)}>
            👨‍🎓 Students
          </Link>
          <Link className="menu-item" to="/subjects" onClick={() => setMenuOpen(false)}>
            📚 Subjects
          </Link>
        </div>
      )}

      {/* Click-away overlay */}
      {menuOpen && <div className="overlay" onClick={() => setMenuOpen(false)} />}
    </>
  );
};

export default NavbarWithSidebar;
