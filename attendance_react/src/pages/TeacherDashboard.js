import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./TeacherDashboard.css"; // Import the new CSS file

const TeacherDashboard = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [students, setStudents] = useState([]);
  const [attendanceList, setAttendanceList] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [message, setMessage] = useState("");
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [errorLoadingProfile, setErrorLoadingProfile] = useState(false);

  const navigate = useNavigate();
  const dropdownRef = useRef(null);

  const token = localStorage.getItem("token");

  // Effect to handle initial data fetching and token validation
  useEffect(() => {
    const initializeDashboard = async () => {
      setLoadingProfile(true);
      setErrorLoadingProfile(false); // Reset error state
      setMessage(""); // Clear any previous messages

      if (!token) {
        navigate("/login");
        return;
      }

      // Fetch teacher profile
      try {
        const res = await fetch("http://localhost:5000/api/teachers/profile", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          // Token expired or invalid
          localStorage.removeItem("token");
          localStorage.removeItem("userRole");
          localStorage.removeItem("userId");
          localStorage.removeItem("userType");
          navigate("/login", { replace: true });
          return;
        }

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || `HTTP error! status: ${res.status}`);
        }

        const data = await res.json();
        setTeacherProfile(data);
        // After successfully fetching profile, then fetch subjects
        fetchSubjects();
      } catch (err) {
        console.error("Teacher profile fetch error:", err);
        setMessage("❌ Failed to fetch teacher profile. Please try again.");
        setErrorLoadingProfile(true);
      } finally {
        setLoadingProfile(false);
      }
    };

    initializeDashboard();

    // Cleanup for dropdown click outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [token, navigate]); // Removed teacherProfile from dependencies to prevent re-fetching profile on its update

  const fetchSubjects = async () => {
    try {
      const response = await fetch("http://localhost:5000/api/teachers/subjects", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (response.ok) {
        setSubjects(data);
      } else {
        console.error("Failed to fetch subjects", data.error);
        setMessage("❌ Failed to fetch subjects.");
      }
    } catch (error) {
      console.error("Error fetching subjects:", error);
      setMessage("❌ Error fetching subjects.");
    }
  };

  const handleSubjectChange = async (e) => {
    const subjectId = e.target.value;
    setSelectedSubjectId(subjectId);
    setAttendanceList([]);
    setMessage("");
    setStudents([]); // Clear students when subject changes

    if (!subjectId) return;

    try {
      const response = await fetch(
        `http://localhost:5000/api/teachers/subject/${subjectId}/students`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();
      if (response.ok) {
        setStudents(data);
        const defaultAttendance = data.map((student) => ({
          studentId: student._id,
          status: "Present",
        }));
        setAttendanceList(defaultAttendance);
      } else {
        console.error("Failed to fetch students", data.error);
        setMessage("❌ Failed to fetch students for this subject.");
      }
    } catch (error) {
      console.error("Error fetching students:", error);
      setMessage("❌ Error fetching students.");
    }
  };

  const handleStatusChange = (studentId, status) => {
    setAttendanceList((prevList) =>
      prevList.map((entry) =>
        entry.studentId === studentId ? { ...entry, status } : entry
      )
    );
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  const handleSubmitAttendance = async () => {
    if (!selectedSubjectId || attendanceList.length === 0 || !selectedDate) {
      setMessage("❌ Please select subject, date, and mark attendance for all students.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/teachers/mark-attendance", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subjectId: selectedSubjectId,
          date: selectedDate,
          attendanceList,
        }),
      });

      const data = await response.json();
      if (response.ok) {
        setMessage(`✅ Attendance marked successfully`);
      } else {
        setMessage("❌ Failed to mark attendance: " + (data.error || response.statusText));
      }
    } catch (err) {
      console.error("Error submitting attendance:", err);
      setMessage("❌ Error occurred while submitting attendance.");
    }
  };

  const handleLogout = async () => {
    setIsLoggingOut(true);
    setShowDropdown(false);

    try {
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
      localStorage.removeItem("token");
      localStorage.removeItem("userRole");
      localStorage.removeItem("userId");
      localStorage.removeItem("userType");
      setIsLoggingOut(false);
      navigate("/login", { replace: true });
    }
  };

  const toggleDropdown = (e) => {
    e.stopPropagation();
    setShowDropdown((prev) => !prev);
  };

  // --- Render based on loading/error states ---
  if (loadingProfile) {
    return (
      <div className="loading-container-full">
        <div className="loading-spinner"></div>
        <p className="loading-text">Loading teacher dashboard...</p>
      </div>
    );
  }

  if (errorLoadingProfile || !teacherProfile) {
    return (
      <div className="error-container-full">
        <h2>Failed to Load Dashboard</h2>
        <p style={{ fontSize: '1.1rem', textAlign: 'center' }}>{message || "There was an error loading your profile. Please try logging in again."}</p>
        <button onClick={() => navigate("/login", { replace: true })} className="btn btn-light mt-3">
          Go to Login
        </button>
      </div>
    );
  }

  // --- Main Dashboard Render ---
  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="header-content">
          <h1 className="dashboard-title">
            <span className="dashboard-icon">🧑‍🏫</span>
            Teacher Dashboard
          </h1>

          <div className="profile-wrapper" ref={dropdownRef}>
            <div className="avatar-container" onClick={toggleDropdown}>
              <img
                src={`https://ui-avatars.com/api/?name=${encodeURIComponent(teacherProfile.name)}&background=007bff&color=fff&size=40`}
                alt="Profile"
                className="avatar-img"
              />
              <div className="profile-info">
                <span className="profile-name">{teacherProfile.name}</span>
                <span className="profile-role">Teacher</span>
              </div>
              <span className={`dropdown-arrow ${showDropdown ? "open" : ""}`}>
                ▼
              </span>
            </div>

            {showDropdown && (
              <div className="dropdown-menu">
                <div className="dropdown-header">
                  <div style={{borderRadius: '50%', overflow: 'hidden'}}>
                    <img
                      src={`https://ui-avatars.com/api/?name=${encodeURIComponent(teacherProfile.name)}&background=007bff&color=fff&size=50`}
                      alt="Profile"
                      className="dropdown-avatar-img"
                    />
                  </div>
                  <div className="dropdown-user-info">
                    <span className="dropdown-name">{teacherProfile.name}</span>
                    <span className="dropdown-email">{teacherProfile.user?.email || 'N/A'}</span>
                    <span className="dropdown-id">Teacher ID: {teacherProfile.teacherId}</span>
                  </div>
                </div>

                <div className="dropdown-divider"></div>

                <div className="dropdown-items">
                  <button
                    onClick={handleLogout}
                    className="dropdown-item logout-btn"
                    disabled={isLoggingOut}
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

      <div className="dashboard-content-area">
        {/* Profile Section */}
        <section className="section-box">
          <div className="section-header">
            <h2 className="section-header-h2">
              <span className="section-icon">👤</span>
              My Profile
            </h2>
          </div>
          <div className="profile-grid">
            <div className="profile-item">
              <label>Name</label>
              <span>{teacherProfile.name}</span>
            </div>
            <div className="profile-item">
              <label>Email</label>
              <span>{teacherProfile.user?.email || 'N/A'}</span>
            </div>
            <div className="profile-item">
              <label>Teacher ID</label>
              <span>{teacherProfile.teacherId}</span>
            </div>
            <div className="profile-item">
              <label>Department</label>
              <span>{teacherProfile.department}</span>
            </div>
          </div>
        </section>

        {/* Mark Attendance Section */}
        <section className="section-box">
          <div className="section-header">
            <h2 className="section-header-h2">
              <span className="section-icon">✏️</span>
              Mark Attendance
            </h2>
          </div>

          <div className="mb-4">
            <label htmlFor="subjectSelect" className="form-label">
              Select Subject:
            </label>
            <select
              className="form-select"
              id="subjectSelect"
              value={selectedSubjectId}
              onChange={handleSubjectChange}
            >
              <option value="">-- Select a Subject --</option>
              {subjects.map((subject) => (
                <option key={subject._id} value={subject._id}>
                  {subject.name} ({subject.code})
                </option>
              ))}
            </select>
          </div>

          {selectedSubjectId && (
            <div className="mb-3">
              <label htmlFor="dateSelect" className="form-label">
                Select Date:
              </label>
              <input
                type="date"
                id="dateSelect"
                className="form-control"
                value={selectedDate}
                onChange={handleDateChange}
              />
            </div>
          )}

          {students.length > 0 && selectedSubjectId && selectedDate && (
            <>
              <h5 className="mb-3">Attendance List for the day</h5>
              <div className="table-responsive" style={{marginBottom: '1.5rem', borderRadius: '12px', overflow: 'hidden'}}>
                <table className="table table-striped table-hover attendance-table">
                  <thead className="table-dark">
                    <tr>
                      <th>#</th>
                      <th>Name</th>
                      <th>Enrollment No.</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {students.map((student, index) => (
                      <tr key={student._id}>
                        <td>{index + 1}</td>
                        <td>{student.name}</td>
                        <td>{student.enrollmentNumber}</td>
                        <td>
                          <select
                            value={
                              attendanceList.find((a) => a.studentId === student._id)?.status || "Present"
                            }
                            onChange={(e) => handleStatusChange(student._id, e.target.value)}
                            className="form-select status-select"
                          >
                            <option value="Present">Present</option>
                            <option value="Absent">Absent</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                className="btn btn-primary submit-attendance-btn"
                onClick={handleSubmitAttendance}
                disabled={!selectedSubjectId || attendanceList.length === 0 || !selectedDate}
              >
                Submit Attendance
              </button>
            </>
          )}

          {selectedSubjectId && students.length === 0 && (
            <p className="no-students-message">No students found for the selected subject. Ensure a class is assigned to this subject.</p>
          )}

          {message && (
            <div className={`mt-3 alert ${message.startsWith('✅') ? 'alert-success' : 'alert-danger'}`}>
              {message}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default TeacherDashboard;