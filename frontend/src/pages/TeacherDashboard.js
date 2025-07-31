import React, { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./TeacherDashboard.css";
import NavbarWithSidebar from '../components/NavbarWithSidebar';
import axios from "axios";
axios.defaults.baseURL = process.env.REACT_APP_BACKEND_URL;

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
        const res = await axios.get("/api/teachers/profile/me", {
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 401) {
          localStorage.clear();
          navigate("/", { replace: true });
          return;
        }


        const data = res.data;
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
      const res = await axios.get("/api/teachers/subjects", {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = await res.data;

      setSubjects(data);
    
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
  const selectedSubject = subjects.find((s) => s._id === subjectId);
  if (!selectedSubject) {
    setMessage("❌ Selected subject not found.");
    return;
  }
    try {
      const res = await axios.get(
        `/api/teachers/subject/${selectedSubject.code}/students`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      const data = await res.data;
      setStudents(data);
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
    const res = await axios.post(
      "/api/teachers/attendance-by-date",
      { subjectId, date }, // <-- this is the data (not body)
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    const data = res.data; // axios auto parses JSON

    if (Array.isArray(data.records) && data.records.length > 0) {
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
      setAttendanceList(
        students.map((student) => ({
          studentId: student._id,
          roll: student.enrollmentNumber,
          status: "Present",
        }))
      );
    }
  } catch (error) {
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
    const response = await axios.post(
      "/api/teachers/mark-attendance",
      {
        subjectId: selectedSubjectId,
        date: selectedDate,
        attendanceList: attendanceList.map(({ studentId, status }) => ({
          studentId,
          status
        }))
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        }
      }
    );

    setMessage(`✅ ${response.data.message || "Attendance marked successfully."}`);
    setAttendanceExists(true);
  } catch (error) {
    if (error.response && error.response.data && error.response.data.error) {
      setMessage(`❌ Failed to mark attendance: ${error.response.data.error}`);
    } else {
      setMessage("❌ Network or server error while submitting attendance.");
    }
  }
};

  // Update attendance to backend
const handleUpdateAttendance = async () => {
  if (!selectedSubjectId || !selectedDate || attendanceList.length === 0) {
    setMessage("❌ Please select subject, date, and mark attendance.");
    return;
  }

  try {
    const response = await axios.put(
      "/api/teachers/update-attendance",
      {
        subjectId: selectedSubjectId,
        date: selectedDate,
        records: attendanceList.map(({ studentId, status }) => ({
          student: studentId,
          status
        }))
      },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        }
      }
    );

    setMessage(`✅ ${response.data.message || "Attendance updated successfully."}`);
  } catch (error) {
    if (error.response && error.response.data && error.response.data.error) {
      setMessage(`❌ Failed to update attendance: ${error.response.data.error}`);
    } else {
      setMessage("❌ Network or server error while updating attendance.");
    }
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