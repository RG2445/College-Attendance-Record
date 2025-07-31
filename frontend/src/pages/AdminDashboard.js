import React, { useEffect, useState } from "react";
import axios from "axios";
axios.defaults.baseURL = "http://localhost:5000";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [attendanceReport, setAttendanceReport] = useState([]);
  const [lowAttendance, setLowAttendance] = useState([]);
  const [classSummary, setClassSummary] = useState([]);
  const [message, setMessage] = useState("");
  const [createRole, setCreateRole] = useState("student");

  const [tab, setTab] = useState("users");
  const token = localStorage.getItem("token");

  // Fetch all data on mount
  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [usersRes, teachersRes, studentsRes, classesRes, subjectsRes] = await Promise.all([
        axios.get("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/api/admin/teachers", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/api/admin/users?role=student", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/api/admin/classes", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/api/admin/subjects", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setUsers(usersRes.data);
      setTeachers(teachersRes.data);
      setStudents(studentsRes.data);
      setClasses(classesRes.data);
      setSubjects(subjectsRes.data);
    } catch {
      setMessage("Failed to fetch initial data");
    }
  };

const handleCreateUser = async (payload) => {
  try {
    await axios.post("/api/admin/users", payload, { headers: { Authorization: `Bearer ${token}` } });
    setMessage("User created successfully");
    fetchAll();
  } catch (err) {
    setMessage(err.response?.data?.error || "Failed to create user");
  }
};

  // Delete user
  const handleDeleteUser = async (id) => {
    try {
      await axios.delete(`/api/admin/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setMessage("User deleted successfully");
      fetchAll();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to delete user");
    }
  };

  // Create class
  const handleCreateClass = async (name, branch, studentIds) => {
    try {
      await axios.post("/api/admin/classes", { name, branch, students: studentIds }, { headers: { Authorization: `Bearer ${token}` } });
      setMessage("Class created successfully");
      fetchAll();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to create class");
    }
  };

  // Delete class
  const handleDeleteClass = async (id) => {
    try {
      await axios.delete(`/api/admin/classes/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setMessage("Class deleted successfully");
      fetchAll();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to delete class");
    }
  };

  // Assign subject to teacher
  const handleAssignSubject = async (subjectId, teacherId) => {
    try {
      await axios.post("/api/admin/assign-subject", { subjectId, teacherId }, { headers: { Authorization: `Bearer ${token}` } });
      setMessage("Subject assigned to teacher");
      fetchAll();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to assign subject");
    }
  };

  // Unassign subject from teacher
  const handleUnassignSubject = async (subjectId, teacherId) => {
    try {
      await axios.post("/api/admin/unassign-subject", { subjectId, teacherId }, { headers: { Authorization: `Bearer ${token}` } });
      setMessage("Subject unassigned from teacher");
      fetchAll();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to unassign subject");
    }
  };

  // Attendance report by date range
  const fetchAttendanceReport = async (startDate, endDate, subjectId, classId) => {
    try {
      const res = await axios.get(`/api/admin/reports/attendance?startDate=${startDate}&endDate=${endDate}&subjectId=${subjectId}&classId=${classId}`, { headers: { Authorization: `Bearer ${token}` } });
      setAttendanceReport(res.data);
      setMessage("");
    } catch (err) {
      setMessage("Failed to fetch attendance report");
    }
  };

  // Low attendance students
  const fetchLowAttendance = async (threshold, subjectId) => {
    try {
      const res = await axios.get(`/api/admin/reports/low-attendance?threshold=${threshold}&subjectId=${subjectId}`, { headers: { Authorization: `Bearer ${token}` } });
      setLowAttendance(res.data);
      setMessage("");
    } catch (err) {
      setMessage("Failed to fetch low attendance students");
    }
  };

  // Attendance summary by class
  const fetchClassSummary = async (classId) => {
    try {
      const res = await axios.get(`/api/admin/reports/class-summary?classId=${classId}`, { headers: { Authorization: `Bearer ${token}` } });
      setClassSummary(res.data);
      setMessage("");
    } catch (err) {
      setMessage("Failed to fetch class summary");
    }
  };

  // Auto-close alert
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="container mt-4">
      <h2>Admin Dashboard</h2>
      {/* Alert at top */}
      {message && (
        <div className={`alert alert-info alert-dismissible fade show`} role="alert" style={{ position: "sticky", top: 0, zIndex: 1000 }}>
          {message}
          <button type="button" className="btn-close" aria-label="Close" onClick={() => setMessage("")}></button>
        </div>
      )}

      {/* Tabs */}
      <ul className="nav nav-tabs mb-3">
        <li className="nav-item"><button className={`nav-link ${tab === "users" ? "active" : ""}`} onClick={() => setTab("users")}>Users</button></li>
        <li className="nav-item"><button className={`nav-link ${tab === "classes" ? "active" : ""}`} onClick={() => setTab("classes")}>Classes</button></li>
        <li className="nav-item"><button className={`nav-link ${tab === "assign" ? "active" : ""}`} onClick={() => setTab("assign")}>Assign Subjects</button></li>
        <li className="nav-item"><button className={`nav-link ${tab === "attendance" ? "active" : ""}`} onClick={() => setTab("attendance")}>Attendance Report</button></li>
        <li className="nav-item"><button className={`nav-link ${tab === "low" ? "active" : ""}`} onClick={() => setTab("low")}>Low Attendance</button></li>
        <li className="nav-item"><button className={`nav-link ${tab === "summary" ? "active" : ""}`} onClick={() => setTab("summary")}>Class Summary</button></li>
      </ul>

      {/* Users Tab */}
      {tab === "users" && (
        <section>
          <h4>All Users</h4>
          <table className="table table-bordered">
            <thead>
              <tr><th>Name</th><th>Email</th><th>Role</th><th>Action</th></tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u._id}>
                  <td>{u.name || "-"}</td>
                  <td>{u.email}</td>
                  <td>{u.role}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(u._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <h5>Create User</h5>

<form onSubmit={async (e) => {
  e.preventDefault();
  const role = e.target.role.value;
  const name = e.target.name.value;
  const email = e.target.email.value;
  const password = e.target.password.value;
  const branch = e.target.branch?.value;
  let payload = { role, name, email, password };

  if (role === "student") {
    payload.branch = branch;
    payload.enrollmentNumber = e.target.enrollmentNumber.value;
    payload.className = e.target.className.value;
  }
  if (role === "teacher") {
    // Do not send branch
  }
  await handleCreateUser(payload);
  e.target.reset();
}}>
  <div className="mb-3">
    <label className="form-label">Role</label>
    <select
      className="form-select"
      name="role"
      required
      value={createRole}
      onChange={e => setCreateRole(e.target.value)}
    >
      <option value="student">Student</option>
      <option value="teacher">Teacher</option>
      <option value="admin">Admin</option>
    </select>
  </div>
  <div className="mb-3">
    <label className="form-label">Name</label>
    <input type="text" className="form-control" name="name" required />
  </div>
  <div className="mb-3">
    <label className="form-label">Email</label>
    <input type="email" className="form-control" name="email" required />
  </div>
  <div className="mb-3">
    <label className="form-label">Password</label>
    <input type="password" className="form-control" name="password" required />
  </div>
  {/* Branch field: required for student, hidden for teacher */}
  {createRole === "student" && (
    <div className="mb-3">
      <label className="form-label">Branch</label>
      <input type="text" className="form-control" name="branch" required />
    </div>
  )}
  {createRole === "teacher" ? null : (
    createRole === "admin" && (
      <div className="mb-3">
        <label className="form-label">Branch (optional)</label>
        <input type="text" className="form-control" name="branch" />
      </div>
    )
  )}
  {createRole === "student" && (
    <>
      <div className="mb-3">
        <label className="form-label">Enrollment Number</label>
        <input type="text" className="form-control" name="enrollmentNumber" required />
      </div>
      <div className="mb-3">
        <label className="form-label">Class Name</label>
        <input type="text" className="form-control" name="className" required />
      </div>
    </>
  )}
  <button type="submit" className="btn btn-primary">Create User</button>
</form>
        
          {/* Add create user form here */}
        </section>
      )}

      {/* Classes Tab */}
      {tab === "classes" && (
        <section>
          <h4>All Classes</h4>
          <table className="table table-bordered">
            <thead>
              <tr><th>Name</th><th>Branch</th><th>Students</th><th>Action</th></tr>
            </thead>
            <tbody>
              {classes.map(c => (
                <tr key={c._id}>
                  <td>{c.name}</td>
                  <td>{c.branch}</td>
                  <td>{c.students?.length || 0}</td>
                  <td>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteClass(c._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <h5>Create Class</h5>
          <form onSubmit={(e) => {
            e.preventDefault();
            const name = e.target.name.value;
            const branch = e.target.branch.value;
            const studentIds = Array.from(e.target.students.selectedOptions).map(o => o.value);
            handleCreateClass(name, branch, studentIds);
          }}>
            <div className="mb-3">
              <label className="form-label">Class Name</label>
              <input type="text" className="form-control" name="name" required />
            </div>
            <div className="mb-3">
              <label className="form-label">Branch</label>
              <input type="text" className="form-control" name="branch" required />
            </div>
            <div className="mb-3">
              <label className="form-label">Students</label>
              <select className="form-select" name="students" multiple required>
                {students.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <button type="submit" className="btn btn-primary">Create Class</button>
          </form>

          {/* Add create class form here */}
        </section>
      )}

      {/* Assign Subjects Tab */}
      {tab === "assign" && (
        <section>
          <h4>Assign/Unassign Subject to Teacher</h4>
          <div className="row mb-3">
            <div className="col-md-4">
              <select className="form-select" id="subjectSelect">
                <option value="">Select Subject</option>
                {subjects.map(s => <option key={s._id} value={s._id}>{s.name} ({s.code})</option>)}
              </select>
            </div>
            <div className="col-md-4">
              <select className="form-select" id="teacherSelect">
                <option value="">Select Teacher</option>
                {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>
            <div className="col-md-4">
              <button className="btn btn-success" onClick={() => {
                const subjectId = document.getElementById("subjectSelect").value;
                const teacherId = document.getElementById("teacherSelect").value;
                handleAssignSubject(subjectId, teacherId);
              }}>Assign</button>
              <button className="btn btn-warning ms-2" onClick={() => {
                const subjectId = document.getElementById("subjectSelect").value;
                const teacherId = document.getElementById("teacherSelect").value;
                handleUnassignSubject(subjectId, teacherId);
              }}>Unassign</button>
            </div>
          </div>
        </section>
      )}

      {/* Attendance Report Tab */}
      {tab === "attendance" && (
        <section>
          <h4>Attendance Report</h4>
          <div className="row mb-3">
            <div className="col-md-3">
              <input type="date" className="form-control" id="startDate" />
            </div>
            <div className="col-md-3">
              <input type="date" className="form-control" id="endDate" />
            </div>
            <div className="col-md-3">
              <select className="form-select" id="subjectReportSelect">
                <option value="">Subject</option>
                {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <select className="form-select" id="classReportSelect">
                <option value="">Class</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <button className="btn btn-info mb-3" onClick={() => {
            const startDate = document.getElementById("startDate").value;
            const endDate = document.getElementById("endDate").value;
            const subjectId = document.getElementById("subjectReportSelect").value;
            const classId = document.getElementById("classReportSelect").value;
            fetchAttendanceReport(startDate, endDate, subjectId, classId);
          }}>Fetch Report</button>
          <table className="table table-bordered">
            <thead>
              <tr><th>Date</th><th>Student</th><th>Subject</th><th>Status</th></tr>
            </thead>
            <tbody>
              {attendanceReport.map((r, idx) => (
                <tr key={idx}>
                  <td>{r.date}</td>
                  <td>{r.student?.name}</td>
                  <td>{r.subject?.name}</td>
                  <td>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Low Attendance Tab */}
      {tab === "low" && (
        <section>
          <h4>Low Attendance Students</h4>
          <div className="row mb-3">
            <div className="col-md-3">
              <input type="number" className="form-control" id="threshold" placeholder="Threshold %" defaultValue={75} />
            </div>
            <div className="col-md-3">
              <select className="form-select" id="subjectLowSelect">
                <option value="">Subject</option>
                {subjects.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <button className="btn btn-info" onClick={() => {
                const threshold = document.getElementById("threshold").value;
                const subjectId = document.getElementById("subjectLowSelect").value;
                fetchLowAttendance(threshold, subjectId);
              }}>Fetch Low Attendance</button>
            </div>
          </div>
          <table className="table table-bordered">
            <thead>
              <tr><th>Student</th><th>Subject</th><th>Present</th><th>Total</th><th>%</th></tr>
            </thead>
            <tbody>
              {lowAttendance.map((r, idx) => (
                <tr key={idx}>
                  <td>{r.student?.name}</td>
                  <td>{r.subject?.name}</td>
                  <td>{r.presentClasses}</td>
                  <td>{r.totalClasses}</td>
                  <td>{r.attendancePercentage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* Class Summary Tab */}
      {tab === "summary" && (
        <section>
          <h4>Attendance Summary by Class</h4>
          <div className="row mb-3">
            <div className="col-md-3">
              <select className="form-select" id="classSummarySelect">
                <option value="">Class</option>
                {classes.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
              </select>
            </div>
            <div className="col-md-3">
              <button className="btn btn-info" onClick={() => {
                const classId = document.getElementById("classSummarySelect").value;
                fetchClassSummary(classId);
              }}>Fetch Summary</button>
            </div>
          </div>
          <table className="table table-bordered">
            <thead>
              <tr><th>Subject</th><th>Present</th><th>Absent</th><th>Total</th><th>%</th></tr>
            </thead>
            <tbody>
              {classSummary.map((r, idx) => (
                <tr key={idx}>
                  <td>{r.subject?.name}</td>
                  <td>{r.presentCount}</td>
                  <td>{r.absentCount}</td>
                  <td>{r.totalClasses}</td>
                  <td>{r.attendancePercentage}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}
    </div>
  );
};

export default AdminDashboard;