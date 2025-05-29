const express = require('express');
const router = express.Router();
const {jwtAuthMiddleware}=require('./../jwt.js')
const Attendance = require('../Models/Attendance');
const Subject = require('../Models/Subject');
const Teacher = require('../Models/Teacher.js');

// Mark attendance
router.post('/mark-attendance', jwtAuthMiddleware, async (req, res) => {
  const { subjectId, date, attendanceList } = req.body;
  try {
    for (const record of attendanceList) {
      const { studentId, status } = record;
      await Attendance.findOneAndUpdate(
        { student: studentId, subject: subjectId, date },
        { student: studentId, subject: subjectId, date, status },
        { upsert: true, new: true }
      );
    }
    res.json({ message: 'Attendance marked successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark attendance' });
  }
});

router.get("/subjects", jwtAuthMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;

    const teacher = await Teacher.findOne({ user: userId });
    if (!teacher) {
      return res.status(404).json({ error: "Teacher not found" });
    }
    const subjects = await Subject.find({ teacher: teacher._id });

    res.json(subjects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Failed to fetch subjects" });
  }
});


// GET attendance records by subjectId (restricted to logged-in teacher)
router.get('/subject/:subjectId', jwtAuthMiddleware, async (req, res) => {
  const { subjectId } = req.params;
  const teacherId = req.user.id;

  try {
    // Ensure the subject belongs to the logged-in teacher
    const subject = await Subject.findOne({ _id: subjectId, teacher: teacherId });

    if (!subject) {
      return res.status(403).json({ error: 'Access denied or subject not found' });
    }

    // Fetch attendance for the subject
    const records = await Attendance.find({ subject: subjectId })
      .populate('student', 'name rollNumber') // optional: get student details
      .sort({ date: -1 });

    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch attendance records' });
  }
});


module.exports = router;