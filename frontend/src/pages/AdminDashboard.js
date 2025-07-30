import React, { useEffect, useState } from "react";

const AdminDashboard = () => {
  const [stats, setStats] = useState({});
  const [users, setUsers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [students, setStudents] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [form, setForm] = useState({
    email: "",
    password: "",
    role: "student",
  });
  const [classForm, setClassForm] = useState({ name: "", branch: "" });
  const [subjectForm, setSubjectForm] = useState({
    name: "",
    code: "",
    teacher: "",
  });
  const token = localStorage.getItem("token");

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };

  const fetchAll = async () => {
    const [statRes, userRes, classRes, subjectRes, teacherRes] =
      await Promise.all([
        fetch("http://localhost:5000/api/admin/stats", { headers }),
        fetch("http://localhost:5000/api/admin/users", { headers }),
        fetch("http://localhost:5000/api/admin/classes", { headers }),
        fetch("http://localhost:5000/api/admin/subjects", { headers }),
        fetch("http://localhost:5000/api/admin/teachers", { headers })
      ]);

    const [statData, userData, classData, subjectData, teacherData] =
      await Promise.all([
        statRes.json(),
        userRes.json(),
        classRes.json(),
        subjectRes.json(),
        teacherRes.json()
      ]);

    setStats(statData);
    setUsers(userData);
    setClasses(classData);
    setSubjects(subjectData);
    setTeachers(teacherData); // from Teacher model
    setStudents(userData.filter((u) => u.role === "student"));
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleUserCreate = async () => {
    const res = await fetch("http://localhost:5000/api/admin/users", {
      method: "POST",
      headers,
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      alert("User created successfully");
      setForm({ email: "", password: "", role: "student" });
      fetchAll();
    } else alert(data.error);
  };

  const handleDeleteUser = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    await fetch(`http://localhost:5000/api/admin/users/${id}`, {
      method: "DELETE",
      headers,
    });
    fetchAll();
  };

  const handleCreateClass = async () => {
    const res = await fetch("http://localhost:5000/api/admin/classes", {
      method: "POST",
      headers,
      body: JSON.stringify(classForm),
    });
    if (res.ok) {
      alert("Class created successfully");
      setClassForm({ name: "", branch: "" });
      fetchAll();
    }
  };

  const handleDeleteClass = async (id) => {
    await fetch(`http://localhost:5000/api/admin/classes/${id}`, {
      method: "DELETE",
      headers,
    });
    fetchAll();
  };

  const handleAssignSubject = async () => {
    const res = await fetch("http://localhost:5000/api/admin/assign-subject", {
      method: "POST",
      headers,
      body: JSON.stringify({
        subjectId: subjectForm.code,
        teacherId: subjectForm.teacher,
      }),
    });
    if (res.ok) {
      alert("Subject assigned");
      setSubjectForm({ name: "", code: "", teacher: "" });
      fetchAll();
    }
  };

  const handleUnassignSubject = async () => {
    await fetch("http://localhost:5000/api/admin/unassign-subject", {
      method: "POST",
      headers,
      body: JSON.stringify({
        subjectId: subjectForm.code,
        teacherId: subjectForm.teacher,
      }),
    });
    alert("Subject unassigned");
    fetchAll();
  };

  return (
    <div className="container mt-4">
      <h2 className="text-center mb-4">📊 Admin Dashboard</h2>

      <div className="row text-center mb-4">
        <div className="col-md-2">👨‍🎓 Students: {stats.students}</div>
        <div className="col-md-2">👩‍🏫 Teachers: {stats.teachers}</div>
        <div className="col-md-2">🏫 Classes: {stats.classes}</div>
        <div className="col-md-2">📚 Subjects: {stats.subjects}</div>
        <div className="col-md-4">
          📅 Today Attendance: {stats.todayAttendance}
        </div>
      </div>

      <div className="row">
        <div className="col-md-4">
          <h5>Create User</h5>
          <input
            type="email"
            className="form-control mb-2"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            type="password"
            className="form-control mb-2"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <select
            className="form-select mb-2"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="student">Student</option>
            <option value="teacher">Teacher</option>
          </select>
          <button className="btn btn-success w-100" onClick={handleUserCreate}>
            Create
          </button>
        </div>

        <div className="col-md-4">
          <h5>Create Class</h5>
          <input
            className="form-control mb-2"
            placeholder="Class Name"
            value={classForm.name}
            onChange={(e) =>
              setClassForm({ ...classForm, name: e.target.value })
            }
          />
          <input
            className="form-control mb-2"
            placeholder="Branch"
            value={classForm.branch}
            onChange={(e) =>
              setClassForm({ ...classForm, branch: e.target.value })
            }
          />
          <button className="btn btn-primary w-100" onClick={handleCreateClass}>
            Create
          </button>
        </div>

        <div className="col-md-4">
          <h5>Assign Subject</h5>
          <select
            className="form-select mb-2"
            value={subjectForm.code}
            onChange={(e) =>
              setSubjectForm({ ...subjectForm, code: e.target.value })
            }
          >
            <option value="">Select Subject</option>
            {subjects.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
          <select
            className="form-select mb-2"
            value={subjectForm.teacher}
            onChange={(e) =>
              setSubjectForm({ ...subjectForm, teacher: e.target.value })
            }
          >
            <option value="">Select Teacher</option>
            {teachers.map((t) => (
              <option key={t._id} value={t._id}>
                {t.name || t.user?.email}
              </option>
            ))}
          </select>

          <div className="d-flex gap-2">
            <button
              className="btn btn-success w-50"
              onClick={handleAssignSubject}
            >
              Assign
            </button>
            <button
              className="btn btn-danger w-50"
              onClick={handleUnassignSubject}
            >
              Unassign
            </button>
          </div>
        </div>
      </div>

      <hr />

      <h5>All Users</h5>
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Email</th>
            <th>Role</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {users.map((u) => (
            <tr key={u._id}>
              <td>{u.email}</td>
              <td>{u.role}</td>
              <td>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDeleteUser(u._id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h5>All Classes</h5>
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Class Name</th>
            <th>Branch</th>
            <th>Students</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {classes.map((cls) => (
            <tr key={cls._id}>
              <td>{cls.name}</td>
              <td>{cls.branch}</td>
              <td>{cls.students?.length || 0}</td>
              <td>
                <button
                  className="btn btn-sm btn-danger"
                  onClick={() => handleDeleteClass(cls._id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default AdminDashboard;
