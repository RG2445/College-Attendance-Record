import React, { useState } from "react";
import axios from "axios";
axios.defaults.baseURL = process.env.REACT_APP_BACKEND_URL;

const SubjectsTab = ({ subjects, teachers, setMessage, fetchAll, token }) => {
  const [editSubject, setEditSubject] = useState(null);

  const handleCreateSubject = async (name, code, teacherId) => {
    try {
      await axios.post("/api/admin/subjects", { name, code, teacher: teacherId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage("Subject created successfully");
      fetchAll();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to create subject");
    }
  };

  const handleDeleteSubject = async (id) => {
    try {
      await axios.delete(`/api/admin/subjects/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage("Subject deleted successfully");
      fetchAll();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to delete subject");
    }
  };

  const handleEditSubject = async (e) => {
    e.preventDefault();
    try {
      await axios.put(`/api/admin/subjects/${editSubject._id}`, {
        name: e.target.name.value,
        code: e.target.code.value,
        teacher: e.target.teacher.value || null
      }, { headers: { Authorization: `Bearer ${token}` } });
      setMessage("Subject updated successfully");
      setEditSubject(null);
      fetchAll();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to update subject");
    }
  };

  return (
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
  );
};

export default SubjectsTab;
