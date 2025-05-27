const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./db");

const authRoutes = require("./Routes/auth");
const studentRoutes = require("./Routes/Student");
const teacherRoutes = require("./Routes/Teacher");
const adminRoutes = require("./Routes/admin");
const attendanceRoutes = require("./Routes/Attendance");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/attendance", attendanceRoutes);

const PORT = process.env.PORT || 5000;
app.listen(5000, () => {
  console.log(`Server running on port 5000`);
});
