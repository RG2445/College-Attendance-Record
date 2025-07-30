const express = require("express");
const cors = require("cors");
require("dotenv").config();
const db = require("./db");

const authRoutes = require("./Routes/auth");
const studentRoutes = require("./Routes/student");
const teacherRoutes = require("./Routes/teacher");
const adminRoutes = require("./Routes/admin");
const attendanceRoutes = require("./Routes/attendance");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/attendance", attendanceRoutes);

app.listen(5000, () => {
  console.log(`Server running on port 5000`);
});
