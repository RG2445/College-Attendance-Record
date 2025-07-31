import React, { useEffect, useState } from "react";
import axios from "axios";
import UsersTab from "../components/UserTab";
import ClassesTab from "../components/ClassTab";
import AssignTab from "../components/AssignTab";
import SubjectsTab from "../components/SubjectTab";
axios.defaults.baseURL = "http://localhost:5000";

const AdminDashboard = () => {
  const [users, setUsers] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [classes, setClasses] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState("users");

  const token = localStorage.getItem("token");

  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line
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

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(""), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  return (
    <div className="container mt-4">
      <h2>Admin Dashboard</h2>
      {message && (
        <div className={`alert alert-info alert-dismissible fade show`} role="alert" style={{ position: "sticky", top: 0, zIndex: 1000 }}>
          {message}
          <button type="button" className="btn-close" aria-label="Close" onClick={() => setMessage("")}></button>
        </div>
      )}

      <ul className="nav nav-tabs mb-3">
        <li className="nav-item"><button className={`nav-link ${tab === "users" ? "active" : ""}`} onClick={() => setTab("users")}>Users</button></li>
        <li className="nav-item"><button className={`nav-link ${tab === "classes" ? "active" : ""}`} onClick={() => setTab("classes")}>Classes</button></li>
        <li className="nav-item"><button className={`nav-link ${tab === "assign" ? "active" : ""}`} onClick={() => setTab("assign")}>Assign Subjects</button></li>
        <li className="nav-item"><button className={`nav-link ${tab === "subjects" ? "active" : ""}`} onClick={() => setTab("subjects")}>Subjects</button></li>
      </ul>

      {tab === "users" && (
        <UsersTab users={users} setMessage={setMessage} fetchAll={fetchAll} token={token} />
      )}
      {tab === "classes" && (
        <ClassesTab
          classes={classes}
          subjects={subjects}
          setMessage={setMessage}
          fetchAll={fetchAll}
          token={token}
        />
      )}
      {tab === "assign" && (
        <AssignTab
          subjects={subjects}
          teachers={teachers}
          setMessage={setMessage}
          fetchAll={fetchAll}
          token={token}
        />
      )}
      {tab === "subjects" && (
        <SubjectsTab
          subjects={subjects}
          teachers={teachers}
          setMessage={setMessage}
          fetchAll={fetchAll}
          token={token}
        />
      )}
    </div>
  );
};

export default AdminDashboard;