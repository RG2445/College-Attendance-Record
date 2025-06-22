import React, { useEffect, useState } from "react";

const TeacherDashboard = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [students, setStudents] = useState([]);
  const [attendanceList, setAttendanceList] = useState([]);
  const [selectedDate, setSelectedDate] = useState(""); 
  const [message, setMessage] = useState("");

  const token = localStorage.getItem("token");

  useEffect(() => {
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
        }
      } catch (error) {
        console.error("Error fetching subjects:", error);
      }
    };

    fetchSubjects();
  }, [token]);

  const handleSubjectChange = async (e) => {
    const subjectId = e.target.value;
    setSelectedSubjectId(subjectId);
    setAttendanceList([]);
    setMessage("");

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
      }
    } catch (error) {
      console.error("Error fetching students:", error);
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
        setMessage("❌ Failed to mark attendance: " + data.error);
      }
    } catch (err) {
      console.error("Error submitting attendance:", err);
      setMessage("❌ Error occurred while submitting attendance.");
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4 text-center">📚 Teacher Dashboard</h2>

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

      {students.length > 0 && (
        <>
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

          <h5 className="mb-3">Mark Attendance for {students.length} Students</h5>
          <table className="table table-bordered">
            <thead className="table-dark">
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Branch</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student) => (
                <tr key={student._id}>
                  <td>{student.name}</td>
                  <td>{student.user.email}</td>
                  <td>{student.branch}</td>
                  <td>
                    <select
                      value={
                        attendanceList.find((a) => a.studentId === student._id)?.status || "Present"
                      }
                      onChange={(e) => handleStatusChange(student._id, e.target.value)}
                      className="form-select"
                    >
                      <option value="Present">Present</option>
                      <option value="Absent">Absent</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button className="btn btn-primary" onClick={handleSubmitAttendance}>
            Submit Attendance
          </button>
        </>
      )}

      {selectedSubjectId && students.length === 0 && (
        <p>No students found for the selected subject's class.</p>
      )}

      {message && <div className="mt-3 alert alert-info">{message}</div>}
    </div>
  );
};

export default TeacherDashboard;
