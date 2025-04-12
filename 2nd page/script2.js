document.addEventListener("DOMContentLoaded", function () {
  const role = localStorage.getItem("role") || "teacher"; // Default role

  if (role === "student") {
    showStudentDashboard();
  } else {
    showTeacherDashboard();
  }

  document.getElementById("attendance-form")?.addEventListener("submit", function (e) {
    e.preventDefault();
    const name = document.getElementById("student-name").value;
    const status = document.getElementById("attendance-status").value;

    totalClasses++;
    if (status === "Present") presentCount++;

    const record = document.createElement("p");
    record.textContent = `${name} - ${status}`;
    document.getElementById("marked-attendance").appendChild(record);

    updateAttendanceStats();
    this.reset();
  });
});

function showTeacherDashboard() {
  document.getElementById("teacher-panel").classList.remove("hidden");
  document.getElementById("student-panel").classList.add("hidden");
  localStorage.setItem("role", "teacher");
}

function showStudentDashboard() {
  document.getElementById("student-panel").classList.remove("hidden");
  document.getElementById("teacher-panel").classList.add("hidden");
  localStorage.setItem("role", "student");
}

let totalClasses = 0;
let presentCount = 0;

function updateAttendanceStats() {
  document.getElementById("total-classes").textContent = totalClasses;
  document.getElementById("present-count").textContent = presentCount;
  const percentage = totalClasses > 0 ? ((presentCount / totalClasses) * 100).toFixed(2) : 0;
  document.getElementById("attendance-percentage").textContent = `${percentage}%`;
}