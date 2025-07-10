import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import "./StudentDashboard.css";

const COLORS = ["#4A90E2", "#FF8C00"];

const StudentDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState([]);
  const [overallAttendance, setOverallAttendance] = useState(null);
  const [error, setError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Redirect to login if token is missing
  useEffect(() => {
    if (!token) navigate("/login");
    else fetchProfile();
    // eslint-disable-next-line
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchProfile = async () => {
    setError(null);
    try {
      const res = await fetch("http://localhost:5000/api/students/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        localStorage.clear();
        return navigate("/login");
      }

      const data = await res.json();
      setProfile(data);
      if (data._id) fetchAttendanceStats(data._id);
    } catch {
      setError("Unable to fetch profile. Try again.");
    }
  };

  const fetchAttendanceStats = async (studentId) => {
    setError(null);
    try {
      const res = await fetch(
        `http://localhost:5000/api/students/${studentId}/attendance/stats`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.status === 401) {
        localStorage.clear();
        return navigate("/login");
      }

      const data = await res.json();
      setAttendanceStats(data);

      const total = data.reduce((sum, stat) => sum + stat.totalClasses, 0);
      const present = data.reduce((sum, stat) => sum + stat.presentClasses, 0);
      setOverallAttendance({ total, present });
    } catch {
      setError("Unable to fetch attendance. Try again.");
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setShowDropdown(false);
    localStorage.clear();
    setIsLoggingOut(false);
    window.location.href = "/login"; 
  };

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setShowDropdown((prev) => !prev);
  };
  
  if (error) {
    return (
      <div className="dashboard-container">
        <p className="error-text">{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="dashboard-container">
        <p className="loading-text">Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1>🎓 Student Dashboard</h1>
        <div className="profile-wrapper" ref={dropdownRef}>
          <div className="avatar-container" onClick={toggleDropdown}>
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=4A90E2&color=fff&size=40`}
              alt="Profile"
              className="avatar-img"
            />
            <span className="profile-name">{profile.name}</span>
            <span className="dropdown-arrow">{showDropdown ? "▲" : "▼"}</span>
          </div>

          {showDropdown && (
            <div className="dropdown-menu">
              <div className="dropdown-user-info">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=4A90E2&color=fff&size=50`}
                  alt="Profile"
                />
                <span>{profile.user?.email || "N/A"}</span>
                <span>{profile.enrollmentNumber}</span>
              </div>
              <button onClick={handleLogout} disabled={isLoggingOut}>
                {isLoggingOut ? "Logging out..." : "Logout"}
              </button>
            </div>
          )}
        </div>
      </header>

      <div className="dashboard-content">
        {/* Profile Info */}
        <section>
          <h2>👤 Profile</h2>
          <ul>
            <li><strong>Name:</strong> {profile.name}</li>
            <li><strong>Email:</strong> {profile.user?.email || "N/A"}</li>
            <li><strong>Enrollment:</strong> {profile.enrollmentNumber}</li>
            <li><strong>Branch:</strong> {profile.branch}</li>
            <li><strong>Class:</strong> {profile.classId?.name || "N/A"}</li>
          </ul>
        </section>

        {/* Attendance */}
        <section>
          <h2>📊 Attendance</h2>

          {attendanceStats.length === 0 ? (
            <p>No attendance data available.</p>
          ) : (
            <>
              <table>
                <thead>
                  <tr>
                    <th>Subject</th>
                    <th>Code</th>
                    <th>Total</th>
                    <th>Present</th>
                    <th>%</th>
                  </tr>
                </thead>
                <tbody>
                  {attendanceStats.map((stat, i) => (
                    <tr key={i}>
                      <td>{stat.subject?.name || "N/A"}</td>
                      <td>{stat.subject?.code || "N/A"}</td>
                      <td>{stat.totalClasses}</td>
                      <td>{stat.presentClasses}</td>
                      <td>{stat.attendancePercentage.toFixed(1)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Bar Chart */}
              <ResponsiveContainer width="100%" height={300}>
                <BarChart
                  data={attendanceStats.map((stat) => ({
                    name: stat.subject?.code || "N/A",
                    percentage: +stat.attendancePercentage.toFixed(1),
                  }))}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Bar dataKey="percentage" fill="#4A90E2" />
                </BarChart>
              </ResponsiveContainer>

              {/* Pie Chart */}
              {overallAttendance && (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: "Present", value: overallAttendance.present },
                        {
                          name: "Absent",
                          value:
                            overallAttendance.total - overallAttendance.present,
                        },
                      ]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                    >
                      <Cell fill={COLORS[0]} />
                      <Cell fill={COLORS[1]} />
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
};

export default StudentDashboard;
