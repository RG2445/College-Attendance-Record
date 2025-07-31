import React from "react";
import axios from "axios";
axios.defaults.baseURL = "http://localhost:5000";

const AssignTab = ({ subjects, teachers, setMessage, fetchAll, token }) => {
  const handleAssignSubject = async (subjectId, teacherId) => {
    try {
      await axios.post("/api/admin/assign", { subjectId, teacherId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage("Subject assigned successfully");
      fetchAll();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to assign subject");
    }
  };

  const handleUnassignSubject = async (subjectId, teacherId) => {
    try {
      await axios.post("/api/admin/unassign", { subjectId, teacherId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setMessage("Subject unassigned successfully");
      fetchAll();
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to unassign subject");
    }
  };

  return (
    <section>
      <h4>Assign / Unassign Subject to Teacher</h4>
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
  );
};

export default AssignTab;
