import React, { useEffect, useState } from "react";

const API_BASE = "http://localhost:5000/api";

const TeacherDashboard = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState("");
  const [attendanceList, setAttendanceList] = useState([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetch(`${API_BASE}/teachers/subjects`, {
      method: "GET",
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => {
        setSubjects(data);
        if (data.length > 0) setSelectedSubject(data[0]._id);
      })
      .catch((err) => console.error("Failed to fetch subjects:", err));
  }, [token]);

  useEffect(() => {
    if (!selectedSubject) return;

    setLoadingStudents(true);
    setMessage("");

    fetch(`${API_BASE}/teachers/subject/${selectedSubject}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((records) => {
        if (records.length === 0) {
          setAttendanceList([]);
          setLoadingStudents(false);
          setMessage("No attendance records found. You can add attendance.");
          return;
        }

        const attendanceData = records.map((record) => ({
          studentId: record.student._id,
          name: record.student.name,
          rollNumber: record.student.rollNumber || "N/A",
          status: record.status,
        }));

        setAttendanceList(attendanceData);
        setLoadingStudents(false);
      })
      .catch((err) => {
        console.error("Failed to fetch attendance records:", err);
        setLoadingStudents(false);
        setMessage("Failed to load attendance data.");
      });
  }, [selectedSubject, token]);

  const handleStatusChange = (studentId, newStatus) => {
    setAttendanceList((prevList) =>
      prevList.map((item) =>
        item.studentId === studentId ? { ...item, status: newStatus } : item
      )
    );
  };

  const handleSubmit = () => {
    if (!selectedSubject) return;

    const date = new Date().toISOString().slice(0, 10);

    const attendancePayload = attendanceList.map((item) => ({
      studentId: item.studentId,
      status: item.status,
    }));

    fetch(`${API_BASE}/teachers/mark-attendance`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        subjectId: selectedSubject,
        date,
        attendanceList: attendancePayload,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error("Failed to mark attendance");
        return res.json();
      })
      .then((data) => {
        setMessage(data.message || "Attendance marked successfully");
      })
      .catch((err) => {
        console.error(err);
        setMessage("Failed to mark attendance");
      });
  };

  return (
    <div className="container mt-4">
      <h2 className="mb-4">Teacher Dashboard</h2>

      <div className="mb-3">
        <label htmlFor="subjectSelect" className="form-label">
          Select Subject
        </label>
        <select
          id="subjectSelect"
          className="form-select"
          value={selectedSubject}
          onChange={(e) => setSelectedSubject(e.target.value)}
        >
          {subjects.map((subj) => (
            <option key={subj._id} value={subj._id}>
              {subj.name} ({subj.code})
            </option>
          ))}
        </select>
      </div>

      {loadingStudents ? (
        <div className="text-center my-5">
          <div
            className="spinner-border text-primary"
            role="status"
            aria-hidden="true"
          ></div>
          <div>Loading students and attendance...</div>
        </div>
      ) : attendanceList.length === 0 ? (
        <div className="alert alert-info" role="alert">
          {message || "No students found for this subject."}
        </div>
      ) : (
        <div className="table-responsive">
          <table className="table table-striped table-bordered align-middle">
            <thead className="table-dark">
              <tr>
                <th>Name</th>
                <th>Enrollment No.</th>
                <th>Attendance Status</th>
              </tr>
            </thead>
            <tbody>
              {attendanceList.map((student) => (
                <tr key={student.studentId}>
                  <td>{student.name}</td>
                  <td>{student.rollNumber}</td>
                  <td>
                    <select
                      className="form-select"
                      value={student.status}
                      onChange={(e) =>
                        handleStatusChange(student.studentId, e.target.value)
                      }
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
      )}

      <button
        className="btn btn-primary mt-3"
        onClick={handleSubmit}
        disabled={attendanceList.length === 0}
      >
        Submit Attendance
      </button>

      {message && (
        <div className="alert alert-secondary mt-3" role="alert">
          {message}
        </div>
      )}
    </div>
  );
};

export default TeacherDashboard;
