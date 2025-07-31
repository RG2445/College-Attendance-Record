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
  // eslint-disable-next-line
  const [showDropdown, setShowDropdown] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [errorLoadingProfile, setErrorLoadingProfile] = useState(false);
  const [attendanceExists, setAttendanceExists] = useState(false);

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
      } 
      catch (err) {
        setMessage("❌ Failed to fetch teacher profile. Please try again.");
        setErrorLoadingProfile(true);
      } 
      finally {
        setLoadingProfile(false);
      }
    };

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
  
  useEffect(() => {
  if (message) {
    const timer = setTimeout(() => setMessage(""), 3000); // 3 seconds
    return () => clearTimeout(timer);
  }
}, [message]);
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
    setSelectedDate("");
    setAttendanceExists(false);

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
      } 
      else {
        setMessage("❌ Failed to fetch students for this subject.");
      }
    } 
    catch (err) {
      setMessage("❌ Error fetching students.");
    }
  };

  // ----------------------------------- Fetch Attendance For Date ----------------------------------- //
  const fetchAttendanceForDate = async (subjectId, date) => {
    if (!subjectId || !date) {
      setAttendanceExists(false);
      setAttendanceList([]);
      return;
    }
    try {
      const res = await fetch("http://localhost:5000/api/teachers/attendance-by-date", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ subjectId, date }),
      });
      const data = await res.json();
      if (res.ok && Array.isArray(data.records) && data.records.length > 0) {
        setAttendanceExists(true);
        setAttendanceList(
          data.records.map((entry) => ({
            studentId: entry.student._id,
            roll: entry.student.enrollmentNumber,
            status: entry.status,
          }))
        );
      } else {
        setAttendanceExists(false);
        // Default all students to Present
        setAttendanceList(
          students.map((student) => ({
            studentId: student._id,
            roll: student.enrollmentNumber,
            status: "Present",
          }))
        );
      }
    } catch {
      setAttendanceExists(false);
      setAttendanceList(
        students.map((student) => ({
          studentId: student._id,
          roll: student.enrollmentNumber,
          status: "Present",
        }))
      );
    }
  };

  // When subject or date changes, fetch attendance for that date
  useEffect(() => {
    if (selectedSubjectId && selectedDate && students.length > 0) {
      fetchAttendanceForDate(selectedSubjectId, selectedDate);
    }
    // eslint-disable-next-line
  }, [selectedSubjectId, selectedDate, students]);

  // Attendance status change
  const setStudentAttendance = (studentId, status) => {
    setAttendanceList((prevList) =>
      prevList.map((entry) =>
        entry.studentId === studentId ? { ...entry, status } : entry
      )
    );
  };

  // Handle date input change
  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
    // fetchAttendanceForDate will be triggered by useEffect
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
          Authorization: `Bearer ${token}`,
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
        setMessage(`✅ ${data.message || "Attendance marked successfully."}`);
        setAttendanceExists(true);
        // After submit, attendanceList already has correct data
      } else {
        setMessage(`❌ Failed to mark attendance: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      setMessage("❌ Network or server error while submitting attendance.");
    }
  };

  // Update attendance to backend
  const handleUpdateAttendance = async () => {
    if (!selectedSubjectId || !selectedDate || attendanceList.length === 0) {
      setMessage("❌ Please select subject, date, and mark attendance.");
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/api/teachers/update-attendance", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          subjectId: selectedSubjectId,
          date: selectedDate,
          records: attendanceList.map(({ studentId, status }) => ({
            student: studentId,
            status
          }))
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`✅ ${data.message || "Attendance updated successfully."}`);
      } else {
        setMessage(`❌ Failed to update attendance: ${data.error || "Unknown error"}`);
      }
    } catch (error) {
      setMessage("❌ Network or server error while updating attendance.");
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
              {!attendanceExists ? (
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
              ) : (
                <button
                  className="btn btn-warning update-attendance-btn"
                  onClick={handleUpdateAttendance}
                  disabled={
                    !selectedSubjectId ||
                    attendanceList.length === 0 ||
                    !selectedDate
                  }
                >
                  Update Attendance
                </button>
              )}
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
    className={`alert ${message.startsWith("✅") ? "alert-success" : "alert-danger"} alert-dismissible fade show mt-3`}
    role="alert"
  >
    {message}
    <button
      type="button"
      className="btn-close"
      data-bs-dismiss="alert"
      aria-label="Close"
      onClick={() => setMessage("")}
    ></button>
  </div>
)}
        </section>
      </div>
    </div>
  );
};

export default TeacherDashboard;