import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./TeacherDashboard.css";
import NavbarWithSidebar from '../components/NavbarWithSidebar';


const TeacherDashboard = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [students, setStudents] = useState([]);
  const [attendanceList, setAttendanceList] = useState([]);
  const [selectedDate, setSelectedDate] = useState("");
  const [message, setMessage] = useState("");
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [errorLoadingProfile, setErrorLoadingProfile] = useState(false);
  const [attendanceSummary, setAttendanceSummary] = useState([]);

  const navigate = useNavigate();
  const dropdownRef = useRef(null);
  const token = localStorage.getItem("token");

  // ----------------------------------- Initialization ----------------------------------- //
  useEffect(() => {
    const initializeDashboard = async () => {
      if (!token) {
        navigate("/");
        return;
      }

      setLoadingProfile(true);
      setErrorLoadingProfile(false);
      setMessage("");

//-------------------------------------------Teacher profile-------------------------------------------//
      try {
        const res = await fetch("http://localhost:5000/api/teachers/profile/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          localStorage.clear();
          navigate("/", { replace: true });
          return;
        }

        if (!res.ok) {
          const errorData = await res.json();
          throw new Error(errorData.message || `HTTP error ${res.status}`);
        }

        const data = await res.json();
        setTeacherProfile(data);
        await fetchSubjects();
        await fetchAttendanceSummary();

      } 
      catch (err) {
        setMessage("❌ Failed to fetch teacher profile. Please try again.");
        setErrorLoadingProfile(true);
      } 
      finally {
        setLoadingProfile(false);
      }
    };
//-----------------------------------------------------------------------------------------------------//
    initializeDashboard();

    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
    // eslint-disable-next-line
  }, [token, navigate]);
  

// -------------------------------------------- Fetch Subjects -------------------------------------------- //
  const fetchSubjects = async () => {
    try {
      const res = await fetch("http://localhost:5000/api/teachers/subjects", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.json();
      if (res.ok) {
        setSubjects(data);
      } 
      else {
        setMessage("❌ Failed to fetch subjects.");
      }
    } 
    catch (err) {
      setMessage("❌ Error fetching subjects.");
    }
  };

// ----------------------------------------- Subject Change ---------------------------------------- //
  const handleSubjectChange = async (e) => {
    const subjectId = e.target.value;
    setSelectedSubjectId(subjectId);
    setStudents([]);
    setAttendanceList([]);
    setMessage("");

    if (!subjectId) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/teachers/subject/${subjectId}/students`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      if (res.ok) {
        setStudents(data);
        setAttendanceList(
          data.map((student) => ({
            studentId: student._id,
            roll:student.enrollmentNumber,
            status: "Present",
          }))
        );
      } 
      else {
        setMessage("❌ Failed to fetch students for this subject.");
      }
    } 
    catch (err) {
      setMessage("❌ Error fetching students.");
    }
  };

  // ----------------------------------- Attendance Summary ----------------------------------- //
  const fetchAttendanceSummary = async (selectedSubjectId) => {
    if (!selectedSubjectId) return;

    try {
      const res = await fetch(
        `http://localhost:5000/api/teachers/subject/${selectedSubjectId}/summary`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.json();
      if (res.ok) {
        setAttendanceSummary(data);
      } else {
        console.error("Error fetching attendance summary:", data.message || data.error);
      }
    } catch (err) {
      console.error("Error fetching attendance summary:", err.message || err);
    }
  };

//------------------------------------------- Attendance state handling function -----------------------------------------//
const setStudentAttendance = (studentId, status) => {
  setAttendanceList((prevList) => {
    const existingEntry = prevList.find(entry => entry.studentId === studentId);
    if (existingEntry) {
      return prevList.map((entry) =>
        entry.studentId === studentId ? { ...entry, status } : entry
      );
    } else {
      return [...prevList, { studentId, status }];
    }
  });
};

// Handle date input change
const handleDateChange = (e) => {
  setSelectedDate(e.target.value);  // Format should be 'YYYY-MM-DD'
};

// Submit attendance to backend
const handleSubmitAttendance = async () => {
  if (!selectedSubjectId || !selectedDate || attendanceList.length === 0) {
    setMessage("❌ Please select subject, date, and mark attendance.");
    return;
  }

  try {
    const response = await fetch("http://localhost:5000/api/teachers/mark-attendance", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`, // Assuming token is available in state
      },
      body: JSON.stringify({
        subjectId: selectedSubjectId,
        date: selectedDate,
        attendanceList: attendanceList.map(({ studentId, status }) => ({
          studentId,
          status
        }))
      }),
    });

    const data = await response.json();

    if (response.ok) {
      setMessage(`✅ ${data.message}`);
    } else {
      setMessage(`❌ Failed to mark attendance: ${data.error || "Unknown error"}`);
    }
  } catch (error) {
    console.error("❌ Error submitting attendance:", error);
    setMessage("❌ Network or server error while submitting attendance.");
  }
};

  // ----------------------------------- Conditional Renders ----------------------------------- //
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
        <p>{message || "Please try logging in again."}</p>
        <button onClick={() => navigate("/")} className="btn btn-light mt-3">
          Go to Login
        </button>
      </div>
    );
  }






  // ------------------------------------------------- Main Dashboard Render -------------------------------------------------//

  return (
    <div className="dashboard-container">
      {/* Top Navbar with collapsible sidebar */}
      <NavbarWithSidebar teacherProfile={teacherProfile} />

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
              <span>{teacherProfile.user?.email || "N/A"}</span>
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
              <div
                className="table-responsive"
                style={{
                  marginBottom: "1.5rem",
                  borderRadius: "12px",
                  overflow: "hidden",
                }}
              >
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
                    {students.map((student, index) => {
                      const attendanceEntry = attendanceList.find(
                        (a) => a.studentId === student._id
                      );
                      const currentStatus =
                        attendanceEntry?.status || "Present"; 

                      return (
                        <tr key={student._id}>
                          <td>{index + 1}</td>
                          <td>{student.name}</td>
                          <td>{student.enrollmentNumber}</td>
                          <td>
                            <div className="status-buttons-container">
                              <button
                                className={`status-btn present-btn ${
                                  currentStatus === "Present" ? "active" : ""
                                }`}
                                onClick={() =>
                                  setStudentAttendance(student._id, "Present")
                                }
                              >
                                Present
                              </button>
                              <button
                                className={`status-btn absent-btn ${
                                  currentStatus === "Absent" ? "active" : ""
                                }`}
                                onClick={() =>
                                  setStudentAttendance(student._id, "Absent")
                                }
                              >
                                Absent
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <button
                className="btn btn-primary submit-attendance-btn"
                onClick={handleSubmitAttendance}
                disabled={
                  !selectedSubjectId ||
                  attendanceList.length === 0 ||
                  !selectedDate
                }
              >
                Submit Attendance
              </button>
            </>
          )}

          {selectedSubjectId && students.length === 0 && (
            <p className="no-students-message">
              No students found for the selected subject. Ensure a class is
              assigned to this subject.
            </p>
          )}

          {message && (
            <div
              className={`mt-3 alert ${
                message.startsWith("✅") ? "alert-success" : "alert-danger"
              }`}
            >
              {message}
            </div>
          )}
        </section>
      </div>
    </div>

  //--------------------------------------------------------------------------------------------------------------------------------//

  );
};

export default TeacherDashboard;
