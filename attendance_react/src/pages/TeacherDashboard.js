import React, { useEffect, useState } from "react";

const TeacherDashboard = () => {
  const [subjects, setSubjects] = useState([]);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [attendanceData, setAttendanceData] = useState([]);
  const token = localStorage.getItem("token");

  // Fetch assigned subjects to teacher
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

  // Fetch attendance when a subject is selected
  const handleSubjectChange = async (e) => {
    const subjectId = e.target.value;
    setSelectedSubjectId(subjectId);

    try {
      const response = await fetch(`http://localhost:5000/api/teachers/subject/${subjectId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await response.json();
      if (!response.ok) {
        console.error("Error fetching attendance:", data.error);
        return;
      }

      // Calculate per-student attendance stats
      const studentStats = {};
      data.forEach((record) => {
        const studentId = record.student._id;
        if (!studentStats[studentId]) {
          studentStats[studentId] = {
            name: record.student.name,
            enrollNumber: record.student.enrollmentNumber || "N/A",
            present: 0,
            total: 0,
          };
        }
        studentStats[studentId].total += 1;
        if (record.status === "Present") {
          studentStats[studentId].present += 1;
        }
      });

      // Convert to array
      const statsArray = Object.values(studentStats);
      setAttendanceData(statsArray);
    } catch (error) {
      console.error("Error fetching attendance data:", error);
    }
  };

  return (
    <div className="container mt-5">
      <h2 className="mb-4 text-center">Teacher Dashboard</h2>

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

      {attendanceData.length > 0 && (
        <div className="table-responsive">
          <table className="table table-bordered table-hover">
            <thead className="table-dark">
              <tr>
                <th>Name</th>
                <th>Enrollment Number</th>
                <th>Total Classes</th>
                <th>Present</th>
                <th>Attendance %</th>
              </tr>
            </thead>
            <tbody>
              {attendanceData.map((student, index) => (
                <tr key={index}>
                  <td>{student.name}</td>
                  <td>{student.enrollNumber}</td>
                  <td>{student.total}</td>
                  <td>{student.present}</td>
                  <td>{((student.present / student.total) * 100).toFixed(2)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedSubjectId && attendanceData.length === 0 && (
        <p>No attendance records available for this subject.</p>
      )}
    </div>
  );
};

export default TeacherDashboard;
