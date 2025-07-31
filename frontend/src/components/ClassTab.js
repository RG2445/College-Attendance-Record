import React, { useState } from "react";
import axios from "axios";
axios.defaults.baseURL = "http://localhost:5000";

const ClassesTab = ({ classes, subjects, setMessage, fetchAll, token }) => {
  const [selectedSubjects, setSelectedSubjects] = useState([]);
  const [editClass, setEditClass] = useState(null);
  const [editClassSubjects, setEditClassSubjects] = useState([]);

  const handleCreateClass = async (name, branch, subjectsArr) => {
    try {
      await axios.post("/api/admin/classes", { name, branch, subjects: subjectsArr }, { headers: { Authorization: `Bearer ${token}` } });
      setMessage("Class created successfully");
      setSelectedSubjects([]);
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

  const handleEditClass = async (e) => {
    e.preventDefault();
    const name = e.target.name.value;
    const branch = e.target.branch.value;
    try {
      await axios.put(`/api/admin/classes/${editClass._id}`, {
        name,
        branch,
        subjects: editClassSubjects
      }, { headers: { Authorization: `Bearer ${token}` } });
      setMessage("Class updated successfully");
      setEditClass(null);
      fetchAll();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to update class");
    }
  };

  return (
    <section>
      <h4>All Classes</h4>
      <table className="table table-bordered">
        <thead>
          <tr>
            <th>Name</th>
            <th>Branch</th>
            <th>Students</th>
            <th>Subjects</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {classes.map(c => (
            <tr key={c._id}>
              <td>{c.name}</td>
              <td>{c.branch}</td>
              <td>{c.students?.length || 0}</td>
              <td>
                {(c.subjects && c.subjects.length > 0)
                  ? c.subjects.map(s => s.code || s).join(', ')
                  : <span className="text-muted">No subjects</span>}
              </td>
              <td>
                <button className="btn btn-warning btn-sm me-2" onClick={() => {
                  setEditClass(c);
                  setEditClassSubjects(c.subjects.map(s => s._id));
                }}>Edit</button>
                <button className="btn btn-danger btn-sm" onClick={() => handleDeleteClass(c._id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <h5>Create Class</h5>
      <form onSubmit={e => {
        e.preventDefault();
        const name = e.target.name.value;
        const branch = e.target.branch.value;
        handleCreateClass(name, branch, selectedSubjects);
        e.target.reset();
        setSelectedSubjects([]);
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
          <label className="form-label">Assign Subjects</label>
          <select
            multiple
            className="form-select"
            value={selectedSubjects}
            onChange={e => {
              const options = Array.from(e.target.selectedOptions).map(opt => opt.value);
              setSelectedSubjects(options);
            }}
          >
            {subjects.map(s => (
              <option key={s._id} value={s._id}>
                {s.name} ({s.code})
              </option>
            ))}
          </select>
          <small className="text-muted">Hold Ctrl (Windows) or Cmd (Mac) to select multiple subjects.</small>
        </div>
        <button type="submit" className="btn btn-primary">Create Class</button>
      </form>
      {editClass && (
        <div className="modal show" style={{ display: "block", background: "rgba(0,0,0,0.2)" }}>
          <div className="modal-dialog">
            <div className="modal-content">
              <form onSubmit={handleEditClass}>
                <div className="modal-header">
                  <h5 className="modal-title">Edit Class</h5>
                  <button type="button" className="btn-close" onClick={() => setEditClass(null)}></button>
                </div>
                <div className="modal-body">
                  <div className="mb-3">
                    <label className="form-label">Class Name</label>
                    <input type="text" className="form-control" name="name" defaultValue={editClass.name} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Branch</label>
                    <input type="text" className="form-control" name="branch" defaultValue={editClass.branch} required />
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Assign Subjects</label>
                    <select
                      multiple
                      className="form-select"
                      value={editClassSubjects}
                      onChange={e => {
                        const options = Array.from(e.target.selectedOptions).map(opt => opt.value);
                        setEditClassSubjects(options);
                      }}
                    >
                      {subjects.map(s => (
                        <option key={s._id} value={s._id}>
                          {s.name} ({s.code})
                        </option>
                      ))}
                    </select>
                    <small className="text-muted">Hold Ctrl (Windows) or Cmd (Mac) to select multiple subjects.</small>
                  </div>
                </div>
                <div className="modal-footer">
                  <button type="submit" className="btn btn-primary">Save Changes</button>
                  <button type="button" className="btn btn-secondary" onClick={() => setEditClass(null)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default ClassesTab;