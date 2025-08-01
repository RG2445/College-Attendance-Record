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
const port = process.env.PORT || 5000;

const allowedOrigins = [process.env.CLIENT_URL,"http://localhost:3000"]; 

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
}));

app.use(express.urlencoded({ extended: true }));
app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/students", studentRoutes);
app.use("/api/teachers", teacherRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/attendance", attendanceRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
