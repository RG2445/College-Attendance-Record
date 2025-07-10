import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import "./StudentDashboard.css"; // Ensure this path is correct

const COLORS = ["#4A90E2", "#FF8C00"]; // Colors for the Pie Chart

const StudentDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [attendanceStats, setAttendanceStats] = useState([]);
  const [overallAttendance, setOverallAttendance] = useState(null);
  const [error, setError] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false); // State to manage logout button loading
  const navigate = useNavigate();
  const dropdownRef = useRef(null); // Ref for closing dropdown on outside click

  const token = localStorage.getItem("token");

  // Effect to check for token and fetch profile on component mount
  useEffect(() => {
    if (!token) {
      navigate("/login");
      return;
    }
    fetchProfile();
    // eslint-disable-next-line
  }, []); // Empty dependency array means this runs once on mount

  // Effect to close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close dropdown if clicked outside of the profile wrapper entirely
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchProfile = async () => {
    setError(null); // Clear previous errors
    try {
      const res = await fetch("http://localhost:5000/api/students/profile", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.status === 401) {
        // Token expired or invalid
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setProfile(data);
      // Fetch attendance stats only after profile is successfully loaded
      if (data._id) { // Ensure student ID exists before fetching attendance
          fetchAttendanceStats(data._id);
      } else {
          console.warn("Student ID not found in profile data.");
      }
    } catch (err) {
      setError("Failed to fetch student profile. Please try again.");
      console.error("Profile fetch error:", err);
    }
  };

  const fetchAttendanceStats = async (studentId) => {
    setError(null); // Clear previous errors
    try {
      const res = await fetch(
        `http://localhost:5000/api/students/${studentId}/attendance/stats`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.status === 401) {
        // Token expired or invalid
        localStorage.removeItem("token");
        navigate("/login");
        return;
      }

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      setAttendanceStats(data);

      // Calculate overall attendance
      const total = data.reduce((sum, stat) => sum + stat.totalClasses, 0);
      const present = data.reduce((sum, stat) => sum + stat.presentClasses, 0);
      setOverallAttendance({ total, present });
    } catch (err) {
      setError("Failed to fetch attendance statistics. Please try again.");
      console.error("Attendance fetch error:", err);
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true); // Disable button and show loading state
    setShowDropdown(false); // Close dropdown immediately

    try {
      // Call logout API endpoint (optional, but good practice to invalidate server-side session)
      // Note: This API endpoint might not exist on your backend.
      // The crucial part for client-side logout is clearing localStorage.
      const response = await fetch("http://localhost:5000/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        console.log("Logout successful on server.");
      } else {
        console.error("Logout failed on server:", response.statusText);
      }
    } catch (error) {
      console.error("Error during logout API call:", error);
    } finally {
      // Always clear local storage and navigate, even if API call fails
      localStorage.removeItem("token");
      localStorage.removeItem("userRole"); // Clear any other relevant user data
      localStorage.removeItem("userId");
      localStorage.removeItem("userType");
      setIsLoggingOut(false); // Re-enable button state (though we're navigating away)
      navigate("/login", { replace: true }); // Use replace to prevent back navigation to dashboard
    }
  };

  const toggleDropdown = (e) => {
    // This e.stopPropagation() is important to prevent the document's mousedown listener
    // from immediately closing the dropdown after it's opened by the click on avatar-container.
    e.stopPropagation();
    setShowDropdown((prev) => !prev);
  };

  // Render error state
  if (error) {
    return (
      <div className="dashboard-container">
        <div className="error-container">
          <p className="error-text">{error}</p>
          <button className="retry-button" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  // Render loading state
  if (!profile) {
    return (
      <div className="dashboard-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading student dashboard...</p>
        </div>
      </div>
    );
  }

  // Main Dashboard Render
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">
            <span className="dashboard-icon">🎓</span>
            Student Dashboard
          </h1>

          {/* Profile Wrapper with Ref for click-outside-to-close */}
          <div className="profile-wrapper" ref={dropdownRef}>
            {/* Avatar Container: This is the clickable area */}
            <div className="avatar-container" onClick={toggleDropdown}>
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=4A90E2&color=fff&size=40`}
                alt="Profile"
                className="avatar-img"
              />
              <div className="profile-info">
                <span className="profile-name">{profile.name}</span>
                <span className="profile-role">Student</span>
              </div>
              <span className={`dropdown-arrow ${showDropdown ? "open" : ""}`}>
                ▼
              </span>
            </div>

            {/* Dropdown Menu: Conditionally rendered based on showDropdown state */}
            {showDropdown && (
              <div className="dropdown-menu">
                <div className="dropdown-header">
                  <div className="dropdown-avatar">
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(profile.name)}&background=4A90E2&color=fff&size=50`}
                      alt="Profile"
                    />
                  </div>
                  <div className="dropdown-user-info">
                    <span className="dropdown-name">{profile.name}</span>
                    {/* Access email from profile.user.email */}
                    <span className="dropdown-email">{profile.user?.email || 'N/A'}</span>
                    <span className="dropdown-enrollment">
                      {profile.enrollmentNumber}
                    </span>
                  </div>
                </div>

                <div className="dropdown-divider"></div>

                <div className="dropdown-items">
                  <button
                    onClick={handleLogout}
                    className="dropdown-item logout-btn"
                    disabled={isLoggingOut} // Disable button when logging out
                  >
                    {isLoggingOut ? (
                      <>
                        <div className="spinner"></div>
                        <span>Logging out...</span>
                      </>
                    ) : (
                      <>
                        <span className="logout-icon">🚪</span>
                        <span>Logout</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <section className="profile-section">
          <div className="section-header">
            <h2>
              <span className="section-icon">👤</span>
              Profile Information
            </h2>
          </div>

          <div className="profile-grid">
            <div className="profile-item">
              <label>Name</label>
              <span>{profile.name}</span>
            </div>
            <div className="profile-item">
              <label>Email</label>
              <span>{profile.user?.email || 'N/A'}</span>
            </div>
            <div className="profile-item">
              <label>Enrollment No</label>
              <span>{profile.enrollmentNumber}</span>
            </div>
            <div className="profile-item">
              <label>Branch</label>
              <span>{profile.branch}</span>
            </div>
            <div className="profile-item">
              <label>Class</label>
              <span>{profile.classId?.name || "N/A"}</span>
            </div>
          </div>
        </section>

        <section className="attendance-section">
          <div className="section-header">
            <h2>
              <span className="section-icon">📊</span>
              Attendance Statistics
            </h2>
          </div>

          {attendanceStats.length === 0 ? (
            <div className="no-data">
              <div className="no-data-icon">📚</div>
              <p>No attendance data available yet.</p>
              <p>Please check back later or contact your administration.</p>
            </div>
          ) : (
            <>
              <div className="table-container">
                <table className="attendance-table">
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
                        <td>{stat.subject?.name || "N/A"}</td>
                        <td>
                          <span className="subject-code">
                            {stat.subject?.code || "N/A"}
                          </span>
                        </td>
                        <td>{stat.totalClasses}</td>
                        <td>{stat.presentClasses}</td>
                        <td>
                          <span
                            className={`percentage ${
                              stat.attendancePercentage >= 75
                                ? "good"
                                : stat.attendancePercentage >= 50
                                ? "average"
                                : "poor"
                            }`}
                          >
                            {stat.attendancePercentage.toFixed(1)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="charts-container">
                <div className="chart-section">
                  <h3>Subject-wise Attendance</h3>
                  <div className="chart-wrapper">
                    <ResponsiveContainer width="100%" height={350}>
                      <BarChart
                        data={attendanceStats.map((stat) => ({
                          name: stat.subject?.code || "N/A",
                          percentage: +stat.attendancePercentage.toFixed(1),
                        }))}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="name" />
                        <YAxis
                          domain={[0, 100]}
                          tickFormatter={(val) => `${val}%`}
                        />
                        <Tooltip formatter={(val) => `${val}%`} />
                        <Bar
                          dataKey="percentage"
                          fill="#4A90E2"
                          radius={[4, 4, 0, 0]}
                        />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {overallAttendance && (
                  <div className="overall-attendance-section">
                    <h3>Overall Attendance</h3>
                    <div className="overall-stats">
                      <div className="stat-item">
                        <span className="stat-value">
                          {(
                            (overallAttendance.present / overallAttendance.total) *
                            100
                          ).toFixed(1)}
                          %
                        </span>
                        <span className="stat-label">Overall Percentage</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-value">
                          {overallAttendance.present}/{overallAttendance.total}
                        </span>
                        <span className="stat-label">Classes Attended</span>
                      </div>
                    </div>

                    <div className="pie-chart-wrapper">
                      <ResponsiveContainer width="100%" height={300}>
                        <PieChart>
                          <Pie
                            dataKey="value"
                            data={[
                              {
                                name: "Present",
                                value: overallAttendance.present,
                              },
                              {
                                name: "Absent",
                                value:
                                  overallAttendance.total -
                                  overallAttendance.present,
                              },
                            ]}
                            cx="50%"
                            cy="50%"
                            outerRadius={80}
                            label={({ name, percent }) =>
                              `${name} ${(percent * 100).toFixed(0)}%`
                            }
                          >
                            {[
                              { value: overallAttendance.present },
                              {
                                value:
                                  overallAttendance.total -
                                  overallAttendance.present,
                              },
                            ].map((entry, index) => (
                              <Cell
                                key={`cell-${index}`}
                                fill={COLORS[index % COLORS.length]}
                              />
                            ))}
                          </Pie>
                          <Tooltip />
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
    </div>
  );
};

export default StudentDashboard;