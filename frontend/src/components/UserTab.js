import React, { useState } from "react";
import axios from "axios";
axios.defaults.baseURL = process.env.REACT_APP_BACKEND_URL;

const UsersTab = ({ users, setMessage, fetchAll, token }) => {
const [searchTerm, setSearchTerm] = useState("");
const [editUser, setEditUser] = useState(null);
const [createRole, setCreateRole] = useState("student");

  const handleDeleteUser = async (id) => {
    try {
      await axios.delete(`/api/admin/users/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      setMessage("User deleted successfully");
      fetchAll();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to delete user");
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

  return (
    <section>
      {/* Search & Table */}
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
                              <button className="btn btn-warning btn-sm me-2" onClick={() => setEditUser(u)}>Edit</button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleDeleteUser(u._id)}>Delete</button>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  {users.filter(u => u.name?.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                    <div className="text-muted">No users found.</div>
                  )}
                </div>
              </div>
            </div>
          </div>

      {/* Create User Form */}
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

      {/* Edit User Modal */}
          {editUser && (
            <div className="modal show" style={{ display: "block", background: "rgba(0,0,0,0.2)" }}>
              <div className="modal-dialog">
                <div className="modal-content">
                  <form onSubmit={async (e) => {
                    e.preventDefault();
                    const name = e.target.name.value;
                    const email = e.target.email.value;
                    const branch = e.target.branch?.value;
                    let payload = { name, email };
                    if (editUser.role === "student") payload.branch = branch;
                    try {
                      await axios.put(`/api/admin/users/${editUser._id}`, payload, { headers: { Authorization: `Bearer ${token}` } });
                      setMessage("User updated successfully");
                      setEditUser(null);
                      fetchAll();
                    } catch (err) {
                      setMessage(err.response?.data?.error || "Failed to update user");
                    }
                  }}>
                    <div className="modal-header">
                      <h5 className="modal-title">Edit User</h5>
                      <button type="button" className="btn-close" onClick={() => setEditUser(null)}></button>
                    </div>
                    <div className="modal-body">
                      <div className="mb-3">
                        <label className="form-label">Name</label>
                        <input type="text" className="form-control" name="name" defaultValue={editUser.name} required />
                      </div>
                      <div className="mb-3">
                        <label className="form-label">Email</label>
                        <input type="email" className="form-control" name="email" defaultValue={editUser.email} required />
                      </div>
                      {editUser.role === "student" && (
                        <div className="mb-3">
                          <label className="form-label">Branch</label>
                          <input type="text" className="form-control" name="branch" defaultValue={editUser.branch} required />
                        </div>
                      )}
                    </div>
                    <div className="modal-footer">
                      <button type="submit" className="btn btn-primary">Save Changes</button>
                      <button type="button" className="btn btn-secondary" onClick={() => setEditUser(null)}>Cancel</button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          )}
    </section>
  );
};

export default UsersTab;
