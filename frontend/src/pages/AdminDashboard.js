import React, { useEffect, useState } from "react";
import axios from "axios";
axios.defaults.baseURL = "http://localhost:5000";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [message, setMessage] = useState("");
  const [createRole, setCreateRole] = useState("student");
  const [tab, setTab] = useState("users");
  const [editSubject, setEditSubject] = useState(null);

  const token = localStorage.getItem("token");

  // Fetch all data on mount
  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    try {
      const [usersRes, teachersRes, classesRes, subjectsRes] = await Promise.all([
        axios.get("/api/admin/users", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/api/admin/teachers", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/api/admin/classes", { headers: { Authorization: `Bearer ${token}` } }),
        axios.get("/api/admin/subjects", { headers: { Authorization: `Bearer ${token}` } }),
      ]);
      setUsers(usersRes.data);
      setTeachers(teachersRes.data);
      setClasses(classesRes.data);
      setSubjects(subjectsRes.data);
    } catch {
      setMessage("Failed to fetch initial data");
    }
  };

  // User CRUD
  const handleCreateUser = async (payload) => {
    try {
      await axios.post("/api/admin/users", payload, { headers: { Authorization: `Bearer ${token}` } });
      setMessage("User created successfully");
      fetchAll();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to create user");
    }
  };

  const handleDeleteUser = async (id) => {
    try {
      await axios.delete(`/api/admin/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setMessage("User deleted successfully");
      fetchAll();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to delete user");
    }
  };

  // Class CRUD
  const handleCreateClass = async (name, branch) => {
    try {
      await axios.post("/api/admin/classes", { name, branch }, { headers: { Authorization: `Bearer ${token}` } });
      setMessage("Class created successfully");
      fetchAll();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to create class");
    }
  };

  const handleDeleteClass = async (id) => {
    try {
      await axios.delete(`/api/admin/classes/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setMessage("Class deleted successfully");
      fetchAll();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to delete class");
    }
  };

  // Subject CRUD
  const handleCreateSubject = async (name, code, teacherId) => {
    try {
      await axios.post("/api/admin/subjects", { name, code, teacher: teacherId }, { headers: { Authorization: `Bearer ${token}` } });
      setMessage("Subject created successfully");
      fetchAll();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to create subject");
    }
  };

  const handleDeleteSubject = async (id) => {
    try {
      await axios.delete(`/api/admin/subjects/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setMessage("Subject deleted successfully");
      fetchAll();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to delete subject");
    }
  };

  const handleEditSubject = async (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    const code = e.target.code.value;
    const teacher = e.target.teacher.value;
    try {
      await axios.put(`/api/admin/subjects/${editSubject._id}`, { name, code, teacher }, { headers: { Authorization: `Bearer ${token}` } });
      setMessage("Subject updated successfully");
      setEditSubject(null);
      fetchAll();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to update subject");
    }
  };

  // Assign/Unassign subject to teacher
  const handleAssignSubject = async (subjectId, teacherId) => {
    try {
      await axios.post("/api/admin/assign-subject", { subjectId, teacherId }, { headers: { Authorization: `Bearer ${token}` } });
      setMessage("Subject assigned to teacher");
      fetchAll();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to assign subject");
    }
  };

  const handleUnassignSubject = async (subjectId, teacherId) => {
    try {
      await axios.post("/api/admin/unassign-subject", { subjectId, teacherId }, { headers: { Authorization: `Bearer ${token}` } });
      setMessage("Subject unassigned from teacher");
      fetchAll();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to unassign subject");
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
        <li className="nav-item"><button className={`nav-link ${tab === "subjects" ? "active" : ""}`} onClick={() => setTab("subjects")}>Subjects</button></li>
      </ul>

      {/* Users Tab */}
      {tab === "users" && (
        <section>
          <h5>Search Users</h5>
          <input
            type="text"
            className="form-control mb-2"
            placeholder="Search by name"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />

          <div className="accordion" id="usersAccordion">
            <div className="accordion-item">
              <h2 className="accordion-header" id="usersHeading">
                <button className="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#usersCollapse" aria-expanded="false" aria-controls="usersCollapse">
                  View All Users
                </button>
              </h2>
              <div id="usersCollapse" className="accordion-collapse collapse" aria-labelledby="usersHeading" data-bs-parent="#usersAccordion">
                <div className="accordion-body">
                  <table className="table table-bordered">
                    <thead>
                      <tr><th>Name</th><th>Email</th><th>Role</th><th>Action</th></tr>
                    </thead>
                    <tbody>
                      {users
                        .filter(u => u.name?.toLowerCase().includes(searchTerm.toLowerCase()))
                        .map(u => (
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
                </div>
              </div>
            </div>
          </div>

          <h5 className="mt-4">Create User</h5>
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
            handleCreateClass(name, branch);
            e.target.reset();
          }}>
            <div className="mb-3">
              <label className="form-label">Class Name</label>
              <input type="text" className="form-control" name="name" required />
            </div>
            <div className="mb-3">
              <label className="form-label">Branch</label>
              <input type="text" className="form-control" name="branch" required />
            </div>
            <button type="submit" className="btn btn-primary">Create Class</button>
          </form>
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

      {/* Subjects Tab */}
      {tab === "subjects" && (
        <section>
          <h4>All Subjects</h4>
          <table className="table table-bordered">
            <thead>
              <tr><th>Name</th><th>Code</th><th>Teacher</th><th>Action</th></tr>
            </thead>
            <tbody>
              {subjects.map(s => (
                <tr key={s._id}>
                  <td>{s.name}</td>
                  <td>{s.code}</td>
                  <td>{s.teacher?.name || "-"}</td>
                  <td>
                    <button className="btn btn-warning btn-sm me-2" onClick={() => setEditSubject(s)}>Edit</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDeleteSubject(s._id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <h5>Create Subject</h5>
          <form onSubmit={(e) => {
            e.preventDefault();
            const name = e.target.name.value;
            const code = e.target.code.value;
            const teacherId = e.target.teacher.value;
            handleCreateSubject(name, code, teacherId);
            e.target.reset();
          }}>
            <div className="mb-3">
              <label className="form-label">Subject Name</label>
              <input type="text" className="form-control" name="name" required />
            </div>
            <div className="mb-3">
              <label className="form-label">Subject Code</label>
              <input type="text" className="form-control" name="code" required />
            </div>
            <div className="mb-3">
              <label className="form-label">Assign Teacher (optional)</label>
              <select className="form-select" name="teacher">
                <option value="">None</option>
                {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
              </select>
            </div>
            <button type="submit" className="btn btn-primary">Create Subject</button>
          </form>

          {/* Edit Subject Modal */}
          {editSubject && (
            <div className="modal show" style={{ display: "block", background: "rgba(0,0,0,0.2)" }}>
              <div className="modal-dialog">
                <div className="modal-content">
                  <form onSubmit={handleEditSubject}>
                    <div className="modal-header">
                      <h5 className="modal-title">Edit Subject</h5>
                      <button type="button" className="btn-close" onClick={() => setEditSubject(null)}></button>
                    </div>
                    <div className="modal-body">
                      <div className="mb-3">
                        <label className="form-label">Subject Name</label>
                        <input type="text" className="form-control" name="name" defaultValue={editSubject.name} required />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Subject Code</label>
                        <input type="text" className="form-control" name="code" defaultValue={editSubject.code} required />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Assign Teacher (optional)</label>
                        <select className="form-select" name="teacher" defaultValue={editSubject.teacher?._id || ""}>
                          <option value="">None</option>
                          {teachers.map(t => <option key={t._id} value={t._id}>{t.name}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="modal-footer">
                      <button type="submit" className="btn btn-primary">Save Changes</button>
                      <button type="button" className="btn btn-secondary" onClick={() => setEditSubject(null)}>Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
};

export default AdminDashboard;